// The pictures behind the Muro, one per level, drawn in code on a Painter as
// big as the field (480×240): the Torino the Muro keeps away from Barriera,
// the public one (university, health centre, bike lanes, nursery, park).
// Knocking the Muro down reveals it, like the pictures of Gals Panic.
import { Painter } from '../../painter.js';
import { miniText, miniTextCentered } from '../../sprites/minifont.js';
import { person, kid, bike, tree, SKIN, HAIR } from './people.js';

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

// A few soft clouds in the upper sky.
function clouds(p, r, n, yMin, yMax) {
  for (let i = 0; i < n; i++) {
    const cx = between(r, 20, p.w - 20);
    const cy = between(r, yMin, yMax);
    for (let k = 0; k < 4; k++) p.ellipse(cx + k * 9 - 13, cy - (k % 2) * 4, 10, 6, 0xffffff);
    p.rect(cx - 22, cy + 3, 46, 2, 0xd8e8f4);
  }
}

// A speech bubble pointing down at whoever is talking.
function bubble(p, x, y, str) {
  const w = str.length * 4 + 5;
  p.rect(x - 1, y - 1, w + 2, 11, 0x1a1410).rect(x, y, w, 9, 0xffffff);
  p.rect(x + 3, y + 9, 3, 2, 0xffffff).rect(x + 3, y + 11, 1, 1, 0x1a1410);
  miniText(p, str, x + 3, y + 2, 0x1a1410);
}

// Superga far away on its hill, about 36px wide, base on y=g.
function supergaSmall(p, cx, g) {
  const c = 0xd8d0c0;
  const d = 0xa8a090;
  p.rect(cx - 18, g - 5, 36, 5, c).rect(cx - 7, g - 15, 14, 10, c);
  p.ellipse(cx, g - 15, 7, 6, (x, y) => (y > g - 15 ? p.get(x, y) : x > cx + 2 ? 0x7a9a8a : 0x9ab8a8));
  p.rect(cx, g - 25, 1, 4, d);
  p.rect(cx - 13, g - 16, 3, 11, c).rect(cx + 10, g - 16, 3, 11, c);
  p.poly([[cx - 9, g - 9], [cx + 9, g - 9], [cx, g - 13]], 0xf0e8d8);
}

// The Monviso: the lone pyramid of the Alps, snow on its upper half.
function monviso(p, cx, top, base) {
  p.poly([[cx - 90, base], [cx - 22, top + 30], [cx - 6, top + 8], [cx, top], [cx + 8, top + 12], [cx + 30, top + 40], [cx + 92, base]], 0x8a9ab8);
  p.poly([[cx, top], [cx + 8, top + 12], [cx + 30, top + 40], [cx + 92, base], [cx + 10, base]], 0x6a7a98);
  p.poly([[cx - 26, top + 36], [cx - 6, top + 8], [cx, top], [cx + 8, top + 12], [cx + 32, top + 44], [cx + 18, top + 40], [cx + 8, top + 50], [cx - 2, top + 36], [cx - 14, top + 46]], 0xf4f8ff);
  p.poly([[cx, top], [cx + 8, top + 12], [cx + 32, top + 44], [cx + 18, top + 40], [cx + 8, top + 50], [cx + 2, top + 30]], 0xc8d4e8);
  for (const [x0, y0, x1, y1] of [[cx - 4, top + 14, cx - 10, top + 32], [cx + 6, top + 22, cx + 12, top + 40], [cx - 16, top + 50, cx - 30, top + 74]]) p.line(x0, y0, x1, y1, 0x6a7a98);
}

// A bike painted on the lane.
function bikeSign(p, x, y) {
  p.ellipse(x - 4 + 0.5, y + 0.5, 3, 3, 0xf4f1e8).ellipse(x - 4 + 0.5, y + 0.5, 2, 2, 0xa85a40);
  p.ellipse(x + 4 + 0.5, y + 0.5, 3, 3, 0xf4f1e8).ellipse(x + 4 + 0.5, y + 0.5, 2, 2, 0xa85a40);
  p.line(x - 4, y, x, y - 4, 0xf4f1e8).line(x, y - 4, x + 4, y, 0xf4f1e8).line(x - 1, y - 4, x + 2, y - 4, 0xf4f1e8);
}

function dog(p, x, gy) {
  p.rect(x - 4, gy - 5, 8, 3, 0x8a5a30).rect(x + 3, gy - 7, 3, 3, 0x8a5a30).rect(x + 5, gy - 6, 1, 1, 0x1a1a1a);
  p.rect(x - 4, gy - 2, 1, 2, 0x6a3a20).rect(x + 2, gy - 2, 1, 2, 0x6a3a20).rect(x - 5, gy - 6, 1, 2, 0x6a3a20);
}

// A pram, pushed from its left.
function stroller(p, x, gy) {
  p.rect(x - 6, gy - 9, 11, 5, 0x4a8ae0).rect(x - 6, gy - 12, 6, 3, 0x2c4060);
  p.line(x + 5, gy - 9, x + 9, gy - 13, 0x3a3a3a);
  for (const wx of [x - 4, x + 3]) p.ellipse(wx + 0.5, gy - 1.5, 2, 2, 0x1a1a1a);
}

// ------------------------------------------------------------------ pictures

export const VIEWS = {
  // Università di Torino, Palazzo Nuovo: grey grid of floors jutting out one
  // over the other, fins forked over the roof, ramps and railings in front,
  // students on the square with a banner.
  universita(p, w, h) {
    const r = rng(11);
    sky(p, [[0, 0x6a9ad0], [50, 0x8ab4dc], [100, 0xb0cce4], [140, 0xd0e2ee]]);
    clouds(p, r, 5, 14, 60);
    tree(p, 470, 186, { size: 20, trunk: 20, seed: 3 });
    const G = 194; // ground line of the building
    const CX = 252;
    const roof = G - 24 - 6 * 17;
    // Ground floor: recessed, dark glass.
    p.rect(CX - 170, G - 24, 340, 24, 0x2e3a46);
    for (let x = CX - 170; x < CX + 170; x += 10) p.rect(x, G - 24, 1, 24, 0x5a6670);
    for (let x = CX - 160; x < CX + 160; x += 30) p.rect(x + 3, G - 20, 4, 14, 0x4a5a6a);
    // Six floors, each a little wider than the one below.
    for (let i = 0; i < 6; i++) {
      const y1 = G - 24 - i * 17;
      const half = 182 + i * 3;
      const x0 = CX - half;
      const x1 = CX + half;
      p.rect(x0, y1 - 17, x1 - x0, 12, 0x8aa6bc);
      for (let x = x0; x < x1; x += 6) {
        if (r() < 0.3) p.rect(x + 1, y1 - 16, 5, 5, 0xb8d0e2); // sky in the glass
        p.rect(x, y1 - 17, 1, 12, 0x4a5058);
      }
      p.rect(x0, y1 - 12, x1 - x0, 1, 0x5a6268);
      p.rect(x0, y1 - 5, x1 - x0, 5, 0x7e848a).rect(x0, y1 - 5, x1 - x0, 1, 0xa0a6ac);
      p.rect(x0 + 2, y1, x1 - x0 - 4, 1, 0x3a4048); // shadow under the overhang
    }
    p.rect(CX - 199, roof - 2, 398, 2, 0x9aa0a6);
    // Fins up the whole front, forked over the roof.
    for (let x = CX - 196; x <= CX + 192; x += 28) {
      p.rect(x, roof, 4, G - roof, 0xa8acb0).rect(x, roof, 1, G - roof, 0xc8ccd0).rect(x + 3, roof, 1, G - roof, 0x6a6e74);
      p.line(x, roof, x - 3, roof - 9, 0xb8bcc0).line(x + 1, roof, x - 2, roof - 9, 0x8a8e94);
      p.line(x + 3, roof, x + 6, roof - 9, 0xb8bcc0).line(x + 2, roof, x + 5, roof - 9, 0x8a8e94);
    }
    // Posters and graffiti on the ground floor.
    p.rect(CX + 110, G - 22, 56, 22, 0xe8803a);
    for (let i = 0; i < 9; i++) p.line(CX + 112 + between(r, 0, 50), G - between(r, 4, 20), CX + 112 + between(r, 0, 50), G - between(r, 2, 20), [0xff4fa3, 0x9be36b, 0x4a8ae0, 0xf4f1e8][i % 4]);
    for (let i = 0; i < 4; i++) p.rect(CX - 150 + i * 12, G - 18, 8, 11, [0xf4f1e8, 0xe8c06a, 0xff4fa3, 0x9ad0e0][i]);
    // The square, ramps and railings.
    p.rect(0, G, w, h - G, 0xb8b0a0);
    for (let y = G + 6; y < h; y += 7) p.rect(0, y, w, 1, 0xa8a090);
    for (let x = 60; x < 450; x += 4) p.line(x, G + 15, x + 4, G + 5, 0xd0d4d4);
    p.rect(60, G + 4, 390, 1, 0xe8ecec).rect(60, G + 15, 390, 1, 0x8a8e90);
    p.line(150, G + 15, 210, G + 2, 0x8a8e90).line(150, G + 14, 210, G + 1, 0xe8ecec); // ramp
    // Banner on a pole and trees on the left.
    p.rect(64, 120, 2, G - 110, 0x6a6e74);
    p.rect(66, 124, 12, 44, 0xc0304a).rect(66, 124, 12, 2, 0xe05a6a);
    miniText(p, 'U', 70, 132, 0xf4f1e8), miniText(p, 'N', 70, 139, 0xf4f1e8), miniText(p, 'I', 70, 146, 0xf4f1e8), miniText(p, 'T', 70, 153, 0xf4f1e8), miniText(p, 'O', 70, 160, 0xf4f1e8);
    tree(p, 22, 214, { size: 28, trunk: 36, seed: 1 });
    tree(p, 52, 206, { size: 18, trunk: 22, seed: 2 });
    // Students: a banner, a group chatting, one reading, a cyclist.
    const S = (x, o) => person(p, x, 234, o);
    S(158, { pose: 'cheer', top: 0x9be36b, skin: SKIN[3], hair: HAIR[3], long: true });
    S(240, { pose: 'cheer', top: 0xf0c040, f: -1, pack: 0x4a8ae0 });
    p.rect(162, 213, 75, 10, 0xf4f1e8).rect(162, 222, 75, 1, 0xc8c4b8);
    miniTextCentered(p, 'SAPERE LIBERO', 199, 216, 0xc0304a);
    S(300, { pose: 'talk', top: 0xe0443a, pack: 0x2c4060 });
    S(316, { pose: 'stand', top: 0x8a5ab0, f: -1, long: true, hair: HAIR[2], skin: SKIN[0] });
    S(330, { pose: 'cheer', top: 0x4ab0a0, f: -1, skin: SKIN[2] });
    p.rect(372, 224, 70, 6, 0x9a948a).rect(372, 224, 70, 1, 0xc8c0b0); // low wall
    person(p, 392, 224, { pose: 'sit', top: 0xff7a2f, hold: 0xf4f1e8, skin: SKIN[4], hair: HAIR[3] });
    person(p, 420, 224, { pose: 'sit', top: 0x2c4060, bottom: 0x6a6a64, f: -1, hair: HAIR[4], long: true, skin: SKIN[0] });
    S(104, { pose: 'walk', top: 0xc9963a, hold: 0xe8e4d8 });
    S(122, { pose: 'walk', top: 0x4a8ae0, long: true, hair: HAIR[1], skin: SKIN[2] });
    bike(p, 462, 236, { f: -1, frame: 0x4a8ae0, top: 0x9be36b, basket: 0xc9963a });
  },

  // A neighbourhood health centre: a patient on crutches talks with the
  // doctor at the door; the Mole far away over the roofs.
  salute(p, w, h) {
    const r = rng(12);
    sky(p, [[0, 0x5a9ad8], [60, 0x84b8e6], [110, 0xb4d6ee], [150, 0xd8eaf2]]);
    clouds(p, r, 4, 14, 70);
    city(p, r, { base: 172, minH: 14, maxH: 36, color: 0xa8b8cc, lit: 0xb8c8d8, litShare: 0.5 });
    mole(p, 410, 172, 120, { base: 0xa8b0c4, light: 0xc8cedc, dark: 0x8a92a8, rib: 0xd0d6e2, window: 0x8a92a8, star: 0xf4f1e8 });
    tree(p, 344, 196, { size: 16, trunk: 18, seed: 5 });
    tree(p, 462, 200, { size: 18, trunk: 22, seed: 6 });
    // The building: white, two floors, a wooden tower with the green cross.
    const G = 196;
    p.rect(24, 96, 240, G - 96, (x) => (x < 30 ? 0xffffff : x > 256 ? 0xd8d4c8 : 0xf0ece0));
    p.rect(22, 94, 244, 3, 0xc8c4b8);
    for (const y of [108, 146]) {
      p.rect(34, y, 220, 18, 0x6a9ac0).rect(34, y, 220, 2, 0x9ac0dc).rect(34, y + 18, 220, 1, 0xa8a49a);
      for (let x = 34; x < 254; x += 20) p.rect(x, y, 1, 18, 0x4a6a80);
    }
    p.rect(40, 129, 160, 14, 0xffffff);
    miniText(p, 'CASA DELLA SALUTE', 48, 132, 0x2a8a4a, 2);
    p.rect(264, 74, 70, G - 74, 0xc8945a);
    for (let x = 268; x < 334; x += 5) p.rect(x, 74, 1, G - 74, 0xa87440);
    p.rect(264, 74, 70, 2, 0xe0b07a);
    p.rect(286, 84, 26, 26, 0xffffff).rect(296, 88, 6, 18, 0x2a9a4a).rect(290, 94, 18, 6, 0x2a9a4a);
    // Entrance with a canopy, a ramp, a bike rack.
    p.rect(122, 166, 76, 4, 0x6a6a64).rect(122, 166, 76, 1, 0x9a9a94);
    p.rect(132, 170, 56, 26, 0x5a7a90).rect(159, 170, 2, 26, 0x3a4a58).rect(136, 172, 3, 18, 0x9ac0dc);
    p.rect(0, G, w, h - G, 0xc8c0b0);
    for (let y = G + 5; y < h; y += 8) p.rect(0, y, w, 1, 0xb8b0a0);
    p.line(198, 195, 250, 186, 0x8a8a84).line(198, 194, 250, 185, 0xd8d8d0);
    for (let x = 70; x < 110; x += 8) p.ellipse(x + 0.5, G + 5.5, 4, 4, 0x6a6a64).ellipse(x + 0.5, G + 5.5, 3, 3, 0xc8c0b0);
    // A bench with a lady, a nurse, a mum with her kid going in.
    p.rect(370, 214, 50, 3, 0x8a5a30).rect(370, 208, 50, 2, 0x8a5a30).rect(374, 217, 2, 8, 0x3a3a3a).rect(414, 217, 2, 8, 0x3a3a3a);
    person(p, 388, 214, { pose: 'sit', top: 0x8a5ab0, hair: 0xc8c8c8, bottom: 0x3a3a50, hold: 0xc9963a });
    person(p, 96, 230, { pose: 'walk', coat: 0x9ad8c8, top: 0x4ab0a0, f: -1, long: true, hair: HAIR[3], skin: SKIN[3] });
    person(p, 150, 222, { pose: 'walk', top: 0xe8803a, long: true, hair: HAIR[1] });
    kid(p, 160, 222, { pose: 'hand', top: 0x9be36b, f: -1, hair: HAIR[2], skin: SKIN[0] });
    // The doctor and the patient with a leg in plaster.
    person(p, 236, 234, { pose: 'talk', coat: 0xf4f1e8, top: 0x4a8ae0, skin: SKIN[2], hair: 0x8a8a8a });
    person(p, 260, 234, { pose: 'crutch', top: 0xe0443a, bottom: 0x2c4060, f: -1, skin: SKIN[1], hair: HAIR[1] });
    bubble(p, 228, 196, '...');
    bubble(p, 262, 192, '!');
  },

  // A tree-lined avenue with two bike lanes and no cars; the hill and
  // Superga in the distance.
  viale(p, w, h) {
    const r = rng(13);
    sky(p, [[0, 0x4a8ad0], [70, 0x78b0e4], [120, 0xa8d0ec], [150, 0xd0e8f2]]);
    clouds(p, r, 4, 20, 80);
    p.ellipse(110, 190, 190, 70, 0x8aaa8a);
    p.ellipse(340, 180, 200, 86, 0x7a9a7a);
    for (let x = 252; x < w; x += 7) p.ellipse(x, 180 - 86 * Math.sqrt(Math.max(0, 1 - ((x - 340) / 200) ** 2)) + 3, 4, 3, 0x6a8a6a);
    supergaSmall(p, 340, 98);
    for (let x = 4; x < w; x += 24) tree(p, x + between(r, -3, 3), 180, { size: between(r, 11, 14), trunk: 14, seed: x, pal: { base: 0x5a8a44, dark: 0x3a6a34, light: 0x7aaa54, hl: 0xa8d07a } });
    // Path for walking, grass, the two bike lanes.
    p.rect(0, 178, w, 10, 0xd8ccb0).rect(0, 178, w, 1, 0xc0b498);
    p.rect(0, 188, w, 4, 0x6a9a4a);
    p.rect(0, 192, w, 32, 0xa85a40).rect(0, 192, w, 1, 0xf4f1e8).rect(0, 223, w, 1, 0xf4f1e8);
    for (let x = 0; x < w; x += 14) p.rect(x, 207, 7, 1, 0xf4f1e8);
    for (const x of [90, 310]) bikeSign(p, x, 214);
    p.rect(0, 224, w, h - 224, 0x5a8a40);
    for (let i = 0; i < 40; i++) p.rect(between(r, 0, w), between(r, 226, h), 1, 2, 0x7aaa54);
    // People on foot, bikes both ways.
    person(p, 40, 186, { pose: 'walk', top: 0xe8803a, long: true, hair: HAIR[3], skin: SKIN[3] });
    person(p, 200, 186, { pose: 'walk', top: 0x8a5ab0, f: -1, hair: 0xc8c8c8 });
    dog(p, 186, 186);
    person(p, 380, 186, { pose: 'run', top: 0xf0c040, f: -1, skin: SKIN[2] });
    bike(p, 70, 206, { frame: 0x4a8ae0, top: 0x9be36b, basket: 0xc9963a });
    bike(p, 230, 206, { frame: 0xf0c040, top: 0xe0443a, child: 0x4a8ae0, skin: SKIN[3], hair: HAIR[3] });
    bike(p, 360, 206, { frame: 0x2c4060, top: 0xf4f1e8, hair: HAIR[2], skin: SKIN[0] });
    bike(p, 150, 222, { f: -1, frame: 0x9be36b, top: 0xff4fa3, hair: HAIR[4] });
    bike(p, 300, 222, { f: -1, frame: 0xe0443a, top: 0x2c4060, skin: SKIN[4], hair: HAIR[3] });
    bike(p, 440, 222, { f: -1, frame: 0xc9963a, top: 0x4ab0a0, basket: 0x9be36b });
    // Big trees in front framing the avenue, canopies over the top.
    const big = { base: 0x3e6e34, dark: 0x264a22, light: 0x5a8a44, hl: 0x8ab864 };
    tree(p, 8, 244, { size: 40, trunk: 150, seed: 21, pal: big });
    tree(p, 476, 244, { size: 40, trunk: 150, seed: 22, pal: big });
  },

  // An "asilo nido": a colourful nursery, parents bringing the kids in, the
  // Po on the right with a rowing boat, trees everywhere.
  asilo(p, w, h) {
    const r = rng(14);
    sky(p, [[0, 0x3a8ae0], [60, 0x6ab0ec], [110, 0xa8d4f0], [150, 0xd0e8f4]]);
    p.ellipse(56, 40, 14, 14, 0xffe080);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      p.line(56 + Math.cos(a) * 18, 40 + Math.sin(a) * 18, 56 + Math.cos(a) * 24, 40 + Math.sin(a) * 24, 0xffe080);
    }
    clouds(p, r, 3, 20, 60);
    // The far bank: the hill with houses.
    p.ellipse(410, 176, 160, 58, 0x5a8a4a);
    for (let i = 0; i < 6; i++) p.rect(300 + i * 28, 130 + (i % 3) * 6, 12, 9, [0xe8d8c0, 0xf0c090, 0xe8b0a0][i % 3]).rect(300 + i * 28, 128 + (i % 3) * 6, 12, 2, 0xa0503a);
    for (let x = 270; x < w; x += 12) tree(p, x, 152, { size: 7, trunk: 4, seed: x });
    // The Po.
    p.poly([[280, 240], [340, 150], [480, 150], [480, 240]], 0x3a7ab0);
    for (let i = 0; i < 50; i++) {
      const y = between(r, 154, h);
      const x0 = 280 + ((240 - y) * 60) / 90;
      p.rect(between(r, x0 + 4, w), y, between(r, 4, 10), 1, r() < 0.5 ? 0x6aa0d0 : 0x2a5a8a);
    }
    p.rect(392, 188, 34, 3, 0xf4f1e8).rect(394, 191, 30, 1, 0xc8c4b8); // rowing boat
    p.line(398, 190, 388, 197, 0x8a5a30).line(420, 190, 430, 197, 0x8a5a30);
    person(p, 409, 188, { pose: 'sit', top: 0xe0443a, f: -1, skin: SKIN[2] });
    p.poly([[262, 240], [322, 150], [342, 150], [282, 240]], 0x6a9a4a); // grassy bank
    for (const t of [0, 0.25, 0.5, 0.75]) tree(p, 290 + t * 44, 238 - t * 84, { size: Math.round(11 - t * 5), trunk: 10, seed: Math.round(t * 8) });
    // Trees behind the nursery.
    for (let x = 10; x < 270; x += 26) tree(p, x, 134, { size: 13, trunk: 10, seed: x + 1 });
    // The nursery.
    const G = 200;
    const colors = [0xf0c040, 0xe8803a, 0x9ad06a, 0x6ab0e0, 0xff8ab0];
    for (let i = 0; i < 8; i++) p.rect(20 + i * 30, 118, 30, G - 118, colors[i % colors.length]);
    p.rect(18, 114, 244, 5, 0xf4f1e8);
    p.rect(60, 121, 104, 16, 0xffffff);
    miniText(p, 'ASILO NIDO', 72, 124, 0xe0443a, 2);
    for (let i = 0; i < 8; i++) {
      if (i === 4) continue;
      const x = 26 + i * 30;
      p.rect(x, 144, 18, 30, 0xc8e4f0).rect(x, 144, 18, 1, 0xffffff).rect(x + 9, 144, 1, 30, 0x8ab0c8);
      for (let k = 0; k < 3; k++) p.rect(x + between(r, 1, 14), 148 + between(r, 0, 20), 3, 3, [0xe0443a, 0xf0c040, 0x4a8ae0, 0x9be36b][(i + k) % 4]); // drawings
    }
    // A rainbow painted on the wall: upper halves of nested ellipses.
    const arc = (c) => (x, y) => (y >= 140 ? p.get(x, y) : c);
    [0xe0443a, 0xf0c040, 0x9be36b, 0x4a8ae0].forEach((c, k) => p.ellipse(220, 140, 18 - k * 3, 12 - k * 3, arc(c)));
    p.ellipse(220, 140, 6, 3, arc(0xe8803a));
    p.rect(138, 158, 34, G - 158, 0x8a5a30).rect(154, 158, 2, G - 158, 0x6a3a20); // door
    p.rect(132, 152, 46, 5, 0xe0443a);
    // Yard, fence with an open gate.
    p.rect(0, G, 270, h - G, 0x7ab05a);
    p.poly([[140, G], [170, G], [210, h], [100, h]], 0xd8ccb0);
    for (let x = 0; x < 262; x += 5) {
      if (x > 130 && x < 180) continue;
      p.rect(x, G - 2, 3, 9, colors[(x / 5) % colors.length]).rect(x, G - 3, 3, 1, 0xf4f1e8);
    }
    p.rect(0, G + 2, 130, 1, 0xf4f1e8).rect(180, G + 2, 82, 1, 0xf4f1e8);
    tree(p, 8, 236, { size: 16, trunk: 20, seed: 9 });
    // People: the educator at the door, parents and kids.
    person(p, 182, 200, { pose: 'wave', top: 0x9be36b, f: -1, long: true, hair: HAIR[4], skin: SKIN[0] });
    kid(p, 150, 212, { pose: 'run', top: 0xf0c040, hair: HAIR[2], pack: 0xe0443a });
    person(p, 112, 228, { pose: 'walk', top: 0x4a8ae0, skin: SKIN[3], hair: HAIR[3] });
    kid(p, 123, 228, { pose: 'hand', top: 0xff8ab0, f: -1, skin: SKIN[3], hair: HAIR[3], pack: 0x9be36b });
    person(p, 200, 234, { pose: 'walk', top: 0xe8803a, f: -1, long: true, hair: HAIR[1] });
    stroller(p, 186, 234);
    person(p, 60, 232, { pose: 'cheer', top: 0x2c4060, skin: SKIN[2] });
    kid(p, 60, 214, { pose: 'cheer', top: 0xe0443a, hair: HAIR[0], skin: SKIN[2] }); // on dad's shoulders
    bike(p, 244, 236, { f: -1, frame: 0x4a8ae0, top: 0xc9963a, child: 0x9be36b });
  },

  // A park with a running track, a basketball court and a "toret" fountain;
  // the Alps behind, with the Monviso.
  parco(p, w, h) {
    const r = rng(15);
    sky(p, [[0, 0x3a7ac8], [60, 0x6aa0d8], [110, 0xa8d0ec], [140, 0xd8ecf4]]);
    mountains(p, r, { base: 150, top: 82, color: 0x8a9ab8, shade: 0x7a8aa8, snow: 0xf4f8ff, snowLine: 108 });
    monviso(p, 172, 30, 150);
    mountains(p, r, { base: 166, top: 136, color: 0x4a6a4a, shade: 0x3e5e40 });
    for (let x = 0; x < w; x += 9) tree(p, x + between(r, -2, 2), 168, { size: 6, trunk: 3, seed: x, pal: { base: 0x3a6a34, dark: 0x264a22, light: 0x4a7a3a, hl: 0x6a9a4a } });
    // Mowed grass.
    p.rect(0, 166, w, h - 166, (x, y) => (Math.floor((x + (y - 166) * 0.6) / 16) % 2 ? 0x6aa84a : 0x62a044));
    // Running track with lanes, a pitch inside.
    p.ellipse(300, 206, 168, 31, 0xc0583a);
    p.ellipse(300, 206, 160, 26, 0xf4f1e8).ellipse(300, 206, 159, 25, 0xc0583a);
    p.ellipse(300, 206, 151, 20, 0xf4f1e8).ellipse(300, 206, 150, 19, 0x6aa84a);
    p.rect(299, 188, 1, 36, 0xf4f1e8).ellipse(300, 206, 8, 4, 0xf4f1e8).ellipse(300, 206, 7, 3, 0x6aa84a);
    for (const gx of [160, 434]) p.rect(gx, 198, 6, 1, 0xf4f1e8).rect(gx, 198, 1, 10, 0xf4f1e8).rect(gx + 5, 198, 1, 10, 0xf4f1e8);
    kid(p, 250, 212, { pose: 'run', top: 0xe0443a, skin: SKIN[3] });
    kid(p, 280, 208, { pose: 'run', top: 0x4a8ae0, f: -1, hair: HAIR[2] });
    p.ellipse(268, 210, 2, 2, 0xffffff);
    // Runners round the track: the near side runs right, the far side left.
    for (const [a, top, skin] of [[0.35, 0xf0c040, SKIN[1]], [0.62, 0xff4fa3, SKIN[3]], [0.85, 0x4ab0a0, SKIN[0]], [1.3, 0xe8803a, SKIN[2]], [1.75, 0xf4f1e8, SKIN[4]]]) {
      const ang = a * Math.PI;
      person(p, 300 + Math.cos(ang) * 163, 210 + Math.sin(ang) * 28, { pose: 'run', top, skin, f: Math.sin(ang) > 0 ? 1 : -1, bottom: 0x1a1a1a, long: a > 1.5 });
    }
    // Basketball court.
    p.poly([[8, 222], [24, 176], [120, 176], [118, 222]], 0x4a6aa0);
    p.line(8, 222, 24, 176, 0xf4f1e8).line(24, 176, 120, 176, 0xf4f1e8).line(120, 176, 118, 222, 0xf4f1e8).line(8, 222, 118, 222, 0xf4f1e8);
    p.rect(30, 150, 2, 40, 0x6a6a64).rect(24, 144, 14, 9, 0xf4f1e8).rect(28, 148, 6, 4, 0xe0443a).rect(30, 154, 6, 1, 0xff7a2f);
    person(p, 50, 194, { pose: 'cheer', top: 0xe0443a, skin: SKIN[4] });
    p.ellipse(44, 170, 3, 3, 0xe8803a);
    person(p, 84, 212, { pose: 'stand', top: 0xf4f1e8, f: -1, skin: SKIN[2] });
    // A "toret", the green drinking fountain of Torino, and trees.
    tree(p, 466, 196, { size: 14, trunk: 16, seed: 31 });
    const T = 420;
    p.rect(T, 214, 8, 20, 0x2a6a3a).rect(T - 1, 212, 10, 3, 0x2a6a3a).rect(T, 214, 1, 20, 0x3a8a4a).rect(T + 8, 220, 3, 2, 0x2a6a3a);
    p.rect(T + 11, 222, 1, 3, 0x9ad0f0).rect(T + 12, 225, 1, 6, 0x9ad0f0);
    person(p, 444, 234, { pose: 'stand', top: 0x9be36b, f: -1, skin: SKIN[3], hair: HAIR[3] }); // waiting for a sip
    tree(p, 140, 240, { size: 14, trunk: 14, seed: 32 });
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
