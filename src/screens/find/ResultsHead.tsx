import { Link } from 'react-router-dom';
import { Icon } from '../../components';
import type { ResultsSearch } from './useResultsSearch';

/** Title, live count, and the List / Map toggle (keeps the query string). Shared by 05, 06 and 07. */
export function ResultsHead({ s, view }: { s: ResultsSearch; view: 'list' | 'map' }) {
  return (
    <>
      <div className="stack stack--xs">
        <h1 className="title-2" ref={s.headingRef} tabIndex={-1}>{s.title}</h1>
        <p className="meta" role="status">{s.status}</p>
      </div>
      <nav className="view-toggle" aria-label="Results view">
        <Link to={`/results${s.search}`} aria-current={view === 'list' ? 'true' : undefined}><Icon name="list" />List</Link>
        <Link to={`/results/map${s.search}`} aria-current={view === 'map' ? 'true' : undefined}><Icon name="map" />Map</Link>
      </nav>
    </>
  );
}
