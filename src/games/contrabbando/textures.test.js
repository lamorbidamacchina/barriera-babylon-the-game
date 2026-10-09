import { describe, it, expect } from 'vitest';
import { VEGGIES, POWERUPS, createTextures, vegKey, iconKey, droneKey, powerKey } from './textures.js';
import { RECIPES } from './recipes.js';

// Just enough of a Phaser scene for createTextures: it records each texture's
// size, how many pixels were painted and whether they stay inside it.
function fakeScene() {
  const textures = new Map();
  return {
    textures: {
      exists: (key) => textures.has(key),
      get: (key) => textures.get(key),
      all: textures,
    },
    make: {
      graphics() {
        const rects = [];
        let fill;
        const g = {
          fillStyle: (c) => ((fill = c), g),
          fillRect: (x, y, w, h) => (rects.push({ fill, x, y, w, h }), g),
          generateTexture(key, width, height) {
            const frames = new Map();
            textures.set(key, {
              width,
              height,
              rects,
              frames,
              has: (name) => frames.has(name),
              add: (name, src, x, y, w, h) => frames.set(name, { x, y, w, h }),
              getSourceImage: () => ({ width, height }),
            });
          },
          destroy() {},
        };
        return g;
      },
    },
  };
}

const sizes = [...new Set(RECIPES.map((r) => r.size))];

describe.each(sizes)('textures at size %s', (size) => {
  const scene = fakeScene();
  createTextures(scene, size);
  const tex = (key) => scene.textures.get(key);

  const keys = [
    ...Object.keys(VEGGIES).flatMap((t) => [vegKey(t, size), iconKey(t)]),
    ...Object.keys(POWERUPS).map((t) => powerKey(t, size)),
    droneKey(size),
  ];

  it.each(keys)('%s is drawn inside its box', (key) => {
    const t = tex(key);
    expect(t, key).toBeDefined();
    expect(t.width).toBeGreaterThan(0);
    expect(t.height).toBeGreaterThan(0);
    const area = t.rects.reduce((n, r) => n + r.w * r.h, 0);
    expect(area).toBeGreaterThan(t.width * t.height * 0.2); // not blank
    for (const r of t.rects) {
      expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= t.width && r.y + r.h <= t.height, JSON.stringify(r)).toBe(true);
      expect(Number.isInteger(r.fill)).toBe(true);
    }
  });

  it('veggies are scaled by the recipe size', () => {
    for (const [type, v] of Object.entries(VEGGIES)) {
      expect(tex(vegKey(type, size)).width).toBe(Math.round(v.w * size));
      expect(tex(vegKey(type, size)).height).toBe(Math.round(v.h * size));
    }
  });

  it('HUD icons fit their 22px box', () => {
    for (const type of Object.keys(VEGGIES)) {
      expect(Math.max(tex(iconKey(type)).width, tex(iconKey(type)).height)).toBeLessThanOrEqual(22);
    }
  });

  it('veggies and the drone can be split in two halves', () => {
    for (const key of [...Object.keys(VEGGIES).map((t) => vegKey(t, size)), droneKey(size)]) {
      const { width, frames } = tex(key);
      const l = frames.get('left');
      const r = frames.get('right');
      expect(l.w + r.w).toBe(width);
      expect(r.x).toBe(l.w);
    }
  });

  it('does not redraw textures that already exist', () => {
    const before = scene.textures.all.size;
    const first = tex(droneKey(size));
    createTextures(scene, size);
    expect(scene.textures.all.size).toBe(before);
    expect(tex(droneKey(size))).toBe(first);
  });
});
