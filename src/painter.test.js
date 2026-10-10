import { describe, it, expect } from 'vitest';
import { Painter, shaded } from './painter.js';

const painted = (p) => p.px.filter((c) => c !== null).length;

describe('Painter', () => {
  it('ignores pixels outside the grid', () => {
    const p = new Painter(4, 3);
    p.set(-1, 0, 1);
    p.set(4, 0, 1);
    p.set(0, 3, 1);
    expect(p.px).toHaveLength(12);
    expect(painted(p)).toBe(0);
    expect(p.get(9, 9)).toBeNull();
  });

  it('clips shapes that go past the edges', () => {
    const p = new Painter(8, 8);
    p.ellipse(0, 0, 10, 10, 1).rect(-5, -5, 20, 20, 2).line(-3, -3, 12, 12, 3);
    expect(p.px).toHaveLength(64);
    expect(p.px.every((c) => c !== null)).toBe(true);
  });

  it('draws a rect of at least one pixel', () => {
    const p = new Painter(5, 5).rect(1, 1, 0.2, 0.2, 7);
    expect(painted(p)).toBe(1);
    expect(p.get(1, 1)).toBe(7);
  });

  it('draws a line end to end', () => {
    const p = new Painter(6, 6).line(0, 5, 5, 0, 1);
    expect(p.get(0, 5)).toBe(1);
    expect(p.get(5, 0)).toBe(1);
    expect(painted(p)).toBe(6);
  });

  it('paints "over" only where something is already drawn', () => {
    const p = new Painter(6, 1).rect(0, 0, 3, 1, 1).rect(0, 0, 6, 1, 2, { over: true });
    expect(p.px).toEqual([2, 2, 2, null, null, null]);
  });

  it('outlines around the shape, not on it', () => {
    const p = new Painter(3, 3);
    p.set(1, 1, 5);
    p.outline(9);
    expect(p.px).toEqual([null, 9, null, 9, 5, 9, null, 9, null]);
  });

  it('takes colors as functions of the pixel', () => {
    const p = new Painter(2, 2).rect(0, 0, 2, 2, (x, y) => x + y * 10);
    expect(p.px).toEqual([0, 1, 10, 11]);
  });

  it('emits merged horizontal runs to a Graphics', () => {
    const p = new Painter(4, 1).rect(0, 0, 3, 1, 1);
    p.set(3, 0, 2);
    const rects = [];
    let fill;
    p.toGraphics({ fillStyle: (c) => ((fill = c), { fillRect: (x, y, w, h) => rects.push([fill, x, y, w, h]) }) });
    expect(rects).toEqual([[1, 0, 0, 3, 1], [2, 3, 0, 1, 1]]);
  });
  it('fills polygons by pixel centers', () => {
    const p = new Painter(8, 8);
    p.poly([[0, 0], [4, 0], [4, 4], [0, 4]], 1);
    expect(painted(p)).toBe(16);
    expect(p.get(3, 3)).toBe(1);
    expect(p.get(4, 0)).toBeNull();
    const t = new Painter(9, 9);
    t.poly([[0, 8], [4.5, 0], [9, 8]], 2);
    expect(t.get(4, 1)).toBe(2);
    expect(t.get(0, 1)).toBeNull();
  });
});

describe('shaded', () => {
  it('only returns colors of the palette', () => {
    const pal = { base: 1, dark: 2, light: 3, hl: 4 };
    const m = shaded(pal, 10, 10, 10, 10);
    const seen = new Set();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) seen.add(m(x, y));
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);
  });

});
