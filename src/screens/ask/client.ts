import { buildChatRequest, CHAT_LIMITS, parseModelOutput } from '../../contracts';
import type { ChatErrorCode, ChatMessage, ChatResponse, Profile } from '../../contracts';
import { CLINICS } from '../../data/clinics';

type ErrorCode = ChatErrorCode | 'network';
const ERRORS: Record<ErrorCode, string> = {
  ollama_unreachable: 'CareFit’s local AI is unavailable. Try again or use manual filters.',
  model_missing: 'CareFit’s local AI model is unavailable. Use manual filters for now.',
  timeout: 'CareFit took too long to reply. Try again or use manual filters.',
  bad_output: 'CareFit could not read the AI reply. Try again or use manual filters.',
  not_configured: 'CareFit’s local AI is not configured. Use manual filters for now.',
  bad_request: 'CareFit could not send this message. Try a shorter message or use manual filters.',
  too_large: 'This conversation is too long to send. Use manual filters for now.',
  network: 'CareFit could not connect. Check your connection, try again, or use manual filters.',
};

export class ChatClientError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(ERRORS[code]);
    this.name = 'ChatClientError';
  }
}

/** The shared builder is the only source of the body; UI-only entry fields never leave the browser. */
export async function sendChat(profile: Profile, messages: ChatMessage[], signal?: AbortSignal): Promise<ChatResponse> {
  const history = messages.slice(-CHAT_LIMITS.messages).map(({ role, content }) => ({
    role, content: content.slice(0, CHAT_LIMITS.messageChars),
  }));
  let response: Response | undefined;
  let data: unknown;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildChatRequest(profile, history)),
      signal: AbortSignal.any([AbortSignal.timeout(75_000), ...(signal ? [signal] : [])]),
    });
    data = await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') throw new ChatClientError('timeout');
    if (response?.ok) throw new ChatClientError('bad_output');
    throw new ChatClientError('network');
  }
  if (!response.ok) {
    const code = (data as { error?: { code?: unknown } } | null)?.error?.code;
    throw new ChatClientError(typeof code === 'string' && Object.hasOwn(ERRORS, code) ? code as ErrorCode : 'network');
  }
  const mode = (data as { mode?: unknown } | null)?.mode;
  const parsed = parseModelOutput(data, new Set(CLINICS.map((clinic) => clinic.id)));
  if (!parsed.ok || (mode !== 'mock' && mode !== 'live')) throw new ChatClientError('bad_output');
  return { ...parsed.value, mode };
}
