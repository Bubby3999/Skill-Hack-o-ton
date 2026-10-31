import { describe, expect, it } from 'vitest';
import { CLINICS } from '../../data/clinics';
import { DEMO_PROFILE } from '../../data/demoProfile';
import { FEATURES } from '../../contracts';
import { matchClinic } from '../../lib/match';
import { buildLetter, createDraft, fitSummary, formatCalendarDate, restoreDraft, validateDraft } from './letter';

const lakeshore = CLINICS.find((clinic) => clinic.id === 'lakeshore-womens-health')!;
const fruitvale = CLINICS.find((clinic) => clinic.id === 'fruitvale-obgyn-associates')!;

describe('clinic letters', () => {
  it('requests Unknown and Missing needs, leaving verified and patient-reported needs unchecked', () => {
    expect(createDraft(lakeshore, DEMO_PROFILE).accommodations).toEqual(['lift']);
    expect(createDraft(fruitvale, DEMO_PROFILE).accommodations).toEqual(['exam-table', 'lift']);
    const draft = createDraft(lakeshore, DEMO_PROFILE);
    expect(draft.sender).toEqual(DEMO_PROFILE.letter);
    expect(draft.appointmentDate).toBe('');
    expect(draft.doctor).toBe('');
    expect(draft.notes).toBe('');
  });

  it('restores edits without replacing them from a changed profile', () => {
    const draft = { ...createDraft(lakeshore, DEMO_PROFILE), clinicName: 'My clinic', notes: 'Please call ahead.', accommodations: [] };
    expect(restoreDraft(draft, lakeshore, { ...DEMO_PROFILE, letter: {} })).toEqual(draft);
    expect(restoreDraft(draft, fruitvale, DEMO_PROFILE).clinicName).toBe(fruitvale.name);
  });

  it('recovers from malformed saved drafts instead of rendering invalid values', () => {
    const draft = createDraft(lakeshore, DEMO_PROFILE);
    for (const corrupt of [null, [], {}, { ...draft, sender: [] }, { ...draft, sender: { name: 12 } }, { ...draft, accommodations: ['bad-key'] }, { ...draft, updatedAt: 'bad date' }]) {
      const restored = restoreDraft(corrupt, lakeshore, DEMO_PROFILE);
      expect(restored.clinicName).toBe(lakeshore.name);
      expect(restored.accommodations).toEqual(['lift']);
    }
  });

  it('validates clinic, dates and optional email without requiring personal details', () => {
    const draft = { ...createDraft(lakeshore, DEMO_PROFILE), sender: {} };
    expect(validateDraft(draft)).toEqual({});
    expect(validateDraft({ ...draft, clinicName: ' ', appointmentDate: '2026-02-29', sender: { email: 'invalid' } })).toEqual({
      clinic: 'Enter the clinic name.', date: 'Enter a valid appointment date.', email: 'Enter a valid email address, or leave it blank.',
    });
    expect(validateDraft({ ...draft, appointmentDate: '2028-02-29', sender: { email: 'maya@example.com' } })).toEqual({});
    expect(formatCalendarDate('2026-11-14')).toBe('November 14, 2026');
  });

  it('uses edited values and the same letter text for exports, including its disclaimer', () => {
    const draft = { ...createDraft(lakeshore, DEMO_PROFILE), clinicName: 'Edited clinic', appointmentDate: '2026-11-14', doctor: 'Dr. Ana Reyes', notes: 'Please help with transfers.', updatedAt: '2026-10-31T12:00:00Z' };
    const letter = buildLetter(draft, lakeshore);
    expect(letter.subject).toContain('November 14, 2026');
    for (const value of ['Edited clinic', lakeshore.address, 'Dr. Ana Reyes', draft.notes, 'Maya Johnson', 'maya.j@example.com', '(510) 555-0199', 'Section 504', 'Americans with Disabilities Act', 'Not legal advice.']) {
      expect(letter.text).toContain(value);
    }
    expect(letter.text).toContain('• A patient lift');
    expect(letter.text).not.toContain('• A wheelchair-accessible scale');
  });

  it('supports undated visits, missing contact details and every canonical accommodation', () => {
    const draft = { ...createDraft(lakeshore, DEMO_PROFILE), accommodations: Object.keys(FEATURES) as (keyof typeof FEATURES)[], sender: {} };
    const letter = buildLetter(draft, lakeshore);
    expect(letter.requests).toHaveLength(19);
    expect(letter.text).toContain('upcoming appointment');
    expect(letter.text).not.toMatch(/undefined|Invalid Date|contact me at/);
    expect(buildLetter({ ...draft, accommodations: [] }, lakeshore).text).not.toContain('•');
    expect(buildLetter({ ...draft, accommodations: [] }, lakeshore).introduction).toMatch(/complete exam\.$/);
  });

  it('summarizes required and nice-to-have counts, unknown and missing needs from the engine', () => {
    expect(fitSummary(matchClinic(DEMO_PROFILE.needs, lakeshore, DEMO_PROFILE.location))).toBe('Has all 3 of your required needs and 2 of 3 nice-to-haves. Unknown: Patient lift.');
    expect(fitSummary(matchClinic(DEMO_PROFILE.needs, fruitvale, DEMO_PROFILE.location))).toContain('Missing: Patient lift.');
    expect(fitSummary(matchClinic([], lakeshore, DEMO_PROFILE.location))).toBe('Your access needs are not set yet.');
    expect(fitSummary(matchClinic([{ key: 'lift', priority: 'nice' }], lakeshore, DEMO_PROFILE.location))).toBe('Has 0 of 1 nice-to-haves. Unknown: Patient lift.');
  });
});
