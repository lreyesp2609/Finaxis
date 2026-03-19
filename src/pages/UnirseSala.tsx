import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import styles from './UnirseSala.module.css';

/* ── Icons ── */
function IconDoor() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  );
}

function IconCheckSolid() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

/* ── Helpers ── */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface SalaPreview {
  sala_id: number;
  codigosala: string;
  catalogo: string;
  fechainicio: string;
  fechafin: string;
  finalizado: boolean;
  creador_id: string;
  sala_cerrada: boolean;
  no_iniciada: boolean;
}

export default function UnirseSala() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [foundSala, setFoundSala] = useState<SalaPreview | null>(null);

  /* ── Input handler ── */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 6) return;
    setCode(val);
    setError('');
    setFoundSala(null);
  };

  /* ── Buscar sala ── */
  const handleSearch = async () => {
    if (code.length < 4) return;
    setIsSearching(true);
    setError('');
    setFoundSala(null);

    const { data, error: rpcErr } = await supabase.rpc('obtener_sala_publica', {
      p_codigosala: code,
    });

    setIsSearching(false);

    if (rpcErr || !data) {
      setError('Error de conexión. Intenta de nuevo.');
      return;
    }

    if (!data.ok) {
      setError(data.error ?? 'No encontramos ninguna sala con ese código.');
      return;
    }

    // Verificar que no sea el creador
    if (data.creador_id === user?.id) {
      setError('No puedes unirte a una sala que tú mismo creaste.');
      return;
    }

    setFoundSala(data as SalaPreview);
  };

  /* ── Confirmar y unirse ── */
  const handleJoin = async () => {
    if (!foundSala || !user) return;
    setIsJoining(true);
    setError('');

    const { data, error: rpcErr } = await supabase.rpc('unirse_a_sala', {
      p_codigosala: foundSala.codigosala,
      p_user_id: user.id,
    });

    setIsJoining(false);

    if (rpcErr || !data) {
      setError('Error al unirse. Intenta de nuevo.');
      return;
    }

    if (!data.ok) {
      // Si la sala cerró pero ya era participante, igual redirigir
      if (data.closed && data.sala_id) {
        navigate(`/dashboard/sala/${foundSala.codigosala}`);
        return;
      }
      setError(data.error ?? 'No se pudo unir a la sala.');
      return;
    }

    // Éxito → navegar a la sala
    navigate(`/dashboard/sala/${foundSala.codigosala}`);
  };

  /* ── Enter key ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!foundSala) handleSearch();
      else handleJoin();
    }
  };

  if (loading) return null;

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', minHeight: 0 }}>
      <div className={styles.centeredContent}>
        <div className={styles.header}>
          <div className={styles.iconBox}><IconDoor /></div>
          <h2>Unirse a una sala</h2>
          <p>Ingresa el código que te compartió el creador de la sala</p>
        </div>

        <div className={styles.card}>
          {!foundSala ? (
            /* ── Buscador ── */
            <div className={styles.formGroup}>
              <label className={styles.label}>Código de sala</label>
              <input
                type="text"
                className={styles.codeInput}
                placeholder="AB123C"
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                autoFocus
                maxLength={6}
              />
              {error && <span className={styles.errorText}>{error}</span>}
              <button
                className={styles.submitBtn}
                disabled={code.length < 4 || isSearching}
                onClick={handleSearch}
              >
                {isSearching
                  ? <><div className={styles.spinner}/> Buscando sala…</>
                  : 'Buscar sala'}
              </button>
            </div>
          ) : (
            /* ── Sala encontrada ── */
            <div className={styles.successState}>
              {foundSala.sala_cerrada ? (
                /* Cerrada */
                <div className={styles.closedIcon}><IconLock /></div>
              ) : foundSala.no_iniciada ? (
                /* No iniciada */
                <div className={styles.pendingIcon}><IconClock /></div>
              ) : (
                /* Activa */
                <div className={styles.successIcon}><IconCheckSolid /></div>
              )}

              <h3 className={
                foundSala.sala_cerrada ? styles.closedTitle :
                foundSala.no_iniciada  ? styles.pendingTitle :
                styles.successTitle
              }>
                {foundSala.sala_cerrada ? 'Sala cerrada' :
                 foundSala.no_iniciada  ? 'Sala no iniciada' :
                 '¡Sala encontrada!'}
              </h3>

              <div className={styles.salaInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Código:</span>
                  <span className={`${styles.infoValue} ${styles.infoCode}`}>{foundSala.codigosala}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Catálogo:</span>
                  <span className={styles.infoValue}>{foundSala.catalogo}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><IconCalendar/> Inicio:</span>
                  <span className={styles.infoValue}>{formatDateTime(foundSala.fechainicio)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><IconCalendar/> Fin:</span>
                  <span className={styles.infoValue}>{formatDateTime(foundSala.fechafin)}</span>
                </div>
              </div>

              {error && <span className={styles.errorText}>{error}</span>}

              <div className={styles.actionRow}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => { setFoundSala(null); setCode(''); }}
                  disabled={isJoining}
                >
                  ← Cambiar código
                </button>

                {foundSala.sala_cerrada ? (
                  <button className={styles.confirmBtn} style={{ background: '#6b7280' }} disabled>
                    Sala cerrada
                  </button>
                ) : foundSala.no_iniciada ? (
                  <button className={styles.confirmBtn} style={{ background: '#d97706' }} disabled>
                    Aún no comenzó
                  </button>
                ) : (
                  <button
                    className={styles.confirmBtn}
                    onClick={handleJoin}
                    disabled={isJoining}
                  >
                    {isJoining
                      ? <><div className={styles.spinner}/> Entrando…</>
                      : 'Confirmar y entrar'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className={styles.footerText}>
          ¿No tienes un código?<br/>
          <b>Pide al creador de la sala que te lo comparta.</b>
        </p>
      </div>
    </div>
  );
}