// Renders public/icon*.svg to the PNG icons with Playwright's Chromium. Run: npm run icons
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const jobs = [
  ['public/icon.svg', 'public/icons/icon-192.png', 192],
  ['public/icon.svg', 'public/icons/icon-512.png', 512],
  ['public/icon-maskable.svg', 'public/icons/maskable-512.png', 512],
  ['public/icon-maskable.svg', 'public/icons/apple-180.png', 180], // iOS rounds the corners itself
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [src, out, size] of jobs) {
  const svg = readFileSync(src, 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  writeFileSync(out, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } }));
  console.log('wrote', out);
}
await browser.close();
