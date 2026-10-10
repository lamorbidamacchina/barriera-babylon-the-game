// The pictures of Torino behind the Muro, one per level, drawn in code on a
// Painter as big as the field (480×240). Seen from Barriera, the Muro hides
// the city: knocking it down reveals it, like the pictures of Gals Panic.
import { Painter } from '../../painter.js';

export const VIEW_W = 480;
export const VIEW_H = 240;

// Same pictures every time: a small seeded random (mulberry32).
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r, a, b) => a + Math.floor(r() * (b - a + 1));

// Sky in flat bands, dithered into the next one over the last 4 rows.
function sky(p, stops) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [y0, c] = stops[i];
    const [y1, next] = stops[i + 1];
    for (let y = y0; y < y1; y++) {
      const d = y1 - y;
      for (let x = 0; x < p.w; x++) {
        const dither = d <= 2 ? (x + y) % 2 === 0 : d <= 4 && x % 2 === 0 && y % 2 === 0;
        p.set(x, y, dither ? next : c);
      }
    }
  }
  const [yl, cl] = stops[stops.length - 1];
  p.rect(0, yl, p.w, p.h - yl, cl);
}

// Mountain range: overlapping peaks between y top..base, a bit of noise on
// the slopes, snow on whatever rises above snowLine.
function mountains(p, r, { base, top, color, snow, snowLine, shade }) {
  const peaks = [];
  for (let x = -40; x < p.w + 40; x += between(r, 28, 60)) peaks.push({ x, y: between(r, top, base - 12), k: 0.5 + r() * 0.6 });
  let noise = 0;
  for (let x = 0; x < p.w; x++) {
    noise = Math.max(-2, Math.min(2, noise + (r() - 0.5)));
    const ry = Math.round(Math.min(base, ...peaks.map((pk) => pk.y + Math.abs(x - pk.x) * pk.k)) + noise);
    const peak = peaks.reduce((a, b) => (Math.abs(x - b.x) < Math.abs(x - a.x) ? b : a));
    // Shadowed side to the right of each peak.
    p.rect(x, ry, 1, base - ry, shade && x > peak.x ? shade : color);
    if (snow && ry < snowLine) p.rect(x, ry, 1, Math.max(1, (snowLine - ry) * 0.7 + ((x * 7) % 5) - 2), snow);
  }
}

// A row of city blocks with lit windows.
function city(p, r, { base, minH, maxH, color, lit, litShare = 0.3, from = 0, to = p.w }) {
  for (let x = from; x < to; ) {
    const w = between(r, 10, 26);
    const h = between(r, minH, maxH);
    p.rect(x, base - h, w, h, color);
    if (r() < 0.3) p.rect(x + 2, base - h - 3, 3, 3, color); // chimney
    for (let wy = base - h + 3; wy < base - 2; wy += 5) {
      for (let wx = x + 2; wx < x + w - 2; wx += 4) {
        if (r() < litShare) p.rect(wx, wy, 2, 2, lit);
      }
    }
    x += w + between(r, 0, 2);
  }
}

// Light from the left: lit left side, dark right side, dithered in between.
const facet = (pal, cx, half) => (x) => {
  const k = (x + 0.5 - cx) / Math.max(1, half);
  if (k < -0.45) return pal.light;
  if (k > 0.45) return pal.dark;
  if (k > 0.25 && x % 2 === 0) return pal.dark;
  return pal.base;
};

// The Mole Antonelliana, ground at y=g and h pixels tall, star on top.
function mole(p, cx, g, h, pal) {
  const u = h / 100;
  let y = g;
  // Base block with columns and two rows of windows.
  const bw = Math.round(30 * u);
  const bh = Math.round(20 * u);
  p.rect(cx - bw / 2, y - bh, bw, bh, facet(pal, cx, bw / 2));
  for (let x = Math.round(cx - bw / 2) + 2; x < cx + bw / 2 - 2; x += 4) {
    p.rect(x, y - bh + 3, 2, Math.round(bh * 0.35), pal.window);
    p.rect(x, y - Math.round(bh * 0.45), 2, Math.round(bh * 0.3), pal.window);
  }
  p.rect(cx - bw / 2 - 1, y - bh, bw + 2, 2, pal.light);
  y -= bh;
  // Colonnade.
  const cw = Math.round(26 * u);
  const ch = Math.round(5 * u);
  p.rect(cx - cw / 2, y - ch, cw, ch, pal.dark);
  for (let x = Math.round(cx - cw / 2) + 1; x < cx + cw / 2; x += 3) p.rect(x, y - ch, 1, ch, pal.light);
  p.rect(cx - cw / 2 - 1, y - ch - 1, cw + 2, 2, pal.light);
  y -= ch + 1;
  // The square dome, narrowing, with ribs and oculi.
  const db = Math.round(24 * u);
  const dt = Math.round(9 * u);
  const dh = Math.round(27 * u);
  p.poly([[cx - db / 2, y], [cx + db / 2, y], [cx + dt / 2, y - dh], [cx - dt / 2, y - dh]], facet(pal, cx, db / 2));
  for (const k of [-0.5, 0, 0.5]) p.line(cx + (k * db) / 2, y, cx + (k * dt) / 2, y - dh, pal.rib);
  for (let i = 1; i < 4; i++) {
    const yy = Math.round(y - (dh * i) / 4);
    const half = (db + (dt - db) * (i / 4)) / 2;
    for (const k of [-0.25, 0.25]) p.rect(Math.round(cx + k * half * 2) - 1, yy, 2, 2, pal.window);
  }
  y -= dh;
  // The "tempietto": two small storeys of columns.
  const tw = Math.round(9 * u);
  const th = Math.round(8 * u);
  p.rect(cx - tw / 2, y - th, tw, th, facet(pal, cx, tw / 2));
  for (let x = Math.round(cx - tw / 2) + 1; x < cx + tw / 2 - 1; x += 2) p.rect(x, y - th + 2, 1, th / 2 - 2, pal.window).rect(x, y - th / 2 + 1, 1, th / 2 - 2, pal.window);
  p.rect(cx - tw / 2 - 1, y - th / 2, tw + 2, 1, pal.light);
  y -= th;
  // The spire, with two rings, up to the star.
  const top = g - h;
  p.poly([[cx - 2.5 * u, y], [cx + 2.5 * u, y], [cx + 0.5, top + 4], [cx - 0.5, top + 4]], facet(pal, cx, 2.5 * u));
  for (const k of [0.25, 0.5]) {
    const yy = Math.round(y + (top - y) * k);
    const half = Math.max(1, 2.5 * u * (1 - k) + 1);
    p.rect(cx - half, yy, half * 2, 2, pal.light);
  }
  p.rect(cx, top + 4, 1, 3, pal.light);
  star(p, cx, top + 2, pal.star);
}

function star(p, x, y, c) {
  p.rect(x - 1, y, 3, 1, c).rect(x, y - 1, 1, 3, c);
}

function glow(p, cx, cy, r, c) {
  p.ellipse(cx, cy, r, r, (x, y) => ((x + y) % 2 === 0 ? c : p.get(x, y)));
}

// ------------------------------------------------------------------ pictures

export const VIEWS = {
  // Sunset behind the Mole, the Alps on the horizon, roofs of the centre.
  mole(p, w, h) {
    const r = rng(1);
    sky(p, [[0, 0x2c2850], [40, 0x5a3a6a], [80, 0xa04a5a], [115, 0xe07a4a], [145, 0xf2b45a], [165, 0xf8d88a]]);
    p.ellipse(110, 168, 22, 22, 0xfff0b0); // sun going down
    mountains(p, r, { base: 200, top: 128, color: 0x7a6a9a, shade: 0x6a5a8a, snow: 0xf4e8f0, snowLine: 152 });
    mountains(p, r, { base: 206, top: 176, color: 0x5a4a78 });
    city(p, r, { base: h, minH: 30, maxH: 64, color: 0x2a2440, lit: 0xf8d070, litShare: 0.25 });
    mole(p, 300, h - 6, 222, { base: 0xb89a80, light: 0xe8c8a0, dark: 0x7a5a58, rib: 0xf0d8b0, window: 0x3a2a40, star: 0xfff2b0 });
    city(p, r, { base: h, minH: 8, maxH: 22, color: 0x1a1830, lit: 0xf8d070, litShare: 0.35 });
  },

  // Superga on its hill, pink evening sky, the plain of the Po below.
  superga(p, w, h) {
    const r = rng(2);
    sky(p, [[0, 0x3a4a8a], [50, 0x6a6aa8], [95, 0xd88aa0], [135, 0xf4b090], [170, 0xf8d4a0]]);
    for (let i = 0; i < 6; i++) {
      // Long thin clouds.
      const cy = between(r, 20, 120);
      const cx = between(r, 0, w);
      p.ellipse(cx, cy, between(r, 24, 50), 2, 0xf0b8c0).ellipse(cx + 10, cy - 2, 18, 2, 0xf8d0d0);
    }
    // The hill, with trees bumping its outline.
    p.ellipse(250, 262, 300, 112, 0x3a5a3a);
    for (let x = 0; x < w; x += 6) {
      const top = 262 - 112 * Math.sqrt(Math.max(0, 1 - ((x - 250) / 300) ** 2));
      p.ellipse(x + 3, top + 2, 5, 4, x % 12 ? 0x4a6a40 : 0x3a5a3a);
    }
    p.ellipse(250, 270, 300, 100, (x, y) => ((x + y) % 2 ? 0x2e4a30 : 0x3a5a3a), { over: true });
    const pal = { base: 0xe8d8c0, light: 0xfff0d8, dark: 0xb89a90, window: 0x6a5060 };
    const cx = 250;
    const g = 166;
    // Convent wings.
    p.rect(cx - 90, g - 14, 180, 16, facet(pal, cx, 90));
    for (let x = cx - 86; x < cx + 88; x += 6) p.rect(x, g - 10, 2, 3, pal.window);
    // Bell towers.
    for (const tx of [cx - 46, cx + 36]) {
      p.rect(tx, g - 58, 10, 46, facet(pal, tx + 5, 5));
      p.rect(tx + 3, g - 50, 4, 6, pal.window);
      p.ellipse(tx + 5, g - 60, 5, 5, 0x8aa89a);
      p.rect(tx + 4, g - 70, 2, 6, pal.dark);
    }
    // Drum, dome and lantern.
    p.rect(cx - 22, g - 64, 44, 30, facet(pal, cx, 22));
    for (let x = cx - 18; x < cx + 18; x += 7) p.rect(x, g - 58, 3, 8, pal.window);
    p.ellipse(cx, g - 64, 24, 22, (x, y) => (y > g - 64 ? p.get(x, y) : x < cx - 6 ? 0xb0c8bc : x > cx + 10 ? 0x6a8a7c : 0x8aa89a));
    p.rect(cx - 4, g - 96, 8, 10, facet(pal, cx, 4));
    p.ellipse(cx, g - 96, 5, 4, 0x8aa89a);
    p.rect(cx, g - 104, 1, 5, pal.dark);
    star(p, cx, g - 106, 0xffd060);
    // Portico with columns and pediment.
    p.rect(cx - 26, g - 34, 52, 22, pal.base);
    for (let x = cx - 24; x < cx + 24; x += 8) p.rect(x, g - 30, 4, 18, pal.light).rect(x + 4, g - 30, 1, 18, pal.dark);
    p.poly([[cx - 30, g - 34], [cx + 30, g - 34], [cx, g - 46]], pal.light);
    p.line(cx - 30, g - 34, cx, g - 46, pal.dark).line(cx, g - 46, cx + 30, g - 34, pal.dark);
    // Lights of the plain in the foreground.
    city(p, r, { base: h, minH: 6, maxH: 18, color: 0x24304a, lit: 0xf8d070, litShare: 0.4 });
  },

  // Morning on the Po: Gran Madre, the Vittorio Emanuele bridge, the hill.
  granmadre(p, w, h) {
    const r = rng(3);
    sky(p, [[0, 0x4a8ad0], [60, 0x6aa8e0], [110, 0x9ac8ec], [150, 0xc8e4f0]]);
    for (let i = 0; i < 5; i++) {
      const cx = between(r, 20, w - 20);
      const cy = between(r, 14, 70);
      for (let k = 0; k < 4; k++) p.ellipse(cx + k * 9 - 13, cy - (k % 2) * 4, 10, 6, 0xffffff);
      p.rect(cx - 22, cy + 3, 46, 2, 0xd8e8f4);
    }
    // The hill behind, with the Monte dei Cappuccini on the left.
    p.ellipse(240, 220, 320, 90, 0x5a8a4a);
    p.ellipse(60, 150, 60, 30, 0x4a7a40);
    p.rect(50, 106, 20, 14, 0xe8dcc0).ellipse(60, 106, 8, 6, 0xb8c8c0).rect(59, 96, 2, 6, 0x8a7a68);
    for (let x = 0; x < w; x += 5) p.ellipse(x, 140 + Math.sin(x / 13) * 6, 4, 4, x % 10 ? 0x4a7a40 : 0x6a9a50);
    // The church: steps, six columns, pediment, dome.
    const cx = 240;
    const g = 172;
    const pal = { base: 0xe8dcc8, light: 0xfff4e0, dark: 0xa89a88, window: 0x5a5060 };
    p.rect(cx - 36, g - 104, 72, 44, facet(pal, cx, 36)); // drum
    for (let x = cx - 30; x < cx + 30; x += 8) p.rect(x, g - 98, 3, 10, pal.window);
    p.ellipse(cx, g - 104, 38, 30, (x, y) => (y > g - 104 ? p.get(x, y) : x < cx - 12 ? 0x8ab0b8 : x > cx + 14 ? 0x4a7080 : 0x6a909a));
    p.rect(cx - 5, g - 144, 10, 12, pal.light).ellipse(cx, g - 144, 6, 4, 0x6a909a).rect(cx, g - 152, 1, 5, pal.dark);
    p.rect(cx - 60, g - 54, 120, 54, pal.base); // pronaos
    for (let i = 0; i < 6; i++) {
      const x = cx - 54 + i * 20;
      p.rect(x, g - 48, 8, 46, pal.light).rect(x + 6, g - 48, 2, 46, pal.dark);
    }
    p.rect(cx - 62, g - 60, 124, 8, pal.light).rect(cx - 62, g - 53, 124, 1, pal.dark);
    p.poly([[cx - 64, g - 60], [cx + 64, g - 60], [cx, g - 84]], pal.base);
    p.line(cx - 64, g - 60, cx, g - 84, pal.dark).line(cx, g - 84, cx + 64, g - 60, pal.dark);
    p.rect(cx - 90, g, 180, 4, pal.dark).rect(cx - 96, g + 4, 192, 4, pal.base); // steps
    for (const sx of [cx - 84, cx + 76]) p.rect(sx, g - 22, 8, 22, pal.base).ellipse(sx + 4, g - 26, 4, 5, 0x8a8a80); // statues
    // The bridge and the river.
    p.rect(0, 184, w, 8, 0xc8b8a0).rect(0, 182, w, 2, 0xe8d8c0);
    p.rect(0, 192, w, h - 192, 0x3a6a9a);
    for (let x = 10; x < w; x += 60) p.ellipse(x + 20, 204, 22, 12, 0x24486a);
    p.rect(0, 204, w, h - 204, 0x3a6a9a);
    for (let i = 0; i < 70; i++) p.rect(between(r, 0, w), between(r, 206, h), between(r, 3, 10), 1, r() < 0.5 ? 0x6a9ac8 : 0x24486a);
    for (let y = 208; y < h; y += 3) p.rect(cx - 50 + ((y * 7) % 9), y, 100 - ((y * 5) % 13), 1, 0x8ab0d0); // reflection
  },

  // The Lingotto with the track on its roof, the "bolla" and the Alps.
  lingotto(p, w, h) {
    const r = rng(4);
    sky(p, [[0, 0x3a7ac0], [70, 0x6aa0d8], [120, 0xa8d0ec], [150, 0xd8ecf4]]);
    mountains(p, r, { base: 150, top: 70, color: 0x8aa0c0, shade: 0x7a90b0, snow: 0xf4f8ff, snowLine: 96 });
    const top = 112;
    const g = 206;
    // Long factory, cream, endless windows.
    p.rect(16, top, w - 32, g - top, (x, y) => (x < 30 ? 0xf0e4c8 : x > w - 30 ? 0xb8a888 : 0xd8c8a8));
    for (let y = top + 8; y < g - 6; y += 12) {
      p.rect(16, y - 3, w - 32, 1, 0xc0b090);
      for (let x = 22; x < w - 22; x += 8) p.rect(x, y, 5, 6, (x + y) % 3 ? 0x2c4060 : 0x4a6a90);
    }
    // The test track on the roof, with banked curves and a car.
    p.rect(30, top - 8, w - 60, 8, 0x7a7a74);
    p.ellipse(30, top - 4, 14, 4, 0x6a6a64).ellipse(w - 30, top - 4, 14, 4, 0x6a6a64);
    for (let x = 40; x < w - 40; x += 10) p.rect(x, top - 5, 5, 1, 0xf4f1e8);
    p.rect(150, top - 9, 9, 4, 0xe0443a).rect(152, top - 11, 5, 2, 0xe0443a).rect(151, top - 5, 2, 1, 0x1a1a1a).rect(156, top - 5, 2, 1, 0x1a1a1a);
    p.rect(16, top - 1, w - 32, 1, 0x5a5a54);
    // The "scrigno" and the "bolla".
    p.rect(100, top - 22, 50, 14, 0x8a8a90).rect(100, top - 22, 50, 2, 0xb0b0b8);
    p.rect(320, top - 14, 2, 6, 0x5a5a54);
    p.ellipse(340, top - 24, 16, 16, (x, y) => ((x + y) % 2 ? 0x4a8ae0 : 0x6aaaf0));
    p.line(324, top - 24, 356, top - 24, 0xd8ecf4).line(340, top - 40, 340, top - 8, 0xd8ecf4);
    p.rect(334, top - 33, 3, 3, 0xffffff);
    p.rect(368, top - 12, 26, 4, 0x6a6a64); // helipad
    // Trees and the street in front.
    for (let x = 0; x < w; x += 14) p.ellipse(x + between(r, 0, 4), g - 4, between(r, 7, 10), 9, x % 28 ? 0x3a6a3a : 0x4a7a40);
    p.rect(0, g + 4, w, h - g - 4, 0x4a4a48).rect(0, g + 4, w, 2, 0x8a8a84);
    for (let x = 0; x < w; x += 24) p.rect(x, h - 14, 12, 2, 0xf4f1e8);
    for (let i = 0; i < 5; i++) {
      const x = between(r, 0, w - 20);
      p.rect(x, h - 26, 18, 6, [0xe0443a, 0x4a8ae0, 0xe8c06a, 0xf4f1e8][i % 4]).rect(x + 4, h - 30, 9, 4, 0x2c4060);
    }
  },

  // Night over Torino: moon on the Alps, Superga lit on the hill, fireworks
  // over the Mole for the last stretch of Muro.
  notte(p, w, h) {
    const r = rng(5);
    sky(p, [[0, 0x05070c], [60, 0x0e1626], [120, 0x1b2a44], [170, 0x2c4060]]);
    for (let i = 0; i < 90; i++) p.set(between(r, 0, w), between(r, 0, 150), r() < 0.8 ? 0x8f968c : 0xf4f1e8);
    p.ellipse(70, 46, 16, 16, 0xf4f1e8).ellipse(64, 42, 3, 3, 0xd8d4c8).ellipse(76, 52, 4, 2, 0xd8d4c8);
    mountains(p, r, { base: 200, top: 120, color: 0x2c4060, shade: 0x22344f, snow: 0x8aa0c0, snowLine: 142 });
    // Superga lit on the hill to the right.
    p.ellipse(420, 230, 120, 60, 0x0e1626);
    glow(p, 420, 162, 20, 0x5a4630);
    p.rect(406, 166, 28, 6, 0xe8c06a).rect(414, 158, 12, 8, 0xc9963a).ellipse(420, 158, 7, 6, 0xe8c06a).rect(419, 148, 2, 5, 0xe8c06a);
    p.rect(402, 156, 3, 16, 0xc9963a).rect(435, 156, 3, 16, 0xc9963a);
    for (let x = 408; x < 433; x += 4) p.rect(x, 168, 1, 2, 0x5a4630);
    // Fireworks.
    const burst = (cx, cy, rad, c1, c2) => {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        p.line(cx + Math.cos(a) * rad * 0.35, cy + Math.sin(a) * rad * 0.35, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, i % 2 ? c1 : c2);
        p.rect(cx + Math.cos(a) * (rad + 2), cy + Math.sin(a) * (rad + 2) + 2, 1, 1, c2);
      }
    };
    burst(160, 50, 20, 0xff4fa3, 0xffb070);
    burst(390, 40, 16, 0xe8c06a, 0xfff2b0);
    burst(450, 96, 11, 0x9be36b, 0xf4f1e8);
    city(p, r, { base: h, minH: 26, maxH: 56, color: 0x0e1626, lit: 0xe8c06a, litShare: 0.35 });
    mole(p, 250, h - 4, 214, { base: 0x3a3a50, light: 0x6a6a88, dark: 0x1b1b2a, rib: 0xe8c06a, window: 0xffd070, star: 0xfff2b0 });
    glow(p, 250, h - 4 - 212, 8, 0xfff2b0);
    star(p, 250, h - 4 - 212, 0xffffff);
    city(p, r, { base: h, minH: 6, maxH: 18, color: 0x05070c, lit: 0xff7a2f, litShare: 0.45 });
  },
};

export const viewKey = (view) => `view-${view}`;

// The picture as a canvas texture, once per game.
export function createView(scene, view) {
  const key = viewKey(view);
  if (scene.textures.exists(key)) return key;
  const p = new Painter(VIEW_W, VIEW_H);
  VIEWS[view](p, VIEW_W, VIEW_H);
  scene.textures.addCanvas(key, p.toCanvas());
  return key;
}
