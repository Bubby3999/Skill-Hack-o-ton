import { useParams } from 'react-router-dom';
import { Placeholder } from '../../shell/Placeholders';

// Worker B replaces this file (screen 09).
export default function RequestFormScreen() {
  const { id = '' } = useParams();
  return (
    <Placeholder
      title="Request accommodations"
      screen="09"
      worker="Worker B"
      back={{ to: `/clinic/${id}`, label: 'Clinic' }}
      links={[{ to: `/clinic/${id}/letter`, label: 'Preview letter (10)' }]}
    />
  );
}
