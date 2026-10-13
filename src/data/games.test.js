import { describe, it, expect } from 'vitest';
import { GAMES, isComplete } from './games.js';

const game = (id) => GAMES.find((g) => g.id === id);

describe('games', () => {
  it('knows how many levels each playable game has', () => {
    for (const g of GAMES.filter((g) => g.available)) expect(g.levels, g.id).toBeGreaterThan(0);
  });

  it('is complete once the last level is won', () => {
    const ferri = game('ferri');
    expect(isComplete(ferri, {})).toBe(false);
    expect(isComplete(ferri, { ferri: { unlocked: ferri.levels - 1, best: {} } })).toBe(false);
    expect(isComplete(ferri, { ferri: { unlocked: ferri.levels, best: {} } })).toBe(true);
  });

  it('never ticks a game that is not out yet', () => {
    expect(isComplete(game('ruspe'), { ruspe: { unlocked: 99 } })).toBe(false);
  });
});
