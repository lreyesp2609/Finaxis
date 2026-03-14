import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './UnirseSala.module.css';

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

function IconSalas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconUnirse({ isActive }: { isActive?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#185FA5" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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


function IconDoor() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconCheckSolid() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}


export default function UnirseSala() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [nombrePersona, setNombrePersona] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  
  const [code, setCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [foundSala, setFoundSala] = useState<any>(null);

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

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    if (val.length > 8) return;
    setCode(val);
    setError('');
  };

  const handleJoin = async () => {
    if (code.length < 8) return;
    setIsSearching(true);
    setError('');
    
    // Mock search
    await new Promise(r => setTimeout(r, 1500));
    
    if (code === 'FIN-1234') {
      setFoundSala({
        nombre: 'Análisis Balance General - Grupo A',
        catalogo: 'Catálogo SB Bancos 2024',
        creador: 'Luis Aaron',
        creator_id: 'other-user-uuid'
      });
    } else if (code === 'FIN-9999') {
      const mockSala = {
        nombre: 'Mi Sala de Prueba',
        catalogo: 'Catálogo Público',
        creador: nombrePersona,
        creator_id: user?.id
      };
      
      if (mockSala.creator_id === user?.id) {
        setError('No puedes unirte a una sala que tú mismo creaste.');
        setIsSearching(false);
        return;
      }
      setFoundSala(mockSala);
    } else {
      setError('No encontramos ninguna sala con ese código. Verifica e intenta de nuevo.');
    }
    setIsSearching(false);
  };

  if (loading) return null;
  const initials = nombrePersona ? nombrePersona.charAt(0).toUpperCase() : '?';

  return (
    <div className={styles.page}>
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
          <SidebarItem icon={<IconAnalisis />} label="Mis análisis" active={location.pathname === '/dashboard/analisis'} onClick={() => navigate('/dashboard/analisis')} />
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', margin: '24px 0 12px 0', paddingLeft: '12px' }}>SALAS</div>
          <SidebarItem icon={<IconSalas />} label="Mis salas" active={location.pathname === '/dashboard/salas'} onClick={() => navigate('/dashboard/salas')} />
          <SidebarItem icon={<IconUnirse isActive={location.pathname === '/dashboard/unirse'} />} label="Unirse a sala" active={location.pathname === '/dashboard/unirse'} />
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
        <div className={styles.centeredContent}>
          <div className={styles.header}>
            <div className={styles.iconBox}><IconDoor /></div>
            <h2>Unirse a una sala</h2>
            <p>Ingresa el código que te compartió el creador de la sala</p>
          </div>

          <div className={styles.card}>
            {foundSala ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}><IconCheckSolid /></div>
                <h3 className={styles.successTitle}>¡Sala encontrada!</h3>
                <div className={styles.salaInfo}>
                   <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Nombre:</span>
                      <span className={styles.infoValue}>{foundSala.nombre}</span>
                   </div>
                   <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Catálogo:</span>
                      <span className={styles.infoValue}>{foundSala.catalogo}</span>
                   </div>
                   <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Creador:</span>
                      <span className={styles.infoValue}>{foundSala.creador}</span>
                   </div>
                </div>
                <button className={styles.confirmBtn} onClick={() => navigate('/dashboard')}>Confirmar y entrar</button>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label className={styles.label}>Código de sala</label>
                <input 
                  type="text" 
                  className={styles.codeInput}
                  placeholder="FIN-0000"
                  value={code}
                  onChange={handleCodeChange}
                />
                {error && <span className={styles.errorText}>{error}</span>}
                <button 
                  className={styles.submitBtn} 
                  disabled={code.length < 8 || isSearching}
                  onClick={handleJoin}
                >
                  {isSearching ? <><div className={styles.spinner}/> Buscando sala...</> : 'Unirse a la sala'}
                </button>
              </div>
            )}
          </div>

          <p className={styles.footerText}>¿No tienes un código? <br/><b>Pide al creador de la sala que te lo comparta.</b></p>
        </div>
      </div>
    </div>
  );
}
