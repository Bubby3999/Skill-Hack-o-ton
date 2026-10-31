import type { CSSProperties } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { FEATURES } from '../contracts';
import type { MatchResult, NeedMatch, Tier } from '../contracts';

const TIER: Record<Tier, { label: string; icon: IconName }> = {
  strong: { label: 'Strong fit', icon: 'circle-check' },
  possible: { label: 'Possible fit', icon: 'circle-help' },
  poor: { label: 'Poor fit', icon: 'circle-x' },
};

/** Tier badge plus "N of M needs". With no required needs there is no badge; with no needs, no count either. */
export function FitBadge({ match }: { match: Pick<MatchResult, 'tier' | 'met' | 'total'> }) {
  const { tier, met, total } = match;
  if (!tier && !total) return null;
  return (
    <div className="fit">
      {tier ? (
        <span className={`fit-badge fit-badge--${tier}`}>
          <Icon name={TIER[tier].icon} />
          {TIER[tier].label}
        </span>
      ) : null}
      <span className="fit__count">{met} of {total} needs</span>
    </div>
  );
}

const SEG = { has: 'has', 'patient-reported': 'has', 'not-available': 'missing', unknown: 'unknown' } as const;

/** One segment per need, required first. Filled = has, striped = unknown, outlined = missing. aria-hidden: the badge says the same in text. */
export function FitMeter({ perNeed }: { perNeed: NeedMatch[] }) {
  const firstNice = perNeed.findIndex((m) => m.priority !== 'required');
  return (
    <div className="fit-meter" aria-hidden="true">
      {perNeed.map((m, i) => (
        <span key={m.key} className={`seg seg--${SEG[m.status as keyof typeof SEG] ?? 'has'}${i === firstNice && i > 0 ? ' seg--split' : ''}`} />
      ))}
    </div>
  );
}

/** Labeled variant for the detail screen: one meter per priority. */
export function FitMeterGroups({ perNeed }: { perNeed: NeedMatch[] }) {
  const groups = [
    { label: 'Required', items: perNeed.filter((m) => m.priority === 'required') },
    { label: 'Nice to have', items: perNeed.filter((m) => m.priority !== 'required') },
  ].filter((g) => g.items.length);
  return (
    <div className="fit-meter-groups" aria-hidden="true">
      {groups.map((g) => (
        <div className="fit-meter-group" style={{ '--n': g.items.length } as CSSProperties} key={g.label}>
          <FitMeter perNeed={g.items} />
          {g.label}
        </div>
      ))}
    </div>
  );
}

const REASON: Record<'has' | 'unknown' | 'missing', { label: string; icon: IconName }> = {
  has: { label: 'Has:', icon: 'circle-check' },
  unknown: { label: 'Unknown:', icon: 'circle-help' },
  missing: { label: 'Missing:', icon: 'circle-x' },
};

/** Has / Unknown / Missing lines as text. Poor fits list Missing first (screen 05); required gaps are marked. */
export function Reasons({ match, only }: { match: MatchResult; only?: ('has' | 'unknown' | 'missing')[] }) {
  const order: ('has' | 'unknown' | 'missing')[] = match.tier === 'poor' ? ['missing', 'has', 'unknown'] : ['has', 'unknown', 'missing'];
  const rows = order.filter((k) => match[k].length && (!only || only.includes(k)));
  if (!rows.length) return null;
  return (
    <div className="reasons">
      {rows.map((k) => (
        <p key={k} className={`reason reason--${k}`}>
          <Icon name={REASON[k].icon} />
          <span>
            <span className="reason__label">{REASON[k].label}</span>{' '}
            {match[k].map((m, i) => (
              <span key={m.key}>
                {i ? ', ' : ''}
                {FEATURES[m.key].short}
                {k !== 'has' && m.priority === 'required' ? <> <strong>(required)</strong></> : null}
              </span>
            ))}
          </span>
        </p>
      ))}
    </div>
  );
}
