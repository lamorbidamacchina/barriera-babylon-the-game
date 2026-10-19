import { describe, it, expect } from 'vitest';
import { parseMap, chooseDir, createRound, useTool, step, replay, score, openDirs, droneCell, patrolCells, cloneRound, forecast, canStillAct, MARBLES_TIME, FOAM_TIME, UP, RIGHT, DOWN, LEFT, COLS } from './rules.js';

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

  it('does what the arrow says, even turning round', () => {
    // Heading left onto a sign pointing right: back to the right.
    expect(chooseDir(m, new Map([['3,1', { dir: RIGHT }]]), 3, 1, LEFT)).toBe(RIGHT);
  });

  it('skids on marbles and goes back, whatever the sign says', () => {
    const marbles = new Map([['3,1', 5]]);
    expect(chooseDir(m, new Map([['3,1', { dir: DOWN }]]), 3, 1, RIGHT, marbles)).toBe(LEFT);
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
    expect(r.signs.get('3,1').dir).toBe(DOWN); // down the side street
    expect(useTool(r, 'teresa', 3, 1)).toMatchObject({ ok: true, free: true });
    expect(r.signs.get('3,1').dir).toBe(LEFT);
    useTool(r, 'teresa', 3, 1);
    useTool(r, 'teresa', 3, 1);
    expect(r.signs.get('3,1').dir).toBe(DOWN); // round the clock
    expect(r.tools.teresa).toBe(1);
  });

  it('turns an official sign for one use', () => {
    const r = createRound(level({ map: pad(['#####', '#C>A#', '##.##', '##.##', ...Array(9).fill('#')]) }));
    expect(useTool(r, 'teresa', 2, 1)).toMatchObject({ ok: true, what: 'swap' });
    expect(r.signs.get('2,1')).toMatchObject({ dir: DOWN, official: RIGHT, mine: true });
    expect(r.tools.teresa).toBe(1);
  });

  it('starts a sign on a straight street pointing the first way clockwise from up', () => {
    const r = createRound(level());
    useTool(r, 'teresa', 2, 3); // left and right only
    expect(r.signs.get('2,3').dir).toBe(RIGHT);
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
    const r = replay(level(), [{ at: 0, tool: 'teresa', x: 3, y: 1 }]);
    expect(r.inside).toBe(0);
  });
});

describe('Chiara', () => {
  it('puts marbles on a street for a while, one use each', () => {
    const r = createRound(level({ tools: { chiara: 1 } }));
    expect(useTool(r, 'chiara', 1, 1).ok).toBe(false); // the gate
    expect(useTool(r, 'chiara', 3, 1)).toMatchObject({ ok: true, what: 'marbles' });
    expect(useTool(r, 'chiara', 3, 3)).toMatchObject({ ok: false, empty: true });
    expect(r.tools.chiara).toBe(0);
    run(r, MARBLES_TIME - 0.5);
    expect(r.marbles.has('3,1')).toBe(true);
    run(r, 1);
    expect(r.marbles.has('3,1')).toBe(false);
  });

  it('sends the bulldozers back where they came from', () => {
    // Marbles before the mall: they bounce back and loop below instead.
    const r = createRound(level({ tools: { chiara: 1 }, time: 3 }));
    useTool(r, 'chiara', 4, 1);
    run(r, 2);
    expect(r.inside).toBe(0);
  });
});

describe('Gigi', () => {
  it('puts foam on a street for a while, one use each', () => {
    const r = createRound(level({ tools: { gigi: 1 }, count: 0 }));
    expect(useTool(r, 'gigi', 5, 1).ok).toBe(false); // the mall
    expect(useTool(r, 'gigi', 3, 1)).toMatchObject({ ok: true, what: 'foam' });
    expect(useTool(r, 'gigi', 3, 1).ok).toBe(false); // already foamed
    expect(r.tools.gigi).toBe(0);
    run(r, FOAM_TIME + 0.5);
    expect(r.foam.has('3,1')).toBe(false);
  });

  it('sets the sign in cement: the drone can\'t put it back while it lasts', () => {
    const MAP = pad(['#######', '#C...A#', '#######', ...Array(10).fill('#')]);
    const r = createRound(level({ map: MAP, count: 0, tools: { teresa: 1, gigi: 1 }, drone: { path: [[1, 1], [5, 1]], speed: 4 } }));
    useTool(r, 'teresa', 3, 1);
    useTool(r, 'gigi', 3, 1);
    const events = [];
    for (let i = 0; i < 60 * 3; i++) events.push(...step(r, 1 / 60).events.map((e) => e.type));
    expect(r.signs.get('3,1').mine).toBe(true);
    expect(events).toContain('cemented');
    expect(events).not.toContain('reset');
    run(r, FOAM_TIME); // dry: the next pass takes it
    expect(r.signs.has('3,1')).toBe(false);
  });

  it('doesn\'t stop the bulldozers', () => {
    const fast = createRound(level({ count: 1 }));
    const foamed = createRound(level({ count: 1, tools: { gigi: 1 } }));
    useTool(foamed, 'gigi', 3, 1);
    run(fast, 0.6);
    run(foamed, 0.6);
    expect(foamed.ruspe[0]).toEqual(fast.ruspe[0]);
  });
});

describe('the guide drone', () => {
  // A street with an official sign at (3,1) pointing down.
  const MAP = pad(['#######', '#C.v.A#', '###.###', '###.###', ...Array(9).fill('#')]);
  const drone = (o = {}) => createRound(level({ map: MAP, drone: { path: [[1, 1], [5, 1]], speed: 2 }, ...o }));

  it('flies its patrol there and back', () => {
    const r = drone({ count: 0 });
    run(r, 1);
    expect(droneCell(r.drone)).toEqual({ x: 3, y: 1 });
    run(r, 1);
    expect(droneCell(r.drone)).toEqual({ x: 5, y: 1 });
    run(r, 2);
    expect(droneCell(r.drone)).toEqual({ x: 1, y: 1 });
  });

  it('naps on its perch, warns, flies one lap and lands again', () => {
    const r = createRound(level({ map: MAP, count: 0, drone: { path: [[1, 1], [5, 1]], speed: 4, first: 5, rest: 4 } }));
    const events = [];
    const go = (sec) => {
      for (let i = 0; i < sec * 60; i++) events.push(...step(r, 1 / 60).events.map((e) => e.type));
    };
    go(1.9);
    expect(r.drone.phase).toBe('rest');
    go(0.2); // 2 s: WARN before taking off at 5
    expect(r.drone.phase).toBe('warn');
    expect(droneCell(r.drone)).toEqual({ x: 1, y: 1 });
    go(3.1);
    expect(r.drone.phase).toBe('fly');
    go(2); // 8 cells there and back at 4 a second
    expect(r.drone.phase).toBe('rest');
    expect(droneCell(r.drone)).toEqual({ x: 1, y: 1 });
    expect(events).toEqual(['wake', 'takeoff', 'land']);
    go(4.1);
    expect(r.drone.phase).toBe('warn');
  });

  it('leaves the signs alone while it sleeps', () => {
    const r = createRound(level({ map: MAP, count: 0, tools: { teresa: 1 }, drone: { path: [[1, 1], [5, 1]], speed: 4, first: 10, rest: 10 } }));
    useTool(r, 'teresa', 3, 1);
    run(r, 5);
    expect(r.signs.get('3,1').mine).toBe(true);
    run(r, 7);
    expect(r.signs.get('3,1').mine).toBe(false);
  });

  it('puts turned official signs back and takes Teresa\'s away', () => {
    const r = drone({ count: 0, map: pad(['#######', '#C.v..#', '###.###', '###.###', ...Array(9).fill('#')]), tools: { teresa: 2 } });
    r.drone.x = 5; // start on the right, flying left
    r.drone.next = 0;
    useTool(r, 'teresa', 3, 1); // official: down → turned
    useTool(r, 'teresa', 4, 1); // a new one
    expect(r.signs.get('3,1').mine).toBe(true);
    run(r, 1.2);
    expect(r.signs.has('4,1')).toBe(false);
    expect(r.signs.get('3,1')).toMatchObject({ dir: DOWN, mine: false });
    const resets = [];
    const q = drone({ count: 0, tools: { teresa: 1 } });
    q.drone.x = 5;
    q.drone.next = 0;
    useTool(q, 'teresa', 3, 1);
    for (let i = 0; i < 120; i++) resets.push(...step(q, 1 / 60).events.filter((e) => e.type === 'reset'));
    expect(resets).toEqual([{ type: 'reset', x: 3, y: 1 }]);
  });
});

describe('forecast', () => {
  it('tells how an untouched round ends, without playing the real one', () => {
    const r = createRound(level());
    expect(forecast(r)).toBe('win');
    expect(r.elapsed).toBe(0);
    useTool(r, 'teresa', 3, 1); // down, away from the mall
    expect(forecast(r)).toBe('time');
    expect(r.signs.get('3,1').dir).toBe(DOWN);
  });

  it('copies everything that changes during a round', () => {
    const r = createRound(level({ need: 99, speed: 1, drone: { path: [[1, 1], [4, 1]], speed: 1 } }));
    run(r, 1);
    const c = cloneRound(r);
    step(c, 0.5);
    expect(r.ruspe[0].t).not.toBe(c.ruspe[0].t);
    expect(r.drone.x).not.toBe(c.drone.x);
  });
});

describe('canStillAct', () => {
  it('counts foam only while one of Teresa\'s signs is there to protect', () => {
    const r = createRound(level({ tools: { teresa: 1, gigi: 1 } }));
    expect(canStillAct(r)).toBe(true);
    useTool(r, 'teresa', 3, 1);
    expect(canStillAct(r)).toBe(true); // foam for the sign
    r.signs.delete('3,1'); // the drone took it
    expect(canStillAct(r)).toBe(false);
  });
});

describe('patrolCells', () => {
  it('lists every cell on the way, there and back', () => {
    expect(patrolCells([[1, 1], [3, 1]]).sort()).toEqual([[1, 1], [2, 1], [3, 1]]);
    expect(patrolCells([[0, 0], [0, 1], [1, 1], [1, 0]])).toHaveLength(4);
  });
});

describe('score', () => {
  it('counts bulldozers in, tools left and whole seconds left', () => {
    expect(score({ inside: 6, tools: { teresa: 1 }, timeLeft: 60.7 })).toEqual({ ruspe: 600, tools: 30, time: 300, total: 930 });
  });
});
