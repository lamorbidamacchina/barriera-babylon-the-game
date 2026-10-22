// The second half of the finale: the street in front of the Muro, and the
// bulldozers seen from the side, now on the Comitato's side (Teresa has
// tagged them in pink). The Muro itself is Muro Panic's (drawWall), and
// behind it the five pictures of Torino the game's Muro hid.
import { shaded } from '../painter.js';

export const STREET_W = 480;
export const STREET_H = 270;
// Where the Muro stands on the street.
export const WALL = { x: 0, y: 64, w: 480, h: 160 };
export const GROUND_Y = WALL.y + WALL.h;
export const RUSPA_SIDE = { w: 64, h: 38 };

// The sky over the Muro, the pavement and the street in front of it. The
// wall and what's behind it are separate pictures (the scene knocks the
// wall down in sections).
export function drawStreet(p) {
  p.rect(0, 0, STREET_W, GROUND_Y, (x, y) => (y < 30 ? 0xe8b080 : y < 50 ? ((x + y) % 2 ? 0xe8b080 : 0xf0c8a0) : 0xf0c8a0));
  p.rect(0, GROUND_Y, STREET_W, 6, 0x8a8a84).rect(0, GROUND_Y, STREET_W, 1, 0xa8a8a0); // pavement
  p.rect(0, GROUND_Y + 6, STREET_W, STREET_H - GROUND_Y - 6, (x, y) => ((x * 3 + y * 5) % 7 === 0 ? 0x30343d : 0x2b2f37));
  for (let x = 6; x < STREET_W; x += 32) p.rect(x, GROUND_Y + 26, 16, 2, 0x9a9480);
}

// A Muro bulldozer from the side, facing right: tracks with their wheels,
// the yellow body and cab, the exhaust, the raised blade in front, and
// Teresa's pink tag on the side.
export function drawRuspaSide(p) {
  const { w, h } = RUSPA_SIDE;
  const yellow = { base: 0xe8b020, dark: 0xb07a10, light: 0xffd860, hl: 0xfff2b0 };
  // Tracks.
  p.rect(4, h - 11, 40, 10, 0x2a2a2a).ellipse(6, h - 6, 5, 5, 0x2a2a2a).ellipse(42, h - 6, 5, 5, 0x2a2a2a);
  for (const x of [8, 16, 24, 32, 40]) p.ellipse(x, h - 6, 3, 3, 0x5a5a5a).rect(x - 1, h - 7, 2, 2, 0x8a8a84);
  for (let x = 4; x < 46; x += 3) p.rect(x, h - 11, 1, 1, 0x4a4a48);
  // Body and cab.
  p.rect(6, h - 22, 36, 11, shaded(yellow, 24, h - 16, 20, 8));
  p.rect(10, h - 34, 18, 13, shaded(yellow, 19, h - 28, 10, 8));
  p.rect(13, h - 32, 12, 7, 0x1a2a3a).rect(13, h - 32, 3, 2, 0x6e8aa8); // the window
  p.rect(32, h - 30, 2, 9, 0x3a3a3a).rect(31, h - 31, 4, 2, 0x2a2a2a); // the exhaust
  for (let x = 6; x < 42; x += 6) p.rect(x, h - 13, 3, 2, 0x1a1a1a); // hazard stripe
  // Teresa's tag: a pink scrawl on the body.
  p.line(9, h - 17, 13, h - 20, 0xff4fa3).line(13, h - 20, 15, h - 16, 0xff4fa3).line(17, h - 19, 22, h - 19, 0xff4fa3).line(19, h - 19, 19, h - 15, 0xff4fa3);
  // The arm and the blade, raised in front.
  p.rect(42, h - 20, 10, 3, 0xb07a10).rect(50, h - 26, 3, 9, 0xb07a10);
  p.poly([[52, h - 30], [w - 2, h - 34], [w - 2, h - 8], [52, h - 10]], 0x9aa0a8);
  p.rect(53, h - 29, 1, 18, 0xc8ccd4).rect(w - 3, h - 33, 1, 24, 0x5a5e66);
  for (let y = h - 10; y < h - 6; y += 2) p.rect(w - 4, y, 3, 1, 0x5a5e66); // teeth
  p.outline(0x1a1208);
}
