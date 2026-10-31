import { Placeholder } from '../../shell/Placeholders';
import { locationEditPath } from '../../lib/returnTo';

// Worker C replaces this file (screen 04).
export default function FindScreen() {
  return (
    <Placeholder
      title="Find a clinic that fits"
      screen="04"
      worker="Worker C"
      links={[
        { to: '/results', label: 'Show matches (05)' },
        { to: locationEditPath('/find'), label: 'Change location (03)' },
      ]}
    />
  );
}
