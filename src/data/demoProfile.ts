import type { Profile } from '../contracts';

// Maya (design/BRIEF.md). 94612 centroid: Census 2023 ZCTA Gazetteer.
export const DEMO_PROFILE: Profile = {
  needs: [
    { key: 'scale', priority: 'required' },
    { key: 'exam-table', priority: 'required' },
    { key: 'entrance', priority: 'required' },
    { key: 'lift', priority: 'nice' },
    { key: 'restroom', priority: 'nice' },
    { key: 'extended-time', priority: 'nice' },
  ],
  location: { source: 'zip', zip: '94612', lat: 37.807709, lng: -122.266857, label: 'ZIP 94612' },
  radius: 15,
  letter: { name: 'Maya Johnson', email: 'maya.j@example.com', phone: '(510) 555-0199' },
};
