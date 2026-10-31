import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Profile } from '../contracts';
import { loadProfile, resetDemo as resetStored, saveProfile } from '../lib/profile';

interface ProfileApi {
  profile: Profile;
  /** Replaces the profile and saves it to this device. */
  setProfile: (p: Profile) => void;
  /** Reset demo: clears every CareFit key (profile, letters, reports) and restores the demo profile. */
  resetDemo: () => void;
}

const Ctx = createContext<ProfileApi | null>(null);

/** Holds the profile for the whole app. Missing or corrupted storage loads the demo profile. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setState] = useState<Profile>(loadProfile);
  const setProfile = useCallback((p: Profile) => {
    setState(p);
    saveProfile(p);
  }, []);
  const resetDemo = useCallback(() => setState(resetStored()), []);
  const value = useMemo(() => ({ profile, setProfile, resetDemo }), [profile, setProfile, resetDemo]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProfile must be used inside <ProfileProvider>');
  return v;
}
