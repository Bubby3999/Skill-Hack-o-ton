import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { expectNoSeriousAxeIssues, openRoute } from '../../helpers';
import { SAMPLE_CLINIC } from '../../routes';

const detail = `/clinic/${SAMPLE_CLINIC}`;

async function tabTo(page: Page, target: Locator) {
  for (let tabs = 0; tabs < 80; tabs++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}

test('Lakeshore renders all clinic data, fit, sources, doctors, hours and all 19 features', async ({ page }) => {
  await openRoute(page, detail);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Lakeshore Women's Health");
  await expect(page.getByText('OB-GYN clinic', { exact: true })).toBeVisible();
  await expect(page.getByText('Specialties: OB-GYN')).toBeVisible();
  await expect(page.getByText('1420 Harbor View Ave, Suite 200, Oakland, CA 94610')).toBeVisible();
  await expect(page.getByText('4.8 mi away')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Call', exact: true })).toHaveAttribute('href', 'tel:+15105550142');
  await expect(page.getByRole('link', { name: 'Directions', exact: true })).toHaveAttribute('href', /to=37\.86091%2C-122\.2103/);
  await expect(page.getByRole('link', { name: 'Website', exact: true })).toHaveAttribute('href', 'https://lakeshore.example.org');
  await expect(page.getByText('Phone: (510) 555-0142')).toBeVisible();
  await expect(page.getByText('Website: https://lakeshore.example.org')).toBeVisible();
  await expect(page.getByText('Strong fit', { exact: true })).toBeVisible();
  await expect(page.getByText('5 of 6 needs', { exact: true })).toBeVisible();
  await expect(page.getByText('Has all 3 of your required needs and 2 of 3 nice-to-haves. Unknown: Patient lift.')).toBeVisible();
  const required = page.getByRole('list', { name: 'Required · 3', exact: true });
  await expect(required.locator('.status')).toHaveText(['Verified', 'Verified', 'Verified']);
  await expect(required.getByText('Sep 18, 2026 · Clinic phone call')).toHaveCount(2);
  const nice = page.getByRole('list', { name: 'Nice to have · 3', exact: true });
  await expect(nice.locator('.status')).toHaveText(['Unknown', 'Verified', 'Patient-reported']);
  await expect(nice.getByText('Oct 2, 2026 · 2 patient reports')).toBeVisible();
  await expect(page.getByText('Dr. Ana Reyes', { exact: true })).toBeVisible();
  await expect(page.getByText('Dr. Priya Natarajan', { exact: true })).toBeVisible();
  await expect(page.getByText('Jordan Lee, CNM', { exact: true })).toBeVisible();
  await expect(page.getByText('Mon – Fri', { exact: true })).toBeVisible();
  await expect(page.getByText('8 am – 6 pm', { exact: true })).toBeVisible();
  await expect(page.getByText('9 am – 1 pm', { exact: true })).toBeVisible();
  await expect(page.getByText('Closed', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Report a gap' })).toHaveCount(0);
  const other = page.locator('details');
  await expect(other).not.toHaveAttribute('open');
  await expect(other.locator('summary')).toContainText('13');
  await other.locator('summary').click();
  await expect(page.locator('.feature-row')).toHaveCount(19);
  await expect(other.locator('.status--missing')).toHaveText('Not available');
  await expect(other.getByText('No information yet. Ask when you book.')).toHaveCount(9);
  await expectNoSeriousAxeIssues(page);
});

test('two actions reach a letter, with default requests driven by clinic status', async ({ page }) => {
  await openRoute(page, detail);
  await page.getByRole('link', { name: 'Request accommodations' }).click();
  await expect(page.getByLabel('Your name')).toHaveValue('Maya Johnson');
  await expect(page.getByLabel('Email for replies')).toHaveValue('maya.j@example.com');
  await expect(page.getByRole('checkbox')).toHaveCount(6);
  await expect(page.getByRole('checkbox', { name: /patient lift/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /wheelchair-accessible scale/ })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Extra appointment time/ })).not.toBeChecked();
  await page.getByRole('button', { name: 'Preview letter' }).click();
  await expect(page).toHaveURL(`${detail}/letter`);
  await expect(page.locator('article')).toContainText('A patient lift');
  await expect(page.getByRole('status').filter({ hasText: 'Draft saved' })).toBeVisible();
});

test('every form field is editable and drafts restore after reload and Edit request', async ({ page }) => {
  await openRoute(page, `${detail}/request`);
  await page.getByRole('textbox', { name: 'Clinic', exact: true }).fill('Lakeshore appointment team');
  await page.getByLabel('Appointment date').fill('2026-11-14');
  await expect(page.locator('#clinic-doctors option')).toHaveCount(3);
  await page.getByLabel('Doctor', { exact: false }).fill('Dr. Ana Reyes');
  await page.getByRole('checkbox', { name: /wheelchair-accessible scale/ }).check();
  await page.getByLabel('Anything else?').fill('I use a power wheelchair and need help transferring.');
  await page.getByLabel('Your name').fill('Maya J.');
  await page.getByLabel('Email for replies').fill('maya@example.com');
  await page.getByLabel('Phone', { exact: false }).fill('(510) 555-0198');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Clinic', exact: true })).toHaveValue('Lakeshore appointment team');
  await expect(page.getByLabel('Appointment date')).toHaveValue('2026-11-14');
  await expect(page.getByLabel('Doctor', { exact: false })).toHaveValue('Dr. Ana Reyes');
  await expect(page.getByRole('checkbox', { name: /wheelchair-accessible scale/ })).toBeChecked();
  await expect(page.getByLabel('Anything else?')).toHaveValue('I use a power wheelchair and need help transferring.');
  await expect(page.getByLabel('Your name')).toHaveValue('Maya J.');
  await expect(page.getByLabel('Email for replies')).toHaveValue('maya@example.com');
  await expect(page.getByLabel('Phone', { exact: false })).toHaveValue('(510) 555-0198');
  await page.getByRole('button', { name: 'Preview letter' }).click();
  await expect(page.locator('article')).toContainText('Lakeshore appointment team');
  await expect(page.locator('article')).toContainText('November 14, 2026');
  await expect(page.locator('article')).toContainText('Maya J.');
  await page.reload();
  await expect(page.locator('article')).toContainText('I use a power wheelchair');
  await page.getByRole('link', { name: 'Edit request' }).click();
  await expect(page.getByLabel('Your name')).toHaveValue('Maya J.');
  await expect(page.getByLabel('Appointment date')).toHaveValue('2026-11-14');
});

test('validation announces errors, marks fields, focuses summary, and permits correction', async ({ page }) => {
  await openRoute(page, `${detail}/request`);
  await page.getByRole('textbox', { name: 'Clinic', exact: true }).fill('');
  await page.getByLabel('Email for replies').fill('bad-email');
  await page.getByRole('button', { name: 'Preview letter' }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Clinic', exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Email for replies')).toHaveAttribute('aria-invalid', 'true');
  await expectNoSeriousAxeIssues(page);
  await page.getByRole('link', { name: 'Enter the clinic name.' }).click();
  await expect(page.getByRole('textbox', { name: 'Clinic', exact: true })).toBeFocused();
  await page.keyboard.type('Lakeshore');
  await page.getByLabel('Email for replies').fill('');
  await page.getByRole('button', { name: 'Preview letter' }).click();
  await expect(page).toHaveURL(`${detail}/letter`);
});

test('Copy, Share fallback, Email and Print use the full letter', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    window.print = () => { document.documentElement.dataset.printCalled = 'true'; };
  });
  await openRoute(page, `${detail}/letter`);
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Letter copied.' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Section 504');
  expect(copied).toContain('Not legal advice.');
  const mailto = new URL((await page.getByRole('link', { name: 'Email', exact: true }).getAttribute('href'))!);
  expect(mailto.protocol).toBe('mailto:');
  expect(mailto.searchParams.get('body')).toBe(copied);
  expect(mailto.searchParams.get('subject')).toContain('Disability accommodations');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Sharing is unavailable. Letter copied.' })).toBeVisible();
  await page.getByRole('button', { name: 'Print / PDF', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-print-called', 'true');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('article')).toBeVisible();
  await expect(page.getByText('Not legal advice.', { exact: true }).last()).toBeVisible();
  await expect(page.locator('.dock')).toBeHidden();
  await expect(page.locator('header')).toBeHidden();
});

test('clipboard failure is announced and a failed share falls back to Copy', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } });
    Object.defineProperty(navigator, 'share', { configurable: true, value: () => Promise.reject(new Error('Unavailable')) });
  });
  await openRoute(page, `${detail}/letter`);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not copy.');
});

test('keyboard alone traverses clinic, disclosure, form and letter actions', async ({ page }) => {
  await openRoute(page, detail);
  await tabTo(page, page.getByRole('link', { name: 'Call', exact: true }));
  await tabTo(page, page.getByRole('link', { name: 'Directions', exact: true }));
  await tabTo(page, page.getByRole('link', { name: 'Website', exact: true }));
  await tabTo(page, page.locator('summary'));
  await page.keyboard.press('Enter');
  await expect(page.locator('details')).toHaveAttribute('open');
  await tabTo(page, page.getByRole('link', { name: 'Request accommodations' }));
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await tabTo(page, page.getByLabel('Doctor', { exact: false }));
  await page.keyboard.type('Dr. Ana Reyes');
  await tabTo(page, page.getByRole('checkbox', { name: /wheelchair-accessible scale/ }));
  await page.keyboard.press('Space');
  await tabTo(page, page.getByLabel('Anything else?'));
  await page.keyboard.type('Please allow extra transfer time.');
  await tabTo(page, page.getByRole('button', { name: 'Preview letter' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your letter');
  await expect(page.locator('article')).toContainText('Dr. Ana Reyes');
  await expect(page.locator('article')).toContainText('Please allow extra transfer time.');
  for (const name of ['Copy', 'Share', 'Print / PDF']) {
    await tabTo(page, page.getByRole('button', { name, exact: true }));
  }
  await tabTo(page, page.getByRole('link', { name: 'Email', exact: true }));
  await tabTo(page, page.getByRole('link', { name: 'Edit request' }));
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Anything else?')).toHaveValue('Please allow extra transfer time.');
});

test('unknown clinic ids have a clear Find action on every clinic route', async ({ page }) => {
  for (const suffix of ['', '/request', '/letter']) {
    await openRoute(page, `/clinic/no-such-clinic${suffix}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clinic not found');
    await expect(page.getByRole('link', { name: 'Find a clinic' })).toHaveAttribute('href', '/find');
  }
});

test('small screens and 200% text keep all three screens within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const suffix of ['', '/request', '/letter']) {
    await openRoute(page, `${detail}${suffix}`);
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
