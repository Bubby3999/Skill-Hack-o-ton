// Every MVP route (screens 01-12). Shared: read-only for workers.
export const SAMPLE_CLINIC = 'lakeshore-womens-health';

export const ROUTES = [
  '/welcome',
  '/find',
  '/results',
  '/results/map',
  `/clinic/${SAMPLE_CLINIC}`,
  `/clinic/${SAMPLE_CLINIC}/request`,
  `/clinic/${SAMPLE_CLINIC}/letter`,
  '/ask',
  '/profile',
  '/profile/needs?from=%2Fprofile',
  '/profile/location?from=%2Ffind',
];
