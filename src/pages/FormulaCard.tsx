import { useState } from 'react';
import styles from './FormulaCard.module.css';

/* ── Types ── */
export interface FormulaToken {
  type: 'item' | 'operator' | 'number' | 'paren';
  value: string;
  itemId?: number;
  itemNombre?: string;
}

export interface Formula {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: { tokens: FormulaToken[] };
  created_at: string;
  user: string;
  idcatalogo: number;
}

/* ── Icons ── */
function IconFunction({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="3" y1="12" x2="15" y2="12" />
    </svg>
  );
}

function IconEdit({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconCopy({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ── Token renderer ── */
function TokenPreview({ token }: { token: FormulaToken }) {
  if (token.type === 'item') {
    return (
      <span className={styles.tokenItem} title={token.itemNombre}>
        {token.value}
      </span>
    );
  }
  if (token.type === 'operator') {
    return <span className={styles.tokenOperator}>{token.value}</span>;
  }
  if (token.type === 'number') {
    return <span className={styles.tokenNumber}>{token.value}</span>;
  }
  if (token.type === 'paren') {
    return <span className={styles.tokenParen}>{token.value}</span>;
  }
  return null;
}

/* ── FormulaCard ── */
export default function FormulaCard({
  formula,
  onEdit,
  onDelete,
}: {
  formula: Formula;
  onEdit: (f: Formula) => void;
  onDelete: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const tokens = formula.codigo?.tokens ?? [];
  const tokenCount = tokens.filter(t => t.type === 'item').length;

  const handleCopy = () => {
    const expr = tokens.map(t => t.value).join(' ');
    navigator.clipboard.writeText(expr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`${styles.card} ${confirmDelete ? styles.cardConfirming : ''}`}>

      {/* Confirmación inline de eliminación */}
      {confirmDelete && (
        <div className={styles.deleteConfirm}>
          <span className={styles.deleteConfirmText}>
            ¿Eliminar <strong>{formula.nombre}</strong>?
          </span>
          <div className={styles.deleteConfirmActions}>
            <button
              className={styles.deleteConfirmNo}
              onClick={() => setConfirmDelete(false)}
            >
              <IconX size={11} /> No
            </button>
            <button
              className={styles.deleteConfirmYes}
              onClick={() => { setConfirmDelete(false); onDelete(formula.id); }}
            >
              <IconCheck size={11} /> Sí, eliminar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardIconWrap}>
          <IconFunction size={15} />
        </div>
        <div className={styles.cardTitleGroup}>
          <span className={styles.cardNombre}>{formula.nombre}</span>
          <span className={styles.cardMeta}>
            {tokenCount} cuenta{tokenCount !== 1 ? 's' : ''} ·{' '}
            {new Date(formula.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
        <div className={styles.cardActions}>
          <button
            className={styles.cardActionBtn}
            title="Editar fórmula"
            onClick={() => onEdit(formula)}
          >
            <IconEdit size={13} />
          </button>
          <button
            className={`${styles.cardActionBtn} ${styles.cardActionBtnDanger}`}
            title="Eliminar fórmula"
            onClick={() => setConfirmDelete(true)}
          >
            <IconTrash size={13} />
          </button>
        </div>
      </div>

      {/* Descripción */}
      {formula.descripcion && (
        <p className={styles.cardDesc}>{formula.descripcion}</p>
      )}

      {/* Preview de tokens */}
      {tokens.length > 0 ? (
        <div className={styles.tokenRow}>
          {tokens.map((t, i) => (
            <TokenPreview key={i} token={t} />
          ))}
        </div>
      ) : (
        <div className={styles.tokenEmpty}>Sin fórmula definida</div>
      )}

      {/* Footer */}
      <div className={styles.cardFooter}>
        <span className={styles.cardBadge}>
          <IconFunction size={10} /> Fórmula
        </span>
        <button
          className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
          title="Copiar expresión"
          onClick={handleCopy}
        >
          {copied
            ? <><IconCheck size={11} /> ¡Copiado!</>
            : <><IconCopy size={11} /> Copiar</>
          }
        </button>
      </div>
    </div>
  );
}