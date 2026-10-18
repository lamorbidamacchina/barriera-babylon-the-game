// Textures for Ruspe in fuga. The drawings themselves are in sprites.js.
import { Painter, paint } from '../../painter.js';
import { FIELD, TILE } from './rules.js';
import {
  drawMap, drawRuspa, drawSign, drawCursor, drawFace, KIDS,
  MAP_KEY, RUSPA_KEY, RUSPA_SIZE, SIGN_KEY, SIGN_SIZE, CURSOR_KEY, FACE_SIZE, faceKey,
} from './sprites.js';

export { MAP_KEY, RUSPA_KEY, SIGN_KEY, CURSOR_KEY, faceKey };

// The map goes through a canvas: thousands of fillRect calls otherwise.
function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const p = new Painter(w, h);
  draw(p);
  scene.textures.addCanvas(key, p.toCanvas());
}

export function createTextures(scene, levelIndex, level) {
  canvasTexture(scene, MAP_KEY(levelIndex), FIELD.w, FIELD.h, (p) => drawMap(p, level.map));
  paint(scene, RUSPA_KEY, RUSPA_SIZE, RUSPA_SIZE, (p) => drawRuspa(p));
  paint(scene, SIGN_KEY.official, SIGN_SIZE, SIGN_SIZE, (p) => drawSign(p, 'official'));
  paint(scene, SIGN_KEY.mine, SIGN_SIZE, SIGN_SIZE, (p) => drawSign(p, 'mine'));
  paint(scene, CURSOR_KEY, TILE, TILE, (p) => drawCursor(p));
  for (const kid of Object.keys(KIDS)) paint(scene, faceKey(kid), FACE_SIZE, FACE_SIZE, (p) => drawFace(p, kid));
}
