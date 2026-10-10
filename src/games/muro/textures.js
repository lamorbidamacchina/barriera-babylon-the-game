// Sprites for Muro Panic, drawn in code: the face of the Muro (as big as the
// field, cut away cell by cell during the game) and the player's cursor.
import { Painter, paint } from '../../painter.js';
import { miniText } from '../../sprites/minifont.js';
import { paintTag, MIST_ALPHA } from '../../graffiti.js';
import { VIEW_W, VIEW_H } from './views.js';

export const CURSOR_KEY = 'muro-cursor';
export const CURSOR_SIZE = 11;

// Same Muro every time: a small seeded random (mulberry32).
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Precast concrete panels like the Title screen's Muro: seams, joints, bolts
// with rust running down, stencilled site markings.
export function drawWall(p, w, h) {
  const r = rng(7);
  const PANEL = 40;
  p.rect(0, 0, w, h, (x, y) => ((x * 13 + y * 7) % 23 === 0 ? 0x545450 : 0x5b5b58));
  for (let i = 0; i < 900; i++) {
    const c = r() < 0.6 ? 0x4c4c47 : 0x6a6a64;
    p.rect(Math.floor(r() * w), Math.floor(r() * h), 1 + Math.floor(r() * 4), 1, c);
  }
  for (let x = 0; x < w; x += PANEL) {
    p.rect(x, 0, 1, h, 0x45453f).rect(x + 1, 0, 1, h, 0x6a6a64);
    for (const y of [0, 80, 160]) {
      p.rect(x, y, PANEL, 1, 0x45453f).rect(x, y + 1, PANEL, 1, 0x6a6a64);
      // Bolts in the corners, rust dripping from some.
      for (const bx of [x + 5, x + PANEL - 7]) {
        p.rect(bx, y + 5, 2, 2, 0x3a3a38).rect(bx, y + 5, 1, 1, 0x8a8a84);
        if (r() < 0.4) p.rect(bx, y + 7, 1, 4 + Math.floor(r() * 14), 0x6a4a34).rect(bx + 1, y + 8, 1, 2 + Math.floor(r() * 4), 0x5a4a3a);
      }
    }
  }
  // Stencils of the building site.
  miniText(p, 'MURO - LOTTO 7', 86, 118, 0x8a8a7a, 2);
  miniText(p, 'MURO - LOTTO 8', 326, 198, 0x8a8a7a, 2);
  miniText(p, 'VIETATO', 404, 26, 0xc9963a, 1);
  miniText(p, "L'ACCESSO", 400, 33, 0xc9963a, 1);
  // A warning sign.
  p.rect(366, 22, 24, 20, 0xe8c06a).rect(366, 22, 24, 1, 0xf4dc90);
  p.poly([[378, 25], [386, 38], [370, 38]], 0x1a1a1a);
  p.rect(377, 29, 2, 5, 0xe8c06a).rect(377, 35, 2, 1, 0xe8c06a);
  p.outline(0x2a2a28);
}

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

// The player: Teresa's indelible marker, seen as a pink diamond.
export function drawCursor(p, s) {
  const c = s / 2;
  p.poly([[c, 1], [s - 1, c], [c, s - 1], [1, c]], 0xff4fa3);
  p.poly([[c, 3], [s - 3, c], [c, s - 3], [3, c]], 0xffb0d8);
  p.rect(Math.floor(c) - 1, Math.floor(c) - 1, 1, 1, 0xffffff);
  p.outline(0x1c0812);
}

export function createTextures(scene) {
  paint(scene, CURSOR_KEY, CURSOR_SIZE, CURSOR_SIZE, (p) => drawCursor(p, CURSOR_SIZE));
}
