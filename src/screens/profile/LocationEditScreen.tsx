import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionBar, Button, Icon, Notice, Screen } from '../../components';
import { RADII } from '../../contracts';
import type { Radius } from '../../contracts';
import { getPosition } from '../../lib/geo';
import { loadOnboarding, saveOnboarding } from '../../lib/onboarding';
import { useReturnTo } from '../../lib/returnTo';
import { lookupZip } from '../../lib/zips';
import { useProfile } from '../../shell/ProfileProvider';
import { SetupProgress, SkipSetup } from '../../shell/Setup';

const POSITION_ERRORS = {
  denied: 'Location permission was denied. Enter a ZIP code instead.',
  unavailable: 'Your current location is unavailable. Enter a ZIP code instead.',
  timeout: 'Finding your location took too long. Enter a ZIP code instead, or try again.',
  unsupported: 'This browser cannot use your current location. Enter a ZIP code instead.',
};

/** Screen 03. `setup`: onboarding step 2 (starts blank, Save writes the new profile); otherwise the profile editor. */
export default function LocationEditScreen({ setup = false }: { setup?: boolean }) {
  const { profile, setProfile } = useProfile();
  const [location, setLocation] = useState(profile.location);
  const [useGps, setUseGps] = useState(!setup && profile.location.source === 'gps');
  const [zip, setZip] = useState(setup ? '' : profile.location.zip ?? '');
  const [radius, setRadius] = useState<Radius>(profile.radius);
  const [busy, setBusy] = useState(false);
  const [positionMessage, setPositionMessage] = useState('');
  const [zipError, setZipError] = useState('');
  const zipInput = useRef<HTMLInputElement>(null);
  const from = useReturnTo('/profile');
  const navigate = useNavigate();

  async function locate() {
    setBusy(true);
    setZipError('');
    setPositionMessage('Finding your current location…');
    try {
      const result = await getPosition();
      if (result.ok) {
        setLocation({ source: 'gps', label: 'Current location', lat: result.lat, lng: result.lng });
        setUseGps(true);
        setZip('');
        setPositionMessage('Current location found. Save to use it, or enter a ZIP code instead.');
      } else {
        setUseGps(false);
        setPositionMessage(POSITION_ERRORS[result.reason]);
        zipInput.current?.focus();
      }
    } catch {
      setUseGps(false);
      setPositionMessage(POSITION_ERRORS.unavailable);
      zipInput.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title={setup ? 'Your location · Setup step 2 of 2' : 'Location'}
      back={{ to: setup ? '/welcome/needs' : from, label: 'Back' }}
      barEnd={setup ? <SkipSetup /> : undefined}
      noNav dock={
        <ActionBar><Button type="submit" form="location-form" block disabled={busy}>{setup ? 'Show clinics near me' : 'Save'}</Button></ActionBar>
      }>
      {setup ? <SetupProgress step={2} /> : null}
      <div className="stack">
        <h1 className="title-1">Where should we look?</h1>
        <p className="lead">Used only to measure distance to clinics. It stays on this phone.</p>
      </div>

      <form id="location-form" className="stack stack--lg" noValidate onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        let nextLocation = location;
        if (!useGps) {
          const result = lookupZip(zip);
          if (!result.ok) {
            setZipError(result.message);
            zipInput.current?.focus();
            return;
          }
          nextLocation = { source: 'zip', zip: result.zip, label: result.label, lat: result.lat, lng: result.lng };
        }
        if (setup) {
          // A fresh profile: the needs from step 1, no demo name or contact details.
          setProfile({ needs: loadOnboarding()?.needs ?? [], location: nextLocation, radius, letter: {} });
          saveOnboarding('done');
          navigate('/find');
          return;
        }
        setProfile({ ...profile, location: nextLocation, radius });
        navigate(from);
      }}>
        <div className="stack">
          <Button variant="secondary" block icon="locate" disabled={busy} onClick={locate}>
            {busy ? 'Finding your location…' : 'Use my current location'}
          </Button>
          <p className="hint">Your phone will ask for permission first.</p>
          <p className={positionMessage || useGps ? 'hint' : 'visually-hidden'} role="status">{positionMessage || (useGps ? 'Using your saved current location. Enter a ZIP code to change it.' : '')}</p>
        </div>

        <p className="divider-text">or</p>

        <div className="field">
          <label className="label" htmlFor="zip">ZIP code</label>
          <input ref={zipInput} className="input" id="zip" name="zip" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={5}
            value={zip} readOnly={busy} aria-invalid={!!zipError} aria-describedby={zipError ? 'zip-hint zip-error' : 'zip-hint'} onChange={(event) => {
              setZip(event.target.value);
              setUseGps(false);
              setZipError('');
              setPositionMessage('');
            }} />
          <p className="hint" id="zip-hint">5 digits, e.g. 94612</p>
          {zipError && <p className="error" id="zip-error" role="alert"><Icon name="triangle-alert" />{zipError}</p>}
        </div>

        <fieldset className="stack">
          <legend className="legend">How far can you travel?</legend>
          <div className="segmented segmented--grid">
            {RADII.map((value) => (
              <label className="segmented__opt" key={value}>
                <input type="radio" name="radius" value={value} checked={radius === value} onChange={() => setRadius(value)} />
                <span><Icon name="check" />{value} mi</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Notice>Your name and contact details are only needed for request letters. We'll ask when you write one.</Notice>
      </form>
    </Screen>
  );
}
