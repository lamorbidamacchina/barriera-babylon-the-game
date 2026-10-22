// Textures for Ruspe in fuga. The drawings themselves are in sprites.js.
import { Painter, paint } from '../../painter.js';
import { FIELD, TILE } from './rules.js';
import {
  drawMap, drawRuspa, drawSign, drawCursor, drawFace, drawMarbles, drawFoam, drawSpeaker, KIDS,
  MAP_KEY, RUSPA_KEY, RUSPA_SIZE, signKey, SIGN_SIZE, CURSOR_KEY, FACE_SIZE, MARBLES_KEY, MARBLES_SIZE, FOAM_KEY, FOAM_SIZE, SPEAKER_KEY, SPEAKER_SIZE, faceKey,
} from './sprites.js';

export { MAP_KEY, RUSPA_KEY, signKey, CURSOR_KEY, MARBLES_KEY, FOAM_KEY, SPEAKER_KEY, faceKey };

// The map goes through a canvas: thousands of fillRect calls otherwise.
function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const p = new Painter(w, h);
  draw(p);
  scene.textures.addCanvas(key, p.toCanvas());
}

export function createTextures(scene, levelIndex, level) {
  canvasTexture(scene, MAP_KEY(levelIndex), FIELD.w, FIELD.h, (p) => drawMap(p, level.map, level.inside));
  paint(scene, RUSPA_KEY, RUSPA_SIZE, RUSPA_SIZE, (p) => drawRuspa(p));
  for (const kind of ['official', 'mine']) {
    for (let dir = 0; dir < 4; dir++) paint(scene, signKey(kind, dir), SIGN_SIZE, SIGN_SIZE, (p) => drawSign(p, kind, dir));
  }
  paint(scene, CURSOR_KEY, TILE, TILE, (p) => drawCursor(p));
  paint(scene, MARBLES_KEY, MARBLES_SIZE, MARBLES_SIZE, (p) => drawMarbles(p));
  paint(scene, FOAM_KEY, FOAM_SIZE, FOAM_SIZE, (p) => drawFoam(p));
  paint(scene, SPEAKER_KEY, SPEAKER_SIZE, SPEAKER_SIZE, (p) => drawSpeaker(p));
  for (const kid of Object.keys(KIDS)) paint(scene, faceKey(kid), FACE_SIZE, FACE_SIZE, (p) => drawFace(p, kid));
}
