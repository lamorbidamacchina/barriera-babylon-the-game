// Internal resolution: everything is drawn at this size and scaled up
// by an integer factor (in device pixels) so pixels stay square and crisp.
export const WIDTH = 480;
export const HEIGHT = 270;

export const FONT = '"Press Start 2P"';

// Palette, taken from the promo site and illustrations.
export const C = {
  black: '#05070c',
  night: '#0e1626',
  night2: '#1b2a44',
  night3: '#2c4060',
  smog: '#5a4630',
  ocra: '#c9963a',
  ocraLight: '#e8c06a',
  paper: '#e9dcc0',
  white: '#f4f1e8',
  neon: '#ff7a2f',
  neonGlow: '#ffb070',
  chalk: '#e8e4d8',
  chalkDim: '#8f968c',
  chalkHi: '#f2d27a',
  board: '#1c2520',
  wood: '#6b4226',
  woodLight: '#8a5a34',
  woodDark: '#3e2614',
  brick: '#5a2f26',
  mortar: '#2a1a16',
  concrete: '#5b5b58',
  concreteLight: '#7a7a74',
  pink: '#ff4fa3',
  droneLight: '#fff2b0',
  red: '#e0443a',
};

// Same palette as numbers, for Graphics calls.
export const N = Object.fromEntries(
  Object.entries(C).map(([k, v]) => [k, parseInt(v.slice(1), 16)]),
);
