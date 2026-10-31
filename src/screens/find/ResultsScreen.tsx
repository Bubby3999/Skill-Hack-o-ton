import { useState } from 'react';
import { Button, ClinicCard, Icon, Notice, Screen } from '../../components';
import type { SortMode } from '../../contracts';
import { EmptyState } from './EmptyState';
import { FiltersPanel } from './FiltersPanel';
import { ResultsHead } from './ResultsHead';
import { activeFilterCount } from './searchView';
import { useResultsSearch } from './useResultsSearch';
import './find.css';

// Screens 05 (list) and 07 (empty state of the same route).
export default function ResultsScreen() {
  const s = useResultsSearch();
  const [open, setOpen] = useState(false);
  const { filters, partial, update } = s;

  return (
    <Screen title={s.title} back={{ to: '/find', label: 'Find' }}>
      <div className="stack">
        <ResultsHead s={s} view="list" />
        <div className="toolbar">
          {s.showEmpty ? null : (
            <div className="field">
              <label className="label-inline" htmlFor="sort">Sort by</label>
              <div className="select-wrap">
                <select className="select" id="sort" value={filters.sort} onChange={(e) => update({ ...filters, sort: e.target.value as SortMode }, partial)}>
                  <option value="best">Best match</option>
                  <option value="nearest">Nearest</option>
                </select>
                <Icon name="chevron-down" />
              </div>
            </div>
          )}
          <Button variant="secondary" icon="sliders" aria-expanded={open} aria-controls="filters-panel" onClick={() => setOpen(!open)}>
            Filters <span className="count">{activeFilterCount(filters)}<span className="visually-hidden"> active</span></span>
          </Button>
        </div>
        {open ? <FiltersPanel s={s} id="filters-panel" /> : null}
      </div>

      {s.showEmpty ? (
        <EmptyState s={s} />
      ) : (
        <>
          {s.outcome.emptyReason === 'no-match' ? (
            <Notice>No clinic here meets all your required needs. These are partial matches.</Notice>
          ) : null}
          <ol className="card-list">
            {s.items.map(({ clinic, match }, i) => (
              <li key={clinic.id}>
                <ClinicCard rank={i + 1} clinic={clinic} match={match} />
              </li>
            ))}
          </ol>
        </>
      )}
    </Screen>
  );
}
