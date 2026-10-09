// Draws the app icon (favicon and home-screen icon): the two Bs of the title
// screen, BARRIERA in ocra and BABYLON in white, slightly overlapped on blue.
// Run with: node tools/make-icons.mjs   (writes public/icons/*.png)
import sharp from 'sharp';
import { C } from '../src/config.js';

// The "B" of Press Start 2P, 7x7 font pixels.
const B = ['######.', '##...##', '##...##', '######.', '##...##', '##...##', '######.'];

const SKY = '#2f6fc0';

// grid: icon side in grid units; px: grid units per font pixel; ox, oy: how
// far the white B sits behind, up and to the right, of the ocra one.
const icon = (grid, px, ox, oy) => {
  const glyph = (x0, y0, fill, shadow) => {
    const rects = [];
    for (const [d, color] of [[1, shadow], [0, fill]]) {
      B.forEach((row, y) =>
        [...row].forEach((c, x) => {
          if (c === '#') rects.push(`<rect x="${x0 + x * px + d}" y="${y0 + y * px + d}" width="${px}" height="${px}" fill="${color}"/>`);
        }),
      );
    }
    return rects.join('');
  };
  const w = 7 * px;
  const x0 = Math.floor((grid - (w + ox)) / 2);
  const y0 = Math.floor((grid - (w + oy)) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid} ${grid}" shape-rendering="crispEdges">
  <rect width="${grid}" height="${grid}" fill="${SKY}"/>
  ${glyph(x0 + ox, y0, C.white, '#2a3048')}
  ${glyph(x0, y0 + oy, C.ocra, '#3a2408')}
</svg>`;
};

const big = icon(48, 3, 13, 7);
const small = icon(32, 2, 9, 5); // drawn 1:1, so the favicon stays crisp

for (const [name, size, svg, grid] of [
  ['icon-512', 512, big, 48],
  ['icon-192', 192, big, 48],
  ['apple-touch-icon', 180, big, 48],
  ['favicon-32', 32, small, 32],
]) {
  await sharp(Buffer.from(svg), { density: (72 * size) / grid })
    .resize(size, size, { kernel: 'nearest' })
    .png()
    .toFile(`public/icons/${name}.png`);
  console.log(`public/icons/${name}.png`);
}
