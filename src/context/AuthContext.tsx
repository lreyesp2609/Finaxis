import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

/* ── Types ─────────────────────────────────────── */
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/* ── Context ───────────────────────────────────── */
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

/* ── Persona sync helper ────────────────────────── */
async function syncPersona(user: User) {
  const { data: existing } = await supabase
    .from('personas')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existing) {
    const meta = user.user_metadata ?? {};
    await supabase.from('personas').insert({
      id: user.id,
      email: user.email,
      nombre: meta.nombre ?? meta.first_name ?? meta.full_name?.split(' ')[0] ?? '',
      apellido: meta.apellido ?? meta.last_name ?? meta.full_name?.split(' ').slice(1).join(' ') ?? '',
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        syncPersona(session.user);
      }
    });

    // Listen for future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          syncPersona(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────── */
export function useAuth() {
  return useContext(AuthContext);
}
