// Il nodo nei ferri preview sheet: the knot, the needles, the scarf with the
// stripes of the levels so far, Don Remo's table.
// npm run sprites -- tools/sprites/ferri.mjs <out.png> --scale 3
import { LEVELS } from '../../src/games/ferri/levels.js';
import { drawKnot, drawNeedles, drawScarf, drawTable, KNOT_SIZE, NEEDLES_W, NEEDLES_H, SCARF_H, YARN } from '../../src/games/ferri/sprites.js';

const stripes = LEVELS.map((l) => ({ pattern: l.stripe, colors: YARN.slice(0, l.lines) }));
export default [
  { name: 'knot', w: KNOT_SIZE, h: KNOT_SIZE, draw: (p) => drawKnot(p, KNOT_SIZE) },
  { name: 'needles', w: NEEDLES_W, h: NEEDLES_H, draw: drawNeedles },
  { name: 'scarf', w: 52, h: SCARF_H, draw: (p) => drawScarf(p, 52, stripes) },
  { name: 'table', w: 396, h: 228, draw: (p) => drawTable(p, 396, 228) },
];
