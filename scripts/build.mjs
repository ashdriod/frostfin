// Builds dist/ from src/.
//   node scripts/build.mjs          write dist/
//   node scripts/build.mjs --check  fail if dist/ is out of date (used in CI)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const check = process.argv.includes('--check');
const repo = (pkg.repository?.url || '').replace(/^git\+/, '').replace(/\.git$/, '');
const banner = `/*! Frostfin v${pkg.version} | ${pkg.license} | ${repo} */\n`;

const cssDir = join(root, 'src/css');
const css = banner + readdirSync(cssDir)
  .filter((f) => f.endsWith('.css'))
  .sort()
  .map((f) => readFileSync(join(cssDir, f), 'utf8').trimEnd() + '\n')
  .join('\n');
const js = banner + readFileSync(join(root, 'src/js/theme.js'), 'utf8').trimEnd() + '\n';

// @import must stay first in a stylesheet (only comments may precede it)
const firstRule = css.replace(/\/\*[\s\S]*?\*\//g, '').trimStart();
if (!firstRule.startsWith('@import')) throw new Error('theme.css: @import is no longer the first rule');

const minCss = (await transform(css, { loader: 'css', minify: true, legalComments: 'inline' })).code;
const minJs = (await transform(js, { loader: 'js', minify: true, target: 'es2017', legalComments: 'inline' })).code;

const out = {
  'theme.css': css,
  'theme.min.css': minCss,
  'theme.js': js,
  'theme.min.js': minJs,
};

const dist = join(root, 'dist');
let stale = [];
for (const [name, body] of Object.entries(out)) {
  const file = join(dist, name);
  if (check) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== body) stale.push(name);
  } else {
    mkdirSync(dist, { recursive: true });
    writeFileSync(file, body);
    console.log(`dist/${name.padEnd(14)} ${(Buffer.byteLength(body) / 1024).toFixed(1).padStart(6)} KB`);
  }
}
if (check) {
  if (stale.length) {
    console.error(`dist/ is out of date (${stale.join(', ')}). Run "npm run build" and commit the result.`);
    process.exit(1);
  }
  console.log(`dist/ is up to date (v${pkg.version}).`);
}
