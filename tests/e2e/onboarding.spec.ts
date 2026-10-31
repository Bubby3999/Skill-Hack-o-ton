import { expect, test } from '@playwright/test';
import { expectNoSeriousAxeIssues, openRoute } from './helpers';

test('first launch: Welcome -> needs -> location -> Find writes a fresh profile', async ({ page }) => {
  await openRoute(page, '/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a doctor who can actually examine you.');
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
  await expectNoSeriousAxeIssues(page);

  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page).toHaveURL(/\/welcome\/needs$/);
  await expect(page).toHaveTitle('Your access needs · Setup step 1 of 2 · CareFit');
  await expect(page.getByText('Step 1 of 2')).toBeVisible();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Wheelchair-accessible scale', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Accessible restroom', exact: true }).check();
  await page.getByRole('radio', { name: 'Nice to have' }).last().check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/welcome\/location$/);
  await expect(page.getByText('Step 2 of 2')).toBeVisible();
  await expect(page.getByLabel('ZIP code')).toHaveValue('');
  await page.getByRole('button', { name: 'Show clinics near me' }).click();
  await expect(page.getByRole('alert')).toBeVisible(); // ZIP required
  await page.getByLabel('ZIP code').fill('94610');
  await page.getByRole('radio', { name: '10 mi' }).check();
  await page.getByRole('button', { name: 'Show clinics near me' }).click();

  await expect(page).toHaveURL(/\/find$/);
  await expect(page.getByText(/Near\s*94610\s*· within\s*10 mi/)).toBeVisible();
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('carefit:profile')!));
  expect(profile.needs).toEqual([{ key: 'scale', priority: 'required' }, { key: 'restroom', priority: 'nice' }]);
  expect(profile.letter).toEqual({});
  await openRoute(page, '/');
  await expect(page).toHaveURL(/\/find$/);
});

test('setup resumes at the step it was left on, with the picks so far', async ({ page }) => {
  await openRoute(page, '/welcome');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('checkbox', { name: 'Accessible restroom', exact: true }).check();
  await openRoute(page, '/');
  await expect(page).toHaveURL(/\/welcome\/needs$/);
  await expect(page.getByRole('checkbox', { name: 'Accessible restroom', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Continue' }).click();
  await openRoute(page, '/');
  await expect(page).toHaveURL(/\/welcome\/location$/);
  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page.getByRole('checkbox', { name: 'Accessible restroom', exact: true })).toBeChecked();
});

test('skip keeps the demo profile and setup does not come back', async ({ page }) => {
  await openRoute(page, '/welcome');
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page).toHaveURL(/\/find$/);
  await expect(page.getByText(/Near\s*94612/)).toBeVisible();
  await openRoute(page, '/');
  await expect(page).toHaveURL(/\/find$/);

  // Skip setup from a step, after Reset demo brought Welcome back.
  await openRoute(page, '/profile');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset demo' }).click();
  await openRoute(page, '/');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await expect(page).toHaveURL(/\/find$/);
  await expect(page.getByText('Wheelchair scale, Adjustable table, Step-free entrance')).toBeVisible();
});
