import { createServer } from 'node:http';
import { createApiHandler } from './api';
import { loadConfig, loadEnv } from './config';
import { createStaticHandler } from './static';

loadEnv();
const cfg = loadConfig();
const api = createApiHandler(cfg);
const serveStatic = createStaticHandler('dist');

createServer(async (req, res) => {
  if (!(await api(req, res))) serveStatic(req, res);
}).listen(cfg.port, cfg.host, () => {
  console.log(`CareFit on http://${cfg.host}:${cfg.port} · AI mode: ${cfg.aiMode}${cfg.aiMode === 'live' ? ` (${cfg.ollamaModel || 'no model set'})` : ''}`);
});
