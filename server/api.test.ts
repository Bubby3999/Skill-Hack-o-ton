import { describe, expect, it } from 'vitest';
import { buildChatRequest } from '../src/contracts';
import { DEMO_PROFILE } from '../src/data/demoProfile';
import { handleApiRequest } from './api';
import { loadConfig } from './config';
import type { Config } from './config';

const mock: Config = loadConfig({});
const live: Config = { ...mock, aiMode: 'live', ollamaModel: 'test-model', ollamaTimeoutMs: 200 };
const DEMO_QUERY = 'OB-GYN within 15 miles who can weigh me seated';
const chatBody = (text = DEMO_QUERY, extra: object = {}) =>
  JSON.stringify({ ...buildChatRequest(DEMO_PROFILE, [{ role: 'user', content: text }]), ...extra });
const post = (cfg: Config, body: string, f?: typeof fetch) => handleApiRequest('POST', '/api/chat', body, cfg, f);
const ollamaOk = (content: unknown) =>
  (async () => new Response(JSON.stringify({ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }))) as unknown as typeof fetch;

describe('config', () => {
  it('defaults sensibly from an empty env and never throws', () => {
    expect(mock).toMatchObject({ port: 8787, host: '127.0.0.1', aiMode: 'mock', ollamaModel: '' });
    expect(loadConfig({ AI_MODE: 'banana', PORT: 'x' })).toMatchObject({ aiMode: 'mock', port: 8787 });
    expect(loadConfig({ AI_MODE: 'LIVE' }).aiMode).toBe('live');
  });
});

describe('GET /api/health', () => {
  it('reports mode and model, and Ollama down without failing', async () => {
    const down = (async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch;
    const r = await handleApiRequest('GET', '/api/health', '', mock, down);
    expect(r).toEqual({ status: 200, body: { ok: true, mode: 'mock', model: null, ollama: { reachable: false, modelInstalled: null } } });
  });
  it('reports an installed model', async () => {
    const f = (async () => new Response(JSON.stringify({ models: [{ name: 'test-model:latest' }] }))) as unknown as typeof fetch;
    const r = await handleApiRequest('GET', '/api/health', '', live, f);
    expect((r.body as { ollama: unknown }).ollama).toEqual({ reachable: true, modelInstalled: true });
  });
  it('rejects other methods and unknown routes', async () => {
    expect((await handleApiRequest('POST', '/api/health', '', mock)).status).toBe(405);
    expect((await handleApiRequest('GET', '/api/nope', '', mock)).status).toBe(404);
    expect((await handleApiRequest('GET', '/api/chat', '', mock)).status).toBe(405);
  });
});

describe('POST /api/chat, request validation', () => {
  it('rejects bad JSON, empty and oversized bodies, caps, and extra fields', async () => {
    expect((await post(mock, '{nope')).status).toBe(400);
    expect((await post(mock, 'x'.repeat(17 * 1024))).body).toMatchObject({ error: { code: 'too_large' } });
    const many = JSON.stringify({ messages: Array.from({ length: 21 }, () => ({ role: 'user', content: 'hi' })), needs: [], radius: 15 });
    expect((await post(mock, many)).status).toBe(400);
    expect((await post(mock, chatBody('x'.repeat(1001)))).status).toBe(400);
    expect((await post(mock, JSON.stringify({ messages: [{ role: 'assistant', content: 'hi' }], needs: [], radius: 15 }))).status).toBe(400);
    expect((await post(mock, JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], needs: [{ key: 'nope', priority: 'required' }], radius: 15 }))).status).toBe(400);
  });
  it('refuses name, email, phone and coordinates', async () => {
    for (const extra of [{ name: 'Maya' }, { email: 'a@b.c' }, { phone: '1' }, { lat: 1 }, { lng: 2 }]) {
      expect((await post(mock, chatBody(DEMO_QUERY, extra))).body).toMatchObject({ error: { code: 'bad_request' } });
    }
  });
  it('buildChatRequest sends only messages, needs, ZIP (if a ZIP) and radius', () => {
    const req = buildChatRequest(DEMO_PROFILE, [{ role: 'user', content: 'hi' }]);
    expect(Object.keys(req).sort()).toEqual(['messages', 'needs', 'radius', 'zip']);
    const gps = { ...DEMO_PROFILE, location: { source: 'gps' as const, lat: 1, lng: 2, label: 'Current location' } };
    expect(Object.keys(buildChatRequest(gps, [{ role: 'user', content: 'hi' }])).sort()).toEqual(['messages', 'needs', 'radius']);
    expect(JSON.stringify(req)).not.toMatch(/Maya|maya\.j|555-0199|37\.8/);
  });
});

describe('POST /api/chat, mock mode', () => {
  it('the demo query returns OB-GYN, 15 mi, scale required', async () => {
    const r = await post(mock, chatBody());
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      mode: 'mock',
      filters: { care: 'OB-GYN', radius: 15, needs: [{ key: 'scale', priority: 'required' }] },
    });
  });
  it('snaps the radius and handles messages with no filters', async () => {
    expect((await post(mock, chatBody('imaging within 12 miles'))).body).toMatchObject({ filters: { care: 'Imaging', radius: 10 } });
    const r = await post(mock, chatBody('hello'));
    expect(r.status).toBe(200);
    expect((r.body as { filters?: unknown }).filters).toBeUndefined();
  });
});

describe('POST /api/chat, live mode', () => {
  it('forwards to Ollama and returns a validated live response', async () => {
    let sent: { model: string; stream: boolean; format: unknown; messages: { role: string }[] } | undefined;
    const f = (async (_url: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ message: { content: JSON.stringify({ reply: 'Done.', filters: { care: 'OB-GYN', radius: 15 }, clinicIds: ['lakeshore-womens-health', 'made-up'] }) } }));
    }) as unknown as typeof fetch;
    const r = await post(live, chatBody(), f);
    expect(r).toEqual({ status: 200, body: { reply: 'Done.', filters: { care: 'OB-GYN', radius: 15 }, clinicIds: ['lakeshore-womens-health'], mode: 'live' } });
    expect(sent).toMatchObject({ model: 'test-model', stream: false });
    expect(sent?.format).toBeTruthy();
    expect(sent?.messages[0].role).toBe('system');
  });
  it('not_configured when the model name is empty (never falls back to mock)', async () => {
    const r = await post({ ...live, ollamaModel: '' }, chatBody());
    expect(r).toMatchObject({ status: 503, body: { error: { code: 'not_configured' } } });
  });
  it('ollama_unreachable when the connection fails', async () => {
    const f = (async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch;
    expect(await post(live, chatBody(), f)).toMatchObject({ status: 503, body: { error: { code: 'ollama_unreachable' } } });
  });
  it('model_missing when Ollama says the model is not found', async () => {
    const f = (async () => new Response('{"error":"model \\"x\\" not found"}', { status: 404 })) as unknown as typeof fetch;
    expect(await post(live, chatBody(), f)).toMatchObject({ status: 502, body: { error: { code: 'model_missing' } } });
  });
  it('timeout when Ollama is slow', async () => {
    const f = ((_u: string, init: RequestInit) =>
      new Promise((_res, rej) => init.signal?.addEventListener('abort', () => rej(init.signal!.reason)))) as unknown as typeof fetch;
    expect(await post(live, chatBody(), f)).toMatchObject({ status: 504, body: { error: { code: 'timeout' } } });
  });
  it('bad_output for invalid JSON or an invalid filter', async () => {
    expect(await post(live, chatBody(), ollamaOk('not json'))).toMatchObject({ status: 502, body: { error: { code: 'bad_output' } } });
    expect(await post(live, chatBody(), ollamaOk({ reply: 'x', filters: { radius: 7 } }))).toMatchObject({ body: { error: { code: 'bad_output' } } });
    expect(await post(live, chatBody(), ollamaOk({ filters: {} }))).toMatchObject({ body: { error: { code: 'bad_output' } } });
  });
});
