import { Link } from 'react-router-dom';
import { Screen } from '../components';

export function NotFound() {
  return (
    <Screen title="Page not found">
      <div className="stack">
        <h1 className="title-1">Page not found</h1>
        <p className="lead">That page does not exist.</p>
        <Link className="btn btn--primary" to="/find">Go to Find</Link>
      </div>
    </Screen>
  );
}
