// Sprite sheet for tools/sprite-preview.mjs: props of the Bar Stella.
import { YARN, POSTER, POSTERS, drawYarn } from '../../src/sprites/bar.js';

export default [
  { name: 'yarn', ...YARN, draw: drawYarn },
  ...Object.entries(POSTERS).map(([name, draw]) => ({ name, ...POSTER, draw })),
];
