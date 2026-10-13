import { describe, it, expect } from 'vitest';
import { LEVELS, DON_REMO } from './levels.js';
import { layout, crossings, score, KNOT_R, FIELD, MARGIN } from './rules.js';
import { YARN } from './sprites.js';
import { loadCodeGs } from '../../../test/gas.js';
import { wrappedLines, RECORD_LINE_CHARS } from '../../../test/wrap.js';

describe('levels', () => {
  it('can be untangled on the table, and start tangled', () => {
    for (const l of LEVELS) {
      const { threads, start, solution } = layout(l);
      expect(crossings(solution, threads, KNOT_R).count, l.name).toBe(0);
      expect(crossings(start, threads, 0).count, l.name).toBeGreaterThanOrEqual(l.minCrossings);
      for (const k of [...start, ...solution]) {
        expect(k.x).toBeGreaterThanOrEqual(FIELD.x + MARGIN - 0.001);
        expect(k.x).toBeLessThanOrEqual(FIELD.x + FIELD.w - MARGIN + 0.001);
        expect(k.y).toBeGreaterThanOrEqual(FIELD.y + MARGIN - 0.001);
        expect(k.y).toBeLessThanOrEqual(FIELD.y + FIELD.h - MARGIN + 0.001);
      }
    }
  });

  it('has a yarn colour for every line', () => {
    for (const l of LEVELS) expect(l.lines).toBeLessThanOrEqual(YARN.length);
  });

  it('gives the drone time to warn before it flies', () => {
    for (const l of LEVELS) {
      expect(l.drone.first).toBeGreaterThanOrEqual(5);
      expect(l.drone.every).toBeGreaterThan(FIELD.w / l.drone.speed + 2); // one pass at a time
    }
  });

  it('has an order and a win line that fit their panels', () => {
    for (const l of LEVELS) {
      expect(l.order.length).toBeLessThanOrEqual(150); // 4 lines of the intro
      expect(l.win.length).toBeLessThanOrEqual(80); // 3 lines of the results panel
    }
    for (const s of DON_REMO.record) expect(wrappedLines(s, RECORD_LINE_CHARS), s).toBeLessThanOrEqual(2);
  });

  it('the best possible score stays under the Barriera records cap', () => {
    const { MAX_SCORE } = loadCodeGs().gs;
    for (const l of LEVELS) {
      const knots = layout(l).solution.length;
      // Solved in no time, with no X and in one move: impossible, so an upper bound.
      expect(score({ knots, timeLeft: l.time, strikes: 0, moves: 0 }).total).toBeLessThanOrEqual(MAX_SCORE.ferri);
    }
  });
});
