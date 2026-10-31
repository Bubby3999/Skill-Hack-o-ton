import { describe, expect, it } from 'vitest';
import { buildChatRequest, parseModelOutput } from '../../src/contracts';
import { CLINICS } from '../../src/data/clinics';
import { DEMO_PROFILE } from '../../src/data/demoProfile';
import { applyAssistantFilters, defaultFilters } from '../../src/lib/filters';
import { searchClinics } from '../../src/lib/match';
import { mockChat } from './mock';

const demo = 'OB-GYN within 15 miles who can weigh me seated';
const request = (...texts: string[]) => buildChatRequest(DEMO_PROFILE, texts.map((content) => ({ role: 'user', content })));
const ids = new Set(CLINICS.map((clinic) => clinic.id));

describe('mock clinic assistant', () => {
  it('reproduces the demo filters and the three Strong/Possible fits using the real matcher', () => {
    const response = mockChat(request(demo));
    expect(response.filters).toEqual({ care: 'OB-GYN', radius: 15, needs: [{ key: 'scale', priority: 'required' }] });
    expect(parseModelOutput(response, ids).ok).toBe(true);
    const filters = applyAssistantFilters(defaultFilters(DEMO_PROFILE), response.filters!);
    expect(filters.needs).toHaveLength(6);
    expect(searchClinics(filters, CLINICS).items.filter(({ match }) => match.tier !== 'poor').map(({ clinic, match }) => [clinic.id, match.tier])).toEqual([
      ['lakeshore-womens-health', 'strong'], ['fruitvale-obgyn-associates', 'possible'], ['bayview-medical-center', 'possible'],
    ]);
  });

  it('answers the lift chip with Unknown or Not available rather than inventing equipment', () => {
    const response = mockChat(request(demo, 'Which of these have a patient lift?'));
    expect(response.filters).toBeUndefined();
    expect(response.clinicIds).toEqual(['lakeshore-womens-health', 'fruitvale-obgyn-associates', 'bayview-medical-center']);
    expect(response.reply).toContain("Lakeshore Women's Health — Patient lift: Unknown. No information yet.");
    expect(response.reply).toContain('Fruitvale OB-GYN Associates — Patient lift: Not available. 2026-08-14 · Clinic phone call');
    expect(response.reply).toContain('Bayview Medical Center — Patient lift: Unknown. No information yet.');
    expect(parseModelOutput(response, ids).ok).toBe(true);
  });

  it('answers the scale verification chip from Lakeshore’s evidence', () => {
    const response = mockChat(request("Is Lakeshore's scale verified?"));
    expect(response.reply).toContain('Wheelchair scale: Verified. 2026-09-18 · Clinic phone call');
    expect(response.filters).toBeUndefined();
    expect(response.clinicIds).toEqual(['lakeshore-womens-health']);
  });

  it('keeps patient reports distinct from verification', () => {
    expect(mockChat(request("Is Laurel's lift verified?")).reply).toContain('Patient-reported. 2026-10-12 · 1 patient report');
  });

  it('does not guess the current GPS results when location was not sent', () => {
    const req = request(demo, 'Which of these have a patient lift?');
    delete req.zip;
    expect(mockChat(req).reply).toContain('Ask about a clinic by name or use manual filters.');
  });

  it('keeps earlier search filters when changing only distance, and ignores intervening clinic questions', () => {
    expect(mockChat(request(demo, "Is Lakeshore's lift verified?", 'Within 10 miles')).filters).toEqual({
      care: 'OB-GYN', radius: 10, needs: [{ key: 'scale', priority: 'required' }],
    });
  });

  it('supports a nice-to-have and rounds distance to the allowed radius', () => {
    expect(mockChat(request('Primary care within 12 miles, quiet room if possible')).filters).toEqual({
      care: 'Primary care', radius: 10, needs: [{ key: 'quiet-room', priority: 'nice' }],
    });
  });

  it('declines medical advice and offers a useful example for unsupported messages', () => {
    expect(mockChat(request('What medication should I take?')).reply).toContain('can’t give medical advice');
    expect(mockChat(request('Hello')).reply).toContain(demo);
  });
});
