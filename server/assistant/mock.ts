// Deterministic demo replies: clinic facts always come from the shared dataset.
import { FEATURES, RADII, STATUS_LABEL } from '../../src/contracts';
import type { AssistantFilters, ChatRequest, ChatResponse, Clinic, Need, Profile, Radius } from '../../src/contracts';
import { CLINICS } from '../../src/data/clinics';
import { applyAssistantFilters, defaultFilters } from '../../src/lib/filters';
import { searchClinics } from '../../src/lib/match';
import { lookupZip } from '../../src/lib/zips';

// shortcut: mock phrases cover the demo; use the local model for open-ended requests.
const CARE: [RegExp, string][] = [
  [/ob-?\s?gyn|gynecolog|women'?s health|obstetric/i, 'OB-GYN'],
  [/imaging|radiolog|x-?ray|\bmri\b|mammogra/i, 'Imaging'],
  [/urgent|walk-?in/i, 'Urgent care'],
  [/primary care|family (doctor|medicine)|\bpcp\b/i, 'Primary care'],
];

const NEEDS: [RegExp, Need['key']][] = [
  [/weigh|scale|seated/i, 'scale'],
  [/exam table|adjustable table|height-adjustable|transfer/i, 'exam-table'],
  [/\blift\b|hoyer/i, 'lift'],
  [/mammogra/i, 'mammography'],
  [/step-?free|wheelchair (access|entrance)|ramp|parking|\bentrance\b/i, 'entrance'],
  [/restroom|bathroom/i, 'restroom'],
  [/turning space|turning room/i, 'turning-space'],
  [/\basl\b|sign language|in-person interpreter/i, 'asl'],
  [/\bvri\b|video (remote )?interpret/i, 'vri'],
  [/captions?|\bcart\b/i, 'cart'],
  [/tactile|deafblind/i, 'tactile'],
  [/braille|large[ -]print/i, 'braille'],
  [/plain[ -]language/i, 'plain-language'],
  [/quiet|sensory/i, 'quiet-room'],
  [/lighting|dim lights/i, 'lighting'],
  [/extra time|longer appointment|extended/i, 'extended-time'],
  [/minimal[ -]wait|short wait|no wait/i, 'minimal-wait'],
  [/service (animal|dog)/i, 'service-animal'],
  [/telehealth|virtual visit/i, 'telehealth'],
];

const nearest = (n: number): Radius => RADII.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
const namedClinics = (text: string) => CLINICS.filter((clinic) =>
  text.toLowerCase().includes(clinic.name.toLowerCase()) ||
  text.toLowerCase().includes(clinic.name.split(' ')[0].toLowerCase()),
);
const isClinicQuestion = (text: string) => namedClinics(text).length > 0 || /\b(of these|of those|these clinics|those clinics)\b/i.test(text);

function searchFilters(req: ChatRequest): AssistantFilters {
  const filters: AssistantFilters = {};
  const needs = new Map<Need['key'], Need>();
  for (const message of req.messages) {
    if (message.role !== 'user' || isClinicQuestion(message.content)) continue;
    const text = message.content;
    const care = CARE.find(([re]) => re.test(text))?.[1];
    if (care) filters.care = care;
    const miles = /(\d+(?:\.\d+)?)\s*(?:mi\b|miles?)/i.exec(text);
    if (miles) filters.radius = nearest(Number(miles[1]));
    for (const [re, key] of NEEDS) {
      if (re.test(text)) needs.set(key, { key, priority: /nice to have|prefer|if possible/i.test(text) ? 'nice' : 'required' });
    }
  }
  if (needs.size) filters.needs = [...needs.values()];
  return filters;
}

function featureFact(clinic: Clinic, key: Need['key']): string {
  const info = clinic.accessFeatures[key];
  const status = info?.status ?? 'unknown';
  const evidence = status === 'unknown' ? 'No information yet.' : [info?.lastVerified, info?.source].filter(Boolean).join(' · ');
  return `${clinic.name} — ${FEATURES[key].short}: ${STATUS_LABEL[status]}. ${evidence}`;
}

export function mockChat(req: ChatRequest): Omit<ChatResponse, 'mode'> {
  const text = req.messages[req.messages.length - 1].content;
  if (/diagnos|symptoms?|treat(ment)?|medication|dosage|medical advice|what should i take/i.test(text)) {
    return { reply: 'I can help find clinics and check their access features. I can’t give medical advice.' };
  }
  const filters = searchFilters(req);
  if (isClinicQuestion(text)) {
    const keys = NEEDS.filter(([re]) => re.test(text)).map(([, key]) => key);
    if (!keys.length) return { reply: 'Ask about a clinic’s access feature, such as its wheelchair scale or patient lift.' };
    let clinics = namedClinics(text);
    if (!clinics.length) {
      const location = req.zip ? lookupZip(req.zip) : null;
      if (!location?.ok) return { reply: 'I don’t receive your GPS location, so I can’t tell which clinics you mean. Ask about a clinic by name or use manual filters.' };
      const profile: Profile = { needs: req.needs, radius: req.radius, location: { ...location, source: 'zip' }, letter: {} };
      clinics = searchClinics(applyAssistantFilters(defaultFilters(profile), filters), CLINICS).items
        .filter(({ match }) => match.tier === 'strong' || match.tier === 'possible')
        .slice(0, 3).map(({ clinic }) => clinic);
    }
    if (!clinics.length) return { reply: 'There are no Strong or Possible fits in that search. Change the manual filters to explore more clinics.' };
    return { reply: clinics.flatMap((clinic) => keys.map((key) => featureFact(clinic, key))).join('\n'), clinicIds: clinics.map((clinic) => clinic.id) };
  }
  if (!Object.keys(filters).length) {
    return { reply: 'Demo mode: I can set a type of care, a distance, and access needs from your message. Try “OB-GYN within 15 miles who can weigh me seated”.' };
  }
  const parts = [filters.care, filters.radius && `within ${filters.radius} mi`, filters.needs?.length && 'your requested access needs'].filter(Boolean);
  return { reply: `I searched for ${parts.join(', ')}. Your profile needs are included.`, filters };
}
