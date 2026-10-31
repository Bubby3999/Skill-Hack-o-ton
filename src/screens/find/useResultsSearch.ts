import { useCallback, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { SearchFilters } from '../../contracts';
import { CLINICS } from '../../data/clinics';
import { defaultFilters, queryToFilters } from '../../lib/filters';
import { searchClinics } from '../../lib/match';
import { useProfile } from '../../shell/ProfileProvider';
import { careLabel, placeText, resultsQuery, statusText } from './searchView';

/** One search for list and map: the URL is the source of truth, so Ask and Find give the same list for the same filters. */
export function useResultsSearch() {
  const { profile } = useProfile();
  const [params, setParams] = useSearchParams();
  const { search } = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const filters = useMemo(() => queryToFilters(params, defaultFilters(profile)), [params, profile]);
  const outcome = useMemo(() => searchClinics(filters, CLINICS), [filters]);
  const partial = params.get('partial') === '1';
  const showEmpty = outcome.emptyReason !== null && !(outcome.emptyReason === 'no-match' && partial);
  const items = showEmpty ? [] : outcome.items;
  const care = careLabel(filters.care);
  const title = `${care || 'Clinics'} near ${placeText(profile.location)}`;

  /** Changes this search only (URL); the profile is untouched. Focus returns to the heading because the clicked control may vanish. */
  const update = useCallback(
    (next: SearchFilters, keepPartial = false, refocus = false) => {
      setParams(resultsQuery(next, keepPartial), { replace: true });
      if (refocus) requestAnimationFrame(() => headingRef.current?.focus());
    },
    [setParams],
  );

  return { filters, outcome, partial, showEmpty, items, title, care, search, headingRef, update, status: statusText(filters, outcome, partial) };
}

export type ResultsSearch = ReturnType<typeof useResultsSearch>;
