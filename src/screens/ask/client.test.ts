import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHAT_LIMITS, parseChatRequest } from '../../contracts';
import type { ChatMessage } from '../../contracts';
import { DEMO_PROFILE } from '../../data/demoProfile';
import { ChatClientError, sendChat } from './client';

afterEach(() => vi.unstubAllGlobals());
const message: ChatMessage = { role: 'user', content: 'Find OB-GYN' };
const reply = { mode: 'mock', reply: 'I searched.', filters: { care: 'OB-GYN' } };

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('chat client', () => {
  it('uses the privacy builder, sends only the last 20 messages, and strips UI metadata', async () => {
    const fetchMock = mockFetch(Response.json(reply));
    const history = Array.from({ length: 25 }, (_, index) => ({ ...message, content: `message ${index}`, response: reply, error: false }));
    history[23].content = 'x'.repeat(2000);
    expect(await sendChat(DEMO_PROFILE, history)).toEqual(reply);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/chat');
    const body = JSON.parse(options.body);
    expect(Object.keys(body).sort()).toEqual(['messages', 'needs', 'radius', 'zip']);
    expect(body.messages).toHaveLength(CHAT_LIMITS.messages);
    expect(body.messages[0]).toEqual({ role: 'user', content: 'message 5' });
    expect(body.messages[18].content).toHaveLength(CHAT_LIMITS.messageChars);
    expect(body.zip).toBe('94612');
    expect(parseChatRequest(body).ok).toBe(true);
    for (const value of Object.values(DEMO_PROFILE.letter)) expect(options.body).not.toContain(value);
    expect(options.body).not.toContain(String(DEMO_PROFILE.location.lat));
    expect(options.body).not.toContain(String(DEMO_PROFILE.location.lng));
  });

  it('sends neither ZIP nor coordinates for a GPS profile', async () => {
    const fetchMock = mockFetch(Response.json(reply));
    await sendChat({ ...DEMO_PROFILE, location: { ...DEMO_PROFILE.location, source: 'gps' } }, [message]);
    expect(Object.keys(JSON.parse(fetchMock.mock.calls[0][1].body)).sort()).toEqual(['messages', 'needs', 'radius']);
  });

  it.each(['ollama_unreachable', 'model_missing', 'timeout', 'bad_output', 'not_configured', 'bad_request', 'too_large'] as const)(
    'makes %s actionable without exposing server details', async (code) => {
      mockFetch(Response.json({ error: { code, message: 'private server diagnostic' } }, { status: 503 }));
      await expect(sendChat(DEMO_PROFILE, [message])).rejects.toMatchObject({ code, message: expect.stringMatching(/manual filters/) });
    },
  );

  it('handles an offline connection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(sendChat(DEMO_PROFILE, [message])).rejects.toMatchObject({ code: 'network' });
  });

  it('handles a client timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError')));
    await expect(sendChat(DEMO_PROFILE, [message])).rejects.toMatchObject({ code: 'timeout' });
  });

  it.each([
    { mode: 'mock', reply: 'bad radius', filters: { radius: 17 } },
    { mode: 'mock', reply: 'bad need', filters: { needs: [{ key: 'invented', priority: 'required' }] } },
    { reply: 'missing mode' },
    null,
  ])('rejects an invalid successful response: %j', async (body) => {
    mockFetch(Response.json(body));
    await expect(sendChat(DEMO_PROFILE, [message])).rejects.toBeInstanceOf(ChatClientError);
    mockFetch(Response.json(body));
    await expect(sendChat(DEMO_PROFILE, [message])).rejects.toMatchObject({ code: 'bad_output' });
  });

  it('handles malformed JSON and unknown server errors', async () => {
    mockFetch(new Response('<html>Error</html>'));
    await expect(sendChat(DEMO_PROFILE, [message])).rejects.toMatchObject({ code: 'bad_output' });
    mockFetch(Response.json({ error: { code: 'unexpected' } }, { status: 502 }));
    await expect(sendChat(DEMO_PROFILE, [message])).rejects.toMatchObject({ code: 'network' });
  });
});
