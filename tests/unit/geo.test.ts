import { describe, expect, it } from 'vitest';
import { distanceMiles } from '../../src/lib/geo';
import { lookupZip, ZIP_OUT_OF_AREA_MESSAGE } from '../../src/lib/zips';
import { safeFrom } from '../../src/lib/returnTo';
import { groupHours, openLabel } from '../../src/lib/hours';
import { clinicById } from '../../src/data/clinics';

describe('distanceMiles', () => {
  it('is zero for the same point', () => {
    expect(distanceMiles({ lat: 37.8, lng: -122.2 }, { lat: 37.8, lng: -122.2 })).toBe(0);
  });
  it('is about 69.1 miles per degree of latitude, rounded to one decimal', () => {
    expect(distanceMiles({ lat: 37, lng: -122 }, { lat: 38, lng: -122 })).toBe(69.1);
  });
  it('is symmetric', () => {
    const a = { lat: 37.8077, lng: -122.2669 };
    const b = { lat: 37.6446, lng: -122.0218 };
    expect(distanceMiles(a, b)).toBe(distanceMiles(b, a));
  });
});

describe('lookupZip', () => {
  it('finds 94612 with the Census centroid', () => {
    const r = lookupZip('94612');
    expect(r).toMatchObject({ ok: true, lat: 37.807709, lng: -122.266857, label: 'ZIP 94612' });
  });
  it('rejects a ZIP outside the demo area with a clear message', () => {
    expect(lookupZip('10001')).toEqual({ ok: false, reason: 'out-of-area', message: ZIP_OUT_OF_AREA_MESSAGE });
  });
  it('rejects bad formats', () => {
    for (const z of ['', '946', '9461a', '946120']) expect(lookupZip(z)).toMatchObject({ ok: false, reason: 'format' });
  });
});

describe('safeFrom', () => {
  it('keeps same-app paths and rejects everything else', () => {
    expect(safeFrom('/find?care=x', '/profile')).toBe('/find?care=x');
    for (const bad of [null, '', 'find', '//evil.com', 'https://evil.com', '/\\evil', 'javascript:alert(1)']) {
      expect(safeFrom(bad, '/profile')).toBe('/profile');
    }
  });
});

describe('hours', () => {
  const lakeshore = clinicById('lakeshore-womens-health')!;
  it('groups days like screen 08', () => {
    expect(groupHours(lakeshore.hours)).toEqual([
      { days: 'Mon – Fri', text: '8 am – 6 pm' },
      { days: 'Sat', text: '9 am – 1 pm' },
      { days: 'Sun', text: 'Closed' },
    ]);
  });
  it('labels open, before opening, after closing, closed day and 24 hours', () => {
    const at = (d: string) => new Date(d); // local time
    expect(openLabel(lakeshore.hours, at('2026-11-02T10:00:00'))).toBe('Open until 6 pm'); // Monday
    expect(openLabel(lakeshore.hours, at('2026-11-02T06:00:00'))).toBe('Opens at 8 am');
    expect(openLabel(lakeshore.hours, at('2026-11-02T20:00:00'))).toBe('Closed now');
    expect(openLabel(lakeshore.hours, at('2026-11-01T10:00:00'))).toBe('Closed today'); // Sunday
    expect(openLabel(clinicById('bayview-medical-center')!.hours, at('2026-11-01T03:00:00'))).toBe('Open 24 hours');
  });
});
