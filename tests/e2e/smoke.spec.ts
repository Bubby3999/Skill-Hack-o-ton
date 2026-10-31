import { expect, test } from '@playwright/test';
import { expectNoSeriousAxeIssues, openRoute } from './helpers';
import { ROUTES } from './routes';

for (const route of ROUTES) {
  test(`route ${route}: one h1, landmarks, no serious axe issues`, async ({ page }) => {
    await openRoute(page, route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page).toHaveTitle(/CareFit$/);
    await expectNoSeriousAxeIssues(page);
  });
}

test('unknown path shows a not-found screen', async ({ page }) => {
  await openRoute(page, '/nope');
  await expect(page.locator('h1')).toHaveText('Page not found');
  await expectNoSeriousAxeIssues(page);
});

test('/ opens Welcome on a fresh device and Find once a profile is saved', async ({ page }) => {
  await openRoute(page, '/');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.evaluate(() => {
    localStorage.setItem('carefit:v', '1');
    localStorage.setItem('carefit:onboarding', '{"step":"skipped","needs":[]}');
  });
  await openRoute(page, '/');
  await expect(page).toHaveURL(/\/find$/);
});

test('the skip link is the first tab stop and moves focus to #main', async ({ page }) => {
  await openRoute(page, '/find');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('keyboard reaches Ask and Profile through the tab bar; focus lands on #main', async ({ page }) => {
  await openRoute(page, '/find');
  for (const [name, url] of [['Ask', /\/ask$/], ['Profile', /\/profile$/], ['Find', /\/find$/]] as const) {
    const tab = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name });
    await tab.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(url);
    await expect(page.locator('#main')).toBeFocused();
  }
});

test('bottom nav marks the current tab', async ({ page }) => {
  await openRoute(page, '/find');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Find' })).toHaveAttribute('aria-current', 'page');
  await openRoute(page, '/results');
  await expect(nav.getByRole('link', { name: 'Find' })).toHaveAttribute('aria-current', 'true');
});

test('empty, corrupted or old storage falls back to the demo profile without a crash', async ({ page }) => {
  for (const seed of ['{bad', '{"needs":1}', null]) {
    await page.addInitScript((s) => {
      localStorage.clear();
      if (s !== null) {
        localStorage.setItem('carefit:v', '1');
        localStorage.setItem('carefit:profile', s);
      }
    }, seed);
    await openRoute(page, '/profile');
    await expect(page.getByText('Maya Johnson')).toBeVisible();
  }
});

test('/api/health and /api/chat answer in mock mode', async ({ request }) => {
  const health = await (await request.get('/api/health')).json();
  expect(health).toMatchObject({ ok: true, mode: 'mock' });
  const res = await request.post('/api/chat', {
    data: { messages: [{ role: 'user', content: 'OB-GYN within 15 miles who can weigh me seated' }], needs: [], radius: 15 },
  });
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ mode: 'mock', filters: { care: 'OB-GYN', radius: 15, needs: [{ key: 'scale', priority: 'required' }] } });
});
