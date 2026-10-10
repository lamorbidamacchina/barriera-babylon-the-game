// Textures for Muro Panic: the face of the Muro with the Comitato's tags (as
// big as the field, cut away cell by cell during the game), the cursor and the
// patrols. The drawings themselves are in sprites.js.
import { Painter, paint } from '../../painter.js';
import { paintTag, MIST_ALPHA } from '../../graffiti.js';
import { VIEW_W, VIEW_H } from './views.js';
import { drawWall, drawCursor, drawRonda, CURSOR_KEY, CURSOR_SIZE, RONDA_SIZE, rondaKey } from './sprites.js';

export { CURSOR_KEY, rondaKey };

// The Muro as a canvas (pattern + Comitato Caos tags), kept to copy from.
export function wallPattern() {
  const p = new Painter(VIEW_W, VIEW_H);
  drawWall(p, VIEW_W, VIEW_H);
  const canvas = p.toCanvas();
  const ctx = canvas.getContext('2d');
  const tag = (x, y, str, opts) => {
    const t = paintTag(str, opts);
    ctx.globalAlpha = MIST_ALPHA;
    ctx.drawImage(t.mist.toCanvas(), x, y);
    ctx.globalAlpha = 1;
    ctx.drawImage(t.paint.toCanvas(), x, y);
    ctx.drawImage(t.drips.toCanvas(), x, y);
  };
  tag(20, 40, 'COMITATO CAOS', { color: 0xff4fa3 });
  tag(250, 92, 'MURITE FUNGOIDE!', { color: 0x7ad34f, outline: 0x0b1a08, slant: 0.12, advance: 9.6, bounce: 2, swoosh: false, crown: null, drips: 10 });
  tag(40, 176, 'NO MURO!', { color: 0xe8c06a, outline: 0x2a1a06, crown: null });
  return canvas;
}

export function createTextures(scene) {
  paint(scene, CURSOR_KEY, CURSOR_SIZE, CURSOR_SIZE, (p) => drawCursor(p, CURSOR_SIZE));
  for (const light of ['red', 'blue']) paint(scene, rondaKey(light), RONDA_SIZE, RONDA_SIZE, (p) => drawRonda(p, RONDA_SIZE, light));
}
