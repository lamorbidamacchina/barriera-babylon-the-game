// Pixel-art sprites for "Il contrabbando di Zio Franco", drawn with code.
// Every sprite is parametric: it is rasterized natively at the size each
// level needs (no blurry or blocky rescaling), and level after level the
// veggies get smaller. Sizes at scale 1 follow Fruit Ninja's first fruits:
// about 15-28% of the screen height.
import { shaded, paint } from '../../painter.js';

export const VEGGIES = {
  zucchina: { name: 'ZUCCHINE', w: 64, h: 22, juice: [0x9fd36a, 0xe8f0b0] },
  pomodoro: { name: 'POMODORI', w: 40, h: 38, juice: [0xe0402a, 0xff8a6a] },
  melanzana: { name: 'MELANZANE', w: 36, h: 54, juice: [0xe8e0b0, 0x7a4a8a] },
  cavolo: { name: 'CAVOLO NERO', w: 34, h: 60, juice: [0x3e6a4a, 0x9fd36a] },
  bietola: { name: 'BIETOLE', w: 38, h: 58, juice: [0x6ab04a, 0xc0304a] },
  zucca: { name: 'ZUCCHE', w: 60, h: 48, juice: [0xf0a040, 0xffe080] },
};

export const POWERUPS = {
  laser: { label: 'LASER DI MEI LI!', color: 0xe0443a },
  valzer: { label: 'VALZER!', color: 0xff4fa3 },
  attivatore: { label: 'ATTIVATORE!', color: 0x9be36b },
};

const ICON_MAX = 22; // HUD and recipe card icons fit in this box

export const vegKey = (type, size) => `${type}@${Math.round(size * 100)}`;
export const iconKey = (type) => `${type}@icon`;
export const droneKey = (size) => `drone@${Math.round(size * 100)}`;
export const powerKey = (type, size) => `pw-${type}@${Math.round(size * 100)}`;

// Each painter works in a w×h box; shapes keep a 1px margin for the outline.
export const draw = {
  zucchina(p, w, h) {
    const pal = { base: 0x2f6b2a, dark: 0x1c4419, light: 0x4f8f3e, hl: 0xb8e08a };
    const m = shaded(pal, w / 2, h / 2, w / 2 - 1, h / 2 - 1);
    p.ellipse(w * 0.5, h * 0.52, w * 0.44, h * 0.36, m);
    p.ellipse(w * 0.27, h * 0.5, w * 0.24, h * 0.42, m); // fatter blossom end
    // pale speckled stripes
    const s = Math.max(2, Math.round(w / 14));
    for (let x = Math.round(w * 0.1); x < w * 0.88; x += s * 2) {
      p.rect(x, h * 0.36, s, 1, 0x6aa85a, { over: true });
      p.rect(x + s, h * 0.62, s, 1, 0x4f8f3e, { over: true });
    }
    p.rect(w * 0.9, h * 0.4, w * 0.09, h * 0.2, 0x9aaa6a); // stem
    p.rect(w * 0.9, h * 0.52, w * 0.09, Math.max(1, h * 0.08), 0x6a7a42);
    p.ellipse(w * 0.06, h * 0.5, Math.max(1.5, w * 0.04), Math.max(1.5, h * 0.12), 0xe0c860); // flower end
    p.outline(0x0e220c);
  },
  pomodoro(p, w, h) {
    const pal = { base: 0xd8402a, dark: 0x8e2214, light: 0xf26a4a, hl: 0xffd0b8 };
    p.ellipse(w / 2, h * 0.56, w * 0.46, h * 0.42, shaded(pal, w / 2, h * 0.56, w * 0.46, h * 0.42));
    const g = 0x3a8a2a;
    const cx = w / 2;
    const cy = h * 0.2;
    p.ellipse(cx - w * 0.14, cy + h * 0.04, w * 0.12, h * 0.05, g);
    p.ellipse(cx + w * 0.14, cy + h * 0.04, w * 0.12, h * 0.05, g);
    p.ellipse(cx, cy + h * 0.06, w * 0.06, h * 0.08, g);
    p.ellipse(cx, cy, w * 0.1, h * 0.05, 0x2a6a1e);
    p.rect(cx - Math.max(1, w * 0.03), 1, Math.max(2, w * 0.06), h * 0.18, 0x4a7a2a); // stem
    p.outline(0x3a0c06);
  },
  melanzana(p, w, h) {
    const pal = { base: 0x4a2a5a, dark: 0x26102f, light: 0x6c3e80, hl: 0xc8a8d8 };
    const m = shaded(pal, w / 2, h * 0.58, w / 2 - 1, h * 0.42);
    p.ellipse(w / 2, h * 0.66, w * 0.46, h * 0.32, m);
    p.ellipse(w / 2, h * 0.42, w * 0.3, h * 0.24, m);
    // glossy streak
    p.ellipse(w * 0.33, h * 0.62, Math.max(1, w * 0.05), h * 0.13, 0x9a70b0, { over: true });
    // green cap with pointy sepals
    const g = 0x4a8a3a;
    p.ellipse(w / 2, h * 0.2, w * 0.3, h * 0.07, g);
    p.ellipse(w * 0.3, h * 0.26, w * 0.08, h * 0.06, g);
    p.ellipse(w * 0.7, h * 0.26, w * 0.08, h * 0.06, g);
    p.ellipse(w / 2, h * 0.27, w * 0.07, h * 0.06, 0x3a7030);
    p.rect(w / 2 - Math.max(1, w * 0.06), 1, Math.max(2, w * 0.12), h * 0.16, 0x5a8a42); // stem
    p.outline(0x140818);
  },
  cavolo(p, w, h) {
    // Lacinato kale: long blistered leaf, blue-green.
    const pal = { base: 0x24402e, dark: 0x142619, light: 0x3e6a4a, hl: 0x7aa07a };
    const m = shaded(pal, w / 2, h * 0.45, w / 2 - 1, h * 0.45);
    p.ellipse(w / 2, h * 0.44, w * 0.36, h * 0.42, m);
    // wavy edges
    const step = Math.max(3, Math.round(h / 10));
    for (let y = h * 0.1; y < h * 0.82; y += step) {
      const t = (y - h * 0.44) / (h * 0.42);
      const half = w * 0.36 * Math.sqrt(Math.max(0, 1 - t * t));
      const r = Math.max(1.5, w * 0.08);
      p.ellipse(w / 2 - half, y, r, r, m);
      p.ellipse(w / 2 + half, y + step / 2, r, r, m);
    }
    // blisters
    const b = Math.max(3, Math.round(w / 8));
    for (let y = Math.round(h * 0.1); y < h * 0.8; y += b) {
      for (let x = Math.round(w * 0.2) + ((y / b) % 2) * Math.round(b / 2); x < w * 0.8; x += b) p.rect(x, y, 1, 1, 0x52805a, { over: true });
    }
    // midrib and stem
    const rib = Math.max(2, Math.round(w * 0.08));
    p.rect(w / 2 - rib / 2, h * 0.06, rib, h * 0.8, 0x8aa880, { over: true });
    p.rect(w / 2 - rib / 2, h * 0.8, rib, h * 0.18, 0x7a9a6a);
    p.outline(0x0a160e);
  },
  bietola(p, w, h) {
    const pal = { base: 0x3a8a3a, dark: 0x225a22, light: 0x5aaa4a, hl: 0xb0e090 };
    p.ellipse(w / 2, h * 0.4, w * 0.45, h * 0.37, shaded(pal, w / 2, h * 0.4, w * 0.45, h * 0.37));
    p.ellipse(w * 0.3, h * 0.3, w * 0.12, h * 0.1, 0x4a9a42, { over: true }); // bumps
    p.ellipse(w * 0.66, h * 0.48, w * 0.12, h * 0.1, 0x307a30, { over: true });
    // red midrib, veins and stalk
    const rib = Math.max(2, Math.round(w * 0.12));
    const x0 = w / 2 - rib / 2;
    p.rect(x0, h * 0.1, rib, h * 0.88, 0xc0304a);
    p.rect(x0 + rib - Math.max(1, rib / 3), h * 0.1, Math.max(1, rib / 3), h * 0.88, 0x8a1a30);
    p.rect(x0, h * 0.1, 1, h * 0.88, 0xe86a7a);
    for (let i = 0; i < 4; i++) {
      const y = h * (0.2 + i * 0.13);
      p.line(w / 2, y + h * 0.06, w * 0.18, y, 0xd04a5a, { over: true });
      p.line(w / 2, y + h * 0.08, w * 0.82, y + h * 0.02, 0xd04a5a, { over: true });
    }
    p.outline(0x0e240e);
  },
  zucca(p, w, h) {
    const pal = { base: 0xe07a20, dark: 0x9a4808, light: 0xf29a40, hl: 0xffe0a0 };
    const m = shaded(pal, w / 2, h * 0.58, w / 2 - 1, h * 0.4);
    p.ellipse(w * 0.3, h * 0.6, w * 0.25, h * 0.37, m);
    p.ellipse(w * 0.7, h * 0.6, w * 0.25, h * 0.37, m);
    p.ellipse(w * 0.5, h * 0.58, w * 0.25, h * 0.4, m);
    // grooves between the lobes
    for (const gx of [0.37, 0.63]) {
      for (let y = Math.round(h * 0.26); y < h * 0.95; y++) {
        const t = (y - h * 0.6) / (h * 0.36);
        const x = w * gx + (gx < 0.5 ? 1 : -1) * t * t * w * 0.05;
        p.rect(x, y, 1, 1, 0xa85010, { over: true });
      }
    }
    // stem and leaf
    p.rect(w * 0.45, h * 0.04, w * 0.1, h * 0.22, 0x5a3a1a);
    p.rect(w * 0.45, h * 0.04, Math.max(1, w * 0.03), h * 0.22, 0x7a5a2a);
    p.ellipse(w * 0.64, h * 0.14, w * 0.09, h * 0.06, 0x3a7a2a);
    p.outline(0x3a1a04);
  },
};

// Round "bubble" with an icon: bonus items read as special from far away.
const drawPower = {
  laser(p, s, R) {
    R(5, 11, 7, 2, 0xd8d8d8);
    R(4, 11, 1, 2, 0x7a7a7a);
    R(12, 11, 1, 2, 0xff5a4a);
    R(13, 8, 1, 1, 0xff5a4a);
    R(14, 5, 1, 1, 0xff5a4a);
  },
  valzer(p, s, R) {
    R(10, 4, 1, 8, 0xffe0f0);
    R(11, 4, 3, 1, 0xffe0f0);
    R(13, 5, 1, 2, 0xffe0f0);
    R(7, 11, 3, 3, 0xffe0f0);
  },
  attivatore(p, s, R) {
    R(5, 9, 8, 5, 0xc0c0c0);
    R(13, 10, 3, 1, 0xc0c0c0);
    R(6, 9, 6, 2, 0x9be36b);
    R(7, 6, 2, 2, 0x9be36b);
    R(10, 4, 2, 2, 0x9be36b);
  },
};

function addHalves(scene, key) {
  const tex = scene.textures.get(key);
  if (tex.has('left')) return;
  const { width, height } = tex.getSourceImage();
  const half = Math.floor(width / 2);
  tex.add('left', 0, 0, 0, half, height);
  tex.add('right', 0, half, 0, width - half, height);
  tex.firstFrame = '__BASE'; // adding frames would make 'left' the default one
}

// Creates every sprite a level needs, at that level's size.
export function createTextures(scene, size) {
  for (const [type, v] of Object.entries(VEGGIES)) {
    const w = Math.round(v.w * size);
    const h = Math.round(v.h * size);
    paint(scene, vegKey(type, size), w, h, (p) => draw[type](p, w, h));
    addHalves(scene, vegKey(type, size));

    const k = Math.min(1, ICON_MAX / Math.max(v.w, v.h));
    const iw = Math.round(v.w * k);
    const ih = Math.round(v.h * k);
    paint(scene, iconKey(type), iw, ih, (p) => draw[type](p, iw, ih));
  }

  // Power-ups and drone are built from rectangles on an 18px / 30px design
  // grid, scaled by whole pixels.
  const ps = Math.max(1, Math.round(32 * size)) / 18;
  const pw = Math.round(18 * ps);
  for (const [type, def] of Object.entries(POWERUPS)) {
    paint(scene, powerKey(type, size), pw, pw, (p) => {
      const c = pw / 2;
      p.ellipse(c, c, c - 1, c - 1, def.color);
      p.ellipse(c, c, c - 1 - Math.max(2, ps * 1.5), c - 1 - Math.max(2, ps * 1.5), 0x1a1a24);
      p.ellipse(c * 0.62, c * 0.62, Math.max(1, ps), Math.max(1, ps), 0xffffff);
      const R = (x, y, w, h, col) => p.rect(x * ps, y * ps, w * ps, h * ps, col);
      drawPower[type](p, ps, R);
      p.outline(0x05070c);
    });
  }

  const ds = Math.max(1, 46 * size) / 30;
  const dw = Math.round(30 * ds);
  const dh = Math.round(14 * ds);
  paint(scene, droneKey(size), dw, dh, (p) => {
    const R = (x, y, w, h, col) => p.rect(x * ds, y * ds, w * ds, h * ds, col);
    R(0, 0, 12, 1, 0xb0b6c0);
    R(18, 0, 12, 1, 0xb0b6c0);
    R(5, 1, 2, 3, 0x3a3f48);
    R(23, 1, 2, 3, 0x3a3f48);
    R(3, 4, 24, 5, 0x1a1d22);
    R(8, 3, 14, 7, 0x4a505a);
    R(9, 3, 12, 1, 0x6a707a);
    R(12, 10, 6, 3, 0x1a1d22);
    R(14, 11, 2, 2, 0xe0443a); // the eye
  });
  addHalves(scene, droneKey(size));
}
