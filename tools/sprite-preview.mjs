// Renders Painter sprites to an enlarged PNG contact sheet, to look at them
// outside the game. Run with: npm run sprites -- <sheet.mjs> [out.png] [--scale 6] [--bg night]
//
// A sheet is an ES module whose default export is an array of
//   { name, w, h, draw(p) }   // p is a fresh Painter(w, h)
// Each sprite is shown twice: at real size (1x) and enlarged with hard pixels,
// on a background taken from the game palette (default: night).
import sharp from 'sharp';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Painter } from '../src/painter.js';
import { N } from '../src/config.js';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const [, v] = args.splice(i, 2);
  return v;
};
const scale = Number(opt('scale', 6));
const bgName = opt('bg', 'night');
const [sheetPath, outPath = 'sprites-preview.png'] = args;
if (!sheetPath) {
  console.error('usage: npm run sprites -- <sheet.mjs> [out.png] [--scale 6] [--bg night]');
  process.exit(1);
}
const bg = N[bgName] ?? parseInt(String(bgName).replace('#', ''), 16);

const sprites = (await import(pathToFileURL(path.resolve(sheetPath)).href)).default;

const GAP = 8;
const cells = sprites.map((s) => {
  const p = new Painter(s.w, s.h);
  s.draw(p);
  const rgba = Buffer.alloc(s.w * s.h * 4);
  p.px.forEach((c, i) => {
    if (c === null) return;
    rgba.writeUInt32BE(((c << 8) | 0xff) >>> 0, i * 4);
  });
  return { ...s, rgba };
});

// Left to right, wrapping into rows so the sheet stays readable as one image.
const MAX_W = 1400;
const raw = (c) => ({ raw: { width: c.w, height: c.h, channels: 4 } });
const layers = [];
let x = GAP;
let y = GAP;
let rowH = 0;
let width = 0;
for (const c of cells) {
  const cellW = c.w + GAP + c.w * scale;
  if (x > GAP && x + cellW + GAP > MAX_W) {
    x = GAP;
    y += rowH + GAP * 2;
    rowH = 0;
  }
  layers.push({ input: c.rgba, ...raw(c), left: x, top: y });
  const big = await sharp(c.rgba, raw(c)).resize(c.w * scale, c.h * scale, { kernel: 'nearest' }).png().toBuffer();
  layers.push({ input: big, left: x + c.w + GAP, top: y });
  console.log(`${c.name}  ${c.w}x${c.h}  at ${x},${y}`);
  x += cellW + GAP * 2;
  width = Math.max(width, x - GAP);
  rowH = Math.max(rowH, c.h * scale);
}
const height = y + rowH + GAP;

await sharp({
  create: { width, height, channels: 4, background: { r: bg >> 16, g: (bg >> 8) & 0xff, b: bg & 0xff, alpha: 1 } },
})
  .composite(layers)
  .png()
  .toFile(outPath);
console.log('→', outPath);
