import { describe, it, expect } from 'vitest';
import { LEVELS, ROSANNA, BAR } from './levels.js';
import { parseMap, replay, score, openDirs, STEP, COLS, ROWS, TOOLS } from './rules.js';
import { loadCodeGs } from '../../../test/gas.js';
import { wrappedLines, RECORD_LINE_CHARS } from '../../../test/wrap.js';

// Every road cell reachable from (x, y), ignoring signs.
function reachable(map, x, y) {
  const seen = new Set([`${x},${y}`]);
  const todo = [[x, y]];
  while (todo.length) {
    const [cx, cy] = todo.pop();
    for (const d of openDirs(map, cx, cy)) {
      const k = `${cx + STEP[d][0]},${cy + STEP[d][1]}`;
      if (!seen.has(k)) seen.add(k), todo.push([cx + STEP[d][0], cy + STEP[d][1]]);
    }
  }
  return seen;
}

describe('levels', () => {
  it('have full-size maps with a gate and the mall', () => {
    for (const l of LEVELS) {
      expect(l.map, l.name).toHaveLength(ROWS);
      for (const row of l.map) expect(row, l.name).toHaveLength(COLS);
      const m = parseMap(l.map);
      expect(m.gates.length, l.name).toBeGreaterThan(0);
      expect(m.goals.size, l.name).toBeGreaterThan(0);
      for (const g of m.gates) {
        const roads = reachable(m, g.x, g.y);
        expect([...m.goals].some((k) => roads.has(k)), l.name).toBe(true);
      }
      // No street running off the edge of the map (a gate may sit there).
      const street = (x, y) => m.isRoad(x, y) && m.at(x, y) !== 'C';
      for (let x = 0; x < COLS; x++) expect(street(x, 0) || street(x, ROWS - 1), l.name).toBe(false);
      for (let y = 0; y < ROWS; y++) expect(street(0, y) || street(COLS - 1, y), l.name).toBe(false);
    }
  });

  it('use only tools the game has, and ask for no more bulldozers than come out', () => {
    for (const l of LEVELS) {
      for (const t of Object.keys(l.tools)) expect(TOOLS).toContain(t);
      expect(l.need).toBeLessThanOrEqual(l.count);
    }
  });

  it('fly the drone in straight lines over the map', () => {
    for (const l of LEVELS.filter((l) => l.drone)) {
      const { path } = l.drone;
      path.forEach(([x, y], i) => {
        const [nx, ny] = path[(i + 1) % path.length];
        expect(x === nx || y === ny, l.name).toBe(true);
        expect(x >= 0 && x < COLS && y >= 0 && y < ROWS, l.name).toBe(true);
      });
    }
  });

  it('have a tip for the new kid, and Rosanna\'s lines fit their strip', () => {
    const say = 320 / 8; // SAY_W in the scene
    for (const line of [...LEVELS.map((l) => l.tip), ROSANNA.firstReset, ROSANNA.hopeless, ROSANNA.cemented, ...ROSANNA.wake]) expect(wrappedLines(line, say), line).toBeLessThanOrEqual(2);
    for (const line of [...ROSANNA.start, ...ROSANNA.in, ...ROSANNA.drone, ...ROSANNA.empty]) expect(wrappedLines(line, say), line).toBe(1);
  });

  it('are lost with no tools and won with their solution', () => {
    for (const l of LEVELS) {
      expect(replay(l, []).result, l.name).toBe('time');
      // Whichever way the signs start: they're turned until they're right.
      for (let seed = 1; seed <= 12; seed++) {
        const r = replay(l, l.solution, { seed });
        expect(r.result, `${l.name} seed ${seed}`).toBe('win');
        expect(r.timeLeft, l.name).toBeGreaterThan(l.time * 0.2); // with room to spare
      }
    }
  });

  it('have an order and a win line that fit their panels', () => {
    for (const l of LEVELS) {
      expect(l.order.length).toBeLessThanOrEqual(150); // 4 lines of the intro
      expect(l.win.length).toBeLessThanOrEqual(80); // 3 lines of the results panel
    }
    for (const s of ROSANNA.record) expect(wrappedLines(s, RECORD_LINE_CHARS), s).toBeLessThanOrEqual(2);
    for (const b of [...BAR.win, ...BAR.lose]) expect(b.line.length, b.line).toBeLessThanOrEqual(80);
  });

  it('never name real brands', () => {
    const all = JSON.stringify({ LEVELS, ROSANNA, BAR }).toLowerCase();
    for (const brand of ['auchan', 'mcdonald', 'mc donald']) expect(all).not.toContain(brand);
  });

  it('the best possible score stays under the Barriera records cap', () => {
    const { MAX_SCORE } = loadCodeGs().gs;
    for (const l of LEVELS) {
      // Every bulldozer in at once, no tool used: impossible, so an upper bound.
      expect(score({ inside: l.count, tools: l.tools, timeLeft: l.time }).total).toBeLessThanOrEqual(MAX_SCORE.ruspe);
    }
  });
});
