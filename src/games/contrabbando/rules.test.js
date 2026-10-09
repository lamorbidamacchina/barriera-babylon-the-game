import { describe, it, expect } from 'vitest';
import { sliceScore, addPoints, comboBonus, timeBonus, isComplete, pickVeggieType } from './rules.js';
import { VEGGIES } from './textures.js';

// A repeatable random sequence (mulberry32), so the counts below are stable.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('sliceScore', () => {
  const remaining = { zucchina: 2, pomodoro: 0 };

  it('+15 for a veggie the recipe still needs', () => {
    expect(sliceScore('zucchina', remaining)).toEqual({ points: 15, strike: false, needed: true });
  });

  it('+5 for a recipe veggie already complete', () => {
    expect(sliceScore('pomodoro', remaining)).toEqual({ points: 5, strike: false, needed: false });
  });

  it('-10 and an X for a veggie not in the recipe', () => {
    expect(sliceScore('melanzana', remaining)).toEqual({ points: -10, strike: true, needed: false });
  });

  it('does not change the recipe', () => {
    sliceScore('zucchina', remaining);
    expect(remaining).toEqual({ zucchina: 2, pomodoro: 0 });
  });
});

describe('addPoints', () => {
  it('never goes below zero', () => {
    expect(addPoints(5, -10)).toBe(0);
    expect(addPoints(25, -10)).toBe(15);
    expect(addPoints(0, 15)).toBe(15);
  });
});

describe('comboBonus', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 30],
    [7, 70],
  ])('%i cuts → +%i', (combo, bonus) => {
    expect(comboBonus(combo)).toBe(bonus);
  });
});

describe('timeBonus', () => {
  it('5 points per second left, rounded up, on a win', () => {
    expect(timeBonus(true, 12)).toBe(60);
    expect(timeBonus(true, 12.1)).toBe(65);
    expect(timeBonus(true, 0)).toBe(0);
    expect(timeBonus(true, -0.3)).toBe(0); // the last frame can overshoot
  });

  it('nothing when the dish is lost', () => {
    expect(timeBonus(false, 30)).toBe(0);
  });
});

describe('isComplete', () => {
  it('only when every ingredient is done', () => {
    expect(isComplete({ zucchina: 0, pomodoro: 0 })).toBe(true);
    expect(isComplete({ zucchina: 0, pomodoro: 1 })).toBe(false);
    expect(isComplete({})).toBe(true);
  });
});

describe('pickVeggieType', () => {
  const draw = (n, ...args) => {
    const rng = seeded(42);
    const counts = {};
    for (let i = 0; i < n; i++) {
      const t = pickVeggieType(...args, rng);
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  };

  it('never throws an ingredient that is already complete', () => {
    const counts = draw(2000, { zucchina: 3, pomodoro: 0 }, 0.3, false);
    expect(counts.pomodoro).toBeUndefined();
    expect(counts.zucchina).toBeGreaterThan(0);
  });

  it('throws decoys at about the recipe rate', () => {
    const counts = draw(4000, { zucchina: 3, pomodoro: 3 }, 0.3, false);
    const decoys = 4000 - (counts.zucchina ?? 0) - (counts.pomodoro ?? 0);
    expect(decoys / 4000).toBeGreaterThan(0.25);
    expect(decoys / 4000).toBeLessThan(0.35);
  });

  it('throws no decoys during the attivatore burst', () => {
    const counts = draw(2000, { zucchina: 3, pomodoro: 3 }, 0.9, true);
    expect(Object.keys(counts).sort()).toEqual(['pomodoro', 'zucchina']);
  });

  it('throws only decoys once the recipe is complete', () => {
    const counts = draw(500, { zucchina: 0 }, 0.3, false);
    expect(counts.zucchina).toBeUndefined();
  });

  it('throws needed veggies when the recipe uses every veggie', () => {
    const all = Object.fromEntries(Object.keys(VEGGIES).map((k) => [k, 1]));
    const counts = draw(500, all, 0.9, false);
    expect(Object.keys(counts).every((k) => k in VEGGIES)).toBe(true);
  });

  it('always returns a real veggie', () => {
    const counts = draw(2000, { zucchina: 3, cavolo: 1 }, 0.5, false);
    for (const k of Object.keys(counts)) expect(VEGGIES).toHaveProperty(k);
  });
});
