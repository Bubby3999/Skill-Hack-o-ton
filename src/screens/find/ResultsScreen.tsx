import { Placeholder } from '../../shell/Placeholders';

// Worker C replaces this file (screens 05 list and 07 empty state).
export default function ResultsScreen() {
  return (
    <Placeholder
      title="Results"
      screen="05 / 07"
      worker="Worker C"
      back={{ to: '/find', label: 'Find' }}
      links={[
        { to: '/results/map', label: 'Map view (06)' },
        { to: '/clinic/lakeshore-womens-health', label: 'Open a clinic (08)' },
      ]}
    />
  );
}
