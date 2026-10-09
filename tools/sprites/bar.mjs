// Sprite sheet for tools/sprite-preview.mjs: props of the Bar Stella.
import { YARN, POSTER, POSTERS, SCALDATELLI, TAPE, drawYarn, drawScaldatelli, drawTape } from '../../src/sprites/bar.js';

export default [
  { name: 'yarn', ...YARN, draw: drawYarn },
  { name: 'scaldatelli', ...SCALDATELLI, draw: drawScaldatelli },
  { name: 'tape', ...TAPE, draw: drawTape },
  ...Object.entries(POSTERS).map(([name, draw]) => ({ name, ...POSTER, draw })),
];
