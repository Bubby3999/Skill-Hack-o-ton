import { FEATURES, isFeatureKey } from '../../contracts';
import type { Clinic, FeatureKey, LetterDraft, MatchResult, Profile } from '../../contracts';
import { matchClinic } from '../../lib/match';

export function formatCalendarDate(value: string, month: 'long' | 'short' = 'long'): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month, day: 'numeric', year: 'numeric' });
}

export function fitSummary(match: MatchResult): string {
  if (!match.total) return 'Your access needs are not set yet.';
  const required = match.perNeed.filter((need) => need.priority === 'required').length;
  const nice = match.total - required;
  const requiredMet = match.has.filter((need) => need.priority === 'required').length;
  const counts = [
    required ? `${requiredMet === required ? 'all ' : ''}${requiredMet} of ${requiredMet === required ? 'your ' : `${required} `}required needs` : '',
    nice ? `${match.met - requiredMet} of ${nice} nice-to-haves` : '',
  ].filter(Boolean).join(' and ');
  const unknown = match.unknown.map((need) => FEATURES[need.key].short).join(', ');
  const missing = match.missing.map((need) => FEATURES[need.key].short).join(', ');
  return `Has ${counts}.${unknown ? ` Unknown: ${unknown}.` : ''}${missing ? ` Missing: ${missing}.` : ''}`;
}

export function requestLabel(key: FeatureKey): string {
  if (key === 'scale') return 'A wheelchair-accessible scale, so I can be weighed seated';
  if (key === 'lift') return 'A patient lift, or staff trained to help with transfers';
  if (key === 'extended-time') return 'Extra appointment time';
  return FEATURES[key].label;
}

export function createDraft(clinic: Clinic, profile: Profile): LetterDraft {
  const match = matchClinic(profile.needs, clinic, profile.location);
  return {
    clinicId: clinic.id,
    clinicName: clinic.name,
    appointmentDate: '',
    doctor: '',
    accommodations: match.perNeed.filter((need) => !match.has.some((has) => has.key === need.key)).map((need) => need.key),
    notes: '',
    sender: { ...profile.letter },
    updatedAt: new Date().toISOString(),
  };
}

/** Draft storage has no parser; validate it here before rendering editable fields. */
export function restoreDraft(value: unknown, clinic: Clinic, profile: Profile): LetterDraft {
  if (typeof value !== 'object' || value === null) return createDraft(clinic, profile);
  const draft = value as Partial<LetterDraft>;
  if (draft.clinicId !== clinic.id || typeof draft.clinicName !== 'string' ||
    typeof draft.appointmentDate !== 'string' || typeof draft.doctor !== 'string' || typeof draft.notes !== 'string' ||
    typeof draft.updatedAt !== 'string' || !Number.isFinite(Date.parse(draft.updatedAt)) ||
    !Array.isArray(draft.accommodations) || !draft.accommodations.every(isFeatureKey) ||
    !draft.sender || typeof draft.sender !== 'object' || Array.isArray(draft.sender) ||
    !['name', 'email', 'phone'].every((key) => {
      const field = draft.sender?.[key as keyof LetterDraft['sender']];
      return field === undefined || typeof field === 'string';
    })) return createDraft(clinic, profile);
  return { ...draft, accommodations: [...new Set(draft.accommodations)], sender: { ...draft.sender } } as LetterDraft;
}

export function validateDraft(draft: LetterDraft): Partial<Record<'clinic' | 'date' | 'email', string>> {
  const errors: Partial<Record<'clinic' | 'date' | 'email', string>> = {};
  if (!draft.clinicName.trim()) errors.clinic = 'Enter the clinic name.';
  if (draft.appointmentDate) {
    const date = new Date(`${draft.appointmentDate}T12:00:00`);
    const actual = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.appointmentDate) || actual !== draft.appointmentDate) errors.date = 'Enter a valid appointment date.';
  }
  if (draft.sender.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.sender.email.trim())) errors.email = 'Enter a valid email address, or leave it blank.';
  return errors;
}

export function buildLetter(draft: LetterDraft, clinic: Clinic) {
  const appointment = draft.appointmentDate && !validateDraft(draft).date ? formatCalendarDate(draft.appointmentDate) : '';
  const doctor = draft.doctor.trim();
  const visit = `an ${appointment ? 'appointment' : 'upcoming appointment'}${doctor ? ` with ${doctor}` : ''}${appointment ? ` on ${appointment}` : ''}`;
  const contact = [draft.sender.email?.trim(), draft.sender.phone?.trim()].filter(Boolean).join(' or ');
  const letter = {
    date: new Date(draft.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    recipient: `${draft.clinicName}\n${clinic.address}`,
    subject: `Disability accommodations for my appointment${appointment ? ` on ${appointment}` : ''}`,
    greeting: `Dear ${draft.clinicName} team,`,
    introduction: `I have ${visit}. I have a disability, and I am writing ahead of time to ${draft.accommodations.length ? 'request these accommodations' : 'discuss my access needs'} so I can receive a complete exam${draft.accommodations.length ? ':' : '.'}`,
    requests: draft.accommodations.map(requestLabel),
    notes: draft.notes.trim(),
    rights: 'Section 504 of the Rehabilitation Act and the Americans with Disabilities Act protect access to health care for people with disabilities. I am requesting reasonable accommodations so I can access your services.',
    confirmation: `Please confirm ${draft.accommodations.length ? 'these will be ready for my visit' : 'how my access needs can be met'}${contact ? `, or contact me at ${contact} to discuss other options` : ', or contact me to discuss other options'}.`,
    signature: `Thank you,${draft.sender.name?.trim() ? `\n${draft.sender.name.trim()}` : ''}`,
  };
  const text = [letter.date, letter.recipient, `Re: ${letter.subject}`, letter.greeting, letter.introduction,
    letter.requests.map((request) => `• ${request}`).join('\n'), letter.notes, letter.rights, letter.confirmation, letter.signature,
    'Not legal advice.'].filter(Boolean).join('\n\n');
  return { ...letter, text };
}
