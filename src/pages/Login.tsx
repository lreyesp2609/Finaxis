import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { translateAuthError } from '../lib/errors';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './Login.module.css';

/* ── Helpers ────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Logo ───────────────────────────────────────── */
const Logo = () => (
  <div className={styles.logo}>
    <div className={styles.logoMark}>
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <polygon points="3,13 8,3 13,13" />
      </svg>
    </div>
    <span className={styles.logoText}>Finaxis</span>
  </div>
);

/* ── Login Page ─────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    location.state?.oauthError ? 'Cancelaste el inicio de sesión con Google. Intenta de nuevo.' : ''
  );
  const [loading, setLoading] = useState(false);

  // Clear the location state so the error doesn't persist on page refresh
  useEffect(() => {
    if (location.state?.oauthError) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Listen for message from popup via BroadcastChannel + fallback onAuthStateChange
  useEffect(() => {
    // 1. Cross-origin Popup Communication
    const channel = new BroadcastChannel('supabase-oauth');
    channel.onmessage = async (event) => {
      if (event.data === 'oauth-complete') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.replace('/perfiles');
        }
      }
    };

    // 2. Fallback: Host listener to catch the auto-syncing session explicitly via cross-tab storage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          window.location.replace('/perfiles');
        }
      }
    );

    return () => {
      channel.close();
      subscription.unsubscribe();
    };
  }, [navigate]);

  /* ── Client-side validation ─────────────────── */
  const validate = (): string => {
    if (!email.trim()) return 'Ingresa un correo electrónico válido.';
    if (!EMAIL_RE.test(email)) return 'Ingresa un correo electrónico válido.';
    if (!password) return 'La contraseña es requerida.';
    return '';
  };

  /* ── Email login ─────────────────────────────── */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(translateAuthError(error.message));
      } else {
        window.location.replace('/perfiles');
      }
    } catch {
      setError('Sin conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth ────────────────────────────── */
  const handleGoogleLogin = async () => {
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          skipBrowserRedirect: true
        }
      });
      if (error || !data?.url) {
        if (error) setError(translateAuthError(error.message));
        return;
      }
      
      window.open(data.url, 'google-oauth', 
        'width=500,height=600,left=' + (window.screen.width/2 - 250) + 
        ',top=' + (window.screen.height/2 - 300)
      );
    } catch {
      setError('Sin conexión. Verifica tu internet e intenta de nuevo.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Logo />

        <div className={styles.header}>
          <h1>Bienvenido de vuelta</h1>
          <p>Inicia sesión en tu cuenta</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleEmailLogin} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.fieldHeader}>
              <label htmlFor="password">Contraseña</label>
              <a href="#" className={styles.forgotLink}>¿Olvidaste tu contraseña?</a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className={styles.divider}><span>o continúa con</span></div>

        <button onClick={handleGoogleLogin} className={styles.googleBtn} type="button">
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className={styles.googleIcon}
          />
          Continuar con Google
        </button>

        <p className={styles.footer}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
