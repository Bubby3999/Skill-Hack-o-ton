// Canonical access-feature list (design/BRIEF.md). 19 keys, 4 categories.
export type Category = 'mobility' | 'communication' | 'sensory' | 'other';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'mobility', label: 'Mobility' },
  { id: 'communication', label: 'Communication' },
  { id: 'sensory', label: 'Sensory & cognitive' },
  { id: 'other', label: 'Other' },
];

export const FEATURES = {
  'exam-table': { label: 'Height-adjustable exam table', short: 'Adjustable table', category: 'mobility' },
  scale: { label: 'Wheelchair-accessible scale', short: 'Wheelchair scale', category: 'mobility' },
  lift: { label: 'Patient lift or lift-compatible space', short: 'Patient lift', category: 'mobility' },
  mammography: { label: 'Accessible mammography', short: 'Accessible mammogram', category: 'mobility' },
  entrance: { label: 'Accessible entrance and parking', short: 'Step-free entrance', category: 'mobility' },
  restroom: { label: 'Accessible restroom', short: 'Accessible restroom', category: 'mobility' },
  'turning-space': { label: 'Wheelchair turning space in exam rooms', short: 'Turning space', category: 'mobility' },
  asl: { label: 'In-person ASL interpreter', short: 'ASL interpreter', category: 'communication' },
  vri: { label: 'Video remote interpreting (VRI)', short: 'Video interpreter', category: 'communication' },
  cart: { label: 'CART / live captioning', short: 'Live captions', category: 'communication' },
  tactile: { label: 'Tactile interpreter (DeafBlind)', short: 'Tactile interpreter', category: 'communication' },
  braille: { label: 'Braille or large-print materials', short: 'Braille / large print', category: 'communication' },
  'plain-language': { label: 'Plain-language materials', short: 'Plain language', category: 'communication' },
  'quiet-room': { label: 'Quiet or sensory-friendly room', short: 'Quiet room', category: 'sensory' },
  lighting: { label: 'Adjustable lighting', short: 'Adjustable lighting', category: 'sensory' },
  'extended-time': { label: 'Extended appointment time', short: 'Extra time', category: 'sensory' },
  'minimal-wait': { label: 'Minimal-wait scheduling', short: 'Minimal wait', category: 'sensory' },
  'service-animal': { label: 'Service animals welcome', short: 'Service animals', category: 'other' },
  telehealth: { label: 'Telehealth option', short: 'Telehealth', category: 'other' },
} as const satisfies Record<string, { label: string; short: string; category: Category }>;

export type FeatureKey = keyof typeof FEATURES;
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];
export const isFeatureKey = (k: unknown): k is FeatureKey =>
  typeof k === 'string' && Object.prototype.hasOwnProperty.call(FEATURES, k);

export type FeatureStatus = 'verified' | 'patient-reported' | 'unknown' | 'not-available';
export const FEATURE_STATUSES: FeatureStatus[] = ['verified', 'patient-reported', 'unknown', 'not-available'];

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  verified: 'Verified',
  'patient-reported': 'Patient-reported',
  unknown: 'Unknown',
  'not-available': 'Not available',
};
