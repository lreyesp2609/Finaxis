import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

/* ── Icons ─────────────────────────────────────── */
function IconInicio({ isActive }: { isActive?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#185FA5" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconAnalisis() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
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


/* ── Sidebar Item Component ────────────────────── */
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps & { onClick?: () => void }) {
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
      transition: 'all 0.2s',
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
    }}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

/* ── Main content components ───────────────────── */
function QuickActionCard({ icon, title, description, isDashed, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: isDashed ? '1.5px dashed #e5e7eb' : '1px solid #e5e7eb',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#185FA5';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isDashed ? '#e5e7eb' : '#e5e7eb';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: isDashed ? '#f8fafc' : '#E6F1FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#185FA5'
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{description}</p>
      </div>
    </div>
  );
}

/* ── Dashboard Component ────────────────────────── */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [nombrePersona, setNombrePersona] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  useEffect(() => {
    async function getPersona() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('personas')
          .select('nombre')
          .eq('id', user.id)
          .maybeSingle();

        if (data) setNombrePersona(data.nombre);
      } catch (err) {
        console.error('Error fetching persona:', err);
      } finally {
        setLoading(false);
      }
    }
    getPersona();
  }, [user]);

  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, document.title, window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.replace('/login');
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = nombrePersona ? nombrePersona.charAt(0).toUpperCase() : '?';

  return (
    <div className="dashboard-page">
      <style>{`
        .dashboard-page {
          display: flex;
          height: 100vh;
          background-color: #ffffff;
          font-family: system-ui, -apple-system, sans-serif;
          color: #1e293b;
          overflow: hidden;
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow-y: auto;
          padding: 2rem;
        }
        .sidebar {
          width: 220px;
          background-color: #f8fafc;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          transition: transform 0.3s ease;
        }
        .hamburger {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 50;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(2px);
          z-index: 90;
        }
        .close-sidebar {
          display: none;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 100;
            transform: translateX(-100%);
            box-shadow: 2px 0 8px rgba(0,0,0,0.1);
          }
          .sidebar-open {
            transform: translateX(0);
          }
          .hamburger {
            display: block;
          }
          .sidebar-overlay {
            display: block;
          }
          .close-sidebar {
            display: block;
          }
          .main-content {
            padding: 4rem 1.5rem 1.5rem 1.5rem;
          }
          .top-bar-flex {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.75rem;
          }
          .grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .main-content {
            padding: 4rem 1rem 1rem 1rem;
          }
        }
      `}</style>

      {/* Botón Hamburguesa Móvil */}
      <button className="hamburger" onClick={() => setIsSidebarOpen(true)}>
        <IconMenu />
      </button>

      {/* Overlay para cerrar sidebar en móvil */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', paddingLeft: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#185FA5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="white"><polygon points="3,13 8,3 13,13" /></svg>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>Finaxis</span>
          </div>
          <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
            <IconX size={20} />
          </button>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '12px' }}>GENERAL</div>
          <SidebarItem icon={<IconInicio isActive={location.pathname === '/dashboard'} />} label="Inicio" active={location.pathname === '/dashboard'} onClick={() => { navigate('/dashboard'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<IconAnalisis />} label="Mis análisis" active={location.pathname === '/dashboard/analisis'} onClick={() => { navigate('/dashboard/analisis'); setIsSidebarOpen(false); }} />

          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', margin: '24px 0 12px 0', paddingLeft: '12px' }}>SALAS</div>
          <SidebarItem icon={<IconSalas />} label="Mis salas" active={location.pathname === '/dashboard/salas'} onClick={() => { navigate('/dashboard/salas'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={<IconUnirse />} label="Unirse a sala" active={location.pathname === '/dashboard/unirse'} onClick={() => { navigate('/dashboard/unirse'); setIsSidebarOpen(false); }} />
        </div>

        {/* Sidebar Bottom (User info) */}
        <div style={{ 
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#185FA5',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 600
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nombrePersona || 'Usuario'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#d1d5db',
              cursor: 'pointer',
              display: 'flex'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#d1d5db';
            }}
          >
            <IconLogout />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <header style={{
          height: '64px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '2rem'
        }} className="top-bar-flex">
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>¡Hola, {nombrePersona || 'Usuario'}! 👋</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Bienvenido a tu panel de control financiero.</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard/analisis')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#185FA5', color: 'white',
              border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(24, 95, 165, 0.2)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#14508a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#185FA5'}
          >
            <IconPlus />
            Nuevo Análisis
          </button>
        </header>

        <main style={{ flex: 1 }}>
          <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <QuickActionCard 
              icon={<IconPlus />} 
              title="Crear un nuevo análisis" 
              description="Sube estados financieros en PDF y genera análisis vertical, horizontal y ratios."
              onClick={() => navigate('/dashboard/analisis')}
            />
            <QuickActionCard 
              icon={<IconUnirse />} 
              title="Unirse a una sala" 
              description="Usa un código compartido para participar en una sala de colaboración."
              isDashed={true}
              onClick={() => navigate('/dashboard/unirse')}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>MIS SALAS RECIENTES</span>
          </div>

          <div style={{ 
            border: '1px solid #f1f5f9',
            borderRadius: '12px',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa'
          }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Aún no has creado ninguna sala. Crea una para empezar.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

