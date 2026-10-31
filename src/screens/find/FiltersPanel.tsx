import { CATEGORIES, FEATURES, FEATURE_KEYS, RADII } from '../../contracts';
import type { FeatureKey, Priority, Radius } from '../../contracts';
import { Chip, Icon } from '../../components';
import { CARE_CHIPS, careLabel } from './searchView';
import type { ResultsSearch } from './useResultsSearch';

/** Type, radius and needs for this search only. Edits go to the URL; the profile is not touched. */
export function FiltersPanel({ s, id }: { s: ResultsSearch; id: string }) {
  const { filters, partial, update } = s;
  const set = (patch: Partial<typeof filters>) => update({ ...filters, ...patch }, partial);
  const current = careLabel(filters.care);

  const toggleNeed = (key: FeatureKey, on: boolean) =>
    set({ needs: on ? [...filters.needs, { key, priority: 'required' }] : filters.needs.filter((n) => n.key !== key) });
  const setPriority = (key: FeatureKey, priority: Priority) =>
    set({ needs: filters.needs.map((n) => (n.key === key ? { ...n, priority } : n)) });

  return (
    <section className="panel filters-panel" id={id} aria-labelledby={`${id}-h`}>
      <div className="stack stack--xs">
        <h2 className="title-3" id={`${id}-h`}>Filters</h2>
        <p className="hint">These change this search only. Your profile stays as it is.</p>
      </div>

      <div className="field">
        <span className="label" id={`${id}-care`}>Type of care</span>
        <div className="chip-row" role="group" aria-labelledby={`${id}-care`}>
          {CARE_CHIPS.map((c) => (
            <Chip key={c} pressed={current === c} onClick={() => set({ care: current === c ? '' : c })}>{c}</Chip>
          ))}
        </div>
      </div>

      <fieldset className="field">
        <legend className="label">Search radius</legend>
        <div className="segmented segmented--grid">
          {RADII.map((r: Radius) => (
            <label className="segmented__opt" key={r}>
              <input type="radio" name="radius" value={r} checked={filters.radius === r} onChange={() => set({ radius: r })} />
              <span><Icon name="check" />{r} mi</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="stack stack--sm">
        <h3 className="label">Access needs</h3>
        {CATEGORIES.map((cat) => {
          const keys = FEATURE_KEYS.filter((k) => FEATURES[k].category === cat.id);
          const picked = keys.filter((k) => filters.needs.some((n) => n.key === k)).length;
          return (
            <details className="group" key={cat.id}>
              <summary>
                <span className="group__title">{cat.label} <span className="group__count">{picked} selected</span></span>
                <Icon name="chevron-down" className="group__chev" />
              </summary>
              <ul className="check-list group__body">
                {keys.map((k) => {
                  const need = filters.needs.find((n) => n.key === k);
                  return (
                    <li className="need" key={k}>
                      <label className="check">
                        <input type="checkbox" checked={!!need} onChange={(e) => toggleNeed(k, e.target.checked)} />
                        <span>{FEATURES[k].label}</span>
                      </label>
                      {need ? (
                        <fieldset className="segmented need__priority">
                          <legend className="visually-hidden">{FEATURES[k].label}: how important?</legend>
                          {(['required', 'nice'] as const).map((p) => (
                            <label className="segmented__opt" key={p}>
                              <input type="radio" name={`p-${k}`} value={p} checked={need.priority === p} onChange={() => setPriority(k, p)} />
                              <span><Icon name="check" />{p === 'required' ? 'Required' : 'Nice to have'}</span>
                            </label>
                          ))}
                        </fieldset>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}
