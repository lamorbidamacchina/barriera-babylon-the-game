// Tiny 3×5 pixel font, for text printed on sprites (posters, labels) where the
// game font (8px) is far too big. Each glyph is 5 rows of 3 bits.
const GLYPHS = {
  A: '010 101 111 101 101', B: '110 101 110 101 110', C: '011 100 100 100 011',
  D: '110 101 101 101 110', E: '111 100 110 100 111', F: '111 100 110 100 100',
  G: '011 100 101 101 011', H: '101 101 111 101 101', I: '111 010 010 010 111',
  J: '001 001 001 101 010', K: '101 101 110 101 101', L: '100 100 100 100 111',
  M: '101 111 111 101 101', N: '110 101 101 101 101', O: '010 101 101 101 010',
  P: '110 101 110 100 100', Q: '010 101 101 110 011', R: '110 101 110 101 101',
  S: '011 100 010 001 110', T: '111 010 010 010 010', U: '101 101 101 101 111',
  V: '101 101 101 101 010', W: '101 101 111 111 101', X: '101 101 010 101 101',
  Y: '101 101 010 010 010', Z: '111 001 010 100 111',
  0: '111 101 101 101 111', 1: '010 110 010 010 111', 2: '110 001 010 100 111',
  3: '110 001 010 001 110', 4: '101 101 111 001 001', 5: '111 100 110 001 110',
  6: '011 100 111 101 111', 7: '111 001 010 010 010', 8: '111 101 111 101 111',
  9: '111 101 111 001 110',
  '!': '010 010 010 000 010', '.': '000 000 000 000 010', ':': '000 010 000 010 000',
  '-': '000 000 111 000 000', '/': '001 001 010 100 100', '%': '101 001 010 100 101',
  ' ': '000 000 000 000 000',
};

export const miniWidth = (str, scale = 1) => (str.length * 4 - 1) * scale;

// Prints `str` on a Painter at (x, y); `scale` makes chunky titles.
export function miniText(p, str, x, y, color, scale = 1) {
  [...str.toUpperCase()].forEach((ch, i) => {
    const rows = (GLYPHS[ch] ?? GLYPHS[' ']).split(' ');
    rows.forEach((row, ry) => {
      [...row].forEach((bit, rx) => {
        if (bit === '1') p.rect(x + (i * 4 + rx) * scale, y + ry * scale, scale, scale, color);
      });
    });
  });
}

// Same, centred on `cx`.
export function miniTextCentered(p, str, cx, y, color, scale = 1) {
  miniText(p, str, Math.round(cx - miniWidth(str, scale) / 2), y, color, scale);
}
