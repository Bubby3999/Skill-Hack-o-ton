import { Placeholder } from '../../shell/Placeholders';
import { useReturnTo } from '../../lib/returnTo';

// Worker A replaces this file (screen 03 as an edit screen: Back and Save return to ?from=).
export default function LocationEditScreen() {
  const from = useReturnTo('/profile');
  return <Placeholder title="Location" screen="03" worker="Worker A" back={{ to: from, label: 'Back' }} />;
}
