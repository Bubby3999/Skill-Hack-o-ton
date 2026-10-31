import type { IncomingMessage, ServerResponse } from 'node:http';
import { CHAT_LIMITS } from '../src/contracts';
import { handleChat, chatError } from './chat';
import type { Reply } from './chat';
import type { Config } from './config';
import { ollamaStatus } from './ollama';

/** Routes one /api request. Pure of Node streams so tests can call it directly. */
export async function handleApiRequest(
  method: string,
  pathname: string,
  rawBody: string,
  cfg: Config,
  fetchImpl: typeof fetch = fetch,
): Promise<Reply<unknown>> {
  if (pathname === '/api/health') {
    if (method !== 'GET' && method !== 'HEAD') return methodNotAllowed('GET');
    const ollama = await ollamaStatus(cfg, fetchImpl);
    return { status: 200, body: { ok: true, mode: cfg.aiMode, model: cfg.ollamaModel || null, ollama } };
  }
  if (pathname === '/api/chat') {
    if (method !== 'POST') return methodNotAllowed('POST');
    return handleChat(rawBody, cfg, fetchImpl);
  }
  return { status: 404, body: { error: { code: 'not_found', message: 'No such API route.' } } };
}

const methodNotAllowed = (allow: string): Reply<unknown> => ({
  status: 405,
  body: { error: { code: 'method_not_allowed', message: `Use ${allow}.` } },
});

/** Reads at most `cap` bytes; returns null if the body is bigger. */
function readBody(req: IncomingMessage, cap: number): Promise<string | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > cap) {
        resolve(null);
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(null));
  });
}

/** Node adapter. Returns false when the URL is not under /api, so the caller can serve static files. */
export function createApiHandler(cfg: Config) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (pathname !== '/api' && !pathname.startsWith('/api/')) return false;
    let reply: Reply<unknown>;
    try {
      const body = req.method === 'POST' ? await readBody(req, CHAT_LIMITS.bodyBytes) : '';
      reply = body === null ? chatError('too_large', 'Request is too large.') : await handleApiRequest(req.method ?? 'GET', pathname, body, cfg);
    } catch {
      reply = { status: 500, body: { error: { code: 'server_error', message: 'Unexpected server error.' } } };
    }
    const payload = JSON.stringify(reply.body);
    res.writeHead(reply.status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : payload);
    return true;
  };
}
