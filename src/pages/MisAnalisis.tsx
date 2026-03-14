import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MisAnalisis.module.css';

/* ── Icons ── */
function IconInicio() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconAnalisis({ isActive }: { isActive?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#185FA5" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSalas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconUnirse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}



function IconX({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}



function IconCheck({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconLock({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconGlobe({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconDots() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
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

function IconList({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

/* ── Sidebar Item Component ── */
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        backgroundColor: active ? '#E6F1FB' : 'transparent',
        color: active ? '#185FA5' : '#64748b',
        transition: 'all 0.15s ease',
        marginBottom: '2px'
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.color = '#1e293b';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#64748b';
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}


export default function MisAnalisis() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'estados' | 'catalogos'>('estados');
  const [nombrePersona, setNombrePersona] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State for Lists
  const [analisisList, setAnalisisList] = useState<any[]>([]);
  const [catalogsList, setCatalogsList] = useState<any[]>([]);
  
  // Form Visibility
  const [showAnalisisForm, setShowAnalisisForm] = useState(false);
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [showInlinePicker, setShowInlinePicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'mis' | 'publicos'>('mis');
  
  // Form Fields - Analysis
  const [formAnNombre, setFormAnNombre] = useState('');
  const [formAnDesc, setFormAnDesc] = useState('');
  const [formAnPeriodo, setFormAnPeriodo] = useState('2024');
  const [formAnFile, setFormAnFile] = useState<File | null>(null);
  const [formAnCatalog, setFormAnCatalog] = useState<any>(null);
  const [isCreatingAn, setIsCreatingAn] = useState(false);
  
  // Form Fields - Catalog
  const [formCatNombre, setFormCatNombre] = useState('');
  const [formCatDesc, setFormCatDesc] = useState('');
  const [formCatFile, setFormCatFile] = useState<File | null>(null);
  const [formCatPublic, setFormCatPublic] = useState(false);
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Search
  const [searchPicker, setSearchPicker] = useState('');

  // Toasts
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);

  // Mock Public Catalogs
  const publicCatalogs = [
    { id: 'p1', nombre: 'Catálogo SB Bancos 2024', cuentas: 450, autor: 'Sistema', tipo: 'public' },
    { id: 'p2', nombre: 'Catálogo Empresa Comercial', cuentas: 120, autor: 'Sistema', tipo: 'public' },
    { id: 'p3', nombre: 'Catálogo PYME Ecuador', cuentas: 85, autor: 'Sistema', tipo: 'public' }
  ];

  useEffect(() => {
    async function init() {
      if (!user) return;
      const { data } = await supabase.from('personas').select('nombre').eq('id', user.id).maybeSingle();
      if (data) setNombrePersona(data.nombre);
      setLoading(false);
    }
    init();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    window.location.replace('/login');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const createAnalisis = async () => {
    if (!formAnNombre || !formAnCatalog || !formAnPeriodo) return;
    setIsCreatingAn(true);
    await new Promise(r => setTimeout(r, 1500));
    const newAn = {
      id: Date.now().toString(),
      nombre: formAnNombre,
      descripcion: formAnDesc,
      catalogo_nombre: formAnCatalog.nombre,
      periodo: formAnPeriodo,
      created_at: new Date().toISOString()
    };
    setAnalisisList([newAn, ...analisisList]);
    setIsCreatingAn(false);
    setShowAnalisisForm(false);
    setFormAnNombre('');
    setFormAnDesc('');
    setFormAnPeriodo('2024');
    setFormAnFile(null);
    setFormAnCatalog(null);
    showToast('✓ Estado financiero creado');
  };

  const createCatalog = async () => {
    if (!formCatNombre) return;
    setIsCreatingCat(true);
    await new Promise(r => setTimeout(r, 1500));
    const newCat = {
      id: Date.now().toString(),
      nombre: formCatNombre,
      descripcion: formCatDesc,
      tipo: formCatPublic ? 'public' : 'private',
      created_at: new Date().toISOString()
    };
    setCatalogsList([newCat, ...catalogsList]);
    setIsCreatingCat(false);
    setShowCatalogForm(false);
    setFormCatNombre('');
    setFormCatDesc('');
    setFormCatFile(null);
    showToast('✓ Catálogo creado');
  };

  if (loading) return null;

  const initials = nombrePersona ? nombrePersona.charAt(0).toUpperCase() : '?';

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}
      {/* Botón Hamburguesa Móvil */}
      <button className={styles.hamburger} onClick={() => setIsSidebarOpen(true)}>
        <IconMenu />
      </button>

      {/* Overlay para cerrar sidebar en móvil */}
      {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', paddingLeft: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#185FA5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="white"><polygon points="3,13 8,3 13,13" /></svg>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>Finaxis</span>
          </div>
          <button className={styles.closeSidebar} onClick={() => setIsSidebarOpen(false)}>
            <IconX size={20} />
          </button>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '12px' }}>GENERAL</div>
          <SidebarItem icon={<IconInicio />} label="Inicio" active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={<IconAnalisis isActive={location.pathname === '/dashboard/analisis'} />} label="Mis análisis" active={location.pathname === '/dashboard/analisis'} onClick={() => navigate('/dashboard/analisis')} />
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', margin: '24px 0 12px 0', paddingLeft: '12px' }}>SALAS</div>
          <SidebarItem icon={<IconSalas />} label="Mis salas" active={location.pathname === '/dashboard/salas'} onClick={() => navigate('/dashboard/salas')} />
          <SidebarItem icon={<IconUnirse />} label="Unirse a sala" active={location.pathname === '/dashboard/unirse'} onClick={() => navigate('/dashboard/unirse')} />
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#185FA5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombrePersona}</div>
            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#d1d5db', cursor: 'pointer' }}><IconLogout /></button>
        </div>
      </aside>

      <div className={styles.main}>
        {/* Tabs Superior */}
        <nav className={styles.tabsNav}>
          <button className={`${styles.tabBtn} ${activeTab === 'estados' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('estados')}>Estados financieros</button>
          <button className={`${styles.tabBtn} ${activeTab === 'catalogos' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('catalogos')}>Catálogos</button>
        </nav>

        <main className={styles.contentArea}>
          
          {activeTab === 'estados' ? (
            <>
              <div className={styles.topBar}>
                <div className={styles.titleSection}>
                  <h2>Estados financieros</h2>
                  <p>Tus análisis de estados financieros</p>
                </div>
                {!showAnalisisForm && (
                  <button className={styles.primaryBtn} onClick={() => setShowAnalisisForm(true)}>+ Crear estado financiero</button>
                )}
              </div>

              {showAnalisisForm ? (
                <div className={styles.inlineFormCard}>
                  <div className={styles.formHeader}>
                    <h3>Nuevo estado financiero</h3>
                    <button className={styles.closeFormBtn} onClick={() => setShowAnalisisForm(false)}><IconX /></button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre</label>
                      <input type="text" className={styles.inputField} placeholder="Ej: Balance General Banco XYZ 2024" value={formAnNombre} onChange={e => setFormAnNombre(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Descripción</label>
                      <textarea className={`${styles.inputField} ${styles.textareaField}`} rows={3} placeholder="Descripción opcional del análisis..." value={formAnDesc} onChange={e => setFormAnDesc(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Período</label>
                      <input type="number" className={styles.inputField} placeholder="Ej: 2024" min="2000" max="2100" value={formAnPeriodo} onChange={e => setFormAnPeriodo(e.target.value)} />
                    </div>
                    <div className={styles.rowInputs}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Archivo PDF</label>
                        <button className={styles.outlineBtn} onClick={() => fileInputRef.current?.click()}>
                          <IconAttachment /> {formAnFile ? formAnFile.name : 'Subir PDF'}
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={e => setFormAnFile(e.target.files?.[0] || null)} />
                        {formAnFile && (
                          <div className={styles.selectionDisplay}>
                            <span className={styles.selectionText}><IconCheck color="#059669" /> {formAnFile.name}</span>
                            <button className={styles.removeBtn} onClick={() => setFormAnFile(null)}><IconX size={14} /></button>
                          </div>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Catálogo</label>
                        <button className={`${styles.outlineBtn} ${styles.outlineBtnBlue}`} onClick={() => setShowInlinePicker(!showInlinePicker)}>
                          📋 Seleccionar catálogo
                        </button>
                        {formAnCatalog && (
                          <div className={styles.selectionDisplay} style={{ backgroundColor: '#E6F1FB', borderColor: '#185FA5' }}>
                            <span className={styles.selectionText} style={{ color: '#185FA5' }}><IconCheck color="#185FA5" /> {formAnCatalog.nombre}</span>
                            <button className={styles.removeBtn} onClick={() => setFormAnCatalog(null)}><IconX size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    {showInlinePicker && (
                      <div className={styles.inlineSelector}>
                         <div className={styles.selectorTabs}>
                            <button className={`${styles.selTab} ${pickerTab === 'mis' ? styles.selTabActive : ''}`} onClick={() => setPickerTab('mis')}>Mis catálogos</button>
                            <button className={`${styles.selTab} ${pickerTab === 'publicos' ? styles.selTabActive : ''}`} onClick={() => setPickerTab('publicos')}>Catálogos públicos</button>
                         </div>
                         <div className={styles.pickerContent}>
                            {pickerTab === 'mis' ? (
                              <div style={{ textAlign: 'center', padding: '12px' }}>
                                {catalogsList.length === 0 ? (
                                  <>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>No tienes catálogos. Ve a la pestaña Catálogos para crear uno.</p>
                                    <span style={{ color: '#185FA5', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }} onClick={() => setActiveTab('catalogos')}>Ir a Catálogos →</span>
                                  </>
                                ) : (
                                  <div className={styles.catalogItem}>
                                     {catalogsList.map(c => (
                                       <div key={c.id} className={styles.catalogItem}>
                                         <div className={styles.catInfo}>
                                           <IconLock /><span className={styles.catName}>{c.nombre}</span>
                                           <span className={styles.badgePriv}>Privado</span>
                                         </div>
                                         <button className={styles.smBtn} onClick={() => { setFormAnCatalog(c); setShowInlinePicker(false); }}>Seleccionar</button>
                                       </div>
                                     ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <input type="text" className={styles.inputField} style={{ width: '100%', marginBottom: '12px', fontSize: '12px', padding: '6px 10px' }} placeholder="Buscar..." value={searchPicker} onChange={e => setSearchPicker(e.target.value)} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  {publicCatalogs.filter(c => c.nombre.toLowerCase().includes(searchPicker.toLowerCase())).map(c => (
                                    <div key={c.id} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }} onClick={() => { setFormAnCatalog(c); setShowInlinePicker(false); }}>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><IconGlobe size={14}/><span className={styles.badgePub}>Público</span></div>
                                       <div style={{ fontSize: '12px', fontWeight: 600 }}>{c.nombre}</div>
                                       <div style={{ fontSize: '10px', color: '#94a3b8' }}>{c.cuentas} cuentas · por: {c.autor}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                         </div>
                      </div>
                    )}

                    <div className={styles.formFooter}>
                       <button className={styles.secondaryBtn} onClick={() => setShowAnalisisForm(false)}>Cancelar</button>
                       <button className={styles.primaryBtn} disabled={!formAnNombre || !formAnCatalog || !formAnPeriodo || isCreatingAn} onClick={createAnalisis}>
                          {isCreatingAn ? <><div className={styles.spinner}/> Creando...</> : 'Crear análisis'}
                       </button>
                    </div>
                  </div>
                </div>
              ) : analisisList.length === 0 ? (
                <div className={styles.emptyState}>
                   <IconList />
                   <h3>No tienes estados financieros aún</h3>
                   <p>Crea tu primer análisis financiero</p>
                </div>
              ) : (
                <div className={styles.grid}>
                   {analisisList.map(an => (
                     <div key={an.id} className={styles.card}>
                        <span className={styles.cardTag}>{an.catalogo_nombre}</span>
                        <h4 className={styles.cardTitle}>{an.nombre}</h4>
                        <p className={styles.cardDesc}>{an.descripcion || 'Sin descripción'}</p>
                        <div className={styles.cardMeta}>Período: {an.periodo}</div>
                        <div className={styles.cardFooter}>
                           <span className={styles.cardMeta}>{new Date(an.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#185FA5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Ver análisis</span>
                              <button className={styles.menuBtn}><IconDots /></button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.topBar}>
                <div className={styles.titleSection}>
                  <h2>Catálogos</h2>
                  <p>Gestiona tus catálogos de cuentas</p>
                </div>
                {!showCatalogForm && (
                  <button className={styles.primaryBtn} onClick={() => setShowCatalogForm(true)}>+ Crear catálogo</button>
                )}
              </div>

              {showCatalogForm ? (
                 <div className={styles.inlineFormCard}>
                    <div className={styles.formHeader}>
                      <h3>Nuevo catálogo</h3>
                      <button className={styles.closeFormBtn} onClick={() => setShowCatalogForm(false)}><IconX /></button>
                    </div>
                    <div className={styles.formGrid}>
                       <div className={styles.formGroup}>
                          <label className={styles.label}>Nombre</label>
                          <input type="text" className={styles.inputField} placeholder="Ej: Catálogo SB Bancos 2024" value={formCatNombre} onChange={e => setFormCatNombre(e.target.value)} />
                       </div>
                       <div className={styles.formGroup}>
                          <label className={styles.label}>Descripción</label>
                          <textarea className={`${styles.inputField} ${styles.textareaField}`} rows={3} placeholder="Descripción opcional..." value={formCatDesc} onChange={e => setFormCatDesc(e.target.value)} />
                       </div>
                       <div className={styles.formGroup}>
                          <label className={styles.label}>Archivo PDF</label>
                          <button className={styles.outlineBtn} onClick={() => catFileInputRef.current?.click()}>
                             <IconAttachment /> {formCatFile ? formCatFile.name : 'Subir PDF del catálogo'}
                          </button>
                          <input type="file" ref={catFileInputRef} hidden accept=".pdf" onChange={e => setFormCatFile(e.target.files?.[0] || null)} />
                       </div>
                       <div className={styles.formGroup}>
                          <label className={styles.label}>Visibilidad</label>
                          <div className={styles.radioGrid}>
                             <div className={`${styles.radioCard} ${!formCatPublic ? styles.radioCardSelectedGray : ''}`} onClick={() => setFormCatPublic(false)}>
                                <div className={`${styles.radioIconBox}`}><IconLock /></div>
                                <div className={styles.radioContent}>
                                   <span className={styles.radioLabel}>Privado</span>
                                   <span className={styles.radioDesc}>Solo tú puedes usarlo</span>
                                </div>
                             </div>
                             <div className={`${styles.radioCard} ${formCatPublic ? styles.radioCardSelected : ''}`} onClick={() => setFormCatPublic(true)}>
                                <div className={`${styles.radioIconBox} ${styles.radioIconBoxBlue}`}><IconGlobe size={18} /></div>
                                <div className={styles.radioContent}>
                                   <span className={styles.radioLabel}>Público</span>
                                   <span className={styles.radioDesc}>Disponible como plantilla para todos</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       <div className={styles.formFooter}>
                          <button className={styles.secondaryBtn} onClick={() => setShowCatalogForm(false)}>Cancelar</button>
                          <button className={styles.primaryBtn} disabled={!formCatNombre || isCreatingCat} onClick={createCatalog}>
                            {isCreatingCat ? <><div className={styles.spinner}/> Creando...</> : 'Crear catálogo'}
                          </button>
                       </div>
                    </div>
                 </div>
              ) : catalogsList.length === 0 ? (
                <div className={styles.emptyState}>
                   <IconList />
                   <h3>No tienes catálogos aún</h3>
                   <p>Crea tu primer catálogo de cuentas</p>
                </div>
              ) : (
                <div className={styles.grid}>
                   {catalogsList.map(cat => (
                     <div key={cat.id} className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: cat.tipo === 'public' ? '#E6F1FB' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.tipo === 'public' ? '#185FA5' : '#64748b' }}>
                              {cat.tipo === 'public' ? <IconGlobe /> : <IconLock />}
                           </div>
                           <span className={`${styles.badge} ${cat.tipo === 'public' ? styles.badgePub : styles.badgePriv}`}>
                              {cat.tipo === 'public' ? 'Público' : 'Privado'}
                           </span>
                        </div>
                        <h4 className={styles.cardTitle}>{cat.nombre}</h4>
                        <p className={styles.cardDesc}>{cat.descripcion || 'Sin descripción'}</p>
                        <div className={styles.cardFooter}>
                           <span className={styles.cardMeta}>{new Date(cat.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#185FA5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Ver cuentas</span>
                              <button className={styles.menuBtn}><IconDots /></button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </>
          )}

        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
