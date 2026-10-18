// The rules of Ruspe in fuga, without Phaser (docs/RUSPE-IN-FUGA.md): a grid
// of streets seen from above, self-driving bulldozers coming out of the Muro
// construction site and following whatever sign they find, and the tools of
// the Comitato Caos to send them into the shopping mall. The scene calls
// these; rules.test.js checks them.

export const TILE = 16;
export const COLS = 30;
export const ROWS = 13;
// Where the map sits on screen: under the HUD, above the tool bar.
export const FIELD = { x: 0, y: 28, w: COLS * TILE, h: ROWS * TILE };

// Directions, clockwise: turning right is +1, turning back is +2.
export const UP = 0;
export const RIGHT = 1;
export const DOWN = 2;
export const LEFT = 3;
export const STEP = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
const ARROWS = { '^': UP, '>': RIGHT, v: DOWN, '<': LEFT };
const turn = (dir, n) => (dir + n) % 4;

// Map characters. Roads: '.' street, 'C' the construction site gate (where
// bulldozers come out), 'A' the back entrance of the mall (where they must
// go), '^ > v <' a street with an official navigator sign. Anything else is a
// block the bulldozers can't drive through; sprites.js draws each kind
// ('#' houses, 'M' the mall, 'K' the construction site, 'T' trees...).
export const ROAD = new Set(['.', 'C', 'A', ...Object.keys(ARROWS)]);

// The tools, one Comitato Caos kid each, in tool bar order.
export const TOOLS = ['teresa'];

// Same range as the other games: a won level is worth a few hundred points.
export const POINTS = { perBulldozer: 100, perToolLeft: 30, perSecondLeft: 5 };

const key = (x, y) => `${x},${y}`;

// rows: the level's map, one string per row, all COLS long.
export function parseMap(rows) {
  const at = (x, y) => (x >= 0 && y >= 0 && x < COLS && y < ROWS ? rows[y][x] : '#');
  const isRoad = (x, y) => ROAD.has(at(x, y));
  const gates = [];
  const goals = new Set();
  const signs = new Map();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = at(x, y);
      if (c === 'A') goals.add(key(x, y));
      if (c in ARROWS) signs.set(key(x, y), { dir: ARROWS[c], official: ARROWS[c], mine: false });
      if (c === 'C') {
        // Out of the gate towards its only street.
        const dir = [UP, RIGHT, DOWN, LEFT].find((d) => isRoad(x + STEP[d][0], y + STEP[d][1]));
        gates.push({ x, y, dir });
      }
    }
  }
  return { rows, at, isRoad, gates, goals, signs };
}

// Which way a bulldozer leaves cell (x, y), arriving with heading dir: the
// sign's way if there is one, otherwise straight on. Blocked: right, then
// left, then back.
export function chooseDir(map, signs, x, y, dir) {
  const want = signs.get(key(x, y))?.dir ?? dir;
  for (const n of [0, 1, 3, 2]) {
    const d = turn(want, n);
    if (map.isRoad(x + STEP[d][0], y + STEP[d][1])) return d;
  }
  return dir; // a road cell with no way out: the map is wrong
}

// The ways out of a road cell, clockwise from up.
export const openDirs = (map, x, y) => [UP, RIGHT, DOWN, LEFT].filter((d) => map.isRoad(x + STEP[d][0], y + STEP[d][1]));
// Where a sign can point: any way out but back into the construction site.
export const signDirs = (map, x, y) => openDirs(map, x, y).filter((d) => map.at(x + STEP[d][0], y + STEP[d][1]) !== 'C');

// A fresh round of a level (levels.js).
export function createRound(level) {
  const map = parseMap(level.map);
  return {
    level,
    map,
    signs: new Map([...map.signs].map(([k, s]) => [k, { ...s }])),
    tools: { ...level.tools },
    ruspe: [],
    spawned: 0,
    nextSpawn: level.firstOut ?? 1,
    inside: 0,
    elapsed: 0,
    timeLeft: level.time,
    result: null,
    events: [], // what happened in the last step, for sounds and effects
    nextId: 1,
  };
}

// A tool used on cell (x, y). Returns what happened ({ ok: false } when the
// tool can't go there), and takes one use of the tool when it counts.
export function useTool(round, tool, x, y) {
  const { map, signs, tools } = round;
  if (tool === 'teresa') {
    if (!map.isRoad(x, y) || map.at(x, y) === 'C' || map.at(x, y) === 'A') return { ok: false };
    const ways = signDirs(map, x, y);
    const s = signs.get(key(x, y));
    // Her own sign (or one she has already turned): turning it again is free.
    if (s?.mine) {
      s.dir = ways[(ways.indexOf(s.dir) + 1) % ways.length];
      return { ok: true, what: 'turn', free: true };
    }
    if (!tools.teresa) return { ok: false, empty: true };
    tools.teresa--;
    if (s) {
      s.dir = ways[(ways.indexOf(s.dir) + 1) % ways.length];
      s.mine = true;
      return { ok: true, what: 'swap' };
    }
    signs.set(key(x, y), { dir: ways[0], official: null, mine: true });
    return { ok: true, what: 'sign' };
  }
  return { ok: false };
}

// The round moves on by dt seconds. Bulldozers go cell by cell; each one
// decides where to turn as it reaches the middle of a cell.
export function step(round, dt) {
  round.events = [];
  if (round.result) return round;
  const { level, map, signs } = round;
  round.elapsed += dt;
  round.timeLeft = Math.max(0, round.timeLeft - dt);

  // Out of the gates, taking turns when there are several.
  if (round.spawned < level.count && round.elapsed >= round.nextSpawn) {
    const g = map.gates[round.spawned % map.gates.length];
    round.ruspe.push({ id: round.nextId++, x: g.x, y: g.y, dir: chooseDir(map, signs, g.x, g.y, g.dir), t: 0 });
    round.spawned++;
    round.nextSpawn += level.interval;
    round.events.push({ type: 'out' });
  }

  for (const r of round.ruspe) {
    r.t += level.speed * dt;
    while (r.t >= 1 && !r.in) {
      r.t -= 1;
      r.x += STEP[r.dir][0];
      r.y += STEP[r.dir][1];
      if (map.goals.has(key(r.x, r.y))) {
        r.in = true;
        round.inside++;
        round.events.push({ type: 'in', x: r.x, y: r.y });
      } else {
        const d = chooseDir(map, signs, r.x, r.y, r.dir);
        if (d !== r.dir) round.events.push({ type: 'turn' });
        r.dir = d;
      }
    }
  }
  round.ruspe = round.ruspe.filter((r) => !r.in);

  if (round.inside >= level.need) round.result = 'win';
  else if (round.timeLeft <= 0) round.result = 'time';
  return round;
}

// Where a bulldozer is drawn, in cells (fractions while it drives).
export const position = (r) => ({ x: r.x + STEP[r.dir][0] * r.t, y: r.y + STEP[r.dir][1] * r.t });

export function score({ inside, tools, timeLeft }) {
  const left = Object.values(tools).reduce((a, b) => a + b, 0);
  const s = {
    ruspe: inside * POINTS.perBulldozer,
    tools: left * POINTS.perToolLeft,
    time: Math.floor(timeLeft) * POINTS.perSecondLeft,
  };
  return { ...s, total: s.ruspe + s.tools + s.time };
}

// Plays a level with a list of tool uses ({ at: seconds, tool, x, y }), in
// fixed steps, to the end: for the tests (every level is winnable) and for
// tuning.
export function replay(level, moves, dt = 1 / 60) {
  const round = createRound(level);
  const todo = [...moves].sort((a, b) => a.at - b.at);
  while (!round.result) {
    while (todo.length && todo[0].at <= round.elapsed) {
      const m = todo.shift();
      useTool(round, m.tool, m.x, m.y);
    }
    step(round, dt);
  }
  return round;
}
