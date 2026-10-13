// Il nodo nei ferri sprites drawn on a Painter, without Phaser (so the preview
// tool and the tests can use them): the knots (balls of wool), Don Remo's
// table, his scarf and the knitting needles. textures.js turns them into
// textures.
import { shaded } from '../../painter.js';
import { rng } from '../../rng.js';

export const KNOT_KEY = 'ferri-knot';
export const KNOT_SIZE = 13;
export const TABLE_KEY = 'ferri-table';
export const NEEDLES_KEY = 'ferri-needles';
export const NEEDLES_W = 30;
export const NEEDLES_H = 11;
export const scarfKey = (stripes) => `ferri-scarf-${stripes}`;

// Yarn colours for the threads, bright on the dark tablecloth and never red:
// red marks the crossings.
export const YARN = [0xe8c06a, 0xff4fa3, 0x6ec6ff, 0x7ad38f, 0xb48cff, 0xff9a3c, 0xf4f1e8];
const darker = (c, f) => ((((c >> 16) & 0xff) * f) << 16) | ((((c >> 8) & 0xff) * f) << 8) | ((c & 0xff) * f);
const lighter = (c, f) => {
  const ch = (v) => Math.round(v + (255 - v) * f);
  return (ch((c >> 16) & 0xff) << 16) | (ch((c >> 8) & 0xff) << 8) | ch(c & 0xff);
};
export const shade = (c, f) => darker(c, f) & 0xffffff;

// A ball of cream wool, strands wound diagonally across it.
export function drawKnot(p, s) {
  const c = s / 2;
  const r = c - 1;
  p.ellipse(c, c, r, r, shaded({ base: 0xe9dcc0, dark: 0xb8a582, light: 0xfaf3e2, hl: 0xffffff }, c, c, r, r));
  for (const d of [-4, 0, 4]) p.line(c - r + d, c + r, c + r + d, c - r, 0xa8946e, { over: true });
  p.line(c - r * 0.5, c - r * 0.5, c + r * 0.5, c + r * 0.5, 0xc9b896, { over: true });
  p.outline(0x3a2a14);
}

// Don Remo's table seen from above: a wooden rim and a checked tablecloth in
// night blues, with a ring left by a cup of tè e melissa.
export function drawTable(p, w, h) {
  const r = rng(21);
  p.rect(0, 0, w, h, 0x3e2614);
  p.rect(1, 1, w - 2, h - 2, (x, y) => ((x * 7 + y * 3) % 11 === 0 ? 0x5e3a20 : 0x6b4226));
  p.rect(1, 1, w - 2, 1, 0x8a5a34);
  const CHECK = 12;
  p.rect(4, 4, w - 8, h - 8, (x, y) => {
    const a = Math.floor(x / CHECK) % 2;
    const b = Math.floor(y / CHECK) % 2;
    const weave = (x + y) % 2 === 0;
    if (a && b) return weave ? 0x22344f : 0x1f3049;
    if (a || b) return weave ? 0x1a2940 : 0x18263b;
    return weave ? 0x132036 : 0x111d31;
  });
  // A few loose fibres.
  for (let i = 0; i < 60; i++) p.rect(5 + Math.floor(r() * (w - 12)), 5 + Math.floor(r() * (h - 12)), 1 + Math.floor(r() * 2), 1, 0x2a3d5a);
  // The cup ring, bottom-left, out of the way of the knots.
  const cx = 22;
  const cy = h - 22;
  for (let t = 0; t < Math.PI * 2; t += 0.05) {
    if (t > 4 && t < 4.6) continue; // the ring isn't closed
    p.set(Math.round(cx + Math.cos(t) * 11), Math.round(cy + Math.sin(t) * 10), 0x3a3424);
  }
}

// Knitted stitches: rows of little Vs, 4 pixels wide and 3 tall.
function knit(base) {
  const light = lighter(base, 0.3);
  const dark = shade(base, 0.62);
  return (x, y) => {
    const col = x % 4;
    const row = y % 3;
    if (row === 2) return dark;
    if (row === 0) return col === 0 || col === 3 ? light : base;
    return col === 1 || col === 2 ? light : base;
  };
}

export const SCARF_W = 28;
export const SCARF_H = 228;
const PEG_H = 6;
const CAST_ON = 15; // three months of work: a short grey start
export const STRIPE_H = 36;
// Where the knitting ends after `stripes` stripes: the needles go there.
export const scarfEnd = (stripes) => PEG_H + CAST_ON + stripes * STRIPE_H;

// Each pattern picks the yarn of one stitch (4 pixels wide, 3 tall) of a
// stripe: column and row of the stitch, from the level's yarn colours.
const PATTERNS = {
  // Bands of two stitch rows per colour.
  bands: (colors, col, row) => colors[Math.floor(row / 2) % colors.length],
  // Polka dots, like Mei Li's "pastiglie di libertà": single stitches in the
  // other colours, staggered, on the first one.
  pois: (colors, col, row) => {
    if (row % 2 === 0 || (col + (row >> 1)) % 2) return colors[0];
    return colors[1 + ((col + row) % (colors.length - 1))];
  },
  // Patchwork, like the blankets of the "sferruzzamento solidale": squares
  // of two stitches by two rows, each in its own yarn.
  patchwork: (colors, col, row) => colors[(Math.floor(col / 2) * 4 + Math.floor(row / 2) * 5) % colors.length],
  // Two hearts on lilac, Irene's hat: a whole one, then a broken one for the
  // thirty-eighth no.
  hearts: (colors, col, row) => {
    const heart = row >= 1 && row <= 4 ? HEART : row >= 7 && row <= 10 ? BROKEN_HEART : null;
    const r = row >= 7 ? row - 7 : row - 1;
    if (heart && heart[r][col - 1] === 'X') return row >= 7 ? 0xff4fa3 : 0xe0443a;
    return 0xb48cff;
  },
};

// Hearts in stitches, 5 wide and 4 tall.
const HEART = ['.X.X.', 'XXXXX', '.XXX.', '..X..'];
const BROKEN_HEART = ['.X.X.', 'XX.XX', '.X.X.', '..X..'];

// The scarf hanging from a peg on the right of the screen: the grey start of
// three months' work, then one stripe per level done. stripes: [{ pattern,
// colors }]. The whole height is drawn; the scene crops it to what's knitted.
export function drawScarf(p, w, stripes) {
  const x0 = Math.floor((w - SCARF_W) / 2);
  // The peg it hangs from.
  p.rect(0, 1, w, 3, 0x8a5a34).rect(0, 1, w, 1, 0xb07a48).rect(0, 4, w, 1, 0x3e2614);
  p.rect(2, 0, 3, 6, 0x6b4226).rect(w - 5, 0, 3, 6, 0x6b4226);
  let y = PEG_H;
  p.rect(x0, y, SCARF_W, CAST_ON, knit(0x8f8a80));
  y += CAST_ON;
  for (const s of stripes) {
    const fill = PATTERNS[s.pattern] ?? PATTERNS.bands;
    for (let row = 0; row < STRIPE_H; row++) {
      p.rect(x0, y + row, SCARF_W, 1, (x) => knit(fill(s.colors, Math.floor((x - x0) / 4), Math.floor(row / 3)))(x - x0, row));
    }
    y += STRIPE_H;
  }
  // Ragged sides, like real knitting.
  for (let yy = PEG_H; yy < y; yy += 3) {
    p.set(x0 - 1, yy + 1, 0x1a1a1a);
    p.set(x0 + SCARF_W, yy + 1, 0x1a1a1a);
  }
}

// Two knitting needles crossed under the last row, with ocra knobs.
export function drawNeedles(p) {
  const w = NEEDLES_W;
  const h = NEEDLES_H;
  p.line(1, h - 3, w - 3, 2, 0xb8bcc4).line(1, h - 2, w - 3, 3, 0x7a7e88);
  p.line(1, 2, w - 3, h - 3, 0xb8bcc4).line(1, 3, w - 3, h - 2, 0x7a7e88);
  p.rect(w - 4, 0, 3, 3, 0xe8c06a).rect(w - 4, h - 4, 3, 3, 0xe8c06a);
  p.outline(0x1a1a22);
}
