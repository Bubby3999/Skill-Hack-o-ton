import { CHAT_LIMITS, parseChatRequest, parseModelOutput } from '../src/contracts';
import type { ChatError, ChatErrorCode, ChatResponse } from '../src/contracts';
import { CLINICS } from '../src/data/clinics';
import { mockChat } from './assistant/mock';
import { RESPONSE_SCHEMA, buildMessages } from './assistant/prompt';
import type { Config } from './config';
import { OllamaError, ollamaChat } from './ollama';

export interface Reply<T> {
  status: number;
  body: T;
}

const STATUS: Record<ChatErrorCode, number> = {
  bad_request: 400,
  too_large: 413,
  not_configured: 503,
  ollama_unreachable: 503,
  model_missing: 502,
  bad_output: 502,
  timeout: 504,
};

export const chatError = (code: ChatErrorCode, message: string): Reply<ChatError> => ({
  status: STATUS[code],
  body: { error: { code, message } },
});

const CLINIC_IDS: ReadonlySet<string> = new Set(CLINICS.map((c) => c.id));

/** Validates the request, then answers from the mock or from Ollama. Live mode never falls back to mock. */
export async function handleChat(
  rawBody: string,
  cfg: Config,
  fetchImpl: typeof fetch = fetch,
): Promise<Reply<ChatResponse | ChatError>> {
  if (Buffer.byteLength(rawBody) > CHAT_LIMITS.bodyBytes) return chatError('too_large', 'Request is too large.');
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return chatError('bad_request', 'Body must be valid JSON.');
  }
  const parsed = parseChatRequest(json);
  if (!parsed.ok) return chatError('bad_request', parsed.message);
  const req = parsed.value;

  if (cfg.aiMode === 'mock') return { status: 200, body: { ...mockChat(req), mode: 'mock' } };

  if (!cfg.ollamaModel) return chatError('not_configured', 'OLLAMA_MODEL is not set. Set it in .env, or use AI_MODE=mock.');
  try {
    const text = await ollamaChat(cfg, buildMessages(req, CLINICS), RESPONSE_SCHEMA, fetchImpl);
    let out: unknown;
    try {
      out = JSON.parse(text);
    } catch {
      return chatError('bad_output', 'The model did not return valid JSON.');
    }
    const checked = parseModelOutput(out, CLINIC_IDS);
    if (!checked.ok) return chatError('bad_output', checked.message);
    return { status: 200, body: { ...checked.value, mode: 'live' } };
  } catch (e) {
    if (e instanceof OllamaError) return chatError(e.code, e.message);
    return chatError('bad_output', 'Unexpected error while asking the model.');
  }
}
