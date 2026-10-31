import { describe, expect, it } from 'vitest';
import { CLINICS, clinicById } from '../../src/data/clinics';
import { DEMO_PROFILE } from '../../src/data/demoProfile';
import { ZIP_CENTROIDS } from '../../src/data/zips';
import { FEATURE_KEYS, FEATURE_STATUSES, FEATURES, parseProfile } from '../../src/contracts';
import { distanceMiles } from '../../src/lib/geo';
import { lookupZip } from '../../src/lib/zips';

const FIND_SPECIALTIES = ['Primary care', 'OB-GYN', 'Imaging', 'Urgent care'];

describe('contracts', () => {
  it('has 19 features in 4 categories', () => {
    expect(FEATURE_KEYS).toHaveLength(19);
    expect(new Set(Object.values(FEATURES).map((f) => f.category)).size).toBe(4);
  });
});

describe('clinic dataset', () => {
  it('has about 20 clinics with unique ids and every type', () => {
    expect(CLINICS.length).toBeGreaterThanOrEqual(18);
    expect(new Set(CLINICS.map((c) => c.id)).size).toBe(CLINICS.length);
    for (const t of ['clinic', 'hospital', 'urgent-care', 'imaging']) expect(CLINICS.some((c) => c.type === t)).toBe(true);
  });
  it.each(CLINICS.map((c) => [c.id, c] as const))('%s is valid', (_id, c) => {
    expect(c.isDemo).toBe(true);
    expect(Number.isFinite(c.lat) && Number.isFinite(c.lng)).toBe(true);
    expect(c.lat).toBeGreaterThan(37.5);
    expect(c.lat).toBeLessThan(38.0);
    expect(c.lng).toBeGreaterThan(-122.4);
    expect(c.lng).toBeLessThan(-121.9);
    expect(c.specialties.some((s) => FIND_SPECIALTIES.includes(s))).toBe(true);
    expect(c.phone).toMatch(/^\(510\) 555-01\d\d$/);
    expect(c.website).toMatch(/^https:\/\/[a-z0-9-]+\.example\.org$/);
    expect(Object.keys(c.hours).length).toBeGreaterThan(0);
    expect(c.doctors.length).toBeGreaterThan(0);
    expect(c.doctors.every((d) => d.npi === undefined)).toBe(true);
    for (const [key, info] of Object.entries(c.accessFeatures)) {
      expect(FEATURE_KEYS).toContain(key);
      expect(FEATURE_STATUSES).toContain(info.status);
      if (info.status !== 'unknown') {
        expect(info.lastVerified).toMatch(/^2026-\d\d-\d\d$/);
        expect(info.lastVerified! < '2026-10-31').toBe(true);
        expect(info.source).toBeTruthy();
      }
    }
  });
  it('reproduces the screen 05 distances from the 94612 centroid (+/-0.1)', () => {
    const o = DEMO_PROFILE.location;
    const want: Record<string, number> = {
      'lakeshore-womens-health': 4.8, 'fruitvale-obgyn-associates': 1.1, 'bayview-medical-center': 7.9, 'grand-avenue-womens-clinic': 0.6,
    };
    for (const [id, miles] of Object.entries(want)) expect(Math.abs(distanceMiles(o, clinicById(id)!) - miles)).toBeLessThanOrEqual(0.1);
  });
  it("Lakeshore's checklist matches screen 08", () => {
    const f = clinicById('lakeshore-womens-health')!.accessFeatures;
    expect(f.scale).toEqual({ status: 'verified', lastVerified: '2026-09-18', source: 'Clinic phone call' });
    expect(f['extended-time']).toEqual({ status: 'patient-reported', lastVerified: '2026-10-02', source: '2 patient reports' });
    expect(f.asl?.status).toBe('not-available');
    expect(f.lift).toBeUndefined();
    const others = FEATURE_KEYS.filter((k) => !['scale', 'exam-table', 'entrance', 'lift', 'restroom', 'extended-time'].includes(k));
    expect(others).toHaveLength(13);
    expect(others.filter((k) => !f[k] || f[k]!.status === 'unknown')).toHaveLength(9);
  });
});

describe('demo profile and ZIP table', () => {
  it('is a valid profile for ZIP 94612', () => {
    expect(parseProfile(DEMO_PROFILE)).not.toBeNull();
    const z = lookupZip('94612');
    expect(z).toMatchObject({ ok: true, lat: DEMO_PROFILE.location.lat, lng: DEMO_PROFILE.location.lng });
    expect(DEMO_PROFILE.needs.filter((n) => n.priority === 'required')).toHaveLength(3);
    expect(DEMO_PROFILE.needs.filter((n) => n.priority === 'nice')).toHaveLength(3);
  });
  it('only holds Bay Area centroids', () => {
    for (const [zip, [lat, lng]] of Object.entries(ZIP_CENTROIDS)) {
      expect(zip).toMatch(/^94\d{3}$/);
      expect(lat).toBeGreaterThan(37.4);
      expect(lng).toBeLessThan(-121.9);
    }
  });
});
