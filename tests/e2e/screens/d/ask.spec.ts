import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { DEMO_PROFILE } from '../../../../src/data/demoProfile';
import { applyAssistantFilters, defaultFilters, filtersToQuery } from '../../../../src/lib/filters';
import { expectNoSeriousAxeIssues, openRoute } from '../../helpers';

const demo = 'OB-GYN within 15 miles who can weigh me seated';

async function tabTo(page: Page, target: Locator) {
  for (let count = 0; count < 35; count++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}

async function ask(page: Page, text = demo) {
  await page.getByRole('textbox', { name: 'Message CareFit' }).fill(text);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
}

async function expectAboveDock(page: Page, target: Locator) {
  const control = await target.boundingBox();
  const dock = await page.locator('.dock').boundingBox();
  expect(control).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(control!.y).toBeGreaterThanOrEqual(0);
  expect(control!.y + control!.height).toBeLessThanOrEqual(dock!.y);
}

test('demo search sends only allowed profile fields and works entirely with the keyboard', async ({ page }, testInfo) => {
  await openRoute(page, '/ask');
  const composer = page.getByRole('textbox', { name: 'Message CareFit' });
  await tabTo(page, composer);
  await page.keyboard.type(demo);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeFocused();
  const sent = page.waitForRequest((request) => request.url().endsWith('/api/chat') && request.method() === 'POST');
  await page.keyboard.press('Enter');
  const request = await sent;
  const body = request.postDataJSON();
  expect(Object.keys(body).sort()).toEqual(['messages', 'needs', 'radius', 'zip']);
  expect(body.messages).toEqual([{ role: 'user', content: demo }]);
  expect(body).toMatchObject({ needs: DEMO_PROFILE.needs, radius: 15, zip: '94612' });
  const raw = request.postData()!;
  for (const value of Object.values(DEMO_PROFILE.letter)) expect(raw).not.toContain(value);
  expect(raw).not.toContain(String(DEMO_PROFILE.location.lat));
  expect(raw).not.toContain(String(DEMO_PROFILE.location.lng));
  expect(raw).not.toMatch(/"(?:name|email|phone|lat|lng|latitude|longitude|location|letter)"/);

  const matches = page.getByRole('list', { name: 'Top clinic matches' });
  await expect(matches.getByRole('link')).toHaveCount(3);
  await expect(matches.getByRole('link')).toHaveText([
    /Lakeshore Women's Health.*4.8 mi.*Strong fit.*5 of 6 needs/,
    /Fruitvale OB-GYN Associates.*1.1 mi.*Possible fit.*4 of 6 needs/,
    /Bayview Medical Center.*7.9 mi.*Possible fit.*3 of 6 needs/,
  ]);
  await expect(page.getByRole('list', { name: 'Filters applied' }).getByRole('listitem')).toHaveText(['OB-GYN', 'Within 15 mi', 'Wheelchair scale · required', '+ 5 needs from your profile']);
  await expect(matches).not.toContainText('Grand Avenue');
  await expectNoSeriousAxeIssues(page);

  const clinic = matches.getByRole('link').first();
  await tabTo(page, clinic);
  await expectAboveDock(page, clinic);
  await page.screenshot({ path: testInfo.outputPath('ask-results.png'), fullPage: true });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/clinic\/lakeshore-womens-health$/);
  await expect(page.locator('#main')).toBeFocused();
  await tabTo(page, page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Ask', exact: true }));
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/ask$/);
  const results = page.getByRole('link', { name: 'See results', exact: true });
  await expect(results).toHaveCount(1);
  await tabTo(page, results);
  await expectAboveDock(page, results);
  await page.keyboard.press('Enter');
  const expected = applyAssistantFilters(defaultFilters(DEMO_PROFILE), { care: 'OB-GYN', radius: 15, needs: [{ key: 'scale', priority: 'required' }] });
  expect(new URL(page.url()).search.slice(1)).toBe(filtersToQuery(expected));
  await expect(page).toHaveURL(/\/results\?/);
});

test('suggestions answer from equipment evidence without replacing the search', async ({ page }) => {
  await openRoute(page, '/ask');
  await ask(page);
  await expect(page.getByRole('list', { name: 'Top clinic matches' })).toBeVisible();
  const resultsHref = await page.getByRole('link', { name: 'See results', exact: true }).getAttribute('href');
  await page.getByRole('button', { name: 'Which of these have a patient lift?' }).click();
  const reply = page.locator('.bubble--bot').last();
  await expect(reply).toContainText("Lakeshore Women's Health — Patient lift: Unknown. No information yet.");
  await expect(reply).toContainText('Fruitvale OB-GYN Associates — Patient lift: Not available.');
  await expect(reply).toContainText('Bayview Medical Center — Patient lift: Unknown.');
  await page.getByRole('button', { name: "Is Lakeshore's scale verified?" }).click();
  await expect(page.locator('.bubble--bot').last()).toContainText('Wheelchair scale: Verified. 2026-09-18 · Clinic phone call');
  await expect(page.getByRole('link', { name: 'See results', exact: true })).toHaveAttribute('href', resultsHref!);
  await expect(page.getByRole('list', { name: 'Top clinic matches' })).toHaveCount(1);
});

test('a cold start shows progress and prevents duplicate requests', async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  let calls = 0;
  await page.route('**/api/chat', async (route) => {
    calls++;
    await ready;
    await route.fulfill({ json: { mode: 'mock', reply: 'Search ready.', filters: { care: 'OB-GYN' } } });
  });
  await openRoute(page, '/ask');
  await ask(page);
  await expect(page.getByRole('log')).toContainText('A cold start can take 30 seconds or longer.');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Which of these have a patient lift?' })).toBeDisabled();
  expect(calls).toBe(1);
  release();
  await expect(page.getByRole('log')).toContainText('Search ready.');
  await expect(page.getByText('A cold start', { exact: false })).toHaveCount(0);
});

for (const code of ['ollama_unreachable', 'model_missing', 'timeout', 'bad_output', 'not_configured']) {
  test(`${code} shows a manual way forward (intercepted; no live model)`, async ({ page }) => {
    await page.route('**/api/chat', (route) => route.fulfill({ status: 503, json: { error: { code, message: 'server detail' } } }));
    await openRoute(page, '/ask');
    await ask(page);
    const error = page.locator('.bubble--error');
    await expect(error).toContainText('manual filters');
    await expect(error).not.toContainText('server detail');
    const manual = error.getByRole('link', { name: 'Use manual filters' });
    await expect(manual).toHaveAttribute('href', '/find');
    await tabTo(page, manual);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/find$/);
  });
}

test('network failure shows the same fallback and allows another message', async ({ page }) => {
  await page.route('**/api/chat', (route) => route.abort('failed'));
  await openRoute(page, '/ask');
  await ask(page);
  await expect(page.locator('.bubble--error')).toContainText('Check your connection');
  await expect(page.getByRole('link', { name: 'Use manual filters' })).toHaveAttribute('href', '/find');
  await page.unroute('**/api/chat');
  await ask(page);
  await expect(page.getByRole('list', { name: 'Top clinic matches' })).toBeVisible();
});

test('no matching clinics still offers results and filter changes', async ({ page }) => {
  await openRoute(page, '/ask');
  await ask(page, 'Imaging within 5 miles with a wheelchair scale');
  await expect(page.getByRole('log')).toContainText('No Strong or Possible fits for these filters.');
  await expect(page.getByRole('link', { name: 'See results', exact: true })).toHaveAttribute('href', /care=Imaging/);
  await expect(page.getByRole('link', { name: 'Change filters' })).toHaveAttribute('href', '/find');
  await expectNoSeriousAxeIssues(page);
});

for (const [width, height, textSize] of [[320, 844, 200], [375, 812, 100], [844, 390, 100]]) {
  test(`reflow and visible keyboard focus at ${width}×${height}, ${textSize}% text`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openRoute(page, '/ask');
    await page.addStyleTag({ content: `html { font-size: ${textSize}%; }` });
    await ask(page);
    const matches = page.getByRole('list', { name: 'Top clinic matches' });
    await expect(matches).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await matches.evaluate((list) => Array.from(list.querySelectorAll('.fit-badge')).every((badge) => {
      const rect = badge.getBoundingClientRect();
      const bounds = list.getBoundingClientRect();
      return rect.left >= bounds.left && rect.right <= bounds.right;
    }))).toBe(true);
    const results = page.getByRole('link', { name: 'See results', exact: true });
    await tabTo(page, results);
    await expectAboveDock(page, results);
    await expectNoSeriousAxeIssues(page);
    await page.screenshot({ path: testInfo.outputPath('ask-reflow.png'), fullPage: true });
  });
}
