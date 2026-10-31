import { Button, Icon } from '../../components';
import { NEXT_RADIUS, careWord, centersText, featureText, missingRequiredKeys } from './searchView';
import type { ResultsSearch } from './useResultsSearch';

/** Screen 07: nothing Strong or Possible in range, or no clinic of that type in range. */
export function EmptyState({ s }: { s: ResultsSearch }) {
  const { filters, outcome, update } = s;
  const wider = NEXT_RADIUS[filters.radius];
  const missing = missingRequiredKeys(outcome.items);
  const noMatch = outcome.emptyReason === 'no-match';
  const noun = s.care ? `${careWord(s.care)} clinics` : 'clinics';

  return (
    <>
      <div className="empty">
        <div className="empty__icon" aria-hidden="true"><Icon name="search" /></div>
        {noMatch ? (
          <>
            <h2 className="title-3">No full matches within {filters.radius} mi</h2>
            <p className="lead">
              {centersText(s.care, outcome.items.length)} nearby {outcome.items.length === 1 ? 'is' : 'are'} missing a required need:{' '}
              <strong>{missing.map(featureText).join(', ')}</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 className="title-3">No {noun} within {filters.radius} mi</h2>
            <p className="lead">{wider ? 'Try a wider search area.' : 'This is the widest search area. Try a different type of care.'}</p>
          </>
        )}
      </div>
      <div className="stack">
        {wider ? (
          <Button block onClick={() => update({ ...filters, radius: wider }, false, true)}>Search within {wider} mi instead</Button>
        ) : null}
        {noMatch ? (
          <Button variant="secondary" block onClick={() => update(filters, true, true)}>
            Show the {outcome.items.length} partial {outcome.items.length === 1 ? 'match' : 'matches'}
          </Button>
        ) : null}
        <Button variant="ghost" block icon="message-circle" to="/ask">Ask CareFit for help</Button>
      </div>
    </>
  );
}
