import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import type { IconName } from './Icon';

const TABS: { label: string; to: string; icon: IconName; match: (p: string) => boolean }[] = [
  { label: 'Find', to: '/find', icon: 'search', match: (p) => p === '/find' || p.startsWith('/results') || p.startsWith('/clinic') },
  { label: 'Ask', to: '/ask', icon: 'message-circle', match: (p) => p === '/ask' },
  { label: 'Profile', to: '/profile', icon: 'user', match: (p) => p.startsWith('/profile') },
];
const TAB_ROOTS = new Set(['/find', '/ask', '/profile']);

/** Find · Ask · Profile. aria-current="page" on a tab root, "true" on its sub-screens. */
export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="Main">
      <ul>
        {TABS.map((t) => (
          <li key={t.to}>
            <Link to={t.to} aria-current={t.match(pathname) ? (TAB_ROOTS.has(pathname) ? 'page' : 'true') : undefined}>
              <span className="bottom-nav__icon"><Icon name={t.icon} /></span>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Sticky bottom area: optional action bar / composer above the tab bar. */
export function Dock({ children, nav = true }: { children?: ReactNode; nav?: boolean }) {
  return (
    <div className="dock">
      {children}
      {nav ? <BottomNav /> : null}
    </div>
  );
}

/** Sticky primary actions (e.g. "Preview letter"). Put inside <Screen dock={...}>. */
export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="action-bar">{children}</div>;
}
