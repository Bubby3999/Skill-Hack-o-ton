// Pure helpers for Find / Results / Map. Matching itself lives in src/lib/match.
import { FEATURES } from '../../contracts';
import type { FeatureKey, Location, Radius, SearchFilters } from '../../contracts';
import { filtersToQuery } from '../../lib/filters';
import { normalizeCare } from '../../lib/match';
import type { RankedClinic, SearchOutcome } from '../../lib/match';

export const CARE_CHIPS = ['Primary care', 'OB-GYN', 'Imaging', 'Urgent care'] as const;

/** "ob gyn" -> "OB-GYN"; free text the chips don't know stays as typed. */
export function careLabel(care: string): string {
  const t = care.trim();
  const n = normalizeCare(t);
  return CARE_CHIPS.find((c) => normalizeCare(c) === n) ?? t;
}

/** Widen steps: 5 -> 15 -> 25 -> 50 (10 joins at 15). 50 is the widest. */
export const NEXT_RADIUS: Partial<Record<Radius, Radius>> = { 5: 15, 10: 15, 15: 25, 25: 50 };

/** The search URL. `partial=1` (Worker C only) lists Poor fits instead of the empty state. */
export const resultsQuery = (f: SearchFilters, partial = false) => filtersToQuery(f) + (partial ? '&partial=1' : '');

export const isLocationSet = (l: Location) => Number.isFinite(l.lat) && Number.isFinite(l.lng) && !(l.lat === 0 && l.lng === 0) && !!l.label;

/** "94612" for a ZIP, otherwise the saved label. */
export const placeText = (l: Location) => l.zip ?? l.label;

/** Required needs missing at in-range clinics, in order of first appearance. */
export function missingRequiredKeys(items: RankedClinic[]): FeatureKey[] {
  const out: FeatureKey[] = [];
  for (const { match } of items) for (const m of match.missing) if (m.priority === 'required' && !out.includes(m.key)) out.push(m.key);
  return out;
}

/** "Wheelchair-accessible scale" -> "wheelchair-accessible scale"; "In-person ASL interpreter" keeps ASL. */
export const featureText = (k: FeatureKey) => FEATURES[k].label.replace(/^([A-Z])(?![A-Z])/, (c) => c.toLowerCase());

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The polite live-region text. */
export function statusText(f: SearchFilters, o: SearchOutcome, partial: boolean): string {
  if (o.emptyReason === 'none-in-range') return `0 clinics within ${f.radius} mi`;
  if (o.emptyReason === 'no-match' && !partial) return `0 clinics within ${f.radius} mi meet your required needs`;
  return `${plural(o.items.length, 'clinic', 'clinics')} within ${f.radius} mi · ${f.sort === 'nearest' ? 'nearest first' : 'best match first'}`;
}

/** Count on the Filters button: type, radius, needs (the three things the panel edits). */
export const activeFilterCount = (f: SearchFilters) => (f.care.trim() ? 1 : 0) + 1 + (f.needs.length ? 1 : 0);

/** Care type in running text: "imaging", "OB-GYN". */
export const careWord = (care: string) => (care === 'OB-GYN' ? care : care.toLowerCase());

/** "2 imaging centers" / "2 OB-GYN centers" / "3 clinics" (no type chosen). */
export function centersText(care: string, n: number): string {
  const c = careLabel(care);
  return c ? `${n} ${careWord(c)} ${n === 1 ? 'center' : 'centers'}` : plural(n, 'clinic', 'clinics');
}
