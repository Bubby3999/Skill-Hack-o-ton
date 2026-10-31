import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Chip, Tag } from '../../components/Chip';
import { FitBadge } from '../../components/Fit';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';
import { Screen } from '../../components/Screen';
import { CHAT_LIMITS, FEATURES } from '../../contracts';
import type { ChatMessage, ChatResponse, Profile } from '../../contracts';
import { CLINICS } from '../../data/clinics';
import { applyAssistantFilters, defaultFilters, filtersToQuery } from '../../lib/filters';
import { searchClinics } from '../../lib/match';
import { useProfile } from '../../shell/ProfileProvider';
import { ChatClientError, sendChat } from './client';
import './ask.css';

interface Entry extends ChatMessage {
  response?: ChatResponse;
  error?: boolean;
}

// Keep the conversation when returning from a clinic, only for this page session.
let savedEntries: Entry[] = [];

const SUGGESTIONS = ["Which of these have a patient lift?", "Is Lakeshore's scale verified?"];

function SearchReply({ response, profile }: { response: ChatResponse; profile: Profile }) {
  if (!response.filters) return null;
  const merged = applyAssistantFilters(defaultFilters(profile), response.filters);
  const requestedNeeds = response.filters.needs ?? [];
  const profileCount = merged.needs.filter((need) => !requestedNeeds.some((n) => n.key === need.key)).length;
  const matches = searchClinics(merged, CLINICS).items
    .filter(({ match }) => match.tier === 'strong' || match.tier === 'possible')
    .slice(0, 3);

  return (
    <>
      <ul className="chip-row" aria-label="Filters applied">
        {merged.care ? <Tag as="li" variant="filter">{merged.care}</Tag> : null}
        <Tag as="li" variant="filter">Within {merged.radius} mi</Tag>
        {requestedNeeds.map((need) => (
          <Tag as="li" variant="filter" key={need.key}>
            {FEATURES[need.key].short} · {need.priority === 'required' ? 'required' : 'nice to have'}
          </Tag>
        ))}
        {profileCount ? <Tag as="li" variant="filter">+ {profileCount} {profileCount === 1 ? 'need' : 'needs'} from your profile</Tag> : null}
      </ul>
      {matches.length ? (
        <>
          <p><strong>Top {matches.length} {matches.length === 1 ? 'match' : 'matches'}</strong> for your access needs:</p>
          <ul className="mini-results" aria-label="Top clinic matches">
            {matches.map(({ clinic, match }) => (
              <li key={clinic.id}>
                <Link className="mini-result" to={`/clinic/${clinic.id}`}>
                  <span className="mini-result__name">{clinic.name}</span>
                  <span className="meta">{match.distance.toFixed(1)} mi</span>
                  <FitBadge match={match} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : <p>No Strong or Possible fits for these filters. Change the filters to explore other options.</p>}
      <div className="row">
        <Button to={`/results?${filtersToQuery(merged)}`} variant="secondary" small>See results</Button>
        <Button to="/find" variant="ghost" small>Change filters</Button>
      </div>
    </>
  );
}

export default function AskScreen() {
  const { profile } = useProfile();
  const [entries, setEntries] = useState<Entry[]>(() => savedEntries);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const newest = useRef<HTMLDivElement>(null);

  useEffect(() => {
    savedEntries = entries;
    if (entries.length) newest.current?.scrollIntoView({ block: 'end' });
  }, [entries, pending]);

  useEffect(() => () => controller.current?.abort(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || controller.current) return;
    const next: Entry[] = [...entries, { role: 'user', content }];
    const abort = new AbortController();
    controller.current = abort;
    setEntries(next);
    setDraft('');
    setPending(true);
    try {
      const response = await sendChat(profile, next.filter((entry) => !entry.error), abort.signal);
      if (!abort.signal.aborted) setEntries([...next, { role: 'assistant', content: response.reply, response }]);
    } catch (error) {
      if (!abort.signal.aborted) {
        const content = error instanceof ChatClientError ? error.message : 'CareFit could not connect. Try again or use manual filters.';
        setEntries([...next, { role: 'assistant', content, error: true }]);
      }
    } finally {
      if (!abort.signal.aborted) setPending(false);
      controller.current = null;
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <Screen title="Ask" dock={
      <form className="composer ask-composer" onSubmit={submit} aria-label="Message CareFit">
        <label className="visually-hidden" htmlFor="ask-message">Message CareFit</label>
        <textarea className="textarea" id="ask-message" name="message" rows={1}
          placeholder="Ask about clinics or access needs" maxLength={CHAT_LIMITS.messageChars}
          value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button type="submit" className="send-btn" aria-label="Send" disabled={pending || !draft.trim()}>
          <Icon name="send" />
        </button>
      </form>
    }>
      <div className="stack">
        <h1 className="title-1">Ask CareFit</h1>
        <Notice icon="shield-check">
          Your messages, access needs, and ZIP code go to CareFit's demo server, where a local AI model runs the search. They aren't sent to an AI company. <strong>Your name and contact details are not sent.</strong> No medical advice.
        </Notice>
      </div>
      <section className="chat-log ask-chat" role="log" aria-live="polite" aria-relevant="additions" aria-labelledby="ask-conversation">
        <h2 className="visually-hidden" id="ask-conversation">Conversation</h2>
        <div className="bubble bubble--bot">
          <p className="bubble__who">CareFit</p>
          <p>Tell me what kind of care you need and what matters at your visit. I'll turn it into a search.</p>
          <p className="meta">Try “OB-GYN within 15 miles who can weigh me seated”.</p>
        </div>
        {entries.map((entry, index) => (
          <div key={index} className={`bubble bubble--${entry.role === 'user' ? 'user' : 'bot'}${entry.error ? ' bubble--error' : ''}`}>
            <p className={entry.role === 'user' ? 'visually-hidden' : 'bubble__who'}>{entry.role === 'user' ? 'You:' : 'CareFit'}</p>
            <p className="ask-reply">{entry.content}</p>
            {entry.error ? <Button to="/find" variant="secondary" small>Use manual filters</Button> : null}
            {entry.response ? <SearchReply response={entry.response} profile={profile} /> : null}
          </div>
        ))}
        {pending ? (
          <div className="bubble bubble--bot">
            <p className="bubble__who">CareFit</p>
            <p>Searching clinics… A cold start can take 30 seconds or longer.</p>
          </div>
        ) : null}
        <div ref={newest} />
      </section>
      <div className="chip-row ask-suggestions" role="group" aria-label="Suggested questions">
        {SUGGESTIONS.map((question) => <Chip key={question} disabled={pending} onClick={() => void send(question)}>{question}</Chip>)}
      </div>
    </Screen>
  );
}
