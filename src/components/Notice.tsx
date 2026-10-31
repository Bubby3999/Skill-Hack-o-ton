import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

/** Info or error callout. Errors are announced (role="alert"). */
export function Notice({ icon = 'info', error, children }: { icon?: IconName; error?: boolean; children: ReactNode }) {
  return (
    <div className={`notice${error ? ' notice--error' : ''}`} role={error ? 'alert' : undefined}>
      <Icon name={error ? 'triangle-alert' : icon} />
      <p>{children}</p>
    </div>
  );
}

/** Polite status message such as "Draft saved". */
export function StatusLine({ icon = 'check', children }: { icon?: IconName; children: ReactNode }) {
  return (
    <p className="status-line" role="status">
      <Icon name={icon} />
      {children}
    </p>
  );
}
