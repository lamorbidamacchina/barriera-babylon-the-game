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
      expect(l.drones.length).toBeGreaterThanOrEqual(2);
      expect(l.patrols.length).toBeGreaterThan(0);
      for (const p of l.patrols) expect(p.speed).toBeLessThan(20); // the player must be able to outrun them
      if (i) expect(l.drones.length).toBeGreaterThan(LEVELS[i - 1].drones.length);
    });
  });

  it('has an order and a win line that fit their panels', () => {
    for (const l of LEVELS) {
      expect(l.order.length).toBeLessThanOrEqual(150); // 4 lines of the intro
      expect(l.win.length).toBeLessThanOrEqual(80); // 3 lines of the results panel
    }
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
