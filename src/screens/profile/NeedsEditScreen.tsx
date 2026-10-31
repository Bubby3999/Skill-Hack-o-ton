import { Placeholder } from '../../shell/Placeholders';
import { useReturnTo } from '../../lib/returnTo';

// Worker A replaces this file (screen 02 as an edit screen: Back and Save return to ?from=).
export default function NeedsEditScreen() {
  const from = useReturnTo('/profile');
  return <Placeholder title="Access needs" screen="02" worker="Worker A" back={{ to: from, label: 'Back' }} />;
}
