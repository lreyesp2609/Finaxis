import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { translateAuthError } from '../lib/errors';
import { Link, useNavigate } from 'react-router-dom';
import { OtpInput } from '../components/OtpInput';
import styles from './Register.module.css';

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

/* ── Register Page ──────────────────────────────── */
export default function Register() {
  // Step 1 state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 state
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));

  // Common state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const resendCooldown = useRef(false);
  const navigate = useNavigate();

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

  /* ── Step 1 validation ───────────────────────── */
  const validateForm = (): string => {
    if (!firstName.trim()) return 'El nombre es requerido.';
    if (!lastName.trim()) return 'El apellido es requerido.';
    if (!email.trim()) return 'Ingresa un correo electrónico válido.';
    if (!EMAIL_RE.test(email)) return 'Ingresa un correo electrónico válido.';
    if (!password) return 'La contraseña es requerida.';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    return '';
  };

  /* ── Step 2 validation ───────────────────────── */
  const validateOtp = (): string => {
    const filled = otp.filter(Boolean).length;
    if (filled === 0) return 'Ingresa el código de verificación.';
    if (filled < 6) return 'El código debe tener 6 dígitos.';
    return '';
  };

  /* ── Step 1: Register ────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    try {
      // Check if email already exists in public.personas
      const { data: existingUser } = await supabase
        .from('personas')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        setError('Ya existe una cuenta con este correo. ¿Quieres iniciar sesión?');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre: firstName, apellido: lastName },
        },
      });

      if (data?.user && data.user.identities?.length === 0) {
        setError('Ya existe una cuenta con este correo. ¿Quieres iniciar sesión?');
        return;
      }

      if (error) {
        setError(translateAuthError(error.message));
      } else {
        setStep('otp');
      }
    } catch {
      setError('Sin conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP ──────────────────────── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateOtp();
    if (validationError) { setError(validationError); return; }

    const token = otp.join('');
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

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

  /* ── Resend OTP ──────────────────────────────── */
  const handleResend = async () => {
    if (resendCooldown.current) return;
    resendCooldown.current = true;
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) setError(translateAuthError(error.message));
    } catch {
      setError('Sin conexión. Verifica tu internet e intenta de nuevo.');
    }

    setTimeout(() => { resendCooldown.current = false; }, 30000);
  };

  /* ── Google OAuth ────────────────────────────── */
  const handleGoogle = async () => {
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

  /* ── Render ──────────────────────────────────── */
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Logo />

        {/* ── Step 1: Registration Form ─────────── */}
        {step === 'form' && (
          <>
            <div className={styles.header}>
              <h1>Crea tu cuenta</h1>
              <p>Únete a Finaxis hoy</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleRegister} className={styles.form} noValidate>
              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label htmlFor="firstName">Nombre</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                    placeholder="Juan"
                    autoComplete="given-name"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="lastName">Apellido</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setError(''); }}
                    placeholder="Pérez"
                    autoComplete="family-name"
                  />
                </div>
              </div>

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

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label htmlFor="password">Contraseña</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <div className={styles.divider}><span>o continúa con</span></div>

            <button onClick={handleGoogle} className={styles.googleBtn} type="button">
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                className={styles.googleIcon}
              />
              Continuar con Google
            </button>

            <p className={styles.footer}>
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </>
        )}

        {/* ── Step 2: OTP Verification ──────────── */}
        {step === 'otp' && (
          <>
            <div className={styles.header}>
              <h1>Verifica tu correo</h1>
              <p>
                Ingresa el código de 6 dígitos que enviamos a{' '}
                <strong>{email}</strong>
              </p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleVerifyOtp} className={styles.form} noValidate>
              <OtpInput
                value={otp}
                onChange={(v) => { setOtp(v); setError(''); }}
              />

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar código'}
              </button>
            </form>

            <p className={styles.resendRow}>
              ¿No recibiste el código?{' '}
              <button type="button" className={styles.resendBtn} onClick={handleResend}>
                Reenviar código
              </button>
            </p>

            <p className={styles.footer}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => { setStep('form'); setOtp(Array(6).fill('')); setError(''); }}
              >
                ← Volver
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
