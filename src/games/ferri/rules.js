// Rules of Il nodo nei ferri, without Phaser so they can be tested: building
// the tangle, finding the crossings, the drone's beam, the score.
import { rng } from '../../rng.js';

export const POINTS = {
  perKnot: 30,
  perSecondLeft: 5,
  perStrikeLeft: 50, // each X the drone didn't give
  perMoveSaved: 10, // under twice the number of knots
};
export const STRIKES = 3;

// The table on screen (game pixels), and the margin the knots keep from its
// edges. KNOT_R: a thread closer than this to a knot runs over it.
export const FIELD = { x: 8, y: 32, w: 396, h: 232 };
export const MARGIN = 14;
export const KNOT_R = 6;

// A point of the unit square on the table. Stretching is fine: straight lines
// stay straight and what doesn't cross still doesn't.
export const toField = ({ x, y }) => ({
  x: FIELD.x + MARGIN + x * (FIELD.w - 2 * MARGIN),
  y: FIELD.y + MARGIN + y * (FIELD.h - 2 * MARGIN),
});

// A level's tangle on the table: the threads, the knots where they start and
// where they'd be untangled.
export function layout(level) {
  const tangle = makeTangle(level.lines, level.seed, level.drop);
  return {
    threads: tangle.threads,
    start: scramble(tangle, level.seed, level.minCrossings).map(toField),
    solution: tangle.solution.map(toField),
  };
}

// The tangle is built from straight lines that all cross each other: every
// crossing is a knot, every stretch of a line between two knots is a thread.
// Laid out like that nothing crosses, so every tangle has a solution.
// lines: how many lines; drop: knots taken away, for knot counts in between
// (see untangled). Positions are in a unit square, [0, 1] on both axes.
// Returns { solution: [{x, y}] (one per knot), threads: [{a, b, line}] }.
export function makeTangle(lines, seed, drop = 0) {
  const r = rng(seed);
  // Random lines can leave knots almost on top of each other: try a few
  // layouts and keep the most spread out.
  let best = null;
  for (let i = 0; i < TRIES && !(best?.gap >= MIN_GAP); i++) {
    const t = layLines(lines, r);
    if (!best || t.gap > best.gap) best = t;
  }
  return untangled(best, r, drop);
}

const TRIES = 300;
const MIN_GAP = 0.09; // knots closer than this (in the unit square) are hard to tell apart

function layLines(n, r) {
  // Angles spread around half a turn, so no two lines are near parallel.
  const ls = Array.from({ length: n }, (_, i) => {
    const a = ((i + 0.2 + r() * 0.6) * Math.PI) / n;
    return { dx: Math.cos(a), dy: Math.sin(a), px: r(), py: r() };
  });
  const knots = [];
  const along = ls.map(() => []); // per line: [t, knot index]
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const A = ls[i];
      const B = ls[j];
      const den = A.dx * B.dy - A.dy * B.dx;
      const ti = ((B.px - A.px) * B.dy - (B.py - A.py) * B.dx) / den;
      const tj = ((B.px - A.px) * A.dy - (B.py - A.py) * A.dx) / den;
      const k = knots.push({ x: A.px + ti * A.dx, y: A.py + ti * A.dy, lines: [i, j] }) - 1;
      along[i].push([ti, k]);
      along[j].push([tj, k]);
    }
  }
  // Into the unit square, keeping proportions.
  const xs = knots.map((k) => k.x);
  const ys = knots.map((k) => k.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const size = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
  for (const k of knots) {
    k.x = (k.x - minX) / size;
    k.y = (k.y - minY) / size;
  }
  let gap = Infinity;
  for (let i = 0; i < knots.length; i++) {
    for (let j = i + 1; j < knots.length; j++) gap = Math.min(gap, Math.hypot(knots[i].x - knots[j].x, knots[i].y - knots[j].y));
  }
  return { knots, along, gap };
}

function untangled({ knots, along }, r, drop) {
  // A dropped knot: one of its lines runs on through the gap, the other one
  // stops on both sides of it (two lines crossing with no knot would be a
  // tangle in the solution).
  const through = new Map(); // dropped knot → the line that runs on
  while (through.size < Math.min(drop, knots.length - 3)) {
    const k = Math.floor(r() * knots.length);
    if (!through.has(k)) through.set(k, knots[k].lines[Math.floor(r() * 2)]);
  }
  const index = new Map(); // old knot index → new one
  knots.forEach((k, i) => through.has(i) || index.set(i, index.size));

  const threads = [];
  along.forEach((list, line) => {
    let prev = null;
    for (const [, k] of list.sort((p, q) => p[0] - q[0])) {
      if (through.has(k)) {
        if (through.get(k) !== line) prev = null;
        continue;
      }
      if (prev !== null) threads.push({ a: index.get(prev), b: index.get(k), line });
      prev = k;
    }
  });
  const solution = knots.filter((k, i) => !through.has(i)).map(({ x, y }) => ({ x, y }));
  return { solution, threads };
}

// The knots scrambled on a circle (unit square), in a random order, until at
// least minCrossings threads cross: a lucky shuffle could leave it almost solved.
export function scramble(tangle, seed, minCrossings) {
  const r = rng(seed);
  const n = tangle.solution.length;
  for (let tries = 0; ; tries++) {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const pos = new Array(n);
    order.forEach((k, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      pos[k] = { x: 0.5 + 0.5 * Math.cos(a), y: 0.5 + 0.5 * Math.sin(a) };
    });
    if (tries > 500 || crossings(pos, tangle.threads, 0).count >= minCrossings) return pos;
  }
}

const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const onSegment = (p, a, b) => Math.min(a.x, b.x) <= p.x && p.x <= Math.max(a.x, b.x) && Math.min(a.y, b.y) <= p.y && p.y <= Math.max(a.y, b.y);

// Do segments p1-p2 and p3-p4 touch? Callers skip pairs that share a knot.
export function segmentsCross(p1, p2, p3, p4) {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  // Touching or lying on top of each other.
  if (d1 === 0 && onSegment(p1, p3, p4)) return true;
  if (d2 === 0 && onSegment(p2, p3, p4)) return true;
  if (d3 === 0 && onSegment(p3, p1, p2)) return true;
  if (d4 === 0 && onSegment(p4, p1, p2)) return true;
  return false;
}

// Where two segments meet (for the red marks), assuming they cross.
function meet(p1, p2, p3, p4) {
  const den = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (den === 0) return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / den;
  return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
}

export function distToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// Everything still tangled: threads crossing each other, and threads passing
// over a knot that isn't one of their ends (closer than knotR), which would
// look solved but isn't. Returns { count, points: [{x, y}], bad: Set of thread
// indexes }.
export function crossings(knots, threads, knotR) {
  const points = [];
  const bad = new Set();
  for (let i = 0; i < threads.length; i++) {
    const s = threads[i];
    const a = knots[s.a];
    const b = knots[s.b];
    for (let j = i + 1; j < threads.length; j++) {
      const t = threads[j];
      if (t.a === s.a || t.a === s.b || t.b === s.a || t.b === s.b) continue;
      if (!segmentsCross(a, b, knots[t.a], knots[t.b])) continue;
      points.push(meet(a, b, knots[t.a], knots[t.b]));
      bad.add(i).add(j);
    }
    if (knotR > 0) {
      knots.forEach((k, ki) => {
        if (ki === s.a || ki === s.b || distToSegment(k, a, b) >= knotR) return;
        points.push({ x: k.x, y: k.y });
        bad.add(i);
      });
    }
  }
  return { count: points.length, points, bad };
}

// The drone's scan: a vertical band centred on x. A knot held inside it is a
// suspicious movement.
export const beamHits = (knotX, beamX, halfWidth) => Math.abs(knotX - beamX) <= halfWidth;

// Points of a won level; a lost one scores nothing.
export function score({ knots, timeLeft, strikes, moves }) {
  const s = {
    knots: knots * POINTS.perKnot,
    time: Math.ceil(Math.max(0, timeLeft)) * POINTS.perSecondLeft,
    strikes: Math.max(0, STRIKES - strikes) * POINTS.perStrikeLeft,
    moves: Math.max(0, 2 * knots - moves) * POINTS.perMoveSaved,
  };
  return { ...s, total: s.knots + s.time + s.strikes + s.moves };
}
