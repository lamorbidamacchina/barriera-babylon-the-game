// Textures for Il nodo nei ferri: the knots, the needles, the table and the
// scarf. The drawings themselves are in sprites.js.
import { Painter, paint } from '../../painter.js';
import { drawKnot, drawNeedles, drawTable, drawScarf, KNOT_KEY, KNOT_SIZE, NEEDLES_KEY, NEEDLES_W, NEEDLES_H, TABLE_KEY, SCARF_H, scarfKey } from './sprites.js';

export { KNOT_KEY, NEEDLES_KEY, TABLE_KEY, scarfKey };
export const SCARF_TEX_W = 52;

// Big pictures go through a canvas: thousands of fillRect calls otherwise.
function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const p = new Painter(w, h);
  draw(p);
  scene.textures.addCanvas(key, p.toCanvas());
}

export function createTextures(scene, field) {
  paint(scene, KNOT_KEY, KNOT_SIZE, KNOT_SIZE, (p) => drawKnot(p, KNOT_SIZE));
  paint(scene, NEEDLES_KEY, NEEDLES_W, NEEDLES_H, drawNeedles);
  canvasTexture(scene, TABLE_KEY, field.w, field.h, (p) => drawTable(p, field.w, field.h));
}

// The scarf with these stripes ([{ pattern, colors }]), one texture per count.
export function scarfTexture(scene, stripes) {
  const key = scarfKey(stripes.length);
  canvasTexture(scene, key, SCARF_TEX_W, SCARF_H, (p) => drawScarf(p, SCARF_TEX_W, stripes));
  return key;
}
