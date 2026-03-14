import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabaseClient';

/* ── Types ─────────────────────────────────────── */
type TipoPerfil = 'personal' | 'docente' | 'alumno';

interface Perfil {
  id: string;
  tipo: TipoPerfil;
}

/* ── Icons ─────────────────────────────────────── */
function PersonalIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function DocenteIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function AlumnoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

const PROFILE_CONFIG: Record<TipoPerfil, { label: string; bg: string; Icon: React.FC<{ size?: number }> }> = {
  personal: { label: 'Personal', bg: '#eff6ff', Icon: PersonalIcon },
  docente:  { label: 'Docente',  bg: '#f2fbf0', Icon: DocenteIcon },
  alumno:   { label: 'Alumno',   bg: '#f5f3ff', Icon: AlumnoIcon },
};

/* ── Dashboard Component ────────────────────────── */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { activeProfile, setActiveProfile, clearProfile } = useProfile();
  const navigate = useNavigate();

  const [otrosPerfiles, setOtrosPerfiles] = useState<Perfil[]>([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── 1. Click Outside Listener for Dropdown ─── */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── 3. Load Other Profiles ─────────────────── */
  useEffect(() => {
    const loadPerfiles = async () => {
      if (!user || !activeProfile) return;
      const { data } = await supabase
        .from('perfiles')
        .select('id, tipo')
        .eq('persona_id', user.id);
        
      if (data) {
        // Only show profiles that aren't the currently active one
        setOtrosPerfiles(data.filter(p => p.id !== activeProfile.id) as Perfil[]);
      }
    };
    loadPerfiles();
  }, [user, activeProfile]);

  /* ── Handlers ───────────────────────────────── */
  const handleSwitchProfile = (perfil: Perfil) => {
    setActiveProfile({ id: perfil.id, tipo: perfil.tipo });
    setShowDropdown(false);
    // Stay on dashboard, logic automatically updates because activeProfile changed
  };

  const handleGestionarPerfiles = () => {
    setShowDropdown(false);
    navigate('/perfiles', { replace: true });
  };

  const handleLogout = async () => {
    await signOut();
    clearProfile();
    window.location.replace('/login');
  };

  /* ── Render Check ───────────────────────────── */
  if (!activeProfile) return null; // Avoid render crash while redirecting

  const config = PROFILE_CONFIG[activeProfile.tipo];
  const ActiveIcon = config.Icon;

  return (
    <div style={{ padding: '0', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      
      {/* ── Navbar ──────────────────────────────── */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.75rem 2rem', 
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '28px', height: '28px', backgroundColor: '#185FA5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="white">
              <polygon points="3,13 8,3 13,13" />
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827', letterSpacing: '-0.025em' }}>Finaxis</h1>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          
          {/* Profile Switcher */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                backgroundColor: config.bg,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <ActiveIcon size={16} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                Perfil {config.label}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                right: 0,
                width: '14rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: 50,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '0.5rem 0' }}>
                  <div style={{ padding: '0.25rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Cambiar a:
                  </div>
                  
                  {otrosPerfiles.length === 0 && (
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      No tienes otros perfiles.
                    </div>
                  )}

                  {otrosPerfiles.map(perfil => {
                    const oCfg = PROFILE_CONFIG[perfil.tipo];
                    const OIcon = oCfg.Icon;
                    return (
                      <button
                        key={perfil.id}
                        onClick={() => handleSwitchProfile(perfil)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '4px', backgroundColor: oCfg.bg }}>
                          <OIcon size={14} />
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                          {oCfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', padding: '0.5rem 0' }}>
                  <button
                    onClick={handleGestionarPerfiles}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: '#185FA5',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Gestionar perfiles
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: '#ef4444',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </header>
      
      {/* ── Main Content ────────────────────────────── */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ color: '#111827', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Bienvenido al nivel {config.label}
        </h2>
        <p style={{ color: '#4b5563' }}>Tu cuenta segura de Finaxis (<b>{user?.email}</b>)</p>
        
        {/* Placeholder cards for dashboard layout test */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: config.bg, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <ActiveIcon size={20} />
               </div>
               <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#111827' }}>Módulo {i}</h3>
               <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>Herramientas y opciones específicas según tu nivel de acceso para la gestión académica y operativa.</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
