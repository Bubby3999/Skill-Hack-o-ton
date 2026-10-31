import { useParams } from 'react-router-dom';
import { Placeholder } from '../../shell/Placeholders';

// Worker B replaces this file (screen 10).
export default function LetterScreen() {
  const { id = '' } = useParams();
  return <Placeholder title="Letter preview" screen="10" worker="Worker B" back={{ to: `/clinic/${id}/request`, label: 'Edit request' }} />;
}
