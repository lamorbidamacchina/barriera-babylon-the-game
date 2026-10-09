import { describe, it, expect } from 'vitest';
import { RECIPES, FRANCO, MEI_END, MEI_RECORD } from './recipes.js';
import { VEGGIES, POWERUPS } from './textures.js';
import { POINTS } from './rules.js';
import { loadCodeGs } from '../../../test/gas.js';

// Invariants of the level data: they hold whatever the tuning, so a typo or a
// careless tweak fails here instead of in someone's hands.
const pairs = RECIPES.slice(1).map((r, i) => [RECIPES[i], r]);

describe.each(RECIPES.map((r, i) => [i, r.name, r]))('recipe %i: %s', (i, name, r) => {
  it('asks only for veggies that exist', () => {
    for (const [type, n] of Object.entries(r.needs)) {
      expect(VEGGIES, type).toHaveProperty(type);
      expect(Number.isInteger(n) && n > 0, `${type}: ${n}`).toBe(true);
    }
  });

  it('has decoys only if some veggie is not in the recipe', () => {
    const others = Object.keys(VEGGIES).filter((k) => !(k in r.needs));
    if (r.decoys > 0) expect(others.length).toBeGreaterThan(0);
    expect(r.decoys).toBeGreaterThanOrEqual(0);
    expect(r.decoys).toBeLessThan(1); // with 1 the needed veggies would never come
  });

  it('uses only existing power-ups, once each', () => {
    for (const p of r.powerups) expect(POWERUPS, p).toHaveProperty(p);
    expect(new Set(r.powerups).size).toBe(r.powerups.length);
  });

  it('has no attivatore when the recipe is a single veggie (its burst would finish the order)', () => {
    if (Object.keys(r.needs).length === 1) expect(r.powerups).not.toContain('attivatore');
  });

  it('has sane timings', () => {
    expect(r.time).toBeGreaterThan(0);
    expect(r.spawnEvery).toBeGreaterThan(0);
    expect(Number.isInteger(r.waveMax) && r.waveMax >= 1).toBe(true);
    expect(r.droneEvery).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(r.otp) && r.otp >= 3).toBe(true); // the OTP timer counts whole seconds
    expect(r.size).toBeGreaterThan(0);
    expect(r.size).toBeLessThanOrEqual(1);
  });

  it('has a name and an order from Mei Li', () => {
    expect(r.name).toMatch(/^[A-Z' ]+$/); // capitals only: the font has no accented capitals
    expect(r.order.length).toBeGreaterThan(0);
  });
});

describe('the recipes get harder', () => {
  it.each(pairs.map(([a, b], i) => [i, i + 1, a, b]))('from %i to %i', (_, __, a, b) => {
    expect(b.size).toBeLessThanOrEqual(a.size);
    expect(b.otp).toBeLessThanOrEqual(a.otp);
    expect(b.droneEvery).toBeLessThanOrEqual(a.droneEvery);
    expect(b.spawnEvery).toBeLessThanOrEqual(a.spawnEvery);
  });
});

describe('scores fit the server cap', () => {
  // Code.gs refuses scores above MAX_SCORE: a real record must never get there.
  // A generous ceiling, far above real runs: every object spawned in the whole
  // time is a needed veggie (+15) cut in a long combo (+10 each), every drone
  // is lasered (+25), power-ups come in 10% of the waves (as in spawnWave) and
  // are all attivatori, and the whole time is left as a bonus.
  const { MAX_SCORE } = loadCodeGs().gs;

  it.each(RECIPES.map((r, i) => [i, r]))('recipe %i', (_, r) => {
    const waves = r.time / (r.spawnEvery * 0.8);
    const frenzy = r.powerups.includes('attivatore') ? waves * 0.1 * (3.5 / 0.12) : 0;
    const objects = waves * r.waveMax + frenzy;
    const drones = r.droneEvery ? r.time / (r.droneEvery * 0.7) : 0;
    const ceiling = objects * (POINTS.needed + POINTS.perComboCut) + drones * POINTS.laseredDrone + r.time * POINTS.perSecondLeft;
    expect(ceiling).toBeLessThan(MAX_SCORE.contrabbando);
  });
});

describe('lines', () => {
  const all = [...Object.values(FRANCO).flat(), ...Object.values(MEI_END).flat(), ...MEI_RECORD];

  it('are all non-empty strings', () => {
    for (const s of all) {
      expect(typeof s).toBe('string');
      expect(s.trim().length).toBeGreaterThan(0);
    }
  });

  it('cover every power-up Franco can comment on', () => {
    for (const p of Object.keys(POWERUPS)) expect(FRANCO[p]?.length, p).toBeGreaterThan(0);
  });

  it('cover every way a round can end', () => {
    for (const k of ['win', 'lose', 'scanned', 'wasted']) expect(MEI_END[k]?.length, k).toBeGreaterThan(0);
  });
});
