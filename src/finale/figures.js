// The characters of the finale, drawn facing the viewer as they march down
// the street like Il Quarto Stato. Drawn in code on a Painter, two frames
// each for the walk (frame 0: left foot forward, 1: right), no Phaser, so the
// preview tool and the tests can use them.
//
// Adults are drawn on a 32×64 design grid scaled by k = h / 64, each part
// rounded to whole pixels, so the same drawing works for the front row
// (64 px) and the second row (48 px).
import { shaded } from '../painter.js';

export const ADULT = { w: 32, h: 64 };
export const KID = { w: 22, h: 40 };

const OUTLINE = 0x140e0a;
const SKINS = {
  light: { base: 0xf0c8a0, dark: 0xd8a070, light: 0xf8dcc0 },
  olive: { base: 0xe0b48a, dark: 0xc08c60, light: 0xf0cca8 },
  tan: { base: 0xc8905a, dark: 0x9a6a3a, light: 0xdca878 },
  brown: { base: 0x9a6a44, dark: 0x74482a, light: 0xb4845a },
  deep: { base: 0x6a442a, dark: 0x4e3020, light: 0x84583a },
};

// A printed fabric (wax prints, saris): base with two accents in a small
// repeating motif, on absolute pixels so it doesn't stretch with the body.
const print = (base, a, b) => (x, y) => ((x + 2 * y) % 6 === 0 ? a : (2 * x - y + 30) % 7 === 0 ? b : base);

// Rect and ellipse on the design grid, scaled to the painter's height and
// moved down by dy design pixels.
function grid(p, k, ox = 0, dy = 0) {
  const s = (v) => Math.round(v * k);
  return {
    R: (x, y, w, h, c) => p.rect(ox + s(x), s(y + dy), Math.max(1, s(w)), Math.max(1, s(h)), c),
    E: (cx, cy, rx, ry, c) => p.ellipse(ox + s(cx), s(cy + dy), Math.max(1, rx * k), Math.max(1, ry * k), c),
    s,
  };
}

// A colour and its shades, for shaded().
const darker = (c, f) => ((((c >> 16) & 0xff) * f) << 16) | ((((c >> 8) & 0xff) * f) << 8) | ((c & 0xff) * f);
const lighter = (c, f) => {
  const ch = (v) => Math.round(v + (255 - v) * f);
  return (ch((c >> 16) & 0xff) << 16) | (ch((c >> 8) & 0xff) << 8) | ch(c & 0xff);
};
const tones = (c) => ({ base: c, dark: darker(c, 0.72) & 0xffffff, light: lighter(c, 0.18) });

// A grown-up walking towards us. o: skin, top, sleeve, bottom (trousers, or
// skirt: true, with legs), shoes, belly (extra width), and draw hooks for
// what makes each one recognisable: hairdo(G, bob), extra(G, bob, frame).
// The head and body sit 3 design pixels lower than the grid's top (dy) so a
// bun or curls have room above.
function adult(p, frame, o) {
  const k = p.h / ADULT.h;
  const ox = Math.round((p.w - ADULT.w * k) / 2);
  const G = grid(p, k, ox, 3); // head and body
  const L = grid(p, k, ox, 0); // legs and feet
  const { R, E } = G;
  const skin = SKINS[o.skin ?? 'light'];
  const bob = frame ? 0 : 1; // the body goes up and down a pixel
  const wide = o.belly ?? 0;
  // Legs: the foot coming forward is lower; the other one is lifted.
  const [lf, rf] = frame ? [0, 2] : [2, 0];
  if (o.skirt) {
    R(9 - wide, 37 + bob, 14 + wide * 2, 12, o.bottom);
    L.R(11, 52, 3, 8 + lf, o.legs ?? skin.base);
    L.R(18, 52, 3, 8 + rf, o.legs ?? skin.base);
  } else {
    L.R(10 - wide / 2, 41 + bob, 5 + wide / 2, 19 + lf, o.bottom);
    L.R(17, 41 + bob, 5 + wide / 2, 19 + rf, o.bottom);
    L.R(15, 41 + bob, 2, 3, o.bottom);
  }
  L.R(9, 59 + lf, 6, 3, o.shoes ?? 0x1a1a1a);
  L.R(17, 59 + rf, 6, 3, o.shoes ?? 0x1a1a1a);
  // Body, shaded from the top left (or printed), round shoulders; a tunic
  // (kameez, djellaba, panjabi) comes down over the trousers to the knees.
  const body = o.fabric ?? shaded(tones(o.top), 16 * k + ox, (28 + 3) * k, (9 + wide) * k, 12 * k);
  R(8 - wide, 18 + bob, 16 + wide * 2, o.tunic ? 31 : 21, body);
  E(9 - wide, 19 + bob, 2.5, 2.5, body);
  E(23 + wide, 19 + bob, 2.5, 2.5, body);
  if (o.belly) E(16, 32 + bob, 9 + wide, 7, body);
  // Arms swing: the one opposite the forward foot comes forward (shorter,
  // the hand lower in front).
  const arm = o.fabric && !o.sleeve ? o.fabric : shaded(tones(o.sleeve ?? o.top), 16 * k + ox, (28 + 3) * k, 14 * k, 12 * k);
  const [la, ra] = frame ? [-2, 2] : [2, -2];
  R(5 - wide, 19 + bob, 3, 16 + la, arm);
  R(5 - wide, 35 + bob + la, 3, 3, skin.base);
  R(24 + wide, 19 + bob, 3, 16 + ra, arm);
  R(24 + wide, 35 + bob + ra, 3, 3, skin.base);
  // Neck and head: a big head, as in 16-bit games.
  R(14, 14 + bob, 4, 5, skin.dark);
  E(16, 8 + bob, 7, 8, shaded(skin, 16 * k + ox, (8 + 3 + bob) * k, 7 * k, 8 * k));
  E(8.8, 9 + bob, 1, 1.5, skin.dark); // ears
  E(23.2, 9 + bob, 1, 1.5, skin.dark);
  o.hairdo?.(G, bob);
  // Eyes, a nose, the mouth.
  R(12, 8 + bob, 2, 2, 0x1a1010);
  R(18, 8 + bob, 2, 2, 0x1a1010);
  R(12, 8 + bob, 1, 1, 0xf4f1e8);
  R(18, 8 + bob, 1, 1, 0xf4f1e8);
  R(15.5, 10 + bob, 1, 2, skin.dark);
  R(14, 13 + bob, 4, 1, o.mouth ?? (o.skin === 'deep' || o.skin === 'brown' ? 0x5a2a20 : 0xa05a44));
  o.extra?.(G, bob, frame);
  p.outline(OUTLINE);
}

// A child walking towards us, bigger head, on a 22×40 grid.
function child(p, frame, o) {
  const k = p.h / KID.h;
  const G = grid(p, k, Math.round((p.w - KID.w * k) / 2));
  const { R, E } = G;
  const skin = SKINS[o.skin ?? 'light'];
  const bob = frame ? 0 : 1;
  const [lf, rf] = frame ? [0, 1] : [1, 0];
  R(7, 26 + bob, 3, 11 + lf, o.bottom);
  R(12, 26 + bob, 3, 11 + rf, o.bottom);
  R(6, 36 + lf, 5, 2, 0x1a1a1a);
  R(12, 36 + rf, 5, 2, 0x1a1a1a);
  R(6, 15 + bob, 10, 12, o.top);
  const [la, ra] = frame ? [-1, 1] : [1, -1];
  R(3, 16 + bob, 3, 9 + la, o.sleeve ?? o.top);
  R(3, 25 + bob + la, 3, 2, skin.base);
  R(16, 16 + bob, 3, 9 + ra, o.sleeve ?? o.top);
  R(16, 25 + bob + ra, 3, 2, skin.base);
  R(10, 13 + bob, 2, 3, skin.dark);
  E(11, 8 + bob, 6, 6.5, shaded(skin, 11 * k, (8 + bob) * k, 6 * k, 6.5 * k));
  o.hairdo?.(G, bob);
  R(8, 8 + bob, 1, 1, 0x1a1010);
  R(13, 8 + bob, 1, 1, 0x1a1010);
  R(10, 12 + bob, 2, 1, 0xa05a44);
  o.extra?.(G, bob, frame);
  p.outline(OUTLINE);
}

// ---------------------------------------------------------------- the front row

// Mei Li, the empress of Barriera, in the middle: black hair pulled up in a
// bun, black top, black trousers, chin up.
export function meiLi(p, frame) {
  adult(p, frame, {
    skin: 'light',
    top: 0x1e1e24,
    bottom: 0x2a2a30,
    shoes: 0x0e0e10,
    mouth: 0x8a3a3a,
    hairdo: ({ R, E }, b) => {
      E(16, 3 + b, 7.5, 4.5, 0x14100e);
      R(8.5, 3 + b, 2, 8, 0x14100e);
      R(21.5, 3 + b, 2, 8, 0x14100e);
      E(16, 0 + b, 4.5, 3, 0x14100e); // the bun
      R(14, -1 + b, 2, 1, 0x3a3434); // its shine
      R(19, -2 + b, 5, 1, 0xc0303a); // a red hairpin through it
    },
    extra: ({ R }, b) => {
      R(12, 18 + b, 8, 2, 0x34343c); // the collar of her top
      R(9, 34 + b, 14, 2, 0xc0303a); // a red belt: the Bar Stella's colours
    },
  });
}

// Zio Franco: old, stocky, wavy grey hair, a grey-blue work shirt with the
// sleeves rolled up, brown trousers, a leek from his contraband in one hand.
export function zioFranco(p, frame) {
  adult(p, frame, {
    skin: 'olive',
    top: 0x5a6a7a,
    sleeve: 0x5a6a7a,
    bottom: 0x5a4430,
    belly: 2,
    shoes: 0x3a2414,
    hairdo: ({ R, E }, b) => {
      E(16, 2.5 + b, 8, 4.5, 0x9a968e);
      // wavy grey locks, light on top, darker in the hollows
      for (const [x, y] of [[9, 2], [12.5, 0.5], [16, 0], [19.5, 0.5], [23, 2], [10.5, 4], [21.5, 4]]) {
        E(x, y + b, 2.4, 2.2, 0xc8c4bc);
        R(x - 0.5, y + 0.5 + b, 1, 1, 0xe8e4dc);
      }
      R(8.5, 4 + b, 2, 5, 0xb8b4ac);
      R(21.5, 4 + b, 2, 5, 0xb8b4ac);
      R(11, 6 + b, 4, 1, 0x8a8680); // bushy eyebrows
      R(17, 6 + b, 4, 1, 0x8a8680);
    },
    extra: ({ R }, b, frame) => {
      R(13, 18 + b, 6, 5, 0x4a5868); // open collar
      R(15, 18 + b, 2, 4, 0xe0b48a);
      R(12, 11 + b, 8, 3, 0x9a8a7a); // stubble
      R(14, 13 + b, 4, 1, 0xa05a44);
      // the leek, held in the hand that swings forward
      const x = frame ? 25 : 2;
      R(x, 30 + b, 2, 12, 0xe8e4d0);
      R(x - 1, 24 + b, 4, 7, 0x4a8a3a);
    },
  });
}

// Rosanna, the teacher and commander: dark curls, round glasses, a mauve
// cardigan over a scarf, a long skirt; she holds Luna's hand (Luna is drawn
// apart, at her side).
export function rosanna(p, frame) {
  adult(p, frame, {
    skin: 'light',
    top: 0xa8708a,
    bottom: 0x4a3a4a,
    skirt: true,
    legs: 0x3a2e3a,
    shoes: 0x2a1a1a,
    hairdo: ({ R, E }, b) => {
      for (const [x, y] of [[9.5, 2], [12.5, 0], [16, -0.5], [19.5, 0], [22.5, 2], [8.5, 6], [23.5, 6], [9, 10], [23, 10]]) E(x, y + b, 2.8, 2.8, 0x3a2418);
    },
    extra: ({ R }, b) => {
      // round glasses
      for (const x of [11, 17]) {
        R(x, 7 + b, 4, 1, 0x3a2a2a);
        R(x, 10 + b, 4, 1, 0x3a2a2a);
        R(x, 7 + b, 1, 4, 0x3a2a2a);
        R(x + 3, 7 + b, 1, 4, 0x3a2a2a);
      }
      R(15, 8 + b, 2, 1, 0x3a2a2a);
      R(11, 18 + b, 10, 4, 0xe8d8a8); // the scarf
      R(14, 22 + b, 3, 7, 0xe8d8a8);
      for (const y of [24, 28, 32, 36]) R(18, y + b, 1, 1, 0xe8c06a); // buttons
    },
  });
}

// Luna, the smallest of the Comitato Caos, the most unsettling: a
// dark bob, a yellow raincoat, staring straight at us.
export function luna(p, frame) {
  child(p, frame, {
    skin: 'light',
    top: 0xe8c040,
    bottom: 0x3a4a6a,
    hairdo: ({ R, E }, b) => {
      E(11, 4 + b, 6.5, 4, 0x1a1212);
      R(5, 4 + b, 2, 7, 0x1a1212);
      R(15, 4 + b, 2, 7, 0x1a1212);
      R(6, 5 + b, 10, 2, 0x1a1212); // a straight fringe
    },
    extra: ({ R }, b) => {
      R(8, 8 + b, 2, 2, 0x1a1010); // wide, unblinking eyes
      R(12, 8 + b, 2, 2, 0x1a1010);
      R(10, 12 + b, 2, 1, 0x7a4a3a);
    },
  });
}

export const FRONT_ROW = { zioFranco, meiLi, rosanna };

// ---------------------------------------------------------------- the second row

// Don Remo, the defrocked priest: heavy, a black cassock to the ankles with
// the white collar, thinning hair combed back, the e-cigar in hand.
export function donRemo(p, frame) {
  adult(p, frame, {
    skin: 'light',
    top: 0x1e1a1e,
    tunic: true,
    bottom: 0x1e1a1e,
    belly: 2,
    shoes: 0x0e0a0a,
    mouth: 0x8a3a3a,
    hairdo: ({ R, E }, b) => {
      // receding: hair only on the sides and a thin strand combed over
      R(8.5, 3 + b, 3, 7, 0x3a2a24);
      R(20.5, 3 + b, 3, 7, 0x3a2a24);
      R(11, 1.5 + b, 10, 1, 0x3a2a24);
      E(16, 13 + b, 4.5, 1.5, 0xe0a890); // a double chin
    },
    extra: ({ R }, b, frame) => {
      R(14, 18 + b, 4, 2, 0xf4f1e8); // the collar
      for (const y of [22, 26, 30, 34, 38, 42]) R(16, y + b, 1, 1, 0x4a3a44); // cassock buttons
      const x = frame ? 26 : 2;
      R(x, 35 + b, 5, 2, 0x3a3a3a); // the e-cigar
      R(x + 4, 35 + b, 1, 1, 0xe0443a);
    },
  });
}

// Bea, the fortune teller and the novel's narrator: dark hair with a fringe
// in two bunches high up, a black jumper, ripped jeans.
export function bea(p, frame) {
  adult(p, frame, {
    skin: 'light',
    top: 0x1a1a22,
    bottom: 0x4a6a98,
    shoes: 0xe8e4d8,
    hairdo: ({ R, E }, b) => {
      E(16, 3 + b, 7.5, 4.5, 0x1a1214);
      R(9, 4 + b, 14, 3, 0x1a1214); // the fringe
      E(8, 1 + b, 2.5, 3, 0x1a1214); // two bunches
      E(24, 1 + b, 2.5, 3, 0x1a1214);
      R(8.5, 4 + b, 2, 10, 0x1a1214);
      R(21.5, 4 + b, 2, 10, 0x1a1214);
    },
    extra: ({ R }, b) => {
      R(11, 47, 3, 2, 0xc8d8f0); // rips at the knees (on the legs' grid: no bob)
      R(18, 52, 3, 2, 0xc8d8f0);
      R(9, 37 + b, 14, 2, 0x2a1a14); // a belt
    },
  });
}

// ---------------------------------------------------------------- the Comitato Caos kids

// Teresa, 8: black ninja headband, dark bun, black hoodie, the pink marker.
export function teresa(p, frame) {
  child(p, frame, {
    top: 0x2a2a34,
    bottom: 0x2a2a34,
    hairdo: ({ R, E }, b) => {
      E(11, 4 + b, 6.5, 4, 0x2a1a10);
      E(11, 0.5 + b, 2.5, 2, 0x2a1a10);
      R(5, 5 + b, 12, 2, 0x111111);
      R(17, 6 + b, 2, 1, 0x111111);
      R(18, 7 + b, 1, 2, 0x111111);
    },
    extra: ({ R }, b, frame) => {
      const x = frame ? 17 : 2;
      R(x, 21 + b, 2, 6, 0xff4fa3); // the marker
      R(x, 21 + b, 2, 1, 0xf4f1e8);
    },
  });
}

// Chiara, 8: a green army helmet over two pigtails, a khaki jacket, a bag of
// marbles.
export function chiara(p, frame) {
  child(p, frame, {
    top: 0x6a7a3a,
    bottom: 0x3a4a5a,
    hairdo: ({ R, E }, b) => {
      E(4, 9 + b, 1.5, 3, 0x6a3a1a);
      E(18, 9 + b, 1.5, 3, 0x6a3a1a);
      E(11, 3.5 + b, 7.5, 4, 0x4a6a34);
      R(3, 6 + b, 16, 1, 0x34502a);
      R(8, 2 + b, 2, 1, 0x2a3a1e);
      R(13, 3 + b, 2, 1, 0x7a6a3a);
    },
    extra: ({ R }, b, frame) => {
      const x = frame ? 16 : 2;
      R(x, 24 + b, 4, 4, 0x8a5a3a); // the marble bag
      R(x + 1, 23 + b, 2, 1, 0x4a90e0);
    },
  });
}

// Gigi, 9, "il Chimico": curly hair, lab goggles up on his forehead, a lab
// coat too big for him, a bottle of flat cola.
export function gigi(p, frame) {
  child(p, frame, {
    skin: 'tan',
    top: 0xe8e4d8,
    bottom: 0x3a3a44,
    hairdo: ({ R, E }, b) => {
      for (const [x, y] of [[6, 3], [9, 1.5], [12.5, 1], [16, 3], [5, 6], [17, 6]]) E(x, y + b, 2.4, 2.4, 0x3a2414);
      R(5, 5 + b, 12, 1, 0x2a2a2a);
      R(6.5, 4 + b, 3, 3, 0x9ad0e8);
      R(12.5, 4 + b, 3, 3, 0x9ad0e8);
    },
    extra: ({ R }, b, frame) => {
      R(6, 26 + b, 10, 3, 0xe8e4d8); // the coat, down past the waist
      const x = frame ? 17 : 2;
      R(x, 20 + b, 3, 7, 0x4a2414);
      R(x, 22 + b, 3, 1, 0xe0443a);
    },
  });
}

// Samir, 8, the tallest: red bandana, blue t-shirt, headphones round his
// neck, the bluetooth speaker under his arm.
export function samir(p, frame) {
  child(p, frame, {
    skin: 'tan',
    top: 0x3a6ab8,
    bottom: 0x3a3a44,
    hairdo: ({ R, E }, b) => {
      E(11, 3.5 + b, 6.5, 3.5, 0x1a1210);
      R(5, 4 + b, 12, 2, 0xe0443a);
      R(17, 5 + b, 2, 3, 0xe0443a);
    },
    extra: ({ R }, b, frame) => {
      R(7, 15 + b, 8, 1, 0x2a2a2a); // headphones
      R(6, 15 + b, 2, 2, 0x2a2a2a);
      R(14, 15 + b, 2, 2, 0x2a2a2a);
      const x = frame ? 15 : 1;
      R(x, 21 + b, 6, 5, 0x2a2a30); // the speaker
      R(x + 4, 22 + b, 1, 1, 0x4a90e0);
    },
  });
}

// Ayoub, 9, the hacker: green hood pulled over his eyes, the phone's glow.
export function ayoub(p, frame) {
  child(p, frame, {
    skin: 'olive',
    top: 0x3a5a3a,
    bottom: 0x2a2a34,
    hairdo: ({ R, E }, b) => {
      E(11, 6 + b, 7.5, 7, 0x3a5a3a); // the hood
      E(11, 9 + b, 4.5, 4, 0x141414); // its shadow over the face
    },
    extra: ({ R }, b) => {
      R(9, 11 + b, 4, 2, 0x8ad0a8); // chin lit by the screen
      R(8, 9 + b, 2, 1, 0x9ae8b8); // eyes catching the glow
      R(12, 9 + b, 2, 1, 0x9ae8b8);
      R(9, 20 + b, 4, 3, 0x1a1a22); // the phone
      R(10, 21 + b, 2, 1, 0x6ae8a0);
    },
  });
}

// Marco, who plants cabbages everywhere: a cabbage in his arms.
export function marco(p, frame) {
  child(p, frame, {
    skin: 'light',
    top: 0xc87a2a,
    bottom: 0x3a4a6a,
    hairdo: ({ R, E }, b) => {
      E(11, 3.5 + b, 6.5, 3.5, 0xa8642a); // ginger
      R(6, 5 + b, 3, 2, 0xa8642a);
    },
    extra: ({ E }, b) => {
      E(11, 22 + b, 4.5, 4, 0x5aa04a); // the cabbage, held in front
      E(10, 21 + b, 2, 1.5, 0x8ac87a);
    },
  });
}

export const KIDS = { teresa, chiara, gigi, samir, ayoub, marco, luna };
export const SECOND_ROW = { donRemo, bea };

// ---------------------------------------------------------------- the neighbourhood
// Barriera is many places at once: Nigerian, North African, Bangladeshi,
// Pakistani and Chinese families march with the bar and the school.
// Recognisable by their clothes, never by caricature.

// A Nigerian woman in a wax-print dress and a tall gele headwrap.
export function nigerianWoman(p, frame) {
  const wax = print(0xe07a2a, 0x2a7a5a, 0xf4e08a);
  adult(p, frame, {
    skin: 'deep',
    top: 0xe07a2a,
    fabric: wax,
    bottom: 0xe07a2a,
    skirt: true,
    legs: 0x6a442a,
    shoes: 0x3a2a1a,
    hairdo: ({ R, E }, b) => {
      E(16, 1 + b, 9, 4.5, wax); // the gele, wide and tall
      E(21, -1 + b, 4, 3, wax);
      R(8, 3 + b, 16, 2, 0x2a7a5a);
    },
    extra: ({ R }, b) => {
      R(9, 37 + b, 14, 12, wax); // the long wrapper skirt, same print
      R(14, 18 + b, 4, 1, 0xf4e08a); // a necklace
    },
  });
}

// A Nigerian man in a bright patterned shirt and dark trousers.
export function nigerianMan(p, frame) {
  adult(p, frame, {
    skin: 'deep',
    top: 0x2a5aa8,
    fabric: print(0x2a5aa8, 0xf4c430, 0xe8e4d8),
    bottom: 0x2a2a30,
    hairdo: ({ E }, b) => E(16, 2 + b, 7, 3.5, 0x1a1010), // short hair
  });
}

// A North African woman: a hijab framing her face, a long beige coat.
export function maghrebWoman(p, frame) {
  adult(p, frame, {
    skin: 'olive',
    top: 0xb89a74,
    tunic: true,
    bottom: 0x4a3a30,
    shoes: 0x2a1a14,
    hairdo: ({ R, E }, b) => {
      const scarf = 0x3a7a7a;
      E(16, 6 + b, 9, 9, scarf); // the hijab round the head
      R(9, 12 + b, 14, 9, scarf); // and down over the neck
    },
    extra: ({ R, E }, b) => {
      // her face, inside the scarf (drawn again on top of it)
      E(16, 9 + b, 5.5, 6, 0xe0b48a);
      R(12, 8 + b, 2, 2, 0x1a1010);
      R(18, 8 + b, 2, 2, 0x1a1010);
      R(14, 12 + b, 4, 1, 0xa05a44);
    },
  });
}

// A North African man with a beard, in a hooded djellaba.
export function maghrebMan(p, frame) {
  adult(p, frame, {
    skin: 'tan',
    top: 0xd8d0c0,
    tunic: true,
    bottom: 0x6a6258,
    shoes: 0xe8d8a8, // babouches
    hairdo: ({ R, E }, b) => {
      E(16, 2 + b, 7, 3.5, 0x1a1210);
      R(10, 11 + b, 12, 4, 0x2a1e18); // the beard
      E(16, 15 + b, 5, 3, 0x2a1e18);
    },
    extra: ({ R }, b) => {
      R(14, 13 + b, 4, 1, 0x7a4a30);
      R(15, 20 + b, 2, 26, 0xb8b0a0); // the djellaba's front seam
    },
  });
}

// A Bangladeshi woman in a sari: the end (pallu) across her body and over
// one shoulder, a bindi-free, plain parting.
export function bangladeshiWoman(p, frame) {
  const sari = print(0x2a8a5a, 0xe8c040, 0xc0303a);
  adult(p, frame, {
    skin: 'tan',
    top: 0x2a8a5a,
    fabric: sari,
    bottom: 0x2a8a5a,
    skirt: true,
    legs: 0x2a8a5a,
    shoes: 0x8a5a2a,
    hairdo: ({ R, E }, b) => {
      E(16, 3 + b, 7.5, 4.5, 0x1a1010);
      R(15.5, 0 + b, 1, 4, 0x3a2a2a); // the parting
      E(16, 15 + b, 4, 2, 0x1a1010); // a bun low at the nape
    },
    extra: ({ R }, b) => {
      R(9, 37 + b, 14, 14, sari);
      for (let i = 0; i < 14; i++) R(9 + i, 20 + i + b, 3, 2, 0xe8c040); // the pallu, diagonal, gold border
    },
  });
}

// A Bangladeshi man in a long panjabi and a white cap.
export function bangladeshiMan(p, frame) {
  adult(p, frame, {
    skin: 'brown',
    top: 0x8a3a5a,
    tunic: true,
    bottom: 0xe8e4d8,
    shoes: 0x3a2a1a,
    hairdo: ({ R, E }, b) => {
      E(16, 2.5 + b, 7, 3.5, 0xf4f1e8); // the tupi cap
      R(9, 3 + b, 14, 2, 0xd8d4c8);
      R(12, 12 + b, 8, 3, 0x2a1e18); // a short beard
    },
    extra: ({ R }, b) => {
      R(14, 13 + b, 4, 1, 0x5a2a20);
      R(15, 19 + b, 2, 8, 0xe8c06a); // embroidered placket
    },
  });
}

// A Pakistani man in shalwar kameez and a waistcoat.
export function pakistaniMan(p, frame) {
  adult(p, frame, {
    skin: 'tan',
    top: 0xe8e4d8,
    tunic: true,
    bottom: 0xe8e4d8,
    shoes: 0x2a1a14,
    hairdo: ({ R, E }, b) => {
      E(16, 2 + b, 7, 3.5, 0x1a1210);
      R(12, 11 + b, 8, 2, 0x2a1e18); // moustache and stubble
    },
    extra: ({ R }, b) => {
      R(14, 13 + b, 4, 1, 0x7a4a30);
      R(8, 18 + b, 5, 18, 0x3a4a3a); // the waistcoat
      R(19, 18 + b, 5, 18, 0x3a4a3a);
    },
  });
}

// A Pakistani woman in a shalwar kameez with a dupatta over her hair and
// shoulders.
export function pakistaniWoman(p, frame) {
  adult(p, frame, {
    skin: 'tan',
    top: 0xc0306a,
    tunic: true,
    bottom: 0xe8e4d8,
    shoes: 0xc8a040,
    hairdo: ({ R, E }, b) => {
      const dupatta = 0x3aa890;
      E(16, 3 + b, 9, 5, dupatta); // the dupatta, loose on the back of her head
      R(7, 4 + b, 3, 18, dupatta); // falling over the shoulders
      R(22, 4 + b, 3, 18, dupatta);
      R(7, 21 + b, 3, 1, 0xe8c040); // its gold border
      R(22, 21 + b, 3, 1, 0xe8c040);
      E(16, 4.5 + b, 6.5, 3.5, 0x1a1010); // black hair, parted, in front of it
      R(15.5, 1.5 + b, 1, 3, 0x3a2a2a);
    },
    extra: ({ R }, b) => {
      for (const x of [11, 15, 19]) R(x, 26 + b, 2, 2, 0xe8c040); // embroidery
    },
  });
}

// An elderly Chinese man: a flat cap, a padded jacket, a shopping bag of
// greens from the market.
export function chineseMan(p, frame) {
  adult(p, frame, {
    skin: 'light',
    top: 0x3a4a6a,
    bottom: 0x2a2a30,
    shoes: 0x1a1a1a,
    hairdo: ({ R, E }, b) => {
      E(16, 2 + b, 7.5, 3.5, 0x4a4a4a); // the flat cap
      R(9, 3 + b, 16, 2, 0x3a3a3a);
      R(23, 4 + b, 3, 1, 0x3a3a3a);
    },
    extra: ({ R }, b, frame) => {
      R(10, 22 + b, 12, 1, 0x2a3a5a); // the jacket's quilting
      R(10, 28 + b, 12, 1, 0x2a3a5a);
      const x = frame ? 25 : 1;
      R(x, 34 + b, 6, 7, 0xe0443a); // a red plastic bag
      R(x + 1, 32 + b, 2, 3, 0x5aa04a); // greens sticking out
    },
  });
}

// Two of the Italian neighbours: a granny with a floral dress and a shopping
// trolley, a worker in blue overalls and a cap.
export function nonna(p, frame) {
  adult(p, frame, {
    skin: 'light',
    top: 0x7a5a9a,
    fabric: print(0x7a5a9a, 0xe8c0d8, 0x9ac87a),
    bottom: 0x7a5a9a,
    skirt: true,
    legs: 0xd8b8a0,
    shoes: 0x3a2a24,
    hairdo: ({ R, E }, b) => {
      E(16, 2.5 + b, 7.5, 4, 0xd8d4d0);
      E(16, -0.5 + b, 3.5, 2.5, 0xd8d4d0); // a grey bun
      R(8.5, 4 + b, 2, 5, 0xd8d4d0);
      R(21.5, 4 + b, 2, 5, 0xd8d4d0);
    },
    extra: ({ R }, b, frame) => {
      const x = frame ? 27 : 0;
      R(x, 34 + b, 5, 9, 0x2a5a8a); // the shopping trolley
      R(x + 1, 43 + b, 1, 2, 0x1a1a1a);
      R(x + 3, 43 + b, 1, 2, 0x1a1a1a);
    },
  });
}

export function operaio(p, frame) {
  adult(p, frame, {
    skin: 'olive',
    top: 0x2a4a8a,
    bottom: 0x2a4a8a,
    shoes: 0x3a2a14,
    hairdo: ({ R, E }, b) => {
      E(16, 2 + b, 7.5, 3.5, 0xe8b020); // a yellow work cap
      R(16, 4 + b, 10, 2, 0xc89418);
      R(12, 11 + b, 8, 2, 0x5a4a3a); // a moustache
    },
    extra: ({ R }, b) => {
      R(14, 13 + b, 4, 1, 0x8a4a30);
      R(10, 18 + b, 2, 12, 0x1e3a6a); // the overall's straps
      R(20, 18 + b, 2, 12, 0x1e3a6a);
      R(13, 26 + b, 6, 5, 0x1e3a6a); // the bib pocket
    },
  });
}

export const NEIGHBOURS = { nigerianWoman, nigerianMan, maghrebWoman, maghrebMan, bangladeshiWoman, bangladeshiMan, pakistaniMan, pakistaniWoman, chineseMan, nonna, operaio };
