import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ClinicCard, FitBadge, FitMeter } from '../../src/components';
import { clinicById } from '../../src/data/clinics';
import { DEMO_PROFILE } from '../../src/data/demoProfile';
import { matchClinic } from '../../src/lib/match';

const card = (id: string, needs = DEMO_PROFILE.needs, variant: 'full' | 'compact' = 'full') => {
  const clinic = clinicById(id)!;
  return renderToStaticMarkup(
    <MemoryRouter><ClinicCard rank={1} clinic={clinic} match={matchClinic(needs, clinic, DEMO_PROFILE.location)} variant={variant} /></MemoryRouter>,
  );
};
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

describe('ClinicCard reproduces screen 05', () => {
  it('Lakeshore: strong fit, 5 of 6, the exact reason lines', () => {
    const html = card('lakeshore-womens-health');
    expect(html).toContain('fit-badge--strong');
    expect(text(html)).toContain('4.8 mi');
    expect(text(html)).toContain('5 of 6 needs');
    expect(text(html)).toContain('Has: Wheelchair scale, Adjustable table, Step-free entrance, Accessible restroom, Extra time');
    expect(text(html)).toContain('Unknown: Patient lift');
    expect(html).toContain('href="/clinic/lakeshore-womens-health"');
  });
  it('Fruitvale: marks the unknown required need', () => {
    const t = text(card('fruitvale-obgyn-associates'));
    expect(t).toContain('Possible fit');
    expect(t).toContain('Unknown: Adjustable table (required)');
    expect(t).toContain('Missing: Patient lift');
  });
  it('Grand Avenue: poor fit lists Missing first', () => {
    const t = text(card('grand-avenue-womens-clinic'));
    expect(t).toContain('Poor fit');
    expect(t.indexOf('Missing:')).toBeLessThan(t.indexOf('Has:'));
    expect(t).toContain('Missing: Wheelchair scale (required), Patient lift');
  });
  it('meter segments follow need order and split before the first nice-to-have', () => {
    const html = card('fruitvale-obgyn-associates');
    expect(html.match(/class="seg seg--[a-z]+( seg--split)?"/g)).toEqual([
      'class="seg seg--has"', 'class="seg seg--unknown"', 'class="seg seg--has"',
      'class="seg seg--missing seg--split"', 'class="seg seg--has"', 'class="seg seg--has"',
    ]);
  });
  it('compact variant drops the meter and the Has line', () => {
    const t = card('lakeshore-womens-health', DEMO_PROFILE.needs, 'compact');
    expect(t).not.toContain('fit-meter');
    expect(text(t)).not.toContain('Has:');
    expect(text(t)).toContain('Unknown: Patient lift');
  });
  it('no required needs: count only, no badge; no needs: link to add them', () => {
    const nice = DEMO_PROFILE.needs.filter((n) => n.priority === 'nice');
    const t = card('lakeshore-womens-health', nice);
    expect(t).not.toContain('fit-badge');
    expect(text(t)).toContain('2 of 3 needs');
    const none = card('lakeshore-womens-health', []);
    expect(none).not.toContain('fit__count');
    expect(none).toContain('/profile/needs?from=%2F');
  });
  it('FitBadge and FitMeter render nothing for no needs', () => {
    const m = { tier: null, met: 0, total: 0 } as const;
    expect(renderToStaticMarkup(<FitBadge match={m} />)).toBe('');
    expect(renderToStaticMarkup(<FitMeter perNeed={[]} />)).toContain('fit-meter');
  });
});
