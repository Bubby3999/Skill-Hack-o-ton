import { parseProfile } from '../contracts';
import type { Profile } from '../contracts';
import { DEMO_PROFILE } from '../data/demoProfile';
import * as storage from './storage';

/** Stored profile if valid, else the demo profile. Never throws; does not write. */
export function loadProfile(): Profile {
  return parseProfile(storage.get(storage.KEYS.profile, null)) ?? structuredClone(DEMO_PROFILE);
}

export function saveProfile(profile: Profile): boolean {
  return storage.set(storage.KEYS.profile, profile);
}

/** Reset demo: clears every CareFit key and returns the demo profile. */
export function resetDemo(): Profile {
  storage.clearAll();
  return structuredClone(DEMO_PROFILE);
}
