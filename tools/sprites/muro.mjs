// Muro Panic preview sheet: the Torino pictures behind the Muro.
// npm run sprites -- tools/sprites/muro.mjs <out.png> --scale 2
import { VIEWS, VIEW_W, VIEW_H } from '../../src/games/muro/views.js';

export default Object.entries(VIEWS).map(([name, draw]) => ({ name, w: VIEW_W, h: VIEW_H, draw: (p) => draw(p, VIEW_W, VIEW_H) }));
