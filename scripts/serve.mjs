// Local demo server: serves demo/ and dist/, and fakes Jellyfin's image API
// (/Items/{id}/Images/{type}) with generated artwork from demo/art.mjs.
//   npm run demo   ->  http://127.0.0.1:8099/
// Listens on loopback only.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scene, poster, logo } from '../demo/art.mjs';
import { BY_ID } from '../demo/data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const PUBLIC = ['demo', 'dist'];
const svgCache = new Map();

function image(id, type, q) {
  const item = BY_ID[id];
  if (!item) return null;
  const key = `${id}/${type}/${q.get('fillWidth') || ''}x${q.get('fillHeight') || ''}`;
  if (svgCache.has(key)) return svgCache.get(key);
  let svg;
  if (type === 'Logo') svg = logo(item);
  else if (type === 'Primary' && item.Type !== 'Episode') svg = poster(item);
  else {
    // Backdrop / Thumb / episode stills: 16:9 scene at the requested size
    const w = Math.min(3840, Math.max(320, Number(q.get('fillWidth') || q.get('maxWidth')) || 1920));
    const h = Math.round(Number(q.get('fillHeight')) || (w * 9) / 16);
    svg = scene(type === 'Backdrop' || item.Type === 'Episode' ? item : { ...item, Id: item.Id + 'thumb' }, w, h);
  }
  svgCache.set(key, svg);
  return svg;
}

export function start(port = Number(process.env.PORT) || 8099) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (code, body, type = 'text/plain; charset=utf-8') => {
      res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(body);
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed');
    if (url.pathname === '/') { res.writeHead(302, { Location: '/demo/' }); return res.end(); }

    const img = url.pathname.match(/^\/demo-server\/Items\/([\w-]+)\/Images\/(Primary|Backdrop|Logo|Thumb)(?:\/\d+)?$/);
    if (img) {
      const svg = image(img[1], img[2], url.searchParams);
      return svg ? send(200, svg, 'image/svg+xml') : send(404, 'No such item');
    }

    let rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
    if (rel.endsWith(sep) || rel === 'demo') rel = join(rel, 'index.html');
    const top = rel.split(sep)[0];
    if (!PUBLIC.includes(top) || rel.includes('..')) return send(404, 'Not found');
    try {
      const body = await readFile(join(root, rel));
      send(200, body, TYPES[extname(rel)] || 'application/octet-stream');
    } catch {
      send(404, 'Not found');
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await start();
  console.log(`Demo: http://127.0.0.1:${server.address().port}/  (?tv or ?mobile for other layouts)`);
}
