// Small figures for the pictures behind the Muro: people (adults ~20px tall,
// kids ~12px), bikes, trees. Each one is drawn on its own Painter, outlined,
// then stamped on the picture, so it stays readable on any background.
import { Painter, shaded } from '../../painter.js';

const OUTLINE = 0x1a1410;

export const SKIN = [0xf0c8a0, 0xe8b890, 0xd8a070, 0xa86a40, 0x7a4a2a];
export const HAIR = [0x2a1a10, 0x6a3a1a, 0xd8b050, 0x1a1a1a, 0xa04020];

// Draws fn(q, cx, gy) on a scratch Painter centered on (x, gy), outlines it
// and copies it onto p.
function stamp(p, x, gy, w, h, fn, outline = OUTLINE) {
  const q = new Painter(w, h);
  const cx = Math.floor(w / 2);
  const by = h - 2;
  fn(q, cx, by);
  if (outline !== null) q.outline(outline);
  q.px.forEach((c, i) => {
    if (c !== null) p.set(Math.round(x) - cx + (i % w), Math.round(gy) - by + Math.floor(i / w), c);
  });
}

// Rect helper in figure coordinates (dx from the center, dy up from the
// feet), mirrored when facing left (f = -1).
const rects = (q, cx, gy, f) => (dx, dy, w, h, c) => {
  const x = f === 1 ? cx + dx : cx - dx - w + 1;
  q.rect(x, gy + dy, w, h, c);
};

// An adult, feet on (x, gy). pose: stand, walk, run, cheer, wave, talk, sit
// (gy is then the seat), crutch (left leg in plaster, a crutch).
// coat: a long coat over the legs (doctors); pack: backpack color; long: long hair.
export function person(p, x, gy, o = {}) {
  const { skin = SKIN[1], hair = HAIR[0], top = 0x4a8ae0, bottom = 0x2c4060, shoes = 0x1a1a1a, f = 1, pose = 'stand', coat, pack, long = false, hold } = o;
  stamp(p, x, gy, 21, 30, (q, cx, by) => {
    const R = rects(q, cx, by, f);
    const up = pose === 'sit' ? 5 : 0; // a seated body is lower
    // Legs.
    if (pose === 'walk') {
      R(-2, -7, 2, 3, bottom), R(-3, -4, 2, 3, bottom), R(-4, -1, 2, 1, shoes);
      R(1, -7, 2, 3, bottom), R(2, -4, 2, 3, bottom), R(2, -1, 3, 1, shoes);
    } else if (pose === 'run') {
      R(-2, -7, 2, 2, bottom), R(-4, -6, 2, 2, bottom), R(-6, -7, 2, 2, shoes);
      R(1, -7, 2, 2, bottom), R(2, -5, 2, 4, bottom), R(2, -1, 3, 1, shoes);
    } else if (pose === 'sit') {
      R(-2, -2, 6, 2, bottom), R(3, 0, 2, 4, bottom), R(3, 4, 3, 1, shoes);
    } else if (pose === 'crutch') {
      R(-2, -7, 2, 6, bottom), R(-2, -1, 3, 1, shoes);
      R(1, -7, 3, 7, 0xf4f1e8), R(1, -7, 3, 1, 0xd8d4c8); // plaster cast
    } else {
      R(-2, -7, 2, 6, bottom), R(1, -7, 2, 6, bottom), R(-2, -1, 2, 1, shoes), R(1, -1, 3, 1, shoes);
    }
    // Body.
    if (coat) R(-3, -14 + up, 7, 10, coat), R(0, -14 + up, 1, 6, top);
    else R(-3, -14 + up, 7, 7, top);
    if (pack) R(-5, -14 + up, 2, 6, pack);
    // Arms.
    const arm = coat ?? top;
    const down = (side) => (R(side, -13 + up, 1, 6, arm), R(side, -7 + up, 1, 1, skin));
    const raised = (side) => (R(side, -19 + up, 1, 6, arm), R(side, -20 + up, 1, 1, skin));
    if (pose === 'cheer') raised(-4), raised(4);
    else if (pose === 'wave') down(-4), raised(4);
    else if (pose === 'talk') down(-4), R(4, -12 + up, 3, 1, arm), R(7, -12 + up, 1, 1, skin);
    else if (pose === 'run') R(4, -13, 1, 3, arm), R(5, -11, 2, 1, arm), R(7, -11, 1, 1, skin), R(-4, -13, 1, 3, arm), R(-6, -11, 2, 1, arm);
    else if (pose === 'crutch') down(-4), R(4, -13, 1, 3, arm), R(5, -11, 1, 1, skin), R(5, -10, 1, 10, 0x9a9a94), R(4, -11, 3, 1, 0x6a6a64);
    else down(-4), down(4);
    if (hold) R(5, -9 + up, 2, 3, hold); // a book, a bag
    // Head.
    R(-2, -20 + up, 5, 2, hair);
    R(-2, -18 + up, 5, 4, skin);
    R(-2, -18 + up, 1, 2, hair);
    if (long) R(-3, -19 + up, 1, 6, hair), R(-2, -16 + up, 1, 3, hair);
    R(1, -17 + up, 1, 1, 0x1a1a1a);
  });
}

// A small kid, feet on (x, gy). pose: stand, walk, run, hand (one arm up to
// hold a grown-up's hand), cheer.
export function kid(p, x, gy, o = {}) {
  const { skin = SKIN[1], hair = HAIR[0], top = 0xe0443a, bottom = 0x2c4060, f = 1, pose = 'stand', pack } = o;
  stamp(p, x, gy, 13, 18, (q, cx, by) => {
    const R = rects(q, cx, by, f);
    if (pose === 'walk' || pose === 'run') R(-2, -4, 1, 3, bottom), R(-3, -1, 2, 1, 0x1a1a1a), R(1, -4, 1, 3, bottom), R(1, -1, 2, 1, 0x1a1a1a);
    else R(-2, -4, 1, 3, bottom), R(1, -4, 1, 3, bottom), R(-2, -1, 2, 1, 0x1a1a1a), R(1, -1, 2, 1, 0x1a1a1a);
    R(-2, -8, 4, 4, top);
    if (pack) R(-4, -8, 2, 3, pack);
    if (pose === 'hand') R(-3, -8, 1, 3, top), R(2, -11, 1, 4, top), R(2, -12, 1, 1, skin);
    else if (pose === 'cheer') R(-3, -12, 1, 4, top), R(2, -12, 1, 4, top);
    else if (pose === 'run') R(-3, -8, 1, 2, top), R(2, -8, 2, 1, top);
    else R(-3, -8, 1, 3, top), R(2, -8, 1, 3, top);
    R(-2, -12, 4, 1, hair);
    R(-2, -11, 4, 3, skin);
    R(-2, -11, 1, 1, hair);
    R(1, -10, 1, 1, 0x1a1a1a);
  });
}

// A bike with its rider, wheels on gy, going right (f = 1) or left.
// child: a kid in a seat behind the rider; basket: a basket in front.
export function bike(p, x, gy, o = {}) {
  const { frame = 0xe0443a, top = 0x4a8ae0, bottom = 0x2c4060, skin = SKIN[1], hair = HAIR[0], f = 1, child, basket } = o;
  stamp(p, x, gy, 25, 30, (q, cx, by) => {
    const R = rects(q, cx, by, f);
    const X = (dx) => (f === 1 ? cx + dx : cx - dx);
    const L = (x0, y0, x1, y1, c) => q.line(X(x0), by + y0, X(x1), by + y1, c);
    for (const wx of [-7, 7]) {
      q.ellipse(X(wx) + 0.5, by - 4 + 0.5, 4.5, 4.5, 0x2a2a2a);
      q.ellipse(X(wx) + 0.5, by - 4 + 0.5, 3.2, 3.2, null);
      q.set(X(wx), by - 4, 0x8a8a8a);
    }
    L(-7, -4, -1, -4, frame), L(-1, -4, -2, -10, frame), L(-7, -4, -2, -10, frame);
    L(-1, -4, 5, -10, frame), L(-2, -10, 5, -10, frame), L(5, -10, 7, -4, frame);
    R(4, -12, 3, 1, 0x3a3a3a), R(-4, -11, 4, 1, 0x3a3a3a); // handlebar, saddle
    if (basket) R(6, -12, 4, 3, basket);
    // Rider: leaning forward, hands on the bar, one foot on the pedal.
    L(-2, -12, -1, -5, bottom), L(-1, -12, 0, -5, bottom), R(-1, -4, 3, 1, 0x1a1a1a);
    R(-3, -18, 5, 6, top);
    L(1, -17, 4, -13, top), R(4, -13, 1, 1, skin);
    R(-1, -23, 4, 2, hair), R(-1, -21, 4, 3, skin), R(-1, -21, 1, 1, hair), R(2, -20, 1, 1, 0x1a1a1a);
    if (child) {
      R(-7, -12, 4, 2, 0x3a3a3a); // child seat
      R(-7, -16, 3, 4, child), R(-7, -19, 3, 3, SKIN[0]), R(-7, -20, 3, 1, HAIR[2]);
    }
  });
}

// A round tree: trunk from gy up, canopy of overlapping blobs, lit from the
// top-left. size: canopy radius.
export function tree(p, x, gy, o = {}) {
  const { size = 14, trunk = 18, pal = { base: 0x4a7a3a, dark: 0x2e5a2a, light: 0x6a9a4a, hl: 0x9aca6a }, seed = x } = o;
  const w = size * 2 + 6;
  const h = size * 2 + trunk + 4;
  stamp(p, x, gy, w, h, (q, cx, by) => {
    q.rect(cx - 1, by - trunk - 2, 3, trunk + 2, 0x5a3a20);
    q.rect(cx - 1, by - trunk - 2, 1, trunk + 2, 0x7a5a30);
    const cy = by - trunk - size + 2;
    const m = shaded(pal, cx, cy, size + 1, size + 1);
    let r = seed * 9301 + 49297;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    q.ellipse(cx + 0.5, cy + 0.5, size, size * 0.9, m);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rnd();
      q.ellipse(cx + Math.cos(a) * size * 0.55, cy + Math.sin(a) * size * 0.45, size * 0.55, size * 0.5, m);
    }
  }, 0x1e3a1a);
}
