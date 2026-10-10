import Phaser from 'phaser';
import { Painter } from './painter.js';

// Spray-paint tags for the Muro, drawn as pixel art: hand-style letters made of
// thick strokes, slanted and bouncing, with a drop shadow, a dark outline,
// drips and a halo of overspray. Glyphs live on a 7×10 grid and may overshoot
// it, like a hand that doesn't care about the lines.
const GLYPHS = {
  A: [
    [[0, 10], [2, 4], [3.5, 0], [5, 4], [6, 10]],
    [[-1, 7.5], [8, 5.5]],
  ],
  D: [[[0, 10], [0, 0], [3.5, 0], [6.5, 3], [6.5, 7], [4, 10], [0, 10]]],
  E: [
    [[6, 0], [0, 0.5], [0, 10], [6.5, 9.5]],
    [[0, 5], [5, 4.5]],
  ],
  F: [
    [[6.5, -0.5], [0, 0.5], [0, 10], [-1, 11]],
    [[0, 5], [5, 4.5]],
  ],
  G: [[[6, 1], [4.5, 0], [2.5, 0.5], [0.5, 3], [0, 7], [2, 10], [4.5, 10], [6.5, 8], [6.5, 5.5], [3.5, 5.5]]],
  N: [[[0, 10.5], [0, 0], [6.5, 10], [6.5, -0.5]]],
  R: [
    [[0, 10], [0, 0], [4.5, 0], [6.5, 2], [5, 4.5], [0.5, 5]],
    [[3, 5], [7, 10.5]],
  ],
  U: [[[0, 0], [0, 7], [2, 10], [4.5, 10], [6.5, 7], [6.5, 0]]],
  '!': [[[1.5, 0], [1, 6.5]], [[0.5, 9.5], [0.5, 10]]],
  C: [[[6, 1], [4.5, 0], [2.5, 0.5], [0.5, 3], [0, 7], [2, 10], [4.5, 10], [6.5, 8.5]]],
  I: [[[1.5, 0], [1.5, 10]]],
  M: [[[0, 10], [0.5, 0], [3.5, 6], [6.5, 0], [6.5, 9], [8, 10.5]]],
  O: [[[3.5, 0], [0.5, 2.5], [0, 6.5], [2.5, 10], [5, 9.5], [6.5, 6], [6, 2], [3.5, 0], [2, 1]]],
  S: [[[6.5, 1], [4.5, 0], [1.5, 0.5], [0.5, 2.5], [2, 4.5], [5.5, 5.5], [6.5, 8], [4.5, 10], [1.5, 10], [-0.5, 8.5]]],
  T: [
    [[0.5, 1.5], [2.5, 0], [5, 1], [8, -0.5]],
    [[3.5, 0.5], [3.5, 10.5]],
  ],
};
// Width of the narrow glyphs, as a fraction of the normal advance.
const NARROW = { I: 0.6, '!': 0.5 };

// One curved stroke under the word, ending in an arrow.
const SWOOSH = [[-2, 13], [10, 15], [30, 14.5], [50, 13], [66, 11.5]];

const lighten = (c, k) => Phaser.Display.Color.ValueToColor(c).lighten(k).color;
const darken = (c, k) => Phaser.Display.Color.ValueToColor(c).darken(k).color;

// Returns a Container positioned at (x, y) (top-left of the tag).
export function sprayTag(scene, x, y, str, opts = {}) {
  const { mist, paint, drips } = paintTag(str, opts);
  const gMist = scene.add.graphics().setAlpha(MIST_ALPHA);
  const gPaint = scene.add.graphics();
  const gDrips = scene.add.graphics();
  mist.toGraphics(gMist);
  paint.toGraphics(gPaint);
  drips.toGraphics(gDrips);
  return scene.add.container(Math.round(x), Math.round(y), [gMist, gPaint, gDrips]);
}

export const MIST_ALPHA = 0.35;

// The tag as three Painters of the same size w×h: the overspray `mist` (to draw
// at MIST_ALPHA), the letters `paint` and the `drips` on top.
export function paintTag(str, opts = {}) {
  const {
    color = 0xff4fa3,
    outline = 0x1c0812,
    shadow = darken(color, 45),
    scale = [1.1, 1.4],
    slant = 0.28,
    advance = 8.4,
    space = 5,
    swoosh = true,
    bounce = 1,
    drips: dripCount = 7,
    crown = 0xe8c06a,
    seed = str,
  } = opts;
  const rnd = new Phaser.Math.RandomDataGenerator([seed]);
  const [sx, sy] = scale;
  const top = (crown ? 6 : 1) + bounce;
  const W = Math.ceil(str.length * advance * sx + 24);
  const H = Math.ceil(top + 16 * sy + 12);

  // Grid → pixel, with italic slant and a per-letter bounce.
  const strokes = [];
  let pen = 2;
  let firstCaps = [];
  for (const ch of str) {
    if (ch === ' ') {
      pen += space;
      continue;
    }
    const glyph = GLYPHS[ch];
    if (!glyph) continue;
    const bob = rnd.between(-bounce, bounce);
    const lean = rnd.realInRange(-0.06, 0.06);
    const map = ([gx, gy]) => {
      const px = (pen + gx) * sx;
      const py = top + gy * sy + bob;
      return [px + (10 * sy + top - py) * (slant + lean) + 2, py];
    };
    glyph.forEach((s) => strokes.push(s.map(map)));
    if (ch === 'C') firstCaps.push(map([3.5, -1.5]));
    pen += advance * (NARROW[ch] ?? 1);
  }
  if (swoosh) {
    const k = pen / 66;
    strokes.push(SWOOSH.map(([gx, gy]) => [(gx * k + 1) * sx + 2, top + gy * sy]));
  }

  const brush = (p, pts, c, dx = 0, dy = 0) => {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
      for (let t = 0; t <= n; t++) {
        const bx = Math.round(x0 + ((x1 - x0) * t) / n + dx);
        const by = Math.round(y0 + ((y1 - y0) * t) / n + dy);
        p.rect(bx, by, 2, 2, c);
      }
    }
  };

  const p = new Painter(W, H);
  // Drop shadow first, then the fill on top, then one outline around both.
  strokes.forEach((s) => brush(p, s, shadow, 1, 1));
  const hi = lighten(color, 18);
  const lo = darken(color, 14);
  const fill = (px, py) => {
    // Light from above, dithered into the base, darker at the bottom.
    const rel = (py - top) / (10 * sy);
    const checker = (px + py) % 2 === 0;
    if (rel < 0.15 || (rel < 0.3 && checker)) return hi;
    if (rel > 0.85 || (rel > 0.7 && checker)) return lo;
    return color;
  };
  strokes.forEach((s) => brush(p, s, fill));

  // Arrow head at the end of the swoosh.
  if (swoosh) {
    const [ax, ay] = strokes[strokes.length - 1].at(-1);
    brush(p, [[ax - 4, ay - 3], [ax + 1, ay], [ax - 3, ay + 4]], fill);
  }
  // A small king's crown over the first C.
  if (crown && firstCaps.length) {
    const [cx, cy] = firstCaps[0];
    const x0 = Math.round(cx - 4);
    const y0 = Math.round(cy - 4);
    p.rect(x0, y0 + 3, 9, 2, crown);
    [0, 4, 8].forEach((o) => p.rect(x0 + o, y0, 1, 3, crown));
    p.rect(x0 + 2, y0 + 2, 1, 1, crown).rect(x0 + 6, y0 + 2, 1, 1, crown);
  }
  p.outline(outline);

  // Shine: a few white ticks on the upper-left of the letters.
  for (let i = 0; i < 6; i++) {
    const s = strokes[rnd.between(0, strokes.length - 2)];
    const [hx, hy] = s[0];
    const px = Math.round(hx);
    const py = Math.round(hy);
    if (p.get(px, py) === color || p.get(px, py) === hi) p.set(px, py, 0xffffff);
  }

  // Drips: from the bottom edge of the paint, straight down with a drop at the end.
  const drips = new Painter(W, H);
  let made = 0;
  for (let tries = 0; tries < 200 && made < dripCount; tries++) {
    const dx = rnd.between(4, W - 4);
    let bottom = -1;
    for (let yy = H - 1; yy >= 0; yy--) {
      const c = p.get(dx, yy);
      if (c === lo || c === color) {
        bottom = yy;
        break;
      }
    }
    if (bottom < 0 || p.get(dx, bottom + 1) !== outline) continue;
    const len = rnd.between(2, 7);
    const end = Math.min(H - 2, bottom + 1 + len);
    drips.rect(dx, bottom + 1, 1, end - bottom - 1, lo);
    drips.rect(dx, end, 1, 1, lo).rect(dx, end + 1, 1, 1, darken(color, 30));
    if (len > 4) drips.rect(dx + 1, end, 1, 1, lo);
    made++;
  }

  // Overspray: sparse dots around the paint, drawn semi-transparent.
  const mist = new Painter(W, H);
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      if (p.get(xx, yy) !== null) continue;
      let near = false;
      for (let r = 1; r <= 3 && !near; r++) {
        near = p.get(xx + r, yy) !== null || p.get(xx - r, yy) !== null || p.get(xx, yy + r) !== null || p.get(xx, yy - r) !== null;
      }
      if (near && rnd.frac() < 0.22) mist.set(xx, yy, color);
    }
  }

  return { w: W, h: H, mist, paint: p, drips };
}
