import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components';
import { saveOnboarding } from '../lib/onboarding';

/** "Step 1 of 2" plus a bar. The bar is decorative: the text says the same. */
export function SetupProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="progress">
      <p className="meta">Step {step} of 2</p>
      <div className="progress__bar" aria-hidden="true"><span style={{ '--value': `${step * 50}%` } as CSSProperties} /></div>
    </div>
  );
}

/** Ends setup and keeps the current (demo) profile. */
export function SkipSetup({ children = 'Skip setup', block }: { children?: string; block?: boolean }) {
  const navigate = useNavigate();
  return (
    <Button variant="ghost" small={!block} block={block} onClick={() => {
      saveOnboarding('skipped');
      navigate('/find');
    }}>{children}</Button>
  );
}
