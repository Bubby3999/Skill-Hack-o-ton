import { defineConfig } from '@playwright/test';

// One port per checkout so parallel worktrees don't collide.
function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
const port = Number(process.env.E2E_PORT) || 4100 + (hash(process.cwd()) % 800);

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 2,
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run build && npm start',
    url: `http://127.0.0.1:${port}/api/health`,
    timeout: 180_000,
    reuseExistingServer: false,
    // Mock mode is forced so a local .env can't change the result.
    env: { PORT: String(port), HOST: '127.0.0.1', AI_MODE: 'mock' },
  },
});
