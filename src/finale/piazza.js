// Piazza Crispi seen from under its market canopy, for the finale's march:
// light-blue round pillars covered in stickers and torn posters, each one
// opening into a "tree" of dark green steel struts, a hipped roof of
// translucent corrugated panels on a green grid with a raised lantern in the
// middle, grey concrete underneath, Barriera's beige and brick blocks round
// the edge. One-point perspective towards the far end of the canopy, where
// the procession comes from. Drawn on a Painter, no Phaser.
import { rng } from '../rng.js';

export const PIAZZA_W = 480;
export const PIAZZA_H = 270;
// The vanishing point: the far end of the canopy.
export const VP = { x: 240, y: 118 };

const BLUE = { base: 0x4a8ec8, dark: 0x2e6a9a, light: 0x78b0e0 };
const GREEN = 0x1e4a34;
const GREEN_LIGHT = 0x2e6a4a;
const PANEL = 0xbab6a6;
const PANEL_DARK = 0x9a968a;

// Pillar pairs from the front (depth 0) to the back: s is the perspective
// scale, how big things at that depth look.
export const DEPTHS = [0, 1, 2, 3, 4, 5, 6].map((d) => 1 / (1 + 0.55 * d));
const HALF_W = 205; // pillars' distance from the middle, at depth 0
const GROUND = 150; // ground below the vanishing point, at depth 0
const TOP = 70; // pillar tops above it, at depth 0
const RIDGE = 40; // the roof's ridge above the tops, at depth 0
const at = (s, dx, dy) => ({ x: Math.round(VP.x + dx * s), y: Math.round(VP.y + dy * s) });

export function drawPiazza(p) {
  const r = rng(1931);
  sky(p);
  buildings(p, r);
  ground(p);
  roof(p);
  // Pillars from the back, so the nearer ones go over.
  for (let i = DEPTHS.length - 1; i >= 0; i--) {
    for (const side of [-1, 1]) pillar(p, DEPTHS[i], side, r);
  }
}

// A grey dawn over the blocks.
function sky(p) {
  p.rect(0, 0, PIAZZA_W, PIAZZA_H, (x, y) => (y < 60 ? 0x8a94a4 : y < 90 ? ((x + y) % 2 ? 0x8a94a4 : 0xa8a4a0) : 0xb8aca0));
}

// The blocks of Barriera seen past the canopy: beige and brick facades,
// rows of windows with shutters, at the far end and down both sides.
function buildings(p, r) {
  const far = DEPTHS.at(-1);
  const top = at(far, 0, -TOP - RIDGE).y - 30;
  const bottom = at(far, 0, GROUND).y;
  // The far end: a row of facades across the vanishing point.
  let x = 0;
  while (x < PIAZZA_W) {
    const w = 28 + Math.floor(r() * 30);
    const h = 40 + Math.floor(r() * 40);
    const brick = r() < 0.45;
    facade(p, x, bottom - h - (VP.y - top) / 2, w, h + (VP.y - top) / 2, brick, r);
    x += w;
  }
  // Down the sides, bigger and nearer, cut off by the roof and the ground.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w = 70 - i * 18;
      const x0 = side < 0 ? i * 52 : PIAZZA_W - i * 52 - w;
      facade(p, x0, 30 + i * 12, w, PIAZZA_H - 60 - i * 24, i % 2 === 0, r);
    }
  }
}

function facade(p, x, y, w, h, brick, r) {
  const base = brick ? 0xb8684a : 0xd8c8a0;
  const shade = brick ? 0x9a5238 : 0xbcae88;
  p.rect(x, y, w, h, (xx, yy) => ((xx * 3 + yy * 7) % 13 === 0 ? shade : base));
  p.rect(x, y, 1, h, shade);
  // Windows, with green or brown shutters, some open.
  const ww = Math.max(3, Math.floor(w / 6));
  for (let wy = y + 6; wy < y + h - 10; wy += 14) {
    for (let wx = x + 4; wx < x + w - ww - 2; wx += ww * 2) {
      p.rect(wx, wy, ww, 7, 0x3a3a44);
      if (r() < 0.5) p.rect(wx, wy, ww, 7, r() < 0.5 ? 0x5a7a4a : 0x7a5a3a);
      p.rect(wx - 1, wy + 7, ww + 2, 1, 0xe8e4d8); // the sill
    }
  }
  // Balconies on the beige blocks.
  if (!brick) for (let by = y + 19; by < y + h - 10; by += 28) p.rect(x + 2, by, w - 4, 2, 0x6a6a6a);
}

// The concrete under the canopy, with its joints running to the far end.
function ground(p) {
  const y0 = at(DEPTHS.at(-1), 0, GROUND).y;
  for (let y = y0; y < PIAZZA_H; y++) {
    const t = (y - y0) / (PIAZZA_H - y0);
    for (let x = 0; x < PIAZZA_W; x++) p.set(x, y, (x * 5 + y * 3) % 17 === 0 ? 0x7a7a74 : t > 0.5 ? 0x8e8c86 : 0x96948e);
  }
  for (const dx of [-600, -380, -200, -60, 60, 200, 380, 600]) p.line(VP.x, y0, VP.x + dx, PIAZZA_H, 0x7e7c76);
  for (const s of DEPTHS) {
    const y = at(s, 0, GROUND).y;
    p.rect(0, y, PIAZZA_W, 1, 0x84827c);
  }
}

// The roof seen from below: translucent corrugated panels between green
// beams, rising to a ridge in the middle, with a raised lantern of glass
// slats over the centre.
function roof(p) {
  const front = DEPTHS[0];
  const far = DEPTHS.at(-1);
  const edge = (s) => at(s, 0, -TOP).y; // where the roof meets the pillar tops
  const ridge = (s) => at(s, 0, -TOP - RIDGE).y;
  // Each column of the screen: the roof from the top of the screen down to
  // the beam line, with the ridge rising in the middle.
  for (let x = 0; x < PIAZZA_W; x++) {
    const u = Math.abs(x - VP.x) / (HALF_W * front); // 0 in the middle, 1 at the front pillars
    const yFront = Math.round(edge(front) + (ridge(front) - edge(front)) * Math.max(0, 1 - u));
    const yFar = Math.round(edge(far) + (ridge(far) - edge(far)) * Math.max(0, 1 - Math.abs(x - VP.x) / (HALF_W * far)));
    const bottom = Math.max(yFront, Math.min(yFar, yFront + 200));
    for (let y = 0; y <= Math.min(bottom, ridge(far) + 40); y++) {
      if (y > yFar && Math.abs(x - VP.x) < HALF_W * far) continue; // past the far end: the sky shows
      // corrugated: light and dark stripes running to the far end
      const stripe = Math.floor(((x - VP.x) / Math.max(1, VP.y - y + 40)) * 24) % 2;
      p.set(x, y, stripe ? PANEL : PANEL_DARK);
    }
  }
  // The lantern: a raised band of glass slats over the middle.
  for (let x = VP.x - 46; x <= VP.x + 46; x++) {
    for (let y = 0; y < 22; y++) p.set(x, y, (x - VP.x + 46) % 6 < 2 ? GREEN : 0xd8dcd0);
  }
  p.rect(VP.x - 48, 22, 97, 2, GREEN);
  // Beams across, at each pair of pillars, following the ridge.
  for (const s of DEPTHS) {
    const l = at(s, -HALF_W, -TOP);
    const rr = at(s, HALF_W, -TOP);
    const top = at(s, 0, -TOP - RIDGE);
    p.line(l.x, l.y, top.x, top.y, GREEN).line(top.x, top.y, rr.x, rr.y, GREEN);
    p.line(l.x, l.y + 1, top.x, top.y + 1, GREEN_LIGHT).line(top.x, top.y + 1, rr.x, rr.y + 1, GREEN_LIGHT);
  }
  // Beams along, from the front to the far end: the edges and the ridge.
  for (const [dx, dy] of [[-HALF_W, -TOP], [HALF_W, -TOP], [0, -TOP - RIDGE], [-HALF_W / 2, -TOP - RIDGE / 2], [HALF_W / 2, -TOP - RIDGE / 2]]) {
    const a = at(front, dx, dy);
    const b = at(far, dx, dy);
    p.line(a.x, a.y, b.x, b.y, GREEN);
  }
}

// A light-blue round pillar at depth s on one side, stickers and torn
// posters on the shaft, a tree of green struts fanning out at the top.
function pillar(p, s, side, r) {
  const base = at(s, side * HALF_W, GROUND);
  const top = at(s, side * HALF_W, -TOP);
  const w = Math.max(2, Math.round(12 * s));
  const x0 = base.x - Math.floor(w / 2);
  for (let y = top.y; y <= base.y; y++) {
    for (let i = 0; i < w; i++) {
      const u = i / w;
      p.set(x0 + i, y, u < 0.25 ? BLUE.light : u > 0.7 ? BLUE.dark : BLUE.base);
    }
  }
  // Stickers and posters, mostly low on the shaft, some torn.
  const n = Math.round(6 * s) + 1;
  for (let i = 0; i < n; i++) {
    const py = base.y - Math.floor(r() * (base.y - top.y) * 0.6) - 2;
    const pw = Math.max(1, Math.round((3 + r() * 5) * s));
    const ph = Math.max(1, Math.round((3 + r() * 8) * s));
    const c = [0xf4f1e8, 0xe8d8a8, 0xe0443a, 0xd8d0c0, 0x3a3a3a][Math.floor(r() * 5)];
    p.rect(x0 + Math.floor(r() * Math.max(1, w - pw)), py - ph, pw, ph, c);
  }
  // A no-parking sign on some.
  if (s > 0.5 && side < 0) {
    const sy = base.y - Math.round(78 * s);
    p.rect(x0 + w, sy, Math.round(12 * s), Math.round(18 * s), 0xf4f1e8);
    p.ellipse(x0 + w + 6 * s, sy + 5 * s, 4 * s, 4 * s, 0x2a5ab8);
    p.rect(x0 + w + 2 * s, sy + 5 * s, 8 * s, 1, 0xe0443a);
  }
  // The tree of struts: out to the beams across and along, up to the ridge.
  const reach = 46 * s;
  const ends = [
    [top.x - reach, top.y - reach * 0.25],
    [top.x + reach, top.y - reach * 0.25],
    [top.x - side * reach * 0.6, top.y - reach * 0.7],
    [top.x - side * reach * 0.2, top.y - reach * 0.55],
    [top.x + side * reach * 0.15, top.y - reach * 0.4],
  ];
  for (const [ex, ey] of ends) {
    p.line(top.x, top.y + 2, ex, ey, GREEN);
    if (s > 0.6) p.line(top.x + 1, top.y + 2, ex + 1, ey, GREEN_LIGHT);
  }
}
