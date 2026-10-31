import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Chip, Icon, Notice, Screen, Tag } from '../../components';
import { FEATURES } from '../../contracts';
import { defaultFilters } from '../../lib/filters';
import { locationEditPath, needsEditPath } from '../../lib/returnTo';
import { useProfile } from '../../shell/ProfileProvider';
import { CARE_CHIPS, careLabel, isLocationSet, placeText, resultsQuery } from './searchView';
import './find.css';

// Screen 04.
export default function FindScreen() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [care, setCare] = useState('OB-GYN'); // the mockup's starting value
  const hasLocation = isLocationSet(profile.location);
  const required = profile.needs.filter((n) => n.priority === 'required');
  const nice = profile.needs.filter((n) => n.priority === 'nice');
  const names = (list: typeof required) => list.map((n) => FEATURES[n.key].short).join(', ');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (hasLocation) navigate(`/results?${resultsQuery(defaultFilters(profile, care.trim()))}`);
  };

  return (
    <Screen title="Find a clinic that fits">
      <div className="stack stack--sm">
        <h1 className="title-1">Find a clinic that fits</h1>
        {hasLocation ? (
          <p className="row meta">
            <Icon name="map-pin" size="sm" />
            <span>Near <strong>{placeText(profile.location)}</strong> · within <strong>{profile.radius} mi</strong></span>
            <Link to={locationEditPath('/find')}>Change<span className="visually-hidden"> location</span></Link>
          </p>
        ) : (
          <Notice icon="map-pin">
            Add your location to see clinics near you. <Link to={locationEditPath('/find')}>Set location</Link>
          </Notice>
        )}
      </div>

      <form className="stack stack--lg" onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="care">Type of care</label>
          <input
            className="input" id="care" name="care" type="search" value={care} autoComplete="off"
            placeholder="e.g. primary care, OB-GYN" onChange={(e) => setCare(e.target.value)}
          />
          <div className="chip-row" role="group" aria-label="Popular types of care">
            {CARE_CHIPS.map((c) => (
              <Chip key={c} pressed={careLabel(care) === c} onClick={() => setCare(c)}>{c}</Chip>
            ))}
          </div>
        </div>

        <section className="panel" aria-labelledby="needs-h">
          <div className="section-head">
            <h2 className="title-3" id="needs-h">Your needs</h2>
            <Button variant="ghost" small icon="pencil" to="/profile">Edit<span className="visually-hidden"> your needs</span></Button>
          </div>
          {profile.needs.length ? (
            <ul className="need-summary">
              {required.length ? <li><Tag variant="required">Required</Tag>{names(required)}</li> : null}
              {nice.length ? <li><Tag variant="nice">Nice to have</Tag>{names(nice)}</li> : null}
            </ul>
          ) : (
            <p className="meta">No needs added yet. <Link to={needsEditPath('/find')}>Add your needs</Link> to see how clinics fit.</p>
          )}
        </section>

        <Button type="submit" block icon="search" disabled={!hasLocation}>Show matches</Button>
      </form>

      <section className="panel panel--brand" aria-labelledby="ask-h">
        <p className="eyebrow">Ask CareFit</p>
        <h2 className="title-3" id="ask-h">Search in your own words</h2>
        <p className="quote">“OB-GYN within 15 miles who can weigh me seated”</p>
        <Button variant="secondary" icon="message-circle" to="/ask">Ask a question</Button>
      </section>
    </Screen>
  );
}
