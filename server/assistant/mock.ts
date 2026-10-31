// Worker D owns this file: the fixed replies used when AI_MODE=mock. No model, no network.
import { RADII } from '../../src/contracts';
import type { AssistantFilters, ChatRequest, ChatResponse, Need, Radius } from '../../src/contracts';

const CARE: [RegExp, string][] = [
  [/ob-?\s?gyn|gynecolog|women'?s health|obstetric/i, 'OB-GYN'],
  [/imaging|radiolog|x-?ray|\bmri\b|mammogra/i, 'Imaging'],
  [/urgent|walk-?in/i, 'Urgent care'],
  [/primary care|family (doctor|medicine)|\bpcp\b/i, 'Primary care'],
];

// phrase -> need key
const NEEDS: [RegExp, Need['key']][] = [
  [/weigh|scale|seated/i, 'scale'],
  [/exam table|adjustable table|height-adjustable|transfer/i, 'exam-table'],
  [/\blift\b|hoyer/i, 'lift'],
  [/mammogra/i, 'mammography'],
  [/step-?free|wheelchair (access|entrance)|ramp|parking/i, 'entrance'],
  [/restroom|bathroom/i, 'restroom'],
  [/\basl\b|sign language|interpreter/i, 'asl'],
  [/captions?|\bcart\b/i, 'cart'],
  [/quiet|sensory/i, 'quiet-room'],
  [/extra time|longer appointment|extended/i, 'extended-time'],
];

const nearest = (n: number): Radius => RADII.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));

export function mockChat(req: ChatRequest): Omit<ChatResponse, 'mode'> {
  const text = req.messages[req.messages.length - 1].content;
  const filters: AssistantFilters = {};
  const care = CARE.find(([re]) => re.test(text))?.[1];
  if (care) filters.care = care;
  const miles = /(\d{1,2})\s*(?:mi\b|miles?)/i.exec(text);
  if (miles) filters.radius = nearest(Number(miles[1]));
  const needs: Need[] = NEEDS.filter(([re]) => re.test(text)).map(([, key]) => ({ key, priority: 'required' as const }));
  if (needs.length) filters.needs = needs;

  if (!Object.keys(filters).length) {
    return { reply: 'Demo mode: I can set a type of care, a distance, and access needs from your message. Try "OB-GYN within 15 miles who can weigh me seated".' };
  }
  const parts = [filters.care, filters.radius && `within ${filters.radius} mi`, needs.length && `${needs.length} required need${needs.length > 1 ? 's' : ''}`].filter(Boolean);
  return { reply: `I searched for ${parts.join(', ')}.`, filters };
}
