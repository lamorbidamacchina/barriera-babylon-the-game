// A tiny pixel-art painter: shapes are rasterized on a pixel grid with no
// anti-aliasing, so sprites stay crisp at any size we generate them.
// Colors can be numbers or functions (x, y) => color (see `shaded`).
export class Painter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null);
  }

  set(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = typeof c === 'function' ? c(x, y) : c;
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x];
  }

  // `over: true` paints only where something is already drawn (details on a body).
  ellipse(cx, cy, rx, ry, c, { over = false } = {}) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        if (over && this.get(x, y) === null) continue;
        this.set(x, y, c);
      }
    }
    return this;
  }

  rect(x, y, w, h, c, { over = false } = {}) {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = x0 + Math.max(1, Math.round(w));
    const y1 = y0 + Math.max(1, Math.round(h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        if (over && this.get(xx, yy) === null) continue;
        this.set(xx, yy, c);
      }
    }
    return this;
  }

  line(x0, y0, x1, y1, c, { over = false } = {}) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (!over || this.get(x0, y0) !== null) this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) (err += dy), (x0 += sx);
      if (e2 <= dx) (err += dx), (y0 += sy);
    }
    return this;
  }

  // Classic dark 1px outline around everything drawn so far.
  outline(c) {
    const edge = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== null) continue;
        if (this.get(x - 1, y) !== null || this.get(x + 1, y) !== null || this.get(x, y - 1) !== null || this.get(x, y + 1) !== null) edge.push([x, y]);
      }
    }
    edge.forEach(([x, y]) => this.set(x, y, c));
    return this;
  }

  // Emits the pixels into a Phaser Graphics, merging horizontal runs.
  toGraphics(g) {
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const c = this.get(x, y);
        if (c === null) {
          x++;
          continue;
        }
        let end = x + 1;
        while (end < this.w && this.get(end, y) === c) end++;
        g.fillStyle(c, 1).fillRect(x, y, end - x, 1);
        x = end;
      }
    }
  }
}

// Volume shading with light from the top-left, 16-bit style: a dithered band
// between light, base and shadow, plus a small specular highlight.
// (cx, cy, rx, ry) is the bounding ellipse of the whole object, so shapes made
// of several pieces share one light.
export function shaded(pal, cx, cy, rx, ry) {
  return (x, y) => {
    const nx = (x + 0.5 - cx) / rx;
    const ny = (y + 0.5 - cy) / ry;
    const d = (nx + ny) * 0.7071;
    const checker = (x + y) % 2 === 0;
    if (pal.hl && (nx + 0.42) ** 2 + (ny + 0.48) ** 2 < 0.035) return pal.hl;
    if (d > 0.52 || (d > 0.36 && checker)) return pal.dark;
    if (d < -0.5 || (d < -0.32 && checker)) return pal.light;
    return pal.base;
  };
}
