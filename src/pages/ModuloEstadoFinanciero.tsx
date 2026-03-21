import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import styles from './ModuloEstadoFinanciero.module.css';
import { exportarPDF } from './exportarPDF';

/* ─── Types ── */
interface Empresa { id: number; nombre: string; descripcion: string | null; idtipo_empresa: number; tipo_nombre: string; created_at: string; total_estados: number; }
interface EstadoCuenta { id: number; nombre: string; descripcion: string | null; idcatalogo: number; created_at: string; catalogo_nombre?: string; }
interface Anio { id: number; valor: string; }
interface ItemCat { id: number; nombre: string; codigo: string | null; contenedor: boolean; iditempadre: number | null; depth?: number; }
interface ItemEstado { iditemcat: number; idanio: number; valor: number; }
interface KpiData { total_estados: number; total_cuentas: number; ultimo_estado: string; anios: string[]; }
interface Riesgo { id: number; created_at: string; categoria: string; descripcion: string; probabilidad: number; impacto: number; frecuencia_actual: number; mes_actual: string; }
interface FormulaToken { type: 'item' | 'operator' | 'number' | 'paren'; value: string; itemId?: number; }
interface Formula { id: number; nombre: string; descripcion: string | null; codigo: { tokens: FormulaToken[] }; source: 'catalogo' | 'personal'; }

/* ─── Icons ── */
const IconX = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconBuilding = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" /><path d="M5 21V10.12" /><path d="M19 21V10.12" /><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" /></svg>;
const IconChevronDown = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
const IconCheck = ({ size = 13 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconPlus = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconTrash = ({ size = 13 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const IconDownload = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconBarChart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>;
const IconTrend = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const IconFormula = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="3" y1="12" x2="15" y2="12" /></svg>;
const IconShield = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconBook = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const IconGrid = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const IconArrowRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
const IconAlert = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const IconSearch = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;

const TIPO_ICONS: Record<string, string> = { financiera: '🏦', comercial: '🏪' };
const TIPO_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  financiera: { bg: '#E6F1FB', color: '#185FA5', border: '#185FA5' },
  comercial: { bg: '#fff7ed', color: '#d97706', border: '#d97706' },
};
const HEAT_COLORS = ['#bbf7d0', '#fde68a', '#fca5a5', '#f87171', '#dc2626'];
const NIVEL_COLORS: Record<string, { bg: string; color: string }> = {
  BAJO: { bg: '#dcfce7', color: '#15803d' },
  MODERADO: { bg: '#fef9c3', color: '#854d0e' },
  ALTO: { bg: '#fee2e2', color: '#b91c1c' },
  CRÍTICO: { bg: '#fce7f3', color: '#be185d' },
};
const CAT_COLORS: Record<string, string> = {
  Crédito: '#1d4ed8', Liquidez: '#6d28d9', Operacional: '#854d0e', Mercado: '#15803d',
};

// Mapa de nombres de bloques por primer dígito del código
const BLOCK_NAMES: Record<string, string> = {
  '1': 'ACTIVOS',
  '2': 'PASIVOS',
  '3': 'PATRIMONIO',
  '4': 'GASTOS',
  '5': 'INGRESOS',
  '6': 'CONTINGENTES',
  '7': 'CUENTAS DE ORDEN',
};

function getNivel(prob: number, impacto: number): string {
  const score = prob * impacto;
  if (score >= 16) return 'CRÍTICO';
  if (score >= 9) return 'ALTO';
  if (score >= 4) return 'MODERADO';
  return 'BAJO';
}

function flattenWithDepth(items: ItemCat[], parentId: number | null = null, depth = 0): ItemCat[] {
  const result: ItemCat[] = [];
  for (const item of items) {
    if (item.iditempadre === parentId) {
      result.push({ ...item, depth });
      result.push(...flattenWithDepth(items, item.id, depth + 1));
    }
  }
  return result;
}

function fmtNum(n: number): string {
  if (n === 0 || n === null || n === undefined) return '—';
  return new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function evaluateFormula(tokens: FormulaToken[], valMap: Record<number, number>): number | null {
  let expr = '';
  for (const t of tokens) {
    if (t.type === 'item') { if (t.itemId === undefined) return null; expr += valMap[t.itemId] ?? 0; }
    else if (t.type === 'operator') { const op = t.value === '−' ? '-' : t.value === '×' ? '*' : t.value === '÷' ? '/' : t.value; expr += ` ${op} `; }
    else { expr += t.value; }
  }
  try { const r = Function(`"use strict"; return (${expr})`)(); return typeof r === 'number' && isFinite(r) ? r : null; }
  catch { return null; }
}

/* ─── Shared: load estado data ── */
async function loadEstadoData(estadoSel: EstadoCuenta) {
  const [{ data: rawItems }, { data: rawAnios }, { data: rawValores }] = await Promise.all([
    supabase.from('itemcat').select('id, nombre, codigo, contenedor, iditempadre').eq('idcatalogo', estadoSel.idcatalogo).order('id'),
    supabase.from('anioestado').select('id, valor').eq('idestadocuenta', estadoSel.id).order('valor'),
    supabase.from('itemestado').select('iditemcat, idanio, valor').eq('idestadocuenta', estadoSel.id),
  ]);
  return {
    items: flattenWithDepth(rawItems ?? []),
    anios: (rawAnios ?? []) as Anio[],
    valores: (rawValores ?? []) as ItemEstado[],
  };
}

function buildValMap(valores: ItemEstado[]): Record<number, Record<number, number>> {
  const m: Record<number, Record<number, number>> = {};
  for (const v of valores) { if (!m[v.iditemcat]) m[v.iditemcat] = {}; m[v.iditemcat][v.idanio] = v.valor; }
  return m;
}

/* ─── Estado selector row ── */
function EstadoSelectorRow({ estados, sel, onSelect }: { estados: EstadoCuenta[]; sel: EstadoCuenta | null; onSelect: (e: EstadoCuenta) => void }) {
  if (estados.length <= 1) return null;
  return (
    <select value={sel?.id ?? ''} onChange={e => onSelect(estados.find(ec => ec.id === Number(e.target.value))!)}
      style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#1e293b', background: 'white', outline: 'none', fontFamily: 'inherit', width: 'fit-content', cursor: 'pointer' }}>
      {estados.map(ec => <option key={ec.id} value={ec.id}>{ec.nombre}</option>)}
    </select>
  );
}

function EmptyEstados() {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>Sin estados financieros</p>
      <p style={{ fontSize: 13, margin: 0 }}>Crea estados financieros en <strong>"Mis análisis"</strong> y asígnalos a esta empresa.</p>
    </div>
  );
}

/* ─── Selector de empresa ── */
function EmpresaSelector({ user, selected, onSelect }: { user: string; selected: Empresa | null; onSelect: (e: Empresa) => void; }) {
  const [open, setOpen] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.rpc('get_mis_empresas', { p_user_id: user }).then(({ data }) => { setEmpresas(data ?? []); setLoading(false); });
  }, [open, user]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, border: selected ? '1px solid #185FA5' : '1px solid #d1d5db', background: selected ? '#E6F1FB' : 'white', color: selected ? '#185FA5' : '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
        <IconBuilding size={16} />
        {selected ? selected.nombre : 'Seleccionar empresa'}
        <IconChevronDown size={14} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 280, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mis empresas</div>
          {loading ? <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Cargando…</div>
            : empresas.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No hay empresas registradas</div>
              : empresas.map((e: Empresa) => {
                const col = TIPO_COLORS[e.tipo_nombre] ?? TIPO_COLORS.comercial;
                return (
                  <button key={e.id} onClick={() => { onSelect(e); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', border: 'none', background: selected?.id === e.id ? '#f0f7ff' : 'white', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = selected?.id === e.id ? '#f0f7ff' : 'white')}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{TIPO_ICONS[e.tipo_nombre] ?? '🏢'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{e.nombre}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{e.total_estados} estado{e.total_estados !== 1 ? 's' : ''}</div>
                    </div>
                    {selected?.id === e.id && <IconCheck size={14} />}
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}

/* ─── Modal Nuevo Riesgo ── */
function ModalNuevoRiesgo({ idempresa, categorias, onClose, onCreated }: { idempresa: number; categorias: string[]; onClose: () => void; onCreated: (r: Riesgo) => void; }) {
  const [categoria, setCategoria] = useState(categorias[0] ?? 'Operacional');
  const [categoriaCustom, setCategoriaCustom] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [probabilidad, setProbabilidad] = useState(2);
  const [impacto, setImpacto] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const catFinal = categoria === '__custom__' ? categoriaCustom.trim() : categoria;
  const LABELS_PROB = ['Raro', 'Improbable', 'Posible', 'Probable', 'Casi seguro'];
  const LABELS_IMP = ['Mínimo', 'Menor', 'Moderado', 'Mayor', 'Catastrófico'];

  const handleSave = async () => {
    if (!catFinal || !descripcion.trim()) { setError('Completa todos los campos'); return; }
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from('riesgo_operacional').insert({ idempresa, categoria: catFinal, descripcion: descripcion.trim(), probabilidad, impacto, user: user!.id }).select('*').single();
    setSaving(false);
    if (err || !data) { setError('Error: ' + (err?.message ?? '')); return; }
    onCreated({ ...data, frecuencia_actual: 0, mes_actual: new Date().toISOString().slice(0, 7) });
  };

  const nivel = getNivel(probabilidad, impacto);
  const nCol = NIVEL_COLORS[nivel];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.46)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 20px 60px rgba(15,23,42,.2)', width: '100%', maxWidth: 520, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '1px solid #e2e8f0' }}>
          <div><h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Nuevo riesgo operacional</h2><p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Define la naturaleza y nivel del riesgo</p></div>
          <button onClick={onClose} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#94a3b8' }}><IconX size={15} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', background: 'white' }}>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">+ Nueva categoría…</option>
            </select>
            {categoria === '__custom__' && <input value={categoriaCustom} onChange={e => setCategoriaCustom(e.target.value)} placeholder="Nombre de la categoría" style={{ marginTop: 8, width: '100%', border: '1.5px solid #185FA5', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Descripción del riesgo</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Describe el riesgo identificado…" style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>Probabilidad: <span style={{ color: '#185FA5' }}>{LABELS_PROB[probabilidad - 1]} ({probabilidad})</span></label>
              <input type="range" min={1} max={5} value={probabilidad} onChange={e => setProbabilidad(Number(e.target.value))} style={{ width: '100%', accentColor: '#185FA5' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 2 }}><span>1</span><span>5</span></div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>Impacto: <span style={{ color: '#dc2626' }}>{LABELS_IMP[impacto - 1]} ({impacto})</span></label>
              <input type="range" min={1} max={5} value={impacto} onChange={e => setImpacto(Number(e.target.value))} style={{ width: '100%', accentColor: '#dc2626' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 2 }}><span>1</span><span>5</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Nivel resultante:</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 5, background: nCol.bg, color: nCol.color }}>{nivel}</span>
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>Score: {probabilidad * impacto}</span>
          </div>
          {error && <p style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '7px 12px', margin: 0 }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 22px', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || !catFinal || !descripcion.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Guardando…' : <><IconPlus size={14} /> Agregar riesgo</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REEMPLAZA TabCatalogo, TabVertical y TabHorizontal en ModuloEstadoFinanciero.tsx
//
// PROBLEMA IDENTIFICADO EN SUPABASE:
//   - Catálogo 12 (Balance General): ítems raíz son HOJAS (contenedor=false, iditempadre=null)
//     Ej: "FONDOS DISPONIBLES" cod=11, "OBLIGACIONES CON PÚBLICO" cod=21, etc.
//   - Catálogo 13 (Estado de Resultados): mezcla de:
//       * Contenedores raíz (contenedor=true, iditempadre=null): M1,M2,M3,M4,M5
//       * Hojas raíz sueltas (contenedor=false, iditempadre=null): 56,47,48
//
// SOLUCIÓN: renderizar TODOS los ítems en orden (flattenWithDepth ya los ordena bien).
// Los contenedores = cabecera oscura. Las hojas = fila normal con indentación por depth.
// No filtrar nada — mostrar el árbol completo tal como viene de Supabase.
// ─────────────────────────────────────────────────────────────────────────────

/* ─── TAB: Catálogo ── */
function TabCatalogo({ empresa, estadoOverride }: { empresa: Empresa; estadoOverride: EstadoCuenta }) {
  const [items, setItems] = useState<ItemCat[]>([]);
  const [anios, setAnios] = useState<Anio[]>([]);
  const [valMap, setValMap] = useState<Record<number, Record<number, number>>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estadoOverride) return;
    setLoading(true);
    loadEstadoData(estadoOverride).then(({ items, anios, valores }) => {
      setItems(items); setAnios(anios); setValMap(buildValMap(valores)); setLoading(false);
    });
  }, [estadoOverride?.id]);

  const filtered = search
    ? items.filter(i =>
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (i.codigo ?? '').toLowerCase().includes(search.toLowerCase())
    )
    : items;

  const COL_W = 140, LABEL_W = 380;

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', flex: '0 1 280px' }}>
          <IconSearch size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cuenta…"
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', background: 'transparent', width: '100%' }} />
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: LABEL_W + anios.length * COL_W }}>
            {/* Cabecera */}
            <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 5 }}>
              <div style={{ width: LABEL_W, minWidth: LABEL_W, padding: '11px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const }}>Cuenta</div>
              {anios.map(a => (
                <div key={a.id} style={{ width: COL_W, minWidth: COL_W, padding: '11px 12px', textAlign: 'right' as const, fontSize: 13, fontWeight: 700, color: '#185FA5' }}>{a.valor}</div>
              ))}
            </div>

            {filtered.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Sin resultados</div>
              : filtered.map(item => {
                const depth = item.depth ?? 0;
                const isContenedor = item.contenedor;

                const bgBase = isContenedor
                  ? (depth === 0 ? '#1e3a5f' : depth === 1 ? '#334155' : '#475569')
                  : (depth === 0 ? 'white' : 'white');

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      borderBottom: `1px solid ${isContenedor ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
                      background: bgBase,
                    }}
                    onMouseEnter={e => { if (!isContenedor) e.currentTarget.style.background = '#f0f7ff'; }}
                    onMouseLeave={e => { if (!isContenedor) e.currentTarget.style.background = bgBase; }}
                  >
                    <div style={{
                      width: LABEL_W, minWidth: LABEL_W,
                      padding: '9px 20px',
                      paddingLeft: 20 + depth * 22,
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                      {item.codigo && (
                        <span style={{
                          fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                          color: isContenedor ? 'rgba(255,255,255,0.85)' : '#185FA5',
                          background: isContenedor ? 'rgba(255,255,255,0.15)' : '#E6F1FB',
                          padding: '1px 5px', borderRadius: 4, flexShrink: 0,
                        }}>{item.codigo}</span>
                      )}
                      <span style={{
                        fontSize: isContenedor ? 12 : 13,
                        color: isContenedor ? 'white' : '#1e293b',
                        fontWeight: isContenedor ? 700 : 400,
                        textTransform: isContenedor ? 'uppercase' as const : 'none' as const,
                        letterSpacing: isContenedor ? '0.04em' : 'normal',
                      }}>
                        {item.nombre}
                      </span>
                    </div>
                    {anios.map(a => {
                      const val = valMap[item.id]?.[a.id] ?? 0;
                      return (
                        <div key={a.id} style={{
                          width: COL_W, minWidth: COL_W, padding: '9px 12px',
                          textAlign: 'right' as const, fontFamily: 'monospace',
                          fontSize: isContenedor ? 12 : 13,
                          color: isContenedor
                            ? (val !== 0 ? 'white' : 'rgba(255,255,255,0.3)')
                            : (val !== 0 ? '#0f172a' : '#cbd5e1'),
                          fontWeight: isContenedor ? 700 : 400,
                        }}>
                          {fmtNum(val)}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TabVertical — versión final
//
// MODO AUTOMÁTICO:
//   Cada ítem raíz (iditempadre=null) es su propio 100%.
//   - Si es contenedor (M1, M2...): cabecera azul oscura, sus hijos muestran
//     cuánto % representan del total de ese contenedor raíz.
//   - Si es hoja raíz suelta (ej: cod=56 OTROS INGRESOS): fila normal con 100%.
//
// MODO CONFIGURAR:
//   La ingeniera selecciona UNO o VARIOS ítems raíz.
//   La suma de todos los seleccionados = 100%.
//   Todas las cuentas debajo de esos grupos se calculan sobre ESE total único.
//   Solo en memoria — no se guarda en BD.
//
// ESTRUCTURA REAL EN SUPABASE (Finaxis):
//   Catálogo 12: hojas raíz directas (cod 11,12,13,21,22...)
//   Catálogo 13: contenedores raíz M1-M5 + hojas sueltas (56,47,48)
// ─────────────────────────────────────────────────────────────────────────────

function TabVertical({ empresa, estadoOverride }: { empresa: Empresa; estadoOverride: EstadoCuenta }) {
  const [items, setItems] = useState<ItemCat[]>([]);
  const [anios, setAnios] = useState<Anio[]>([]);
  const [valMap, setValMap] = useState<Record<number, Record<number, number>>>({});
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'auto' | 'config'>('auto');
  const [selectedRoots, setSelectedRoots] = useState<number[]>([]);

  useEffect(() => {
    if (!estadoOverride) return;
    setLoading(true);
    loadEstadoData(estadoOverride).then(({ items, anios, valores }) => {
      setItems(items); setAnios(anios); setValMap(buildValMap(valores)); setLoading(false);
    });
  }, [estadoOverride?.id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>;

  // Ítems raíz en orden (iditempadre === null)
  const rootItems = items.filter(i => i.iditempadre === null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Hojas descendientes de un nodo contenedor
  function leavesOf(parentId: number): ItemCat[] {
    return items
      .filter(i => i.iditempadre === parentId)
      .flatMap(c => c.contenedor ? leavesOf(c.id) : [c]);
  }

  // Valor efectivo de un ítem para un año:
  //   hoja → valor directo | contenedor → suma abs de sus hojas
  function efectivo(item: ItemCat, anioId: number): number {
    if (!item.contenedor) return valMap[item.id]?.[anioId] ?? 0;
    return leavesOf(item.id).reduce((s, l) => s + Math.abs(valMap[l.id]?.[anioId] ?? 0), 0);
  }

  // Totales de la base configurada (suma de raíces seleccionadas)
  const configTotals: Record<number, number> = {};
  if (selectedRoots.length > 0) {
    for (const a of anios) {
      const ri_items = rootItems.filter(i => selectedRoots.includes(i.id));
      configTotals[a.id] = ri_items.reduce((s, i) => s + Math.abs(efectivo(i, a.id)), 0);
    }
  }

  const LABEL_W = 380, COL_W = 150, PCT_W = 90;

  // ── Renderizador MODO AUTOMÁTICO ─────────────────────────────────────────
  // baseTotal: total del contenedor RAÍZ al que pertenece este ítem (para % relativo)
  function renderAutoRow(item: ItemCat, baseTotal: Record<number, number> | null): React.ReactNode {
    const depth = item.depth ?? 0;
    const isContenedor = item.contenedor;

    // Total propio de este ítem
    const myTotals: Record<number, number> = {};
    for (const a of anios) myTotals[a.id] = efectivo(item, a.id);

    if (isContenedor) {
      // Sólo mostrar si tiene datos
      const hasData = anios.some(a => myTotals[a.id] !== 0);
      if (!hasData) return null;

      const bgColor = depth === 0 ? '#1e3a5f' : depth === 1 ? '#334155' : '#475569';
      // Si es raíz (depth=0): él mismo es la base (100%)
      // Si es sub-contenedor: base viene del padre raíz
      const myBase = depth === 0 ? myTotals : baseTotal;

      return (
        <div key={item.id}>
          {/* Cabecera contenedor */}
          <div style={{ display: 'flex', background: bgColor }}>
            <div style={{
              width: LABEL_W, minWidth: LABEL_W,
              padding: `${depth === 0 ? 10 : 8}px 20px`,
              paddingLeft: 20 + depth * 20,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              {depth > 0 && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>↳</span>}
              {item.codigo && (
                <span style={{
                  fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                  background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                  padding: '1px 6px', borderRadius: 4, flexShrink: 0,
                }}>{item.codigo}</span>
              )}
              <span style={{
                fontSize: depth === 0 ? 12 : 11, fontWeight: 800, color: 'white',
                textTransform: 'uppercase' as const, letterSpacing: '0.05em',
              }}>{item.nombre}</span>
            </div>
            {anios.map(a => {
              const tot = myTotals[a.id] ?? 0;
              const base = myBase ? (myBase[a.id] ?? 0) : tot;
              const pct = depth === 0 ? 100 : (base > 0 ? (tot / base) * 100 : 0);
              return (
                <div key={a.id} style={{ display: 'flex' }}>
                  <div style={{
                    width: COL_W, padding: '8px 12px', textAlign: 'right' as const,
                    fontFamily: 'monospace', fontSize: 12, fontWeight: 800,
                    color: tot !== 0 ? 'white' : 'rgba(255,255,255,0.25)',
                  }}>{fmtNum(tot)}</div>
                  <div style={{ width: PCT_W, padding: '8px 10px', textAlign: 'right' as const }}>
                    {tot !== 0
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: '#fde68a' }}>
                        {depth === 0 ? '100%' : `${pct.toFixed(1)}%`}
                      </span>
                      : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>—</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
          {/* Hijos recursivos — les pasamos la base raíz */}
          {items
            .filter(c => c.iditempadre === item.id)
            .map(child => renderAutoRow(child, depth === 0 ? myTotals : myBase))
          }
        </div>
      );
    }

    // ── Hoja ──
    return (
      <div key={item.id}
        style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: 'white' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        <div style={{
          width: LABEL_W, minWidth: LABEL_W,
          padding: '8px 20px', paddingLeft: 20 + depth * 20,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {item.codigo && (
            <span style={{
              fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
              color: '#185FA5', background: '#E6F1FB',
              padding: '1px 5px', borderRadius: 4, flexShrink: 0,
            }}>{item.codigo}</span>
          )}
          <span style={{ fontSize: 13, color: '#1e293b' }}>{item.nombre}</span>
        </div>
        {anios.map(a => {
          const val = valMap[item.id]?.[a.id] ?? 0;
          const base = baseTotal ? (baseTotal[a.id] ?? 0) : 0;
          // Si es hoja raíz suelta (depth=0, sin baseTotal): ella misma es 100%
          const isRootLeaf = depth === 0 && !baseTotal;
          const pct = isRootLeaf ? 100 : (base > 0 ? (Math.abs(val) / base) * 100 : 0);
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: COL_W, padding: '8px 12px', textAlign: 'right' as const,
                fontFamily: 'monospace', fontSize: 13,
                color: val !== 0 ? '#0f172a' : '#cbd5e1',
              }}>{fmtNum(val)}</div>
              <div style={{ width: PCT_W, padding: '8px 10px', textAlign: 'right' as const }}>
                {val !== 0
                  ? <span style={{
                    fontSize: 11, fontWeight: 700, color: '#7c3aed',
                    background: '#ede9fe', padding: '2px 7px', borderRadius: 5,
                    border: '1px solid #c4b5fd', display: 'inline-block',
                  }}>
                    {isRootLeaf ? '100%' : (pct > 0 ? `${pct.toFixed(1)}%` : '—')}
                  </span>
                  : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Renderizador MODO CONFIG ──────────────────────────────────────────────
  // Todas las cuentas se calculan sobre configTotals (la base única elegida)
  function renderConfigRow(item: ItemCat): React.ReactNode {
    const depth = item.depth ?? 0;
    const isContenedor = item.contenedor;

    if (isContenedor) {
      const bgColor = depth === 0 ? '#334155' : depth === 1 ? '#475569' : '#64748b';
      return (
        <div key={item.id}>
          <div style={{ display: 'flex', background: bgColor }}>
            <div style={{
              width: LABEL_W, minWidth: LABEL_W,
              padding: '8px 20px', paddingLeft: 20 + depth * 20,
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              textTransform: 'uppercase' as const, letterSpacing: '0.04em',
            }}>
              {depth > 0 && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>↳</span>}
              {item.codigo && (
                <span style={{ fontSize: 10, fontFamily: 'monospace', background: 'rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{item.codigo}</span>
              )}
              {item.nombre}
            </div>
            {anios.map(a => {
              const tot = efectivo(item, a.id);
              const base = configTotals[a.id] ?? 0;
              const pct = base > 0 ? (Math.abs(tot) / base) * 100 : 0;
              return (
                <div key={a.id} style={{ display: 'flex' }}>
                  <div style={{
                    width: COL_W, padding: '8px 12px', textAlign: 'right' as const,
                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#94a3b8',
                  }}>{fmtNum(tot)}</div>
                  <div style={{ width: PCT_W, padding: '8px 10px', textAlign: 'right' as const }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fde68a' }}>
                      {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {items.filter(c => c.iditempadre === item.id).map(child => renderConfigRow(child))}
        </div>
      );
    }

    // Hoja
    return (
      <div key={item.id}
        style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: 'white' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        <div style={{
          width: LABEL_W, minWidth: LABEL_W,
          padding: '8px 20px', paddingLeft: 20 + depth * 20,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {item.codigo && (
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#185FA5', background: '#E6F1FB', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{item.codigo}</span>
          )}
          <span style={{ fontSize: 13, color: '#1e293b' }}>{item.nombre}</span>
        </div>
        {anios.map(a => {
          const val = valMap[item.id]?.[a.id] ?? 0;
          const base = configTotals[a.id] ?? 0;
          const pct = base > 0 ? (Math.abs(val) / base) * 100 : 0;
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: COL_W, padding: '8px 12px', textAlign: 'right' as const,
                fontFamily: 'monospace', fontSize: 13,
                color: val !== 0 ? '#0f172a' : '#cbd5e1',
              }}>{fmtNum(val)}</div>
              <div style={{ width: PCT_W, padding: '8px 10px', textAlign: 'right' as const }}>
                {val !== 0 && pct > 0
                  ? <span style={{
                    fontSize: 11, fontWeight: 700, color: '#7c3aed',
                    background: '#ede9fe', padding: '2px 7px', borderRadius: 5,
                    border: '1px solid #c4b5fd', display: 'inline-block',
                  }}>{pct.toFixed(1)}%</span>
                  : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        {[
          { key: 'auto', label: '📊 Automático', desc: 'Cada grupo = su propio 100%' },
          { key: 'config', label: '⚙️ Configurar base', desc: 'Elige tú el 100% global' },
        ].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key as 'auto' | 'config')}
            style={{
              flex: 1, padding: '12px 20px', fontSize: 13, fontWeight: 600, border: 'none',
              background: subTab === t.key ? '#f0f7ff' : 'white', cursor: 'pointer',
              fontFamily: 'inherit',
              borderBottom: subTab === t.key ? '2px solid #185FA5' : '2px solid transparent',
              color: subTab === t.key ? '#185FA5' : '#64748b',
              display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', gap: 2,
              transition: 'all 0.15s',
            }}>
            <span>{t.label}</span>
            <span style={{ fontSize: 10, fontWeight: 400, color: subTab === t.key ? '#185FA5' : '#94a3b8' }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════ MODO AUTOMÁTICO ══════════════════════════ */}
      {subTab === 'auto' && (
        <>
          <div style={{
            fontSize: 12, color: '#64748b', background: '#f0f7ff',
            border: '1px solid #b5d4f4', borderRadius: 7, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ℹ️ <span><strong>Automático:</strong> cada grupo raíz es su propio 100%. Los porcentajes muestran la participación de cada cuenta dentro de su bloque.</span>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: LABEL_W + anios.length * (COL_W + PCT_W) }}>
                {/* Header columnas */}
                <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <div style={{ width: LABEL_W, minWidth: LABEL_W, padding: '11px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const }}>Cuenta</div>
                  {anios.map(a => (
                    <div key={a.id} style={{ display: 'flex' }}>
                      <div style={{ width: COL_W, padding: '11px 12px', textAlign: 'right' as const, fontSize: 13, fontWeight: 700, color: '#185FA5' }}>{a.valor}</div>
                      <div style={{ width: PCT_W, padding: '11px 10px', textAlign: 'right' as const, fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' as const }}>% Part.</div>
                    </div>
                  ))}
                </div>
                {/* Árbol: todos los ítems raíz, cada uno con su propia base */}
                {rootItems.map(ri => renderAutoRow(ri, null))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════ MODO CONFIGURAR ══════════════════════════ */}
      {subTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Panel selector de grupos */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
              Selecciona los grupos que forman el 100%
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
              Puedes elegir <strong>uno o varios</strong> grupos. Su suma será el denominador único.
              Ej: si eliges <strong>ACTIVOS</strong> (100) + <strong>PASIVOS</strong> (100) → total = 200,
              y una cuenta de 20 representará el <strong>10%</strong>.
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {rootItems.map(ri => {
                const isSelected = selectedRoots.includes(ri.id);
                const lastAnio = anios[anios.length - 1];
                const lastTotal = lastAnio ? Math.abs(efectivo(ri, lastAnio.id)) : 0;
                const hasData = anios.some(a => efectivo(ri, a.id) !== 0);

                return (
                  <button key={ri.id}
                    onClick={() => {
                      if (!hasData) return;
                      setSelectedRoots(prev =>
                        isSelected ? prev.filter(id => id !== ri.id) : [...prev, ri.id]
                      );
                    }}
                    style={{
                      padding: '10px 14px', borderRadius: 10,
                      border: `2px solid ${isSelected ? '#185FA5' : '#e2e8f0'}`,
                      background: isSelected ? '#E6F1FB' : hasData ? 'white' : '#f8fafc',
                      cursor: hasData ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', opacity: hasData ? 1 : 0.4,
                      display: 'flex', flexDirection: 'column' as const,
                      alignItems: 'flex-start', gap: 4,
                      transition: 'all 0.15s', minWidth: 150,
                      boxShadow: isSelected ? '0 0 0 3px rgba(24,95,165,0.12)' : 'none',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                      {ri.codigo && (
                        <span style={{
                          fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                          color: isSelected ? '#185FA5' : '#64748b',
                          background: isSelected ? '#dbeafe' : '#f1f5f9',
                          padding: '1px 5px', borderRadius: 4,
                        }}>{ri.codigo}</span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#185FA5' : '#475569', flex: 1, textAlign: 'left' as const }}>
                        {ri.nombre.length > 22 ? ri.nombre.slice(0, 22) + '…' : ri.nombre}
                      </span>
                      {isSelected && (
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#185FA5', color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {lastAnio ? `${lastAnio.valor}: ${lastTotal !== 0 ? fmtNum(lastTotal) : '—'}` : '—'}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#185FA5', background: '#dbeafe', padding: '1px 7px', borderRadius: 4 }}>
                        en base
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Resumen base configurada */}
            {selectedRoots.length > 0 && (
              <div style={{
                marginTop: 16, padding: '12px 14px',
                background: '#f0f7ff', border: '1px solid #b5d4f4', borderRadius: 9,
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#185FA5' }}>
                  Base = 100%:
                </span>
                {anios.map(a => (
                  <span key={a.id} style={{
                    fontSize: 12, fontWeight: 700, color: '#1e3a5f',
                    background: 'white', border: '1px solid #b5d4f4',
                    padding: '3px 10px', borderRadius: 6, fontFamily: 'monospace',
                  }}>
                    {a.valor}: {fmtNum(configTotals[a.id] ?? 0)}
                  </span>
                ))}
                <button
                  onClick={() => setSelectedRoots([])}
                  style={{
                    marginLeft: 'auto', fontSize: 11, color: '#dc2626',
                    background: '#fef2f2', border: '1px solid #fca5a5',
                    borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  ✕ Limpiar
                </button>
              </div>
            )}
          </div>

          {/* Tabla resultado o placeholder */}
          {selectedRoots.length === 0 ? (
            <div style={{
              padding: '56px 20px', textAlign: 'center', color: '#94a3b8',
              background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
            }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>☝️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>
                Selecciona al menos un grupo arriba
              </p>
              <p style={{ fontSize: 13, margin: 0, maxWidth: 360, marginInline: 'auto', lineHeight: 1.6 }}>
                El valor total de los grupos que elijas formará el <strong>100%</strong>.
                Puedes combinar varios grupos para un análisis cruzado.
              </p>
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: LABEL_W + anios.length * (COL_W + PCT_W) }}>
                  {/* Header */}
                  <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <div style={{ width: LABEL_W, minWidth: LABEL_W, padding: '11px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const }}>Cuenta</div>
                    {anios.map(a => (
                      <div key={a.id} style={{ display: 'flex' }}>
                        <div style={{ width: COL_W, padding: '11px 12px', textAlign: 'right' as const, fontSize: 13, fontWeight: 700, color: '#185FA5' }}>{a.valor}</div>
                        <div style={{ width: PCT_W, padding: '11px 10px', textAlign: 'right' as const, fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' as const }}>% del total</div>
                      </div>
                    ))}
                  </div>

                  {/* Fila "BASE = 100%" */}
                  <div style={{ display: 'flex', background: '#1e3a5f', borderBottom: '2px solid #185FA5' }}>
                    <div style={{
                      width: LABEL_W, minWidth: LABEL_W, padding: '9px 20px',
                      fontSize: 11, fontWeight: 800, color: 'white', textTransform: 'uppercase' as const,
                    }}>
                      BASE ({rootItems.filter(ri => selectedRoots.includes(ri.id)).map(ri => ri.codigo ?? ri.nombre.slice(0, 12)).join(' + ')}) = 100%
                    </div>
                    {anios.map(a => (
                      <div key={a.id} style={{ display: 'flex' }}>
                        <div style={{ width: COL_W, padding: '9px 12px', textAlign: 'right' as const, fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: 'white' }}>
                          {fmtNum(configTotals[a.id] ?? 0)}
                        </div>
                        <div style={{ width: PCT_W, padding: '9px 10px', textAlign: 'right' as const }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#fde68a' }}>100%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sólo los grupos seleccionados y sus descendientes */}
                  {rootItems
                    .filter(ri => selectedRoots.includes(ri.id))
                    .map(ri => renderConfigRow(ri))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── TAB: Análisis Horizontal ── */
function TabHorizontal({ empresa, estadoOverride }: { empresa: Empresa; estadoOverride: EstadoCuenta }) {
  const [items, setItems] = useState<ItemCat[]>([]);
  const [anios, setAnios] = useState<Anio[]>([]);
  const [valMap, setValMap] = useState<Record<number, Record<number, number>>>({});
  const [anioBaseId, setAnioBaseId] = useState<number | null>(null);
  const [anioCompId, setAnioCompId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estadoOverride) return;
    setLoading(true);
    loadEstadoData(estadoOverride).then(({ items, anios, valores }) => {
      setItems(items); setValMap(buildValMap(valores)); setAnios(anios);
      if (anios.length >= 2) { setAnioBaseId(anios[0].id); setAnioCompId(anios[1].id); }
      else if (anios.length === 1) { setAnioBaseId(anios[0].id); setAnioCompId(null); }
      setLoading(false);
    });
  }, [estadoOverride?.id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>;

  const anioBase = anios.find(a => a.id === anioBaseId);
  const anioComp = anios.find(a => a.id === anioCompId);
  const rootItems = items.filter(i => i.iditempadre === null);

  // Suma abs de hojas descendientes para un año
  function leavesOf(parentId: number): ItemCat[] {
    const children = items.filter(i => i.iditempadre === parentId);
    return children.flatMap(c => c.contenedor ? leavesOf(c.id) : [c]);
  }
  function containerSum(item: ItemCat, anioId: number | null): number {
    if (!anioId) return 0;
    if (!item.contenedor) return valMap[item.id]?.[anioId] ?? 0;
    return leavesOf(item.id).reduce((s, l) => s + Math.abs(valMap[l.id]?.[anioId] ?? 0), 0);
  }

  // Renderizar árbol horizontal recursivamente
  function renderHRow(item: ItemCat): React.ReactNode {
    const depth = item.depth ?? 0;
    const isContenedor = item.contenedor;
    const valA = containerSum(item, anioBaseId);
    const valB = containerSum(item, anioCompId);

    if (isContenedor) {
      const diff = valB - valA;
      const pct = valA !== 0 ? (diff / Math.abs(valA)) * 100 : null;
      const isPos = diff > 0, isNeg = diff < 0;
      const bgColor = depth === 0 ? '#1e3a5f' : depth === 1 ? '#334155' : '#475569';

      return (
        <div key={item.id}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 120px 120px', padding: `${depth === 0 ? 9 : 7}px 20px`, paddingLeft: 20 + depth * 16, background: bgColor, gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: depth === 0 ? 11 : 10, fontWeight: 800, color: 'white', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              {depth > 0 && <span style={{ color: 'rgba(255,255,255,0.4)' }}>↳</span>}
              {item.codigo && <span style={{ fontSize: 10, fontFamily: 'monospace', background: 'rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{item.codigo}</span>}
              {item.nombre}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right' as const, color: '#94a3b8', fontWeight: 700 }}>{valA !== 0 ? fmtNum(valA) : '—'}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right' as const, color: 'white', fontWeight: 700 }}>{valB !== 0 ? fmtNum(valB) : '—'}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, textAlign: 'right' as const, color: isPos ? '#86efac' : isNeg ? '#fca5a5' : '#94a3b8', fontWeight: 700 }}>
              {diff !== 0 ? `${isPos ? '+' : ''}${fmtNum(diff)}` : '—'}
            </div>
            <div style={{ textAlign: 'right' as const }}>
              {pct !== null && diff !== 0 ? (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: isPos ? 'rgba(134,239,172,0.2)' : 'rgba(252,165,165,0.2)', color: isPos ? '#86efac' : '#fca5a5', border: `1px solid ${isPos ? 'rgba(134,239,172,0.4)' : 'rgba(252,165,165,0.4)'}` }}>
                  {isPos ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
                </span>
              ) : <span style={{ color: '#475569', fontSize: 12 }}>—</span>}
            </div>
          </div>
          {items.filter(c => c.iditempadre === item.id).map(child => renderHRow(child))}
        </div>
      );
    }

    // Hoja — ocultar si no tiene datos en ningún año
    if (valA === 0 && valB === 0) return null;

    const diff = valB - valA;
    const pct = valA !== 0 ? (diff / Math.abs(valA)) * 100 : null;
    const isPos = diff > 0, isNeg = diff < 0;

    return (
      <div key={item.id}
        style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 120px 120px', padding: '9px 20px', borderBottom: '1px solid #f1f5f9', gap: 8, alignItems: 'center', background: 'white' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: depth * 18 }}>
          {item.codigo && <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#185FA5', background: '#E6F1FB', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{item.codigo}</span>}
          <span style={{ fontSize: 13, color: '#1e293b' }}>{item.nombre}</span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, textAlign: 'right' as const, color: '#64748b' }}>{fmtNum(valA)}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, textAlign: 'right' as const, color: '#1e293b', fontWeight: valB !== 0 ? 600 : 400 }}>{fmtNum(valB)}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, textAlign: 'right' as const, color: isPos ? '#16a34a' : isNeg ? '#dc2626' : '#94a3b8', fontWeight: diff !== 0 ? 600 : 400 }}>
          {diff !== 0 ? `${isPos ? '+' : ''}${fmtNum(diff)}` : '—'}
        </div>
        <div style={{ textAlign: 'right' as const }}>
          {pct !== null && diff !== 0 ? (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: isPos ? '#dcfce7' : '#fee2e2', color: isPos ? '#15803d' : '#b91c1c', border: `1px solid ${isPos ? '#86efac' : '#fca5a5'}` }}>
              {isPos ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
            </span>
          ) : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Comparar:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>Base</label>
          <select value={anioBaseId ?? ''} onChange={e => setAnioBaseId(Number(e.target.value))}
            style={{ border: '1.5px solid #185FA5', borderRadius: 7, padding: '5px 10px', fontSize: 13, fontWeight: 600, color: '#185FA5', background: '#f0f7ff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
            {anios.map(a => <option key={a.id} value={a.id} disabled={a.id === anioCompId}>{a.valor}</option>)}
          </select>
        </div>
        <span style={{ color: '#185FA5', fontSize: 16, fontWeight: 700 }}>→</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>Comparar</label>
          <select value={anioCompId ?? ''} onChange={e => setAnioCompId(Number(e.target.value))}
            style={{ border: '1.5px solid #16a34a', borderRadius: 7, padding: '5px 10px', fontSize: 13, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
            {anios.map(a => <option key={a.id} value={a.id} disabled={a.id === anioBaseId}>{a.valor}</option>)}
          </select>
        </div>
      </div>

      {anios.length < 2 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>Necesitas al menos 2 años</p>
          <p style={{ fontSize: 13, margin: 0 }}>Agrega más períodos desde "Mis análisis".</p>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 900 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 120px 120px', padding: '11px 20px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const }}>Cuenta</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#185FA5', textAlign: 'right' as const, textTransform: 'uppercase' as const }}>{anioBase?.valor ?? '—'}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textAlign: 'right' as const, textTransform: 'uppercase' as const }}>{anioComp?.valor ?? '—'}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'right' as const, textTransform: 'uppercase' as const }}>Var. $</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'right' as const, textTransform: 'uppercase' as const }}>Var. %</div>
              </div>
              {rootItems.map(ri => renderHRow(ri))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TAB: Ratios — LEE FÓRMULAS REALES ── */
function TabRatios({ empresa, estadoOverride }: { empresa: Empresa; estadoOverride: EstadoCuenta }) {
  const [items, setItems] = useState<ItemCat[]>([]);
  const [anios, setAnios] = useState<Anio[]>([]);
  const [valMap, setValMap] = useState<Record<number, Record<number, number>>>({});
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estadoOverride) return;
    setLoading(true);
    loadEstadoData(estadoOverride).then(({ items, anios, valores }) => { setItems(items); setAnios(anios); setValMap(buildValMap(valores)); });
    Promise.all([
      supabase.from('formulapersonal').select('id, nombre, descripcion, codigo').eq('idestadocuenta', estadoOverride.id).order('created_at'),
      supabase.from('formulaec').select('id, formula:idformula(id, nombre, descripcion, codigo)').eq('idestadocuenta', estadoOverride.id),
    ]).then(([{ data: fp }, { data: fec }]) => {
      const personales: Formula[] = (fp ?? []).map((f: any) => ({ ...f, source: 'personal' as const }));
      const catalogoF: Formula[] = (fec ?? []).map((f: any) => ({ id: f.formula.id, nombre: f.formula.nombre, descripcion: f.formula.descripcion, codigo: f.formula.codigo, source: 'catalogo' as const }));
      setFormulas([...personales, ...catalogoF]);
      setLoading(false);
    });
  }, [estadoOverride?.id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: '#64748b', background: '#f0f7ff', border: '1px solid #b5d4f4', borderRadius: 7, padding: '6px 12px' }}>
          ℹ️ Mostrando fórmulas del estado financiero seleccionado. Créalas en <strong>"Mis análisis" → Ver análisis → panel de Fórmulas</strong>.
        </div>
      </div>

      {formulas.length === 0 ? (
        <div style={{ padding: '48px 40px', textAlign: 'center', color: '#94a3b8', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📐</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>Sin fórmulas en este estado</p>
          <p style={{ fontSize: 13, margin: 0 }}>Ve a <strong>"Mis análisis" → abre el estado → panel derecho de Fórmulas</strong> y crea tus ratios.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {formulas.map(formula => {
            const resultados = anios.map(a => {
              const flatMap: Record<number, number> = {};
              for (const item of items) { flatMap[item.id] = valMap[item.id]?.[a.id] ?? 0; }
              const result = evaluateFormula(formula.codigo.tokens, flatMap);
              return { anio: a.valor, result };
            });
            const tieneResultados = resultados.some(r => r.result !== null);

            return (
              <div key={`${formula.source}-${formula.id}`} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#185FA5'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(24,95,165,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#E6F1FB', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconFormula />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{formula.nombre}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: formula.source === 'personal' ? '#f0fdf4' : '#E6F1FB', color: formula.source === 'personal' ? '#15803d' : '#185FA5', border: `1px solid ${formula.source === 'personal' ? '#86efac' : '#b5d4f4'}` }}>
                        {formula.source === 'personal' ? 'Personal' : 'Catálogo'}
                      </span>
                    </div>
                    {formula.descripcion && <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>{formula.descripcion}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 10px', minHeight: 32 }}>
                  {formula.codigo.tokens.map((t, i) => {
                    const cls = t.type === 'item' ? { bg: '#E6F1FB', color: '#185FA5' } : t.type === 'operator' ? { bg: '#fef9c3', color: '#854d0e' } : t.type === 'number' ? { bg: '#f0fdf4', color: '#15803d' } : { bg: 'transparent', color: '#94a3b8' };
                    return <span key={i} style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, padding: '2px 5px', borderRadius: 4, background: cls.bg, color: cls.color }}>{t.value}</span>;
                  })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {resultados.map(({ anio, result }) => (
                    <div key={anio} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderRadius: 6, background: '#f8fafc' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{anio}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: result === null ? '#dc2626' : '#185FA5', fontFamily: 'monospace' }}>
                        {result === null ? 'Error' : result === 0 ? '—' : result.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {!tieneResultados && <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '4px 0' }}>Sin datos para calcular</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── TAB: Riesgo Operacional ── */
interface EditRiesgo { id: number; descripcion: string; probabilidad: number; impacto: number; categoria: string; }
function TabRiesgo({ empresa }: { empresa: Empresa }) {
  const [riesgos, setRiesgos] = useState<Riesgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [editRiesgo, setEditRiesgo] = useState<EditRiesgo | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const CATEGORIAS_DEFAULT = ['Crédito', 'Liquidez', 'Operacional', 'Mercado'];
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { loadRiesgos(); }, [empresa.id]);

  const loadRiesgos = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_riesgos_empresa', { p_idempresa: empresa.id });
    setRiesgos(data ?? []);
    setLoading(false);
  };

  const handleFrequencyChange = async (id: number, freq: number) => {
    setSaving(id);
    await supabase.rpc('guardar_frecuencia_riesgo', { p_idriesgo: id, p_frecuencia: freq });
    setRiesgos(prev => prev.map(r => r.id === id ? { ...r, frecuencia_actual: freq } : r));
    setSaving(null);
    showToast('✓ Frecuencia guardada');
  };

  const handleDelete = async (id: number) => {
    await supabase.from('riesgo_operacional').update({ estado: false }).eq('id', id);
    setRiesgos(prev => prev.filter(r => r.id !== id));
    setConfirmDel(null);
    showToast('✓ Riesgo eliminado');
  };

  const handleSaveEdit = async () => {
    if (!editRiesgo) return;
    setSavingEdit(true);
    await supabase.from('riesgo_operacional').update({
      descripcion: editRiesgo.descripcion,
      probabilidad: editRiesgo.probabilidad,
      impacto: editRiesgo.impacto,
      categoria: editRiesgo.categoria,
    }).eq('id', editRiesgo.id);
    setRiesgos(prev => prev.map(r => r.id === editRiesgo.id ? { ...r, ...editRiesgo } : r));
    setSavingEdit(false);
    setEditRiesgo(null);
    showToast('✓ Riesgo actualizado');
  };

  const HEAT_DATA = Array(5).fill(null).map((_, probIdx) =>
    Array(5).fill(null).map((_, impIdx) => {
      const p = 5 - probIdx, imp = impIdx + 1, score = p * imp;
      return score >= 16 ? 4 : score >= 9 ? 3 : score >= 4 ? 2 : score >= 2 ? 1 : 0;
    })
  );

  const categorias = [...new Set(riesgos.map(r => r.categoria))];
  const allCats = [...new Set([...CATEGORIAS_DEFAULT, ...categorias])];
  const resumen = [
    { label: 'Críticos', count: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'CRÍTICO').length, color: '#be185d' },
    { label: 'Altos', count: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'ALTO').length, color: '#dc2626' },
    { label: 'Moderados', count: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'MODERADO').length, color: '#d97706' },
    { label: 'Bajos', count: riesgos.filter(r => getNivel(r.probabilidad, r.impacto) === 'BAJO').length, color: '#16a34a' },
  ];

  return (
    <>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#059669', color: 'white', padding: '11px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(5,150,105,.25)', zIndex: 2000 }}>{toast}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Riesgo Operacional · {empresa.nombre}</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Mes actual: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <IconPlus size={14} /> Registrar riesgo
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {resumen.map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 80, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Cargando…</div>
            : riesgos.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>Sin riesgos registrados</p>
                <p style={{ fontSize: 13, margin: 0 }}>Registra los riesgos identificados este mes.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 110px 90px 100px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', gap: 8 }}>
                  {['Descripción', 'Prob.', 'Impacto', 'Nivel', 'Frec./Mes', 'Acción'].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>)}
                </div>
                {[...new Set(riesgos.map(r => r.categoria))].map(cat => {
                  const catRiesgos = riesgos.filter(r => r.categoria === cat);
                  const catColor = CAT_COLORS[cat];
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: catColor ? `${catColor}10` : '#f8fafc', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: catColor ?? '#94a3b8', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: catColor ?? '#64748b' }}>{cat}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{catRiesgos.length} riesgo{catRiesgos.length !== 1 ? 's' : ''}</span>
                      </div>
                      {catRiesgos.map(r => {
                        const nivel = getNivel(r.probabilidad, r.impacto);
                        const nCol = NIVEL_COLORS[nivel] ?? NIVEL_COLORS.BAJO;
                        return (
                          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 110px 90px 100px', padding: '11px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', gap: 8 }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                            <div style={{ fontSize: 13, color: '#374151' }}>{r.descripcion}</div>
                            <div style={{ textAlign: 'center' }}><span style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${120 - r.probabilidad * 24}, 65%, 45%)`, color: 'white', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{r.probabilidad}</span></div>
                            <div style={{ textAlign: 'center' }}><span style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${120 - r.impacto * 24}, 65%, 45%)`, color: 'white', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{r.impacto}</span></div>
                            <div><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, textTransform: 'uppercase', background: nCol.bg, color: nCol.color }}>{nivel}</span></div>
                            <div>
                              <input type="number" min={0} max={999} defaultValue={r.frecuencia_actual}
                                onBlur={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v !== r.frecuencia_actual) handleFrequencyChange(r.id, v); }}
                                onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt((e.target as HTMLInputElement).value); if (!isNaN(v)) handleFrequencyChange(r.id, v); } }}
                                style={{ width: 70, border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 7px', fontSize: 13, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => setEditRiesgo({ id: r.id, descripcion: r.descripcion, probabilidad: r.probabilidad, impacto: r.impacto, categoria: r.categoria })}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #b5d4f4', background: '#E6F1FB', color: '#185FA5', cursor: 'pointer' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              {confirmDel === r.id ? (
                                <>
                                  <button onClick={() => handleDelete(r.id)} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' }}>Sí</button>
                                  <button onClick={() => setConfirmDel(null)} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}>No</button>
                                </>
                              ) : (
                                <button onClick={() => setConfirmDel(r.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #fca5a5', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}><IconTrash size={12} /></button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
        </div>
        {/* Heat map + categorías */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Mapa de Calor · Probabilidad × Impacto</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: 175, marginRight: 4 }}>
                {['C.seguro', 'Probable', 'Posible', 'Improbable', 'Raro'].map(l => <span key={l} style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', whiteSpace: 'nowrap' }}>{l}</span>)}
              </div>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 32px)', gap: 4, marginBottom: 6 }}>
                  {HEAT_DATA.map((row, ri) => row.map((val, ci) => {
                    const cnt = riesgos.filter(r => (5 - ri) === r.probabilidad && (ci + 1) === r.impacto).length;
                    return (
                      <div key={`${ri}-${ci}`} style={{ width: 32, height: 32, borderRadius: 5, background: HEAT_COLORS[val], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: cnt > 0 ? 'rgba(0,0,0,0.6)' : 'transparent', cursor: 'default' }}>
                        {cnt > 0 ? cnt : ''}
                      </div>
                    );
                  }))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  {['1', '2', '3', '4', '5'].map(l => <span key={l} style={{ width: 32, textAlign: 'center', fontSize: 9, color: '#94a3b8' }}>{l}</span>)}
                </div>
                <div style={{ textAlign: 'center', fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>IMPACTO →</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              {[{ color: '#bbf7d0', label: 'Bajo' }, { color: '#fde68a', label: 'Moderado' }, { color: '#fca5a5', label: 'Alto' }, { color: '#f87171', label: 'Muy alto' }, { color: '#dc2626', label: 'Crítico' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color, flexShrink: 0 }} />{l.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Por Categoría</p>
            {allCats.map(cat => {
              const catRiesgos = riesgos.filter(r => r.categoria === cat);
              const altos = catRiesgos.filter(r => ['ALTO', 'CRÍTICO'].includes(getNivel(r.probabilidad, r.impacto))).length;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: CAT_COLORS[cat] ? `${CAT_COLORS[cat]}20` : '#f1f5f9', color: CAT_COLORS[cat] ?? '#64748b', minWidth: 80 }}>{cat}</span>
                  <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    {catRiesgos.length > 0 && <div style={{ height: '100%', width: `${(catRiesgos.length / Math.max(riesgos.length, 1)) * 100}%`, background: CAT_COLORS[cat] ?? '#185FA5', borderRadius: 3 }} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', minWidth: 20 }}>{catRiesgos.length}</span>
                  {altos > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#fee2e2', color: '#dc2626' }}>{altos} alto{altos > 1 ? 's' : ''}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {showModal && <ModalNuevoRiesgo idempresa={empresa.id} categorias={allCats} onClose={() => setShowModal(false)} onCreated={r => { setRiesgos(prev => [...prev, r]); setShowModal(false); showToast('✓ Riesgo registrado'); }} />}

      {editRiesgo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Editar Riesgo</h3>
              <button onClick={() => setEditRiesgo(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><IconX size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Categoría</label>
                <select value={editRiesgo.categoria} onChange={e => setEditRiesgo(prev => prev ? { ...prev, categoria: e.target.value } : prev)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                  {allCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Descripción</label>
                <textarea value={editRiesgo.descripcion} onChange={e => setEditRiesgo(prev => prev ? { ...prev, descripcion: e.target.value } : prev)} rows={3}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Probabilidad (1–5)</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setEditRiesgo(prev => prev ? { ...prev, probabilidad: n } : prev)}
                        style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid', borderColor: editRiesgo.probabilidad === n ? `hsl(${120 - n * 24},65%,45%)` : '#e2e8f0', background: editRiesgo.probabilidad === n ? `hsl(${120 - n * 24},65%,45%)` : 'white', color: editRiesgo.probabilidad === n ? 'white' : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{n}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Impacto (1–5)</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setEditRiesgo(prev => prev ? { ...prev, impacto: n } : prev)}
                        style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid', borderColor: editRiesgo.impacto === n ? `hsl(${120 - n * 24},65%,45%)` : '#e2e8f0', background: editRiesgo.impacto === n ? `hsl(${120 - n * 24},65%,45%)` : 'white', color: editRiesgo.impacto === n ? 'white' : '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Nivel resultante:</span>
                {(() => { const n = getNivel(editRiesgo.probabilidad, editRiesgo.impacto); const c = NIVEL_COLORS[n]; return <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 5, background: c.bg, color: c.color }}>{n}</span>; })()}
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>Score: {editRiesgo.probabilidad * editRiesgo.impacto}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setEditRiesgo(null)} style={{ padding: '9px 18px', borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} style={{ padding: '9px 18px', borderRadius: 7, border: 'none', background: '#185FA5', color: 'white', fontSize: 13, fontWeight: 600, cursor: savingEdit ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: savingEdit ? 0.7 : 1 }}>
                {savingEdit ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── MAIN ── */
export default function ModuloEstadoFinanciero() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [estados, setEstados] = useState<EstadoCuenta[]>([]);
  const [estadoSel, setEstadoSel] = useState<EstadoCuenta | null>(null);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!empresa) return;
    setKpis(null); setLoadingKpis(true);
    supabase.rpc('get_kpis_empresa', { p_idempresa: empresa.id })
      .then(({ data }) => { setKpis(data); setLoadingKpis(false); });
  }, [empresa]);

  useEffect(() => {
    if (!empresa) { setEstados([]); setEstadoSel(null); return; }
    setLoadingEstados(true);
    supabase.from('estadodecuenta')
      .select('id, nombre, descripcion, idcatalogo, created_at')
      .eq('idempresa', empresa.id).eq('estado', true).eq('user', user!.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const list = data ?? [];
        setEstados(list);
        setEstadoSel(list[0] ?? null);
        setLoadingEstados(false);
      });
  }, [empresa]);

  const handleExportar = async () => {
    if (!empresa || !estadoSel) return;
    setExportando(true);
    setExportProgress('Iniciando exportación...');
    try {
      await exportarPDF(empresa, estadoSel, user!.id, (msg) => setExportProgress(msg));
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert('Error al generar el PDF. Verifica la consola.');
    } finally {
      setExportando(false);
      setExportProgress(null);
    }
  };

  const TABS = [
    { id: 'overview', label: 'Resumen', icon: <IconGrid /> },
    { id: 'catalogo', label: 'Catálogo', icon: <IconBook /> },
    { id: 'vertical', label: 'Análisis Vertical', icon: <IconBarChart /> },
    { id: 'horizontal', label: 'Análisis Horizontal', icon: <IconTrend /> },
    { id: 'ratios', label: 'Ratios', icon: <IconFormula /> },
    { id: 'riesgo', label: 'Riesgo Operacional', icon: <IconShield /> },
  ];

  const MODULE_CARDS = [
    { icon: <IconBook />, color: '#185FA5', title: 'Catálogo de Cuentas', desc: 'Visualiza la estructura jerárquica completa del catálogo con todos sus valores por período.', stat1: { label: 'Cuentas', val: kpis?.total_cuentas.toString() ?? '…' }, stat2: { label: 'Estados', val: kpis?.total_estados.toString() ?? '…' }, tab: 'catalogo' },
    { icon: <IconBarChart />, color: '#7c3aed', title: 'Análisis Vertical', desc: 'Modo automático (cada grupo = 100%) o configura tú mismo la base del 100%.', stat1: { label: 'Último período', val: kpis?.anios?.[kpis.anios.length - 1] ?? '…' }, stat2: { label: 'Estado activo', val: estadoSel?.nombre?.slice(0, 16) ?? '…' }, tab: 'vertical' },
    { icon: <IconTrend />, color: '#16a34a', title: 'Análisis Horizontal', desc: 'Variación absoluta y porcentual entre dos períodos, agrupado por bloque (Activos, Pasivos…).', stat1: { label: 'Períodos', val: kpis?.anios?.length.toString() ?? '…' }, stat2: { label: 'Años', val: kpis?.anios?.join(' · ') ?? '…' }, tab: 'horizontal' },
    { icon: <IconFormula />, color: '#d97706', title: 'Ratios Financieros', desc: 'Fórmulas personalizadas creadas en el estado financiero. Resultados calculados automáticamente.', stat1: { label: 'Fórmulas', val: '—' }, stat2: { label: 'Fuente', val: 'Mis análisis' }, tab: 'ratios' },
    { icon: <IconShield />, color: '#dc2626', title: 'Riesgo Operacional', desc: 'Registro mensual de riesgos, frecuencias, mapa de calor y matriz de probabilidad × impacto.', stat1: { label: 'Mes', val: new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) }, stat2: { label: 'Categorías', val: '4+' }, tab: 'riesgo' },
  ];

  return (
    <div className={styles.root}>
      {exportando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '28px 36px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', minWidth: 300 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
              <IconDownload size={22} />
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Generando PDF...</p>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{exportProgress ?? 'Procesando datos...'}</p>
          </div>
        </div>
      )}

      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.headerTitle}>Estado Financiero</h1>
            <p className={styles.headerSub}>
              {empresa ? `${TIPO_ICONS[empresa.tipo_nombre] ?? '🏢'} ${empresa.nombre} · ${empresa.tipo_nombre}` : 'Selecciona una empresa para comenzar'}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {empresa && estados.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Estado:</span>
              <select value={estadoSel?.id ?? ''} onChange={e => setEstadoSel(estados.find(ec => ec.id === Number(e.target.value)) ?? null)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#1e293b', background: 'white', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', maxWidth: 220 }}>
                {estados.map(ec => <option key={ec.id} value={ec.id}>{ec.nombre}</option>)}
              </select>
            </div>
          )}
          {empresa && estadoSel && (
            <button className={styles.btnOutline} onClick={handleExportar} disabled={exportando}
              style={{ opacity: exportando ? 0.7 : 1, cursor: exportando ? 'not-allowed' : 'pointer' }}>
              <IconDownload /> Exportar PDF
            </button>
          )}
          <EmpresaSelector user={user!.id} selected={empresa} onSelect={e => { setEmpresa(e); setActiveTab('overview'); }} />
        </div>
      </div>

      {!empresa ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#94a3b8', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5' }}><IconBuilding size={36} /></div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Selecciona una empresa</h2>
          <p style={{ margin: 0, maxWidth: 380, lineHeight: 1.6, fontSize: 14, color: '#64748b' }}>Haz clic en <strong>"Seleccionar empresa"</strong> arriba a la derecha para ver sus análisis financieros.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            <IconAlert size={13} /> Si no tienes empresas, créalas en <strong>"Mis análisis"</strong>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.kpiStrip}>
            {loadingKpis ? Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.kpi} style={{ background: '#f1f5f9', borderRadius: 4, height: 56 }} />)
              : [
                { label: 'Estados Financieros', value: kpis?.total_estados.toString() ?? '0' },
                { label: 'Cuentas en Catálogo', value: kpis?.total_cuentas.toString() ?? '0' },
                { label: 'Estado activo', value: estadoSel?.nombre ?? '—' },
                { label: 'Períodos', value: kpis?.anios?.join(' · ') ?? '—' },
              ].map(k => (
                <div key={k.label} className={styles.kpi}>
                  <span className={styles.kpiLabel}>{k.label}</span>
                  <span className={styles.kpiValue} style={{ fontSize: k.value.length > 14 ? 13 : 18 }}>{k.value}</span>
                </div>
              ))}
          </div>
          <nav className={styles.nav}>
            {TABS.map(t => <button key={t.id} className={`${styles.navTab}${activeTab === t.id ? ` ${styles.active}` : ''}`} onClick={() => setActiveTab(t.id)}>{t.icon}<span>{t.label}</span></button>)}
          </nav>
          <main className={styles.main}>
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {MODULE_CARDS.map(mod => (
                  <button key={mod.title} className={styles.moduleCard} onClick={() => setActiveTab(mod.tab)}>
                    <div className={styles.moduleIcon} style={{ color: mod.color, background: `${mod.color}18` }}>{mod.icon}</div>
                    <div className={styles.moduleBody}>
                      <h3>{mod.title}</h3>
                      <p>{mod.desc}</p>
                      <div className={styles.moduleStats}>
                        <div className={styles.moduleStat}><span style={{ fontSize: 15, fontWeight: 700, color: mod.color }}>{mod.stat1.val}</span><span style={{ fontSize: 10, color: '#9ca3af' }}>{mod.stat1.label}</span></div>
                        <div className={styles.moduleStat}><span style={{ fontSize: 15, fontWeight: 700, color: mod.color }}>{mod.stat2.val}</span><span style={{ fontSize: 10, color: '#9ca3af' }}>{mod.stat2.label}</span></div>
                      </div>
                    </div>
                    <span className={styles.moduleArrow}><IconArrowRight /></span>
                  </button>
                ))}
              </div>
            )}
            {estadoSel && activeTab === 'catalogo' && <TabCatalogo empresa={empresa} estadoOverride={estadoSel} />}
            {estadoSel && activeTab === 'vertical' && <TabVertical empresa={empresa} estadoOverride={estadoSel} />}
            {estadoSel && activeTab === 'horizontal' && <TabHorizontal empresa={empresa} estadoOverride={estadoSel} />}
            {estadoSel && activeTab === 'ratios' && <TabRatios empresa={empresa} estadoOverride={estadoSel} />}
            {activeTab === 'riesgo' && <TabRiesgo empresa={empresa} />}
            {!estadoSel && activeTab !== 'riesgo' && activeTab !== 'overview' && <EmptyEstados />}
          </main>
        </>
      )}
    </div>
  );
}