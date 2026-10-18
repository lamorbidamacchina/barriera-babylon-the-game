// Ruspe in fuga preview sheet: the bulldozer, the signs, the cursor, the
// kids of the tool bar, the mall's made-up logo and each level's map.
// npm run sprites -- tools/sprites/ruspe.mjs <out.png> --scale 3
import { LEVELS } from '../../src/games/ruspe/levels.js';
import { FIELD } from '../../src/games/ruspe/rules.js';
import { drawMap, drawRuspa, drawSign, drawCursor, drawFace, drawPigeon, drawMarbles, MARBLES_SIZE, drawFoam, FOAM_SIZE, KIDS, RUSPA_SIZE, SIGN_SIZE, FACE_SIZE, LOGO_W, LOGO_H } from '../../src/games/ruspe/sprites.js';

export default [
  { name: 'ruspa', w: RUSPA_SIZE, h: RUSPA_SIZE, draw: (p) => drawRuspa(p) },
  ...['official', 'mine'].flatMap((kind) => [0, 1, 2, 3].map((dir) => ({ name: `sign-${kind}-${dir}`, w: SIGN_SIZE, h: SIGN_SIZE, draw: (p) => drawSign(p, kind, dir) }))),
  { name: 'marbles', w: MARBLES_SIZE, h: MARBLES_SIZE, draw: (p) => drawMarbles(p) },
  { name: 'foam', w: FOAM_SIZE, h: FOAM_SIZE, draw: (p) => drawFoam(p) },
  { name: 'cursor', w: 16, h: 16, draw: (p) => drawCursor(p) },
  { name: 'pigeon', w: LOGO_W, h: LOGO_H, draw: (p) => drawPigeon(p) },
  ...Object.keys(KIDS).map((k) => ({ name: k, w: FACE_SIZE, h: FACE_SIZE, draw: (p) => drawFace(p, k) })),
  ...LEVELS.map((l, i) => ({ name: `map-${i + 1}`, w: FIELD.w, h: FIELD.h, draw: (p) => drawMap(p, l.map) })),
];
