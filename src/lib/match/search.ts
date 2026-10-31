import { matchClinic } from './match';
import type { Clinic, MatchResult, SearchFilters, Tier } from '../../contracts';

export interface RankedClinic {
  clinic: Clinic;
  match: MatchResult;
}

export interface SearchOutcome {
  /** Every in-range clinic of the requested care type, sorted. Includes Poor fits. */
  items: RankedClinic[];
  /** Strong + Possible (or, with no required needs, all) items. */
  goodCount: number;
  /** "none-in-range": no clinic of that type in range. "no-match": clinics exist but none is Strong/Possible. */
  emptyReason: null | 'no-match' | 'none-in-range';
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const ALIASES: Record<string, string> = {
  gynecology: 'obgyn', gyn: 'obgyn', obstetrics: 'obgyn', womenshealth: 'obgyn',
  radiology: 'imaging', xray: 'imaging', mri: 'imaging', mammogram: 'imaging', mammography: 'imaging',
  pcp: 'primarycare', familymedicine: 'primarycare', familydoctor: 'primarycare', doctor: 'primarycare',
  urgent: 'urgentcare', walkin: 'urgentcare',
};
/** "OB-GYN", "ob gyn" and "Gynecology" are one thing; equality, not substring ("Primary care" != "Urgent care"). */
export const normalizeCare = (care: string): string => ALIASES[norm(care)] ?? norm(care);

const TIER_RANK: Record<Tier, number> = { strong: 0, possible: 1, poor: 2 };
const tierRank = (t: Tier | null) => (t ? TIER_RANK[t] : 3);

export function searchClinics(filters: SearchFilters, clinics: Clinic[]): SearchOutcome {
  const care = normalizeCare(filters.care);
  const items = clinics
    .filter((c) => !care || c.specialties.some((s) => normalizeCare(s) === care))
    .map((clinic) => ({ clinic, match: matchClinic(filters.needs, clinic, filters.location) }))
    .filter((r) => r.match.distance <= filters.radius); // rounded distance = the one shown on the card

  const best = (a: RankedClinic, b: RankedClinic) =>
    tierRank(a.match.tier) - tierRank(b.match.tier) || b.match.score - a.match.score || a.match.distance - b.match.distance;
  const nearest = (a: RankedClinic, b: RankedClinic) =>
    a.match.distance - b.match.distance || tierRank(a.match.tier) - tierRank(b.match.tier);
  items.sort(filters.sort === 'nearest' ? nearest : best);

  // With no required needs there is no tier, so every in-range clinic counts as a result.
  const goodCount = items.filter((r) => r.match.tier !== 'poor').length;
  const emptyReason = goodCount > 0 ? null : items.length === 0 ? 'none-in-range' : 'no-match';
  return { items, goodCount, emptyReason };
}
