// Props of the Bar Stella, drawn with the Painter (see tools/sprites/bar.mjs).
import { Painter } from '../painter.js';
import { miniText, miniTextCentered } from './minifont.js';
// Ball of yarn with two knitting needles stuck in it and a loose thread
// trailing on the counter (the bar's knitting: Franco's scarves, Don Remo).
export const YARN = { w: 30, h: 20 };

const WOOL = { base: 0xb03a5a, dark: 0x7a2240, light: 0xd85a7a, hl: 0xf6a8bc };
// Each shade one step darker, for the grooves between the wraps.
const GROOVE = { [WOOL.hl]: WOOL.light, [WOOL.light]: WOOL.base, [WOOL.base]: WOOL.dark, [WOOL.dark]: 0x561632 };

export function drawYarn(p) {
  const cx = 11;
  const cy = 11.5;
  const r = 7.5;
  // Flat bands instead of the dithered shader: dithering hides the wraps.
  p.ellipse(cx, cy, r, r, (x, y) => {
    const d = ((x + 0.5 - cx) + (y + 0.5 - cy)) / r;
    if ((x + 0.5 - cx + 3) ** 2 + (y + 0.5 - cy + 3) ** 2 < 2.5) return WOOL.hl;
    return d < -0.75 ? WOOL.light : d > 0.6 ? WOOL.dark : WOOL.base;
  });

  // Wraps: the visible front half of tilted rings around the ball.
  const ring = (angle, squash) => {
    const a = (angle * Math.PI) / 180;
    for (let t = 0; t <= Math.PI; t += 0.05) {
      const ex = Math.cos(t) * r;
      const ey = Math.sin(t) * r * squash;
      const x = Math.floor(cx + ex * Math.cos(a) - ey * Math.sin(a));
      const y = Math.floor(cy + ex * Math.sin(a) + ey * Math.cos(a));
      const c = p.get(x, y);
      if (c !== null && GROOVE[c] !== undefined) p.set(x, y, GROOVE[c]);
    }
  };
  // A few nested wraps around one axis, and one crossing them: more and the
  // ball turns to noise at this size.
  for (const squash of [0.2, 0.55, 0.9]) ring(-35, squash);
  ring(55, -0.45);

  // Needles: steel, a darker underside, wooden knobs; stuck in from the top.
  // Drawn only outside the ball, so they look pushed into the wool.
  const needle = (x0, y0, x1, y1) => {
    const wool = new Set(p.px.map((c, i) => (c === null ? -1 : i)));
    const outside = (fn) => (x, y) => (wool.has(y * p.w + x) ? p.get(x, y) : fn);
    p.line(x0, y0 + 1, x1, y1 + 1, outside(0x6a6e7a));
    p.line(x0, y0, x1, y1, outside(0xd8dce4));
    p.rect(x1 - 1, y1 - 1, 2, 2, 0xe0a030);
    p.set(x1 - 1, y1 - 1, 0xffd070);
  };
  needle(11, 10, 25, 1);
  needle(10, 10, 2, 2);

  p.outline(0x3a0c1c);

  // Loose thread on the counter, no outline: it's a single strand.
  p.line(16, 18, 20, 19, WOOL.light);
  p.line(21, 19, 29, 19, WOOL.light);
}

// Posters stuck on the front of the counter, under Mei Li.
export const POSTER = { w: 48, h: 48 };

// Scotch tape on the corners and a torn corner: posters are stuck on in a hurry.
function tape(p, x, y) {
  p.rect(x, y, 6, 3, 0xd8d0a8);
  p.set(x, y, 0xbfb690);
  p.set(x + 5, y + 2, 0xbfb690);
}
function tear(p, w, h, size) {
  for (let i = 0; i < size; i++) for (let j = 0; j < size - i; j++) p.set(w - 1 - j, h - 1 - i, null);
}

// Gig poster for Nerorgasmo, Turin punk: black xerox, yellow title, a skull.
export function drawPunkPoster(p) {
  const { w, h } = POSTER;
  p.rect(0, 0, w, h, 0x141414);
  // Photocopy grain.
  for (let i = 0; i < 70; i++) p.set((i * 37) % w, (i * 53 + (i >> 2)) % h, 0x2c2c2c);
  miniTextCentered(p, 'NERORGASMO', w / 2 + 1, 4, 0x7a6a10);
  miniTextCentered(p, 'NERORGASMO', w / 2, 3, 0xffe14a);
  // Skull.
  const sx = 17;
  const sy = 11;
  const bone = 0xf0ece0;
  p.ellipse(sx + 7, sy + 6, 7, 6.5, bone);
  p.rect(sx + 3, sy + 11, 9, 4, bone);
  p.ellipse(sx + 4.5, sy + 7, 2, 2, 0x141414);
  p.ellipse(sx + 9.5, sy + 7, 2, 2, 0x141414);
  p.rect(sx + 7, sy + 10, 1, 2, 0x141414);
  for (let x = sx + 4; x < sx + 12; x += 2) p.rect(x, sy + 13, 1, 2, 0x141414);
  // Crossbones behind.
  p.line(sx - 3, sy + 16, sx + 17, sy + 20, bone);
  p.line(sx - 3, sy + 20, sx + 17, sy + 16, bone);
  miniTextCentered(p, 'LIVE!', w / 2, 34, 0xff4fa3);
  miniTextCentered(p, 'SAB 23:00', w / 2, 41, 0xf0ece0);
  tear(p, w, h, 5);
  tape(p, 1, 0);
  tape(p, w - 7, 0);
}

// Flyer of the Baltea, the NGO round the corner: green header, a bowl of
// hummus, and a regular's red marker review.
export function drawBalteaPoster(p) {
  const { w, h } = POSTER;
  p.rect(0, 0, w, h, 0xf2ead0);
  p.rect(0, 0, w, 11, 0x4f7f3a);
  miniTextCentered(p, 'BALTEA', w / 2, 3, 0xf2ead0);
  miniTextCentered(p, 'MENU ETICO', w / 2, 13, 0x4f7f3a);
  // Bowl of hummus with a leaf on top.
  const bx = w / 2;
  p.ellipse(bx, 25, 11, 3, 0xd8b878);
  p.ellipse(bx - 2, 24.5, 4, 1.2, 0xe8d098);
  p.rect(bx - 11, 25, 22, 3, 0x8a5a34);
  p.ellipse(bx, 28, 10, 3, 0x8a5a34);
  p.rect(bx - 11, 25, 1, 3, 0x5a3a20);
  p.rect(bx + 1, 22, 3, 1, 0x6ab04a);
  p.rect(bx + 2, 21, 2, 1, 0x6ab04a);
  // A fly.
  p.set(bx + 7, 19, 0x141414);
  p.set(bx + 6, 18, 0xa0a8b0);
  p.set(bx + 8, 18, 0xa0a8b0);
  miniTextCentered(p, 'HUMMUS', w / 2, 34, 0x3a2a1a);
  miniTextCentered(p, '100% VEGANO', w / 2, 40, 0x4f7f3a);
  // "BLEAH" scrawled across it in red marker, slanted.
  [...'BLEAH'].forEach((ch, i) => {
    miniText(p, ch, 26 + i * 4, 30 - i * 2, 0x7a1010);
    miniText(p, ch, 25 + i * 4, 29 - i * 2, 0xff3030);
  });
  tear(p, w, h, 3);
  tape(p, 1, 0);
  tape(p, w - 7, 0);
}

// Anatra Zoppa's grand reopening: a duck in shades with a leg in plaster.
export function drawDuckPoster(p) {
  const { w, h } = POSTER;
  p.rect(0, 0, w, h, 0x6fc3df);
  p.rect(0, 0, w, 10, 0xffe14a);
  miniTextCentered(p, 'ANATRA ZOPPA', w / 2, 3, 0x141414);
  // Sun rays behind the duck.
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.3;
    p.line(24 + Math.cos(a) * 9, 21 + Math.sin(a) * 8, 24 + Math.cos(a) * 15, 21 + Math.sin(a) * 12, 0x9ad8ec);
  }
  // The duck is drawn on its own layer so it gets an outline of its own.
  const d = new Painter(w, h);
  const yellow = 0xffd23a;
  const shade = 0xe8b028;
  const orange = 0xf07a20;
  // Legs: one orange, one in a white cast, plus a crutch under the wing.
  d.rect(20, 27, 1, 4, orange);
  d.rect(18, 31, 4, 1, orange);
  d.rect(26, 27, 3, 4, 0xf4f4f0);
  d.rect(26, 28, 3, 1, 0xc8c8c0);
  d.rect(25, 31, 5, 1, 0xf4f4f0);
  d.line(33, 21, 34, 31, 0x8a5a34);
  d.rect(32, 21, 3, 1, 0x8a5a34);
  // Body, wing, head, beak.
  d.ellipse(23, 23, 8, 5, yellow);
  d.ellipse(26, 26, 6, 2, shade, { over: true });
  d.ellipse(24, 22, 4, 2.5, shade);
  d.ellipse(18, 15, 4.5, 4.5, yellow);
  d.rect(11, 15, 4, 2, orange);
  d.rect(12, 17, 3, 1, 0xc05a10);
  // Sunglasses with a glint.
  d.rect(14, 13, 9, 1, 0x141414);
  d.rect(14, 14, 4, 2, 0x141414);
  d.rect(19, 14, 4, 2, 0x141414);
  d.set(15, 14, 0xffffff);
  d.set(20, 14, 0xffffff);
  d.outline(0x3a2a10);
  d.px.forEach((c, i) => c !== null && p.set(i % w, Math.floor(i / w), c));
  miniTextCentered(p, 'GRAND', w / 2, 34, 0xff4fa3);
  miniTextCentered(p, 'REOPENING!', w / 2, 40, 0x141414);
  tear(p, w, h, 3);
  tape(p, 1, 0);
  tape(p, w - 7, 0);
}
