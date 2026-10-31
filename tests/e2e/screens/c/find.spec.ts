import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectNoSeriousAxeIssues, openRoute } from '../../helpers';

const MAYA_QUERY =
  'care=OB-GYN&radius=15&sort=best&needs=scale.r%2Cexam-table.r%2Centrance.r%2Clift.n%2Crestroom.n%2Cextended-time.n';
const IMAGING_5 = MAYA_QUERY.replace('OB-GYN', 'Imaging').replace('radius=15', 'radius=5');

const cardTitles = (page: Page) => page.locator('.clinic-card__title').allTextContents();

test('Find: Show matches lists Maya at OB-GYN in order with the mockup distances', async ({ page }) => {
  await openRoute(page, '/find');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a clinic that fits');
  await expect(page.getByRole('button', { name: 'OB-GYN' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Show matches' }).click();
  await expect(page).toHaveURL(/\/results\?care=OB-GYN&radius=15/);
  await expect(page.getByRole('status')).toHaveText('4 clinics within 15 mi · best match first');
  expect(await cardTitles(page)).toEqual([
    "Lakeshore Women's Health",
    'Fruitvale OB-GYN Associates',
    'Bayview Medical Center',
    "Grand Avenue Women's Clinic",
  ]);
  await expect(page.locator('.clinic-card__distance')).toHaveText(['4.8 mi', '1.1 mi', '7.9 mi', '0.6 mi']);
  await expect(page.locator('.fit-badge')).toHaveText(['Strong fit', 'Possible fit', 'Possible fit', 'Poor fit']);
  await expect(page.locator('.fit__count')).toHaveText(['5 of 6 needs', '4 of 6 needs', '3 of 6 needs', '2 of 6 needs']);
  await expectNoSeriousAxeIssues(page);
});

test('Find: free text is normalized ("ob gyn") and the chips follow the input', async ({ page }) => {
  await openRoute(page, '/find');
  await page.getByLabel('Type of care').fill('ob gyn');
  await expect(page.getByRole('button', { name: 'OB-GYN' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Imaging' }).click();
  await expect(page.getByLabel('Type of care')).toHaveValue('Imaging');
});

test('List: Nearest sort reorders and updates the live count; same URL gives the same list', async ({ page }) => {
  await openRoute(page, `/results?${MAYA_QUERY}`);
  const best = await cardTitles(page);
  await page.getByLabel('Sort by').selectOption('nearest');
  await expect(page.getByRole('status')).toHaveText('4 clinics within 15 mi · nearest first');
  expect((await cardTitles(page))[0]).toBe("Grand Avenue Women's Clinic");
  await page.goto(`/results?${MAYA_QUERY}`);
  await expect(page.locator('.clinic-card')).toHaveCount(4);
  expect(await cardTitles(page)).toEqual(best);
});

test('List: the filters panel changes this search only', async ({ page }) => {
  await openRoute(page, `/results?${MAYA_QUERY}`);
  await page.getByRole('button', { name: /Filters/ }).click();
  await expectNoSeriousAxeIssues(page);
  await page.getByText('Mobility', { exact: false }).filter({ hasText: 'selected' }).click();
  await expectNoSeriousAxeIssues(page);
  await page.getByLabel('Height-adjustable exam table').click();
  await page.getByLabel('Patient lift or lift-compatible space').click();
  await expect(page).toHaveURL(/needs=scale\.r%2Centrance\.r%2Crestroom\.n%2Cextended-time\.n/);
  await page.locator('.segmented--grid label', { hasText: /^5 mi$/ }).click();
  await expect(page.getByRole('status')).toContainText('within 5 mi');
  // Profile is unchanged.
  await page.goto('/find');
  await expect(page.locator('.need-summary')).toContainText('Adjustable table');
});

test('List: a need set in the profile changes the results', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('carefit:v', '1');
    localStorage.setItem(
      'carefit:profile',
      JSON.stringify({
        needs: [{ key: 'lift', priority: 'required' }],
        location: { source: 'zip', zip: '94612', lat: 37.807709, lng: -122.266857, label: 'ZIP 94612' },
        radius: 15,
        letter: {},
      }),
    );
  });
  await openRoute(page, '/find');
  await page.getByRole('button', { name: 'Show matches' }).click();
  await expect(page.locator('.fit-badge').first()).toHaveText('Possible fit');
  await expect(page.locator('.fit__count').first()).toHaveText('0 of 1 needs');
});

test('Empty: imaging within 5 mi, partial matches, then widen to 15 mi', async ({ page }) => {
  await openRoute(page, `/results?${IMAGING_5}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Imaging near 94612');
  await expect(page.getByRole('status')).toHaveText('0 clinics within 5 mi meet your required needs');
  await expect(page.getByRole('heading', { name: 'No full matches within 5 mi' })).toBeVisible();
  await expect(page.locator('.lead')).toContainText('2 imaging centers nearby are missing a required need: wheelchair-accessible scale');
  await expectNoSeriousAxeIssues(page);

  await page.getByRole('button', { name: 'Show the 2 partial matches' }).click();
  await expect(page.locator('.clinic-card')).toHaveCount(2);
  await expect(page.locator('.fit-badge').first()).toHaveText('Poor fit');

  await page.goto(`/results?${IMAGING_5}`);
  await page.getByRole('button', { name: 'Search within 15 mi instead' }).click();
  await expect(page.getByRole('status')).toContainText('within 15 mi');
  expect(await page.locator('.clinic-card').count()).toBeGreaterThan(0);
});

test('Empty: nothing of that type in range offers a wider radius', async ({ page }) => {
  await openRoute(page, '/results?care=Cardiology&radius=5&needs=');
  await expect(page.getByRole('heading', { name: /No cardiology clinics within 5 mi/ })).toBeVisible();
  await page.getByRole('button', { name: /Search within 15 mi/ }).click();
  await expect(page.getByRole('status')).toHaveText('0 clinics within 15 mi');
});

test('Keyboard only: Find -> list -> map pins and sheet', async ({ page }) => {
  await openRoute(page, '/find');
  await page.getByRole('button', { name: 'Show matches' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('4 clinics within 15 mi · best match first');

  await page.getByRole('link', { name: 'Map' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/results\/map\?care=OB-GYN/);
  await expect(page.getByRole('status')).toHaveText('4 clinics within 15 mi · best match first');

  const pin2 = page.getByRole('button', { name: "2, Fruitvale OB-GYN Associates, possible fit, 1.1 miles" });
  await expect(page.getByRole('button', { name: "1, Lakeshore Women's Health, strong fit, 4.8 miles" })).toHaveAttribute('aria-pressed', 'true');
  await pin2.focus();
  await page.keyboard.press('Enter');
  await expect(pin2).toHaveAttribute('aria-pressed', 'true');
  await expect(pin2).toBeFocused();
  await expect(page.locator('.sheet h3')).toHaveText('Fruitvale OB-GYN Associates');
  await expect(page.locator('.sheet .rank')).toHaveText('2');

  await page.getByRole('button', { name: 'Next clinic' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.sheet h3')).toHaveText('Bayview Medical Center');
  await expect(page.locator('#sheet-h')).toHaveText('Clinic 3 of 4');
  await page.getByRole('button', { name: 'Previous clinic' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.sheet h3')).toHaveText('Fruitvale OB-GYN Associates');
  await expect(page.getByText('© OpenStreetMap contributors')).toBeVisible();
  await expectNoSeriousAxeIssues(page);
});

test('Map: shows the empty state for imaging within 5 mi', async ({ page }) => {
  await openRoute(page, `/results/map?${IMAGING_5}`);
  await expect(page.getByRole('heading', { name: 'No full matches within 5 mi' })).toBeVisible();
  await expectNoSeriousAxeIssues(page);
});

test('Card "Add your needs" returns to results without the stale needs list', async ({ page }) => {
  await openRoute(page, '/results?care=OB-GYN&radius=15&sort=best&needs=');
  const link = page.getByRole('link', { name: 'Add your needs' }).first();
  await expect(link).toHaveAttribute('href', `/profile/needs?from=${encodeURIComponent('/results?care=OB-GYN&radius=15&sort=best')}`);
});

test('Map: Next wraps from the last clinic to the first and keeps focus', async ({ page }) => {
  await openRoute(page, '/results/map?care=OB-GYN&radius=15&sort=best');
  const next = page.getByRole('button', { name: 'Next clinic' });
  for (let i = 0; i < 3; i++) await next.click();
  await expect(page.locator('#sheet-h')).toHaveText('Clinic 4 of 4');
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#sheet-h')).toHaveText('Clinic 1 of 4');
  await expect(next).toBeFocused();
  await page.getByRole('button', { name: 'Previous clinic' }).click();
  await expect(page.locator('#sheet-h')).toHaveText('Clinic 4 of 4');
});

test('Map: center button names the ZIP for a ZIP profile', async ({ page }) => {
  await openRoute(page, '/results/map?care=OB-GYN');
  await page.getByRole('button', { name: 'Center on ZIP 94612' }).click();
  await expect(page.getByText('Centered on ZIP 94612.')).toBeVisible();
});

test('Map: a GPS profile recenters on a fresh position and saves it', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.8, longitude: -122.27 });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('carefit:v', '1');
    localStorage.setItem('carefit:profile', JSON.stringify({
      needs: [{ key: 'scale', priority: 'required' }], radius: 15, letter: {},
      location: { source: 'gps', label: 'Current location', lat: 37.81, lng: -122.26 },
    }));
  });
  await openRoute(page, '/results/map?care=OB-GYN');
  await page.getByRole('button', { name: 'Center on my location' }).click();
  await expect(page.getByText('Centered on your current location. Distances are updated.')).toBeVisible();
  const loc = await page.evaluate(() => JSON.parse(localStorage.getItem('carefit:profile')!).location);
  expect(loc).toMatchObject({ source: 'gps', lat: 37.8, lng: -122.27 });
});
