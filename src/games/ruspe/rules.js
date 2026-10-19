// The rules of Ruspe in fuga, without Phaser (docs/RUSPE-IN-FUGA.md): a grid
// of streets seen from above, self-driving bulldozers coming out of the Muro
// construction site and following whatever sign they find, and the tools of
// the Comitato Caos to send them into the shopping mall. The scene calls
// these; rules.test.js checks them.

// Cells of 32 px: about 44 points on an iPhone in landscape, the size of a
// fingertip (with 16 px cells the game was unplayable on a phone).
export const TILE = 32;
export const COLS = 15;
export const ROWS = 7;
// Where the map sits on screen: under the 22 px HUD, above the 24 px tool bar.
export const FIELD = { x: 0, y: 22, w: COLS * TILE, h: ROWS * TILE };

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
export const TOOLS = ['teresa', 'chiara', 'gigi'];
// How long Chiara's marbles stay on the street, in seconds.
export const MARBLES_TIME = 10;
// Gigi's foam sets the sign on its cell in cement for FOAM_TIME seconds:
// the guide drone can't put it back. Bulldozers drive over it as usual.
// (It first slowed the bulldozers, then held them: either way a sign put
// back right after the drone made it useless.)
export const FOAM_TIME = 12;

// The rules always move in steps of this many seconds, whatever the frame
// rate: the outcome depends on the step (a sign placed a fraction of a
// second apart can catch one bulldozer more or less), so the game, the
// forecast and the tests must all use the same one.
export const SIM_DT = 1 / 60;

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

// Which way a bulldozer leaves cell (x, y), arriving with heading dir. On
// Chiara's marbles it skids and goes back. Otherwise the way the sign
// points, whatever it is, even back where it came from: the arrow never lies
// (an exception for U-turns made turning signs look broken on iPad). No
// sign: straight on. Blocked: right, then left, then back.
export function chooseDir(map, signs, x, y, dir, marbles) {
  const want = marbles?.has(key(x, y)) ? turn(dir, 2) : (signs.get(key(x, y))?.dir ?? dir);
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
    marbles: new Map(), // cell key → seconds left
    foam: new Map(), // cell key → seconds left
    drone: level.drone ? newDrone(level.drone) : null,
    events: [], // what happened in the last step, for sounds and effects
    nextId: 1,
  };
}

// The guide drone at the start of its patrol. A drone with a nap (rest)
// sleeps on path[0], its perch, until first, warns for WARN seconds, flies
// one lap of its path back to the perch and sleeps again for rest seconds.
// Without one it flies all the time.
export const WARN = 3;
function newDrone(cfg) {
  const naps = cfg.rest !== undefined;
  return { x: cfg.path[0][0], y: cfg.path[0][1], next: 1, frozen: 0, phase: naps ? 'rest' : 'fly', wait: naps ? cfg.first - WARN : 0 };
}

// The cell the guide drone is over.
export const droneCell = (d) => ({ x: Math.round(d.x), y: Math.round(d.y) });

// Every cell the drone flies over on its patrol: no sign there lasts.
export function patrolCells(path) {
  const cells = new Set();
  path.forEach(([x, y], i) => {
    const [nx, ny] = path[(i + 1) % path.length];
    for (let k = 0; k <= Math.abs(nx - x) + Math.abs(ny - y); k++) cells.add(key(x + Math.sign(nx - x) * k, y + Math.sign(ny - y) * k));
  });
  return [...cells].map((k) => k.split(',').map(Number));
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
    // A new sign points down the side street of a T-junction, the turn
    // most often wanted; elsewhere, the first way clockwise from up.
    const branch = ways.find((d) => !ways.includes(turn(d, 2)));
    signs.set(key(x, y), { dir: branch ?? ways[0], official: null, mine: true });
    return { ok: true, what: 'sign' };
  }
  // Marbles and foam: a street cell, one of each per cell at a time.
  const spread = { chiara: ['marbles', MARBLES_TIME], gigi: ['foam', FOAM_TIME] }[tool];
  if (spread) {
    const [what, time] = spread;
    if (!map.isRoad(x, y) || map.at(x, y) === 'C' || map.at(x, y) === 'A' || round[what].has(key(x, y))) return { ok: false };
    if (!tools[tool]) return { ok: false, empty: true };
    tools[tool]--;
    round[what].set(key(x, y), time);
    return { ok: true, what };
  }
  return { ok: false };
}

// The round moves on by dt seconds. Bulldozers go cell by cell; each one
// decides where to turn as it reaches the middle of a cell.
export function step(round, dt) {
  round.events = [];
  if (round.result) return round;
  const { level, map, signs, marbles, foam } = round;
  round.elapsed += dt;
  round.timeLeft = Math.max(0, round.timeLeft - dt);

  for (const cells of [marbles, foam]) {
    for (const [k, left] of cells) {
      if (left <= dt) cells.delete(k);
      else cells.set(k, left - dt);
    }
  }
  if (round.drone) moveDrone(round, dt);

  // Out of the gates, taking turns when there are several.
  if (round.spawned < level.count && round.elapsed >= round.nextSpawn) {
    const g = map.gates[round.spawned % map.gates.length];
    round.ruspe.push({ id: round.nextId++, x: g.x, y: g.y, dir: chooseDir(map, signs, g.x, g.y, g.dir, marbles), t: 0 });
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
        const d = chooseDir(map, signs, r.x, r.y, r.dir, marbles);
        if (marbles.has(key(r.x, r.y))) round.events.push({ type: 'skid', x: r.x, y: r.y });
        else if (d !== r.dir) round.events.push({ type: 'turn' });
        r.dir = d;
      }
    }
  }
  round.ruspe = round.ruspe.filter((r) => !r.in);

  if (round.inside >= level.need) round.result = 'win';
  else if (round.timeLeft <= 0) round.result = 'time';
  return round;
}

// The guide drone flies its patrol (a loop of cells, in straight lines) and
// puts every sign it flies over back as the official route wants it:
// Teresa's own signs go, turned official ones turn back.
function moveDrone(round, dt) {
  const d = round.drone;
  const { path, speed } = round.level.drone;
  if (d.frozen > 0) {
    d.frozen = Math.max(0, d.frozen - dt);
    return;
  }
  // Napping, then waking up.
  if (d.phase === 'rest' || d.phase === 'warn') {
    d.wait -= dt;
    if (d.wait > 0) return;
    if (d.phase === 'rest') {
      d.phase = 'warn';
      d.wait += WARN;
      round.events.push({ type: 'wake' });
      return;
    }
    d.phase = 'fly';
    round.events.push({ type: 'takeoff' });
  }
  const before = droneCell(d);
  let go = speed * dt;
  while (go > 0) {
    const [tx, ty] = path[d.next];
    const dist = Math.abs(tx - d.x) + Math.abs(ty - d.y);
    if (dist <= go) {
      d.x = tx;
      d.y = ty;
      go -= dist;
      d.next = (d.next + 1) % path.length;
      // Back on the perch after a lap: a drone that naps lands.
      if (d.next === 1 && round.level.drone.rest !== undefined) {
        d.phase = 'rest';
        d.wait = round.level.drone.rest;
        round.events.push({ type: 'land' });
        break;
      }
    } else {
      d.x += Math.sign(tx - d.x) * Math.min(go, Math.abs(tx - d.x));
      d.y += Math.sign(ty - d.y) * Math.min(go, Math.abs(ty - d.y));
      go = 0;
    }
  }
  const c = droneCell(d);
  if (c.x === before.x && c.y === before.y) return;
  const s = round.signs.get(key(c.x, c.y));
  if (!s?.mine) return;
  if (round.foam.has(key(c.x, c.y))) {
    round.events.push({ type: 'cemented', x: c.x, y: c.y });
    return;
  }
  if (s.official === null) round.signs.delete(key(c.x, c.y));
  else Object.assign(s, { dir: s.official, mine: false });
  round.events.push({ type: 'reset', x: c.x, y: c.y });
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

// Whether anything left in hand can still change where the bulldozers go.
// Signs and marbles always can; foam only protects a sign, so it counts
// while one of Teresa's signs is on the map.
export function canStillAct(round) {
  const { teresa = 0, chiara = 0, gigi = 0 } = round.tools;
  const mineOnMap = [...round.signs.values()].some((s) => s.mine);
  return teresa > 0 || chiara > 0 || (gigi > 0 && mineOnMap);
}

// A copy of a round that can be played on without touching the real one.
export function cloneRound(round) {
  return {
    ...round,
    signs: new Map([...round.signs].map(([k, s]) => [k, { ...s }])),
    tools: { ...round.tools },
    ruspe: round.ruspe.map((r) => ({ ...r })),
    marbles: new Map(round.marbles),
    foam: new Map(round.foam),
    drone: round.drone && { ...round.drone },
    events: [],
  };
}

// How the round ends if nobody touches anything more: 'win' or 'time'.
export function forecast(round) {
  const r = cloneRound(round);
  while (!r.result) step(r, SIM_DT);
  return r.result;
}

// Plays a level with a list of tool uses ({ at: seconds, tool, x, y }), in
// fixed steps, to the end: for the tests (every level is winnable) and for
// tuning.
export function replay(level, moves, dt = SIM_DT) {
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
