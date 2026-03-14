import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';

/* ── Types ─────────────────────────────────────── */
export interface ActiveProfile {
  id: string;
  tipo: 'personal' | 'docente' | 'alumno';
}

interface ProfileContextType {
  activeProfile: ActiveProfile | null;
  setActiveProfile: (profile: ActiveProfile) => void;
  clearProfile: () => void;
}

/* ── Context ───────────────────────────────────── */
const ProfileContext = createContext<ProfileContextType>({
  activeProfile: null,
  setActiveProfile: () => {},
  clearProfile: () => {},
});

/* ── Provider ──────────────────────────────────── */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile | null>(null);

  const setActiveProfile = (profile: ActiveProfile) => {
    setActiveProfileState(profile);
  };

  const clearProfile = () => {
    setActiveProfileState(null);
  };

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────── */
export function useProfile() {
  return useContext(ProfileContext);
}
