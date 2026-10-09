---
name: chiptune-sfx
description: Create or tune sound effects, jingles and chiptune music loops for Barriera Babylon, synthesized with WebAudio in src/sfx.js (no audio files). Use when a game event needs a sound, a sound feels wrong, or when adding background music.
---

# Chiptune sound

All audio is synthesized in `src/sfx.js` with two primitives, so there are no files to load and the sound stays 8-bit by construction.

- `tone(type, f1, f2, dur, at = 0, vol = 1)`: one oscillator note, `'square' | 'triangle' | 'sawtooth'`, exponential pitch slide from `f1` to `f2`, exponential decay, `at` seconds from now.
- `noise(dur, { at, vol, freq, q, type, sweep })`: filtered white noise (`bandpass` by default, `lowpass` for thuds), optional filter sweep.

Everything goes through `master` (gain 0.18, 0 when muted). Phaser's audio is disabled (`audio: { noAudio: true }`).

## Adding a sound

1. Add a method to the `sfx` object named for the **event**, not the sound (`wallClaim`, `knotTied`, not `beep2`). Parameters for variation (`slice(pitch)`, `combo(n)`).
2. Call it from the scene at the moment of the event: `sfx.wallClaim()`.
3. Keep it short. Most effects are 0.03–0.35 s; jingles (`win`, `lose`, `start`) under 1 s.

## Recipes from the existing sounds

| Feeling | How | Example |
|---|---|---|
| UI tick / cursor | single short square, 0.025–0.06 s, mid-high pitch | `blip`, `move`, `tick` |
| Confirm / good | two rising squares, a fifth apart | `confirm`, `coin` |
| Error / bad | low sawtooth sliding down | `error` |
| Whoosh | noise with rising filter sweep | `swoosh` |
| Hit / cut | bright noise burst + falling square + low noise thud | `slice` |
| Explosion | long lowpass noise sweeping down + sawtooth dive | `crash` |
| Fanfare | major arpeggio on square + low triangle root | `start`, `win` |
| Fail | descending squares, slightly flat | `lose` |
| Escalation | arpeggio whose length grows with a counter | `combo(n)` |
| Machine hum | low sawtooth, quiet | `drone` |
| Music bar | triangle bass + square chord stabs on the off-beats, called on a timer | `waltzBar(step)` |

Guidelines:

- Square for melody and UI, triangle for bass and soft things, sawtooth for menace and machines, noise for impacts and air.
- Volumes: 0.2–0.5 for squares and saws, up to 0.9 for triangles and low noise (they sound quieter). A new sound must not stand out from the others; compare it right after `sfx.coin()` and `sfx.slice()`.
- Frequent sounds get a little random pitch (`blip`, `key`, `slice`) so repetition doesn't grate.
- Use exponential ramps only towards values > 0 (`0.001`, never `0`): WebAudio throws otherwise.

## Background music

Not done yet (it's in the to-do list). If asked:

- Keep it in `sfx.js` (or a sibling `music.js` that reuses `tone`/`noise` through an export) and schedule notes ahead with `ctx.currentTime`, a small look-ahead scheduler (every ~100 ms, schedule the next ~200 ms), not one `setTimeout` per note.
- Write patterns as data: note arrays per channel (bass triangle, lead square, noise hi-hat), tempo, loop length.
- Its own gain node under `master`, quieter than the effects, respecting mute; stop it on pause, scene shutdown and `visibilitychange`.
- Short loops (8–16 bars), a different one per game; the waltz power-up shows the bar-based style.

## iOS rules (don't break them)

The `AudioContext` is created and resumed only inside a user gesture: `unlockAudio()` is wired in `main.js` to `pointerdown`, `pointerup`, `touchend`, `click`, `keydown`, and it plays a 1-sample buffer once for older iOS. iOS can also leave the context `'interrupted'` after calls or Siri; `unlockAudio` resumes it on the next gesture. Never create a second context, and never start audio from a timer or `create()` without a gesture first.

## Checking

You can't hear the result. Check in the browser (`playtest` skill) that the sound method runs without console errors after a real click in the pane (the `AudioContext` is private to `sfx.js`, so errors are the only signal). Then tell the user which sounds changed and ask them to listen, describing what each is meant to sound like.
