/**
 * Translates Supabase and network error messages into plain Spanish.
 * Call this on any error returned from supabase.auth.* methods.
 */

/* ── Auth error map ─────────────────────────────── */
const AUTH_ERROR_MAP: [string | RegExp, string][] = [
  // Credentials
  [/invalid login credentials/i,           'Correo o contraseña incorrectos.'],
  [/invalid credentials/i,                 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i,                 'Debes confirmar tu correo antes de ingresar.'],

  // Registration
  [/user already registered/i,             'Ya existe una cuenta con este correo.'],
  [/already registered/i,                  'Ya existe una cuenta con este correo.'],
  [/email address.*already.*used/i,        'Ya existe una cuenta con este correo.'],
  [/password should be at least/i,         'La contraseña debe tener al menos 8 caracteres.'],
  [/signup requires a valid password/i,    'Ingresa una contraseña válida.'],

  // Rate limits
  [/email rate limit exceeded/i,           'Demasiados intentos. Espera unos minutos e intenta de nuevo.'],
  [/too many requests/i,                   'Demasiados intentos. Espera unos minutos e intenta de nuevo.'],
  [/over_email_send_rate_limit/i,          'Demasiados intentos. Espera unos minutos e intenta de nuevo.'],
  [/sms.*rate.*limit/i,                    'Demasiados intentos. Espera unos minutos e intenta de nuevo.'],

  // OTP / token
  [/token has expired/i,                   'El código expiró o es inválido. Solicita uno nuevo.'],
  [/otp.*expired/i,                        'El código expiró. Solicita uno nuevo.'],
  [/invalid.*otp/i,                        'El código ingresado no es válido.'],
  [/token is invalid/i,                    'El código expiró o es inválido. Solicita uno nuevo.'],

  // Network
  [/failed to fetch/i,                     'Sin conexión. Verifica tu internet e intenta de nuevo.'],
  [/networkerror/i,                        'Sin conexión. Verifica tu internet e intenta de nuevo.'],
  [/fetch.*error/i,                        'Sin conexión. Verifica tu internet e intenta de nuevo.'],
];

/* ── Profile error map ──────────────────────────── */
const PROFILE_ERROR_MAP: [string | RegExp, string][] = [
  [/duplicate key.*unique constraint/i,    'Ya tienes un perfil de este tipo.'],
  [/unique.*violation/i,                   'Ya tienes un perfil de este tipo.'],
  [/23505/,                                'Ya tienes un perfil de este tipo.'],
];

/* ── Translators ────────────────────────────────── */
function translate(
  message: string,
  map: [string | RegExp, string][],
  fallback: string,
): string {
  for (const [pattern, spanish] of map) {
    if (typeof pattern === 'string') {
      if (message.toLowerCase().includes(pattern.toLowerCase())) return spanish;
    } else {
      if (pattern.test(message)) return spanish;
    }
  }
  return fallback;
}

export function translateAuthError(message: string): string {
  return translate(
    message,
    AUTH_ERROR_MAP,
    'Algo salió mal. Intenta de nuevo más tarde.',
  );
}

export function translateProfileError(message: string): string {
  return translate(
    message,
    PROFILE_ERROR_MAP,
    'No se pudo crear el perfil. Intenta de nuevo.',
  );
}
