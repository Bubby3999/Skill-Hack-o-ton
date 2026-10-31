import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="back-link" to={to}>
      <Icon name="chevron-left" />
      {children}
    </Link>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <svg className="brand__mark" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="7" style={{ fill: 'var(--color-brand)' }} />
        <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--color-on-brand)', strokeWidth: 2.6 }} />
        <circle cx="19" cy="5" r="2.6" style={{ fill: 'var(--color-accent)' }} />
      </svg>
      CareFit
    </span>
  );
}

/** Top bar: a back link on sub-screens, the brand on tab roots. `end` is for a status line or actions. */
export function AppBar({ back, end }: { back?: { to: string; label: string }; end?: ReactNode }) {
  return (
    <header className="app-bar">
      {back ? <BackLink to={back.to}>{back.label}</BackLink> : <Brand />}
      {end ? <div className="app-bar__end">{end}</div> : null}
    </header>
  );
}
