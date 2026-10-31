import { useNavigate } from 'react-router-dom';
import { ActionBar, Button, Icon, Screen } from '../components';
import { saveOnboarding } from '../lib/onboarding';
import { SkipSetup } from './Setup';

const STEPS = [
  ['Set your access needs', 'Equipment, interpreters, quiet rooms, and more.'],
  ['See how each clinic fits', "What they have, what's missing, what's unknown."],
  ['Request accommodations', 'A ready-to-send letter in a few taps.'],
];

// Screen 01.
export default function Welcome() {
  const navigate = useNavigate();
  return (
    <Screen title="Welcome" noNav dock={
      <ActionBar>
        <Button block onClick={() => {
          saveOnboarding('needs');
          navigate('/welcome/needs');
        }}>Get started</Button>
        <SkipSetup block>Skip for now</SkipSetup>
      </ActionBar>
    }>
      {/* Product preview built from real components. Decorative, so hidden from screen readers. */}
      <div className="clinic-card" aria-hidden="true">
        <div className="clinic-card__head">
          <span className="rank">1</span>
          <p className="clinic-card__title">Lakeshore Women's Health</p>
          <span className="clinic-card__distance">4.8 mi</span>
        </div>
        <div className="fit">
          <span className="fit-badge fit-badge--strong"><Icon name="circle-check" />Strong fit</span>
          <span className="fit__count">5 of 6 needs</span>
        </div>
        <div className="fit-meter">
          <span className="seg seg--has" /><span className="seg seg--has" /><span className="seg seg--has" />
          <span className="seg seg--unknown seg--split" /><span className="seg seg--has" /><span className="seg seg--has" />
        </div>
        <div className="reasons">
          <p className="reason reason--has"><Icon name="circle-check" /><span><span className="reason__label">Has:</span> Wheelchair scale, Adjustable table, Step-free entrance</span></p>
        </div>
      </div>

      <div className="stack">
        <h1 className="title-display">Find a doctor who can actually examine you.</h1>
        <p className="lead">Tell CareFit what you need at a visit. See which clinics have it, and ask for it in writing.</p>
      </div>

      <ol className="feature-steps">
        {STEPS.map(([title, text], i) => (
          <li className="feature-step" key={title}>
            <span className="feature-step__num" aria-hidden="true">{i + 1}</span>
            <div><p className="strong">{title}</p><p className="meta">{text}</p></div>
          </li>
        ))}
      </ol>

      <p className="status-line"><Icon name="lock" />Your profile stays on this phone.</p>
    </Screen>
  );
}
