import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Screen } from '../components';

/** Temporary screen body: names the screen and the worker who replaces it. */
export function Placeholder({ title, screen, worker, back, nav = true, links = [], children }: {
  title: string;
  screen: string;
  worker: string;
  back?: { to: string; label: string };
  nav?: boolean;
  links?: { to: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <Screen title={title} back={back} noNav={!nav}>
      <div className="stack">
        <h1 className="title-1">{title}</h1>
        <p className="meta">Placeholder for screen {screen} · {worker}</p>
        {children}
        {links.length ? (
          <ul className="stack stack--sm">
            {links.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}
          </ul>
        ) : null}
      </div>
    </Screen>
  );
}

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
