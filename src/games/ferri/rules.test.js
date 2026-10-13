import { describe, it, expect } from 'vitest';
import { makeTangle, scramble, segmentsCross, crossings, beamHits, score, distToSegment, STRIKES } from './rules.js';

const P = (x, y) => ({ x, y });

describe('makeTangle', () => {
  it('has a knot per pair of lines and a thread per stretch between them', () => {
    for (let n = 3; n <= 7; n++) {
      const t = makeTangle(n, 100 + n);
      expect(t.solution).toHaveLength((n * (n - 1)) / 2);
      expect(t.threads).toHaveLength(n * (n - 2));
    }
  });

  it('is untangled at its solution', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const t = makeTangle(4 + (seed % 4), seed);
      expect(crossings(t.solution, t.threads, 0.01).count).toBe(0);
    }
  });

  it('stays solvable with knots dropped', () => {
    const t = makeTangle(7, 9, 3);
    expect(t.solution).toHaveLength(18);
    expect(crossings(t.solution, t.threads, 0.01).count).toBe(0);
    for (const th of t.threads) {
      expect(th.a).toBeLessThan(18);
      expect(th.b).toBeLessThan(18);
    }
  });

  it('fits the unit square with knots far enough apart', () => {
    const { solution } = makeTangle(6, 3);
    for (const k of solution) {
      expect(k.x).toBeGreaterThanOrEqual(0);
      expect(k.x).toBeLessThanOrEqual(1);
      expect(k.y).toBeGreaterThanOrEqual(0);
      expect(k.y).toBeLessThanOrEqual(1);
    }
    for (let i = 0; i < solution.length; i++) {
      for (let j = i + 1; j < solution.length; j++) {
        expect(Math.hypot(solution[i].x - solution[j].x, solution[i].y - solution[j].y)).toBeGreaterThan(0.05);
      }
    }
  });

  it('is the same tangle for the same seed', () => {
    expect(makeTangle(5, 42)).toEqual(makeTangle(5, 42));
    expect(makeTangle(5, 42)).not.toEqual(makeTangle(5, 43));
  });
});

describe('scramble', () => {
  it('starts tangled enough, the same way every time', () => {
    const t = makeTangle(4, 7);
    const pos = scramble(t, 7, 3);
    expect(pos).toHaveLength(t.solution.length);
    expect(crossings(pos, t.threads, 0).count).toBeGreaterThanOrEqual(3);
    expect(scramble(t, 7, 3)).toEqual(pos);
  });
});

describe('segmentsCross', () => {
  it('sees an X', () => expect(segmentsCross(P(0, 0), P(2, 2), P(0, 2), P(2, 0))).toBe(true));
  it('sees a T', () => expect(segmentsCross(P(0, 0), P(2, 0), P(1, 0), P(1, 2))).toBe(true));
  it('ignores parallel segments', () => expect(segmentsCross(P(0, 0), P(2, 0), P(0, 1), P(2, 1))).toBe(false));
  it('ignores segments that would meet further on', () => expect(segmentsCross(P(0, 0), P(1, 1), P(3, 0), P(2, 1))).toBe(false));
  it('sees overlapping collinear segments', () => expect(segmentsCross(P(0, 0), P(2, 0), P(1, 0), P(3, 0))).toBe(true));
});

describe('crossings', () => {
  const square = [P(0, 0), P(10, 0), P(10, 10), P(0, 10)];
  it("doesn't count threads sharing a knot", () => {
    const threads = [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 0 }];
    expect(crossings(square, threads, 1).count).toBe(0);
  });

  it('counts the diagonals of a square, and where they meet', () => {
    const res = crossings(square, [{ a: 0, b: 2 }, { a: 1, b: 3 }], 1);
    expect(res.count).toBe(1);
    expect(res.points[0]).toEqual(P(5, 5));
    expect([...res.bad]).toEqual([0, 1]);
  });

  it('counts a thread running over a knot', () => {
    const knots = [P(0, 0), P(10, 0), P(5, 0.5)];
    expect(crossings(knots, [{ a: 0, b: 1 }], 1).count).toBe(1);
    expect(crossings(knots, [{ a: 0, b: 1 }], 0.4).count).toBe(0);
  });
});

describe('beam and score', () => {
  it('hits inside the band only', () => {
    expect(beamHits(100, 110, 12)).toBe(true);
    expect(beamHits(100, 120, 12)).toBe(false);
  });

  it('measures distance to a segment', () => {
    expect(distToSegment(P(5, 3), P(0, 0), P(10, 0))).toBe(3);
    expect(distToSegment(P(-3, 4), P(0, 0), P(10, 0))).toBe(5);
  });

  it('adds up the bonuses', () => {
    const s = score({ knots: 6, timeLeft: 40.2, strikes: 1, moves: 8 });
    expect(s).toEqual({ knots: 180, time: 205, strikes: 100, moves: 40, total: 525 });
  });

  it('gives no bonus below zero', () => {
    const s = score({ knots: 6, timeLeft: -1, strikes: STRIKES + 1, moves: 99 });
    expect(s.total).toBe(180);
  });
});
