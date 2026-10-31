import { isRadius, parseNeeds } from './types';
import type { Need, Profile, Radius } from './types';

// ---- Contract ----
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  needs: Need[];
  zip?: string;
  radius: Radius;
}

/** Filters the assistant may set. Location and sort are never set by the model. */
export interface AssistantFilters {
  care?: string;
  radius?: Radius;
  needs?: Need[];
}

export interface ChatResponse {
  reply: string;
  filters?: AssistantFilters;
  clinicIds?: string[];
  mode: 'live' | 'mock';
}

export type ChatErrorCode =
  | 'bad_request'
  | 'too_large'
  | 'ollama_unreachable'
  | 'model_missing'
  | 'timeout'
  | 'bad_output'
  | 'not_configured';

export interface ChatError {
  error: { code: ChatErrorCode; message: string };
}

export const CHAT_LIMITS = { bodyBytes: 16 * 1024, messages: 20, messageChars: 1000, careChars: 60 } as const;

// ---- Building the request: the only place it is assembled (privacy) ----
/** Sends messages, needs, ZIP (only if the location came from a ZIP) and radius. Never name, contact details or GPS. */
export function buildChatRequest(profile: Profile, messages: ChatMessage[]): ChatRequest {
  const req: ChatRequest = { messages, needs: profile.needs, radius: profile.radius };
  if (profile.location.source === 'zip' && profile.location.zip) req.zip = profile.location.zip;
  return req;
}

// ---- Validation ----
type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };
const bad = (message: string): { ok: false; message: string } => ({ ok: false, message });
const isObj = (o: unknown): o is Record<string, unknown> => typeof o === 'object' && o !== null && !Array.isArray(o);

/** Strict: unknown keys are rejected so name/email/phone/lat/lng can't ride along. */
export function parseChatRequest(v: unknown): Parsed<ChatRequest> {
  if (!isObj(v)) return bad('Body must be a JSON object.');
  const extra = Object.keys(v).filter((k) => !['messages', 'needs', 'zip', 'radius'].includes(k));
  if (extra.length) return bad(`Unexpected field: ${extra[0]}.`);
  if (!Array.isArray(v.messages) || v.messages.length === 0) return bad('messages must be a non-empty array.');
  if (v.messages.length > CHAT_LIMITS.messages) return bad(`At most ${CHAT_LIMITS.messages} messages.`);
  const messages: ChatMessage[] = [];
  for (const m of v.messages) {
    if (!isObj(m) || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return bad('Each message needs a role (user or assistant) and text content.');
    }
    if (m.content.length === 0 || m.content.length > CHAT_LIMITS.messageChars) {
      return bad(`Each message must be 1-${CHAT_LIMITS.messageChars} characters.`);
    }
    messages.push({ role: m.role, content: m.content });
  }
  if (messages[messages.length - 1].role !== 'user') return bad('The last message must be from the user.');
  const needs = parseNeeds(v.needs);
  if (!needs) return bad('needs must be a list of { key, priority } with valid keys.');
  if (!isRadius(v.radius)) return bad('radius must be 5, 10, 15, 25 or 50.');
  const req: ChatRequest = { messages, needs, radius: v.radius };
  if (v.zip !== undefined) {
    if (typeof v.zip !== 'string' || !/^\d{5}$/.test(v.zip)) return bad('zip must be 5 digits.');
    req.zip = v.zip;
  }
  return { ok: true, value: req };
}

/** Validates what the model returned. Unknown clinic ids are dropped; anything else invalid is rejected. */
export function parseModelOutput(v: unknown, knownClinicIds: ReadonlySet<string>): Parsed<Omit<ChatResponse, 'mode'>> {
  if (!isObj(v)) return bad('Model output is not an object.');
  if (typeof v.reply !== 'string' || v.reply.trim() === '') return bad('Model output has no reply.');
  const out: Omit<ChatResponse, 'mode'> = { reply: v.reply.trim().slice(0, 2000) };
  if (v.filters !== undefined && v.filters !== null) {
    if (!isObj(v.filters)) return bad('filters must be an object.');
    const f: AssistantFilters = {};
    if (v.filters.care !== undefined && v.filters.care !== null && v.filters.care !== '') {
      if (typeof v.filters.care !== 'string' || v.filters.care.length > CHAT_LIMITS.careChars) return bad('Invalid care.');
      f.care = v.filters.care;
    }
    if (v.filters.radius !== undefined && v.filters.radius !== null) {
      if (!isRadius(v.filters.radius)) return bad('Invalid radius.');
      f.radius = v.filters.radius;
    }
    if (v.filters.needs !== undefined && v.filters.needs !== null) {
      const needs = parseNeeds(v.filters.needs);
      if (!needs) return bad('Invalid needs.');
      f.needs = needs;
    }
    if (Object.keys(f).length) out.filters = f;
  }
  if (Array.isArray(v.clinicIds)) {
    const ids = v.clinicIds.filter((id): id is string => typeof id === 'string' && knownClinicIds.has(id));
    if (ids.length) out.clinicIds = ids;
  }
  return { ok: true, value: out };
}

