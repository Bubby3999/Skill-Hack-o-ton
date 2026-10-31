import { describe, expect, it } from 'vitest';
import { matchClinic, normalizeCare, searchClinics } from '../../src/lib/match';
import { CLINICS, clinicById } from '../../src/data/clinics';
import { DEMO_PROFILE } from '../../src/data/demoProfile';
import { defaultFilters } from '../../src/lib/filters';
import { distanceMiles } from '../../src/lib/geo';
import type { Clinic, Need, SearchFilters } from '../../src/contracts';

const origin = DEMO_PROFILE.location;
const maya = DEMO_PROFILE.needs;
const m = (id: string, needs: Need[] = maya) => matchClinic(needs, clinicById(id)!, origin);
const keys = (xs: { key: string }[]) => xs.map((x) => x.key);

describe('Maya vs the four OB-GYN clinics (screen 05)', () => {
  it('Lakeshore: Strong fit, 5 of 6, lift unknown', () => {
    const r = m('lakeshore-womens-health');
    expect(r).toMatchObject({ tier: 'strong', met: 5, total: 6, distance: 4.8 });
    expect(keys(r.unknown)).toEqual(['lift']);
    expect(keys(r.has)).toEqual(['scale', 'exam-table', 'entrance', 'restroom', 'extended-time']);
    expect(r.score).toBeCloseTo(5 / 6);
  });
  it('Fruitvale: Possible fit, 4 of 6, required table unknown, lift missing', () => {
    const r = m('fruitvale-obgyn-associates');
    expect(r).toMatchObject({ tier: 'possible', met: 4, total: 6, distance: 1.1 });
    expect(r.unknown).toEqual([{ key: 'exam-table', priority: 'required', status: 'unknown' }]);
    expect(keys(r.missing)).toEqual(['lift']);
  });
  it('Bayview: Possible fit, 3 of 6', () => {
    const r = m('bayview-medical-center');
    expect(r).toMatchObject({ tier: 'possible', met: 3, total: 6, distance: 7.9 });
    expect(keys(r.unknown)).toEqual(['exam-table', 'lift', 'extended-time']); // required first
  });
  it('Grand Avenue: Poor fit, 2 of 6, required scale missing', () => {
    const r = m('grand-avenue-womens-clinic');
    expect(r).toMatchObject({ tier: 'poor', met: 2, total: 6, distance: 0.6 });
    expect(keys(r.missing)).toEqual(['scale', 'lift']);
    expect(keys(r.unknown)).toEqual(['restroom', 'extended-time']);
  });
  it('perNeed keeps meter order: required first, then profile order', () => {
    expect(keys(m('lakeshore-womens-health').perNeed)).toEqual(['scale', 'exam-table', 'entrance', 'lift', 'restroom', 'extended-time']);
  });
  it('search at 15 mi lists exactly these four, best match first', () => {
    const out = searchClinics(defaultFilters(DEMO_PROFILE, 'OB-GYN'), CLINICS);
    expect(out.items.map((i) => i.clinic.name)).toEqual([
      "Lakeshore Women's Health", 'Fruitvale OB-GYN Associates', 'Bayview Medical Center', "Grand Avenue Women's Clinic",
    ]);
    expect(out.goodCount).toBe(3);
    expect(out.emptyReason).toBeNull();
  });
  it('nearest sort orders by distance', () => {
    const f: SearchFilters = { ...defaultFilters(DEMO_PROFILE, 'OB-GYN'), sort: 'nearest' };
    expect(searchClinics(f, CLINICS).items.map((i) => i.match.distance)).toEqual([0.6, 1.1, 4.8, 7.9]);
  });
  it('the radius drops Bayview at 5 mi and Hillcrest stays out at 15', () => {
    const f5 = { ...defaultFilters(DEMO_PROFILE, 'OB-GYN'), radius: 5 as const };
    expect(searchClinics(f5, CLINICS).items).toHaveLength(3);
    expect(searchClinics({ ...f5, radius: 25 }, CLINICS).items).toHaveLength(5);
  });
});

describe('imaging within 5 mi (screen 07)', () => {
  const f = { ...defaultFilters(DEMO_PROFILE, 'Imaging'), radius: 5 as const };
  it('has two clinics, both Poor (no accessible scale): empty state "no-match"', () => {
    const out = searchClinics(f, CLINICS);
    expect(out.items).toHaveLength(2);
    expect(out.items.every((i) => i.match.tier === 'poor' && i.match.missing.some((x) => x.key === 'scale'))).toBe(true);
    expect(out.goodCount).toBe(0);
    expect(out.emptyReason).toBe('no-match');
  });
  it('widening to 15 mi finds a Strong or Possible clinic', () => {
    const out = searchClinics({ ...f, radius: 15 }, CLINICS);
    expect(out.goodCount).toBeGreaterThan(0);
    expect(out.emptyReason).toBeNull();
  });
  it('reports "none-in-range" when nothing of that type is in range', () => {
    expect(searchClinics({ ...f, care: 'Telepathy' }, CLINICS).emptyReason).toBe('none-in-range');
  });
});

describe('edge cases', () => {
  const clinic = (features: Clinic['accessFeatures'], over: Partial<Clinic> = {}): Clinic => ({
    id: 't', name: 'T', type: 'clinic', specialties: ['Primary care'], address: '', lat: origin.lat, lng: origin.lng,
    phone: '', website: '', hours: {}, doctors: [], accessFeatures: features, isDemo: true, ...over,
  });
  const pt = { lat: origin.lat, lng: origin.lng };
  it('no needs: no tier, score 0, no counts', () => {
    expect(matchClinic([], clinic({}), pt)).toMatchObject({ tier: null, score: 0, met: 0, total: 0 });
  });
  it('only nice-to-haves: no tier, but the count is kept', () => {
    const r = matchClinic([{ key: 'lift', priority: 'nice' }, { key: 'restroom', priority: 'nice' }], clinic({ lift: { status: 'verified' } }), pt);
    expect(r).toMatchObject({ tier: null, met: 1, total: 2 });
  });
  it('a key missing from the clinic counts as unknown', () => {
    const r = matchClinic([{ key: 'scale', priority: 'required' }], clinic({}), pt);
    expect(r).toMatchObject({ tier: 'possible' });
    expect(r.unknown[0].status).toBe('unknown');
  });
  it('patient-reported counts as Has', () => {
    const r = matchClinic([{ key: 'scale', priority: 'required' }], clinic({ scale: { status: 'patient-reported' } }), pt);
    expect(r).toMatchObject({ tier: 'strong', met: 1 });
  });
  it('a missing nice-to-have does not make the tier Poor', () => {
    const r = matchClinic(
      [{ key: 'scale', priority: 'required' }, { key: 'lift', priority: 'nice' }],
      clinic({ scale: { status: 'verified' }, lift: { status: 'not-available' } }), pt);
    expect(r.tier).toBe('strong');
  });
  it('Poor beats Possible when a required need is missing and another unknown', () => {
    const r = matchClinic(
      [{ key: 'scale', priority: 'required' }, { key: 'lift', priority: 'required' }],
      clinic({ scale: { status: 'not-available' } }), pt);
    expect(r.tier).toBe('poor');
  });
  it('tied distances fall back to tier, then to a stable order', () => {
    const a = clinic({ scale: { status: 'not-available' } }, { id: 'a' });
    const b = clinic({ scale: { status: 'verified' } }, { id: 'b' });
    const f: SearchFilters = { care: '', radius: 5, needs: [{ key: 'scale', priority: 'required' }], sort: 'nearest', location: { ...pt, label: 'x' } };
    expect(searchClinics(f, [a, b]).items.map((i) => i.clinic.id)).toEqual(['b', 'a']);
  });
  it('includes a clinic exactly on the radius and excludes one 0.1 mi over', () => {
    const north = (miles: number) => origin.lat + miles / 69.0934;
    const on = clinic({}, { id: 'on', lat: north(15) });
    const over = clinic({}, { id: 'over', lat: north(15.15) });
    expect(distanceMiles(origin, on)).toBe(15);
    const f: SearchFilters = { care: 'Primary care', radius: 15, needs: [], sort: 'nearest', location: { ...pt, label: 'x' } };
    expect(searchClinics(f, [on, over]).items.map((i) => i.clinic.id)).toEqual(['on']);
  });
  it('excludes clinics without the care type; normalizes care text', () => {
    expect(normalizeCare('OB-GYN')).toBe(normalizeCare('ob gyn'));
    expect(normalizeCare('Gynecology')).toBe('obgyn');
    expect(normalizeCare('Primary care')).not.toBe(normalizeCare('Urgent care'));
    const f = defaultFilters(DEMO_PROFILE, 'Urgent care');
    expect(searchClinics(f, CLINICS).items.every((i) => i.clinic.specialties.includes('Urgent care'))).toBe(true);
  });
  it('with no needs, every in-range clinic counts as a result', () => {
    const f = { ...defaultFilters(DEMO_PROFILE, 'OB-GYN'), needs: [] };
    const out = searchClinics(f, CLINICS);
    expect(out.goodCount).toBe(4);
    expect(out.items[0].match.tier).toBeNull();
  });
});
