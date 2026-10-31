import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Keeps tests offline: map tiles are never fetched. */
export async function blockTiles(page: Page) {
  await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
}

/** axe (WCAG 2.2 AA + best practice). Fails on serious or critical issues. */
export async function expectNoSeriousAxeIssues(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`),
  ).toEqual([]);
}

/** Opens a route and waits for the screen (lazy chunks) to render. */
export async function openRoute(page: Page, path: string) {
  await blockTiles(page);
  await page.goto(path);
  await page.locator('main#main').waitFor();
}
