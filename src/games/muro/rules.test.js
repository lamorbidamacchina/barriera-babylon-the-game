import { describe, it, expect } from 'vitest';
import { WALL, FREE, TRAIL, makeGrid, cellAt, isEdge, canEnter, closeTrail, clearTrail, percentDown, cutPoints, endBonus, nearestEdge } from './rules.js';

// Draws a line of TRAIL cells from (x0, y0) to (x1, y1), straight only.
function trail(g, x0, y0, x1, y1) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g.cells[y * g.cols + x] = TRAIL;
  }
}

describe('makeGrid', () => {
  it('starts as Muro with a free frame', () => {
    const g = makeGrid(10, 6);
    expect(cellAt(g, 0, 0)).toBe(FREE);
    expect(cellAt(g, 9, 5)).toBe(FREE);
    expect(cellAt(g, 1, 1)).toBe(WALL);
    expect(g.interior).toBe(8 * 4);
    expect(percentDown(g)).toBe(0);
  });
});

describe('walking', () => {
  const g = makeGrid(10, 6);

  it('walks only on free cells next to the Muro', () => {
    expect(isEdge(g, 0, 0)).toBe(true); // diagonal to (1, 1)
    expect(isEdge(g, 1, 1)).toBe(false); // that's Muro
    const big = makeGrid(10, 10);
    closeTrail(big, []); // everything falls
    expect(isEdge(big, 5, 5)).toBe(false);
  });

  it('can cut into the Muro, never cross its own line', () => {
    const t = makeGrid(10, 6);
    trail(t, 3, 1, 3, 2);
    expect(canEnter(t, 4, 1, true)).toBe(true);
    expect(canEnter(t, 3, 2, true)).toBe(false);
    expect(canEnter(t, -1, 0, false)).toBe(false);
  });
});

describe('closeTrail', () => {
  it('knocks down the side without the drone', () => {
    // 12×8: a vertical cut at x=4 from the top frame to the bottom frame.
    const g = makeGrid(12, 8);
    trail(g, 4, 1, 4, 6);
    const n = closeTrail(g, [[8, 3]]);
    expect(n).toBe(6 + 3 * 6); // the line + the 3 columns on the left
    expect(cellAt(g, 2, 3)).toBe(FREE);
    expect(cellAt(g, 8, 3)).toBe(WALL);
    expect(percentDown(g)).toBeCloseTo((100 * 24) / 60);
  });

  it('keeps every region that holds a drone', () => {
    const g = makeGrid(12, 8);
    trail(g, 4, 1, 4, 6);
    expect(closeTrail(g, [[8, 3], [2, 3]])).toBe(6);
    expect(cellAt(g, 2, 3)).toBe(WALL);
  });

  it('a drone on free ground protects nothing', () => {
    const g = makeGrid(6, 6);
    trail(g, 2, 1, 2, 4);
    closeTrail(g, [[0, 0]]);
    expect(percentDown(g)).toBe(100);
  });
});

describe('nearestEdge', () => {
  it('walks the player back to what is left of the Muro', () => {
    const g = makeGrid(12, 8);
    trail(g, 4, 1, 4, 6);
    closeTrail(g, [[8, 3]]);
    expect(isEdge(g, 1, 3)).toBe(false);
    expect(nearestEdge(g, 1, 3)).toEqual({ x: 4, y: 3 });
    expect(nearestEdge(g, 4, 3)).toEqual({ x: 4, y: 3 });
  });
});

describe('clearTrail', () => {
  it('turns the line back into Muro', () => {
    const g = makeGrid(8, 8);
    trail(g, 2, 1, 2, 4);
    clearTrail(g);
    expect(cellAt(g, 2, 3)).toBe(WALL);
  });
});

describe('scoring', () => {
  it('pays big cuts more', () => {
    expect(cutPoints(50, 1000)).toBe(50);
    expect(cutPoints(100, 1000)).toBe(200);
    expect(cutPoints(250, 1000)).toBe(750);
    expect(cutPoints(900, 1000)).toBe(3600); // capped at x4
  });

  it('end bonus only for a win', () => {
    expect(endBonus(true, 83.7, 75, 12.2, 2)).toEqual({ muro: 800, time: 130, lives: 1000 });
    expect(endBonus(false, 90, 75, 30, 3)).toEqual({ muro: 0, time: 0, lives: 0 });
  });
});
