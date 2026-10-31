import { Placeholder } from './Placeholders';

// Screen 01. Onboarding is deferred: this stays a placeholder.
export default function Welcome() {
  return <Placeholder title="Welcome" screen="01" worker="onboarding is deferred" nav={false} links={[{ to: '/find', label: 'Continue with the demo profile' }]} />;
}
