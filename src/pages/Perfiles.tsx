import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { translateProfileError } from '../lib/errors';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import styles from './Perfiles.module.css';

/* ── Types ─────────────────────────────────────── */
type TipoPerfil = 'personal' | 'docente' | 'alumno';

interface Perfil {
  id: string;
  tipo: TipoPerfil;
}

/* ── Icons ─────────────────────────────────────── */
function PersonalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function DocenteIcon({ small }: { small?: boolean }) {
  const color = '#3B6D11';
  const sw = small ? '2' : '2';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function AlumnoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

const PROFILE_CONFIG: Record<TipoPerfil, { label: string; colorClass: string; Icon: React.FC }> = {
  personal: { label: 'Personal',  colorClass: styles.personal, Icon: PersonalIcon },
  docente:  { label: 'Docente',   colorClass: styles.docente,  Icon: () => <DocenteIcon /> },
  alumno:   { label: 'Alumno',    colorClass: styles.alumno,   Icon: AlumnoIcon },
};

/* ── Logo ───────────────────────────────────────── */
function Logo() {
  return (
    <div className={styles.logo}>
      <div className={styles.logoMark}>
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <polygon points="3,13 8,3 13,13" />
        </svg>
      </div>
      <span className={styles.logoText}>Finaxis</span>
    </div>
  );
}

/* ── Main component ─────────────────────────────── */
export default function Perfiles() {
  const { user, loading: authLoading } = useAuth();
  const { setActiveProfile } = useProfile();
  const navigate = useNavigate();

  const [perfiles, setPerfiles]     = useState<Perfil[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showPanel, setShowPanel]   = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoPerfil | null>(null);
  const [creating, setCreating]     = useState(false);
  const [error, setError]           = useState('');

  /* ── Load profiles ──────────────────────────── */
  const loadPerfiles = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, tipo')
      .eq('persona_id', user.id);

    if (!error && data) {
      setPerfiles(data as Perfil[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadPerfiles(); }, [user]);

  /* ── Select a profile ───────────────────────── */
  const handleSelectProfile = (perfil: Perfil) => {
    setActiveProfile({ id: perfil.id, tipo: perfil.tipo });
    navigate('/dashboard', { replace: true });
  };

  /* ── Create a profile ───────────────────────── */
  const handleCreateProfile = async () => {
    if (!selectedTipo) {
      setError('Selecciona un tipo de perfil.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('perfiles')
        .insert({ persona_id: user!.id, tipo: selectedTipo })
        .select('id, tipo')
        .single();

      if (error) {
        setError(translateProfileError(error.message));
        return;
      }

      setActiveProfile({ id: data.id, tipo: data.tipo });
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Sin conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  /* ── Render ─────────────────────────────────── */

  // While auth is resolving, show spinner
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.65s linear infinite' }} />
      </div>
    );
  }

  // No session → redirect handled by AuthContext; render nothing to avoid flash
  if (!user) return null;

  return (
    <div className={styles.page}>
      <Logo />
      <h1 className={styles.title}>¿Quién está usando Finaxis?</h1>
      <p className={styles.subtitle}>Selecciona o crea un perfil para continuar</p>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Cargando perfiles...</p>
      ) : (
        <>
          {/* Existing profiles */}
          <div className={styles.profileGrid}>
            {perfiles.map((perfil) => {
              const cfg = PROFILE_CONFIG[perfil.tipo];
              const Icon = cfg.Icon;
              return (
                <button
                  key={perfil.id}
                  className={styles.profileCard}
                  onClick={() => handleSelectProfile(perfil)}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                  aria-label={`Seleccionar perfil ${cfg.label}`}
                >
                  <div className={`${styles.profileAvatar} ${cfg.colorClass}`}>
                    <Icon />
                  </div>
                  <span className={styles.profileName}>{cfg.label}</span>
                </button>
              );
            })}

            {/* Add profile button */}
            <button
              className={styles.addCard}
              onClick={() => { setShowPanel(true); setError(''); setSelectedTipo(null); }}
              style={{ background: 'none', border: 'none', padding: 0 }}
              aria-label="Agregar perfil"
            >
              <div className={styles.addAvatar}>+</div>
              <span className={styles.addLabel}>Agregar perfil</span>
            </button>
          </div>

          {/* Inline add-profile panel */}
          {showPanel && (
            <div className={styles.panel}>
              <p className={styles.panelTitle}>Elige el tipo de perfil</p>

              <div className={styles.optionGrid}>
                {(['personal', 'docente', 'alumno'] as TipoPerfil[]).map((tipo) => {
                  const cfg = PROFILE_CONFIG[tipo];
                  const Icon = cfg.Icon;
                  const isSelected = selectedTipo === tipo;
                  return (
                    <button
                      key={tipo}
                      className={`${styles.optionCard} ${isSelected ? styles.selectedOption : ''}`}
                      onClick={() => { setSelectedTipo(tipo); setError(''); }}
                      type="button"
                    >
                      <div className={`${styles.optionIcon} ${cfg.colorClass}`}>
                        <Icon />
                      </div>
                      <span className={styles.optionLabel}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.actions}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setShowPanel(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnPrimary}
                  onClick={handleCreateProfile}
                  disabled={creating || !selectedTipo}
                  type="button"
                >
                  {creating ? 'Creando...' : 'Crear perfil'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
