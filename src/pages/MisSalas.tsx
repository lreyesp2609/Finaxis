import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import styles from './MisSalas.module.css';

/* ── Icons ── */
function IconInicio() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconAnalisis() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSalas({ isActive }: { isActive?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#185FA5" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconUnirse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconX({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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



function IconGlobe({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
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

function IconUsers({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCopy({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconClock({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ── Sidebar Item Component ── */
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px',
        fontWeight: 500, cursor: 'pointer', backgroundColor: active ? '#E6F1FB' : 'transparent', color: active ? '#185FA5' : '#64748b',
        transition: 'all 0.15s ease', marginBottom: '2px'
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#1e293b'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

export default function MisSalas() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [nombrePersona, setNombrePersona] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for Lists
  const [salasList, setSalasList] = useState<any[]>([]);
  
  // Form Visibility
  const [showForm, setShowForm] = useState(false);
  const [showInlinePicker, setShowInlinePicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'mis' | 'publicos'>('mis');
  
  // Form Fields
  const [fNombre, setFNombre] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCatalog, setFCatalog] = useState<any>(null);
  const [fInicio, setFInicio] = useState('');
  const [fFin, setFFin] = useState('');
  const [fTime, setFTime] = useState('');
  const [fCanView, setFCanView] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [searchPicker, setSearchPicker] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mock Data
  const publicCatalogs = [
    { id: 'p1', nombre: 'Catálogo SB Bancos 2024', cuentas: 450, autor: 'Sistema', tipo: 'public' },
    { id: 'p2', nombre: 'Catálogo Empresa Comercial', cuentas: 120, autor: 'Sistema', tipo: 'public' }
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

  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    const handlePopState = () => { window.history.pushState(null, document.title, window.location.href); };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, []);

  const handleLogout = async () => { await signOut(); window.location.replace('/login'); };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createSala = async () => {
    if (!fNombre || !fCatalog) return;
    setIsCreating(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const randomCode = "FIN-" + Math.floor(1000 + Math.random() * 9000);
    const newSala = {
      id: Date.now().toString(),
      nombre: fNombre,
      descripcion: fDesc,
      catalogo_nombre: fCatalog.nombre,
      codigo: randomCode,
      status: 'Activa',
      participantes: 0,
      tiempo: fTime || 'Sin límite',
      created_at: new Date().toISOString()
    };
    
    setSalasList([newSala, ...salasList]);
    setIsCreating(false);
    setShowForm(false);
    // Reset fields
    setFNombre(''); setFDesc(''); setFCatalog(null); setFInicio(''); setFFin(''); setFTime('');
    showToast('✓ Sala creada exitosamente');
  };

  if (loading) return null;
  const initials = nombrePersona ? nombrePersona.charAt(0).toUpperCase() : '?';

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <aside style={{ width: '220px', backgroundColor: '#f8fafc', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', paddingLeft: '4px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: '#185FA5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="white"><polygon points="3,13 8,3 13,13" /></svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>Finaxis</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '12px' }}>GENERAL</div>
          <SidebarItem icon={<IconInicio />} label="Inicio" onClick={() => navigate('/dashboard')} />
          <SidebarItem icon={<IconAnalisis />} label="Mis análisis" onClick={() => navigate('/dashboard/analisis')} />
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', margin: '24px 0 12px 0', paddingLeft: '12px' }}>SALAS</div>
          <SidebarItem icon={<IconSalas isActive={true} />} label="Mis salas" active={true} />
          <SidebarItem icon={<IconUnirse />} label="Unirse a sala" onClick={() => navigate('/dashboard/unirse')} />
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
        <div className={styles.topBar}>
          <div className={styles.titleSection}>
            <h2>Mis salas</h2>
            <p>Salas que has creado</p>
          </div>
          {!showForm && (
            <button className={styles.primaryBtn} onClick={() => setShowForm(true)}>+ Crear sala</button>
          )}
        </div>

        <main className={styles.contentArea}>
          {showForm ? (
            <div className={styles.inlineFormCard}>
              <div className={styles.formHeader}>
                <h3>Nueva sala</h3>
                <button className={styles.closeFormBtn} onClick={() => setShowForm(false)}><IconX /></button>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre</label>
                  <input type="text" className={styles.inputField} placeholder="Ej: Análisis Balance General - Grupo A" value={fNombre} onChange={e => setFNombre(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Descripción</label>
                  <textarea className={`${styles.inputField} ${styles.textareaField}`} rows={2} placeholder="Descripción opcional de la sala..." value={fDesc} onChange={e => setFDesc(e.target.value)} />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Catálogo de cuentas</label>
                  <button className={`${styles.outlineBtn} ${styles.outlineBtnBlue}`} onClick={() => setShowInlinePicker(!showInlinePicker)}>
                    📋 Seleccionar catálogo
                  </button>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Requerido — define las cuentas a trabajar</span>
                  {fCatalog && (
                    <div className={styles.selectionDisplay} style={{ backgroundColor: '#E6F1FB', borderColor: '#185FA5' }}>
                      <span className={styles.selectionText} style={{ color: '#185FA5' }}><IconCheck color="#185FA5" /> {fCatalog.nombre}</span>
                      <button className={styles.removeBtn} onClick={() => setFCatalog(null)}><IconX size={14} /></button>
                    </div>
                  )}
                </div>

                {showInlinePicker && (
                  <div className={styles.inlineSelector}>
                    <div className={styles.selectorTabs}>
                      <button className={`${styles.selTab} ${pickerTab === 'mis' ? styles.selTabActive : ''}`} onClick={() => setPickerTab('mis')}>Mis catálogos</button>
                      <button className={`${styles.selTab} ${pickerTab === 'publicos' ? styles.selTabActive : ''}`} onClick={() => setPickerTab('publicos')}>Catálogos públicos</button>
                    </div>
                    <div className={styles.pickerContent}>
                      {pickerTab === 'mis' ? (
                        <div style={{ textAlign: 'center', padding: '12px', fontSize: '13px', color: '#64748b' }}>
                          No tienes catálogos. <span style={{ color: '#185FA5', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/dashboard/analisis')}>Ir a Catálogos →</span>
                        </div>
                      ) : (
                        <div>
                          <input type="text" className={styles.inputField} style={{ width: '100%', marginBottom: '12px', fontSize: '12px' }} placeholder="Buscar..." value={searchPicker} onChange={e => setSearchPicker(e.target.value)} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {publicCatalogs.filter(c => c.nombre.toLowerCase().includes(searchPicker.toLowerCase())).map(c => (
                              <div key={c.id} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }} onClick={() => { setFCatalog(c); setShowInlinePicker(false); }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><IconGlobe size={14}/><span className={styles.badgePub}>Público</span></div>
                                 <div style={{ fontSize: '12px', fontWeight: 600 }}>{c.nombre}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.rowInputs}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Fecha de inicio</label>
                    <input type="datetime-local" className={styles.inputField} value={fInicio} onChange={e => setFInicio(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Fecha de fin</label>
                    <input type="datetime-local" className={styles.inputField} value={fFin} onChange={e => setFFin(e.target.value)} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tiempo límite por participante (minutos)</label>
                  <input type="number" className={styles.inputField} placeholder="Ej: 90 — dejar vacío para sin límite" min="1" value={fTime} onChange={e => setFTime(e.target.value)} />
                </div>

                <div className={styles.toggleContainer}>
                   <div className={`${styles.toggleSwitch} ${fCanView ? styles.toggleSwitchActive : ''}`} onClick={() => setFCanView(!fCanView)}>
                      <div className={`${styles.toggleCircle} ${fCanView ? styles.toggleCircleActive : ''}`} />
                   </div>
                   <div className={styles.toggleLabel}>
                      <span className={styles.toggleText}>Permitir ver resultados al finalizar</span>
                      <span className={styles.toggleDesc}>Los participantes podrán ver sus resultados cuando la sala termine</span>
                   </div>
                </div>

                <div className={styles.formFooter}>
                   <button className={styles.secondaryBtn} onClick={() => setShowForm(false)}>Cancelar</button>
                   <button className={styles.primaryBtn} disabled={!fNombre || !fCatalog || isCreating} onClick={createSala}>
                      {isCreating ? <><div className={styles.spinner}/> Creando...</> : 'Crear sala'}
                   </button>
                </div>
              </div>
            </div>
          ) : salasList.length === 0 ? (
            <div className={styles.emptyState}>
              <IconUsers />
              <h3>No has creado ninguna sala aún</h3>
              <p>Crea una sala y comparte el código con tus participantes</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {salasList.map(sala => (
                <div key={sala.id} className={styles.card}>
                   <div className={styles.cardRow}>
                      <h4 className={styles.cardTitle}>{sala.nombre}</h4>
                      <span className={`${styles.statusBadge} ${styles.statusGreen}`}>{sala.status}</span>
                   </div>
                   <div className={styles.codeBox}>
                      <span className={styles.codeLabel}>Código: {sala.codigo}</span>
                      <button className={styles.copyBtn} onClick={() => copyCode(sala.codigo)}>
                         <IconCopy />
                         {copiedId === sala.codigo && <span className={styles.tooltip}>¡Copiado!</span>}
                      </button>
                   </div>
                   <div className={styles.cardMetaRow}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📋 {sala.catalogo_nombre}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>👥 {sala.participantes} participantes</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconClock /> {sala.tiempo === 'Sin límite' ? 'Sin límite' : `${sala.tiempo} min`}</span>
                   </div>
                   <p className={styles.cardDesc}>{sala.descripcion || 'Sin descripción'}</p>
                   <div className={styles.cardFooter}>
                      <span className={styles.dateText}>{new Date(sala.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <div className={styles.cardActions}>
                         <button className={styles.primaryBtn} style={{ padding: '6px 12px', fontSize: '12px' }}>Ver sala</button>
                         <button className={styles.menuBtn}><IconDots /></button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
