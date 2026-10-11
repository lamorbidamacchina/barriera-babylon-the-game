// How many lines a string takes once word-wrapped, for checking that game
// text fits its panel. The font is monospaced, 8px per character at size 8,
// so a wrap width in px is a number of characters.
export function wrappedLines(str, chars) {
  let lines = 0;
  let len = -1; // characters on the current line; -1: no line yet
  for (const word of str.split(/\s+/).filter(Boolean)) {
    if (len < 0 || len + 1 + word.length > chars) {
      lines++;
      len = word.length;
    } else {
      len += 1 + word.length;
    }
  }
  return lines;
}

// The line above the name field on the record panel (src/records.js): 224px.
export const RECORD_LINE_CHARS = 224 / 8;
