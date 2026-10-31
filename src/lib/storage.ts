// The only module that touches localStorage. Every CareFit key is prefixed and versioned.
const PREFIX = 'carefit:';
const VERSION_KEY = `${PREFIX}v`;
export const SCHEMA_VERSION = 1;

export const KEYS = { profile: 'profile', drafts: 'drafts', reports: 'reports', onboarding: 'onboarding' } as const;
export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

function store(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage blocked (privacy mode)
  }
}

function versionOk(s: Storage): boolean {
  return s.getItem(VERSION_KEY) === String(SCHEMA_VERSION);
}

/** Missing key, bad JSON, a different schema version, or blocked storage all return the fallback. */
export function get<T>(key: StorageKey, fallback: T): T {
  try {
    const s = store();
    if (!s || !versionOk(s)) return fallback;
    const raw = s.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** Returns false when the write failed (quota, blocked). A stale version is cleared first. */
export function set(key: StorageKey, value: unknown): boolean {
  try {
    const s = store();
    if (!s) return false;
    if (!versionOk(s)) {
      clearAll();
      s.setItem(VERSION_KEY, String(SCHEMA_VERSION));
    }
    s.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key: StorageKey): void {
  try {
    store()?.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Removes every CareFit key (Reset demo). */
export function clearAll(): void {
  try {
    const s = store();
    if (!s) return;
    for (const k of Object.keys(s)) if (k.startsWith(PREFIX)) s.removeItem(k);
  } catch {
    /* ignore */
  }
}
