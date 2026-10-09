// The rules of the Contrabbando, without Phaser: scoring and what Franco
// throws. The scene calls these; rules.test.js checks them.
import { VEGGIES } from './textures.js';

export const POINTS = { needed: 15, extra: 5, wrong: -10, perComboCut: 10, perSecondLeft: 5, laseredDrone: 25 };
export const MIN_COMBO = 3;

// Cutting a veggie: +15 for what the recipe still needs, +5 for a recipe
// ingredient already complete, -10 and an X for anything not in the recipe.
export function sliceScore(type, remaining) {
  if (!(type in remaining)) return { points: POINTS.wrong, strike: true, needed: false };
  const needed = remaining[type] > 0;
  return { points: needed ? POINTS.needed : POINTS.extra, strike: false, needed };
}

// The score never goes below zero.
export const addPoints = (score, n) => Math.max(0, score + n);

// Bonus at the end of a stroke that cut at least MIN_COMBO recipe veggies.
export const comboBonus = (combo) => (combo < MIN_COMBO ? 0 : combo * POINTS.perComboCut);

// Only a finished dish earns the seconds left.
export const timeBonus = (win, timeLeft) => (win ? Math.ceil(Math.max(0, timeLeft)) * POINTS.perSecondLeft : 0);

export const isComplete = (remaining) => Object.values(remaining).every((n) => n <= 0);

// What Franco throws next: something the recipe still needs, or (with
// probability decoyShare) a veggie that isn't in it. onlyNeeded: never a decoy
// (the attivatore's burst). A recipe that uses every veggie has no decoys.
export function pickVeggieType(remaining, decoyShare, onlyNeeded = false, rng = Math.random) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const needed = Object.keys(remaining).filter((k) => remaining[k] > 0);
  const decoys = Object.keys(VEGGIES).filter((k) => !(k in remaining));
  return needed.length && (onlyNeeded || rng() >= decoyShare) ? pick(needed) : pick(decoys.length ? decoys : needed);
}
