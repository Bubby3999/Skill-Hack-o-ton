import { DAYS } from '../contracts';
import type { Day, Hours } from '../contracts';

const DAY_NAMES: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
// JS getDay(): 0 = Sunday
const JS_DAY: Day[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h % 24;
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

const is24h = (r: [string, string] | undefined) => !!r && r[0] === '00:00' && r[1] === '24:00';
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** "Open until 6 pm" / "Open 24 hours" / "Opens at 8 am" / "Closed today". Uses the device clock (shortcut: no clinic time zone). */
export function openLabel(hours: Hours, now: Date = new Date()): string {
  const today = hours[JS_DAY[now.getDay()]];
  if (!today) return 'Closed today';
  if (is24h(today)) return 'Open 24 hours';
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < minutes(today[0])) return `Opens at ${formatTime(today[0])}`;
  if (mins < minutes(today[1])) return `Open until ${formatTime(today[1])}`;
  return 'Closed now';
}

/** Groups consecutive days with the same hours: [{ days: "Mon – Fri", text: "8 am – 6 pm" }, ...]. */
export function groupHours(hours: Hours): { days: string; text: string }[] {
  const text = (r: [string, string] | undefined) => (!r ? 'Closed' : is24h(r) ? 'Open 24 hours' : `${formatTime(r[0])} – ${formatTime(r[1])}`);
  const out: { days: string; text: string; first: Day; last: Day }[] = [];
  for (const d of DAYS) {
    const t = text(hours[d]);
    const prev = out[out.length - 1];
    if (prev && prev.text === t) prev.last = d;
    else out.push({ days: '', text: t, first: d, last: d });
  }
  return out.map((g) => ({
    days: g.first === g.last ? DAY_NAMES[g.first] : `${DAY_NAMES[g.first]} – ${DAY_NAMES[g.last]}`,
    text: g.text,
  }));
}
