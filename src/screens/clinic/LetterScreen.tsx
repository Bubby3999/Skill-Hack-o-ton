import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ActionBar, Icon, Notice, Screen, StatusLine } from '../../components';
import type { Clinic } from '../../contracts';
import { clinicById } from '../../data/clinics';
import { useProfile } from '../../shell/ProfileProvider';
import { ClinicNotFound } from './FeatureRow';
import { buildLetter } from './letter';
import { useLetterDraft } from './useLetterDraft';
import './clinic.css';

export default function LetterScreen() {
  const { id = '' } = useParams();
  const clinic = clinicById(id);
  return clinic ? <Letter key={clinic.id} clinic={clinic} /> : <ClinicNotFound />;
}

function Letter({ clinic }: { clinic: Clinic }) {
  const { profile } = useProfile();
  const { draft, saved } = useLetterDraft(clinic, profile);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const letter = buildLetter(draft, clinic);
  const email = `mailto:?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.text)}`;

  async function copy(fallback = false) {
    setFeedback('');
    setActionError('');
    try {
      await navigator.clipboard.writeText(letter.text);
      setFeedback(fallback ? 'Sharing is unavailable. Letter copied.' : 'Letter copied.');
    } catch {
      setActionError('Could not copy. Select the letter text to copy it, or use Email or Print / PDF.');
    }
  }

  async function share() {
    setFeedback('');
    setActionError('');
    if (!navigator.share) return copy(true);
    try {
      await navigator.share({ title: letter.subject, text: letter.text });
      setFeedback('Letter shared.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      await copy(true);
    }
  }

  return (
    <Screen
      title={`Your letter · ${clinic.name}`}
      back={{ to: `/clinic/${clinic.id}/request`, label: 'Edit request' }}
      barEnd={saved === true ? <StatusLine>Draft saved</StatusLine> : undefined}
      dock={
        <ActionBar>
          <div className="action-grid" role="group" aria-label="Send or save the letter">
            <button type="button" className="action" onClick={() => void copy()}><Icon name="copy" size="lg" />Copy</button>
            <button type="button" className="action" onClick={() => void share()}><Icon name="share" size="lg" />Share</button>
            <a className="action" href={email}><Icon name="mail" size="lg" />Email</a>
            <button type="button" className="action" onClick={() => window.print()}><Icon name="printer" size="lg" />Print / PDF</button>
          </div>
          <p className="hint" role="status">{feedback}</p>
          {actionError && <p className="error" role="alert">{actionError}</p>}
        </ActionBar>
      }
    >
      <div className="stack">
        <h1 className="title-1">Your letter</h1>
        <Notice>A template to help you ask. <strong>Not legal advice.</strong></Notice>
      </div>
      {saved === false && <Notice error>Couldn't save this draft on your device. Copy or download it before leaving.</Notice>}

      <article className="letter clinic-letter" aria-label={`Letter to ${draft.clinicName}`}>
        <p>{letter.date}</p>
        <p>{letter.recipient}</p>
        <p><strong>Re: {letter.subject}</strong></p>
        <p>{letter.greeting}</p>
        <p>{letter.introduction}</p>
        {letter.requests.length > 0 && <ul>{letter.requests.map((request) => <li key={request}>{request}</li>)}</ul>}
        {letter.notes && <p>{letter.notes}</p>}
        <p>{letter.rights}</p>
        <p>{letter.confirmation}</p>
        <p>{letter.signature}</p>
        <p className="small">Not legal advice.</p>
      </article>
    </Screen>
  );
}
