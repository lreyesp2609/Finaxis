import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import styles from './UnirseSala.module.css';

/* ── Icons ── */

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

export default function UnirseSala() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [foundSala, setFoundSala] = useState<any>(null);

  useEffect(() => {
    async function init() {
      if (!user) return;
      await supabase.from('personas').select('nombre').eq('id', user.id).maybeSingle();
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
        creador: 'Tú',
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

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', minHeight: 0 }}>
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
              {isSearching ? <><div className={styles.spinner} /> Buscando sala...</> : 'Unirse a la sala'}
            </button>
          </div>
        )}
      </div>

        <p className={styles.footerText}>¿No tienes un código? <br /><b>Pide al creador de la sala que te lo comparta.</b></p>
      </div>
    </div>
  );
}
