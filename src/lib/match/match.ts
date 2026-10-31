import { distanceMiles } from '../geo';
import type { Clinic, LatLng, MatchResult, Need, NeedMatch, Tier } from '../../contracts';
import type { FeatureStatus } from '../../contracts';

const outcome = (s: FeatureStatus): 'has' | 'unknown' | 'missing' =>
  s === 'verified' || s === 'patient-reported' ? 'has' : s === 'not-available' ? 'missing' : 'unknown';

/** Required needs first, then the rest, each in profile order. */
export const orderNeeds = (needs: Need[]): Need[] => [
  ...needs.filter((n) => n.priority === 'required'),
  ...needs.filter((n) => n.priority !== 'required'),
];

/** Pure: how one clinic fits a list of needs, seen from `origin`. Rules: plans/STEP-3-SETUP.md §7. */
export function matchClinic(needs: Need[], clinic: Clinic, origin: LatLng): MatchResult {
  const perNeed: NeedMatch[] = orderNeeds(needs).map((n) => ({
    key: n.key,
    priority: n.priority,
    status: clinic.accessFeatures[n.key]?.status ?? 'unknown', // a key the clinic lacks is unknown
  }));
  const has = perNeed.filter((m) => outcome(m.status) === 'has');
  const unknown = perNeed.filter((m) => outcome(m.status) === 'unknown');
  const missing = perNeed.filter((m) => outcome(m.status) === 'missing');
  const required = perNeed.filter((m) => m.priority === 'required');

  let tier: Tier | null = null;
  if (required.length) {
    tier = required.some((m) => outcome(m.status) === 'missing')
      ? 'poor'
      : required.some((m) => outcome(m.status) === 'unknown')
        ? 'possible'
        : 'strong';
  }
  const total = perNeed.length;
  return {
    score: total ? has.length / total : 0,
    tier,
    has,
    unknown,
    missing,
    perNeed,
    met: has.length,
    total,
    distance: distanceMiles(origin, clinic),
  };
}
