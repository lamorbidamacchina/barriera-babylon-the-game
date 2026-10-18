import { describe, it, expect } from 'vitest';
import { parseMap, chooseDir, createRound, useTool, step, replay, score, openDirs, UP, RIGHT, DOWN, LEFT, COLS } from './rules.js';

// A small test town, padded to the full width with blocks.
const pad = (rows) => rows.map((r) => r.padEnd(COLS, '#'));
const TOWN = pad([
  '#######',
  '#C...A#',
  '#.#.###',
  '#.....#',
  '#######',
  '#', '#', '#', '#', '#', '#', '#', '#',
]);
const level = (o = {}) => ({ map: TOWN, count: 3, need: 2, interval: 1, firstOut: 0, speed: 4, time: 30, tools: { teresa: 2 }, ...o });
const run = (round, seconds) => {
  for (let i = 0; i < seconds * 60; i++) step(round, 1 / 60);
  return round;
};

describe('the map', () => {
  it('finds the gates, the goals and the official signs', () => {
    const m = parseMap(pad(['#####', '#C>A#', ...Array(11).fill('#')]));
    expect(m.gates).toEqual([{ x: 1, y: 1, dir: RIGHT }]);
    expect(m.goals.has('3,1')).toBe(true);
    expect(m.signs.get('2,1')).toMatchObject({ dir: RIGHT, mine: false });
    expect(m.isRoad(-1, 0)).toBe(false); // outside the map is a wall
  });
});

describe('driving', () => {
  const m = parseMap(TOWN);
  const none = new Map();

  it('goes straight when it can', () => {
    expect(chooseDir(m, none, 2, 1, RIGHT)).toBe(RIGHT);
    expect(chooseDir(m, none, 1, 2, DOWN)).toBe(DOWN);
  });

  it('turns right when blocked, then left, then back', () => {
    expect(chooseDir(m, none, 1, 3, DOWN)).toBe(RIGHT); // right of down is left: walled, so left
    expect(chooseDir(m, none, 5, 3, RIGHT)).toBe(LEFT); // a dead end: back
    expect(chooseDir(m, none, 3, 1, UP)).toBe(RIGHT); // right first
  });

  it('obeys a sign, unless it points into a wall', () => {
    expect(chooseDir(m, new Map([['3,1', { dir: DOWN }]]), 3, 1, RIGHT)).toBe(DOWN);
    expect(chooseDir(m, new Map([['2,1', { dir: UP }]]), 2, 1, RIGHT)).toBe(RIGHT); // right of up
  });

  it('lists the ways out of a cell clockwise from up', () => {
    expect(openDirs(m, 3, 1)).toEqual([RIGHT, DOWN, LEFT]);
    expect(openDirs(m, 3, 3)).toEqual([UP, RIGHT, LEFT]);
  });
});

describe('a round', () => {
  it('lets the bulldozers out one at a time, count in all', () => {
    const r = createRound(level({ map: pad(['####', '#C.#', '#..#', '####', ...Array(9).fill('#')]), interval: 1, count: 3, time: 99 }));
    run(r, 1.5);
    expect(r.spawned).toBe(2);
    run(r, 10);
    expect(r.spawned).toBe(3);
    expect(r.ruspe).toHaveLength(3); // a closed loop: they drive around for ever
  });

  it('counts a bulldozer reaching the mall, and wins at need', () => {
    const r = createRound(level());
    run(r, 3);
    expect(r.inside).toBeGreaterThanOrEqual(2);
    expect(r.result).toBe('win');
  });

  it('loses when time runs out short of need', () => {
    const r = replay(level({ need: 4, count: 3 }), []);
    expect(r.result).toBe('time');
    expect(r.timeLeft).toBe(0);
  });

  it('stops moving once the round is over', () => {
    const r = replay(level(), []);
    const before = r.elapsed;
    step(r, 1);
    expect(r.elapsed).toBe(before);
  });
});

describe('Teresa', () => {
  it('puts a sign on a street, and turning her own sign is free', () => {
    const r = createRound(level());
    expect(useTool(r, 'teresa', 3, 1)).toMatchObject({ ok: true, what: 'sign' });
    expect(r.tools.teresa).toBe(1);
    expect(r.signs.get('3,1').dir).toBe(RIGHT); // the first way out clockwise from up
    expect(useTool(r, 'teresa', 3, 1)).toMatchObject({ ok: true, free: true });
    expect(r.signs.get('3,1').dir).toBe(DOWN);
    useTool(r, 'teresa', 3, 1);
    useTool(r, 'teresa', 3, 1);
    expect(r.signs.get('3,1').dir).toBe(RIGHT); // round the clock
    expect(r.tools.teresa).toBe(1);
  });

  it('turns an official sign for one use', () => {
    const r = createRound(level({ map: pad(['#####', '#C>A#', '##.##', '##.##', ...Array(9).fill('#')]) }));
    expect(useTool(r, 'teresa', 2, 1)).toMatchObject({ ok: true, what: 'swap' });
    expect(r.signs.get('2,1')).toMatchObject({ dir: DOWN, official: RIGHT, mine: true });
    expect(r.tools.teresa).toBe(1);
  });

  it('never points a sign back into the construction site', () => {
    const r = createRound(level());
    useTool(r, 'teresa', 1, 2); // under the gate: up is the site
    expect(r.signs.get('1,2').dir).toBe(DOWN);
    useTool(r, 'teresa', 1, 2);
    expect(r.signs.get('1,2').dir).toBe(DOWN); // the only other way
  });

  it('only works on streets, and not with no uses left', () => {
    const r = createRound(level({ tools: { teresa: 1 } }));
    expect(useTool(r, 'teresa', 0, 0).ok).toBe(false); // a block
    expect(useTool(r, 'teresa', 1, 1).ok).toBe(false); // the gate
    expect(useTool(r, 'teresa', 5, 1).ok).toBe(false); // the mall
    expect(useTool(r, 'teresa', 2, 1).ok).toBe(true);
    expect(useTool(r, 'teresa', 3, 3)).toMatchObject({ ok: false, empty: true });
  });

  it('sends the bulldozers where the sign points', () => {
    // Down at the first crossing: they loop below and never reach the mall.
    const r = replay(level(), [{ at: 0, tool: 'teresa', x: 3, y: 1 }, { at: 0, tool: 'teresa', x: 3, y: 1 }]);
    expect(r.inside).toBe(0);
  });
});

describe('score', () => {
  it('counts bulldozers in, tools left and whole seconds left', () => {
    expect(score({ inside: 6, tools: { teresa: 1 }, timeLeft: 60.7 })).toEqual({ ruspe: 600, tools: 30, time: 300, total: 930 });
  });
});
