// ─────────────────────────────────────────────────────────────────────────────
// ImportarRiesgosExcel.tsx
// Componente para importar riesgos operacionales desde un archivo Excel.
//
// USO: Agrega este botón/panel dentro de TabRiesgo, justo al lado de "Registrar riesgo":
//
//   import ImportarRiesgosExcel from './ImportarRiesgosExcel';
//   <ImportarRiesgosExcel idempresa={empresa.id} userId={user!.id} onImported={(n) => { loadRiesgos(); showToast(`✓ ${n} riesgo(s) importados`); }} />
//
// DEPENDENCIAS: SheetJS (xlsx) — instalar con: npm install xlsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

// ─── Types ─────────────────────────────────────────────────────────────────

interface RiesgoImportado {
    _key: string;           // id temporal para React
    categoria_nivel1: string;
    definicion: string;
    categoria_nivel2: string;
    descripcion: string;    // "Ejemplo (nivel 3)" — se usa como descripción del riesgo
    seleccion: boolean;     // si tenía 'X' en la columna SELECCIÓN
    probabilidad: number;
    impacto: number;
    incluidoEnImport: boolean; // si el usuario lo marcó para importar
}

interface Props {
    idempresa: number;
    userId: string;
    onImported: (count: number) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function cleanStr(v: unknown): string {
    if (v === null || v === undefined) return '';
    return String(v)
        .replace(/\s+/g, ' ')
        .replace(/\u00a0/g, ' ')  // non-breaking spaces
        .trim();
}

function getNivel(prob: number, imp: number): string {
    const score = prob * imp;
    if (score >= 16) return 'CRÍTICO';
    if (score >= 9) return 'ALTO';
    if (score >= 4) return 'MODERADO';
    return 'BAJO';
}

const NIVEL_COLORS: Record<string, { bg: string; color: string }> = {
    BAJO: { bg: '#dcfce7', color: '#15803d' },
    MODERADO: { bg: '#fef9c3', color: '#854d0e' },
    ALTO: { bg: '#fee2e2', color: '#b91c1c' },
    CRÍTICO: { bg: '#fce7f3', color: '#be185d' },
};

// ─── Parsear Excel ───────────────────────────────────────────────────────────
//
// El Excel tiene celdas combinadas (merged cells). SheetJS las expande con
// el valor solo en la primera celda y null en las demás.
// Necesitamos "rellenar hacia abajo" (forward-fill) las columnas A (nivel1),
// B (definicion), C (nivel2) para reconstruir los grupos.
//
function parsearExcel(file: File): Promise<RiesgoImportado[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const wb = XLSX.read(data, { type: 'array' });

                // Buscar la hoja "RIESGO OPERACIONAL" o la primera
                const sheetName =
                    wb.SheetNames.find(n => n.toUpperCase().includes('RIESGO')) ??
                    wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];

                // Convertir a array de arrays
                const rows: (string | null)[][] = XLSX.utils.sheet_to_json(ws, {
                    header: 1,
                    raw: false,
                    defval: null,
                }) as (string | null)[][];

                if (rows.length < 2) { resolve([]); return; }

                // Detectar fila de encabezados (primera fila con "categoría" o "nivel")
                let headerRow = 0;
                for (let i = 0; i < Math.min(5, rows.length); i++) {
                    const joined = rows[i].join(' ').toLowerCase();
                    if (joined.includes('categoría') || joined.includes('nivel') || joined.includes('definición')) {
                        headerRow = i;
                        break;
                    }
                }

                // Forward-fill columnas A (0), B (1), C (2)
                let lastNivel1 = '';
                let lastDefinicion = '';
                let lastNivel2 = '';
                const resultado: RiesgoImportado[] = [];

                for (let i = headerRow + 1; i < rows.length; i++) {
                    const row = rows[i];
                    const col0 = cleanStr(row[0]);
                    const col1 = cleanStr(row[1]);
                    const col2 = cleanStr(row[2]);
                    const col3 = cleanStr(row[3]);
                    const col4 = cleanStr(row[4]); // SELECCIÓN

                    if (col0) lastNivel1 = col0;
                    if (col1) lastDefinicion = col1;
                    if (col2) lastNivel2 = col2;

                    // Solo filas que tengan un ejemplo (nivel 3)
                    if (!col3) continue;
                    // Ignorar si no tenemos contexto (nivel 1 vacío = aún no empezó)
                    if (!lastNivel1) continue;

                    const isSelected = col4.toUpperCase() === 'X';

                    resultado.push({
                        _key: `${i}-${Math.random()}`,
                        categoria_nivel1: lastNivel1,
                        definicion: lastDefinicion,
                        categoria_nivel2: lastNivel2,
                        descripcion: col3,
                        seleccion: isSelected,
                        probabilidad: 2,
                        impacto: 2,
                        incluidoEnImport: isSelected, // pre-marcar los que tenían X
                    });
                }

                resolve(resultado);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Error leyendo el archivo'));
        reader.readAsArrayBuffer(file);
    });
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ImportarRiesgosExcel({ idempresa, userId, onImported }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview' | 'saving' | 'done'>('upload');
    const [riesgos, setRiesgos] = useState<RiesgoImportado[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [savedCount, setSavedCount] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [filter, setFilter] = useState<'todos' | 'seleccionados' | 'nivel1'>('todos');
    const [filterNivel1, setFilterNivel1] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        setParseError(null);
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setParseError('Solo se aceptan archivos .xlsx o .xls');
            return;
        }
        try {
            const parsed = await parsearExcel(file);
            if (parsed.length === 0) {
                setParseError('No se encontraron filas con datos en el archivo. Verifica que tenga la estructura correcta.');
                return;
            }
            setRiesgos(parsed);
            setStep('preview');
        } catch (err) {
            setParseError(`Error al procesar el archivo: ${(err as Error).message}`);
        }
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleGuardar = async () => {
        const seleccionados = riesgos.filter(r => r.incluidoEnImport);
        if (seleccionados.length === 0) return;

        setStep('saving');
        const inserts = seleccionados.map(r => ({
            idempresa,
            user: userId,
            categoria: r.categoria_nivel2 || r.categoria_nivel1,
            descripcion: `[${r.categoria_nivel1}] ${r.descripcion}`,
            probabilidad: r.probabilidad,
            impacto: r.impacto,
            estado: true,
        }));

        const { error } = await supabase.from('riesgo_operacional').insert(inserts);
        if (error) {
            setParseError(`Error al guardar: ${error.message}`);
            setStep('preview');
            return;
        }

        setSavedCount(seleccionados.length);
        setStep('done');
        onImported(seleccionados.length);
    };

    const handleClose = () => {
        setModalOpen(false);
        setStep('upload');
        setRiesgos([]);
        setParseError(null);
        setSavedCount(0);
        setFilter('todos');
        setFilterNivel1('');
    };

    const toggleRiesgo = (key: string) => {
        setRiesgos(prev => prev.map(r => r._key === key ? { ...r, incluidoEnImport: !r.incluidoEnImport } : r));
    };

    const updateProb = (key: string, v: number) => {
        setRiesgos(prev => prev.map(r => r._key === key ? { ...r, probabilidad: v } : r));
    };

    const updateImp = (key: string, v: number) => {
        setRiesgos(prev => prev.map(r => r._key === key ? { ...r, impacto: v } : r));
    };

    const selAll = () => setRiesgos(prev => prev.map(r => ({ ...r, incluidoEnImport: true })));
    const deselAll = () => setRiesgos(prev => prev.map(r => ({ ...r, incluidoEnImport: false })));
    const selSoloX = () => setRiesgos(prev => prev.map(r => ({ ...r, incluidoEnImport: r.seleccion })));

    const nivel1List = [...new Set(riesgos.map(r => r.categoria_nivel1))];
    const totalSeleccionados = riesgos.filter(r => r.incluidoEnImport).length;

    const filtered = riesgos.filter(r => {
        if (filter === 'seleccionados') return r.incluidoEnImport;
        if (filter === 'nivel1' && filterNivel1) return r.categoria_nivel1 === filterNivel1;
        return true;
    });

    return (
        <>
            {/* ── Botón trigger ── */}
            <button
                onClick={() => setModalOpen(true)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 16px', borderRadius: 8,
                    border: '1.5px solid #d1d5db',
                    background: 'white', color: '#374151',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#185FA5'; e.currentTarget.style.color = '#185FA5'; e.currentTarget.style.background = '#f0f7ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'white'; }}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Importar desde Excel
            </button>

            {/* ── Modal ── */}
            {modalOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
                        zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 16,
                    }}
                    onClick={e => { if (e.target === e.currentTarget && step !== 'saving') handleClose(); }}
                >
                    <div style={{
                        background: 'white', borderRadius: 16,
                        boxShadow: '0 24px 80px rgba(15,23,42,.22)',
                        width: '100%', maxWidth: step === 'preview' ? 900 : 540,
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '18px 24px 14px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                                    {step === 'upload' && '📥 Importar riesgos desde Excel'}
                                    {step === 'preview' && `📋 Vista previa · ${riesgos.length} eventos encontrados`}
                                    {step === 'saving' && '⏳ Guardando riesgos…'}
                                    {step === 'done' && '✅ Importación completada'}
                                </h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                                    {step === 'upload' && 'Sube el archivo Excel con la matriz de riesgos operacionales'}
                                    {step === 'preview' && `${totalSeleccionados} seleccionados para importar · Edita probabilidad e impacto antes de guardar`}
                                    {step === 'saving' && 'Por favor espera…'}
                                    {step === 'done' && `${savedCount} riesgo(s) agregados correctamente a la empresa`}
                                </p>
                            </div>
                            {step !== 'saving' && (
                                <button onClick={handleClose} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
                                    background: 'white', cursor: 'pointer', color: '#94a3b8',
                                }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* ══ STEP: UPLOAD ══════════════════════════════════════════════════ */}
                        {step === 'upload' && (
                            <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Dropzone */}
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${dragOver ? '#185FA5' : '#cbd5e1'}`,
                                        borderRadius: 12, padding: '48px 32px',
                                        textAlign: 'center', cursor: 'pointer',
                                        background: dragOver ? '#f0f7ff' : '#f8fafc',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        style={{ display: 'none' }}
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                                    />
                                    <div style={{
                                        width: 56, height: 56, borderRadius: 14,
                                        background: '#E6F1FB', color: '#185FA5',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px', fontSize: 28,
                                    }}>📊</div>
                                    <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                                        Arrastra tu Excel aquí o haz clic para buscar
                                    </p>
                                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                                        Archivos .xlsx o .xls · Estructura: Categoría N1, Definición, Categoría N2, Ejemplos N3, Selección
                                    </p>
                                </div>

                                {/* Descripción estructura esperada */}
                                <div style={{
                                    background: '#f8fafc', border: '1px solid #e2e8f0',
                                    borderRadius: 10, padding: '14px 16px',
                                }}>
                                    <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                                        📌 Estructura esperada del Excel:
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                                        {[
                                            { col: 'A', label: 'Categoría Nivel 1', color: '#dbeafe', text: '#1e40af' },
                                            { col: 'B', label: 'Definición', color: '#f0fdf4', text: '#15803d' },
                                            { col: 'C', label: 'Categoría Nivel 2', color: '#fef9c3', text: '#854d0e' },
                                            { col: 'D', label: 'Ejemplos (Nivel 3)', color: '#fce7f3', text: '#be185d' },
                                            { col: 'E', label: 'Selección (X)', color: '#ede9fe', text: '#7c3aed' },
                                        ].map(c => (
                                            <div key={c.col} style={{
                                                background: c.color, borderRadius: 7, padding: '8px 10px', textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: c.text }}>{c.col}</div>
                                                <div style={{ fontSize: 10, color: c.text, opacity: 0.8, lineHeight: 1.3 }}>{c.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ margin: '10px 0 0', fontSize: 11, color: '#94a3b8' }}>
                                        ✓ Las celdas combinadas se procesan automáticamente. Los valores <strong>"X"</strong> en la columna E quedarán pre-seleccionados para importar.
                                    </p>
                                </div>

                                {parseError && (
                                    <div style={{
                                        background: '#fef2f2', border: '1px solid #fca5a5',
                                        borderRadius: 8, padding: '10px 14px',
                                        fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start',
                                    }}>
                                        ⚠️ {parseError}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ STEP: PREVIEW ════════════════════════════════════════════════ */}
                        {step === 'preview' && (
                            <>
                                {/* Toolbar */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
                                    flexWrap: 'wrap', flexShrink: 0, background: '#f8fafc',
                                }}>
                                    {/* Selección rápida */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {[
                                            { label: 'Todos', action: selAll },
                                            { label: 'Ninguno', action: deselAll },
                                            { label: 'Solo X del Excel', action: selSoloX },
                                        ].map(b => (
                                            <button key={b.label} onClick={b.action} style={{
                                                padding: '5px 10px', borderRadius: 6,
                                                border: '1px solid #d1d5db', background: 'white',
                                                fontSize: 11, fontWeight: 600, color: '#374151',
                                                cursor: 'pointer', fontFamily: 'inherit',
                                            }}>{b.label}</button>
                                        ))}
                                    </div>

                                    <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

                                    {/* Filtros */}
                                    <select
                                        value={filter}
                                        onChange={e => { setFilter(e.target.value as 'todos' | 'seleccionados' | 'nivel1'); }}
                                        style={{
                                            border: '1px solid #d1d5db', borderRadius: 6, padding: '5px 8px',
                                            fontSize: 11, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        <option value="todos">Ver todos ({riesgos.length})</option>
                                        <option value="seleccionados">Solo seleccionados ({totalSeleccionados})</option>
                                        <option value="nivel1">Filtrar por categoría…</option>
                                    </select>

                                    {filter === 'nivel1' && (
                                        <select
                                            value={filterNivel1}
                                            onChange={e => setFilterNivel1(e.target.value)}
                                            style={{
                                                border: '1px solid #185FA5', borderRadius: 6, padding: '5px 8px',
                                                fontSize: 11, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                                                color: '#185FA5', fontWeight: 600,
                                            }}
                                        >
                                            <option value="">— Elige categoría —</option>
                                            {nivel1List.map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    )}

                                    {parseError && (
                                        <span style={{ fontSize: 11, color: '#dc2626', flex: 1 }}>⚠️ {parseError}</span>
                                    )}
                                </div>

                                {/* Tabla */}
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>
                                                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', width: 36 }}>✓</th>
                                                <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#1e40af', fontSize: 10, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', minWidth: 110 }}>Categoría N1</th>
                                                <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#854d0e', fontSize: 10, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', minWidth: 110 }}>Categoría N2</th>
                                                <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#be185d', fontSize: 10, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Ejemplo / Descripción</th>
                                                <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', width: 80 }}>Prob.</th>
                                                <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', width: 80 }}>Impacto</th>
                                                <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', width: 80 }}>Nivel</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((r) => {
                                                const nivel = getNivel(r.probabilidad, r.impacto);
                                                const nCol = NIVEL_COLORS[nivel];
                                                return (
                                                    <tr
                                                        key={r._key}
                                                        style={{
                                                            background: r.incluidoEnImport ? '#f0f7ff' : 'white',
                                                            borderBottom: '1px solid #f1f5f9',
                                                            opacity: r.incluidoEnImport ? 1 : 0.5,
                                                            transition: 'all 0.1s',
                                                        }}
                                                        onMouseEnter={e => { if (!r.incluidoEnImport) e.currentTarget.style.background = '#f8fafc'; }}
                                                        onMouseLeave={e => { if (!r.incluidoEnImport) e.currentTarget.style.background = 'white'; }}
                                                    >
                                                        {/* Checkbox */}
                                                        <td style={{ padding: '8px 14px' }}>
                                                            <div
                                                                onClick={() => toggleRiesgo(r._key)}
                                                                style={{
                                                                    width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
                                                                    border: r.incluidoEnImport ? 'none' : '2px solid #cbd5e1',
                                                                    background: r.incluidoEnImport ? '#185FA5' : 'white',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    flexShrink: 0, transition: 'all 0.15s',
                                                                }}
                                                            >
                                                                {r.incluidoEnImport && (
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Categoría N1 */}
                                                        <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                            <span style={{
                                                                fontSize: 10, fontWeight: 700, display: 'inline-block',
                                                                background: '#dbeafe', color: '#1e40af',
                                                                padding: '2px 6px', borderRadius: 4, lineHeight: 1.4,
                                                            }}>{r.categoria_nivel1}</span>
                                                        </td>

                                                        {/* Categoría N2 */}
                                                        <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                            {r.categoria_nivel2 && (
                                                                <span style={{
                                                                    fontSize: 10, fontWeight: 600, display: 'inline-block',
                                                                    background: '#fef9c3', color: '#854d0e',
                                                                    padding: '2px 6px', borderRadius: 4, lineHeight: 1.4,
                                                                }}>{r.categoria_nivel2}</span>
                                                            )}
                                                        </td>

                                                        {/* Descripción editable */}
                                                        <td style={{ padding: '8px 10px' }}>
                                                            <input
                                                                value={r.descripcion}
                                                                onChange={e => setRiesgos(prev => prev.map(x =>
                                                                    x._key === r._key ? { ...x, descripcion: e.target.value } : x
                                                                ))}
                                                                style={{
                                                                    width: '100%', border: '1px solid #e2e8f0', borderRadius: 6,
                                                                    padding: '4px 8px', fontSize: 12, color: '#1e293b',
                                                                    outline: 'none', fontFamily: 'inherit', background: 'white',
                                                                    boxSizing: 'border-box',
                                                                }}
                                                            />
                                                        </td>

                                                        {/* Probabilidad */}
                                                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                    <button key={n} onClick={() => updateProb(r._key, n)} style={{
                                                                        width: 22, height: 22, borderRadius: '50%', border: '1.5px solid',
                                                                        borderColor: r.probabilidad === n ? `hsl(${120 - n * 24},65%,45%)` : '#e2e8f0',
                                                                        background: r.probabilidad === n ? `hsl(${120 - n * 24},65%,45%)` : 'white',
                                                                        color: r.probabilidad === n ? 'white' : '#94a3b8',
                                                                        fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                                                    }}>{n}</button>
                                                                ))}
                                                            </div>
                                                        </td>

                                                        {/* Impacto */}
                                                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                    <button key={n} onClick={() => updateImp(r._key, n)} style={{
                                                                        width: 22, height: 22, borderRadius: '50%', border: '1.5px solid',
                                                                        borderColor: r.impacto === n ? `hsl(${120 - n * 24},65%,45%)` : '#e2e8f0',
                                                                        background: r.impacto === n ? `hsl(${120 - n * 24},65%,45%)` : 'white',
                                                                        color: r.impacto === n ? 'white' : '#94a3b8',
                                                                        fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                                                    }}>{n}</button>
                                                                ))}
                                                            </div>
                                                        </td>

                                                        {/* Nivel */}
                                                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                            <span style={{
                                                                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                                                                textTransform: 'uppercase' as const,
                                                                background: nCol.bg, color: nCol.color,
                                                            }}>{nivel}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {filtered.length === 0 && (
                                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                            <p style={{ fontSize: 13 }}>Sin resultados para el filtro actual.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ══ STEP: SAVING ════════════════════════════════════════════════ */}
                        {step === 'saving' && (
                            <div style={{ padding: '60px 40px', textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: '50%', background: '#E6F1FB',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px', color: '#185FA5', fontSize: 26,
                                    animation: 'spin 1s linear infinite',
                                }}>⏳</div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>
                                    Guardando {totalSeleccionados} riesgos…
                                </p>
                                <p style={{ fontSize: 13, margin: 0 }}>Por favor espera un momento</p>
                            </div>
                        )}

                        {/* ══ STEP: DONE ══════════════════════════════════════════════════ */}
                        {step === 'done' && (
                            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%', background: '#dcfce7',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px', fontSize: 32,
                                }}>✅</div>
                                <p style={{ fontSize: 18, fontWeight: 800, color: '#15803d', margin: '0 0 8px' }}>
                                    ¡{savedCount} riesgo{savedCount !== 1 ? 's' : ''} importado{savedCount !== 1 ? 's' : ''}!
                                </p>
                                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px' }}>
                                    Los riesgos se guardaron correctamente y ya aparecen en la lista de la empresa.
                                </p>
                                <button onClick={handleClose} style={{
                                    padding: '10px 28px', borderRadius: 9, border: 'none',
                                    background: '#15803d', color: 'white',
                                    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                }}>
                                    Cerrar
                                </button>
                            </div>
                        )}

                        {/* Footer de Preview */}
                        {step === 'preview' && (
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '14px 20px', borderTop: '1px solid #e2e8f0',
                                background: '#f8fafc', flexShrink: 0, flexWrap: 'wrap', gap: 10,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                        fontSize: 13, fontWeight: 700, color: '#185FA5',
                                        background: '#E6F1FB', padding: '4px 12px', borderRadius: 6,
                                    }}>
                                        {totalSeleccionados} de {riesgos.length} seleccionados
                                    </span>
                                    {totalSeleccionados === 0 && (
                                        <span style={{ fontSize: 12, color: '#f59e0b' }}>
                                            ⚠️ Selecciona al menos uno para importar
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => { setStep('upload'); setParseError(null); }} style={{
                                        padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
                                        background: 'white', fontSize: 13, fontWeight: 500, color: '#64748b',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}>← Cambiar archivo</button>
                                    <button
                                        onClick={handleGuardar}
                                        disabled={totalSeleccionados === 0}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '8px 22px', borderRadius: 8, border: 'none',
                                            background: totalSeleccionados === 0 ? '#94a3b8' : '#185FA5',
                                            color: 'white', fontSize: 13, fontWeight: 700,
                                            cursor: totalSeleccionados === 0 ? 'not-allowed' : 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                        Guardar {totalSeleccionados > 0 ? `${totalSeleccionados} riesgo${totalSeleccionados !== 1 ? 's' : ''}` : ''}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}