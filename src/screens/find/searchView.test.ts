import { describe, expect, it } from 'vitest';
import { CLINICS } from '../../data/clinics';
import { DEMO_PROFILE } from '../../data/demoProfile';
import { defaultFilters } from '../../lib/filters';
import { searchClinics } from '../../lib/match';
import { activeFilterCount, careLabel, centersText, featureText, isLocationSet, missingRequiredKeys, resultsQuery, statusText } from './searchView';

const maya = (care: string, radius: 5 | 15 = 15) => ({ ...defaultFilters(DEMO_PROFILE, care), radius });

describe('search view helpers', () => {
  it('maps free text to the chip label', () => {
    expect(careLabel('ob gyn')).toBe('OB-GYN');
    expect(careLabel('Gynecology')).toBe('OB-GYN');
    expect(careLabel(' cardiology ')).toBe('cardiology');
  });

  it('describes Maya at OB-GYN within 15 mi', () => {
    const f = maya('OB-GYN');
    const o = searchClinics(f, CLINICS);
    expect(statusText(f, o, false)).toBe('4 clinics within 15 mi · best match first');
    expect(statusText({ ...f, sort: 'nearest' }, o, false)).toBe('4 clinics within 15 mi · nearest first');
    expect(activeFilterCount(f)).toBe(3);
  });

  it('describes the imaging empty state and its missing need', () => {
    const f = maya('Imaging', 5);
    const o = searchClinics(f, CLINICS);
    expect(o.emptyReason).toBe('no-match');
    expect(statusText(f, o, false)).toBe('0 clinics within 5 mi meet your required needs');
    expect(statusText(f, o, true)).toBe('2 clinics within 5 mi · best match first');
    expect(missingRequiredKeys(o.items).map(featureText)).toEqual(['wheelchair-accessible scale']);
    expect(centersText('Imaging', 2)).toBe('2 imaging centers');
    expect(centersText('', 3)).toBe('3 clinics');
  });

  it('keeps acronyms and builds the query', () => {
    expect(featureText('asl')).toBe('in-person ASL interpreter');
    expect(resultsQuery(maya('OB-GYN'), true)).toMatch(/^care=OB-GYN&radius=15&sort=best&needs=.*&partial=1$/);
  });

  it('detects a missing location', () => {
    expect(isLocationSet(DEMO_PROFILE.location)).toBe(true);
    expect(isLocationSet({ ...DEMO_PROFILE.location, lat: 0, lng: 0 })).toBe(false);
  });
});
