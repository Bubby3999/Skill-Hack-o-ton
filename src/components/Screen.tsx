import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppBar } from './AppBar';
import { Dock } from './Dock';

let firstScreen = true;

interface ScreenProps {
  /** Becomes document.title ("<title> · CareFit"). */
  title: string;
  /** Back link; omit on tab roots (shows the brand). */
  back?: { to: string; label: string };
  /** App bar end slot (e.g. a StatusLine). */
  barEnd?: ReactNode;
  /** Rendered in the sticky dock above the tab bar (ActionBar, composer). */
  dock?: ReactNode;
  /** Hide the tab bar (onboarding). */
  noNav?: boolean;
  /** main--flush: no padding (map view). */
  flush?: boolean;
  children: ReactNode;
}

/** Every screen renders inside this: header, <main id="main">, dock. Focus moves to #main on route change. */
export function Screen({ title, back, barEnd, dock, noNav, flush, children }: ScreenProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `${title} · CareFit`;
  }, [title]);

  useEffect(() => {
    if (firstScreen) firstScreen = false; // don't steal focus on the first load
    else document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]); // not search params: filter edits must not move focus

  return (
    <>
      <AppBar back={back} end={barEnd} />
      <main id="main" tabIndex={-1} className={flush ? 'main--flush' : undefined}>
        {children}
      </main>
      {noNav && !dock ? null : <Dock nav={!noNav}>{dock}</Dock>}
    </>
  );
}
