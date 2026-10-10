import { describe, it, expect } from 'vitest';
import { LEVELS } from './levels.js';
import { POINTS } from './rules.js';
import { VIEWS } from './views.js';
import { loadCodeGs } from '../../../test/gas.js';

describe('levels', () => {
  it('has a known picture for every level', () => {
    for (const l of LEVELS) expect(Object.keys(VIEWS)).toContain(l.view);
  });

  it('targets get harder and stay reachable', () => {
    LEVELS.forEach((l, i) => {
      expect(l.target).toBeGreaterThanOrEqual(50);
      expect(l.target).toBeLessThanOrEqual(90);
      if (i) expect(l.target).toBeGreaterThanOrEqual(LEVELS[i - 1].target);
      expect(l.drones.length).toBeGreaterThan(0);
    });
  });

  it('the best possible score stays under the Barriera records cap', () => {
    const { MAX_SCORE } = loadCodeGs().gs;
    for (const l of LEVELS) {
      // Every cell in one x4 cut (impossible) plus every bonus at its maximum.
      const best = 120 * 60 * POINTS.perCell * (1 + POINTS.maxChunkBonus) + (100 - l.target) * POINTS.perPercentOver + l.time * POINTS.perSecondLeft + 3 * POINTS.perLife;
      expect(best).toBeLessThanOrEqual(MAX_SCORE.muro);
    }
  });
});
