// Muro Panic preview sheet: the Torino pictures behind the Muro, the Muro
// itself (without the tags), the cursor and the patrol.
// npm run sprites -- tools/sprites/muro.mjs <out.png> --scale 2
import { VIEWS, VIEW_W, VIEW_H } from '../../src/games/muro/views.js';
import { drawWall, drawCursor, drawRonda, CURSOR_SIZE, RONDA_SIZE } from '../../src/games/muro/sprites.js';

export default [
  { name: 'cursor', w: CURSOR_SIZE, h: CURSOR_SIZE, draw: (p) => drawCursor(p, CURSOR_SIZE) },
  { name: 'ronda-red', w: RONDA_SIZE, h: RONDA_SIZE, draw: (p) => drawRonda(p, RONDA_SIZE, 'red') },
  { name: 'ronda-blue', w: RONDA_SIZE, h: RONDA_SIZE, draw: (p) => drawRonda(p, RONDA_SIZE, 'blue') },
  { name: 'wall', w: VIEW_W, h: VIEW_H, draw: (p) => drawWall(p, VIEW_W, VIEW_H) },
  ...Object.entries(VIEWS).map(([name, draw]) => ({ name, w: VIEW_W, h: VIEW_H, draw: (p) => draw(p, VIEW_W, VIEW_H) })),
];
