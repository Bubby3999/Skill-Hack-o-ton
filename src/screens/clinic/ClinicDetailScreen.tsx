import { useParams } from 'react-router-dom';
import { Placeholder } from '../../shell/Placeholders';
import { clinicById } from '../../data/clinics';

// Worker B replaces this file (screen 08).
export default function ClinicDetailScreen() {
  const { id = '' } = useParams();
  const clinic = clinicById(id);
  return (
    <Placeholder
      title={clinic?.name ?? 'Clinic not found'}
      screen="08"
      worker="Worker B"
      back={{ to: '/results', label: 'Results' }}
      links={clinic ? [{ to: `/clinic/${id}/request`, label: 'Request accommodations (09)' }] : []}
    />
  );
}
