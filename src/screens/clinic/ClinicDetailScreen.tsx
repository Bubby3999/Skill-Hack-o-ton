import { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Button, FitBadge, FitMeterGroups, Icon, ListRow, Screen, Tag } from '../../components';
import { FEATURE_KEYS } from '../../contracts';
import { clinicById } from '../../data/clinics';
import { groupHours, openLabel } from '../../lib/hours';
import { matchClinic } from '../../lib/match';
import { needsEditPath } from '../../lib/returnTo';
import { useProfile } from '../../shell/ProfileProvider';
import { ClinicNotFound, FeatureRow } from './FeatureRow';
import { fitSummary } from './letter';
import './clinic.css';

export default function ClinicDetailScreen() {
  const { id = '' } = useParams();
  const { profile } = useProfile();
  const clinic = clinicById(id);
  if (!clinic) return <ClinicNotFound />;

  const match = matchClinic(profile.needs, clinic, profile.location);
  const groups = [
    { priority: 'required', label: 'Required' },
    { priority: 'nice', label: 'Nice to have' },
  ] as const;
  const otherFeatures = FEATURE_KEYS.filter((key) => !profile.needs.some((need) => need.key === key));
  const type = clinic.type === 'clinic' ? 'clinic' : clinic.type.replace('-', ' ');
  const directions = `https://www.openstreetmap.org/directions?to=${clinic.lat}%2C${clinic.lng}`;

  return (
    <Screen title={clinic.name} back={{ to: '/results', label: 'Results' }}>
      <div className="stack stack--sm clinic-identity">
        <div className="row"><Tag>{clinic.type === 'clinic' ? `${clinic.specialties[0]} ${type}` : type}</Tag></div>
        <h1 className="title-1">{clinic.name}</h1>
        <p className="meta">{clinic.address}</p>
        <p className="meta"><strong>{match.distance.toFixed(1)} mi away</strong> · {openLabel(clinic.hours)}</p>
        <p className="meta">Specialties: {clinic.specialties.join(', ')}</p>
      </div>

      <div className="action-grid" role="group" aria-label="Contact and directions">
        <a className="action" href={`tel:+1${clinic.phone.replace(/\D/g, '')}`}><Icon name="phone" size="lg" />Call</a>
        <a className="action" href={directions}><Icon name="navigation" size="lg" />Directions</a>
        <a className="action" href={clinic.website}><Icon name="globe" size="lg" />Website</a>
      </div>
      <div className="stack stack--xs clinic-contact">
        <p className="meta">Phone: {clinic.phone}</p>
        <p className="meta">Website: {clinic.website}</p>
      </div>

      <section className="panel" aria-labelledby="fit-heading">
        <h2 className="visually-hidden" id="fit-heading">How this clinic fits you</h2>
        <FitBadge match={match} />
        <FitMeterGroups perNeed={match.perNeed} />
        <p>{fitSummary(match)}</p>
        {!match.total && <Button to={needsEditPath(`/clinic/${id}`)} variant="secondary">Add your needs</Button>}
        <Button to={`/clinic/${id}/request`} block icon="file-text">Request accommodations</Button>
        <p className="hint">Drafts a letter to send before your visit.</p>
      </section>

      <section className="stack" aria-labelledby="needs-heading">
        <h2 className="title-2" id="needs-heading">Your needs</h2>
        {!match.total && <p className="hint">Add your access needs to see how this clinic fits you.</p>}
        {groups.map(({ priority, label }) => {
          const needs = match.perNeed.filter((need) => need.priority === priority);
          return needs.length ? (
            <Fragment key={priority}>
              <h3 className="eyebrow" id={`${priority}-heading`}>{label} · {needs.length}</h3>
              <ul className="feature-list" aria-labelledby={`${priority}-heading`}>
                {needs.map((need) => <FeatureRow key={need.key} feature={need.key} info={clinic.accessFeatures[need.key]} />)}
              </ul>
            </Fragment>
          ) : null;
        })}
      </section>

      <details className="group">
        <summary>
          <span className="group__title">Other access features <span className="group__count">{otherFeatures.length}</span></span>
          <Icon name="chevron-down" className="group__chev" />
        </summary>
        <ul className="group__body">
          {otherFeatures.map((key) => <FeatureRow key={key} feature={key} info={clinic.accessFeatures[key]} />)}
        </ul>
        {!otherFeatures.length && <p className="hint group__body">All access features are listed in your needs above.</p>}
      </details>

      <section className="stack" aria-labelledby="doctors-heading">
        <h2 className="title-2" id="doctors-heading">Doctors</h2>
        <ul className="list">
          {clinic.doctors.map((doctor) => <ListRow key={doctor.name} icon="user" label={doctor.name} value={<>{doctor.specialty}{doctor.npi && <> · NPI: {doctor.npi}</>}</>} />)}
        </ul>
        {!clinic.doctors.length && <p className="hint">No doctors listed yet. Call the clinic to ask.</p>}
      </section>

      <section className="stack" aria-labelledby="hours-heading">
        <h2 className="title-2" id="hours-heading">Hours</h2>
        <dl className="def-list panel clinic-hours">
          {groupHours(clinic.hours).map(({ days, text }) => <Fragment key={days}><dt>{days}</dt><dd>{text}</dd></Fragment>)}
        </dl>
      </section>
    </Screen>
  );
}
