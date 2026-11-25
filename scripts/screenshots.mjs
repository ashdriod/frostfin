// Renders docs/screenshots/*.jpg from the demo (fictional library).
//   npm run screenshots            all shots
//   npm run screenshots -- home    only shots whose name contains "home"
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { start } from './serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/screenshots');
mkdirSync(outDir, { recursive: true });
const filter = process.argv[2] || '';

const server = await start(0);
const base = `http://127.0.0.1:${server.address().port}/demo/`;
const browser = await chromium.launch();

async function settle(page) {
  await page.waitForSelector('.frostHero-inner .frostHero-actions', { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelectorAll('.frostTileLogo').length > 0 &&
    [...document.images].every((i) => i.complete));
  await page.waitForTimeout(900); // backdrop crossfade
}

async function hoverCard(page, name) {
  const card = page.locator('.homeSectionsContainer .card', { has: page.locator(`.cardText-first a[title="${name}"]`) }).first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await page.waitForFunction((n) => document.querySelector('.frostHero-logo')?.alt === n ||
    document.querySelector('.frostHero-title')?.textContent === n, name);
  await page.waitForTimeout(1000);
}

const shots = [
  { name: 'home-desktop', viewport: { width: 1920, height: 1080 }, run: async (p) => {} },
  { name: 'home-hover', viewport: { width: 1920, height: 1080 }, run: async (p) => {
    await hoverCard(p, 'Neon Tide');
  } },
  { name: 'home-rows', viewport: { width: 1920, height: 1080 }, run: async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.querySelector('.section2').offsetTop - 140));
    await hoverCard(p, 'Saltwater Kings');
    await p.evaluate(() => window.scrollTo(0, document.querySelector('.section1').offsetTop - 40));
    await p.waitForTimeout(500);
  } },
  { name: 'home-tv', query: '?tv', viewport: { width: 1920, height: 1080 }, run: async (p) => {
    await p.locator('.section1 .card').nth(3).focus();
    await p.waitForFunction(() => document.querySelector('.frostHero-logo')?.alt === 'Orbit of Ash');
    await p.waitForTimeout(1000);
  } },
  { name: 'home-mobile', query: '?mobile', viewport: { width: 390, height: 844 }, scale: 3, mobile: true, run: async (p) => {} },
];

for (const s of shots) {
  if (!s.name.includes(filter)) continue;
  const ctx = await browser.newContext({
    viewport: s.viewport, deviceScaleFactor: s.scale || 1, isMobile: !!s.mobile, hasTouch: !!s.mobile,
    colorScheme: 'dark', reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.error(`[${s.name}] page error:`, e.message); process.exitCode = 1; });
  await page.goto(base + (s.query || ''), { waitUntil: 'networkidle' });
  await settle(page);
  await s.run(page);
  const file = join(outDir, `${s.name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
  console.log('wrote', file.replace(root + '/', ''));
  await ctx.close();
}

await browser.close();
server.close();
