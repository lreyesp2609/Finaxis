import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface SalaInfo {
  sala_id: number;
  codigosala: string;
  sala_nombre: string;
  idcatalogo: number;
  fechainicio: string;
  fechafin: string;
  finalizado: boolean;
  sala_cerrada: boolean;
  estado_id: number;
  participante_id: number;
  calificacion: number;
}

interface ItemCat {
  id: number;
  nombre: string;
  codigo: string | null;
  contenedor: boolean;
  iditempadre: number | null;
  depth?: number;
}

interface Anio {
  id: number;
  valor: string;
  idestadocuenta: number;
}

interface ItemEstado {
  id: number;
  iditemcat: number;
  idanio: number;
  valor: number;
  _dirty?: boolean;
}

type ValoresMap = Record<number, Record<number, ItemEstado>>;

interface FormulaToken {
  type: 'item' | 'operator' | 'number' | 'paren';
  value: string;
  itemId?: number;
}

interface FormulaCatalogo {
  source: 'catalogo';
  formulaecId: number;
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: { tokens: FormulaToken[] };
}

interface FormulaPersonal {
  source: 'personal';
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: { tokens: FormulaToken[] };
}

type FormulaActiva = FormulaCatalogo | FormulaPersonal;

function IconBack({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function IconPlus({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconSave({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function IconX({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconEdit({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconCheck({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconTrash({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function IconFunction({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="3" y1="12" x2="15" y2="12"/></svg>; }
function IconChevronRight({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>; }
function IconPanelClose({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/><polyline points="11 9 8 12 11 15"/></svg>; }
function IconPanelOpen({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/><polyline points="9 9 12 12 9 15"/></svg>; }
function IconDelete({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>; }
function IconSearch({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconUser({ size = 11 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconCatalogo({ size = 11 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function IconStar({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconLock({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }

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

function formatNumber(val: number): string {
  if (val === 0) return '—';
  return new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

function evaluateFormula(tokens: FormulaToken[], valoresMap: ValoresMap, anioId: number): number | null {
  let expr = '';
  for (const token of tokens) {
    if (token.type === 'item') {
      if (token.itemId === undefined) return null;
      expr += valoresMap[token.itemId]?.[anioId]?.valor ?? 0;
    } else if (token.type === 'operator') {
      const op = token.value === '−' ? '-' : token.value === '×' ? '*' : token.value === '÷' ? '/' : token.value;
      expr += ` ${op} `;
    } else {
      expr += token.value;
    }
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch { return null; }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TokenPreview({ token }: { token: FormulaToken }) {
  if (token.type === 'item')     return <span className="sp-token sp-token-item">{token.value}</span>;
  if (token.type === 'operator') return <span className="sp-token sp-token-op">{token.value}</span>;
  if (token.type === 'number')   return <span className="sp-token sp-token-num">{token.value}</span>;
  if (token.type === 'paren')    return <span className="sp-token sp-token-paren">{token.value}</span>;
  return null;
}

const OPERATORS = ['+', '−', '×', '÷', '(', ')'];

function MiniFormulaBuilder({ items, onSave, onCancel, saving }: {
  items: ItemCat[];
  onSave: (nombre: string, descripcion: string, tokens: FormulaToken[]) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tokens, setTokens] = useState<FormulaToken[]>([]);
  const [search, setSearch] = useState('');
  const [numberInput, setNumberInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filtered = items.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.codigo ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (item: ItemCat) => setTokens(p => [...p, { type: 'item', value: item.nombre, itemId: item.id }]);
  const addOp   = (op: string)   => setTokens(p => [...p, { type: op === '(' || op === ')' ? 'paren' : 'operator', value: op }]);
  const addNum  = () => {
    const n = numberInput.trim();
    if (!n || isNaN(Number(n))) return;
    setTokens(p => [...p, { type: 'number', value: n }]);
    setNumberInput('');
  };

  const handleSave = () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (tokens.length === 0) { setError('La fórmula no puede estar vacía'); return; }
    setError(null);
    onSave(nombre.trim(), descripcion.trim(), tokens);
  };

  return (
    <div className="sp-mfb">
      <div className="sp-mfb-header">
        <span className="sp-mfb-title">Nueva fórmula personal</span>
        <button className="sp-anio-icon-btn sp-anio-cancel" onClick={onCancel}><IconX size={11}/></button>
      </div>
      <input className="sp-mfb-input" placeholder="Nombre *" value={nombre} onChange={e => setNombre(e.target.value)}/>
      <input className="sp-mfb-input" placeholder="Descripción (opcional)" value={descripcion} onChange={e => setDescripcion(e.target.value)}/>
      <div className="sp-mfb-ops">
        {OPERATORS.map(op => <button key={op} className="sp-mfb-op-btn" onClick={() => addOp(op)}>{op}</button>)}
        <input className="sp-mfb-num-input" type="number" placeholder="Nro." value={numberInput}
          onChange={e => setNumberInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNum()}/>
        <button className="sp-mfb-num-add" onClick={addNum} disabled={!numberInput.trim()}>+</button>
      </div>
      <div className={`sp-mfb-canvas ${tokens.length === 0 ? 'sp-mfb-canvas-empty' : ''}`}>
        {tokens.length === 0
          ? <span className="sp-mfb-placeholder">Añade ítems y operadores…</span>
          : tokens.map((t, i) => (
              <span key={i} className={`sp-token sp-token-${t.type === 'item' ? 'item' : t.type === 'operator' ? 'op' : t.type === 'number' ? 'num' : 'paren'} sp-mfb-chip`}>
                {t.value}
                <button className="sp-mfb-chip-remove" onClick={() => setTokens(p => p.filter((_, j) => j !== i))}><IconX size={8}/></button>
              </span>
            ))
        }
      </div>
      {tokens.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: -4 }}>
          <button className="sp-mfb-undo" onClick={() => setTokens(p => p.slice(0, -1))}>↩</button>
          <button className="sp-mfb-undo" onClick={() => setTokens([])}><IconDelete size={11}/></button>
        </div>
      )}
      <div className="sp-mfb-search-wrap">
        <IconSearch size={11}/>
        <input className="sp-mfb-search" placeholder="Buscar ítem…" value={search} onChange={e => setSearch(e.target.value)}/>
      </div>
      <div className="sp-mfb-item-list">
        {filtered.length === 0
          ? <div className="sp-fp-empty">Sin ítems</div>
          : filtered.map(item => (
              <button key={item.id} className={`sp-mfb-item-btn ${item.contenedor ? 'sp-mfb-item-btn-group' : ''}`} onClick={() => addItem(item)}>
                {item.codigo && <span className="sp-item-code" style={{ fontSize: 9 }}>{item.codigo}</span>}
                <span style={{ flex: 1, textAlign: 'left', fontSize: 11 }}>{item.nombre}</span>
                <span style={{ color: '#185FA5', fontSize: 13, fontWeight: 700 }}>+</span>
              </button>
            ))
        }
      </div>
      {error && <p className="sp-mfb-error">{error}</p>}
      <div className="sp-mfb-footer">
        <button className="sp-anio-icon-btn sp-anio-cancel" style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }} onClick={onCancel}>Cancelar</button>
        <button className="sp-fp-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <span className="sp-spinner-xs"/> : <IconCheck size={12}/>} Guardar
        </button>
      </div>
    </div>
  );
}

function FormulaCard({ formula, anios, valoresMap, onRemove, readOnly }: {
  formula: FormulaActiva;
  anios: Anio[];
  valoresMap: ValoresMap;
  onRemove: () => void;
  readOnly: boolean;
}) {
  return (
    <div className="sp-fp-card">
      <div className="sp-fp-card-header">
        <div className="sp-fp-card-icon"><IconFunction size={13}/></div>
        <div className="sp-fp-card-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="sp-fp-card-nombre">{formula.nombre}</span>
            <span className={`sp-fp-source-badge ${formula.source === 'personal' ? 'sp-fp-source-personal' : 'sp-fp-source-catalogo'}`}>
              {formula.source === 'personal' ? <><IconUser size={9}/> Personal</> : <><IconCatalogo size={9}/> Catálogo</>}
            </span>
          </div>
          {formula.descripcion && <span className="sp-fp-card-desc">{formula.descripcion}</span>}
        </div>
        {!readOnly && (
          <button className="sp-fp-card-remove" onClick={onRemove}><IconTrash size={11}/></button>
        )}
      </div>
      <div className="sp-fp-expr">
        {formula.codigo.tokens.map((t, i) => <TokenPreview key={i} token={t}/>)}
      </div>
      <div className="sp-fp-results">
        {anios.length === 0
          ? <span className="sp-fp-no-anios">Sin años</span>
          : anios.map(anio => {
              const result = evaluateFormula(formula.codigo.tokens, valoresMap, anio.id);
              return (
                <div key={anio.id} className="sp-fp-result-row">
                  <span className="sp-fp-result-anio">{anio.valor}</span>
                  <span className={`sp-fp-result-val ${result === null ? 'sp-fp-result-error' : ''}`}>
                    {result === null ? 'Error' : formatNumber(result)}
                  </span>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

function FormulaPanel({ idcatalogo, estadoId, anios, valoresMap, items, formulasActivas, onAddPersonal, onAddCatalogo, onRemovePersonal, onRemoveCatalogo, onShowToast, readOnly }: {
  idcatalogo: number; estadoId: number;
  anios: Anio[]; valoresMap: ValoresMap; items: ItemCat[];
  formulasActivas: FormulaActiva[];
  onAddPersonal: (f: FormulaPersonal) => void;
  onAddCatalogo: (f: FormulaCatalogo) => void;
  onRemovePersonal: (id: number) => void;
  onRemoveCatalogo: (formulaecId: number) => void;
  onShowToast: (msg: string) => void;
  readOnly: boolean;
}) {
  const [view, setView] = useState<'list' | 'new' | 'picker'>('list');
  const [savingNew, setSavingNew] = useState(false);
  const [catFormulas, setCatFormulas] = useState<{ id: number; nombre: string; descripcion: string | null; codigo: { tokens: FormulaToken[] } }[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const [linkingId, setLinkingId] = useState<number | null>(null);

  const activosCatIds = new Set(formulasActivas.filter(f => f.source === 'catalogo').map(f => (f as FormulaCatalogo).id));

  useEffect(() => {
    if (view !== 'picker') return;
    setLoadingCat(true);
    supabase.from('formula').select('id, nombre, descripcion, codigo').eq('idcatalogo', idcatalogo).order('nombre')
      .then(({ data }) => { setCatFormulas((data ?? []) as typeof catFormulas); setLoadingCat(false); });
  }, [view, idcatalogo]);

  const handleSavePersonal = async (nombre: string, descripcion: string, tokens: FormulaToken[]) => {
    setSavingNew(true);
    const { data, error } = await supabase.from('formulapersonal')
      .insert({ idestadocuenta: estadoId, nombre, descripcion: descripcion || null, codigo: { tokens } })
      .select('id, nombre, descripcion, codigo').single();
    setSavingNew(false);
    if (error || !data) { onShowToast('Error: ' + (error?.message ?? '')); return; }
    onAddPersonal({ source: 'personal', id: data.id, nombre: data.nombre, descripcion: data.descripcion, codigo: data.codigo });
    setView('list');
    onShowToast(`✓ Fórmula "${nombre}" creada`);
  };

  const handleLink = async (f: typeof catFormulas[0]) => {
    setLinkingId(f.id);
    const { data, error } = await supabase.from('formulaec').insert({ idestadocuenta: estadoId, idformula: f.id }).select('id').single();
    setLinkingId(null);
    if (error || !data) { onShowToast('Error: ' + (error?.message ?? '')); return; }
    onAddCatalogo({ source: 'catalogo', formulaecId: data.id, id: f.id, nombre: f.nombre, descripcion: f.descripcion, codigo: f.codigo });
    onShowToast(`✓ "${f.nombre}" agregada`);
  };

  const handleUnlink = async (f: FormulaCatalogo) => {
    await supabase.from('formulaec').delete().eq('id', f.formulaecId);
    onRemoveCatalogo(f.formulaecId);
    onShowToast(`✓ "${f.nombre}" quitada`);
  };

  const handleDeletePersonal = async (f: FormulaPersonal) => {
    await supabase.from('formulapersonal').delete().eq('id', f.id);
    onRemovePersonal(f.id);
    onShowToast(`✓ "${f.nombre}" eliminada`);
  };

  const handleRemove = (f: FormulaActiva) => {
    if (f.source === 'personal') handleDeletePersonal(f);
    else handleUnlink(f);
  };

  return (
    <div className="sp-formula-panel">
      <div className="sp-fp-header">
        <div className="sp-fp-title">
          <IconFunction size={14}/>
          <span>Fórmulas</span>
          {formulasActivas.length > 0 && <span className="sp-fp-count">{formulasActivas.length}</span>}
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`sp-fp-new-btn ${view === 'new' ? 'sp-fp-btn-active' : ''}`} onClick={() => setView(v => v === 'new' ? 'list' : 'new')}><IconPlus size={11}/> Nueva</button>
            <button className={`sp-fp-add-btn ${view === 'picker' ? 'sp-fp-btn-active' : ''}`} onClick={() => setView(v => v === 'picker' ? 'list' : 'picker')}><IconCatalogo size={11}/> Catálogo</button>
          </div>
        )}
      </div>
      {!readOnly && view === 'new' && (
        <div className="sp-fp-builder-wrap">
          <MiniFormulaBuilder items={items} saving={savingNew} onSave={handleSavePersonal} onCancel={() => setView('list')}/>
        </div>
      )}
      {!readOnly && view === 'picker' && (
        <div className="sp-fp-picker">
          <div className="sp-fp-picker-title">Fórmulas del catálogo</div>
          {loadingCat ? <div className="sp-fp-empty">Cargando…</div>
            : catFormulas.length === 0 ? <div className="sp-fp-empty">No hay fórmulas en este catálogo</div>
            : catFormulas.map(f => {
                const yaActiva = activosCatIds.has(f.id);
                return (
                  <button key={f.id} className={`sp-fp-pick-item ${yaActiva ? 'sp-fp-pick-item-active' : ''}`}
                    onClick={() => {
                      if (yaActiva) {
                        const activa = formulasActivas.find(fa => fa.source === 'catalogo' && (fa as FormulaCatalogo).id === f.id) as FormulaCatalogo | undefined;
                        if (activa) handleUnlink(activa);
                      } else { handleLink(f); }
                    }}
                    disabled={linkingId === f.id}>
                    <div className="sp-fp-pick-info">
                      <span className="sp-fp-pick-nombre">{f.nombre}</span>
                      {f.descripcion && <span className="sp-fp-pick-desc">{f.descripcion}</span>}
                    </div>
                    {linkingId === f.id ? <span className="sp-spinner-xs"/> : yaActiva ? <span className="sp-fp-pick-remove"><IconX size={11}/></span> : <span className="sp-fp-pick-add"><IconChevronRight size={12}/></span>}
                  </button>
                );
              })
          }
          <button className="sp-fp-picker-close" onClick={() => setView('list')}><IconX size={11}/> Cerrar</button>
        </div>
      )}
      {formulasActivas.length === 0 && view === 'list' ? (
        <div className="sp-fp-empty-state">
          <IconFunction size={28}/>
          <p>Sin fórmulas activas</p>
          {!readOnly && <span>Crea una fórmula personal o agrega una del catálogo</span>}
        </div>
      ) : view === 'list' && (
        <div className="sp-fp-list">
          {formulasActivas.map((formula, idx) => (
            <FormulaCard key={idx} formula={formula} anios={anios} valoresMap={valoresMap}
              onRemove={() => handleRemove(formula)} readOnly={readOnly}/>
          ))}
        </div>
      )}
    </div>
  );
}

function SalaBanner({ sala }: { sala: SalaInfo }) {
  const isClosed = sala.sala_cerrada;
  return (
    <div className={`sp-sala-banner ${isClosed ? 'sp-sala-banner-closed' : 'sp-sala-banner-open'}`}>
      <div className="sp-sala-banner-left">
        {isClosed ? <IconLock size={14}/> : <div className="sp-sala-live-dot"/>}
        <span className="sp-sala-banner-name">{sala.sala_nombre}</span>
        <span className="sp-sala-banner-code">{sala.codigosala}</span>
        {isClosed && <span className="sp-sala-banner-tag">Sala cerrada — solo lectura</span>}
      </div>
      <div className="sp-sala-banner-right">
        {sala.calificacion > 0 && (
          <div className="sp-sala-calificacion">
            <IconStar size={12}/>
            <span>{sala.calificacion.toFixed(1)}</span>
            <span className="sp-sala-calificacion-max">/10</span>
          </div>
        )}
        <span className="sp-sala-banner-dates">
          {formatDateTime(sala.fechainicio)} → {formatDateTime(sala.fechafin)}
        </span>
      </div>
    </div>
  );
}

export default function SalaParticipante() {
  const { codigo } = useParams<{ codigo: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sala, setSala] = useState<SalaInfo | null>(null);
  const [items, setItems] = useState<ItemCat[]>([]);
  const [anios, setAnios] = useState<Anio[]>([]);
  const [valores, setValores] = useState<ValoresMap>({});
  const [draft, setDraft] = useState<ValoresMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formulasActivas, setFormulasActivas] = useState<FormulaActiva[]>([]);
  const [panelVisible, setPanelVisible] = useState(true);
  const [addingAnio, setAddingAnio] = useState(false);
  const [newAnioVal, setNewAnioVal] = useState('');
  const [savingAnio, setSavingAnio] = useState(false);
  const [editingAnioId, setEditingAnioId] = useState<number | null>(null);
  const [editingAnioVal, setEditingAnioVal] = useState('');
  const [confirmDeleteAnioId, setConfirmDeleteAnioId] = useState<number | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!codigo || !user) return;

    async function load() {
      setLoading(true);
      console.log('🚀 [load] iniciando carga para codigo:', codigo, 'user:', user!.id);

      const { data: acc, error: accErr } = await supabase.rpc('verificar_acceso_sala', {
        p_codigosala: codigo!.toUpperCase(),
        p_user_id: user!.id,
      });

      console.log('🔐 [acceso] data:', acc, '| error:', accErr);

      if (accErr || !acc || !acc.ok) {
        console.error('❌ [acceso] FALLO — acc.ok:', acc?.ok, '| acc.error:', acc?.error, '| accErr:', accErr);
        setAccessError(acc?.error ?? 'No tienes acceso a esta sala.');
        setLoading(false);
        return;
      }

      console.log('✅ [acceso] OK');
      console.log('🏠 [sala] sala_cerrada:', acc.sala_cerrada, '| finalizado:', acc.finalizado);
      console.log('📅 [sala] fechainicio:', acc.fechainicio, '| fechafin:', acc.fechafin, '| ahora:', new Date().toISOString());
      console.log('🔑 [sala] estado_id:', acc.estado_id, '| participante_id:', acc.participante_id);
      console.log('📋 [sala] idcatalogo:', acc.idcatalogo);

      const salaInfo: SalaInfo = {
        sala_id: acc.sala_id,
        codigosala: acc.codigosala,
        sala_nombre: acc.sala_nombre,
        idcatalogo: acc.idcatalogo,
        fechainicio: acc.fechainicio,
        fechafin: acc.fechafin,
        finalizado: acc.finalizado,
        sala_cerrada: acc.sala_cerrada,
        estado_id: acc.estado_id,
        participante_id: acc.participante_id,
        calificacion: acc.calificacion ?? 0,
      };
      setSala(salaInfo);

      const estadoId = salaInfo.estado_id;
      console.log('📌 [estado] usando estadoId:', estadoId);

      // 2. Items
      const { data: rawItems, error: itemsErr } = await supabase.from('itemcat')
        .select('id, nombre, codigo, contenedor, iditempadre')
        .eq('idcatalogo', salaInfo.idcatalogo).order('id');
      console.log('📦 [items] count:', rawItems?.length, '| error:', itemsErr);
      if (rawItems && rawItems.length > 0) {
        console.log('📦 [items] primer item:', rawItems[0]);
      } else {
        console.warn('⚠️ [items] VACÍO — idcatalogo usado:', salaInfo.idcatalogo);
      }
      const flatItems = flattenWithDepth(rawItems ?? []);
      console.log('📦 [items] después de flatten:', flatItems.length);
      setItems(flatItems);

      // 3. Años
      const { data: rawAnios, error: aniosErr } = await supabase.from('anioestado')
        .select('id, valor, idestadocuenta').eq('idestadocuenta', estadoId).order('valor');
      console.log('📅 [anios] count:', rawAnios?.length, '| error:', aniosErr);
      if (rawAnios && rawAnios.length > 0) {
        console.log('📅 [anios] data:', rawAnios);
      } else {
        console.warn('⚠️ [anios] VACÍO — estadoId usado:', estadoId);
      }
      setAnios(rawAnios ?? []);

      // 4. Valores
      const { data: rawValores, error: valoresErr } = await supabase.from('itemestado')
        .select('id, iditemcat, idanio, valor').eq('idestadocuenta', estadoId);
      console.log('💰 [valores] count:', rawValores?.length, '| error:', valoresErr);
      if (rawValores && rawValores.length > 0) {
        console.log('💰 [valores] primer valor:', rawValores[0]);
      } else {
        console.warn('⚠️ [valores] VACÍO — estadoId usado:', estadoId);
      }

      const map: ValoresMap = {};
      for (const v of rawValores ?? []) {
        if (!map[v.iditemcat]) map[v.iditemcat] = {};
        map[v.iditemcat][v.idanio] = v;
      }
      console.log('🗺️ [draft] keys (iditemcat):', Object.keys(map).length);
      setValores(map);
      setDraft(JSON.parse(JSON.stringify(map)));

      // 5. Fórmulas personales
      const { data: rawFp, error: fpErr } = await supabase.from('formulapersonal')
        .select('id, nombre, descripcion, codigo').eq('idestadocuenta', estadoId).order('created_at');
      console.log('🧮 [formulas personales] count:', rawFp?.length, '| error:', fpErr);
      const personales: FormulaPersonal[] = (rawFp ?? []).map((r: any) => ({
        source: 'personal', id: r.id, nombre: r.nombre, descripcion: r.descripcion, codigo: r.codigo,
      }));

      // 6. Fórmulas catálogo
      const { data: rawFec, error: fecErr } = await supabase.from('formulaec')
        .select('id, formula:idformula(id, nombre, descripcion, codigo)').eq('idestadocuenta', estadoId);
      console.log('🧮 [formulas catalogo] count:', rawFec?.length, '| error:', fecErr);
      const catFormulas: FormulaCatalogo[] = (rawFec ?? []).map((r: any) => ({
        source: 'catalogo', formulaecId: r.id,
        id: r.formula.id, nombre: r.formula.nombre,
        descripcion: r.formula.descripcion, codigo: r.formula.codigo,
      }));

      setFormulasActivas([...personales, ...catFormulas]);

      console.log('✅ [load] carga completada — items:', flatItems.length, '| anios:', rawAnios?.length, '| valores:', rawValores?.length);
      setLoading(false);
    }

    load();
  }, [codigo, user]);

  useEffect(() => {
    if (!sala || sala.sala_cerrada) return;
    const interval = setInterval(() => {
      const now = new Date();
      if (now > new Date(sala.fechafin) || sala.finalizado) {
        setSala(s => s ? { ...s, sala_cerrada: true } : s);
        showToast('⏰ La sala ha cerrado. Ahora estás en modo solo lectura.');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sala]);

  const readOnly = sala?.sala_cerrada ?? true;

  // ── LOG EN CADA RENDER ──
  console.log('🎨 [RENDER] loading:', loading, '| accessError:', accessError, '| sala:', !!sala);
  if (sala) {
    console.log('🎨 [RENDER] readOnly:', readOnly, '| sala_cerrada:', sala.sala_cerrada, '| finalizado:', sala.finalizado);
    console.log('🎨 [RENDER] items.length:', items.length, '| anios.length:', anios.length, '| draft keys:', Object.keys(draft).length);
    console.log('🎨 [RENDER] fechafin:', sala.fechafin, '| ahora:', new Date().toISOString(), '| expirada:', new Date() > new Date(sala.fechafin));
  }

  const handleValueChange = (iditemcat: number, idanio: number, raw: string) => {
    if (readOnly) return;
    const num = raw === '' ? 0 : parseFloat(raw.replace(/,/g, '.')) || 0;
    setDraft(prev => {
      const next = { ...prev };
      if (!next[iditemcat]) next[iditemcat] = {};
      next[iditemcat] = { ...next[iditemcat], [idanio]: { ...((prev[iditemcat]?.[idanio]) ?? { id: -1, iditemcat, idanio, valor: 0 }), valor: num, _dirty: true } };
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!sala || readOnly) return;
    setSaving(true);
    const estadoId = sala.estado_id;
    const items_valores: { id: number; iditemcat: number; idanio: number; valor: number }[] = [];
    for (const iditemcat of Object.keys(draft)) {
      for (const idanio of Object.keys(draft[+iditemcat])) {
        const d = draft[+iditemcat][+idanio];
        if (!d._dirty) continue;
        items_valores.push({ id: d.id > 0 ? d.id : -1, iditemcat: +iditemcat, idanio: +idanio, valor: d.valor });
      }
    }
    if (items_valores.length === 0) { setSaving(false); return; }
    const { error } = await supabase.rpc('guardar_valores_estado', { p_idestadocuenta: estadoId, p_valores: items_valores });
    if (error) { showToast('⚠ Error al guardar: ' + error.message); }
    else {
      setDraft(prev => { const n = { ...prev }; for (const k of Object.keys(n)) for (const k2 of Object.keys(n[+k])) n[+k][+k2] = { ...n[+k][+k2], _dirty: false }; return n; });
      setValores(JSON.parse(JSON.stringify(draft)));
      setDirty(false);
      showToast('✓ Cambios guardados');
    }
    setSaving(false);
  };

  const handleDiscard = () => { setDraft(JSON.parse(JSON.stringify(valores))); setDirty(false); };

  const handleAddAnio = async () => {
    if (!sala || readOnly) return;
    if (!newAnioVal.trim() || anios.some(a => a.valor === newAnioVal.trim())) { showToast('Ya existe ese año'); return; }
    setSavingAnio(true);
    const { data: nuevoId, error } = await supabase.rpc('agregar_anio_estado', { p_idestadocuenta: sala.estado_id, p_valor: newAnioVal.trim() });
    if (error || !nuevoId) { showToast('Error: ' + (error?.message ?? '')); setSavingAnio(false); return; }
    const nuevoAnio: Anio = { id: nuevoId, valor: newAnioVal.trim(), idestadocuenta: sala.estado_id };
    setAnios(prev => [...prev, nuevoAnio].sort((a, b) => a.valor.localeCompare(b.valor)));
    setDraft(prev => { const n = { ...prev }; for (const item of items) { if (!n[item.id]) n[item.id] = {}; n[item.id][nuevoId] = { id: -1, iditemcat: item.id, idanio: nuevoId, valor: 0 }; } return n; });
    setAddingAnio(false); setNewAnioVal(''); setSavingAnio(false);
    showToast(`✓ Año ${newAnioVal.trim()} agregado`);
  };

  const handleSaveAnioNombre = async (id: number) => {
    if (!sala || readOnly) return;
    if (!editingAnioVal.trim()) return;
    const { error } = await supabase.from('anioestado').update({ valor: editingAnioVal.trim() }).eq('id', id);
    if (error) { showToast('Error: ' + error.message); return; }
    setAnios(prev => prev.map(a => a.id === id ? { ...a, valor: editingAnioVal.trim() } : a));
    setEditingAnioId(null); showToast('✓ Año actualizado');
  };

  const handleDeleteAnio = async (id: number) => {
    if (!sala || readOnly) return;
    await supabase.from('itemestado').delete().eq('idanio', id);
    const { error } = await supabase.from('anioestado').delete().eq('id', id);
    if (error) { showToast('Error: ' + error.message); return; }
    setAnios(prev => prev.filter(a => a.id !== id));
    setDraft(prev => { const n = { ...prev }; for (const k of Object.keys(n)) { const { [id]: _, ...rest } = n[+k]; n[+k] = rest; } return n; });
    setConfirmDeleteAnioId(null); showToast('✓ Año eliminado');
  };

  const dirtyCount = Object.values(draft).reduce((acc, byAnio) => acc + Object.values(byAnio).filter(v => v._dirty).length, 0);
  const COL_WIDTH = 140, LABEL_WIDTH = 300;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="sp-spinner-lg"/>
      <style>{`@keyframes spSpin{to{transform:rotate(360deg)}}.sp-spinner-lg{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#185FA5;border-radius:50%;animation:spSpin 0.7s linear infinite}`}</style>
    </div>
  );

  if (accessError) return (
    <>
      <style>{SP_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, color: '#64748b', textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Sin acceso</h2>
        <p style={{ margin: 0, maxWidth: 360 }}>{accessError}</p>
        <button className="sp-back-btn" onClick={() => navigate('/dashboard/salas')}>← Volver a salas</button>
      </div>
    </>
  );

  if (!sala) return null;

  return (
    <>
      <style>{SP_CSS}</style>
      {toast && <div className="sp-toast">{toast}</div>}

      <SalaBanner sala={sala}/>

      <div className="sp-page-header">
        <div className="sp-header-left">
          <button className="sp-back-btn" onClick={() => navigate('/dashboard/salas')}><IconBack size={16}/> Mis salas</button>
          <div className="sp-header-info">
            <h1 className="sp-title">{sala.sala_nombre}</h1>
            <span className="sp-subtitle">Mi análisis · Sala {sala.codigosala}</span>
          </div>
        </div>
        <div className="sp-header-actions">
          {dirty && !readOnly && (
            <>
              <span className="sp-dirty-badge">{dirtyCount} cambio{dirtyCount !== 1 ? 's' : ''} pendiente{dirtyCount !== 1 ? 's' : ''}</span>
              <button className="sp-discard-btn" onClick={handleDiscard} disabled={saving}><IconX size={13}/> Descartar</button>
              <button className="sp-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="sp-spinner"/> Guardando…</> : <><IconSave size={14}/> Guardar</>}
              </button>
            </>
          )}
          {readOnly && (
            <div className="sp-readonly-badge"><IconLock size={11}/> Solo lectura</div>
          )}
          <button className={`sp-panel-toggle-btn ${panelVisible ? 'sp-panel-toggle-btn-active' : ''}`} onClick={() => setPanelVisible(v => !v)}>
            {panelVisible ? <IconPanelClose size={15}/> : <IconPanelOpen size={15}/>}
            <span>{panelVisible ? 'Ocultar' : 'Fórmulas'}</span>
            {!panelVisible && formulasActivas.length > 0 && <span className="sp-panel-toggle-count">{formulasActivas.length}</span>}
          </button>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-table-wrap">
          <div className="sp-table" style={{ minWidth: LABEL_WIDTH + anios.length * COL_WIDTH + 200 }}>
            <div className="sp-thead">
              <div className="sp-th-label" style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}>
                <span className="sp-th-label-text">Cuenta</span>
              </div>
              {anios.map(anio => (
                <div key={anio.id} className="sp-th-anio" style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}>
                  {!readOnly && editingAnioId === anio.id ? (
                    <div className="sp-anio-edit-wrap">
                      <input className="sp-anio-edit-input" value={editingAnioVal} onChange={e => setEditingAnioVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveAnioNombre(anio.id); if (e.key === 'Escape') setEditingAnioId(null); }} autoFocus/>
                      <button className="sp-anio-icon-btn sp-anio-confirm" onClick={() => handleSaveAnioNombre(anio.id)}><IconCheck size={11}/></button>
                      <button className="sp-anio-icon-btn sp-anio-cancel" onClick={() => setEditingAnioId(null)}><IconX size={11}/></button>
                    </div>
                  ) : !readOnly && confirmDeleteAnioId === anio.id ? (
                    <div className="sp-anio-confirm-delete">
                      <span>¿Eliminar?</span>
                      <button className="sp-anio-icon-btn sp-anio-danger" onClick={() => handleDeleteAnio(anio.id)}><IconCheck size={11}/></button>
                      <button className="sp-anio-icon-btn sp-anio-cancel" onClick={() => setConfirmDeleteAnioId(null)}><IconX size={11}/></button>
                    </div>
                  ) : (
                    <div className="sp-anio-header-row">
                      <span className="sp-anio-valor">{anio.valor}</span>
                      {!readOnly && (
                        <div className="sp-anio-btns">
                          <button className="sp-anio-icon-btn" onClick={() => { setEditingAnioId(anio.id); setEditingAnioVal(anio.valor); }}><IconEdit size={11}/></button>
                          <button className="sp-anio-icon-btn sp-anio-danger-soft" onClick={() => setConfirmDeleteAnioId(anio.id)}><IconTrash size={11}/></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="sp-th-add" style={{ width: (!readOnly && addingAnio) ? 220 : 48, minWidth: (!readOnly && addingAnio) ? 220 : 48 }}>
                {!readOnly && addingAnio ? (
                  <div className="sp-add-anio-form">
                    <input className="sp-add-anio-input" placeholder="Ej: 2025" value={newAnioVal}
                      onChange={e => setNewAnioVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddAnio(); if (e.key === 'Escape') { setAddingAnio(false); setNewAnioVal(''); } }}
                      autoFocus disabled={savingAnio}/>
                    <button className="sp-anio-icon-btn sp-anio-confirm" onClick={handleAddAnio} disabled={savingAnio || !newAnioVal.trim()}>
                      {savingAnio ? <span className="sp-spinner-xs"/> : <IconCheck size={11}/>}
                    </button>
                    <button className="sp-anio-icon-btn sp-anio-cancel" onClick={() => { setAddingAnio(false); setNewAnioVal(''); }}><IconX size={11}/></button>
                  </div>
                ) : !readOnly ? (
                  <button className="sp-add-anio-btn" onClick={() => setAddingAnio(true)}><IconPlus size={13}/></button>
                ) : <div style={{ width: 48 }}/>}
              </div>
            </div>

            <div className="sp-tbody">
              {/* LOG tbody render */}
              {(() => { console.log('🔄 [TBODY] renderizando — items:', items.length, '| anios:', anios.length); return null; })()}
              {items.length === 0 && (
                <div style={{ padding: 24, color: '#94a3b8', fontSize: 13 }}>
                  ⚠️ DEBUG: items vacío
                </div>
              )}
              {anios.length === 0 && items.length > 0 && (
                <div style={{ padding: 24, color: '#94a3b8', fontSize: 13 }}>
                  ⚠️ DEBUG: anios vacío (hay {items.length} items pero sin columnas de año)
                </div>
              )}
              {items.map(item => {
                const isGroup = item.contenedor;
                const depth = item.depth ?? 0;
                return (
                  <div key={item.id} className={`sp-row ${isGroup ? 'sp-row-group' : 'sp-row-item'}`}>
                    <div className="sp-cell-label" style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, paddingLeft: 16 + depth * 20 }}>
                      {item.codigo && <span className="sp-item-code">{item.codigo}</span>}
                      <span className={`sp-item-nombre ${isGroup ? 'sp-item-nombre-group' : ''}`}>{item.nombre}</span>
                    </div>
                    {anios.map(anio => {
                      const cell = draft[item.id]?.[anio.id];
                      const val = cell?.valor ?? 0;
                      return (
                        <div key={anio.id} className={`sp-cell ${cell?._dirty ? 'sp-cell-dirty' : ''} ${isGroup ? 'sp-cell-group' : ''}`} style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}>
                          <input
                            className={`sp-cell-input ${isGroup ? 'sp-cell-input-group' : ''} ${readOnly ? 'sp-cell-input-readonly' : ''}`}
                            type="number" step="0.01"
                            value={val === 0 ? '' : val}
                            placeholder={readOnly ? '—' : '0.00'}
                            onChange={e => handleValueChange(item.id, anio.id, e.target.value)}
                            readOnly={readOnly}
                          />
                        </div>
                      );
                    })}
                    <div className="sp-cell-spacer" style={{ width: (!readOnly && addingAnio) ? 220 : 48, minWidth: (!readOnly && addingAnio) ? 220 : 48 }}/>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {panelVisible && sala && (
          <FormulaPanel
            idcatalogo={sala.idcatalogo}
            estadoId={sala.estado_id}
            anios={anios}
            valoresMap={draft}
            items={items}
            formulasActivas={formulasActivas}
            onAddPersonal={f => setFormulasActivas(prev => [...prev, f])}
            onAddCatalogo={f => setFormulasActivas(prev => [...prev, f])}
            onRemovePersonal={id => setFormulasActivas(prev => prev.filter(f => !(f.source === 'personal' && f.id === id)))}
            onRemoveCatalogo={fecId => setFormulasActivas(prev => prev.filter(f => !(f.source === 'catalogo' && (f as FormulaCatalogo).formulaecId === fecId)))}
            onShowToast={showToast}
            readOnly={readOnly}
          />
        )}
      </div>
    </>
  );
}

const SP_CSS = `
@keyframes spSpin    { to { transform: rotate(360deg); } }
@keyframes spSlideIn { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes spFadeIn  { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
@keyframes spPulse   { 0%,100% { opacity:1 } 50% { opacity:.4 } }
.sp-sala-banner { display:flex; align-items:center; justify-content:space-between; padding:8px 20px; gap:12px; flex-shrink:0; flex-wrap:wrap; font-size:12px; }
.sp-sala-banner-open   { background:#f0fdf4; border-bottom:1px solid #86efac; }
.sp-sala-banner-closed { background:#f8fafc; border-bottom:1px solid #e2e8f0; }
.sp-sala-banner-left  { display:flex; align-items:center; gap:10px; }
.sp-sala-banner-right { display:flex; align-items:center; gap:12px; }
.sp-sala-live-dot { width:8px; height:8px; border-radius:50%; background:#22c55e; animation:spPulse 1.5s ease infinite; flex-shrink:0; }
.sp-sala-banner-name  { font-weight:700; color:#1e293b; }
.sp-sala-banner-code  { font-family:monospace; font-weight:700; color:#185FA5; background:#E6F1FB; padding:2px 8px; border-radius:5px; letter-spacing:.1em; }
.sp-sala-banner-tag   { font-size:11px; font-weight:600; color:#6b7280; background:#f3f4f6; padding:2px 8px; border-radius:5px; }
.sp-sala-banner-dates { font-size:11px; color:#94a3b8; }
.sp-sala-calificacion { display:inline-flex; align-items:center; gap:4px; background:#fef9c3; color:#854d0e; padding:3px 9px; border-radius:7px; font-size:12px; font-weight:700; }
.sp-sala-calificacion-max { font-size:10px; font-weight:400; opacity:.7; }
.sp-page-header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid #e2e8f0; background:white; gap:16px; flex-wrap:wrap; flex-shrink:0; position:sticky; top:0; z-index:20; }
.sp-header-left { display:flex; align-items:center; gap:12px; min-width:0; }
.sp-back-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:7px; border:1px solid #e2e8f0; background:white; font-size:13px; font-weight:500; color:#64748b; cursor:pointer; transition:all .1s; white-space:nowrap; flex-shrink:0; font-family:inherit; }
.sp-back-btn:hover { border-color:#94a3b8; color:#1e293b; background:#f8fafc; }
.sp-header-info { min-width:0; }
.sp-title    { font-size:16px; font-weight:700; color:#1e293b; margin:0; }
.sp-subtitle { font-size:11px; color:#94a3b8; }
.sp-header-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.sp-dirty-badge   { font-size:11px; font-weight:600; color:#854d0e; background:#fef9c3; border:1px solid #fde047; padding:3px 9px; border-radius:10px; }
.sp-readonly-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:#6b7280; background:#f3f4f6; border:1px solid #e5e7eb; padding:4px 10px; border-radius:7px; }
.sp-discard-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:7px; border:1px solid #e2e8f0; background:white; font-size:12px; font-weight:500; color:#64748b; cursor:pointer; transition:all .15s; }
.sp-discard-btn:hover { background:#fef2f2; border-color:#fca5a5; color:#dc2626; }
.sp-save-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 16px; border-radius:7px; border:none; background:#185FA5; color:white; font-size:12px; font-weight:600; cursor:pointer; transition:background .15s; }
.sp-save-btn:hover:not(:disabled) { background:#1a6fbe; }
.sp-save-btn:disabled { background:#93c5fd; cursor:not-allowed; }
.sp-panel-toggle-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:7px; border:1px solid #e2e8f0; background:white; font-size:12px; font-weight:500; color:#64748b; cursor:pointer; transition:all .15s; white-space:nowrap; }
.sp-panel-toggle-btn:hover { border-color:#185FA5; color:#185FA5; background:#f0f7ff; }
.sp-panel-toggle-btn-active { border-color:#b5d4f4; color:#185FA5; background:#f0f7ff; }
.sp-panel-toggle-count { display:inline-flex; align-items:center; justify-content:center; margin-left:4px; min-width:17px; height:17px; padding:0 4px; border-radius:10px; background:#185FA5; color:white; font-size:10px; font-weight:700; }
.sp-body { display:flex; flex:1; overflow:hidden; height:calc(100vh - 97px); }
.sp-table-wrap { flex:1; overflow:auto; background:#f8fafc; }
.sp-table { display:flex; flex-direction:column; background:white; border-right:1px solid #e2e8f0; }
.sp-thead { display:flex; align-items:stretch; background:#f8fafc; border-bottom:2px solid #e2e8f0; position:sticky; top:0; z-index:10; }
.sp-th-label { display:flex; align-items:center; padding:11px 16px; border-right:1px solid #e2e8f0; background:#f8fafc; position:sticky; left:0; z-index:11; }
.sp-th-label-text { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
.sp-th-anio { display:flex; align-items:center; padding:8px 10px; border-right:1px solid #e2e8f0; background:#f8fafc; }
.sp-anio-header-row { display:flex; align-items:center; justify-content:space-between; width:100%; gap:4px; }
.sp-anio-valor { font-size:13px; font-weight:700; color:#185FA5; }
.sp-anio-btns { display:flex; gap:2px; opacity:0; transition:opacity .1s; }
.sp-th-anio:hover .sp-anio-btns { opacity:1; }
.sp-th-add { display:flex; align-items:center; justify-content:center; padding:8px 6px; background:#f8fafc; transition:width .2s; }
.sp-anio-edit-wrap { display:flex; align-items:center; gap:3px; width:100%; }
.sp-anio-edit-input { flex:1; min-width:0; border:1.5px solid #185FA5; border-radius:5px; padding:3px 6px; font-size:12px; outline:none; font-family:inherit; }
.sp-anio-confirm-delete { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:#dc2626; }
.sp-add-anio-form { display:flex; align-items:center; gap:3px; width:100%; }
.sp-add-anio-input { width:70px; border:1.5px solid #185FA5; border-radius:5px; padding:3px 6px; font-size:12px; outline:none; font-family:inherit; }
.sp-add-anio-btn { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:7px; border:1.5px dashed #cbd5e1; background:white; color:#94a3b8; cursor:pointer; transition:all .1s; }
.sp-add-anio-btn:hover { border-color:#185FA5; color:#185FA5; background:#f0f7ff; }
.sp-anio-icon-btn { display:flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:4px; border:1px solid #e2e8f0; background:white; color:#64748b; cursor:pointer; transition:all .1s; padding:0; }
.sp-anio-icon-btn:disabled { opacity:.4; cursor:not-allowed; }
.sp-anio-confirm { border-color:#86efac; color:#15803d; background:#f0fdf4; }
.sp-anio-confirm:hover:not(:disabled) { background:#dcfce7; }
.sp-anio-cancel  { border-color:#fca5a5; color:#dc2626; background:#fef2f2; }
.sp-anio-cancel:hover { background:#fee2e2; }
.sp-anio-danger  { border-color:#dc2626; background:#dc2626; color:white; }
.sp-anio-danger:hover { background:#b91c1c; }
.sp-anio-danger-soft { color:#ef4444; }
.sp-anio-danger-soft:hover { background:#fef2f2; border-color:#fca5a5; color:#dc2626; }
.sp-tbody { display:flex; flex-direction:column; }
.sp-row { display:flex; align-items:stretch; border-bottom:1px solid #f1f5f9; transition:background .08s; }
.sp-row:hover { background:#fafbfc; }
.sp-row-group { background:#f8fafc; }
.sp-row-group:hover { background:#f1f5f9; }
.sp-cell-label { display:flex; align-items:center; gap:7px; padding:8px 16px 8px 0; border-right:2px solid #e2e8f0; position:sticky; left:0; z-index:1; background:inherit; }
.sp-row-group .sp-cell-label { background:#f8fafc; }
.sp-row:hover .sp-cell-label { background:#fafbfc; }
.sp-row-group:hover .sp-cell-label { background:#f1f5f9; }
.sp-item-code { font-size:10px; font-family:monospace; font-weight:700; color:#185FA5; background:#E6F1FB; padding:1px 5px; border-radius:4px; flex-shrink:0; }
.sp-item-nombre { font-size:13px; color:#1e293b; }
.sp-item-nombre-group { font-weight:700; color:#0f172a; }
.sp-cell { display:flex; align-items:center; justify-content:flex-end; padding:4px 6px; border-right:1px solid #f1f5f9; }
.sp-cell-dirty { background:#fffbeb !important; }
.sp-cell-group {}
.sp-cell-input { width:100%; border:1px solid transparent; border-radius:5px; padding:5px 7px; font-size:13px; font-family:monospace; text-align:right; color:#1e293b; background:transparent; outline:none; transition:border-color .1s,background .1s; -moz-appearance:textfield; }
.sp-cell-input::-webkit-outer-spin-button,.sp-cell-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
.sp-cell-input:focus:not(.sp-cell-input-readonly) { border-color:#185FA5; background:white; box-shadow:0 0 0 2px rgba(24,95,165,.1); }
.sp-cell-input::placeholder { color:#cbd5e1; }
.sp-cell-input-group { font-weight:700; color:#0f172a; background:rgba(24,95,165,.03); }
.sp-cell-input-readonly { cursor:default; color:#475569; }
.sp-cell-input-readonly:focus { border-color:transparent; background:transparent; box-shadow:none; }
.sp-cell-spacer { flex-shrink:0; }
.sp-formula-panel { width:300px; flex-shrink:0; border-left:1px solid #e2e8f0; display:flex; flex-direction:column; background:#f8fafc; overflow:hidden; }
.sp-fp-header { display:flex; align-items:center; justify-content:space-between; padding:11px 12px; border-bottom:1px solid #e2e8f0; background:white; flex-shrink:0; gap:6px; }
.sp-fp-title { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:#1e293b; }
.sp-fp-count { font-size:11px; font-weight:600; color:#185FA5; background:#E6F1FB; padding:1px 7px; border-radius:10px; }
.sp-fp-new-btn { display:inline-flex; align-items:center; gap:4px; padding:4px 9px; border-radius:6px; border:none; background:#185FA5; color:white; font-size:11px; font-weight:600; cursor:pointer; transition:background .15s; }
.sp-fp-new-btn:hover,.sp-fp-btn-active.sp-fp-new-btn { background:#1a6fbe; }
.sp-fp-add-btn { display:inline-flex; align-items:center; gap:4px; padding:4px 9px; border-radius:6px; border:1px solid #e2e8f0; background:white; color:#475569; font-size:11px; font-weight:600; cursor:pointer; transition:all .1s; }
.sp-fp-add-btn:hover,.sp-fp-btn-active.sp-fp-add-btn { border-color:#185FA5; color:#185FA5; background:#f0f7ff; }
.sp-fp-save-btn { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:6px; border:none; background:#185FA5; color:white; font-size:11px; font-weight:600; cursor:pointer; }
.sp-fp-save-btn:disabled { background:#93c5fd; cursor:not-allowed; }
.sp-fp-builder-wrap { flex-shrink:0; overflow-y:auto; max-height:65vh; border-bottom:1px solid #e2e8f0; background:white; animation:spFadeIn .15s ease; }
.sp-fp-source-badge { display:inline-flex; align-items:center; gap:3px; font-size:9px; font-weight:700; padding:1px 5px; border-radius:8px; flex-shrink:0; }
.sp-fp-source-personal { background:#f0fdf4; color:#15803d; border:1px solid #86efac; }
.sp-fp-source-catalogo { background:#E6F1FB; color:#185FA5; border:1px solid #b5d4f4; }
.sp-mfb { display:flex; flex-direction:column; gap:7px; padding:12px; }
.sp-mfb-header { display:flex; align-items:center; justify-content:space-between; }
.sp-mfb-title { font-size:12px; font-weight:700; color:#1e293b; }
.sp-mfb-input { border:1.5px solid #e2e8f0; border-radius:7px; padding:6px 9px; font-size:12px; color:#1e293b; outline:none; font-family:inherit; transition:border-color .15s; }
.sp-mfb-input:focus { border-color:#185FA5; }
.sp-mfb-ops { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }
.sp-mfb-op-btn { width:28px; height:28px; border-radius:6px; border:1.5px solid #e2e8f0; background:white; font-size:14px; font-weight:600; color:#475569; cursor:pointer; transition:all .1s; font-family:monospace; display:flex; align-items:center; justify-content:center; }
.sp-mfb-op-btn:hover { background:#fef9c3; border-color:#fcd34d; color:#854d0e; }
.sp-mfb-num-input { width:60px; border:1.5px solid #e2e8f0; border-radius:6px; padding:4px 6px; font-size:11px; outline:none; font-family:inherit; height:28px; box-sizing:border-box; -moz-appearance:textfield; }
.sp-mfb-num-input::-webkit-outer-spin-button,.sp-mfb-num-input::-webkit-inner-spin-button { -webkit-appearance:none; }
.sp-mfb-num-input:focus { border-color:#185FA5; }
.sp-mfb-num-add { padding:4px 8px; border-radius:6px; border:1.5px solid #e2e8f0; background:white; font-size:11px; color:#475569; cursor:pointer; height:28px; }
.sp-mfb-num-add:hover:not(:disabled) { background:#f0fdf4; border-color:#86efac; color:#15803d; }
.sp-mfb-num-add:disabled { opacity:.4; cursor:not-allowed; }
.sp-mfb-canvas { min-height:44px; border:1.5px dashed #e2e8f0; border-radius:7px; padding:6px 8px; display:flex; flex-wrap:wrap; gap:4px; align-items:center; background:#fafbfc; transition:border-color .15s; }
.sp-mfb-canvas:not(.sp-mfb-canvas-empty) { border-style:solid; border-color:#185FA5; background:white; }
.sp-mfb-placeholder { font-size:11px; color:#cbd5e1; font-style:italic; }
.sp-mfb-chip { display:inline-flex; align-items:center; gap:3px; padding:2px 5px 2px 7px; cursor:default; }
.sp-mfb-chip-remove { display:flex; align-items:center; justify-content:center; width:12px; height:12px; border-radius:3px; border:none; background:rgba(0,0,0,.08); color:inherit; cursor:pointer; padding:0; }
.sp-mfb-chip-remove:hover { background:rgba(0,0,0,.18); }
.sp-mfb-undo { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:12px; padding:2px 4px; border-radius:4px; transition:color .1s; display:flex; align-items:center; }
.sp-mfb-undo:hover { color:#dc2626; }
.sp-mfb-search-wrap { display:flex; align-items:center; gap:6px; border:1.5px solid #e2e8f0; border-radius:7px; padding:5px 8px; color:#94a3b8; }
.sp-mfb-search { flex:1; border:none; outline:none; font-size:11px; color:#1e293b; background:transparent; }
.sp-mfb-item-list { max-height:130px; overflow-y:auto; display:flex; flex-direction:column; gap:1px; border:1px solid #e2e8f0; border-radius:7px; overflow:hidden; }
.sp-mfb-item-btn { display:flex; align-items:center; gap:5px; padding:5px 8px; border:none; background:white; cursor:pointer; transition:background .08s; }
.sp-mfb-item-btn:hover { background:#f0f7ff; }
.sp-mfb-item-btn-group { background:#f8fafc; }
.sp-mfb-item-btn-group:hover { background:#dbeafe; }
.sp-mfb-error { font-size:11px; color:#dc2626; background:#fef2f2; border:1px solid #fca5a5; border-radius:5px; padding:5px 8px; margin:0; }
.sp-mfb-footer { display:flex; align-items:center; justify-content:flex-end; gap:6px; padding-top:4px; border-top:1px solid #f1f5f9; }
.sp-fp-picker { border-bottom:1px solid #e2e8f0; background:white; flex-shrink:0; max-height:200px; overflow-y:auto; animation:spFadeIn .15s ease; }
.sp-fp-picker-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; padding:9px 12px 5px; }
.sp-fp-pick-item { display:flex; align-items:center; justify-content:space-between; gap:8px; width:100%; padding:7px 12px; border:none; border-bottom:1px solid #f1f5f9; background:white; text-align:left; cursor:pointer; transition:background .1s; }
.sp-fp-pick-item:hover { background:#f0f7ff; }
.sp-fp-pick-item:disabled { opacity:.6; cursor:not-allowed; }
.sp-fp-pick-item-active { background:#fef2f2; }
.sp-fp-pick-item-active:hover { background:#fee2e2; }
.sp-fp-pick-info { display:flex; flex-direction:column; gap:1px; min-width:0; }
.sp-fp-pick-nombre { font-size:12px; font-weight:600; color:#1e293b; }
.sp-fp-pick-desc { font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sp-fp-pick-add { color:#185FA5; display:flex; }
.sp-fp-pick-remove { color:#dc2626; display:flex; }
.sp-fp-picker-close { display:flex; align-items:center; gap:4px; justify-content:center; width:100%; padding:7px; border:none; background:#f8fafc; font-size:11px; color:#94a3b8; cursor:pointer; }
.sp-fp-picker-close:hover { color:#dc2626; }
.sp-fp-list { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:8px; }
.sp-fp-empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:24px 16px; color:#94a3b8; text-align:center; }
.sp-fp-empty-state p { font-size:13px; font-weight:600; color:#64748b; margin:0; }
.sp-fp-empty-state span { font-size:11px; line-height:1.5; }
.sp-fp-empty { font-size:12px; color:#94a3b8; padding:10px 12px; text-align:center; }
.sp-fp-card { background:white; border:1px solid #e2e8f0; border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:8px; transition:border-color .15s; }
.sp-fp-card:hover { border-color:#b5d4f4; }
.sp-fp-card-header { display:flex; align-items:flex-start; gap:8px; }
.sp-fp-card-icon { width:24px; height:24px; border-radius:6px; background:#E6F1FB; color:#185FA5; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.sp-fp-card-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
.sp-fp-card-nombre { font-size:12px; font-weight:700; color:#1e293b; }
.sp-fp-card-desc { font-size:11px; color:#94a3b8; }
.sp-fp-card-remove { display:flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:4px; border:1px solid transparent; background:none; color:#cbd5e1; cursor:pointer; flex-shrink:0; transition:all .1s; }
.sp-fp-card-remove:hover { background:#fef2f2; border-color:#fca5a5; color:#dc2626; }
.sp-fp-expr { display:flex; flex-wrap:wrap; gap:3px; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:5px 7px; min-height:28px; }
.sp-token { border-radius:4px; font-family:monospace; font-size:10px; font-weight:600; padding:2px 5px; }
.sp-token-item { background:#E6F1FB; color:#185FA5; }
.sp-token-op   { background:#fef9c3; color:#854d0e; }
.sp-token-num  { background:#f0fdf4; color:#15803d; }
.sp-token-paren { color:#94a3b8; background:none; }
.sp-fp-results { display:flex; flex-direction:column; gap:3px; border-top:1px solid #f1f5f9; padding-top:7px; }
.sp-fp-result-row { display:flex; align-items:center; justify-content:space-between; padding:3px 7px; border-radius:5px; background:#f8fafc; }
.sp-fp-result-anio { font-size:11px; font-weight:600; color:#64748b; }
.sp-fp-result-val { font-size:12px; font-weight:700; color:#0f172a; font-family:monospace; }
.sp-fp-result-error { color:#dc2626; font-size:11px; }
.sp-fp-no-anios { font-size:11px; color:#94a3b8; text-align:center; padding:4px; }
.sp-spinner    { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,.35); border-top-color:white; border-radius:50%; animation:spSpin .7s linear infinite; }
.sp-spinner-xs { display:inline-block; width:10px; height:10px; border:2px solid rgba(21,128,61,.3); border-top-color:#15803d; border-radius:50%; animation:spSpin .7s linear infinite; }
.sp-toast { position:fixed; bottom:24px; right:24px; background:#059669; color:white; padding:11px 18px; border-radius:8px; font-size:13px; font-weight:600; box-shadow:0 4px 16px rgba(5,150,105,.25); z-index:2000; animation:spSlideIn .25s ease; }
@media (max-width:768px) {
  .sp-body { flex-direction:column; }
  .sp-formula-panel { width:100%; height:300px; border-left:none; border-top:1px solid #e2e8f0; }
  .sp-sala-banner { flex-direction:column; align-items:flex-start; }
}
`;