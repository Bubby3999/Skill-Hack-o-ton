import { useRef, useState } from 'react';
import { Button, ListRow, Notice, Screen, Tag } from '../../components';
import { FEATURES } from '../../contracts';
import { listDrafts } from '../../lib/drafts';
import { useProfile } from '../../shell/ProfileProvider';
import { locationEditPath, needsEditPath } from '../../lib/returnTo';
import './profile.css';

export default function ProfileScreen() {
  const { profile, setProfile, resetDemo } = useProfile();
  const [editingLetter, setEditingLetter] = useState(false);
  const [letter, setLetter] = useState(profile.letter);
  const [status, setStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const drafts = listDrafts();
  const needs = [...profile.needs.filter((need) => need.priority === 'required'), ...profile.needs.filter((need) => need.priority === 'nice')];

  function closeLetterEditor() {
    setEditingLetter(false);
    requestAnimationFrame(() => document.getElementById('edit-letter-details')?.focus());
  }

  return (
    <Screen title="Profile">
      <div className="stack">
        <h1 className="title-1">Profile</h1>
        <Notice icon="lock">Saved on this phone only. Nothing leaves it unless you use Ask.</Notice>
      </div>

      <section className="stack" aria-labelledby="needs-h">
        <div className="section-head">
          <h2 className="title-2" id="needs-h">Access needs</h2>
          <Button variant="ghost" small icon="pencil" to={needsEditPath('/profile')}>Edit<span className="visually-hidden"> access needs</span></Button>
        </div>
        {needs.length ? (
          <ul className="list profile-needs-list">
            {needs.map((need) => <ListRow key={need.key} label={FEATURES[need.key].label} end={<Tag variant={need.priority}>{need.priority === 'required' ? 'Required' : 'Nice to have'}</Tag>} />)}
          </ul>
        ) : <p className="lead">No access needs selected. Add any you want clinics to meet.</p>}
      </section>

      <section className="stack" aria-labelledby="loc-h">
        <h2 className="title-2" id="loc-h">Location</h2>
        <ListRow icon="map-pin" label={profile.location.label} value={`Within ${profile.radius} mi`} to={locationEditPath('/profile')} />
      </section>

      <section className="stack" aria-labelledby="details-h">
        <div className="section-head">
          <h2 className="title-2" id="details-h">Details for letters</h2>
          {!editingLetter && <Button id="edit-letter-details" variant="ghost" small icon="pencil" onClick={() => {
            setLetter(profile.letter);
            setStatus('');
            setEditingLetter(true);
          }}>Edit<span className="visually-hidden"> details for letters</span></Button>}
        </div>
        {editingLetter ? (
          <form className="stack panel" aria-label="Details for letters" onSubmit={(event) => {
            event.preventDefault();
            setProfile({ ...profile, letter: { name: letter.name?.trim(), email: letter.email?.trim(), phone: letter.phone?.trim() } });
            setStatus('Letter details saved.');
            closeLetterEditor();
          }}>
            <p className="hint" id="letter-hint">All fields are optional. Used only in your request letters.</p>
            <div className="field">
              <label className="label" htmlFor="letter-name">Name <span className="label__optional">(optional)</span></label>
              <input className="input" id="letter-name" name="name" autoComplete="name" autoFocus aria-describedby="letter-hint" value={letter.name ?? ''} onChange={(event) => setLetter({ ...letter, name: event.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="letter-email">Email <span className="label__optional">(optional)</span></label>
              <input className="input" id="letter-email" name="email" type="email" autoComplete="email" value={letter.email ?? ''} onChange={(event) => setLetter({ ...letter, email: event.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="letter-phone">Phone <span className="label__optional">(optional)</span></label>
              <input className="input" id="letter-phone" name="phone" type="tel" autoComplete="tel" value={letter.phone ?? ''} onChange={(event) => setLetter({ ...letter, phone: event.target.value })} />
            </div>
            <div className="row">
              <Button type="submit">Save details</Button>
              <Button variant="secondary" onClick={closeLetterEditor}>Cancel</Button>
            </div>
          </form>
        ) : (
          <dl className="list profile-letter-details">
            <div className="list-row"><dt className="list-row__value">Name</dt><dd className="list-row__label">{profile.letter.name || 'Not added'}</dd></div>
            <div className="list-row"><dt className="list-row__value">Email</dt><dd className="list-row__label">{profile.letter.email || 'Not added'}</dd></div>
            <div className="list-row"><dt className="list-row__value">Phone</dt><dd className="list-row__label">{profile.letter.phone || 'Not added'}</dd></div>
          </dl>
        )}
        <p className={status ? 'hint' : 'visually-hidden'} role="status">{status}</p>
      </section>

      <section className="stack" aria-labelledby="letters-h">
        <h2 className="title-2" id="letters-h">Saved letters</h2>
        {drafts.length ? drafts.map((draft) => (
          <ListRow key={draft.clinicId} icon="file-text" label={draft.clinicName}
            value={draft.appointmentDate ? `Draft · visit on ${new Date(`${draft.appointmentDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Draft · No visit date yet'}
            to={`/clinic/${encodeURIComponent(draft.clinicId)}/letter`} />
        )) : <p className="lead">No saved letters yet. Request accommodations from a clinic to start one.</p>}
      </section>

      <section className="panel" aria-labelledby="demo-h">
        <h2 className="title-3" id="demo-h">Demo</h2>
        <Button id="reset-demo" variant="danger" block icon="rotate-ccw" onClick={() => {
          dialog.current?.showModal();
          dialog.current?.querySelector<HTMLButtonElement>('[value="cancel"]')?.focus();
        }}>Reset demo</Button>
        <p className="meta">Clears your letters and reports and restores the demo profile.</p>
      </section>

      <dialog ref={dialog} className="dialog" aria-labelledby="reset-h" aria-describedby="reset-d" onClose={() => document.getElementById('reset-demo')?.focus()}>
        <h2 className="title-2" id="reset-h">Reset the demo?</h2>
        <p className="lead" id="reset-d">Your needs, location, letters, and reports go back to the demo profile. This can't be undone.</p>
        <form method="dialog" className="dialog__actions">
          <Button variant="danger-solid" block onClick={() => {
            resetDemo();
            setEditingLetter(false);
            setStatus('Demo profile restored. Saved letters and reports cleared.');
            dialog.current?.close();
          }}>Reset demo</Button>
          <Button type="submit" variant="secondary" block value="cancel" autoFocus>Cancel</Button>
        </form>
      </dialog>
    </Screen>
  );
}
