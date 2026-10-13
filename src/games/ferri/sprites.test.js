import { describe, it, expect } from 'vitest';
import { Painter } from '../../painter.js';
import { drawKnot, drawNeedles, drawScarf, drawTable, scarfEnd, KNOT_SIZE, NEEDLES_W, NEEDLES_H, SCARF_H, STRIPE_H, YARN } from './sprites.js';

const painted = (p) => p.px.filter((c) => c !== null).length;
const rowPainted = (p, y) => Array.from({ length: p.w }, (_, x) => p.get(x, y)).some((c) => c !== null);

describe('sprites', () => {
  it('draws the knot and the needles', () => {
    const knot = new Painter(KNOT_SIZE, KNOT_SIZE);
    drawKnot(knot, KNOT_SIZE);
    expect(painted(knot)).toBeGreaterThan(KNOT_SIZE * KNOT_SIZE * 0.6);
    const needles = new Painter(NEEDLES_W, NEEDLES_H);
    drawNeedles(needles);
    expect(painted(needles)).toBeGreaterThan(40);
  });

  it('covers the whole table', () => {
    const p = new Painter(396, 232);
    drawTable(p, 396, 232);
    expect(painted(p)).toBe(396 * 232);
  });

  it('has room for five stripes on the scarf', () => {
    expect(scarfEnd(5) + 12).toBeLessThanOrEqual(SCARF_H); // + the needles under it
  });

  it('knits the scarf down to where the needles go', () => {
    const stripes = [0, 1].map((i) => ({ pattern: 'bands', colors: YARN.slice(i, i + 4) }));
    const p = new Painter(52, SCARF_H);
    drawScarf(p, 52, stripes);
    expect(rowPainted(p, scarfEnd(2) - 1)).toBe(true);
    expect(rowPainted(p, scarfEnd(2) + 1)).toBe(false);
    // Each stripe uses its yarns.
    const mid = scarfEnd(1) + Math.floor(STRIPE_H / 2);
    expect(rowPainted(p, mid)).toBe(true);
  });
});
