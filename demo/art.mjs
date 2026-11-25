// Procedural artwork for the demo server: every backdrop, poster and title
// logo is drawn here as SVG from a seed, so the screenshots contain no real
// film artwork. Deterministic: the same item always gets the same picture.

function rng(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// A ridge line across the frame, as a closed path down to the bottom.
function ridge(r, w, h, y, amp, steps, jag = 1) {
  let d = `M0 ${h} L0 ${y}`;
  let cur = y;
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * w;
    cur = y + (r() - 0.5) * amp * 2 * jag + Math.sin(i * 0.9 + r()) * amp * 0.5;
    d += ` L${x.toFixed(1)} ${cur.toFixed(1)}`;
  }
  return d + ` L${w} ${h} Z`;
}

function smoothHill(r, w, h, y, amp, waves) {
  let d = `M0 ${h} L0 ${y}`;
  const n = 48;
  const ph = r() * 6;
  for (let i = 1; i <= n; i++) {
    const x = (i / n) * w;
    const yy = y + Math.sin((i / n) * Math.PI * waves + ph) * amp + Math.sin((i / n) * Math.PI * waves * 2.3 + ph * 2) * amp * 0.3;
    d += ` L${x.toFixed(1)} ${yy.toFixed(1)}`;
  }
  return d + ` L${w} ${h} Z`;
}

function stars(r, w, h, n, maxY) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const rad = r() < 0.92 ? 0.6 + r() * 0.9 : 1.6 + r() * 1.2;
    s += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * maxY).toFixed(0)}" r="${rad.toFixed(1)}" fill="#fff" opacity="${(0.25 + r() * 0.7).toFixed(2)}"/>`;
  }
  return s;
}

const SCENES = {
  aurora(r, w, h) {
    const sky = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02040c"/><stop offset=".55" stop-color="#071a2e"/><stop offset="1" stop-color="#0d2f3f"/></linearGradient>`;
    let bands = '';
    for (let i = 0; i < 4; i++) {
      const y = h * (0.18 + i * 0.07);
      const col = ['#3dffa8', '#29e0c2', '#7b6cff', '#3dffa8'][i];
      let d = `M${-w * 0.1} ${y}`;
      for (let k = 1; k <= 6; k++) d += ` Q${(k - 0.5) * w / 5} ${y + (r() - 0.5) * h * 0.25} ${k * w / 5} ${y + (r() - 0.5) * h * 0.12}`;
      bands += `<path d="${d}" stroke="${col}" stroke-width="${h * (0.05 + r() * 0.06)}" fill="none" opacity="${0.35 + r() * 0.3}" filter="url(#blur)"/>`;
    }
    return {
      defs: sky,
      body: `<rect width="${w}" height="${h}" fill="url(#sky)"/>${stars(r, w, h, 220, h * 0.6)}${bands}
        <path d="${ridge(r, w, h, h * 0.68, h * 0.06, 14)}" fill="#0b2433"/>
        <path d="${smoothHill(r, w, h, h * 0.8, h * 0.03, 3)}" fill="#cfe6ee" opacity=".9"/>
        <path d="${smoothHill(r, w, h, h * 0.88, h * 0.02, 2)}" fill="#8fb4c4"/>`,
    };
  },
  mountains(r, w, h) {
    const sunX = w * (0.62 + r() * 0.12), sunY = h * 0.5;
    return {
      defs: `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1036"/><stop offset=".45" stop-color="#b5476b"/><stop offset=".7" stop-color="#ffb06b"/><stop offset="1" stop-color="#ffe0a8"/></linearGradient>
        <radialGradient id="sun"><stop offset="0" stop-color="#fff6d8"/><stop offset=".25" stop-color="#ffd58a" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>`,
      body: `<rect width="${w}" height="${h}" fill="url(#sky)"/>
        <circle cx="${sunX}" cy="${sunY}" r="${h * 0.45}" fill="url(#sun)"/>
        <circle cx="${sunX}" cy="${sunY}" r="${h * 0.06}" fill="#fff4d6"/>
        <path d="${ridge(r, w, h, h * 0.52, h * 0.09, 9, 1.4)}" fill="#8a3f5c" opacity=".75"/>
        <path d="${ridge(r, w, h, h * 0.62, h * 0.08, 12, 1.2)}" fill="#5b2648"/>
        <path d="${ridge(r, w, h, h * 0.74, h * 0.06, 16)}" fill="#331735"/>
        <path d="${ridge(r, w, h, h * 0.86, h * 0.04, 22)}" fill="#160a1c"/>`,
    };
  },
  city(r, w, h) {
    let b = '', lights = '';
    let x = -20;
    while (x < w) {
      const bw = 40 + r() * 110, bh = h * (0.18 + r() * 0.5);
      const near = r() < 0.5;
      b += `<rect x="${x.toFixed(0)}" y="${(h - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${near ? '#0a0716' : '#15102b'}"/>`;
      for (let wy = h - bh + 14; wy < h - 10; wy += 18) {
        for (let wx = x + 8; wx < x + bw - 10; wx += 14) {
          if (r() < 0.22) lights += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="9" fill="${r() < 0.7 ? '#ffd38a' : '#7ff0ff'}" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
        }
      }
      x += bw + 4;
    }
    return {
      defs: `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05030f"/><stop offset=".6" stop-color="#2a0f4a"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient>
        <radialGradient id="glow" cx=".7" cy=".75" r=".6"><stop offset="0" stop-color="#ff4fa3" stop-opacity=".55"/><stop offset="1" stop-color="#ff4fa3" stop-opacity="0"/></radialGradient>`,
      body: `<rect width="${w}" height="${h}" fill="url(#sky)"/>${stars(r, w, h, 80, h * 0.4)}
        <rect width="${w}" height="${h}" fill="url(#glow)"/>
        <circle cx="${w * 0.74}" cy="${h * 0.3}" r="${h * 0.08}" fill="#ffe6f3" opacity=".85"/>${b}${lights}
        <rect y="${h * 0.93}" width="${w}" height="${h * 0.07}" fill="#05030a"/>`,
    };
  },
  ocean(r, w, h) {
    const sunX = w * (0.66 + r() * 0.1), hz = h * 0.58;
    let shimmer = '';
    for (let i = 0; i < 60; i++) {
      const y = hz + 6 + Math.pow(r(), 1.6) * (h - hz);
      const len = 20 + r() * 120 * ((y - hz) / (h - hz) + 0.3);
      shimmer += `<rect x="${(sunX - len / 2 + (r() - 0.5) * 160 * ((y - hz) / (h - hz) + 0.4)).toFixed(0)}" y="${y.toFixed(0)}" width="${len.toFixed(0)}" height="${(2 + r() * 3).toFixed(1)}" rx="2" fill="#ffe2b0" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>`;
    }
    return {
      defs: `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1d3a"/><stop offset=".7" stop-color="#e2876a"/><stop offset="1" stop-color="#ffcf99"/></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26406a"/><stop offset="1" stop-color="#050b18"/></linearGradient>
        <radialGradient id="sun"><stop offset="0" stop-color="#fff2d4"/><stop offset=".3" stop-color="#ffc37a" stop-opacity=".7"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>`,
      body: `<rect width="${w}" height="${hz}" fill="url(#sky)"/>
        <circle cx="${sunX}" cy="${hz - h * 0.04}" r="${h * 0.32}" fill="url(#sun)"/>
        <circle cx="${sunX}" cy="${hz - h * 0.03}" r="${h * 0.055}" fill="#fff2d6"/>
        <rect y="${hz}" width="${w}" height="${h - hz}" fill="url(#sea)"/>${shimmer}
        <path d="M${w * 0.08} ${hz} l${w * 0.05} -${h * 0.05} l${w * 0.03} ${h * 0.05}Z" fill="#1a1a2e" opacity=".6"/>`,
    };
  },
  desert(r, w, h) {
    const sunX = w * (0.68 + r() * 0.1);
    return {
      defs: `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1408"/><stop offset=".5" stop-color="#c2521c"/><stop offset="1" stop-color="#ffb25b"/></linearGradient>
        <radialGradient id="sun"><stop offset="0" stop-color="#fff0c4"/><stop offset=".22" stop-color="#ffcf6e"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>`,
      body: `<rect width="${w}" height="${h}" fill="url(#sky)"/>
        <circle cx="${sunX}" cy="${h * 0.46}" r="${h * 0.42}" fill="url(#sun)"/>
        <path d="${smoothHill(r, w, h, h * 0.62, h * 0.05, 2)}" fill="#a2421a"/>
        <path d="${smoothHill(r, w, h, h * 0.72, h * 0.06, 1.6)}" fill="#7a2c12"/>
        <path d="${smoothHill(r, w, h, h * 0.84, h * 0.05, 1.2)}" fill="#4a1909"/>
        <path d="M${w * 0.2} ${h * 0.86} v-${h * 0.16} m0 ${h * 0.06} h-${w * 0.015} v-${h * 0.05} m${w * 0.015} ${h * 0.02} h${w * 0.014} v-${h * 0.07}" stroke="#2a0d04" stroke-width="${w * 0.008}" stroke-linecap="round" fill="none"/>`,
    };
  },
  forest(r, w, h) {
    let layers = '';
    const cols = ['#5f7f78', '#3e5c58', '#26403f', '#142624'];
    cols.forEach((c, li) => {
      const base = h * (0.55 + li * 0.12);
      let trees = '';
      for (let x = -30; x < w + 30; x += 18 + r() * 30) {
        const th = h * (0.12 + r() * 0.12 + li * 0.04), tw = th * 0.32;
        trees += `<path d="M${x.toFixed(0)} ${(base - th).toFixed(0)} L${(x + tw).toFixed(0)} ${base.toFixed(0)} L${(x - tw).toFixed(0)} ${base.toFixed(0)}Z"/>`;
      }
      layers += `<g fill="${c}">${trees}<rect y="${base - 1}" width="${w}" height="${h - base + 1}"/></g>
        <rect y="${base - h * 0.08}" width="${w}" height="${h * 0.1}" fill="#c9d8cf" opacity="${0.16 - li * 0.03}" filter="url(#blur)"/>`;
    });
    return {
      defs: `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2b2f"/><stop offset=".6" stop-color="#8ea79c"/><stop offset="1" stop-color="#d8e2d0"/></linearGradient>
        <radialGradient id="moon" cx=".72" cy=".28" r=".35"><stop offset="0" stop-color="#f4f1dc" stop-opacity=".9"/><stop offset="1" stop-color="#f4f1dc" stop-opacity="0"/></radialGradient>`,
      body: `<rect width="${w}" height="${h}" fill="url(#sky)"/><rect width="${w}" height="${h}" fill="url(#moon)"/>${layers}`,
    };
  },
  space(r, w, h) {
    const px = w * (0.66 + r() * 0.08), py = h * 0.5, pr = h * 0.27;
    return {
      defs: `<radialGradient id="neb1" cx=".3" cy=".3" r=".5"><stop offset="0" stop-color="#6a2cff" stop-opacity=".55"/><stop offset="1" stop-color="#6a2cff" stop-opacity="0"/></radialGradient>
        <radialGradient id="neb2" cx=".8" cy=".7" r=".5"><stop offset="0" stop-color="#ff6a3d" stop-opacity=".4"/><stop offset="1" stop-color="#ff6a3d" stop-opacity="0"/></radialGradient>
        <radialGradient id="pl" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#ffd9a8"/><stop offset=".45" stop-color="#d0743a"/><stop offset="1" stop-color="#2b0e08"/></radialGradient>`,
      body: `<rect width="${w}" height="${h}" fill="#03020a"/><rect width="${w}" height="${h}" fill="url(#neb1)"/><rect width="${w}" height="${h}" fill="url(#neb2)"/>${stars(r, w, h, 320, h)}
        <ellipse cx="${px}" cy="${py}" rx="${pr * 2}" ry="${pr * 0.42}" fill="none" stroke="#ffd7a8" stroke-opacity=".35" stroke-width="${pr * 0.12}" transform="rotate(-14 ${px} ${py})"/>
        <circle cx="${px}" cy="${py}" r="${pr}" fill="url(#pl)"/>
        <path d="M${px - pr * 2} ${py} A${pr * 2} ${pr * 0.42} 0 0 0 ${px + pr * 2} ${py}" fill="none" stroke="#ffe2bd" stroke-opacity=".6" stroke-width="${pr * 0.08}" transform="rotate(-14 ${px} ${py})"/>`,
    };
  },
  harbor(r, w, h) {
    const hz = h * 0.62;
    let lights = '';
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = hz - 4 - r() * h * 0.05;
      lights += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.5 + r() * 2.5).toFixed(1)}" fill="#ffcf7a"/><rect x="${(x - 1.5).toFixed(0)}" y="${hz + 4}" width="3" height="${(20 + r() * 80).toFixed(0)}" fill="#ffcf7a" opacity=".35" filter="url(#blur)"/>`;
    }
    const lx = w * 0.72;
    return {
      defs: `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040915"/><stop offset="1" stop-color="#1b3557"/></linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3c4" stop-opacity=".7"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient>`,
      body: `<rect width="${w}" height="${h}" fill="url(#sky)"/>${stars(r, w, h, 120, hz * 0.8)}
        <path d="M${lx} ${hz - h * 0.3} L${w * 0.2} ${hz - h * 0.45} L${w * 0.24} ${hz - h * 0.2}Z" fill="url(#beam)" opacity=".5"/>
        <path d="M${lx - w * 0.012} ${hz} L${lx - w * 0.008} ${hz - h * 0.3} h${w * 0.016} L${lx + w * 0.012} ${hz}Z" fill="#e9e4d8"/>
        <circle cx="${lx}" cy="${hz - h * 0.31}" r="${h * 0.02}" fill="#fff6d0"/>
        <path d="${ridge(r, w, h, hz - h * 0.02, h * 0.015, 30)}" fill="#0a1426"/>
        <rect y="${hz}" width="${w}" height="${h - hz}" fill="#071121"/>${lights}`,
    };
  },
};

function frame(w, h, inner, seed) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>${inner.defs}
<filter id="blur" filterUnits="userSpaceOnUse" x="${-w * 0.2}" y="${-h * 0.2}" width="${w * 1.4}" height="${h * 1.4}"><feGaussianBlur stdDeviation="${(h * 0.03).toFixed(0)}"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0"/></filter>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
</defs>
${inner.body}
<rect width="${w}" height="${h}" fill="url(#vig)"/>
<rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;
}

export function scene(item, w, h) {
  const r = rng(item.Id + w + 'x' + h);
  const draw = SCENES[item.scene] || SCENES.mountains;
  return frame(w, h, draw(r, w, h), Math.floor(r() * 100));
}

// Title logo: transparent SVG, sized to its text so it lays out like a PNG logo.
export function logo(item) {
  const L = item.logo || {};
  const lines = (L.text || item.Name).toUpperCase().split('\n');
  const size = 120;
  const track = L.tracking ?? 0.08;
  const glyph = L.glyph ?? 0.66;
  const widths = lines.map((t) => t.length * size * (glyph + track));
  const w = Math.ceil(Math.max(...widths) + size * 0.4);
  const lh = size * (L.leading ?? 1.0);
  const h = Math.ceil(lh * lines.length + size * 0.45);
  const fill = L.fill || ['#ffffff', '#d9dde6'];
  const text = lines.map((t, i) =>
    `<text x="${w / 2}" y="${(size * 0.95 + i * lh).toFixed(0)}" text-anchor="middle" textLength="${widths[i].toFixed(0)}" lengthAdjust="spacingAndGlyphs">${esc(t)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fill[0]}"/><stop offset="1" stop-color="${fill[1]}"/></linearGradient></defs>
<g font-family="${esc(L.font || 'Futura, "Avenir Next", "Helvetica Neue", Arial, sans-serif')}" font-weight="${L.weight || 700}" font-style="${L.italic ? 'italic' : 'normal'}" font-size="${size}" fill="url(#f)">${text}</g>
</svg>`;
}

// Poster: the scene in 2:3 with the title set at the bottom.
export function poster(item) {
  const w = 600, h = 900;
  const r = rng(item.Id + 'poster');
  const inner = (SCENES[item.scene] || SCENES.mountains)(r, w, h);
  const L = item.logo || {};
  const lines = (L.text || item.Name).toUpperCase().split('\n');
  const size = Math.min(78, (w * 0.86) / Math.max(...lines.map((t) => t.length)) / 0.72);
  inner.body += `<rect y="${h * 0.6}" width="${w}" height="${h * 0.4}" fill="url(#shade)"/>` +
    `<g font-family="${esc(L.font || 'Futura, "Avenir Next", Arial, sans-serif')}" font-weight="${L.weight || 700}" font-style="${L.italic ? 'italic' : 'normal'}" font-size="${size.toFixed(0)}" fill="#fff" text-anchor="middle" letter-spacing="${((L.tracking ?? 0.08) * size * 0.6).toFixed(1)}">` +
    lines.map((t, i) => `<text x="${w / 2}" y="${(h * 0.86 - (lines.length - 1 - i) * size * 1.05).toFixed(0)}">${esc(t)}</text>`).join('') + '</g>' +
    `<text x="${w / 2}" y="${h * 0.94}" font-family="Helvetica Neue, Arial, sans-serif" font-size="18" letter-spacing="6" fill="#fff" fill-opacity=".7" text-anchor="middle">${esc(item.ProductionYear || '')}</text>`;
  inner.defs += `<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient>`;
  return frame(w, h, inner, Math.floor(r() * 100));
}
