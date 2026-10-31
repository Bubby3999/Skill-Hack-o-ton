import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import type { IconName } from './Icon';

/** Settings-style row. Plain rows are <li> (put them in <ul className="list">). With `to` it is a standalone link card with a trailing chevron. */
export function ListRow({ icon, label, value, to, end }: { icon?: IconName; label: ReactNode; value?: ReactNode; to?: string; end?: ReactNode }) {
  const body = (
    <>
      {icon ? <Icon name={icon} /> : null}
      <span className="list-row__body">
        <span className="list-row__label">{label}</span>
        {value ? <span className="list-row__value">{value}</span> : null}
      </span>
      {end}
      {to ? <Icon name="chevron-right" /> : null}
    </>
  );
  return to ? <Link className="list-row link-card" to={to}>{body}</Link> : <li className="list-row">{body}</li>;
}
