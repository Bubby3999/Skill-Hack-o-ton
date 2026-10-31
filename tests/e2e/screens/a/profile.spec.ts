import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { DEMO_PROFILE } from '../../../../src/data/demoProfile';
import { expectNoSeriousAxeIssues, openRoute } from '../../helpers';

async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 100; i++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Keyboard could not reach ${await target.getAttribute('name') || await target.textContent()}`);
}

test('needs in all four categories save with priorities and survive reload', async ({ page }) => {
  await openRoute(page, '/profile');
  await page.getByRole('link', { name: 'Edit access needs' }).click();
  await expect(page).toHaveURL(/\/profile\/needs\?from=%2Fprofile$/);
  await page.getByRole('checkbox', { name: 'Height-adjustable exam table', exact: true }).uncheck();
  for (const [category, label] of [
    ['Communication', 'In-person ASL interpreter'],
    ['Sensory & cognitive', 'Quiet or sensory-friendly room'],
    ['Other', 'Service animals welcome'],
  ]) {
    await page.locator('summary').filter({ hasText: category }).click();
    await page.getByRole('checkbox', { name: label, exact: true }).check();
    await expect(page.getByRole('group', { name: `${label}: how important?`, exact: true }).getByRole('radio', { name: 'Required', exact: true })).toBeChecked();
  }
  await page.getByRole('group', { name: 'In-person ASL interpreter: how important?', exact: true }).getByRole('radio', { name: 'Nice to have' }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.locator('.profile-needs-list > li')).toHaveCount(8);
  await expect(page.locator('.profile-needs-list > li').filter({ hasText: 'In-person ASL interpreter' })).toContainText('Nice to have');
  await page.reload();
  await expect(page.locator('.profile-needs-list > li')).toHaveCount(8);
  await expect(page.locator('.profile-needs-list')).not.toContainText('Height-adjustable exam table');
  await page.getByRole('link', { name: 'Edit access needs' }).click();
  await page.locator('summary').filter({ hasText: 'Communication' }).click();
  await expect(page.getByRole('checkbox', { name: 'In-person ASL interpreter', exact: true })).toBeChecked();
  await expect(page.getByRole('group', { name: 'In-person ASL interpreter: how important?', exact: true }).getByRole('radio', { name: 'Nice to have' })).toBeChecked();
});

test('removing all needs is supported and Back discards unsaved edits', async ({ page }) => {
  await openRoute(page, '/profile/needs');
  await page.getByRole('checkbox', { name: 'Wheelchair-accessible scale', exact: true }).uncheck();
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.locator('.profile-needs-list > li')).toHaveCount(6);
  await page.getByRole('link', { name: 'Edit access needs' }).click();
  await expect(page.getByRole('heading', { name: 'What do you need at a visit?', exact: true })).toBeVisible();
  while (await page.locator('details:not([open]) > summary').count()) await page.locator('details:not([open]) > summary').first().click();
  while (await page.getByRole('checkbox', { checked: true }).count()) await page.getByRole('checkbox', { checked: true }).first().uncheck();
  await expect(page.getByRole('status')).toHaveText('0 needs selected · 0 required');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('No access needs selected.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('No access needs selected.', { exact: false })).toBeVisible();
});

for (const editor of ['needs', 'location']) {
  test(`${editor}: Save and Back honor the return path and reject unsafe paths`, async ({ page }) => {
    for (const [from, expected] of [['/find?care=Imaging', '/find?care=Imaging'], ['//example.org', '/profile'], ['', '/profile']]) {
      for (const action of ['Back', 'Save']) {
        await openRoute(page, `/profile/${editor}${from ? `?from=${encodeURIComponent(from)}` : ''}`);
        await page.getByRole(action === 'Back' ? 'link' : 'button', { name: action, exact: true }).click();
        await page.waitForURL((url) => url.pathname + url.search === expected);
      }
    }
  });
}

test('ZIP validation prevents a bad save; ZIP and radius persist', async ({ page }) => {
  await openRoute(page, '/profile/location');
  const zip = page.getByRole('textbox', { name: 'ZIP code', exact: true });
  await zip.fill('123');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter a 5-digit ZIP code.');
  await expect(zip).toBeFocused();
  await zip.fill('10001');
  await page.getByRole('radio', { name: '50 mi', exact: true }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('This demo covers Oakland-area ZIPs.');
  await expect(zip).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('link', { name: 'ZIP 94612 Within 15 mi' })).toBeVisible();
  await page.getByRole('link', { name: 'ZIP 94612 Within 15 mi' }).click();
  await zip.fill('94607');
  await page.getByRole('radio', { name: '25 mi', exact: true }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('link', { name: 'ZIP 94607 Within 25 mi' })).toBeVisible();
});

for (const [code, explanation] of [[1, 'permission was denied'], [2, 'is unavailable'], [3, 'took too long'], [0, 'cannot use your current location']] as const) {
  test(`GPS failure ${code} explains ZIP fallback`, async ({ page }) => {
    await page.addInitScript((failureCode) => {
      Object.defineProperty(navigator, 'geolocation', { configurable: true, value: failureCode === 0 ? undefined : {
        getCurrentPosition(_success: unknown, failure: (error: { code: number }) => void) { failure({ code: failureCode }); },
      } });
    }, code);
    await openRoute(page, '/profile/location');
    await expect(page.getByRole('status')).toBeEmpty();
    await page.getByRole('button', { name: 'Use my current location', exact: true }).click();
    await expect(page.getByRole('status')).toContainText(explanation);
    await expect(page.getByRole('status')).toContainText('Enter a ZIP code instead');
    await expect(page.getByRole('textbox', { name: 'ZIP code', exact: true })).toBeFocused();
    await page.getByRole('textbox', { name: 'ZIP code', exact: true }).fill('94607');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('link', { name: 'ZIP 94607 Within 15 mi' })).toBeVisible();
  });
}

test('granted GPS is saved, and a later invalid ZIP cannot silently reuse it', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.81, longitude: -122.27 });
  await openRoute(page, '/profile/location');
  await page.getByRole('button', { name: 'Use my current location', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Current location found.');
  await page.getByRole('radio', { name: '10 mi', exact: true }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Current location Within 10 mi' })).toBeVisible();
  const state = await context.storageState();
  const saved = JSON.parse(state.origins.flatMap((origin) => origin.localStorage).find((item) => item.name === 'carefit:profile')!.value);
  expect(saved.location).toEqual({ source: 'gps', label: 'Current location', lat: 37.81, lng: -122.27 });
  await page.getByRole('link', { name: 'Current location Within 10 mi' }).click();
  await expect(page.getByRole('textbox', { name: 'ZIP code', exact: true })).toHaveValue('');
  await page.getByRole('textbox', { name: 'ZIP code', exact: true }).fill('10001');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('This demo covers Oakland-area ZIPs.');
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Current location Within 10 mi' })).toBeVisible();
});

test('optional letter details save, cancel, and survive reload', async ({ page }) => {
  await openRoute(page, '/profile');
  await page.getByRole('button', { name: 'Edit details for letters' }).click();
  await expect(page.getByRole('textbox', { name: 'Name (optional)', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Name (optional)', exact: true }).fill('Alex Rivera');
  await page.getByRole('textbox', { name: 'Email (optional)', exact: true }).fill('alex@example.com');
  await page.getByRole('textbox', { name: 'Phone (optional)', exact: true }).fill('510-555-0101');
  await expectNoSeriousAxeIssues(page);
  await page.getByRole('button', { name: 'Save details', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit details for letters' })).toBeFocused();
  await page.reload();
  await expect(page.getByText('Alex Rivera', { exact: true })).toBeVisible();
  await expect(page.getByText('alex@example.com', { exact: true })).toBeVisible();
  await expect(page.getByText('510-555-0101', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit details for letters' }).click();
  await page.getByRole('textbox', { name: 'Name (optional)', exact: true }).fill('Discard me');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText('Alex Rivera', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit details for letters' }).click();
  for (const field of await page.getByRole('form', { name: 'Details for letters' }).getByRole('textbox').all()) await field.fill('');
  await page.getByRole('button', { name: 'Save details', exact: true }).click();
  await page.reload();
  await expect(page.getByText('Not added', { exact: true })).toHaveCount(3);
});

test('saved letter links and reset restore Maya and clear letters and reports', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [{ origin: baseURL!, localStorage: [
    { name: 'carefit:v', value: '1' },
    { name: 'carefit:profile', value: JSON.stringify({ ...DEMO_PROFILE, needs: [], radius: 50, letter: { name: 'Changed' } }) },
    { name: 'carefit:drafts', value: JSON.stringify({ 'lakeshore-womens-health': { clinicId: 'lakeshore-womens-health', clinicName: "Lakeshore Women's Health", appointmentDate: '2026-11-14', doctor: '', accommodations: [], notes: '', sender: {}, updatedAt: '2026-10-31T12:00:00Z' } }) },
    { name: 'carefit:reports', value: JSON.stringify([{ clinicId: 'lakeshore-womens-health', notes: 'A saved report' }]) },
  ] }] } });
  const page = await context.newPage();
  await openRoute(page, `${baseURL}/profile`);
  const letter = page.getByRole('link', { name: /Lakeshore Women's Health Draft/ });
  await expect(letter).toHaveAttribute('href', '/clinic/lakeshore-womens-health/letter');
  await letter.click();
  await expect(page).toHaveURL(/\/clinic\/lakeshore-womens-health\/letter$/);
  await openRoute(page, `${baseURL}/profile`);
  const reset = page.getByRole('button', { name: 'Reset demo', exact: true });
  await reset.click();
  const dialog = page.getByRole('dialog', { name: 'Reset the demo?' });
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await expectNoSeriousAxeIssues(page);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(reset).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('Changed', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Reset demo', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(reset).toBeFocused();
  await expect(page.locator('.profile-needs-list > li')).toHaveCount(6);
  await expect(page.locator('.profile-needs-list .tag--required')).toHaveCount(3);
  await expect(page.getByText('Maya Johnson', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ZIP 94612 Within 15 mi' })).toBeVisible();
  await expect(page.getByText('No saved letters yet.', { exact: false })).toBeVisible();
  const remaining = (await context.storageState()).origins.flatMap((origin) => origin.localStorage);
  expect(remaining.filter((item) => item.name.startsWith('carefit:'))).toEqual([]);
  await page.reload();
  await expect(page.getByText('Maya Johnson', { exact: true })).toBeVisible();
  await expect(page.getByText('No saved letters yet.', { exact: false })).toBeVisible();
  await context.close();
});

test('keyboard alone edits needs, priorities, location, radius and letter details', async ({ page }) => {
  await openRoute(page, '/profile');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('link', { name: 'Edit access needs' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'What do you need at a visit?', exact: true })).toBeVisible();
  while (await page.locator('details:not([open]) > summary').count()) {
    const summary = page.locator('details:not([open]) > summary').first();
    await tabTo(page, summary);
    await page.keyboard.press('Enter');
  }
  const telehealth = page.getByRole('checkbox', { name: 'Telehealth option', exact: true });
  await tabTo(page, telehealth);
  await page.keyboard.press('Space');
  const priority = page.getByRole('group', { name: 'Telehealth option: how important?', exact: true });
  await tabTo(page, priority.getByRole('radio', { name: 'Required', exact: true }));
  await page.keyboard.press('ArrowRight');
  await expect(priority.getByRole('radio', { name: 'Nice to have' })).toBeChecked();
  await tabTo(page, page.getByRole('button', { name: 'Save', exact: true }));
  await page.keyboard.press('Enter');
  await expect(page.locator('.profile-needs-list > li').filter({ hasText: 'Telehealth option' })).toContainText('Nice to have');
  await tabTo(page, page.getByRole('link', { name: 'ZIP 94612 Within 15 mi' }));
  await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('textbox', { name: 'ZIP code', exact: true }));
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('94607');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: '15 mi', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await tabTo(page, page.getByRole('button', { name: 'Save', exact: true }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'ZIP 94607 Within 25 mi' })).toBeVisible();
  await tabTo(page, page.getByRole('button', { name: 'Edit details for letters' }));
  await page.keyboard.press('Enter');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Keyboard User');
  await tabTo(page, page.getByRole('button', { name: 'Save details', exact: true }));
  await page.keyboard.press('Enter');
  await expect(page.getByText('Keyboard User', { exact: true })).toBeVisible();
});

test('screens reflow at small widths, enlarged text and landscape', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    for (const [route, heading] of [['/profile', 'Profile'], ['/profile/needs', 'What do you need at a visit?'], ['/profile/location', 'Where should we look?']]) {
      await openRoute(page, route);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      if (viewport.width === 320) await page.addStyleTag({ content: 'html { font-size: 200%; }' });
      while (await page.locator('details:not([open]) > summary').count()) await page.locator('details:not([open]) > summary').first().click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (viewport.width === 390) await page.screenshot({ path: testInfo.outputPath(`${route.split('/').pop()}.png`), fullPage: true });
    }
  }
});
