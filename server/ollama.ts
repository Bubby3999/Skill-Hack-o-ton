import type { ChatErrorCode } from '../src/contracts';
import type { Config } from './config';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OllamaError extends Error {
  constructor(public code: ChatErrorCode, message: string) {
    super(message);
  }
}

type FetchLike = typeof fetch;

/** One non-streaming chat call with a JSON-schema `format`. Returns the model's raw message text. */
export async function ollamaChat(
  cfg: Config,
  messages: OllamaMessage[],
  format: object,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  let res: Response;
  try {
    res = await fetchImpl(`${cfg.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: cfg.ollamaModel, messages, stream: false, format, options: { temperature: 0 } }),
      signal: AbortSignal.timeout(cfg.ollamaTimeoutMs),
    });
  } catch (e) {
    const name = (e as { name?: string }).name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new OllamaError('timeout', 'The local AI model took too long to answer.');
    }
    throw new OllamaError('ollama_unreachable', 'The local AI model (Ollama) is not reachable.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 404 || /not found/i.test(text)) {
      throw new OllamaError('model_missing', `The model "${cfg.ollamaModel}" is not installed in Ollama.`);
    }
    throw new OllamaError('ollama_unreachable', `Ollama answered with HTTP ${res.status}.`);
  }
  try {
    const data = (await res.json()) as { message?: { content?: unknown } };
    if (typeof data.message?.content !== 'string') throw new Error('no content');
    return data.message.content;
  } catch (e) {
    if (e instanceof OllamaError) throw e;
    const name = (e as { name?: string }).name;
    if (name === 'TimeoutError' || name === 'AbortError') throw new OllamaError('timeout', 'The local AI model took too long to answer.');
    throw new OllamaError('bad_output', 'Ollama returned a response CareFit could not read.');
  }
}

export interface OllamaStatus {
  reachable: boolean;
  modelInstalled: boolean | null; // null when no model is configured or Ollama is down
}

/** Pings Ollama's model list with a short timeout. Never throws. */
export async function ollamaStatus(cfg: Config, fetchImpl: FetchLike = fetch): Promise<OllamaStatus> {
  try {
    const res = await fetchImpl(`${cfg.ollamaBaseUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return { reachable: false, modelInstalled: null };
    if (!cfg.ollamaModel) return { reachable: true, modelInstalled: null };
    const data = (await res.json()) as { models?: { name?: string; model?: string }[] };
    const want = cfg.ollamaModel.includes(':') ? cfg.ollamaModel : `${cfg.ollamaModel}:latest`;
    const installed = (data.models ?? []).some((m) => (m.name ?? m.model) === want);
    return { reachable: true, modelInstalled: installed };
  } catch {
    return { reachable: false, modelInstalled: null };
  }
}
