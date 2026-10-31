import { Placeholder } from '../../shell/Placeholders';
import { useProfile } from '../../shell/ProfileProvider';
import { locationEditPath, needsEditPath } from '../../lib/returnTo';

// Worker A replaces this file (screen 12).
export default function ProfileScreen() {
  const { profile } = useProfile();
  return (
    <Placeholder
      title="Profile"
      screen="12"
      worker="Worker A"
      links={[
        { to: needsEditPath('/profile'), label: 'Edit access needs (02)' },
        { to: locationEditPath('/profile'), label: 'Edit location (03)' },
      ]}
    >
      <p>{profile.letter.name} · {profile.needs.length} needs · {profile.location.label} · {profile.radius} mi</p>
    </Placeholder>
  );
}
