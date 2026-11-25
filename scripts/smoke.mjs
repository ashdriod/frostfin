// Smoke test: loads the demo with dist/theme.css + dist/theme.js in Chromium
// and checks the things users rely on. Also checks the theme talks to no host
// other than the server and the two documented font hosts.
import { chromium } from 'playwright';
import { start } from './serve.mjs';

const ALLOWED_HOSTS = new Set(['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com']);
const server = await start(0);
const base = `http://127.0.0.1:${server.address().port}/demo/`;
const browser = await chromium.launch();
let failed = 0;

function check(name, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${!ok && detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
}

for (const layout of ['', '?tv', '?mobile']) {
  const label = layout || 'desktop';
  const page = await browser.newPage({ viewport: layout === '?mobile' ? { width: 390, height: 844 } : { width: 1600, height: 900 } });
  const errors = [];
  const hosts = new Set();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (r) => hosts.add(new URL(r.url()).hostname));

  await page.goto(base + layout, { waitUntil: 'networkidle' });
  const heroOk = await page.waitForSelector('.frostHero-inner .frostHero-play', { timeout: 10000 }).then(() => true, () => false);
  check(`[${label}] Featured hero renders`, heroOk);

  const r = await page.evaluate(() => ({
    heroTitle: document.querySelector('.frostHero-logo')?.alt || document.querySelector('.frostHero-title')?.textContent,
    overview: !!document.querySelector('.frostHero-overview')?.textContent,
    ambient: document.documentElement.classList.contains('frost-ambient-on') && !!document.querySelector('.frostAmbient-img.is-visible'),
    myMediaHidden: getComputedStyle(document.querySelector('.section0')).display === 'none',
    links: [...document.querySelectorAll('.homeSectionsContainer a.sectionTitleTextButton')].map((a) => a.getAttribute('href')),
    tileLogos: document.querySelectorAll('.section1 .frostTileLogo').length,
    hires: document.querySelectorAll('.section1 [data-frost-hires]').length,
    fabVisible: getComputedStyle(document.querySelector('.section1 .cardOverlayFab-primary')).opacity === '1',
  }));
  check(`[${label}] hero shows the first Continue Watching item`, r.heroTitle === 'The Glass Meridian', r.heroTitle);
  check(`[${label}] hero has a summary`, r.overview);
  check(`[${label}] ambient backdrop is shown`, r.ambient);
  check(`[${label}] "My Media" row is hidden`, r.myMediaHidden);
  check(`[${label}] "See All" links open the full library (tab=0)`, r.links.length === 2 && r.links.every((h) => h.includes('tab=0')), r.links.join(' '));
  check(`[${label}] Continue Watching tiles get title logos`, r.tileLogos === 5, String(r.tileLogos));
  check(`[${label}] Continue Watching artwork is re-requested at display size`, r.hires === 5, String(r.hires));
  check(`[${label}] tile play button is visible`, r.fabVisible);

  if (!layout) {
    await page.locator('.section2 .card').nth(5).hover();
    const followed = await page.waitForFunction(() => document.querySelector('.frostHero-logo')?.alt === 'Saltwater Kings', null, { timeout: 5000 }).then(() => true, () => false);
    check('[desktop] hero follows the hovered card', followed);
    await page.click('.frostHero-btn[title="Favorite"]');
    const pressed = await page.getAttribute('.frostHero-btn[title="Favorite"]', 'aria-pressed');
    check('[desktop] favorite button toggles', pressed === 'false', pressed); // Saltwater Kings starts as a favorite
  }

  // A hostile item name must render as text, never as markup
  const xss = await page.evaluate(async () => {
    const it = Object.values(window.ApiClient).length && { Id: 'x', Name: '<img src=x onerror="window.__pwned=1">', Overview: '<b>bold</b>', ImageTags: {}, UserData: {} };
    const orig = window.ApiClient.getItem;
    window.ApiClient.getItem = () => Promise.resolve(it);
    const card = document.querySelector('.section2 .card');
    card.setAttribute('data-id', 'x"]); body{} [data-x="');
    card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 900));
    window.ApiClient.getItem = orig;
    return { pwned: !!window.__pwned, title: document.querySelector('.frostHero-title')?.textContent, boldTags: document.querySelectorAll('.frostHero-overview b').length };
  });
  check(`[${label}] server text is never parsed as HTML`, !xss.pwned && xss.boldTags === 0 && xss.title?.startsWith('<img'), JSON.stringify(xss));

  check(`[${label}] no script errors`, errors.length === 0, errors.join(' | '));
  const unexpected = [...hosts].filter((h) => !ALLOWED_HOSTS.has(h));
  check(`[${label}] no requests to unexpected hosts`, unexpected.length === 0, unexpected.join(', '));
  await page.close();
}

await browser.close();
server.close();
if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
