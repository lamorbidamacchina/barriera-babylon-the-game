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
      // No street running off the edge of the map.
      for (let x = 0; x < COLS; x++) expect(m.isRoad(x, 0) || m.isRoad(x, ROWS - 1), l.name).toBe(false);
    }
  });

  it('use only tools the game has, and ask for no more bulldozers than come out', () => {
    for (const l of LEVELS) {
      for (const t of Object.keys(l.tools)) expect(TOOLS).toContain(t);
      expect(l.need).toBeLessThanOrEqual(l.count);
    }
  });

  it('are lost with no tools and won with their solution', () => {
    for (const l of LEVELS) {
      expect(replay(l, []).result, l.name).toBe('time');
      const r = replay(l, l.solution);
      expect(r.result, l.name).toBe('win');
      expect(r.timeLeft, l.name).toBeGreaterThan(l.time * 0.2); // with room to spare
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
