import { Link, useLocation } from 'react-router-dom';
import { FitBadge, FitMeter, Reasons } from './Fit';
import { openLabel } from '../lib/hours';
import { needsEditPath } from '../lib/returnTo';
import type { Clinic, MatchResult } from '../contracts';

const TYPE_LABEL: Record<Clinic['type'], string> = { clinic: 'Clinic', hospital: 'Hospital', 'urgent-care': 'Urgent care', imaging: 'Imaging center' };

/** What a card says about the clinic: "OB-GYN clinic", "Hospital", ... */
export function clinicKind(c: Clinic): string {
  return c.type === 'clinic' && c.specialties[0] ? `${c.specialties[0]} clinic` : TYPE_LABEL[c.type];
}

interface Props {
  rank: number;
  clinic: Clinic;
  match: MatchResult;
  /** Heading level: h2 in a list, h3 inside the map sheet. */
  as?: 'h2' | 'h3';
  /** compact (map sheet): no meta line, no meter, only Unknown and Missing reasons. */
  variant?: 'full' | 'compact';
}

export function ClinicCard({ rank, clinic, match, as: Heading = 'h2', variant = 'full' }: Props) {
  const loc = useLocation();
  const id = `clinic-${clinic.id}`;
  const compact = variant === 'compact';
  return (
    <article className="clinic-card" aria-labelledby={id}>
      <div className="clinic-card__head">
        <span className="rank" aria-hidden="true">{rank}</span>
        <Heading className="clinic-card__title" id={id}>
          <Link className="card-link" to={`/clinic/${clinic.id}`}>{clinic.name}</Link>
        </Heading>
        <span className="clinic-card__distance">{match.distance} mi</span>
      </div>
      {compact ? null : <p className="meta">{clinicKind(clinic)} · {openLabel(clinic.hours)}</p>}
      {match.total ? (
        <>
          <FitBadge match={match} />
          {compact ? null : <FitMeter perNeed={match.perNeed} />}
          <Reasons match={match} only={compact ? ['unknown', 'missing'] : undefined} />
        </>
      ) : (
        <p className="meta">
          <Link to={needsEditPath(loc.pathname + loc.search)}>Add your needs</Link> to see how this clinic fits.
        </p>
      )}
    </article>
  );
}

