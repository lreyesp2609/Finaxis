import { useState, useRef, useEffect } from 'react';
import type { FormulaToken, Formula } from './FormulaCard';
import styles from './Formulabuilder.module.css';

/* ── Types ── */
interface ItemCatFlat {
  id: number;
  nombre: string;
  codigo: string | null;
  contenedor: boolean;
  iditempadre: number | null;
}

interface Props {
  catalogoId: number;
  items: ItemCatFlat[];
  formulaToEdit?: Formula | null;
  saving?: boolean;
  onSave: (data: { nombre: string; descripcion: string; codigo: { tokens: FormulaToken[] } }) => void;
  onClose: () => void;
}

/* ── Icons ── */
function IconX({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconSearch({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function IconDelete({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" /></svg>;
}
function IconSave({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
}
function IconSpinner({ size = 14 }: { size?: number }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

/* ── Operator buttons config ── */
const OPERATORS = ['+', '−', '×', '÷', '(', ')'];
const OP_MAP: Record<string, string> = { '−': '-', '×': '*', '÷': '/' };

/* ── Token chip ── */
function TokenChip({ token, onRemove }: { token: FormulaToken; onRemove: () => void }) {
  const cls = {
    item: styles.chipItem,
    operator: styles.chipOperator,
    number: styles.chipNumber,
    paren: styles.chipParen,
  }[token.type];

  return (
    <span className={`${styles.chip} ${cls}`}>
      {token.type === 'item' ? (
        <>
          <span className={styles.chipLabel} title={token.itemNombre}>{token.value}</span>
          <button className={styles.chipRemove} onClick={onRemove}><IconX size={9} /></button>
        </>
      ) : (
        <>
          <span className={styles.chipLabel}>{token.value}</span>
          <button className={styles.chipRemove} onClick={onRemove}><IconX size={9} /></button>
        </>
      )}
    </span>
  );
}

/* ── FormulaBuilder Modal ── */
export default function FormulaBuilder({ items, formulaToEdit, saving = false, onSave, onClose }: Props) {
  const [nombre, setNombre] = useState(formulaToEdit?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(formulaToEdit?.descripcion ?? '');
  const [tokens, setTokens] = useState<FormulaToken[]>(formulaToEdit?.codigo?.tokens ?? []);
  const [search, setSearch] = useState('');
  const [numberInput, setNumberInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const allItems = items;
  const filtered = allItems.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.codigo ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (item: ItemCatFlat) => {
    setTokens(prev => [...prev, {
      type: 'item',
      value: item.nombre,
      itemId: item.id,
      itemNombre: item.nombre,
    }]);
  };

  const addOperator = (op: string) => {
    const realOp = OP_MAP[op] ?? op;
    const isParen = op === '(' || op === ')';
    setTokens(prev => [...prev, {
      type: isParen ? 'paren' : 'operator',
      value: op,
    }]);
  };

  const addNumber = () => {
    const n = numberInput.trim();
    if (!n || isNaN(Number(n))) return;
    setTokens(prev => [...prev, { type: 'number', value: n }]);
    setNumberInput('');
  };

  const removeToken = (idx: number) => {
    setTokens(prev => prev.filter((_, i) => i !== idx));
  };

  const clearAll = () => setTokens([]);
  const undoLast = () => setTokens(prev => prev.slice(0, -1));

  const handleSave = () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (tokens.length === 0) { setError('La fórmula no puede estar vacía.'); return; }
    setError(null);
    onSave({ nombre: nombre.trim(), descripcion: descripcion.trim(), codigo: { tokens } });
  };

  // Expression preview string
  const exprPreview = tokens.map(t => t.value).join(' ');

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className={styles.modal}>

        {/* Modal header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>
              {formulaToEdit ? 'Editar fórmula' : 'Nueva fórmula'}
            </h2>
            <p className={styles.modalSub}>Selecciona ítems del catálogo y combínalos con operadores</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><IconX size={16} /></button>
        </div>

        <div className={styles.modalBody}>

          {/* Left: meta + builder */}
          <div className={styles.builderCol}>

            {/* Meta fields */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Nombre de la fórmula <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                placeholder="Ej: Ingreso neto mensual"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Descripción <span className={styles.optional}>(opcional)</span></label>
              <input
                className={styles.input}
                placeholder="Ej: Suma de todos los ingresos menos gastos fijos"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </div>

            {/* Operators */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Operadores</label>
              <div className={styles.opRow}>
                {OPERATORS.map(op => (
                  <button key={op} className={styles.opBtn} onClick={() => addOperator(op)}>{op}</button>
                ))}
                {/* Número */}
                <input
                  className={styles.numberInput}
                  type="number"
                  placeholder="Constante..."
                  value={numberInput}
                  onChange={e => setNumberInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNumber()}
                />
                <button className={styles.addNumberBtn} onClick={addNumber} disabled={!numberInput.trim() || isNaN(Number(numberInput))}>
                  + número
                </button>
              </div>
            </div>

            {/* Expression canvas */}
            <div className={styles.fieldGroup}>
              <div className={styles.canvasHeader}>
                <label className={styles.label}>Expresión</label>
                <div className={styles.canvasActions}>
                  <button className={styles.canvasActionBtn} onClick={undoLast} disabled={tokens.length === 0} title="Deshacer último">
                    {/* <IconUndo size={12} /> */}
                    :)
                  </button>
                  <button className={styles.canvasActionBtn} onClick={clearAll} disabled={tokens.length === 0} title="Limpiar todo">
                    <IconDelete size={12} />
                  </button>
                </div>
              </div>
              <div className={`${styles.canvas} ${tokens.length === 0 ? styles.canvasEmpty : ''}`}>
                {tokens.length === 0 ? (
                  <span className={styles.canvasPlaceholder}>
                    Añade ítems del catálogo y operadores para construir la fórmula…
                  </span>
                ) : (
                  tokens.map((t, i) => (
                    <TokenChip key={i} token={t} onRemove={() => removeToken(i)} />
                  ))
                )}
              </div>

              {/* Raw preview */}
              {tokens.length > 0 && (
                <div className={styles.exprPreview}>
                  <span className={styles.exprPreviewLabel}>Vista previa:</span>
                  <code className={styles.exprPreviewCode}>{exprPreview}</code>
                </div>
              )}
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>

          {/* Right: item picker */}
          <div className={styles.pickerCol}>
            <div className={styles.pickerHeader}>
              <span className={styles.pickerTitle}>Ítems y grupos</span>
              <span className={styles.pickerCount}>{allItems.length}</span>
            </div>
            <div className={styles.searchWrap}>
              <IconSearch size={13} />
              <input
                className={styles.searchInput}
                placeholder="Buscar…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.itemList}>
              {filtered.length === 0 ? (
                <div className={styles.itemListEmpty}>
                  {allItems.length === 0 ? 'No hay ítems en este catálogo' : 'Sin resultados'}
                </div>
              ) : (
                filtered.map(item => (
                  <button
                    key={item.id}
                    className={`${styles.itemBtn} ${item.contenedor ? styles.itemBtnGroup : ''}`}
                    onClick={() => addItem(item)}
                    title={`Añadir ${item.nombre}`}
                  >
                    <div className={styles.itemBtnInner}>
                      {item.codigo && (
                        <span className={styles.itemCode}>{item.codigo}</span>
                      )}
                      <span className={styles.itemNombre}>{item.nombre}</span>
                    </div>
                    <span className={styles.itemAdd}>+</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancelar</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving
              ? <><IconSpinner size={14} /> Guardando...</>
              : <><IconSave size={14} /> {formulaToEdit ? 'Guardar cambios' : 'Crear fórmula'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}