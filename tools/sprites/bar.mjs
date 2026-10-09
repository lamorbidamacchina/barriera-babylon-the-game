// Sprite sheet for tools/sprite-preview.mjs: props of the Bar Stella.
import { YARN, POSTER, POSTERS, SCALDATELLI, drawYarn, drawScaldatelli } from '../../src/sprites/bar.js';

export default [
  { name: 'yarn', ...YARN, draw: drawYarn },
  { name: 'scaldatelli', ...SCALDATELLI, draw: drawScaldatelli },
  ...Object.entries(POSTERS).map(([name, draw]) => ({ name, ...POSTER, draw })),
];
