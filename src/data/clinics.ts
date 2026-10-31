import type { Clinic, FeatureInfo, Hours } from '../contracts';

// Fictional clinics (isDemo). Coordinates are hand-placed from the 94612 centroid so the distances
// match the mockups. Names, doctors and equipment claims are invented; streets are real Oakland streets.
const CALL = 'Clinic phone call';
const SITE = 'Site visit';
const WEB = 'Clinic website';
const reports = (n: number) => `${n} patient report${n === 1 ? '' : 's'}`;

const V = (lastVerified: string, source: string): FeatureInfo => ({ status: 'verified', lastVerified, source });
const P = (lastVerified: string, n: number): FeatureInfo => ({ status: 'patient-reported', lastVerified, source: reports(n) });
const N = (lastVerified: string, source: string): FeatureInfo => ({ status: 'not-available', lastVerified, source });

const hrs = (weekday: [string, string], sat?: [string, string], sun?: [string, string]): Hours => ({
  mon: weekday, tue: weekday, wed: weekday, thu: weekday, fri: weekday,
  ...(sat && { sat }), ...(sun && { sun }),
});
const ALWAYS: [string, string] = ['00:00', '24:00'];
const allWeek = (h: [string, string]): Hours => hrs(h, h, h);

type Base = Omit<Clinic, 'isDemo'>;
const demo = (c: Base): Clinic => ({ ...c, isDemo: true });

export const CLINICS: Clinic[] = [
  // ---- OB-GYN: the four results on screens 05/06/08/11 (distances from ZIP 94612) ----
  demo({
    id: 'lakeshore-womens-health', name: "Lakeshore Women's Health", type: 'clinic', specialties: ['OB-GYN'],
    address: '1420 Harbor View Ave, Suite 200, Oakland, CA 94610', lat: 37.86091, lng: -122.2103, // 4.8 mi
    phone: '(510) 555-0142', website: 'https://lakeshore.example.org',
    hours: hrs(['08:00', '18:00'], ['09:00', '13:00']),
    doctors: [
      { name: 'Dr. Ana Reyes', specialty: 'OB-GYN' },
      { name: 'Dr. Priya Natarajan', specialty: 'OB-GYN, high-risk pregnancy' },
      { name: 'Jordan Lee, CNM', specialty: 'Nurse-midwife' },
    ],
    accessFeatures: {
      scale: V('2026-09-18', CALL), 'exam-table': V('2026-09-18', CALL), entrance: V('2026-08-30', SITE),
      restroom: V('2026-08-30', SITE), 'extended-time': P('2026-10-02', 2),
      vri: V('2026-09-18', CALL), asl: N('2026-07-12', WEB), 'quiet-room': P('2026-09-03', 1), 'service-animal': V('2026-07-12', WEB),
    },
  }),
  demo({
    id: 'fruitvale-obgyn-associates', name: 'Fruitvale OB-GYN Associates', type: 'clinic', specialties: ['OB-GYN'],
    address: '2735 International Blvd, Suite 110, Oakland, CA 94601', lat: 37.80098, lng: -122.2486, // 1.1 mi
    phone: '(510) 555-0117', website: 'https://fruitvale-obgyn.example.org',
    hours: hrs(['08:30', '17:00']),
    doctors: [{ name: 'Dr. Marisol Vega', specialty: 'OB-GYN' }, { name: 'Dr. Daniel Okafor', specialty: 'OB-GYN' }],
    accessFeatures: {
      scale: V('2026-08-14', CALL), entrance: V('2026-08-14', SITE), lift: N('2026-08-14', CALL),
      restroom: V('2026-08-14', SITE), 'extended-time': V('2026-08-14', CALL),
      asl: V('2026-06-22', CALL), 'plain-language': V('2026-06-22', WEB),
    },
  }),
  demo({
    id: 'bayview-medical-center', name: 'Bayview Medical Center', type: 'hospital', specialties: ['OB-GYN', 'Primary care', 'Imaging'],
    address: '9800 Edes Ave, Oakland, CA 94603', lat: 37.70867, lng: -122.19459, // 7.9 mi
    phone: '(510) 555-0108', website: 'https://bayview-medical.example.org',
    hours: allWeek(ALWAYS),
    doctors: [{ name: 'Dr. Helen Park', specialty: 'OB-GYN' }, { name: 'Dr. Samir Rahman', specialty: 'Family medicine' }],
    accessFeatures: {
      scale: V('2026-07-30', CALL), entrance: V('2026-07-30', SITE), restroom: V('2026-07-30', SITE),
      vri: V('2026-07-30', CALL), cart: P('2026-09-09', 3), telehealth: V('2026-07-30', WEB), 'service-animal': V('2026-07-30', WEB),
    },
  }),
  demo({
    id: 'grand-avenue-womens-clinic', name: "Grand Avenue Women's Clinic", type: 'clinic', specialties: ['OB-GYN'],
    address: '3100 Grand Ave, Suite 4, Oakland, CA 94610', lat: 37.81205, lng: -122.25734, // 0.6 mi
    phone: '(510) 555-0121', website: 'https://grand-womens.example.org',
    hours: hrs(['09:00', '19:00']),
    doctors: [{ name: 'Dr. Lena Brooks', specialty: 'OB-GYN' }],
    accessFeatures: {
      scale: N('2026-09-02', CALL), 'exam-table': V('2026-09-02', CALL), entrance: V('2026-09-02', SITE),
      lift: N('2026-09-02', CALL), 'turning-space': P('2026-08-11', 2),
    },
  }),
  demo({
    id: 'hillcrest-womens-center', name: "Hillcrest Women's Center", type: 'clinic', specialties: ['OB-GYN'],
    address: '21850 Foothill Blvd, Suite 3, Hayward, CA 94541', lat: 37.64465, lng: -122.02182, // 17.5 mi: beyond a 15 mi search
    phone: '(510) 555-0156', website: 'https://hillcrest-womens.example.org',
    hours: hrs(['08:00', '17:00']),
    doctors: [{ name: 'Dr. Grace Whitfield', specialty: 'OB-GYN' }],
    accessFeatures: {
      scale: V('2026-05-19', CALL), 'exam-table': V('2026-05-19', CALL), entrance: V('2026-05-19', SITE),
      lift: V('2026-05-19', CALL), restroom: V('2026-05-19', SITE), 'extended-time': V('2026-05-19', CALL),
      mammography: V('2026-05-19', CALL),
    },
  }),

  // ---- Imaging: exactly two within 5 mi, both without an accessible scale (screen 07) ----
  demo({
    id: 'harborline-imaging', name: 'Harborline Imaging', type: 'imaging', specialties: ['Imaging'],
    address: '1999 Harrison St, Oakland, CA 94612', lat: 37.8048, lng: -122.22489, // 2.3 mi
    phone: '(510) 555-0133', website: 'https://harborline-imaging.example.org',
    hours: hrs(['07:30', '17:30']),
    doctors: [{ name: 'Dr. Omar Haddad', specialty: 'Radiology' }],
    accessFeatures: {
      scale: N('2026-08-27', CALL), 'exam-table': V('2026-08-27', CALL), entrance: V('2026-08-27', SITE),
      mammography: N('2026-08-27', CALL),
    },
  }),
  demo({
    id: 'oakmont-diagnostic-imaging', name: 'Oakmont Diagnostic Imaging', type: 'imaging', specialties: ['Imaging'],
    address: '3700 Broadway, Suite 220, Oakland, CA 94611', lat: 37.827, lng: -122.1997, // 3.9 mi
    phone: '(510) 555-0127', website: 'https://oakmont-imaging.example.org',
    hours: hrs(['08:00', '16:30'], ['09:00', '12:00']),
    doctors: [{ name: 'Dr. Rina Takeda', specialty: 'Radiology' }, { name: 'Dr. Paul Mensah', specialty: 'Radiology' }],
    accessFeatures: {
      scale: N('2026-09-12', CALL), entrance: V('2026-09-12', SITE), restroom: P('2026-09-30', 2), lift: N('2026-09-12', CALL),
    },
  }),
  demo({
    id: 'eastbay-imaging-center', name: 'East Bay Imaging Center', type: 'imaging', specialties: ['Imaging'],
    address: '5600 Telegraph Ave, Oakland, CA 94609', lat: 37.85914, lng: -122.17376, // 6.2 mi
    phone: '(510) 555-0164', website: 'https://eastbay-imaging.example.org',
    hours: hrs(['07:00', '18:00'], ['08:00', '14:00']),
    doctors: [{ name: 'Dr. Claire Dubois', specialty: 'Radiology' }],
    accessFeatures: {
      scale: V('2026-09-24', CALL), 'exam-table': V('2026-09-24', CALL), entrance: V('2026-09-24', SITE),
      lift: V('2026-09-24', CALL), restroom: V('2026-09-24', SITE), 'extended-time': P('2026-10-10', 4),
      mammography: V('2026-09-24', CALL),
    },
  }),
  demo({
    id: 'summit-radiology-group', name: 'Summit Radiology Group', type: 'imaging', specialties: ['Imaging'],
    address: '8200 MacArthur Blvd, Oakland, CA 94605', lat: 37.72793, lng: -122.12296, // 9.6 mi
    phone: '(510) 555-0171', website: 'https://summit-radiology.example.org',
    hours: hrs(['08:00', '17:00']),
    doctors: [{ name: 'Dr. Felix Andersson', specialty: 'Radiology' }],
    accessFeatures: {
      scale: V('2026-08-03', CALL), entrance: V('2026-08-03', SITE), restroom: V('2026-08-03', SITE),
      'turning-space': V('2026-08-03', SITE),
    },
  }),
  demo({
    id: 'foothill-imaging-associates', name: 'Foothill Imaging Associates', type: 'imaging', specialties: ['Imaging'],
    address: '14500 E 14th St, San Leandro, CA 94578', lat: 37.65904, lng: -122.10939, // 13.4 mi
    phone: '(510) 555-0149', website: 'https://foothill-imaging.example.org',
    hours: hrs(['08:00', '17:00']),
    doctors: [{ name: 'Dr. Yusuf Karimi', specialty: 'Radiology' }],
    accessFeatures: {
      scale: N('2026-06-05', CALL), 'exam-table': V('2026-06-05', CALL), entrance: V('2026-06-05', SITE),
    },
  }),

  // ---- Primary care ----
  demo({
    id: 'laurel-family-practice', name: 'Laurel Family Practice', type: 'clinic', specialties: ['Primary care'],
    address: '3600 MacArthur Blvd, Oakland, CA 94619', lat: 37.81223, lng: -122.23438, // 1.8 mi
    phone: '(510) 555-0103', website: 'https://laurel-family.example.org',
    hours: hrs(['08:00', '17:30'], ['09:00', '12:00']),
    doctors: [{ name: 'Dr. Nadia Fischer', specialty: 'Family medicine' }, { name: 'Dr. Kenji Mori', specialty: 'Family medicine' }],
    accessFeatures: {
      scale: V('2026-10-05', CALL), 'exam-table': V('2026-10-05', CALL), entrance: V('2026-10-05', SITE),
      lift: P('2026-10-12', 1), restroom: V('2026-10-05', SITE), 'extended-time': V('2026-10-05', CALL),
      'quiet-room': V('2026-10-05', SITE), 'plain-language': V('2026-10-05', WEB), telehealth: V('2026-10-05', WEB),
    },
  }),
  demo({
    id: 'elmhurst-health-partners', name: 'Elmhurst Health Partners', type: 'clinic', specialties: ['Primary care'],
    address: '4400 Telegraph Ave, Oakland, CA 94609', lat: 37.84209, lng: -122.23637, // 2.9 mi
    phone: '(510) 555-0112', website: 'https://elmhurst-health.example.org',
    hours: hrs(['08:30', '17:00']),
    doctors: [{ name: 'Dr. Tessa Morgan', specialty: 'Internal medicine' }],
    accessFeatures: {
      scale: N('2026-07-21', CALL), 'exam-table': N('2026-07-21', CALL), entrance: V('2026-07-21', SITE),
      asl: V('2026-07-21', CALL), cart: N('2026-07-21', CALL), telehealth: V('2026-07-21', WEB),
    },
  }),
  demo({
    id: 'maple-street-health', name: 'Maple Street Health', type: 'clinic', specialties: ['Primary care'],
    address: '1200 High St, Oakland, CA 94601', lat: 37.7941, lng: -122.16946, // 5.4 mi
    phone: '(510) 555-0139', website: 'https://maple-street-health.example.org',
    hours: hrs(['09:00', '18:00'], ['10:00', '14:00']),
    doctors: [{ name: 'Dr. Imani Carter', specialty: 'Family medicine' }, { name: 'Alex Nguyen, NP', specialty: 'Nurse practitioner' }],
    accessFeatures: {
      scale: V('2026-09-08', CALL), 'exam-table': V('2026-09-08', CALL), entrance: V('2026-09-08', SITE),
      lift: N('2026-09-08', CALL), restroom: P('2026-09-20', 3), 'minimal-wait': V('2026-09-08', CALL),
    },
  }),
  demo({
    id: 'sequoia-community-clinic', name: 'Sequoia Community Clinic', type: 'clinic', specialties: ['Primary care'],
    address: '6100 Shattuck Ave, Oakland, CA 94609', lat: 37.89771, lng: -122.15273, // 8.8 mi
    phone: '(510) 555-0185', website: 'https://sequoia-community.example.org',
    hours: hrs(['08:00', '16:00']),
    doctors: [{ name: 'Dr. Adaeze Obi', specialty: 'Family medicine' }],
    accessFeatures: {
      scale: P('2026-10-01', 2), entrance: V('2026-06-18', SITE), braille: V('2026-06-18', WEB), 'quiet-room': V('2026-06-18', SITE),
      lighting: V('2026-06-18', SITE),
    },
  }),
  demo({
    id: 'dimond-primary-care', name: 'Dimond Primary Care', type: 'clinic', specialties: ['Primary care'],
    address: '2200 MacArthur Blvd, Suite B, Oakland, CA 94602', lat: 37.78739, lng: -122.1963, // 4.1 mi
    phone: '(510) 555-0158', website: 'https://dimond-primary.example.org',
    hours: hrs(['08:00', '17:00'], ['09:00', '13:00']),
    doctors: [{ name: 'Dr. Louis Bernard', specialty: 'Family medicine' }],
    accessFeatures: {
      scale: V('2026-08-19', CALL), 'exam-table': N('2026-08-19', CALL), entrance: V('2026-08-19', SITE),
      restroom: V('2026-08-19', SITE), 'extended-time': V('2026-08-19', CALL),
    },
  }),

  // ---- Urgent care ----
  demo({
    id: 'lakeview-urgent-care', name: 'Lakeview Urgent Care', type: 'urgent-care', specialties: ['Urgent care'],
    address: '300 Grand Ave, Oakland, CA 94610', lat: 37.82166, lng: -122.2458, // 1.5 mi
    phone: '(510) 555-0191', website: 'https://lakeview-urgent.example.org',
    hours: allWeek(['08:00', '22:00']),
    doctors: [{ name: 'Dr. Carmen Ortiz', specialty: 'Emergency medicine' }, { name: 'Sam Patel, PA', specialty: 'Physician assistant' }],
    accessFeatures: {
      scale: V('2026-09-14', CALL), 'exam-table': N('2026-09-14', CALL), entrance: V('2026-09-14', SITE),
      restroom: V('2026-09-14', SITE), vri: V('2026-09-14', CALL), 'minimal-wait': P('2026-10-08', 5),
    },
  }),
  demo({
    id: 'eastlake-express-care', name: 'Eastlake Express Care', type: 'urgent-care', specialties: ['Urgent care', 'Primary care'],
    address: '1800 23rd Ave, Oakland, CA 94606', lat: 37.777, lng: -122.22057, // 3.3 mi
    phone: '(510) 555-0166', website: 'https://eastlake-express.example.org',
    hours: hrs(['09:00', '21:00'], ['09:00', '18:00'], ['10:00', '16:00']),
    doctors: [{ name: 'Dr. Wendell Price', specialty: 'Urgent care' }],
    accessFeatures: {
      scale: V('2026-07-08', CALL), 'exam-table': V('2026-07-08', CALL), entrance: V('2026-07-08', SITE),
      'turning-space': V('2026-07-08', SITE), 'service-animal': V('2026-07-08', WEB),
    },
  }),
  demo({
    id: 'hilltop-urgent-care', name: 'Hilltop Urgent Care', type: 'urgent-care', specialties: ['Urgent care'],
    address: '9300 Bancroft Ave, Oakland, CA 94605', lat: 37.65536, lng: -122.19683, // 11.2 mi
    phone: '(510) 555-0177', website: 'https://hilltop-urgent.example.org',
    hours: allWeek(['08:00', '20:00']),
    doctors: [{ name: 'Dr. Mina Shah', specialty: 'Urgent care' }],
    accessFeatures: {
      entrance: V('2026-05-27', SITE), restroom: N('2026-05-27', SITE), telehealth: V('2026-05-27', WEB),
    },
  }),

  // ---- Hospitals ----
  demo({
    id: 'alta-vista-hospital', name: 'Alta Vista Hospital', type: 'hospital', specialties: ['Primary care', 'Urgent care', 'Imaging'],
    address: '3300 Webster St, Oakland, CA 94609', lat: 37.87764, lng: -122.20481, // 5.9 mi
    phone: '(510) 555-0101', website: 'https://alta-vista-hospital.example.org',
    hours: allWeek(ALWAYS),
    doctors: [{ name: 'Dr. Rosa Delgado', specialty: 'Hospital medicine' }, { name: 'Dr. Ian Whitaker', specialty: 'Radiology' }],
    accessFeatures: {
      scale: V('2026-08-06', CALL), 'exam-table': V('2026-08-06', CALL), entrance: V('2026-08-06', SITE),
      lift: V('2026-08-06', CALL), restroom: V('2026-08-06', SITE), mammography: V('2026-08-06', CALL),
      asl: V('2026-08-06', CALL), vri: V('2026-08-06', CALL), cart: V('2026-08-06', CALL), tactile: P('2026-09-15', 1),
    },
  }),
  demo({
    id: 'marlow-community-hospital', name: 'Marlow Community Hospital', type: 'hospital', specialties: ['Primary care', 'Urgent care', 'Imaging'],
    address: '13500 E 14th St, San Leandro, CA 94578', lat: 37.65098, lng: -122.15261, // 12.5 mi
    phone: '(510) 555-0198', website: 'https://marlow-hospital.example.org',
    hours: allWeek(ALWAYS),
    doctors: [{ name: 'Dr. Beatrice Lang', specialty: 'Hospital medicine' }],
    accessFeatures: {
      scale: V('2026-06-30', CALL), entrance: V('2026-06-30', SITE), restroom: V('2026-06-30', SITE),
      lift: N('2026-06-30', CALL), vri: V('2026-06-30', CALL), telehealth: V('2026-06-30', WEB),
    },
  }),
];

export const clinicById = (id: string): Clinic | undefined => CLINICS.find((c) => c.id === id);
