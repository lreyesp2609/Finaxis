import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface EstadoCatalogo {
  idcatalogo: number;
  catalogo_nombre: string;
  idestadocuenta: number | null;
  orden: number;
}

interface ParticipanteInfo {
  id: number;
  display_name: string;
  email: string;
  calificacion: number;
  idsala: number;
  estados_por_catalogo: EstadoCatalogo[];
}

interface SalaInfo {
  id: number;
  codigosala: string;
  idcatalogo: number;
  fechainicio: string;
  fechafin: string;
}

interface ItemCat { id: number; nombre: string; codigo: string | null; contenedor: boolean; iditempadre: number | null; depth?: number; }
interface Anio { id: number; valor: string; }
interface ItemEstado { id: number; iditemcat: number; idanio: number; valor: number; }
type ValoresMap = Record<number, Record<number, ItemEstado>>;
interface FormulaToken { type: 'item' | 'operator' | 'number' | 'paren'; value: string; itemId?: number; }
interface FormulaActiva { id: number; nombre: string; descripcion: string | null; codigo: { tokens: FormulaToken[] }; source: 'personal' | 'catalogo'; }

function IconBack({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function IconStar({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>; }
function IconFunction({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="3" y1="12" x2="15" y2="12" /></svg>; }
function IconUser({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function IconCatIcon({ size = 11 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>; }
function IconCheck({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function IconX({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function IconEdit({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function IconBook({ size = 12 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>; }

function flattenWithDepth(items: ItemCat[], parentId: number | null = null, depth = 0): ItemCat[] {
  const result: ItemCat[] = [];
  for (const item of items) { if (item.iditempadre === parentId) { result.push({ ...item, depth }); result.push(...flattenWithDepth(items, item.id, depth + 1)); } }
  return result;
}
function formatNumber(val: number): string { if (val === 0) return '—'; return new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val); }
function formatDateTime(iso: string) { return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function evaluateFormula(tokens: FormulaToken[], valoresMap: ValoresMap, anioId: number): number | null {
  let expr = '';
  for (const token of tokens) { if (token.type === 'item') { if (token.itemId === undefined) return null; expr += valoresMap[token.itemId]?.[anioId]?.valor ?? 0; } else if (token.type === 'operator') { const op = token.value === '−' ? '-' : token.value === '×' ? '*' : token.value === '÷' ? '/' : token.value; expr += ` ${op} `; } else { expr += token.value; } }
  try { const result = Function(`"use strict"; return (${expr})`)(); if (typeof result !== 'number' || !isFinite(result)) return null; return result; } catch { return null; }
}
function TokenPreview({ token }: { token: FormulaToken }) {
  if (token.type === 'item') return <span className="vp-token vp-token-item">{token.value}</span>;
  if (token.type === 'operator') return <span className="vp-token vp-token-op">{token.value}</span>;
  if (token.type === 'number') return <span className="vp-token vp-token-num">{token.value}</span>;
  if (token.type === 'paren') return <span className="vp-token vp-token-paren">{token.value}</span>;
  return null;
}

/* ── Sheet por catálogo ── */
function CatalogSheetView({ estado, idcatalogo }: { estado: EstadoCatalogo; idcatalogo: number }) {
  const [items, setItems] = useState<ItemCat[]>([]);
  const [anios, setAnios] = useState<Anio[]>([]);
  const [valoresMap, setValoresMap] = useState<ValoresMap>({});
  const [formulas, setFormulas] = useState<FormulaActiva[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [panelVisible, setPanelVisible] = useState(true);

  const estadoId = estado.idestadocuenta;
  const COL_WIDTH = 140, LABEL_WIDTH = 300;

  useEffect(() => {
    if (!estadoId) { setLoaded(true); return; }
    async function load() {
      const { data: rawItems } = await supabase.from('itemcat').select('id, nombre, codigo, contenedor, iditempadre').eq('idcatalogo', idcatalogo).order('id');
      setItems(flattenWithDepth(rawItems ?? []));
      const { data: rawAnios } = await supabase.from('anioestado').select('id, valor').eq('idestadocuenta', estadoId).order('valor');
      setAnios(rawAnios ?? []);
      const { data: rawValores } = await supabase.from('itemestado').select('id, iditemcat, idanio, valor').eq('idestadocuenta', estadoId);
      const map: ValoresMap = {};
      for (const v of rawValores ?? []) { if (!map[v.iditemcat]) map[v.iditemcat] = {}; map[v.iditemcat][v.idanio] = v; }
      setValoresMap(map);
      const { data: rawFp } = await supabase.from('formulapersonal').select('id, nombre, descripcion, codigo').eq('idestadocuenta', estadoId).order('created_at');
      const personales: FormulaActiva[] = (rawFp ?? []).map((r: any) => ({ id: r.id, nombre: r.nombre, descripcion: r.descripcion, codigo: r.codigo, source: 'personal' }));
      const { data: rawFec } = await supabase.from('formulaec').select('id, formula:idformula(id, nombre, descripcion, codigo)').eq('idestadocuenta', estadoId);
      const catF: FormulaActiva[] = (rawFec ?? []).map((r: any) => ({ id: r.formula.id, nombre: r.formula.nombre, descripcion: r.formula.descripcion, codigo: r.formula.codigo, source: 'catalogo' }));
      setFormulas([...personales, ...catF]);
      setLoaded(true);
    }
    load();
  }, [estadoId, idcatalogo]);

  if (!loaded) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}><div className="vp-spinner-lg" /></div>;
  if (!estadoId) return <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}><p style={{ fontSize: 14 }}>Sin estado de cuenta para este catálogo.</p></div>;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      <div className="vp-table-wrap">
        <div className="vp-table" style={{ minWidth: LABEL_WIDTH + anios.length * COL_WIDTH + 48 }}>
          <div className="vp-thead">
            <div className="vp-th-label" style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}><span className="vp-th-text">Cuenta</span></div>
            {anios.map(anio => (<div key={anio.id} className="vp-th-anio" style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}><span className="vp-anio-valor">{anio.valor}</span></div>))}
            <div style={{ width: 48, minWidth: 48 }}>
              <button className={`vp-panel-btn ${panelVisible ? 'vp-panel-btn-active' : ''}`} onClick={() => setPanelVisible(v => !v)} style={{ fontSize: 11, padding: '4px 8px' }}>
                {panelVisible ? 'Ocultar' : `Fórmulas${formulas.length > 0 ? ` (${formulas.length})` : ''}`}
              </button>
            </div>
          </div>
          <div className="vp-tbody">
            {items.length === 0 ? <div className="vp-empty">Sin ítems en el catálogo</div>
              : items.map(item => {
                const isGroup = item.contenedor; const depth = item.depth ?? 0;
                const tieneValores = anios.some(a => { const c = valoresMap[item.id]?.[a.id]; return c && c.valor !== 0; });
                return (
                  <div key={item.id} className={`vp-row ${isGroup ? 'vp-row-group' : ''} ${tieneValores ? 'vp-row-filled' : ''}`}>
                    <div className="vp-cell-label" style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, paddingLeft: 16 + depth * 20 }}>
                      {item.codigo && <span className="vp-item-code">{item.codigo}</span>}
                      <span className={`vp-item-nombre ${isGroup ? 'vp-item-nombre-group' : ''}`}>{item.nombre}</span>
                    </div>
                    {anios.map(anio => {
                      const val = valoresMap[item.id]?.[anio.id]?.valor ?? 0;
                      return (<div key={anio.id} className="vp-cell" style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}><span className={`vp-cell-value ${val !== 0 ? 'vp-cell-value-filled' : 'vp-cell-value-empty'} ${isGroup ? 'vp-cell-value-group' : ''}`}>{formatNumber(val)}</span></div>);
                    })}
                    <div style={{ width: 48, minWidth: 48 }} />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {panelVisible && (
        <div className="vp-formula-panel">
          <div className="vp-fp-header"><div className="vp-fp-title"><IconFunction size={14} /><span>Fórmulas</span>{formulas.length > 0 && <span className="vp-fp-count">{formulas.length}</span>}</div></div>
          {formulas.length === 0
            ? <div className="vp-fp-empty"><IconFunction size={28} /><p>Sin fórmulas</p><span>Este participante no usó fórmulas en este catálogo</span></div>
            : <div className="vp-fp-list">{formulas.map((formula, idx) => (
              <div key={idx} className="vp-fp-card">
                <div className="vp-fp-card-header">
                  <div className="vp-fp-card-icon"><IconFunction size={13} /></div>
                  <div className="vp-fp-card-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="vp-fp-card-nombre">{formula.nombre}</span><span className={`vp-fp-badge ${formula.source === 'personal' ? 'vp-fp-badge-personal' : 'vp-fp-badge-catalogo'}`}>{formula.source === 'personal' ? <><IconUser size={9} /> Personal</> : <><IconCatIcon size={9} /> Catálogo</>}</span></div>
                    {formula.descripcion && <span className="vp-fp-card-desc">{formula.descripcion}</span>}
                  </div>
                </div>
                <div className="vp-fp-expr">{formula.codigo.tokens.map((t, i) => <TokenPreview key={i} token={t} />)}</div>
                <div className="vp-fp-results">{anios.length === 0 ? <span className="vp-fp-no-anios">Sin años</span> : anios.map(anio => { const result = evaluateFormula(formula.codigo.tokens, valoresMap, anio.id); return (<div key={anio.id} className="vp-fp-result-row"><span className="vp-fp-result-anio">{anio.valor}</span><span className={`vp-fp-result-val ${result === null ? 'vp-fp-result-error' : result !== 0 ? 'vp-fp-result-nonzero' : ''}`}>{result === null ? 'Error' : formatNumber(result)}</span></div>); })}</div>
              </div>
            ))}</div>
          }
        </div>
      )}
    </div>
  );
}

export default function VerParticipante() {
  const { codigosala, participanteId } = useParams<{ codigosala: string; participanteId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participante, setParticipante] = useState<ParticipanteInfo | null>(null);
  const [sala, setSala] = useState<SalaInfo | null>(null);
  const [tabActivo, setTabActivo] = useState(0);

  // Calificación
  const [editingCalif, setEditingCalif] = useState(false);
  const [califVal, setCalifVal] = useState('');
  const [savingCalif, setSavingCalif] = useState(false);
  const [califError, setCalifError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSaveCalif = async () => {
    if (!participante) return;
    const num = parseFloat(califVal);
    if (isNaN(num) || num < 0 || num > 10) { setCalifError('Valor entre 0 y 10'); return; }
    setSavingCalif(true); setCalifError(null);
    const { error: err } = await supabase.from('participante').update({ calificacion: num }).eq('id', participante.id);
    setSavingCalif(false);
    if (err) { setCalifError('Error: ' + err.message); return; }
    setParticipante(prev => prev ? { ...prev, calificacion: num } : prev);
    setEditingCalif(false);
    showToast('✓ Calificación guardada');
  };

  useEffect(() => {
    if (!user || !codigosala || !participanteId) return;
    async function load() {
      setLoading(true);
      const { data: salaData, error: salaErr } = await supabase.from('sala').select('id, codigosala, idcatalogo, fechainicio, fechafin').eq('codigosala', codigosala!.toUpperCase()).eq('user', user!.id).single();
      if (salaErr || !salaData) { setError('No tienes permiso para ver esta sala.'); setLoading(false); return; }
      setSala(salaData);
      const { data: participantesData } = await supabase.rpc('get_participantes_sala', { p_idsala: salaData.id });
      const pData = (participantesData ?? []).find((p: any) => p.id === Number(participanteId));
      if (!pData) { setError('Participante no encontrado.'); setLoading(false); return; }
      setParticipante({
        id: pData.id,
        display_name: pData.display_name ?? pData.email ?? 'Participante',
        email: pData.email ?? '',
        calificacion: pData.calificacion ?? 0,
        idsala: pData.idsala,
        estados_por_catalogo: pData.estados_por_catalogo ?? [],
      });
      setLoading(false);
    }
    load();
  }, [user, codigosala, participanteId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="vp-spinner-lg" />
      <style>{`@keyframes vpSpin{to{transform:rotate(360deg)}}.vp-spinner-lg{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#185FA5;border-radius:50%;animation:vpSpin 0.7s linear infinite}`}</style>
    </div>
  );

  if (error) return (
    <>
      <style>{VP_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, color: '#64748b', textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Error</h2>
        <p style={{ margin: 0, maxWidth: 360 }}>{error}</p>
        <button className="vp-back-btn" onClick={() => navigate('/dashboard/salas')}>← Volver</button>
      </div>
    </>
  );

  if (!participante || !sala) return null;

  const estados = participante.estados_por_catalogo;
  const tabActualData = estados[tabActivo];

  return (
    <>
      <style>{VP_CSS}</style>
      {toast && <div className="vp-toast">{toast}</div>}

      {/* HEADER */}
      <div className="vp-header">
        <div className="vp-header-left">
          <button className="vp-back-btn" onClick={() => navigate('/dashboard/salas')}><IconBack size={15} /> Mis salas</button>
          <div className="vp-header-divider" />
          <div className="vp-participant-info">
            <div className="vp-avatar">{participante.display_name[0].toUpperCase()}</div>
            <div>
              <div className="vp-participant-name">{participante.display_name}</div>
              <div className="vp-participant-sub">Sala {sala.codigosala} · {formatDateTime(sala.fechainicio)} → {formatDateTime(sala.fechafin)}</div>
            </div>
          </div>
        </div>
        <div className="vp-header-right">
          {editingCalif ? (
            <div className="vp-calif-edit">
              <IconStar size={12} />
              <input className="vp-calif-input" type="number" min="0" max="10" step="0.1" placeholder="0–10" value={califVal} autoFocus onChange={e => { setCalifVal(e.target.value); setCalifError(null); }} onKeyDown={e => { if (e.key === 'Enter') handleSaveCalif(); if (e.key === 'Escape') setEditingCalif(false); }} />
              <span className="vp-calif-sep">/10</span>
              {califError && <span className="vp-calif-error">{califError}</span>}
              <button className="vp-calif-confirm" onClick={handleSaveCalif} disabled={savingCalif}>{savingCalif ? <span className="vp-spinner-xs" /> : <IconCheck size={11} />}</button>
              <button className="vp-calif-cancel" onClick={() => setEditingCalif(false)}><IconX size={11} /></button>
            </div>
          ) : (
            <button className="vp-calificacion-btn" onClick={() => { setCalifVal(participante.calificacion > 0 ? String(participante.calificacion) : ''); setCalifError(null); setEditingCalif(true); }} title="Calificar participante">
              <IconStar size={12} />
              {participante.calificacion > 0 ? <><span className="vp-calif-num">{participante.calificacion.toFixed(1)}</span><span className="vp-calif-sep">/10</span></> : <span className="vp-calif-placeholder">Calificar</span>}
              <IconEdit size={11} />
            </button>
          )}
          <div className="vp-readonly-badge">Solo lectura</div>
        </div>
      </div>

      {/* Pestañas de catálogos */}
      {estados.length > 1 && (
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: 'white', paddingLeft: 20, flexShrink: 0 }}>
          {estados.map((ec, idx) => (
            <button key={ec.idcatalogo} onClick={() => setTabActivo(idx)}
              style={{
                padding: '10px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none',
                borderBottom: tabActivo === idx ? '2px solid #185FA5' : '2px solid transparent',
                color: tabActivo === idx ? '#185FA5' : '#64748b',
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'color .15s',
              }}>
              <IconBook size={12} /> {ec.catalogo_nombre}
              {!ec.idestadocuenta && <span style={{ fontSize: 9, background: '#f3f4f6', color: '#94a3b8', padding: '1px 5px', borderRadius: 4 }}>vacío</span>}
            </button>
          ))}
        </div>
      )}

      {/* Contenido */}
      <div className="vp-body">
        {tabActualData ? (
          <CatalogSheetView
            key={tabActualData.idcatalogo}
            estado={tabActualData}
            idcatalogo={tabActualData.idcatalogo}
          />
        ) : estados.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p>Este participante no tiene catálogos asignados.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

const VP_CSS = `
@keyframes vpSpin { to { transform: rotate(360deg); } }
@keyframes vpSlideIn { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
.vp-toast { position:fixed; bottom:24px; right:24px; background:#059669; color:white; padding:11px 18px; border-radius:8px; font-size:13px; font-weight:600; box-shadow:0 4px 16px rgba(5,150,105,.25); z-index:2000; animation:vpSlideIn .25s ease; }
.vp-header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid #e2e8f0; background:white; gap:16px; flex-wrap:wrap; flex-shrink:0; position:sticky; top:0; z-index:20; }
.vp-header-left { display:flex; align-items:center; gap:12px; min-width:0; }
.vp-header-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.vp-header-divider { width:1px; height:28px; background:#e2e8f0; flex-shrink:0; }
.vp-back-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:7px; border:1px solid #e2e8f0; background:white; font-size:13px; font-weight:500; color:#64748b; cursor:pointer; transition:all .1s; white-space:nowrap; flex-shrink:0; font-family:inherit; }
.vp-back-btn:hover { border-color:#94a3b8; color:#1e293b; background:#f8fafc; }
.vp-participant-info { display:flex; align-items:center; gap:10px; min-width:0; }
.vp-avatar { width:34px; height:34px; border-radius:50%; background:#185FA5; color:white; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; flex-shrink:0; }
.vp-participant-name { font-size:15px; font-weight:700; color:#1e293b; }
.vp-participant-sub { font-size:11px; color:#94a3b8; }
.vp-calificacion-btn { display:inline-flex; align-items:center; gap:5px; background:#fef9c3; color:#854d0e; padding:5px 11px; border-radius:7px; font-size:12px; font-weight:700; border:1px solid #fde047; cursor:pointer; transition:all .15s; }
.vp-calificacion-btn:hover { background:#fef08a; border-color:#eab308; }
.vp-calif-num { font-size:14px; font-weight:800; }
.vp-calif-sep { font-size:10px; font-weight:400; opacity:.7; }
.vp-calif-placeholder { font-size:12px; font-weight:500; }
.vp-calif-edit { display:inline-flex; align-items:center; gap:6px; background:#fef9c3; border:1.5px solid #eab308; border-radius:8px; padding:5px 10px; }
.vp-calif-edit svg { color:#854d0e; flex-shrink:0; }
.vp-calif-input { width:56px; border:none; background:transparent; outline:none; font-size:14px; font-weight:700; color:#854d0e; text-align:center; font-family:inherit; -moz-appearance:textfield; }
.vp-calif-input::-webkit-outer-spin-button,.vp-calif-input::-webkit-inner-spin-button { -webkit-appearance:none; }
.vp-calif-error { font-size:11px; color:#dc2626; font-weight:500; white-space:nowrap; }
.vp-calif-confirm { display:flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:5px; border:1px solid #86efac; background:#f0fdf4; color:#15803d; cursor:pointer; padding:0; flex-shrink:0; }
.vp-calif-confirm:hover:not(:disabled) { background:#dcfce7; }
.vp-calif-confirm:disabled { opacity:.5; cursor:not-allowed; }
.vp-calif-cancel { display:flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:5px; border:1px solid #fca5a5; background:#fef2f2; color:#dc2626; cursor:pointer; padding:0; flex-shrink:0; }
.vp-calif-cancel:hover { background:#fee2e2; }
.vp-spinner-xs { display:inline-block; width:10px; height:10px; border:2px solid rgba(21,128,61,.3); border-top-color:#15803d; border-radius:50%; animation:vpSpin .7s linear infinite; }
.vp-readonly-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:#6b7280; background:#f3f4f6; border:1px solid #e5e7eb; padding:4px 10px; border-radius:7px; }
.vp-body { display:flex; flex:1; overflow:hidden; height:calc(100vh - 61px); }
.vp-table-wrap { flex:1; overflow:auto; background:#f8fafc; }
.vp-table { display:flex; flex-direction:column; background:white; border-right:1px solid #e2e8f0; }
.vp-thead { display:flex; align-items:stretch; background:#f8fafc; border-bottom:2px solid #e2e8f0; position:sticky; top:0; z-index:10; }
.vp-th-label { display:flex; align-items:center; padding:11px 16px; border-right:1px solid #e2e8f0; background:#f8fafc; position:sticky; left:0; z-index:11; }
.vp-th-text { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
.vp-th-anio { display:flex; align-items:center; justify-content:flex-end; padding:10px 12px; border-right:1px solid #e2e8f0; background:#f8fafc; }
.vp-anio-valor { font-size:13px; font-weight:700; color:#185FA5; }
.vp-tbody { display:flex; flex-direction:column; }
.vp-row { display:flex; align-items:stretch; border-bottom:1px solid #f1f5f9; transition:background .08s; }
.vp-row:hover { background:#fafbfc; }
.vp-row-group { background:#f8fafc; }
.vp-row-group:hover { background:#f1f5f9; }
.vp-row-filled { background:#f0fdf8 !important; }
.vp-row-filled:hover { background:#e6f9f2 !important; }
.vp-cell-label { display:flex; align-items:center; gap:7px; padding:8px 16px 8px 0; border-right:2px solid #e2e8f0; position:sticky; left:0; z-index:1; background:inherit; }
.vp-row-group .vp-cell-label { background:#f8fafc; }
.vp-row:hover .vp-cell-label { background:#fafbfc; }
.vp-row-group:hover .vp-cell-label { background:#f1f5f9; }
.vp-row-filled .vp-cell-label { background:#f0fdf8; }
.vp-row-filled:hover .vp-cell-label { background:#e6f9f2; }
.vp-item-code { font-size:10px; font-family:monospace; font-weight:700; color:#185FA5; background:#E6F1FB; padding:1px 5px; border-radius:4px; flex-shrink:0; }
.vp-item-nombre { font-size:13px; color:#1e293b; }
.vp-item-nombre-group { font-weight:700; color:#0f172a; }
.vp-cell { display:flex; align-items:center; justify-content:flex-end; padding:6px 12px; border-right:1px solid #f1f5f9; }
.vp-cell-value { font-size:13px; font-family:monospace; font-weight:500; }
.vp-cell-value-filled { color:#0f172a; font-weight:700; }
.vp-cell-value-group { font-weight:700; }
.vp-cell-value-empty { color:#cbd5e1; }
.vp-empty { padding:32px; text-align:center; font-size:13px; color:#94a3b8; }
.vp-formula-panel { width:300px; flex-shrink:0; border-left:1px solid #e2e8f0; display:flex; flex-direction:column; background:#f8fafc; overflow:hidden; }
.vp-fp-header { display:flex; align-items:center; justify-content:space-between; padding:11px 12px; border-bottom:1px solid #e2e8f0; background:white; flex-shrink:0; }
.vp-fp-title { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:#1e293b; }
.vp-fp-count { font-size:11px; font-weight:600; color:#185FA5; background:#E6F1FB; padding:1px 7px; border-radius:10px; }
.vp-fp-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:24px 16px; color:#94a3b8; text-align:center; }
.vp-fp-empty p { font-size:13px; font-weight:600; color:#64748b; margin:0; }
.vp-fp-empty span { font-size:11px; }
.vp-fp-list { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:8px; }
.vp-fp-card { background:white; border:1px solid #e2e8f0; border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:8px; }
.vp-fp-card-header { display:flex; align-items:flex-start; gap:8px; }
.vp-fp-card-icon { width:24px; height:24px; border-radius:6px; background:#E6F1FB; color:#185FA5; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.vp-fp-card-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
.vp-fp-card-nombre { font-size:12px; font-weight:700; color:#1e293b; }
.vp-fp-card-desc { font-size:11px; color:#94a3b8; }
.vp-fp-badge { display:inline-flex; align-items:center; gap:3px; font-size:9px; font-weight:700; padding:1px 5px; border-radius:8px; flex-shrink:0; }
.vp-fp-badge-personal { background:#f0fdf4; color:#15803d; border:1px solid #86efac; }
.vp-fp-badge-catalogo { background:#E6F1FB; color:#185FA5; border:1px solid #b5d4f4; }
.vp-fp-expr { display:flex; flex-wrap:wrap; gap:3px; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:5px 7px; min-height:28px; }
.vp-token { border-radius:4px; font-family:monospace; font-size:10px; font-weight:600; padding:2px 5px; }
.vp-token-item { background:#E6F1FB; color:#185FA5; }
.vp-token-op   { background:#fef9c3; color:#854d0e; }
.vp-token-num  { background:#f0fdf4; color:#15803d; }
.vp-token-paren { color:#94a3b8; background:none; }
.vp-fp-results { display:flex; flex-direction:column; gap:3px; border-top:1px solid #f1f5f9; padding-top:7px; }
.vp-fp-result-row { display:flex; align-items:center; justify-content:space-between; padding:4px 8px; border-radius:5px; background:#f8fafc; }
.vp-fp-result-anio { font-size:11px; font-weight:600; color:#64748b; }
.vp-fp-result-val { font-size:12px; font-weight:700; color:#94a3b8; font-family:monospace; }
.vp-fp-result-nonzero { color:#0f172a; }
.vp-fp-result-error { color:#dc2626; font-size:11px; }
.vp-fp-no-anios { font-size:11px; color:#94a3b8; text-align:center; padding:4px; }
.vp-panel-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 10px; border-radius:7px; border:1px solid #e2e8f0; background:white; font-size:12px; font-weight:500; color:#64748b; cursor:pointer; transition:all .15s; white-space:nowrap; }
.vp-panel-btn:hover { border-color:#185FA5; color:#185FA5; background:#f0f7ff; }
.vp-panel-btn-active { border-color:#b5d4f4; color:#185FA5; background:#f0f7ff; }
@media (max-width:768px) {
  .vp-body { flex-direction:column; }
  .vp-formula-panel { width:100%; height:280px; border-left:none; border-top:1px solid #e2e8f0; }
}
`;