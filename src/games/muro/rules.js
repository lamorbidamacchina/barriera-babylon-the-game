// The rules of Muro Panic, without Phaser: the field is a grid of cells, each
// one still Muro (WALL), already knocked down (FREE) or under the line being
// drawn (TRAIL). The scene calls these; rules.test.js checks them.
export const WALL = 0;
export const FREE = 1;
export const TRAIL = 2;

export const POINTS = { perCell: 1, maxChunkBonus: 3, perPercentOver: 100, perSecondLeft: 10, perLife: 500 };

// A cols×rows field of Muro with a one-cell frame already free: the frame is
// where the player starts and walks.
export function makeGrid(cols, rows) {
  const cells = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) cells[y * cols + x] = FREE;
    }
  }
  return { cols, rows, cells, interior: (cols - 2) * (rows - 2) };
}

export const inside = (g, x, y) => x >= 0 && y >= 0 && x < g.cols && y < g.rows;
export const cellAt = (g, x, y) => (inside(g, x, y) ? g.cells[y * g.cols + x] : FREE);

// A free cell touching the Muro or the line (also diagonally): the only free
// cells the player may walk on, so they stay on the edge of what's left.
export function isEdge(g, x, y) {
  if (cellAt(g, x, y) !== FREE) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dy) && inside(g, x + dx, y + dy) && cellAt(g, x + dx, y + dy) !== FREE) return true;
    }
  }
  return false;
}

// Where the player can step: into the Muro (drawing), back onto free ground
// (on the edge, or anywhere while drawing: that closes the line), never onto
// their own line.
export function canEnter(g, x, y, drawing) {
  if (!inside(g, x, y)) return false;
  const c = cellAt(g, x, y);
  if (c === WALL) return true;
  if (c === TRAIL) return false;
  return drawing || isEdge(g, x, y);
}

// The line came back to free ground: it becomes free, and so does every piece
// of Muro cut off from all the drones (seeds: their cells). Returns how many
// cells were knocked down, line included.
export function closeTrail(g, seeds) {
  const { cols, cells } = g;
  let claimed = 0;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === TRAIL) {
      cells[i] = FREE;
      claimed++;
    }
  }
  // Flood from each drone through the Muro; whatever isn't reached falls.
  const reached = new Uint8Array(cells.length);
  const stack = [];
  for (const [x, y] of seeds) {
    const i = y * cols + x;
    if (inside(g, x, y) && cells[i] === WALL && !reached[i]) {
      reached[i] = 1;
      stack.push(i);
    }
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % cols;
    for (const n of [i - cols, i + cols, x > 0 ? i - 1 : -1, x < cols - 1 ? i + 1 : -1]) {
      if (n >= 0 && n < cells.length && cells[n] === WALL && !reached[n]) {
        reached[n] = 1;
        stack.push(n);
      }
    }
  }
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === WALL && !reached[i]) {
      cells[i] = FREE;
      claimed++;
    }
  }
  return claimed;
}

// After a cut the player can be left on free ground far from what's left of
// the Muro: the closest free cell on the edge, walking over free ground.
export function nearestEdge(g, x, y) {
  const seen = new Uint8Array(g.cells.length);
  const queue = [[x, y]];
  seen[y * g.cols + x] = 1;
  for (let i = 0; i < queue.length; i++) {
    const [cx, cy] = queue[i];
    if (isEdge(g, cx, cy)) return { x: cx, y: cy };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (inside(g, nx, ny) && !seen[ny * g.cols + nx] && cellAt(g, nx, ny) === FREE) {
        seen[ny * g.cols + nx] = 1;
        queue.push([nx, ny]);
      }
    }
  }
  return { x, y };
}

// One step of a patrol ("ronda") along the edge, keeping the Muro on one
// side: hand 1 goes clockwise, -1 anticlockwise. It turns towards the Muro
// when it can, else goes straight, else turns away, else goes back.
// p = { x, y, dx, dy, hand }; returns the patrol after the step.
export function patrolStep(g, p) {
  const { dx, dy, hand } = p;
  const side = [-dy * hand, dx * hand];
  for (const [ox, oy] of [side, [dx, dy], [-side[0], -side[1]], [-dx, -dy]]) {
    if (isEdge(g, p.x + ox, p.y + oy)) return { ...p, x: p.x + ox, y: p.y + oy, dx: ox, dy: oy };
  }
  return p;
}

// A drone turning towards a target: the new heading, at most maxTurn
// radians away from the current one.
export function steer(angle, target, maxTurn) {
  let diff = (target - angle) % (2 * Math.PI);
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  return angle + Math.max(-maxTurn, Math.min(maxTurn, diff));
}

// A drone touched the line: it goes back to being Muro.
export function clearTrail(g) {
  for (let i = 0; i < g.cells.length; i++) if (g.cells[i] === TRAIL) g.cells[i] = WALL;
}

// Share of the Muro knocked down, 0–100 (the frame doesn't count).
export function percentDown(g) {
  let wall = 0;
  for (let i = 0; i < g.cells.length; i++) if (g.cells[i] !== FREE) wall++;
  return (100 * (g.interior - wall)) / g.interior;
}

// Points for one cut: a point per cell, doubled for a cut of at least 10% of
// the Muro, tripled from 20%, at most quadrupled: big brave cuts pay.
export function cutPoints(cells, interior) {
  const bonus = Math.min(POINTS.maxChunkBonus, Math.floor((10 * cells) / interior));
  return cells * POINTS.perCell * (1 + bonus);
}

// End of a won level: every percent past the target, every second and every
// life left. A lost level scores nothing.
export function endBonus(win, percent, target, timeLeft, lives) {
  if (!win) return { muro: 0, time: 0, lives: 0 };
  return {
    muro: Math.max(0, Math.floor(percent) - target) * POINTS.perPercentOver,
    time: Math.ceil(Math.max(0, timeLeft)) * POINTS.perSecondLeft,
    lives: Math.max(0, lives) * POINTS.perLife,
  };
}
