import { beforeEach, describe, expect, it } from 'vitest';
import { installStorage } from './memoryStorage';
import * as storage from '../../src/lib/storage';
import { loadProfile, resetDemo, saveProfile } from '../../src/lib/profile';
import { DEMO_PROFILE } from '../../src/data/demoProfile';
import { getDraft, listDrafts, saveDraft } from '../../src/lib/drafts';
import { parseProfile } from '../../src/contracts';

let ls: ReturnType<typeof installStorage>;
beforeEach(() => { ls = installStorage(); });

describe('storage', () => {
  it('returns the fallback for a missing key', () => {
    expect(storage.get('profile', 'x')).toBe('x');
  });
  it('round-trips and writes the schema version', () => {
    expect(storage.set('profile', { a: 1 })).toBe(true);
    expect(storage.get('profile', null)).toEqual({ a: 1 });
    expect(ls.getItem('carefit:v')).toBe(String(storage.SCHEMA_VERSION));
  });
  it('treats bad JSON as empty', () => {
    storage.set('profile', 1);
    ls.setItem('carefit:profile', '{bad');
    expect(storage.get('profile', 'fb')).toBe('fb');
  });
  it('treats a version mismatch as empty and a write clears the stale data', () => {
    storage.set('profile', { a: 1 });
    ls.setItem('carefit:v', '0');
    expect(storage.get('profile', 'fb')).toBe('fb');
    storage.set('drafts', {});
    expect(ls.getItem('carefit:profile')).toBeNull();
  });
  it('does not crash when localStorage throws', () => {
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem() { throw new Error('blocked'); },
      setItem() { throw new Error('quota'); },
      removeItem() { throw new Error('x'); },
    };
    expect(storage.get('profile', 'fb')).toBe('fb');
    expect(storage.set('profile', 1)).toBe(false);
    expect(() => storage.clearAll()).not.toThrow();
  });
  it('clearAll removes only CareFit keys', () => {
    storage.set('profile', 1);
    ls.setItem('other', 'keep');
    storage.clearAll();
    expect(ls.getItem('carefit:profile')).toBeNull();
    expect(ls.getItem('other')).toBe('keep');
  });
});

describe('profile', () => {
  it('loads the demo profile when storage is empty, corrupted or invalid', () => {
    expect(loadProfile()).toEqual(DEMO_PROFILE);
    storage.set('profile', { needs: 'nope' });
    expect(loadProfile()).toEqual(DEMO_PROFILE);
    ls.setItem('carefit:profile', '{bad');
    expect(loadProfile()).toEqual(DEMO_PROFILE);
  });
  it('loads a saved profile', () => {
    const p = { ...DEMO_PROFILE, radius: 25 as const };
    saveProfile(p);
    expect(loadProfile().radius).toBe(25);
  });
  it('resetDemo clears profile and drafts and returns the demo profile', () => {
    saveProfile({ ...DEMO_PROFILE, radius: 5 });
    saveDraft({ clinicId: 'a', clinicName: 'A', appointmentDate: '', doctor: '', accommodations: [], notes: '', sender: {}, updatedAt: '2026-10-01T00:00:00Z' });
    expect(resetDemo()).toEqual(DEMO_PROFILE);
    expect(loadProfile()).toEqual(DEMO_PROFILE);
    expect(listDrafts()).toEqual([]);
  });
  it('parseProfile rejects bad shapes', () => {
    expect(parseProfile(DEMO_PROFILE)).toEqual(DEMO_PROFILE);
    expect(parseProfile({ ...DEMO_PROFILE, radius: 7 })).toBeNull();
    expect(parseProfile({ ...DEMO_PROFILE, needs: [{ key: 'nope', priority: 'required' }] })).toBeNull();
    expect(parseProfile({ ...DEMO_PROFILE, needs: [{ key: 'scale', priority: 'x' }] })).toBeNull();
    expect(parseProfile({ ...DEMO_PROFILE, location: { ...DEMO_PROFILE.location, lat: 'x' } })).toBeNull();
    expect(parseProfile(null)).toBeNull();
  });
});

describe('drafts', () => {
  it('saves one draft per clinic, newest first', () => {
    const d = (id: string, t: string) => ({ clinicId: id, clinicName: id, appointmentDate: '', doctor: '', accommodations: [], notes: '', sender: {}, updatedAt: t });
    saveDraft(d('a', '2026-10-01T00:00:00Z'));
    saveDraft(d('b', '2026-10-02T00:00:00Z'));
    saveDraft({ ...d('a', '2026-10-03T00:00:00Z'), notes: 'v2' });
    expect(listDrafts().map((x) => x.clinicId)).toEqual(['a', 'b']);
    expect(getDraft('a')?.notes).toBe('v2');
  });
});
