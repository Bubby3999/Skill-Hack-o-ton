import { Placeholder } from '../../shell/Placeholders';

// Worker C replaces this file (screen 06).
export default function MapScreen() {
  return <Placeholder title="Results map" screen="06" worker="Worker C" back={{ to: '/find', label: 'Find' }} links={[{ to: '/results', label: 'List view (05)' }]} />;
}
