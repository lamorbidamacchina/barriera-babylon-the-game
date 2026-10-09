// Sprite sheet for tools/sprite-preview.mjs: props of the Bar Stella.
import { YARN, POSTER, drawYarn, drawPunkPoster, drawBalteaPoster, drawDuckPoster } from '../../src/sprites/bar.js';

export default [
  { name: 'yarn', ...YARN, draw: drawYarn },
  { name: 'nerorgasmo', ...POSTER, draw: drawPunkPoster },
  { name: 'baltea', ...POSTER, draw: drawBalteaPoster },
  { name: 'anatra-zoppa', ...POSTER, draw: drawDuckPoster },
];
