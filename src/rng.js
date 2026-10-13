// A small seeded random (mulberry32): the same sequence for the same seed, so
// pictures drawn in code and generated puzzles come out the same every time.
// rng(seed)() returns a float in [0, 1).
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
