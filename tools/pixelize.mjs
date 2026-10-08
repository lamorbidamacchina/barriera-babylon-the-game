// Converts the promo comic illustrations (art/source) into pixel-art portraits
// for the game (public/assets/portraits). Run with: npm run pixelize
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'art/source';
const OUT = 'public/assets/portraits';
const BORDER = 14; // the promo images have a hand-drawn frame we crop away
const SIZES = [
  { size: 96, colors: 32 },
  { size: 160, colors: 32 },
];

await mkdir(OUT, { recursive: true });

for (const file of await readdir(SRC)) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  const name = path.parse(file).name;
  const { width, height } = await sharp(path.join(SRC, file)).metadata();

  for (const { size, colors } of SIZES) {
    const out = path.join(OUT, `${name}-${size}.png`);
    await sharp(path.join(SRC, file))
      .extract({ left: BORDER, top: BORDER, width: width - BORDER * 2, height: height - BORDER * 2 })
      .linear(1.25, -32) // a bit more contrast survives the downscale better
      .resize(size, size, { kernel: 'lanczos3' })
      .png({ palette: true, colors, dither: 0 })
      .toFile(out);
    console.log('→', out);
  }
}
