import { expect, test } from '@playwright/test';
import { openRoute } from './helpers';

// The production build is installable: manifest, icons and a service worker that registers.
test.use({ serviceWorkers: 'allow' });

test('manifest is served with the icons', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m).toMatchObject({ name: 'CareFit', short_name: 'CareFit', display: 'standalone', theme_color: '#0C5C56' });
  const sizes = m.icons.map((i: { sizes: string; purpose?: string }) => `${i.sizes}${i.purpose ? ` ${i.purpose}` : ''}`);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512', '512x512 maskable']));
  for (const icon of m.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test('the service worker registers and /api is never cached', async ({ page, request }) => {
  expect((await request.get('/sw.js')).status()).toBe(200);
  await openRoute(page, '/find');
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) for (const r of await (await caches.open(name)).keys()) urls.push(r.url);
    return urls;
  });
  expect(cached.some((u) => u.includes('/api/'))).toBe(false);
  expect(cached.some((u) => u.includes('openstreetmap'))).toBe(false);
});
