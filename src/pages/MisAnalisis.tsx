import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import styles from './MisAnalisis.module.css';

/* ── Icons ── */
function IconX({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="22" x2="9" y2="18" /><line x1="15" y1="22" x2="15" y2="18" />
      <path d="M12 22v-4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
      <path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M12 10h.01" />
      <path d="M8 14h.01" /><path d="M16 14h.01" /><path d="M12 14h.01" />
    </svg>
  );
}

function IconAttachment() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function IconDots() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}

/* ── Mock Data ── */
const initialEmpresas = [
  {
    id: 1,
    nombre: 'Banco de Desarrollo del Ecuador',
    tipo: 'Financiera' as const,
    catalogoGenericoId: 1,
    estados: [
      { id: 1, nombre: 'Balance General', periodo: '2024', fecha: '31/12/2024', catalogoAjustado: true },
      { id: 2, nombre: 'Balance General', periodo: '2025', fecha: '31/12/2025', catalogoAjustado: false },
    ]
  },
  {
    id: 2,
    nombre: 'Comercial Los Andes S.A.',
    tipo: 'Comercial' as const,
    catalogoGenericoId: 2,
    estados: [
      { id: 3, nombre: 'Balance General', periodo: '2024', fecha: '31/12/2024', catalogoAjustado: true },
    ]
  }
];

export default function MisAnalisis() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Core States
  const [empresas, setEmpresas] = useState(initialEmpresas);

  // Modals
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);
  const [analisisTargetId, setAnalisisTargetId] = useState<number | null>(null);

  // Form Fields - Nueva Empresa
  const [newEmpNombre, setNewEmpNombre] = useState('');
  const [newEmpTipo, setNewEmpTipo] = useState<'Financiera' | 'Comercial'>('Financiera');

  // Form Fields - Nuevo Análisis
  const [formAnNombre, setFormAnNombre] = useState('');
  const [formAnPeriodo, setFormAnPeriodo] = useState('2025');
  const [formAnFile, setFormAnFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{ count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!user) return;
      await supabase.from('personas').select('nombre').eq('id', user.id).maybeSingle();
      setLoading(false);
    }
    init();
  }, [user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const analisisTargetEmpresa = empresas.find(e => e.id === analisisTargetId);

  const handleCreateEmpresa = () => {
    if (!newEmpNombre.trim()) return;
    const catId = newEmpTipo === 'Financiera' ? 1 : 2;
    const newEmp = {
      id: Date.now(),
      nombre: newEmpNombre,
      tipo: newEmpTipo,
      catalogoGenericoId: catId,
      estados: [] as typeof initialEmpresas[0]['estados']
    };
    setEmpresas([newEmp, ...empresas]);
    setShowEmpresaModal(false);
    setNewEmpNombre('');
    showToast('✓ Empresa creada exitosamente');
  };

  const handleAddAnalisis = () => {
    if (!formAnNombre || !analisisTargetId) return;
    setIsCreating(true);
    setTimeout(() => {
      const newSt = {
        id: Date.now(),
        nombre: formAnNombre,
        periodo: formAnPeriodo,
        fecha: `31/12/${formAnPeriodo}`,
        catalogoAjustado: false
      };
      setEmpresas(prev => prev.map(emp => {
        if (emp.id === analisisTargetId) {
          return { ...emp, estados: [newSt, ...emp.estados] };
        }
        return emp;
      }));
      setIsCreating(false);
      setShowAnalisisModal(false);
      setFormAnNombre('');
      setFormAnPeriodo('2025');
      setFormAnFile(null);
      setExtractionResult(null);
      setAnalisisTargetId(null);
      showToast('✓ Análisis cargado exitosamente');
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormAnFile(file);
    if (file) {
      setExtractionResult({ count: 142 });
    }
  };

  const openAnalisisModal = (empresaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnalisisTargetId(empresaId);
    setShowAnalisisModal(true);
  };

  if (loading) return null;

  return (
    <>
      <style>{`
        .emp-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: box-shadow 0.2s;
          max-width: 900px;
        }
        .emp-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
        .emp-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: #f0f7ff; color: #185FA5;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .emp-badge-fin {
          background: #e0f0ff; color: #185FA5; border-radius: 20px;
          padding: 3px 10px; font-size: 12px; font-weight: 600;
        }
        .emp-badge-com {
          background: #fff3e0; color: #b45309; border-radius: 20px;
          padding: 3px 10px; font-size: 12px; font-weight: 600;
        }
        .emp-divider { border: none; border-top: 1px solid #f1f5f9; margin: 16px 0; }
        .estado-mini {
          background: #f8fafc; border: 1px solid #e5e7eb;
          border-radius: 8px; padding: 12px 14px; min-width: 160px; flex-shrink: 0;
        }
        .estado-mini-name { font-weight: 600; font-size: 14px; color: #111827; margin: 0 0 2px 0; }
        .estado-mini-period { font-size: 13px; color: #6b7280; margin: 0; }
        .estado-mini-link {
          font-size: 13px; color: #185FA5; cursor: pointer;
          display: block; margin-top: 8px;
          background: none; border: none; padding: 0; font-weight: 500;
        }
        .estado-mini-link:hover { text-decoration: underline; }
        .agregar-mini {
          background: white; border: 2px dashed #d1d5db;
          border-radius: 8px; padding: 12px 14px; min-width: 140px;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 4px; color: #9ca3af;
          cursor: pointer; flex-shrink: 0;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .agregar-mini:hover { border-color: #185FA5; color: #185FA5; background: #f0f7ff; }
        .emp-menu-btn {
          margin-left: auto; background: none; border: 1px solid #e5e7eb;
          border-radius: 8px; padding: 6px 8px; cursor: pointer;
          color: #94a3b8; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .emp-menu-btn:hover { border-color: #d1d5db; color: #374151; }
      `}</style>

      {toast && <div className={styles.toast}>{toast}</div>}

      {/* ── TOP BAR ── */}
      <div className={styles.topBar}>
        <div className={styles.titleSection}>
          <h2>Empresas</h2>
          <p>Gestiona tus empresas y análisis</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowEmpresaModal(true)}>+ Nueva empresa</button>
      </div>

      {/* ── EMPRESA LIST ── */}
      <main style={{ padding: '32px 40px' }}>
        {empresas.length === 0 ? (
          <div className={styles.emptyState}>
            <IconBuilding />
            <h3>No tienes empresas aún</h3>
            <p>Registra tu primera empresa para comenzar</p>
            <button className={styles.primaryBtn} onClick={() => setShowEmpresaModal(true)} style={{ margin: '0 auto' }}>
              + Nueva empresa
            </button>
          </div>
        ) : (
          empresas.map(emp => (
            <div key={emp.id} className="emp-card">
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="emp-icon">{emp.tipo === 'Financiera' ? '🏦' : '🏪'}</div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>{emp.nombre}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className={emp.tipo === 'Financiera' ? 'emp-badge-fin' : 'emp-badge-com'}>{emp.tipo}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>· {emp.estados.length} estados financieros</span>
                  </div>
                </div>
                <button className="emp-menu-btn" onClick={e => e.stopPropagation()} title="Opciones">
                  <IconDots />
                </button>
              </div>

              <hr className="emp-divider" />

              {/* Estados mini-cards */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                {emp.estados.map(st => (
                  <div key={st.id} className="estado-mini">
                    <p className="estado-mini-name">{st.nombre}</p>
                    <p className="estado-mini-period">{st.periodo}</p>
                    <button className="estado-mini-link" title="Próximamente">Ver análisis</button>
                  </div>
                ))}
                <div className="agregar-mini" onClick={e => openAnalisisModal(emp.id, e)}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>Agregar análisis</span>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* ── MODALES ── */}

      {showEmpresaModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Nueva empresa</h3>
              <button className={styles.closeBtn} onClick={() => setShowEmpresaModal(false)}><IconX size={20} /></button>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de la empresa *</label>
              <input type="text" className={styles.inputField} placeholder="Ej: Banco de Desarrollo del Ecuador"
                value={newEmpNombre} onChange={e => setNewEmpNombre(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de empresa *</label>
              <div className={styles.typeToggleGroup}>
                <div className={`${styles.typeToggleBtn} ${newEmpTipo === 'Financiera' ? styles.typeToggleBtnActive : ''}`}
                  onClick={() => setNewEmpTipo('Financiera')}>🏦 Financiera</div>
                <div className={`${styles.typeToggleBtn} ${newEmpTipo === 'Comercial' ? styles.typeToggleBtnActive : ''}`}
                  onClick={() => setNewEmpTipo('Comercial')}>🏪 Comercial</div>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Catálogo genérico asignado:</label>
              <input type="text" className={styles.inputField} readOnly
                value={newEmpTipo === 'Financiera' ? 'Catálogo SB Financiero' : 'Catálogo NIIF Comercial'}
                style={{ background: '#f8fafc' }} />
              <p className={styles.autoFillInfo}>Se asigna automáticamente según el tipo</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button className={styles.secondaryBtn} onClick={() => setShowEmpresaModal(false)}>Cancelar</button>
              <button className={styles.primaryBtn} disabled={!newEmpNombre.trim()} onClick={handleCreateEmpresa}>
                Crear empresa →
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnalisisModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Nuevo análisis — {analisisTargetEmpresa?.nombre}</h3>
              <button className={styles.closeBtn} onClick={() => { setShowAnalisisModal(false); setAnalisisTargetId(null); }}>
                <IconX size={20} />
              </button>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre del estado *</label>
              <input type="text" className={styles.inputField} placeholder="Ej: Balance General 2025"
                value={formAnNombre} onChange={e => setFormAnNombre(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Período *</label>
              <input type="number" className={styles.inputField} value={formAnPeriodo}
                onChange={e => setFormAnPeriodo(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Archivo PDF</label>
              <button className={styles.outlineBtn} style={{ width: '100%' }} onClick={() => fileInputRef.current?.click()}>
                <IconAttachment /> {formAnFile ? 'PDF Seleccionado' : 'Subir PDF'}
              </button>
              <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleFileChange} />
              {formAnFile && (
                <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', fontWeight: 500 }}>
                  ✓ {formAnFile.name}
                </div>
              )}
            </div>
            {extractionResult && (
              <div className={styles.extractionAlert}>
                <p>✓ Se encontraron {extractionResult.count} cuentas en el PDF</p>
                {analisisTargetEmpresa?.estados.length === 0 ? (
                  <span>Se creará el catálogo base</span>
                ) : (
                  <span>Se comparará con el catálogo {analisisTargetEmpresa?.estados[0].periodo}</span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button className={styles.secondaryBtn} onClick={() => { setShowAnalisisModal(false); setAnalisisTargetId(null); }}>
                Cancelar
              </button>
              <button className={styles.primaryBtn} disabled={!formAnNombre || isCreating} onClick={handleAddAnalisis}>
                {isCreating ? 'Cargando...' : 'Cargar análisis →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
