import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.map': 'application/json', '.txt': 'text/plain; charset=utf-8',
};

/** Serves the built app from `root` with an SPA fallback to index.html. */
export function createStaticHandler(root: string) {
  const base = resolve(root);
  return (req: IncomingMessage, res: ServerResponse): void => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' }).end();
      return;
    }
    let pathname = '/';
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    let file = normalize(join(base, pathname));
    if (file !== base && !file.startsWith(base + sep)) {
      res.writeHead(403).end(); // path traversal
      return;
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (extname(pathname)) { // a missing asset is a 404, not the app
        res.writeHead(404).end('Not found');
        return;
      }
      file = join(base, 'index.html');
    }
    if (!existsSync(file)) {
      res.writeHead(503, { 'content-type': 'text/plain' }).end('App not built. Run: npm run build');
      return;
    }
    const isAsset = pathname.startsWith('/assets/');
    res.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      'cache-control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).pipe(res);
  };
}
