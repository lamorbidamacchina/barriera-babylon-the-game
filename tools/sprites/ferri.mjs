// Il nodo nei ferri preview sheet: the knot, the needles, the scarf with one
// and five stripes, Don Remo's table.
// npm run sprites -- tools/sprites/ferri.mjs <out.png> --scale 3
import { drawKnot, drawNeedles, drawScarf, drawTable, KNOT_SIZE, NEEDLES_W, NEEDLES_H, SCARF_H, YARN } from '../../src/games/ferri/sprites.js';

const stripe = (colors) => ({ pattern: 'bands', colors });
export default [
  { name: 'knot', w: KNOT_SIZE, h: KNOT_SIZE, draw: (p) => drawKnot(p, KNOT_SIZE) },
  { name: 'needles', w: NEEDLES_W, h: NEEDLES_H, draw: drawNeedles },
  { name: 'scarf-1', w: 52, h: SCARF_H, draw: (p) => drawScarf(p, 52, [stripe(YARN.slice(0, 4))]) },
  { name: 'scarf-5', w: 52, h: SCARF_H, draw: (p) => drawScarf(p, 52, [0, 1, 2, 3, 4].map((i) => stripe(YARN.slice(i, i + 3)))) },
  { name: 'table', w: 396, h: 228, draw: (p) => drawTable(p, 396, 228) },
];
