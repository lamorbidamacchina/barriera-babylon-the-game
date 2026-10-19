// Ruspe in fuga sprites drawn on a Painter, without Phaser (so the preview
// tool and the tests can use them): the street map seen from above, the
// bulldozer, the signs, the kids of the tool bar. textures.js turns them into
// textures.
import { Painter, shaded } from '../../painter.js';
import { rng } from '../../rng.js';
import { TILE, COLS, ROWS, ROAD } from './rules.js';
import { miniTextCentered } from '../../sprites/minifont.js';

export const MAP_KEY = (level) => `ruspe-map-${level}`;
export const RUSPA_KEY = 'ruspe-ruspa';
export const RUSPA_SIZE = 28;
// One texture per kind and direction: rotating a small arrow on the GPU
// blurs it (on iPad the left one looked like a +).
export const signKey = (kind, dir) => `ruspe-sign-${kind}-${dir}`;
export const SIGN_SIZE = 21;
export const CURSOR_KEY = 'ruspe-cursor';
export const FACE_SIZE = 20;
export const faceKey = (kid) => `ruspe-face-${kid}`;
export const MARBLES_KEY = 'ruspe-marbles';
export const MARBLES_SIZE = 22;
export const FOAM_KEY = 'ruspe-foam';
export const FOAM_SIZE = 26;

const ASPHALT = 0x2b2f37;
const ASPHALT_2 = 0x30343d;
const LANE = 0x9a9480;
const PAVING = 0x5e5e5a;
const PAVING_SEAM = 0x4e4e4a;
const CURB_LIGHT = 0x8a8a82;
const HALF = TILE / 2;

// Draws q's pixels on p at (x, y), each one k×k: logos and statues drawn
// small and set on the map bigger, with the same chunky pixels.
function stamp(p, q, x, y, k = 1) {
  q.px.forEach((c, i) => {
    if (c !== null) p.rect(x + (i % q.w) * k, y + Math.floor(i / q.w) * k, k, k, c);
  });
}

// ---------------------------------------------------------------- the map

// The whole map of a level (rows: rules.js characters), TILE pixels a cell.
export function drawMap(p, rows) {
  const r = rng(rows.join('').length * 31 + 7);
  const at = (x, y) => (x >= 0 && y >= 0 && x < COLS && y < ROWS ? rows[y][x] : '#');
  const road = (x, y) => ROAD.has(at(x, y));
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = at(x, y);
      const px = x * TILE;
      const py = y * TILE;
      if (road(x, y)) drawRoad(p, px, py, road(x - 1, y), road(x + 1, y), road(x, y - 1), road(x, y + 1));
      else if (c === 'K') drawSite(p, px, py, r);
      else if (c === 'M') drawMallRoof(p, px, py, r);
      else if (c === 'T') drawPark(p, px, py, r);
      else if (c === 'W') drawMuro(p, px, py, x, y);
      else if (c === 'S') drawPark(p, px, py, () => 0.99); // lawn, no trees: the sphinx goes on it
      else drawRoof(p, px, py, x, y, r);
      if (!road(x, y)) drawPavement(p, px, py, road(x - 1, y), road(x + 1, y), road(x, y - 1), road(x, y + 1));
    }
  }
  // Big things drawn over their blocks.
  drawMallLogo(p, longestRun(rows, 'M'));
  for (const [ch, draw] of [
    ['K', drawSiteSign],
    ['W', drawMuroStencil],
    ['S', drawSphinx],
  ]) {
    const box = bounds(rows, ch);
    if (box) draw(p, box);
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (at(x, y) === 'C') drawGate(p, x * TILE, y * TILE, at(x, y - 1) === 'K' || y === 0 ? 'up' : at(x - 1, y) === 'K' ? 'left' : at(x + 1, y) === 'K' ? 'right' : 'down');
      // The chevrons point away from the street that leads in.
      if (at(x, y) === 'A') drawEntrance(p, x * TILE, y * TILE, road(x, y - 1) ? 'down' : road(x, y + 1) ? 'up' : road(x - 1, y) ? 'right' : 'left');
    }
  }
}

// The cells of a kind, as a pixel box (null when the map has none).
function bounds(rows, ch) {
  let x0 = COLS;
  let y0 = ROWS;
  let x1 = -1;
  let y1 = -1;
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== ch) return;
    x0 = Math.min(x0, x), y0 = Math.min(y0, y), x1 = Math.max(x1, x), y1 = Math.max(y1, y);
  }));
  return x1 < 0 ? null : { x: x0 * TILE, y: y0 * TILE, w: (x1 - x0 + 1) * TILE, h: (y1 - y0 + 1) * TILE };
}

// The longest unbroken row of cells of a kind, as a pixel box spanning all
// the rows the kind takes up there: room for a logo, away from the entrance.
function longestRun(rows, ch) {
  let best = null;
  rows.forEach((row, y) => {
    for (let x = 0; x < COLS; ) {
      if (row[x] !== ch) {
        x++;
        continue;
      }
      let end = x;
      while (end < COLS && row[end] === ch) end++;
      if (!best || end - x > best.n) best = { x, y, n: end - x };
      x = end;
    }
  });
  if (!best) return null;
  let y0 = best.y;
  let y1 = best.y;
  const full = (y) => rows[y] && [...rows[y].slice(best.x, best.x + best.n)].every((c) => c === ch);
  while (full(y0 - 1)) y0--;
  while (full(y1 + 1)) y1++;
  return { x: best.x * TILE, y: y0 * TILE, w: best.n * TILE, h: (y1 - y0 + 1) * TILE };
}

// Asphalt, with a dashed middle line along straight stretches; crossings
// and bends stay plain.
function drawRoad(p, px, py, l, rt, u, d) {
  p.rect(px, py, TILE, TILE, (x, y) => ((x * 3 + y * 5) % 7 === 0 ? ASPHALT_2 : (x * 5 + y * 3) % 11 === 0 ? 0x272a31 : ASPHALT));
  const horizontal = (l || rt) && !u && !d;
  const vertical = (u || d) && !l && !rt;
  if (horizontal) for (let x = 3; x < TILE; x += 16) p.rect(px + x, py + HALF - 1, 10, 2, LANE);
  if (vertical) for (let y = 3; y < TILE; y += 16) p.rect(px + HALF - 1, py + y, 2, 10, LANE);
}

// A pavement along the sides of a block facing a street, with a lighter
// kerb and the seams of the slabs.
function drawPavement(p, px, py, l, rt, u, d) {
  const W = 5;
  const slab = (x, y) => ((x % 8 === 0 || y % 8 === 0) ? PAVING_SEAM : PAVING);
  if (u) p.rect(px, py, TILE, W, slab).rect(px, py, TILE, 1, CURB_LIGHT);
  if (d) p.rect(px, py + TILE - W, TILE, W, slab).rect(px, py + TILE - 1, TILE, 1, 0x3e3e3a);
  if (l) p.rect(px, py, W, TILE, slab).rect(px, py, 1, TILE, CURB_LIGHT);
  if (rt) p.rect(px + TILE - W, py, W, TILE, slab).rect(px + TILE - 1, py, 1, TILE, 0x3e3e3a);
}

// Barriera's condominiums from above: flat roofs in a few dull colours, one
// colour per pair of cells, with skylights, satellite dishes, aerials, air
// conditioners and chimneys.
const ROOFS = [0x4a4440, 0x55483c, 0x3f4650, 0x5a4a42, 0x4c4c48];
function drawRoof(p, px, py, x, y, r) {
  const base = ROOFS[(Math.floor(x / 2) * 7 + y * 3) % ROOFS.length];
  p.rect(px, py, TILE, TILE, (xx, yy) => ((xx + yy) % 6 === 0 ? base + 0x060606 : (xx * 3 + yy) % 13 === 0 ? base - 0x050505 : base));
  // A parapet between buildings, every two cells.
  if (x % 2 === 0) p.rect(px, py, 2, TILE, base + 0x101010).rect(px + 2, py, 1, TILE, 0x2a2622);
  const k = r();
  const ox = px + 7 + Math.floor(r() * 10);
  const oy = py + 7 + Math.floor(r() * 10);
  if (k < 0.22) p.rect(ox, oy, 9, 7, 0x6e7a88).rect(ox, oy, 9, 1, 0x9aa8b8).rect(ox + 4, oy, 1, 7, 0x4a5462); // skylight
  else if (k < 0.38) p.ellipse(ox + 4, oy + 4, 4.5, 4.5, 0xb8b8b0).ellipse(ox + 4, oy + 4, 2, 2, 0x9a9a92).rect(ox + 5, oy + 2, 1, 1, 0xe8e4d8); // dish
  else if (k < 0.52) p.line(ox, oy + 9, ox + 9, oy, 0x8a8a80).line(ox + 3, oy, ox + 9, oy + 6, 0x8a8a80).line(ox + 1, oy + 3, ox + 6, oy + 8, 0x8a8a80); // aerial
  else if (k < 0.66) p.rect(ox, oy, 9, 7, 0x8a9098).rect(ox, oy, 9, 1, 0xb0b6be).ellipse(ox + 4, oy + 4, 2.5, 2.5, 0x3a3f48); // air conditioner
  else if (k < 0.74) p.rect(ox, oy, 5, 5, 0x2a2622).rect(ox + 1, oy + 1, 3, 3, 0x14100c); // chimney
}

// The Muro construction site: churned earth, sand piles, pipes.
function drawSite(p, px, py, r) {
  p.rect(px, py, TILE, TILE, (x, y) => ((x * 7 + y * 3) % 9 === 0 ? 0x4a3a24 : (x + y) % 4 === 0 ? 0x5e4a2e : 0x56442a));
  if (r() < 0.35) p.ellipse(px + 8 + r() * 16, py + 8 + r() * 16, 6, 4, shaded({ base: 0x9a8250, dark: 0x7a6440, light: 0xb89a62 }, px + 16, py + 16, 8, 6)); // sand
  if (r() < 0.25) p.rect(px + 5, py + 18, 20, 4, 0x8a8a80).rect(px + 5, py + 18, 20, 1, 0xa8a89e).rect(px + 5, py + 24, 20, 4, 0x8a8a80); // pipes
}

// The mall: a big flat roof, pale grey panels, with air conditioning boxes.
function drawMallRoof(p, px, py, r) {
  p.rect(px, py, TILE, TILE, (x, y) => (x % 16 === 0 || y % 16 === 0 ? 0x6e737a : (x + y) % 9 === 0 ? 0x868b92 : 0x7d828a));
  if (r() < 0.2) p.rect(px + 6, py + 6, 12, 9, 0x9aa0a8).rect(px + 6, py + 6, 12, 1, 0xb8bcc4).ellipse(px + 12, py + 11, 3, 3, 0x4a505a);
}

// The Muro already built, from above: concrete panels as in Muro Panic,
// one per cell, bolted.
function drawMuro(p, px, py, x, y) {
  p.rect(px, py, TILE, TILE, (xx, yy) => ((xx * 13 + yy * 7) % 23 === 0 ? 0x545450 : (xx * 5 + yy * 11) % 17 === 0 ? 0x4c4c47 : 0x5b5b58));
  p.rect(px, py, 1, TILE, 0x45453f).rect(px + 1, py, 1, TILE, 0x6a6a64);
  p.rect(px, py, TILE, 1, 0x45453f).rect(px, py + 1, TILE, 1, 0x6a6a64);
  for (const [bx, by] of [[5, 5], [TILE - 8, 5], [5, TILE - 8], [TILE - 8, TILE - 8]]) p.rect(px + bx, py + by, 3, 3, 0x3a3a38).rect(px + bx, py + by, 1, 1, 0x8a8a84);
  if ((x + y) % 3 === 0) p.rect(px + 9, py + 12, 1, 9, 0x6a4a34); // rust drip
}

// MURO stencilled on its top, in ocra.
function drawMuroStencil(p, box) {
  miniTextCentered(p, 'MURO', box.x + box.w / 2, box.y + Math.floor(box.h / 2) - 7, 0xc9963a, 3);
}

// The sphinx in the middle of the roundabout of corso Romania, from above:
// a stone lion lying down, paws forward, the striped headdress of a pharaoh.
function drawSphinx(p, box) {
  const q = new Painter(34, 22);
  const stone = { base: 0xc8b48a, dark: 0x9a8862, light: 0xe0d0a8, hl: 0xf0e4c4 };
  q.rect(1, 15, 32, 6, 0x8a8a80).rect(1, 15, 32, 1, 0xa8a89e); // the plinth
  q.ellipse(19, 11, 11, 5, shaded(stone, 19, 11, 11, 5)); // body
  q.ellipse(30, 13, 3, 2, shaded(stone, 30, 13, 3, 2)); // tail curled
  q.rect(1, 12, 9, 2, 0xb8a47a); // front paws
  q.ellipse(9, 7, 4.5, 5, shaded(stone, 9, 7, 4.5, 5)); // head
  for (const y of [3, 5, 7, 9, 11]) q.rect(5, y, 2, 1, 0x3a5a9a).rect(12, y, 2, 1, 0x3a5a9a); // headdress
  q.rect(5, 2, 9, 1, 0xd8a840);
  q.rect(7, 6, 1, 1, 0x3a2a14).rect(10, 6, 1, 1, 0x3a2a14); // eyes
  q.outline(0x3a3020);
  const k = Math.max(1, Math.min(Math.floor((box.w - 8) / 34), Math.floor((box.h - 8) / 22)));
  stamp(p, q, box.x + Math.floor((box.w - 34 * k) / 2), box.y + Math.floor((box.h - 22 * k) / 2), k);
}

// A park: grass and round tree tops.
function drawPark(p, px, py, r) {
  p.rect(px, py, TILE, TILE, (x, y) => ((x * 5 + y * 3) % 7 === 0 ? 0x24402a : (x * 3 + y * 7) % 13 === 0 ? 0x2e5034 : 0x2a4a30));
  for (let i = 0; i < 3; i++) {
    const cx = px + 6 + r() * 20;
    const cy = py + 6 + r() * 20;
    p.ellipse(cx + 1, cy + 2, 6, 5, 0x1c3220); // its shadow
    p.ellipse(cx, cy, 6, 6, shaded({ base: 0x3a6a3a, dark: 0x24482a, light: 0x5a8a4a, hl: 0x7aa86a }, cx, cy, 6, 6));
  }
}

// The way out of the construction site: a red and white barrier, lifted,
// on the side of the site, and an orange warning light.
function drawGate(p, px, py, side) {
  const bar = (x, y) => (Math.floor((x + y) / 4) % 2 ? 0xf4f1e8 : 0xe0443a);
  if (side === 'up') p.rect(px, py, TILE, 4, bar).rect(px, py + 4, TILE, 1, 0x1a1a1a);
  if (side === 'down') p.rect(px, py + TILE - 4, TILE, 4, bar).rect(px, py + TILE - 5, TILE, 1, 0x1a1a1a);
  if (side === 'left') p.rect(px, py, 4, TILE, bar).rect(px + 4, py, 1, TILE, 0x1a1a1a);
  if (side === 'right') p.rect(px + TILE - 4, py, 4, TILE, bar).rect(px + TILE - 5, py, 1, TILE, 0x1a1a1a);
  p.ellipse(px + TILE - 5, py + 6, 3, 3, 0xff7a2f).rect(px + TILE - 6, py + 5, 1, 1, 0xffd0a0);
}

// The back entrance of the mall: the loading bay, with big yellow chevrons
// pointing in and the rolled-up shutter. side: where the mall is.
function drawEntrance(p, px, py, side) {
  p.rect(px, py, TILE, TILE, (x, y) => ((x + y) % 5 === 0 ? 0x443c2e : 0x3a3428));
  const q = new Painter(TILE, TILE);
  // Pointing down, then turned to face the mall.
  q.rect(0, TILE - 4, TILE, 4, (x) => (x % 4 === 0 ? 0x5a5e66 : 0x9aa0a8)); // the shutter
  for (let i = 0; i < 3; i++) {
    const o = 3 + i * 8;
    for (let t = 0; t < 3; t++) q.line(6, o + t, HALF - 1, o + t + 7, 0xe8c06a).line(TILE - 7, o + t, HALF, o + t + 7, 0xe8c06a);
  }
  const turns = { down: 0, left: 1, up: 2, right: 3 }[side];
  q.px.forEach((c, i) => {
    if (c === null) return;
    let [x, y] = [i % TILE, Math.floor(i / TILE)];
    for (let k = 0; k < turns; k++) [x, y] = [TILE - 1 - y, x];
    p.set(px + x, py + y, c);
  });
}

// The mall's own logo on the roof, a made-up one (no real brands): a fat red
// pigeon, the "piccione zoppo" of the novel, with a green wing and one leg
// tucked up.
export const LOGO_W = 28;
export const LOGO_H = 22;
export function drawPigeon(p, x0 = 0, y0 = 0) {
  const red = 0xe0443a;
  const redDark = 0xa82a24;
  const green = 0x3fbf5f;
  // Body and head, facing right.
  p.ellipse(x0 + 12, y0 + 11, 9, 6.5, (x, y) => (y > y0 + 13 ? redDark : red));
  p.ellipse(x0 + 21, y0 + 6, 4, 4, red);
  p.rect(x0 + 25, y0 + 6, 2, 1, 0xe8c06a); // beak
  p.set(x0 + 22, y0 + 5, 0xf4f1e8);
  // Tail.
  p.poly([[x0 + 1, y0 + 6], [x0 + 5, y0 + 9], [x0 + 4, y0 + 13]], red);
  // The green wing, a swoosh.
  p.poly([[x0 + 6, y0 + 9], [x0 + 15, y0 + 7], [x0 + 18, y0 + 10], [x0 + 9, y0 + 13]], green);
  p.line(x0 + 8, y0 + 12, x0 + 16, y0 + 9, 0x2a8a44);
  // One leg down, the other tucked up: it limps.
  p.rect(x0 + 13, y0 + 17, 1, 3, 0xe8c06a).rect(x0 + 12, y0 + 20, 3, 1, 0xe8c06a);
  p.rect(x0 + 9, y0 + 17, 2, 1, 0xe8c06a);
}

// The logo on a cream panel, twice as big when the roof has room.
function drawMallLogo(p, box) {
  if (!box) return;
  const q = new Painter(LOGO_W + 6, LOGO_H + 4);
  q.rect(0, 0, LOGO_W + 6, LOGO_H + 4, 0xe9dcc0).rect(0, LOGO_H + 3, LOGO_W + 6, 1, 0x9a907a);
  drawPigeon(q, 3, 2);
  const k = box.w >= (LOGO_W + 6) * 2 + 8 && box.h >= (LOGO_H + 4) * 2 + 4 ? 2 : 1;
  stamp(p, q, box.x + Math.floor((box.w - q.w * k) / 2), box.y + Math.floor((box.h - q.h * k) / 2), k);
}

// The Muro project board, on the site: yellow, black stripes.
function drawSiteSign(p, box) {
  const x = box.x + 6;
  const y = box.y + 5;
  const w = Math.min(40, box.w - 12);
  p.rect(x, y, w, 15, 0xe8b020).rect(x, y + 15, w, 1, 0x3a2a14);
  for (let i = 0; i < w; i += 6) p.rect(x + i, y, 3, 3, 0x1a1a1a);
  p.rect(x + 4, y + 6, w - 8, 2, 0x1a1a1a).rect(x + 4, y + 10, Math.floor(w / 2), 2, 0x1a1a1a);
  p.rect(x + 3, y + 16, 2, 5, 0x3a3f48).rect(x + w - 5, y + 16, 2, 5, 0x3a3f48);
}

// ---------------------------------------------------------------- things on the map

// A Muro bulldozer from above, heading up (the scene turns it): two wide
// tracks, the yellow body, the cab with its dark windscreen, a wide steel
// blade in front, the exhaust and a hazard stripe at the back.
export function drawRuspa(p, s = RUSPA_SIZE) {
  const yellow = { base: 0xe8b020, dark: 0xb07a10, light: 0xffd860, hl: 0xfff2b0 };
  // Tracks, with their treads.
  for (const x of [2, s - 8]) {
    p.rect(x, 6, 6, s - 8, 0x2a2a2a);
    for (let y = 7; y < s - 2; y += 3) p.rect(x, y, 6, 1, 0x4a4a48);
    p.rect(x + 1, 6, 1, s - 8, 0x3a3a38);
  }
  // Body.
  p.rect(7, 8, s - 14, s - 12, shaded(yellow, s / 2, s / 2 + 2, s / 2 - 6, s / 2 - 5));
  // The cab, its windscreen facing forward.
  p.rect(9, 11, s - 18, 9, 0xc89418).rect(9, 11, s - 18, 1, 0xffd860);
  p.rect(10, 12, s - 20, 3, 0x1a2a3a).rect(10, 12, 2, 1, 0x6e8aa8);
  // Exhaust stack and the hazard stripe at the back.
  p.rect(s - 11, 21, 2, 2, 0x2a2a2a).rect(s - 11, 21, 1, 1, 0x5a5a5a);
  for (let x = 8; x < s - 8; x += 4) p.rect(x, s - 5, 2, 2, 0x1a1a1a);
  // The blade: wide and grey, with its arms.
  p.rect(1, 1, s - 2, 5, 0x9aa0a8).rect(1, 1, s - 2, 1, 0xd8dce4).rect(1, 5, s - 2, 1, 0x5a5e66);
  p.rect(4, 3, s - 8, 1, 0x7a8088);
  p.rect(8, 6, 2, 3, 0x5a5e66).rect(s - 10, 6, 2, 3, 0x5a5e66);
  p.outline(0x1a1208);
}

// A navigator sign pointing dir (rules.js: 0 up, then clockwise). The
// official ones are the yellow road-works kind; Teresa's are white card
// with a pink marker arrow and a scribble in the corner. The arrow is drawn
// pointing up and turned pixel by pixel, so it stays sharp.
export function drawSign(p, kind = 'official', dir = 0, s = SIGN_SIZE) {
  const mine = kind === 'mine';
  const c = Math.floor(s / 2);
  p.rect(0, 0, s, s, mine ? 0xf4f1e8 : 0xe8b020);
  p.rect(0, s - 2, s, 2, mine ? 0xb8b0a0 : 0xb07a10);
  p.rect(0, 0, s, 1, mine ? 0xffffff : 0xffd860);
  const ink = mine ? 0xff4fa3 : 0x1a1a1a;
  const arrow = new Painter(s, s);
  const head = Math.floor(s / 2) - 2;
  for (let i = 0; i < head; i++) arrow.rect(c - i, 2 + i, i * 2 + 1, 1, ink); // the head
  arrow.rect(c - 2, 2 + head, 5, s - 4 - head - 1, ink); // the shaft, centred
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const v = arrow.get(x, y);
      if (v === null) continue;
      // Turn (x, y) a quarter clockwise dir times around the centre.
      let [rx, ry] = [x, y];
      for (let k = 0; k < dir; k++) [rx, ry] = [s - 1 - ry, rx];
      p.set(rx, ry, v);
    }
  }
  if (mine) p.rect(1, s - 5, 2, 1, ink).rect(2, s - 4, 2, 1, ink).rect(1, s - 3, 3, 1, ink);
  p.outline(0x1a1208);
}

// Chiara's marbles on the asphalt: glass balls in four colours, each with a
// highlight and a dark side.
export function drawMarbles(p, s = MARBLES_SIZE) {
  const balls = [[6, 6, 0x4a90e0], [15, 7, 0x3fbf5f], [9, 15, 0xe0443a], [16, 15, 0xe8c06a], [4, 13, 0xb48cff]];
  for (const [x, y, c] of balls) {
    p.ellipse(x + 0.5, y + 0.5, 3.5, 3.5, c);
    p.rect(x - 1, y - 2, 2, 1, 0xf4f1e8).rect(x - 2, y - 1, 1, 1, 0xf4f1e8);
    p.rect(x + 1, y + 2, 2, 1, 0x1a1a22);
  }
  p.outline(0x0e0e14);
}

// Gigi's foam: cement whipped up like a mad meringue (flat cola and
// liquorice powder), with dark specks of liquorice.
export function drawFoam(p, s = FOAM_SIZE) {
  const cream = { base: 0xf4ecd8, dark: 0xd8c8a8, light: 0xffffff, hl: 0xffffff };
  const c = s / 2;
  for (const [x, y, r] of [[c - 5, c + 2, 7], [c + 4, c, 7], [c, c - 6, 6], [c + 6, c + 6, 5], [c - 7, c + 7, 4]]) p.ellipse(x, y, r, r, shaded(cream, c, c, c - 1, c - 1));
  for (const [x, y] of [[c - 4, c - 2], [c + 3, c + 4], [c - 1, c + 6], [c + 5, c - 4], [c - 7, c + 3]]) p.rect(x, y, 2, 1, 0x3a2a24);
  p.outline(0x6a5a48);
}

// The keyboard cursor and the hover marker: four thick corners.
export function drawCursor(p, s = TILE) {
  const c = 0xe8c06a;
  for (const [x, y, dx, dy] of [[0, 0, 1, 1], [s - 2, 0, -1, 1], [0, s - 2, 1, -1], [s - 2, s - 2, -1, -1]]) {
    p.rect(Math.min(x, x + dx * 6), y, 8, 2, c).rect(x, Math.min(y, y + dy * 6), 2, 8, c);
  }
}

// ---------------------------------------------------------------- the kids

const OUTLINE = 0x1a1410;
const SKIN = 0xf0c8a0;

// Teresa, 8: "silenziosa come un ninja e letale con il pennarello
// indelebile". Black ninja headband, dark hair in a bun, the pink marker.
function teresa(p, s) {
  const c = s / 2;
  p.ellipse(c, c - 3, 5.5, 3.5, 0x2a1a10); // hair
  p.ellipse(c, c - 8, 2.5, 2, 0x2a1a10); // bun
  p.ellipse(c, c + 1, 5, 5.5, shaded({ base: SKIN, dark: 0xd8a070, light: 0xf8dcc0 }, c, c + 1, 5, 5.5));
  p.rect(c - 5, c - 3, 11, 2, 0x1a1a1a); // headband
  p.rect(c + 5, c - 2, 2, 1, 0x1a1a1a).rect(c + 6, c - 1, 1, 2, 0x1a1a1a); // its knot
  p.rect(c - 3, c + 1, 2, 1, 0x1a1010).rect(c + 2, c + 1, 2, 1, 0x1a1010); // eyes, narrowed
  p.rect(c - 1, c + 4, 3, 1, 0xa86a50); // straight mouth: serious business
  p.rect(c - 5, c + 6, 11, s - c - 7, 0x3a3f48); // black hoodie
  // The marker, held up.
  p.line(c - 8, c + 9, c - 5, c + 3, 0xff4fa3).line(c - 7, c + 9, c - 4, c + 3, 0xff4fa3);
  p.set(c - 5, c + 2, 0xf4f1e8);
  p.outline(OUTLINE);
}

// Chiara, 8: marbles "con precisione chirurgica" and a week of war films
// with her uncle. A green army helmet over two pigtails, a blue marble
// between finger and thumb.
function chiara(p, s) {
  const c = s / 2;
  p.ellipse(c - 6, c + 2, 1.5, 3, 0x6a3a1a).ellipse(c + 6, c + 2, 1.5, 3, 0x6a3a1a); // pigtails
  p.ellipse(c, c + 1, 5, 5.5, shaded({ base: SKIN, dark: 0xd8a070, light: 0xf8dcc0 }, c, c + 1, 5, 5.5));
  // The helmet, with a camouflage blotch.
  p.ellipse(c, c - 3, 6.5, 4, shaded({ base: 0x4a6a34, dark: 0x34502a, light: 0x6a8a4a }, c, c - 3, 6.5, 4));
  p.rect(c - 7, c - 1, 14, 1, 0x34502a);
  p.rect(c - 3, c - 5, 2, 1, 0x2a3a1e).rect(c + 2, c - 4, 2, 1, 0x7a6a3a);
  p.rect(c - 3, c + 1, 2, 2, 0x1a1010).rect(c + 2, c + 1, 2, 2, 0x1a1010); // eyes, wide open
  p.rect(c - 1, c + 4, 3, 1, 0xa86a50);
  p.rect(c - 5, c + 6, 11, s - c - 7, 0x6a7a3a); // khaki jacket
  // The marble, held up.
  p.rect(c + 6, c + 6, 2, 2, SKIN);
  p.ellipse(c + 7.5, c + 4.5, 1.8, 1.8, 0x4a90e0);
  p.rect(c + 7, c + 3, 1, 1, 0xf4f1e8);
  p.outline(OUTLINE);
}

// Gigi, 9, "il Chimico", the sceptic of the group: curly hair, lab goggles
// pushed up on his forehead, a bottle of flat cola fizzing in his hand.
function gigi(p, s) {
  const c = s / 2;
  p.ellipse(c, c - 4, 6, 4, 0x3a2414); // curls
  for (const x of [-5, -2, 1, 4]) p.ellipse(c + x + 0.5, c - 7, 1.6, 1.6, 0x3a2414);
  p.ellipse(c, c + 1, 5, 5.5, shaded({ base: 0xd8a070, dark: 0xa86a40, light: 0xe8b890 }, c, c + 1, 5, 5.5));
  // The goggles on his forehead.
  p.rect(c - 6, c - 3, 12, 1, 0x2a2a2a);
  p.rect(c - 4, c - 4, 3, 3, 0x9ad0e8).rect(c + 1, c - 4, 3, 3, 0x9ad0e8);
  p.rect(c - 4, c - 4, 1, 1, 0xf4f1e8).rect(c + 1, c - 4, 1, 1, 0xf4f1e8);
  p.rect(c - 3, c + 1, 2, 1, 0x1a1010).rect(c + 2, c + 1, 2, 1, 0x1a1010); // eyes, half closed: sceptical
  p.rect(c - 1, c + 4, 3, 1, 0x8a4a30).rect(c + 2, c + 3, 1, 1, 0x8a4a30); // a crooked smile
  p.rect(c - 5, c + 6, 11, s - c - 7, 0xe8e4d8); // a lab coat, too big
  // The bottle, fizzing.
  p.rect(c + 5, c + 3, 3, 6, 0x4a2414).rect(c + 6, c + 1, 1, 2, 0x4a2414);
  p.rect(c + 5, c + 5, 3, 1, 0xe0443a);
  p.rect(c + 6, c - 1, 1, 1, 0xf4ecd8).rect(c + 7, c - 3, 1, 1, 0xf4ecd8);
  p.outline(OUTLINE);
}

export const KIDS = { teresa, chiara, gigi };
export const drawFace = (p, kid, s = FACE_SIZE) => KIDS[kid](p, s);
