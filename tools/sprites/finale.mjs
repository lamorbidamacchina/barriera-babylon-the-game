// The finale preview sheet: the marching characters, both walk frames.
// npm run sprites -- tools/sprites/finale.mjs <out.png> --scale 4 --bg night
import { ADULT, KID, meiLi, zioFranco, rosanna, luna, NEIGHBOURS, SECOND_ROW, KIDS } from '../../src/finale/figures.js';

const adults = { zioFranco, meiLi, rosanna };
export default [
  ...Object.entries(adults).flatMap(([name, draw]) => [0, 1].map((f) => ({ name: `${name}-${f}`, w: ADULT.w, h: ADULT.h, draw: (p) => draw(p, f) }))),
  ...[0, 1].map((f) => ({ name: `luna-${f}`, w: KID.w, h: KID.h, draw: (p) => luna(p, f) })),
  ...Object.entries(SECOND_ROW).flatMap(([name, draw]) => [0, 1].map((f) => ({ name: `${name}-${f}`, w: 24, h: 48, draw: (p) => draw(p, f) }))),
  ...Object.entries(KIDS).flatMap(([name, draw]) => [0, 1].map((f) => ({ name: `${name}-${f}`, w: KID.w, h: KID.h, draw: (p) => draw(p, f) }))),
  // The neighbourhood, at second-row size, both frames.
  ...Object.entries(NEIGHBOURS).flatMap(([name, draw]) => [0, 1].map((f) => ({ name: `${name}-${f}`, w: 24, h: 48, draw: (p) => draw(p, f) }))),
  // The second row size, to check the drawings hold up smaller.
  ...Object.entries(adults).map(([name, draw]) => ({ name: `${name}-48`, w: 24, h: 48, draw: (p) => draw(p, 0) })),
];
