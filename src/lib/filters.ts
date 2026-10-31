import { isFeatureKey, isRadius } from '../contracts';
import type { AssistantFilters, Need, Profile, SearchFilters, SortMode } from '../contracts';

/** Starting filters for a search: location, radius and needs come from the profile. */
export function defaultFilters(profile: Profile, care = ''): SearchFilters {
  return {
    care,
    radius: profile.radius,
    needs: profile.needs,
    sort: 'best',
    location: { lat: profile.location.lat, lng: profile.location.lng, label: profile.location.label },
  };
}

/** Assistant filters override the base; assistant needs replace same-key needs and add new ones. */
export function applyAssistantFilters(base: SearchFilters, a: AssistantFilters): SearchFilters {
  const merged = new Map<string, Need>(base.needs.map((n) => [n.key, n]));
  for (const n of a.needs ?? []) merged.set(n.key, n);
  return { ...base, care: a.care ?? base.care, radius: a.radius ?? base.radius, needs: [...merged.values()] };
}

// ---- URL <-> filters. Location always comes from the profile, never the URL. ----
/** needs are "key.r" (required) or "key.n" (nice), comma-separated, in order. */
export function filtersToQuery(f: SearchFilters): string {
  const p = new URLSearchParams();
  if (f.care) p.set('care', f.care);
  p.set('radius', String(f.radius));
  p.set('sort', f.sort);
  p.set('needs', f.needs.map((n) => `${n.key}.${n.priority === 'required' ? 'r' : 'n'}`).join(','));
  return p.toString();
}

/** Missing or invalid params fall back to `base`. Needs present-but-empty ("needs=") mean no needs. */
export function queryToFilters(params: URLSearchParams, base: SearchFilters): SearchFilters {
  const radius = Number(params.get('radius'));
  const sort = params.get('sort');
  const rawNeeds = params.get('needs');
  let needs = base.needs;
  if (rawNeeds !== null) {
    needs = [];
    for (const part of rawNeeds.split(',')) {
      const [key, p] = part.split('.');
      if (isFeatureKey(key) && (p === 'r' || p === 'n') && !needs.some((n) => n.key === key)) {
        needs.push({ key, priority: p === 'r' ? 'required' : 'nice' });
      }
    }
  }
  return {
    ...base,
    care: params.get('care') ?? base.care,
    radius: isRadius(radius) ? radius : base.radius,
    sort: sort === 'best' || sort === 'nearest' ? (sort as SortMode) : base.sort,
    needs,
  };
}

