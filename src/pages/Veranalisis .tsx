import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface ItemCat {
  id: number; nombre: string; codigo: string | null;
  contenedor: boolean; iditempadre: number | null; depth?: number;
}
interface Anio { id: number; valor: string; idestadocuenta: number; }
interface ItemEstado { id: number; iditemcat: number; idanio: number; valor: number; _dirty?: boolean; }
type ValoresMap = Record<number, Record<number, ItemEstado>>;
interface EstadoCuenta { id: number; nombre: string; descripcion: string | null; idcatalogo: number; catalogo_nombre?: string; }
interface FormulaToken { type: 'item' | 'operator' | 'number' | 'paren'; value: string; itemId?: number; itemNombre?: string; }

interface FormulaCatalogo {
  source: 'catalogo';
  formulaecId: number;
  id: number;
  nombre: string; descripcion: string | null;
  codigo: { tokens: FormulaToken[] };
}
interface FormulaPersonal {
  source: 'personal';
  id: number;
  nombre: string; descripcion: string | null;
  codigo: { tokens: FormulaToken[] };
}
type FormulaActiva = FormulaCatalogo | FormulaPersonal;

function formulaKey(f: FormulaActiva) {
  return f.source === 'personal' ? `p-${f.id}` : `c-${f.formulaecId}`;
}

interface Props { estadoId: number; onBack: () => void; }

/* ─────────────────────────────────────────
   ICONS
───────────────────────────────────────── */
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
function IconDiff({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }
function IconArrowUp({ size = 10 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>; }
function IconArrowDown({ size = 10 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>; }

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
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
function formatDiff(val: number): string {
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

/* ─────────────────────────────────────────
   COMPARISON SELECTOR
───────────────────────────────────────── */
function CompareSelector({
  anios,
  compareA,
  compareB,
  onChangeA,
  onChangeB,
  onClear,
}: {
  anios: Anio[];
  compareA: number | null;
  compareB: number | null;
  onChangeA: (id: number | null) => void;
  onChangeB: (id: number | null) => void;
  onClear: () => void;
}) {
  const anioA = anios.find(a => a.id === compareA);
  const anioB = anios.find(a => a.id === compareB);
  const isActive = compareA !== null && compareB !== null;

  return (
    <div className={`va-compare-bar ${isActive ? 'va-compare-bar-active' : ''}`}>
      <div className="va-compare-bar-inner">
        <IconDiff size={13}/>
        <span className="va-compare-label">Comparar:</span>
        <select
          className="va-compare-select"
          value={compareA ?? ''}
          onChange={e => onChangeA(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Año base</option>
          {anios.map(a => (
            <option key={a.id} value={a.id} disabled={a.id === compareB}>{a.valor}</option>
          ))}
        </select>
        <span className="va-compare-arrow">→</span>
        <select
          className="va-compare-select"
          value={compareB ?? ''}
          onChange={e => onChangeB(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Año comparar</option>
          {anios.map(a => (
            <option key={a.id} value={a.id} disabled={a.id === compareA}>{a.valor}</option>
          ))}
        </select>
        {isActive && (
          <>
            <span className="va-compare-desc">
              Mostrando diferencia: <strong>{anioB?.valor}</strong> − <strong>{anioA?.valor}</strong>
            </span>
            <button className="va-compare-clear" onClick={onClear} title="Quitar comparación">
              <IconX size={11}/> Quitar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   DIFF CELL
───────────────────────────────────────── */
function DiffCell({ valA, valB }: { valA: number; valB: number }) {
  const diff = valB - valA;
  const pct = valA !== 0 ? (diff / Math.abs(valA)) * 100 : null;
  const isZero = diff === 0;
  const isPos = diff > 0;
  const isNeg = diff < 0;

  return (
    <div className={`va-diff-cell ${isPos ? 'va-diff-pos' : isNeg ? 'va-diff-neg' : 'va-diff-zero'}`}>
      <div className="va-diff-amount">
        {!isZero && (isPos ? <IconArrowUp size={9}/> : <IconArrowDown size={9}/>)}
        <span>{isZero ? '—' : `${isPos ? '+' : ''}${formatDiff(diff)}`}</span>
      </div>
      {pct !== null && !isZero && (
        <div className="va-diff-pct">
          {isPos ? '+' : ''}{pct.toFixed(1)}%
        </div>
      )}
      {valA === 0 && diff !== 0 && (
        <div className="va-diff-pct">N/A</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   TOKEN PREVIEW
───────────────────────────────────────── */
function TokenPreview({ token }: { token: FormulaToken }) {
  if (token.type === 'item')     return <span className="va-token va-token-item">{token.value}</span>;
  if (token.type === 'operator') return <span className="va-token va-token-op">{token.value}</span>;
  if (token.type === 'number')   return <span className="va-token va-token-num">{token.value}</span>;
  if (token.type === 'paren')    return <span className="va-token va-token-paren">{token.value}</span>;
  return null;
}

/* ─────────────────────────────────────────
   MINI FORMULA BUILDER
───────────────────────────────────────── */
const OPERATORS = ['+', '−', '×', '÷', '(', ')'];

function MiniFormulaBuilder({
  items, onSave, onCancel, saving,
}: {
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

  const addItem  = (item: ItemCat) => setTokens(p => [...p, { type: 'item', value: item.nombre, itemId: item.id, itemNombre: item.nombre }]);
  const addOp    = (op: string)    => setTokens(p => [...p, { type: op === '(' || op === ')' ? 'paren' : 'operator', value: op }]);
  const addNum   = () => {
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
    <div className="va-mfb">
      <div className="va-mfb-header">
        <span className="va-mfb-title">Nueva fórmula personal</span>
        <button className="va-anio-icon-btn va-anio-cancel" onClick={onCancel}><IconX size={11}/></button>
      </div>
      <input className="va-mfb-input" placeholder="Nombre *" value={nombre} onChange={e => setNombre(e.target.value)}/>
      <input className="va-mfb-input" placeholder="Descripción (opcional)" value={descripcion} onChange={e => setDescripcion(e.target.value)}/>
      <div className="va-mfb-ops">
        {OPERATORS.map(op => <button key={op} className="va-mfb-op-btn" onClick={() => addOp(op)}>{op}</button>)}
        <input className="va-mfb-num-input" type="number" placeholder="Nro." value={numberInput}
          onChange={e => setNumberInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNum()}/>
        <button className="va-mfb-num-add" onClick={addNum} disabled={!numberInput.trim()}>+</button>
      </div>
      <div className={`va-mfb-canvas ${tokens.length === 0 ? 'va-mfb-canvas-empty' : ''}`}>
        {tokens.length === 0
          ? <span className="va-mfb-placeholder">Añade ítems y operadores…</span>
          : tokens.map((t, i) => (
              <span key={i} className={`va-token va-token-${t.type === 'item' ? 'item' : t.type === 'operator' ? 'op' : t.type === 'number' ? 'num' : 'paren'} va-mfb-chip`}>
                {t.value}
                <button className="va-mfb-chip-remove" onClick={() => setTokens(p => p.filter((_, j) => j !== i))}><IconX size={8}/></button>
              </span>
            ))
        }
      </div>
      {tokens.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: -4 }}>
          <button className="va-mfb-undo" onClick={() => setTokens(p => p.slice(0, -1))}>↩</button>
          <button className="va-mfb-undo" onClick={() => setTokens([])}><IconDelete size={11}/></button>
        </div>
      )}
      <div className="va-mfb-search-wrap">
        <IconSearch size={11}/>
        <input className="va-mfb-search" placeholder="Buscar ítem…" value={search} onChange={e => setSearch(e.target.value)}/>
      </div>
      <div className="va-mfb-item-list">
        {filtered.length === 0
          ? <div className="va-fp-empty">Sin ítems</div>
          : filtered.map(item => (
              <button key={item.id} className={`va-mfb-item-btn ${item.contenedor ? 'va-mfb-item-btn-group' : ''}`} onClick={() => addItem(item)}>
                {item.codigo && <span className="va-item-code" style={{ fontSize: 9 }}>{item.codigo}</span>}
                <span style={{ flex: 1, textAlign: 'left', fontSize: 11 }}>{item.nombre}</span>
                <span style={{ color: '#185FA5', fontSize: 13, fontWeight: 700 }}>+</span>
              </button>
            ))
        }
      </div>
      {error && <p className="va-mfb-error">{error}</p>}
      <div className="va-mfb-footer">
        <button className="va-anio-icon-btn va-anio-cancel" style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }} onClick={onCancel}>Cancelar</button>
        <button className="va-fp-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <span className="va-spinner-xs"/> : <IconCheck size={12}/>} Guardar
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   FORMULA CARD
───────────────────────────────────────── */
function FormulaCard({
  formula, anios, valoresMap, onRemove,
}: {
  formula: FormulaActiva;
  anios: Anio[];
  valoresMap: ValoresMap;
  onRemove: () => void;
}) {
  return (
    <div className="va-fp-card">
      <div className="va-fp-card-header">
        <div className="va-fp-card-icon"><IconFunction size={13}/></div>
        <div className="va-fp-card-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="va-fp-card-nombre">{formula.nombre}</span>
            <span className={`va-fp-source-badge ${formula.source === 'personal' ? 'va-fp-source-personal' : 'va-fp-source-catalogo'}`}>
              {formula.source === 'personal' ? <><IconUser size={9}/> Personal</> : <><IconCatalogo size={9}/> Catálogo</>}
            </span>
          </div>
          {formula.descripcion && <span className="va-fp-card-desc">{formula.descripcion}</span>}
        </div>
        <button className="va-fp-card-remove" onClick={onRemove} title="Eliminar / quitar">
          <IconTrash size={11}/>
        </button>
      </div>
      <div className="va-fp-expr">
        {formula.codigo.tokens.map((t, i) => <TokenPreview key={i} token={t}/>)}
      </div>
      <div className="va-fp-results">
        {anios.length === 0
          ? <span className="va-fp-no-anios">Sin años</span>
          : anios.map(anio => {
              const result = evaluateFormula(formula.codigo.tokens, valoresMap, anio.id);
              return (
                <div key={anio.id} className="va-fp-result-row">
                  <span className="va-fp-result-anio">{anio.valor}</span>
                  <span className={`va-fp-result-val ${result === null ? 'va-fp-result-error' : ''}`}>
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

/* ─────────────────────────────────────────
   PANEL DE FÓRMULAS
───────────────────────────────────────── */
function FormulaPanel({
  idcatalogo, estadoId, anios, valoresMap, items,
  formulasActivas, onAddPersonal, onAddCatalogo, onRemovePersonal, onRemoveCatalogo,
  onShowToast,
}: {
  idcatalogo: number; estadoId: number;
  anios: Anio[]; valoresMap: ValoresMap; items: ItemCat[];
  formulasActivas: FormulaActiva[];
  onAddPersonal:    (f: FormulaPersonal) => void;
  onAddCatalogo:    (f: FormulaCatalogo) => void;
  onRemovePersonal: (id: number) => void;
  onRemoveCatalogo: (formulaecId: number) => void;
  onShowToast: (msg: string) => void;
}) {
  const [view, setView] = useState<'list' | 'new' | 'picker'>('list');
  const [savingNew, setSavingNew] = useState(false);
  const [catFormulas, setCatFormulas] = useState<{ id: number; nombre: string; descripcion: string | null; codigo: { tokens: FormulaToken[] } }[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const [linkingId, setLinkingId] = useState<number | null>(null);

  const activosCatIds = new Set(
    formulasActivas.filter(f => f.source === 'catalogo').map(f => (f as FormulaCatalogo).id)
  );

  useEffect(() => {
    if (view !== 'picker') return;
    setLoadingCat(true);
    supabase.from('formula').select('id, nombre, descripcion, codigo')
      .eq('idcatalogo', idcatalogo).order('nombre')
      .then(({ data }) => { setCatFormulas((data ?? []) as typeof catFormulas); setLoadingCat(false); });
  }, [view, idcatalogo]);

  const handleSavePersonal = async (nombre: string, descripcion: string, tokens: FormulaToken[]) => {
    setSavingNew(true);
    const { data, error } = await supabase
      .from('formulapersonal')
      .insert({ idestadocuenta: estadoId, nombre, descripcion: descripcion || null, codigo: { tokens } })
      .select('id, nombre, descripcion, codigo')
      .single();
    setSavingNew(false);
    if (error || !data) { onShowToast('Error al crear: ' + (error?.message ?? '')); return; }
    onAddPersonal({ source: 'personal', id: data.id, nombre: data.nombre, descripcion: data.descripcion, codigo: data.codigo });
    setView('list');
    onShowToast(`✓ Fórmula "${nombre}" creada`);
  };

  const handleLink = async (f: typeof catFormulas[0]) => {
    setLinkingId(f.id);
    const { data, error } = await supabase
      .from('formulaec')
      .insert({ idestadocuenta: estadoId, idformula: f.id })
      .select('id').single();
    setLinkingId(null);
    if (error || !data) { onShowToast('Error al vincular: ' + (error?.message ?? '')); return; }
    onAddCatalogo({ source: 'catalogo', formulaecId: data.id, id: f.id, nombre: f.nombre, descripcion: f.descripcion, codigo: f.codigo });
    onShowToast(`✓ "${f.nombre}" agregada`);
  };

  const handleUnlink = async (f: FormulaCatalogo) => {
    const { error } = await supabase.from('formulaec').delete().eq('id', f.formulaecId);
    if (error) { onShowToast('Error: ' + error.message); return; }
    onRemoveCatalogo(f.formulaecId);
    onShowToast(`✓ "${f.nombre}" quitada`);
  };

  const handleDeletePersonal = async (f: FormulaPersonal) => {
    const { error } = await supabase.from('formulapersonal').delete().eq('id', f.id);
    if (error) { onShowToast('Error: ' + error.message); return; }
    onRemovePersonal(f.id);
    onShowToast(`✓ "${f.nombre}" eliminada`);
  };

  const handleRemove = (f: FormulaActiva) => {
    if (f.source === 'personal') handleDeletePersonal(f);
    else handleUnlink(f);
  };

  return (
    <div className="va-formula-panel">
      <div className="va-fp-header">
        <div className="va-fp-title">
          <IconFunction size={14}/>
          <span>Fórmulas</span>
          {formulasActivas.length > 0 && <span className="va-fp-count">{formulasActivas.length}</span>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className={`va-fp-new-btn ${view === 'new' ? 'va-fp-btn-active' : ''}`}
            onClick={() => setView(v => v === 'new' ? 'list' : 'new')}
            title="Nueva fórmula personal"
          >
            <IconPlus size={11}/> Nueva
          </button>
          <button
            className={`va-fp-add-btn ${view === 'picker' ? 'va-fp-btn-active' : ''}`}
            onClick={() => setView(v => v === 'picker' ? 'list' : 'picker')}
            title="Agregar del catálogo"
          >
            <IconCatalogo size={11}/> Catálogo
          </button>
        </div>
      </div>

      {view === 'new' && (
        <div className="va-fp-builder-wrap">
          <MiniFormulaBuilder
            items={items}
            saving={savingNew}
            onSave={handleSavePersonal}
            onCancel={() => setView('list')}
          />
        </div>
      )}

      {view === 'picker' && (
        <div className="va-fp-picker">
          <div className="va-fp-picker-title">Fórmulas del catálogo</div>
          {loadingCat ? (
            <div className="va-fp-empty">Cargando…</div>
          ) : catFormulas.length === 0 ? (
            <div className="va-fp-empty">No hay fórmulas en este catálogo</div>
          ) : (
            catFormulas.map(f => {
              const yaActiva = activosCatIds.has(f.id);
              return (
                <button key={f.id}
                  className={`va-fp-pick-item ${yaActiva ? 'va-fp-pick-item-active' : ''}`}
                  onClick={() => {
                    if (yaActiva) {
                      const activa = formulasActivas.find(fa => fa.source === 'catalogo' && (fa as FormulaCatalogo).id === f.id) as FormulaCatalogo | undefined;
                      if (activa) handleUnlink(activa);
                    } else {
                      handleLink(f);
                    }
                  }}
                  disabled={linkingId === f.id}
                >
                  <div className="va-fp-pick-info">
                    <span className="va-fp-pick-nombre">{f.nombre}</span>
                    {f.descripcion && <span className="va-fp-pick-desc">{f.descripcion}</span>}
                  </div>
                  {linkingId === f.id
                    ? <span className="va-spinner-xs" style={{ borderTopColor: '#185FA5', borderColor: '#e2e8f0' }}/>
                    : yaActiva
                      ? <span className="va-fp-pick-remove"><IconX size={11}/></span>
                      : <span className="va-fp-pick-add"><IconChevronRight size={12}/></span>
                  }
                </button>
              );
            })
          )}
          <button className="va-fp-picker-close" onClick={() => setView('list')}>
            <IconX size={11}/> Cerrar
          </button>
        </div>
      )}

      {formulasActivas.length === 0 && view === 'list' ? (
        <div className="va-fp-empty-state">
          <IconFunction size={28}/>
          <p>Sin fórmulas activas</p>
          <span>Crea una fórmula personal o agrega una del catálogo</span>
        </div>
      ) : view === 'list' && (
        <div className="va-fp-list">
          {formulasActivas.map(formula => (
            <FormulaCard
              key={formulaKey(formula)}
              formula={formula}
              anios={anios}
              valoresMap={valoresMap}
              onRemove={() => handleRemove(formula)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────── */
export default function VerAnalisis({ estadoId, onBack }: Props) {
  const [estado, setEstado] = useState<EstadoCuenta | null>(null);
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

  // ── Comparación ──
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const compareActive = compareA !== null && compareB !== null && compareA !== compareB;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  /* ── Carga inicial ── */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: ec } = await supabase
        .from('estadodecuenta')
        .select('id, nombre, descripcion, idcatalogo, catalogo:idcatalogo(nombre)')
        .eq('id', estadoId).single();
      if (!ec) { setLoading(false); return; }
      setEstado({ id: ec.id, nombre: ec.nombre, descripcion: ec.descripcion, idcatalogo: ec.idcatalogo, catalogo_nombre: (ec as any).catalogo?.nombre });

      const { data: rawItems } = await supabase.from('itemcat')
        .select('id, nombre, codigo, contenedor, iditempadre')
        .eq('idcatalogo', ec.idcatalogo).order('id');
      setItems(flattenWithDepth(rawItems ?? []));

      const { data: rawAnios } = await supabase.from('anioestado')
        .select('id, valor, idestadocuenta').eq('idestadocuenta', estadoId).order('valor');
      setAnios(rawAnios ?? []);

      const { data: rawValores } = await supabase.from('itemestado')
        .select('id, iditemcat, idanio, valor').eq('idestadocuenta', estadoId);
      const map: ValoresMap = {};
      for (const v of rawValores ?? []) {
        if (!map[v.iditemcat]) map[v.iditemcat] = {};
        map[v.iditemcat][v.idanio] = v;
      }
      setValores(map);
      setDraft(JSON.parse(JSON.stringify(map)));

      const { data: rawFp } = await supabase.from('formulapersonal')
        .select('id, nombre, descripcion, codigo')
        .eq('idestadocuenta', estadoId).order('created_at');
      const personales: FormulaPersonal[] = (rawFp ?? []).map((r: any) => ({
        source: 'personal', id: r.id, nombre: r.nombre, descripcion: r.descripcion, codigo: r.codigo,
      }));

      const { data: rawFec } = await supabase.from('formulaec')
        .select('id, formula:idformula(id, nombre, descripcion, codigo)')
        .eq('idestadocuenta', estadoId);
      const catalogo: FormulaCatalogo[] = (rawFec ?? []).map((r: any) => ({
        source: 'catalogo', formulaecId: r.id,
        id: r.formula.id, nombre: r.formula.nombre,
        descripcion: r.formula.descripcion, codigo: r.formula.codigo,
      }));

      setFormulasActivas([...personales, ...catalogo]);
      setLoading(false);
    }
    load();
  }, [estadoId]);

  /* ── Cambiar valor ── */
  const handleValueChange = (iditemcat: number, idanio: number, raw: string) => {
    const num = raw === '' ? 0 : parseFloat(raw.replace(/,/g, '.')) || 0;
    setDraft(prev => {
      const next = { ...prev };
      if (!next[iditemcat]) next[iditemcat] = {};
      next[iditemcat] = { ...next[iditemcat], [idanio]: { ...((prev[iditemcat]?.[idanio]) ?? { id: -1, iditemcat, idanio, valor: 0 }), valor: num, _dirty: true } };
      return next;
    });
    setDirty(true);
  };

  /* ── Guardar ── */
  const handleSave = async () => {
    setSaving(true);
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

  /* ── Años ── */
  const handleAddAnio = async () => {
    if (!newAnioVal.trim() || anios.some(a => a.valor === newAnioVal.trim())) { showToast('Ya existe ese año'); return; }
    setSavingAnio(true);
    const { data: nuevoId, error } = await supabase.rpc('agregar_anio_estado', { p_idestadocuenta: estadoId, p_valor: newAnioVal.trim() });
    if (error || !nuevoId) { showToast('Error: ' + (error?.message ?? '')); setSavingAnio(false); return; }
    const nuevoAnio: Anio = { id: nuevoId, valor: newAnioVal.trim(), idestadocuenta: estadoId };
    setAnios(prev => [...prev, nuevoAnio].sort((a, b) => a.valor.localeCompare(b.valor)));
    setDraft(prev => { const n = { ...prev }; for (const item of items) { if (!n[item.id]) n[item.id] = {}; n[item.id][nuevoId] = { id: -1, iditemcat: item.id, idanio: nuevoId, valor: 0 }; } return n; });
    setAddingAnio(false); setNewAnioVal(''); setSavingAnio(false);
    showToast(`✓ Año ${newAnioVal.trim()} agregado`);
  };
  const handleSaveAnioNombre = async (id: number) => {
    if (!editingAnioVal.trim()) return;
    const { error } = await supabase.from('anioestado').update({ valor: editingAnioVal.trim() }).eq('id', id);
    if (error) { showToast('Error: ' + error.message); return; }
    setAnios(prev => prev.map(a => a.id === id ? { ...a, valor: editingAnioVal.trim() } : a));
    setEditingAnioId(null); showToast('✓ Año actualizado');
  };
  const handleDeleteAnio = async (id: number) => {
    await supabase.from('itemestado').delete().eq('idanio', id);
    const { error } = await supabase.from('anioestado').delete().eq('id', id);
    if (error) { showToast('Error: ' + error.message); return; }
    setAnios(prev => prev.filter(a => a.id !== id));
    setDraft(prev => { const n = { ...prev }; for (const k of Object.keys(n)) { const { [id]: _, ...rest } = n[+k]; n[+k] = rest; } return n; });
    // Limpiar comparación si el año eliminado estaba seleccionado
    if (compareA === id) setCompareA(null);
    if (compareB === id) setCompareB(null);
    setConfirmDeleteAnioId(null); showToast('✓ Año eliminado');
  };

  const dirtyCount = Object.values(draft).reduce((acc, byAnio) => acc + Object.values(byAnio).filter(v => v._dirty).length, 0);

  // Columna de diferencia: ancho fijo cuando está activa
  const DIFF_COL_WIDTH = 160;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="va-spinner-lg"/>
      <style>{`@keyframes vaSpin{to{transform:rotate(360deg)}}.va-spinner-lg{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#185FA5;border-radius:50%;animation:vaSpin 0.7s linear infinite}`}</style>
    </div>
  );
  if (!estado) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}><p>Estado no encontrado.</p><button onClick={onBack}>Volver</button></div>;

  const COL_WIDTH = 140, LABEL_WIDTH = 300;
  const anioA = anios.find(a => a.id === compareA);
  const anioB = anios.find(a => a.id === compareB);

  return (
    <>
      <style>{VA_CSS}</style>
      {toast && <div className="va-toast">{toast}</div>}

      {/* HEADER */}
      <div className="va-page-header">
        <div className="va-header-left">
          <button className="va-back-btn" onClick={onBack}><IconBack size={16}/> Volver</button>
          <div className="va-header-info">
            <h1 className="va-title">{estado.nombre}</h1>
            {estado.catalogo_nombre && <span className="va-subtitle">{estado.catalogo_nombre}</span>}
          </div>
        </div>
        <div className="va-header-actions">
          {dirty && (
            <>
              <span className="va-dirty-badge">{dirtyCount} cambio{dirtyCount !== 1 ? 's' : ''} pendiente{dirtyCount !== 1 ? 's' : ''}</span>
              <button className="va-discard-btn" onClick={handleDiscard} disabled={saving}><IconX size={13}/> Descartar</button>
              <button className="va-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="va-spinner"/> Guardando…</> : <><IconSave size={14}/> Guardar</>}
              </button>
            </>
          )}
          <button
            className={`va-panel-toggle-btn ${panelVisible ? 'va-panel-toggle-btn-active' : ''}`}
            onClick={() => setPanelVisible(v => !v)}
            title={panelVisible ? 'Ocultar fórmulas' : 'Mostrar fórmulas'}
          >
            {panelVisible ? <IconPanelClose size={15}/> : <IconPanelOpen size={15}/>}
            <span>{panelVisible ? 'Ocultar' : 'Fórmulas'}</span>
            {!panelVisible && formulasActivas.length > 0 && <span className="va-panel-toggle-count">{formulasActivas.length}</span>}
          </button>
        </div>
      </div>

      {/* BARRA DE COMPARACIÓN */}
      {anios.length >= 2 && (
        <CompareSelector
          anios={anios}
          compareA={compareA}
          compareB={compareB}
          onChangeA={setCompareA}
          onChangeB={setCompareB}
          onClear={() => { setCompareA(null); setCompareB(null); }}
        />
      )}

      {/* BODY */}
      <div className="va-body">
        <div className="va-table-wrap">
          <div className="va-table" style={{ minWidth: LABEL_WIDTH + anios.length * COL_WIDTH + (compareActive ? DIFF_COL_WIDTH : 0) + 200 }}>
            {/* THEAD */}
            <div className="va-thead">
              <div className="va-th-label" style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}>
                <span className="va-th-label-text">Cuenta</span>
              </div>
              {anios.map(anio => (
                <div key={anio.id} className={`va-th-anio ${compareActive && (anio.id === compareA || anio.id === compareB) ? 'va-th-anio-highlighted' : ''}`} style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}>
                  {editingAnioId === anio.id ? (
                    <div className="va-anio-edit-wrap">
                      <input className="va-anio-edit-input" value={editingAnioVal} onChange={e => setEditingAnioVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveAnioNombre(anio.id); if (e.key === 'Escape') setEditingAnioId(null); }} autoFocus/>
                      <button className="va-anio-icon-btn va-anio-confirm" onClick={() => handleSaveAnioNombre(anio.id)}><IconCheck size={11}/></button>
                      <button className="va-anio-icon-btn va-anio-cancel" onClick={() => setEditingAnioId(null)}><IconX size={11}/></button>
                    </div>
                  ) : confirmDeleteAnioId === anio.id ? (
                    <div className="va-anio-confirm-delete">
                      <span>¿Eliminar?</span>
                      <button className="va-anio-icon-btn va-anio-danger" onClick={() => handleDeleteAnio(anio.id)}><IconCheck size={11}/></button>
                      <button className="va-anio-icon-btn va-anio-cancel" onClick={() => setConfirmDeleteAnioId(null)}><IconX size={11}/></button>
                    </div>
                  ) : (
                    <div className="va-anio-header-row">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span className="va-anio-valor">{anio.valor}</span>
                        {compareActive && anio.id === compareA && <span className="va-anio-compare-tag va-anio-tag-base">Base</span>}
                        {compareActive && anio.id === compareB && <span className="va-anio-compare-tag va-anio-tag-comp">Comparar</span>}
                      </div>
                      <div className="va-anio-btns">
                        <button className="va-anio-icon-btn" onClick={() => { setEditingAnioId(anio.id); setEditingAnioVal(anio.valor); }}><IconEdit size={11}/></button>
                        <button className="va-anio-icon-btn va-anio-danger-soft" onClick={() => setConfirmDeleteAnioId(anio.id)}><IconTrash size={11}/></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Columna de diferencia en el encabezado */}
              {compareActive && anioA && anioB && (
                <div className="va-th-diff" style={{ width: DIFF_COL_WIDTH, minWidth: DIFF_COL_WIDTH }}>
                  <div className="va-th-diff-inner">
                    <IconDiff size={12}/>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span className="va-th-diff-title">Variación</span>
                      <span className="va-th-diff-subtitle">{anioB.valor} − {anioA.valor}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="va-th-add" style={{ width: addingAnio ? 220 : 48, minWidth: addingAnio ? 220 : 48 }}>
                {addingAnio ? (
                  <div className="va-add-anio-form">
                    <input className="va-add-anio-input" placeholder="Ej: 2026" value={newAnioVal}
                      onChange={e => setNewAnioVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddAnio(); if (e.key === 'Escape') { setAddingAnio(false); setNewAnioVal(''); } }}
                      autoFocus disabled={savingAnio}/>
                    <button className="va-anio-icon-btn va-anio-confirm" onClick={handleAddAnio} disabled={savingAnio || !newAnioVal.trim()}>
                      {savingAnio ? <span className="va-spinner-xs"/> : <IconCheck size={11}/>}
                    </button>
                    <button className="va-anio-icon-btn va-anio-cancel" onClick={() => { setAddingAnio(false); setNewAnioVal(''); }}><IconX size={11}/></button>
                  </div>
                ) : (
                  <button className="va-add-anio-btn" onClick={() => setAddingAnio(true)}><IconPlus size={13}/></button>
                )}
              </div>
            </div>

            {/* TBODY */}
            <div className="va-tbody">
              {items.map(item => {
                const isGroup = item.contenedor;
                const depth = item.depth ?? 0;
                const valA = compareActive ? (draft[item.id]?.[compareA!]?.valor ?? 0) : 0;
                const valB = compareActive ? (draft[item.id]?.[compareB!]?.valor ?? 0) : 0;

                return (
                  <div key={item.id} className={`va-row ${isGroup ? 'va-row-group' : 'va-row-item'}`}>
                    <div className="va-cell-label" style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, paddingLeft: 16 + depth * 20 }}>
                      {item.codigo && <span className="va-item-code">{item.codigo}</span>}
                      <span className={`va-item-nombre ${isGroup ? 'va-item-nombre-group' : ''}`}>{item.nombre}</span>
                    </div>
                    {anios.map(anio => {
                      const cell = draft[item.id]?.[anio.id];
                      const val = cell?.valor ?? 0;
                      const isCompareCol = compareActive && (anio.id === compareA || anio.id === compareB);
                      return (
                        <div key={anio.id}
                          className={`va-cell ${cell?._dirty ? 'va-cell-dirty' : ''} ${isGroup ? 'va-cell-group' : ''} ${isCompareCol ? 'va-cell-compare-highlight' : ''}`}
                          style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}>
                          <input className={`va-cell-input ${isGroup ? 'va-cell-input-group' : ''}`}
                            type="number" step="0.01" value={val === 0 ? '' : val} placeholder="0.00"
                            onChange={e => handleValueChange(item.id, anio.id, e.target.value)}/>
                        </div>
                      );
                    })}

                    {/* Celda de diferencia */}
                    {compareActive && (
                      <div className={`va-cell-diff-wrap ${isGroup ? 'va-cell-diff-group' : ''}`} style={{ width: DIFF_COL_WIDTH, minWidth: DIFF_COL_WIDTH }}>
                        <DiffCell valA={valA} valB={valB} />
                      </div>
                    )}

                    <div className="va-cell-spacer" style={{ width: addingAnio ? 220 : 48, minWidth: addingAnio ? 220 : 48 }}/>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {panelVisible && estado && (
          <FormulaPanel
            idcatalogo={estado.idcatalogo}
            estadoId={estadoId}
            anios={anios}
            valoresMap={draft}
            items={items}
            formulasActivas={formulasActivas}
            onAddPersonal={f => setFormulasActivas(prev => [...prev, f])}
            onAddCatalogo={f => setFormulasActivas(prev => [...prev, f])}
            onRemovePersonal={id => setFormulasActivas(prev => prev.filter(f => !(f.source === 'personal' && f.id === id)))}
            onRemoveCatalogo={fecId => setFormulasActivas(prev => prev.filter(f => !(f.source === 'catalogo' && (f as FormulaCatalogo).formulaecId === fecId)))}
            onShowToast={showToast}
          />
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const VA_CSS = `
@keyframes vaSpin { to { transform: rotate(360deg); } }
@keyframes vaSlideIn { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes vaFadeIn  { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }

/* ── PAGE ── */
.va-page-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #e2e8f0; background: white; gap: 16px; flex-wrap: wrap; flex-shrink: 0; position: sticky; top: 0; z-index: 20; }
.va-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.va-back-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 7px; border: 1px solid #e2e8f0; background: white; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.1s; white-space: nowrap; flex-shrink: 0; }
.va-back-btn:hover { border-color: #94a3b8; color: #1e293b; background: #f8fafc; }
.va-header-info { min-width: 0; }
.va-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.va-subtitle { font-size: 11px; color: #94a3b8; }
.va-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.va-dirty-badge { font-size: 11px; font-weight: 600; color: #854d0e; background: #fef9c3; border: 1px solid #fde047; padding: 3px 9px; border-radius: 10px; }
.va-discard-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 7px; border: 1px solid #e2e8f0; background: white; font-size: 12px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.15s; }
.va-discard-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.va-save-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 7px; border: none; background: #185FA5; color: white; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.va-save-btn:hover:not(:disabled) { background: #1a6fbe; }
.va-save-btn:disabled { background: #93c5fd; cursor: not-allowed; }
.va-panel-toggle-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 7px; border: 1px solid #e2e8f0; background: white; font-size: 12px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.va-panel-toggle-btn:hover { border-color: #185FA5; color: #185FA5; background: #f0f7ff; }
.va-panel-toggle-btn-active { border-color: #b5d4f4; color: #185FA5; background: #f0f7ff; }
.va-panel-toggle-count { display: inline-flex; align-items: center; justify-content: center; margin-left: 4px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 10px; background: #185FA5; color: white; font-size: 10px; font-weight: 700; }

/* ── COMPARE BAR ── */
.va-compare-bar { padding: 7px 20px; border-bottom: 1px solid #e2e8f0; background: #fafbfc; flex-shrink: 0; }
.va-compare-bar-active { background: #f0f7ff; border-bottom-color: #b5d4f4; }
.va-compare-bar-inner { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.va-compare-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.va-compare-select { border: 1.5px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 500; color: #1e293b; background: white; outline: none; cursor: pointer; transition: border-color 0.15s; font-family: inherit; }
.va-compare-select:focus { border-color: #185FA5; }
.va-compare-arrow { font-size: 14px; color: #185FA5; font-weight: 700; }
.va-compare-desc { font-size: 11px; color: #475569; margin-left: 4px; }
.va-compare-desc strong { color: #185FA5; }
.va-compare-clear { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 6px; border: 1px solid #fca5a5; background: #fef2f2; color: #dc2626; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.1s; }
.va-compare-clear:hover { background: #fee2e2; }

/* ── BODY ── */
.va-body { display: flex; flex: 1; overflow: hidden; height: calc(100vh - 57px); }
.va-table-wrap { flex: 1; overflow: auto; background: #f8fafc; }
.va-table { display: flex; flex-direction: column; background: white; border-right: 1px solid #e2e8f0; }

/* ── THEAD ── */
.va-thead { display: flex; align-items: stretch; background: #f8fafc; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
.va-th-label { display: flex; align-items: center; padding: 11px 16px; border-right: 1px solid #e2e8f0; background: #f8fafc; position: sticky; left: 0; z-index: 11; }
.va-th-label-text { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.va-th-anio { display: flex; align-items: center; padding: 8px 10px; border-right: 1px solid #e2e8f0; background: #f8fafc; }
.va-th-anio-highlighted { background: #EBF4FF; border-bottom: 2px solid #185FA5; }
.va-anio-header-row { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px; }
.va-anio-valor { font-size: 13px; font-weight: 700; color: #185FA5; }
.va-anio-btns { display: flex; gap: 2px; opacity: 0; transition: opacity 0.1s; }
.va-th-anio:hover .va-anio-btns { opacity: 1; }
.va-anio-compare-tag { font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
.va-anio-tag-base { background: #dbeafe; color: #1d4ed8; }
.va-anio-tag-comp { background: #d1fae5; color: #065f46; }

/* Columna de diferencia (th) */
.va-th-diff { display: flex; align-items: center; padding: 8px 10px; border-right: 1px solid #e2e8f0; background: linear-gradient(135deg, #f0f7ff 0%, #e8f5e9 100%); border-left: 2px solid #185FA5; }
.va-th-diff-inner { display: flex; align-items: center; gap: 6px; color: #185FA5; }
.va-th-diff-title { font-size: 11px; font-weight: 700; color: #185FA5; text-transform: uppercase; letter-spacing: 0.05em; }
.va-th-diff-subtitle { font-size: 10px; color: #64748b; font-weight: 500; }

/* ── ANIO CONTROLS ── */
.va-th-add { display: flex; align-items: center; justify-content: center; padding: 8px 6px; background: #f8fafc; transition: width 0.2s; }
.va-anio-edit-wrap { display: flex; align-items: center; gap: 3px; width: 100%; }
.va-anio-edit-input { flex: 1; min-width: 0; border: 1.5px solid #185FA5; border-radius: 5px; padding: 3px 6px; font-size: 12px; outline: none; font-family: inherit; }
.va-anio-confirm-delete { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #dc2626; }
.va-add-anio-form { display: flex; align-items: center; gap: 3px; width: 100%; }
.va-add-anio-input { width: 70px; border: 1.5px solid #185FA5; border-radius: 5px; padding: 3px 6px; font-size: 12px; outline: none; font-family: inherit; }
.va-add-anio-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 7px; border: 1.5px dashed #cbd5e1; background: white; color: #94a3b8; cursor: pointer; transition: all 0.1s; }
.va-add-anio-btn:hover { border-color: #185FA5; color: #185FA5; background: #f0f7ff; }
.va-anio-icon-btn { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 4px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer; transition: all 0.1s; padding: 0; }
.va-anio-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.va-anio-confirm { border-color: #86efac; color: #15803d; background: #f0fdf4; }
.va-anio-confirm:hover:not(:disabled) { background: #dcfce7; }
.va-anio-cancel { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }
.va-anio-cancel:hover { background: #fee2e2; }
.va-anio-danger { border-color: #dc2626; background: #dc2626; color: white; }
.va-anio-danger:hover { background: #b91c1c; }
.va-anio-danger-soft { color: #ef4444; }
.va-anio-danger-soft:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

/* ── TBODY ── */
.va-tbody { display: flex; flex-direction: column; }
.va-row { display: flex; align-items: stretch; border-bottom: 1px solid #f1f5f9; transition: background 0.08s; }
.va-row:hover { background: #fafbfc; }
.va-row-group { background: #f8fafc; }
.va-row-group:hover { background: #f1f5f9; }
.va-cell-label { display: flex; align-items: center; gap: 7px; padding: 8px 16px 8px 0; border-right: 2px solid #e2e8f0; position: sticky; left: 0; z-index: 1; background: inherit; }
.va-row-group .va-cell-label { background: #f8fafc; }
.va-row:hover .va-cell-label { background: #fafbfc; }
.va-row-group:hover .va-cell-label { background: #f1f5f9; }
.va-item-code { font-size: 10px; font-family: monospace; font-weight: 700; color: #185FA5; background: #E6F1FB; padding: 1px 5px; border-radius: 4px; flex-shrink: 0; }
.va-item-nombre { font-size: 13px; color: #1e293b; }
.va-item-nombre-group { font-weight: 700; color: #0f172a; }
.va-cell { display: flex; align-items: center; justify-content: flex-end; padding: 4px 6px; border-right: 1px solid #f1f5f9; }
.va-cell-dirty { background: #fffbeb !important; }
.va-cell-compare-highlight { background: rgba(24,95,165,0.04) !important; }
.va-cell-input { width: 100%; border: 1px solid transparent; border-radius: 5px; padding: 5px 7px; font-size: 13px; font-family: monospace; text-align: right; color: #1e293b; background: transparent; outline: none; transition: border-color 0.1s, background 0.1s; -moz-appearance: textfield; }
.va-cell-input::-webkit-outer-spin-button, .va-cell-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.va-cell-input:focus { border-color: #185FA5; background: white; box-shadow: 0 0 0 2px rgba(24,95,165,0.1); }
.va-cell-input::placeholder { color: #cbd5e1; }
.va-cell-input-group { font-weight: 700; color: #0f172a; background: rgba(24,95,165,0.03); }
.va-cell-input-group:focus { background: white; }
.va-cell-spacer { flex-shrink: 0; }

/* ── DIFF COLUMN (body) ── */
.va-cell-diff-wrap { display: flex; align-items: center; justify-content: flex-end; padding: 4px 10px; border-right: 1px solid #e2e8f0; border-left: 2px solid #185FA5; background: rgba(240,247,255,0.5); }
.va-cell-diff-group { background: rgba(219,234,254,0.4); }
.va-row:hover .va-cell-diff-wrap { background: rgba(219,234,254,0.7); }

.va-diff-cell { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; min-width: 0; }
.va-diff-amount { display: flex; align-items: center; gap: 3px; font-size: 12px; font-family: monospace; font-weight: 700; }
.va-diff-pct { font-size: 10px; font-weight: 600; opacity: 0.8; font-family: monospace; }

.va-diff-pos .va-diff-amount { color: #15803d; }
.va-diff-pos .va-diff-pct  { color: #15803d; }
.va-diff-neg .va-diff-amount { color: #dc2626; }
.va-diff-neg .va-diff-pct  { color: #dc2626; }
.va-diff-zero .va-diff-amount { color: #94a3b8; font-weight: 400; }

/* ── PANEL ── */
.va-formula-panel { width: 300px; flex-shrink: 0; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; background: #f8fafc; overflow: hidden; }
.va-fp-header { display: flex; align-items: center; justify-content: space-between; padding: 11px 12px; border-bottom: 1px solid #e2e8f0; background: white; flex-shrink: 0; gap: 6px; }
.va-fp-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #1e293b; }
.va-fp-count { font-size: 11px; font-weight: 600; color: #185FA5; background: #E6F1FB; padding: 1px 7px; border-radius: 10px; }
.va-fp-new-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 6px; border: none; background: #185FA5; color: white; font-size: 11px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.va-fp-new-btn:hover, .va-fp-btn-active.va-fp-new-btn { background: #1a6fbe; }
.va-fp-add-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; color: #475569; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.1s; }
.va-fp-add-btn:hover, .va-fp-btn-active.va-fp-add-btn { border-color: #185FA5; color: #185FA5; background: #f0f7ff; }
.va-fp-save-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 6px; border: none; background: #185FA5; color: white; font-size: 11px; font-weight: 600; cursor: pointer; }
.va-fp-save-btn:disabled { background: #93c5fd; cursor: not-allowed; }
.va-fp-builder-wrap { flex-shrink: 0; overflow-y: auto; max-height: 65vh; border-bottom: 1px solid #e2e8f0; background: white; animation: vaFadeIn 0.15s ease; }
.va-fp-source-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 8px; flex-shrink: 0; }
.va-fp-source-personal { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.va-fp-source-catalogo { background: #E6F1FB; color: #185FA5; border: 1px solid #b5d4f4; }

/* ── MINI BUILDER ── */
.va-mfb { display: flex; flex-direction: column; gap: 7px; padding: 12px; }
.va-mfb-header { display: flex; align-items: center; justify-content: space-between; }
.va-mfb-title { font-size: 12px; font-weight: 700; color: #1e293b; }
.va-mfb-input { border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 6px 9px; font-size: 12px; color: #1e293b; outline: none; font-family: inherit; transition: border-color 0.15s; }
.va-mfb-input:focus { border-color: #185FA5; }
.va-mfb-ops { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.va-mfb-op-btn { width: 28px; height: 28px; border-radius: 6px; border: 1.5px solid #e2e8f0; background: white; font-size: 14px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.1s; font-family: monospace; display: flex; align-items: center; justify-content: center; }
.va-mfb-op-btn:hover { background: #fef9c3; border-color: #fcd34d; color: #854d0e; }
.va-mfb-num-input { width: 60px; border: 1.5px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; font-size: 11px; outline: none; font-family: inherit; height: 28px; box-sizing: border-box; -moz-appearance: textfield; }
.va-mfb-num-input::-webkit-outer-spin-button, .va-mfb-num-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.va-mfb-num-input:focus { border-color: #185FA5; }
.va-mfb-num-add { padding: 4px 8px; border-radius: 6px; border: 1.5px solid #e2e8f0; background: white; font-size: 11px; color: #475569; cursor: pointer; height: 28px; }
.va-mfb-num-add:hover:not(:disabled) { background: #f0fdf4; border-color: #86efac; color: #15803d; }
.va-mfb-num-add:disabled { opacity: 0.4; cursor: not-allowed; }
.va-mfb-canvas { min-height: 44px; border: 1.5px dashed #e2e8f0; border-radius: 7px; padding: 6px 8px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; background: #fafbfc; transition: border-color 0.15s; }
.va-mfb-canvas:not(.va-mfb-canvas-empty) { border-style: solid; border-color: #185FA5; background: white; }
.va-mfb-placeholder { font-size: 11px; color: #cbd5e1; font-style: italic; }
.va-mfb-chip { display: inline-flex; align-items: center; gap: 3px; padding: 2px 5px 2px 7px; cursor: default; }
.va-mfb-chip-remove { display: flex; align-items: center; justify-content: center; width: 12px; height: 12px; border-radius: 3px; border: none; background: rgba(0,0,0,0.08); color: inherit; cursor: pointer; padding: 0; }
.va-mfb-chip-remove:hover { background: rgba(0,0,0,0.18); }
.va-mfb-undo { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 12px; padding: 2px 4px; border-radius: 4px; transition: color 0.1s; display: flex; align-items: center; }
.va-mfb-undo:hover { color: #dc2626; }
.va-mfb-search-wrap { display: flex; align-items: center; gap: 6px; border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 5px 8px; color: #94a3b8; }
.va-mfb-search { flex: 1; border: none; outline: none; font-size: 11px; color: #1e293b; background: transparent; }
.va-mfb-item-list { max-height: 130px; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; border: 1px solid #e2e8f0; border-radius: 7px; overflow: hidden; }
.va-mfb-item-btn { display: flex; align-items: center; gap: 5px; padding: 5px 8px; border: none; background: white; cursor: pointer; transition: background 0.08s; }
.va-mfb-item-btn:hover { background: #f0f7ff; }
.va-mfb-item-btn-group { background: #f8fafc; }
.va-mfb-item-btn-group:hover { background: #dbeafe; }
.va-mfb-error { font-size: 11px; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 5px; padding: 5px 8px; margin: 0; }
.va-mfb-footer { display: flex; align-items: center; justify-content: flex-end; gap: 6px; padding-top: 4px; border-top: 1px solid #f1f5f9; }

/* ── PICKER ── */
.va-fp-picker { border-bottom: 1px solid #e2e8f0; background: white; flex-shrink: 0; max-height: 200px; overflow-y: auto; animation: vaFadeIn 0.15s ease; }
.va-fp-picker-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; padding: 9px 12px 5px; }
.va-fp-pick-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 7px 12px; border: none; border-bottom: 1px solid #f1f5f9; background: white; text-align: left; cursor: pointer; transition: background 0.1s; }
.va-fp-pick-item:hover { background: #f0f7ff; }
.va-fp-pick-item:disabled { opacity: 0.6; cursor: not-allowed; }
.va-fp-pick-item-active { background: #fef2f2; }
.va-fp-pick-item-active:hover { background: #fee2e2; }
.va-fp-pick-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.va-fp-pick-nombre { font-size: 12px; font-weight: 600; color: #1e293b; }
.va-fp-pick-desc { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.va-fp-pick-add { color: #185FA5; display: flex; }
.va-fp-pick-remove { color: #dc2626; display: flex; }
.va-fp-picker-close { display: flex; align-items: center; gap: 4px; justify-content: center; width: 100%; padding: 7px; border: none; background: #f8fafc; font-size: 11px; color: #94a3b8; cursor: pointer; }
.va-fp-picker-close:hover { color: #dc2626; }

/* ── LISTA DE FÓRMULAS ── */
.va-fp-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
.va-fp-empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px 16px; color: #94a3b8; text-align: center; }
.va-fp-empty-state p { font-size: 13px; font-weight: 600; color: #64748b; margin: 0; }
.va-fp-empty-state span { font-size: 11px; line-height: 1.5; }
.va-fp-empty { font-size: 12px; color: #94a3b8; padding: 10px 12px; text-align: center; }
.va-fp-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; transition: border-color 0.15s; }
.va-fp-card:hover { border-color: #b5d4f4; }
.va-fp-card-header { display: flex; align-items: flex-start; gap: 8px; }
.va-fp-card-icon { width: 24px; height: 24px; border-radius: 6px; background: #E6F1FB; color: #185FA5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.va-fp-card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.va-fp-card-nombre { font-size: 12px; font-weight: 700; color: #1e293b; }
.va-fp-card-desc { font-size: 11px; color: #94a3b8; }
.va-fp-card-remove { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 4px; border: 1px solid transparent; background: none; color: #cbd5e1; cursor: pointer; flex-shrink: 0; transition: all 0.1s; }
.va-fp-card-remove:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.va-fp-expr { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 7px; min-height: 28px; }
.va-token { border-radius: 4px; font-family: monospace; font-size: 10px; font-weight: 600; padding: 2px 5px; }
.va-token-item { background: #E6F1FB; color: #185FA5; }
.va-token-op   { background: #fef9c3; color: #854d0e; }
.va-token-num  { background: #f0fdf4; color: #15803d; }
.va-token-paren { color: #94a3b8; background: none; }
.va-fp-results { display: flex; flex-direction: column; gap: 3px; border-top: 1px solid #f1f5f9; padding-top: 7px; }
.va-fp-result-row { display: flex; align-items: center; justify-content: space-between; padding: 3px 7px; border-radius: 5px; background: #f8fafc; }
.va-fp-result-anio { font-size: 11px; font-weight: 600; color: #64748b; }
.va-fp-result-val { font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace; }
.va-fp-result-error { color: #dc2626; font-size: 11px; }
.va-fp-no-anios { font-size: 11px; color: #94a3b8; text-align: center; padding: 4px; }

/* ── SPINNERS ── */
.va-spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: vaSpin 0.7s linear infinite; }
.va-spinner-xs { display: inline-block; width: 10px; height: 10px; border: 2px solid rgba(21,128,61,0.3); border-top-color: #15803d; border-radius: 50%; animation: vaSpin 0.7s linear infinite; }

/* ── TOAST ── */
.va-toast { position: fixed; bottom: 24px; right: 24px; background: #059669; color: white; padding: 11px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 16px rgba(5,150,105,0.25); z-index: 2000; animation: vaSlideIn 0.25s ease; }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .va-body { flex-direction: column; }
  .va-formula-panel { width: 100%; height: 300px; border-left: none; border-top: 1px solid #e2e8f0; }
  .va-compare-bar-inner { gap: 6px; }
}
`;