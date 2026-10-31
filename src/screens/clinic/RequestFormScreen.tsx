import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ActionBar, Button, Icon, Notice, Screen, StatusLine } from '../../components';
import { STATUS_LABEL } from '../../contracts';
import type { Clinic, LetterDraft } from '../../contracts';
import { clinicById } from '../../data/clinics';
import { matchClinic } from '../../lib/match';
import { needsEditPath } from '../../lib/returnTo';
import { useProfile } from '../../shell/ProfileProvider';
import { ClinicNotFound } from './FeatureRow';
import { requestLabel, validateDraft } from './letter';
import { useLetterDraft } from './useLetterDraft';
import './clinic.css';

export default function RequestFormScreen() {
  const { id = '' } = useParams();
  const clinic = clinicById(id);
  return clinic ? <RequestForm key={clinic.id} clinic={clinic} /> : <ClinicNotFound />;
}

function RequestForm({ clinic }: { clinic: Clinic }) {
  const { profile } = useProfile();
  const { draft, updateDraft, saved, persist } = useLetterDraft(clinic, profile);
  const [errors, setErrors] = useState<ReturnType<typeof validateDraft>>({});
  const errorSummary = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const match = matchClinic(profile.needs, clinic, profile.location);
  const choices = [...new Set([...match.perNeed.map((need) => need.key), ...draft.accommodations])];

  function update(patch: Partial<LetterDraft>) {
    updateDraft(patch);
    if (Object.keys(errors).length) setErrors(validateDraft({ ...draft, ...patch }));
  }

  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => errorSummary.current?.focus());
      return;
    }
    if (persist()) navigate(`/clinic/${clinic.id}/letter`);
  }

  return (
    <Screen
      title={`Request accommodations · ${clinic.name}`}
      back={{ to: `/clinic/${clinic.id}`, label: 'Clinic' }}
      barEnd={saved === true ? <StatusLine>Draft saved</StatusLine> : undefined}
      dock={<ActionBar><Button type="submit" form="request" block>Preview letter<Icon name="arrow-right" /></Button></ActionBar>}
    >
      <div className="stack">
        <h1 className="title-1">Request accommodations</h1>
        <p className="lead">We'll draft a letter to <strong>{clinic.name}</strong>. Your profile details are filled in and everything can be changed.</p>
      </div>
      {saved === false && <Notice error>Couldn't save the draft on this device. Your changes are still here. Try Preview letter again before leaving.</Notice>}

      <form id="request" className="stack stack--lg clinic-request" onSubmit={preview} noValidate>
        {Object.keys(errors).length > 0 && (
          <div className="notice notice--error error-summary" role="alert" tabIndex={-1} ref={errorSummary} aria-labelledby="errors-heading">
            <h2 className="title-3" id="errors-heading">Check these details</h2>
            <ul>{Object.entries(errors).map(([key, message]) => <li key={key}><a href={`#${key}`}>{message}</a></li>)}</ul>
          </div>
        )}
        <fieldset className="stack">
          <legend className="title-3">Visit</legend>
          <div className="field">
            <label className="label" htmlFor="clinic">Clinic</label>
            <input className="input" id="clinic" name="clinic" required value={draft.clinicName} onChange={(event) => update({ clinicName: event.target.value })} aria-invalid={!!errors.clinic} aria-describedby={errors.clinic ? 'clinic-error' : undefined} />
            {errors.clinic && <p className="error" id="clinic-error"><Icon name="circle-x" />{errors.clinic}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="date">Appointment date <span className="label__optional">(optional)</span></label>
            <input className="input" id="date" name="date" type="date" value={draft.appointmentDate} onChange={(event) => update({ appointmentDate: event.target.value })} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-error' : undefined} />
            {errors.date && <p className="error" id="date-error"><Icon name="circle-x" />{errors.date}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="doctor">Doctor <span className="label__optional">(optional)</span></label>
            <input className="input" id="doctor" name="doctor" list="clinic-doctors" value={draft.doctor} onChange={(event) => update({ doctor: event.target.value })} aria-describedby="doctor-hint" />
            <datalist id="clinic-doctors">{clinic.doctors.map((doctor) => <option key={doctor.name} value={doctor.name}>{doctor.specialty}</option>)}</datalist>
            <p className="hint" id="doctor-hint">Choose a clinic doctor, type another name, or leave blank if you're not sure.</p>
          </div>
        </fieldset>

        <fieldset aria-describedby="request-hint">
          <legend className="title-3">What to request</legend>
          <p className="hint" id="request-hint">Checked from your needs. Ones the clinic already has are unchecked. Change any of these.</p>
          <ul className="check-list">
            {choices.map((key) => (
              <li key={key}>
                <label className="check">
                  <input type="checkbox" name="accommodations" value={key} checked={draft.accommodations.includes(key)} onChange={(event) => update({ accommodations: event.target.checked ? [...draft.accommodations, key] : draft.accommodations.filter((feature) => feature !== key) })} />
                  <span className="check__text">{requestLabel(key)}<span className="small">{STATUS_LABEL[clinic.accessFeatures[key]?.status ?? 'unknown']} at this clinic</span></span>
                </label>
              </li>
            ))}
          </ul>
          {!choices.length && <p className="hint">No access needs selected. <Link to={needsEditPath(`/clinic/${clinic.id}/request`)}>Add your needs</Link> or describe your request below.</p>}
        </fieldset>

        <div className="field">
          <label className="label" htmlFor="notes">Anything else? <span className="label__optional">(optional)</span></label>
          <textarea className="textarea" id="notes" name="notes" value={draft.notes} onChange={(event) => update({ notes: event.target.value })} />
        </div>

        <fieldset className="stack">
          <legend className="title-3">Your details</legend>
          <p className="hint">Only used in this letter. Saved on this device.</p>
          <div className="field">
            <label className="label" htmlFor="name">Your name <span className="label__optional">(optional)</span></label>
            <input className="input" id="name" name="name" autoComplete="name" value={draft.sender.name ?? ''} onChange={(event) => update({ sender: { ...draft.sender, name: event.target.value } })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="email">Email for replies <span className="label__optional">(optional)</span></label>
            <input className="input" id="email" name="email" type="email" autoComplete="email" value={draft.sender.email ?? ''} onChange={(event) => update({ sender: { ...draft.sender, email: event.target.value } })} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
            {errors.email && <p className="error" id="email-error"><Icon name="circle-x" />{errors.email}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="phone">Phone <span className="label__optional">(optional)</span></label>
            <input className="input" id="phone" name="phone" type="tel" autoComplete="tel" value={draft.sender.phone ?? ''} onChange={(event) => update({ sender: { ...draft.sender, phone: event.target.value } })} />
          </div>
        </fieldset>
      </form>
    </Screen>
  );
}
