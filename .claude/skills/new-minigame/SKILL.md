---
name: new-minigame
description: Add a new minigame to Barriera Babylon (Muro Panic, Il nodo nei ferri, Ruspe in fuga, or a new one), or restructure an existing one. Covers registering the scene, the folder layout, the intro/play/pause/end state machine, saving progress, mouse+keyboard+touch input, Italian UI text and the Mei Li intro/results panels, following the Contrabbando conventions. Use whenever starting or scaffolding a minigame scene.
---

# New minigame

`src/scenes/Contrabbando.js` is the reference implementation. Read it before writing a new game, and match its structure and tone. Each game is one Phaser scene plus a folder of pure data and drawing code.

## 1. Files and registration

| What | Where |
|---|---|
| Scene class (`export default class MuroPanic extends Phaser.Scene`, key `'MuroPanic'`) | `src/scenes/MuroPanic.js` |
| Levels and tuning constants, with a header comment explaining every field | `src/games/<id>/levels.js` (Contrabbando calls them `recipes.js`) |
| Sprites drawn in code | `src/games/<id>/textures.js` (see the `pixel-sprite` skill) |
| Character lines (Mei Li, the Comitato Caos kids...) | `src/games/<id>/lines.js` or next to the levels (see the `lore-voice` skill) |
| Menu entry: set `scene: 'MuroPanic'` and `available: true` | `src/data/games.js` |
| Import the scene and add it to `scene: [...]` | `src/main.js` |
| New portraits | `Boot.js` `PORTRAITS` (see the `pixel-sprite` skill, "Portraits") |
| Controls table | `README.md` "Tasti" |

`<id>` is the `id` already in `src/data/games.js` (`muro`, `ferri`, `ruspe`).

## 2. Share the UI helpers first

`overlay()`, `button()`, `banner()` and `typeText()` are currently methods of `Contrabbando`. The second game needs them too, so before copying them, move them to `src/ui.js` as functions that take `scene` as the first argument, and update Contrabbando to call them. Do this as its own small step and check that Contrabbando still works (`playtest` skill) before building the new game on top of it.

## 3. Scene skeleton

```js
export default class MuroPanic extends Phaser.Scene {
  constructor() { super('MuroPanic'); }

  init(data) {
    this.save = loadSave();
    this.progress = this.save.muro ?? { unlocked: 0, best: {} };
    this.level = Phaser.Math.Clamp(data?.level ?? this.progress.unlocked, 0, LEVELS.length - 1);
  }

  create() {
    fadeIn(this);
    createTextures(this, LEVELS[this.level]);
    this.state = 'intro';            // intro → ready → play ⇄ pause → end
    // background, world, HUD (with a touch pause button "II"), input
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.showIntro();
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;   // clamp: tab switches, iOS hiccups
    if (this.state === 'play') this.updateRules(dt);
    ...
  }
}
```

Conventions to keep:

- **`this.state`** is a plain string, and both `update()` and `onKey()` switch on it. `debug.js` shows `scene.state` in the `?debug` overlay, so keep the name.
- **Restart, don't reset**: retry, next level and level change all use `this.scene.restart({ level })`. Every piece of state lives in `create()`/`setup*()`, never in the constructor.
- **Leaving** always goes through `goTo(this, 'Menu')`, which does the stepped fade and guards double clicks.
- **Intro panel** (`showIntro`): a Mei Li portrait (`mei-li-96`) in a `panel()`, level `N/M` with `<` `>` buttons once levels are unlocked, the goal, record, a typed-out order in her voice, short rules in red (`#e07a6a`), blinking `CLICCA PER INIZIARE`, a `< MENU` button. Arm the start click with a 250 ms delay so the click that opened the scene doesn't start the game.
- **Ready → play**: `PRONTI...` then `VIA!` banners with `sfx.confirm()` / `sfx.start()`.
- **Pause**: Esc or P on keyboard, the `II` HUD button on touch. A pause overlay with `CONTINUA` / `MENU`.
- **End**: `endRound(result)` runs once (guard on `state === 'end'`), stops the effects, updates `progress.best[level]` and `progress.unlocked`, calls `writeSave`, plays `sfx.win()`/`sfx.lose()`, then `showResults`: a title in 16px, a points table, `NUOVO RECORD!` blinking in pink, a Mei Li line, `PROSSIMA`/`RIPROVA`/`MENU` buttons, and Enter / R / Esc on keyboard (`this.endActions`).
- **Save** under the game's own key in the shared save object (`this.save.muro = this.progress`). Storage can fail; `save.js` already handles that.

## 4. Input: mouse, keyboard and touch

Target computer and iPad in landscape; phone is best effort.

- Every action has a keyboard path and a pointer path. Arrow keys for movement games (Muro Panic: arrows on computer, drag on iPad).
- **Drags and swipes**: read `pointerdown/move/up/cancel` from `window`, not from Phaser pointers, and convert with the canvas rect (see `listenForSwipes` in Contrabbando, and its comment on why iOS needs this). Remove the listeners on the scene's `'shutdown'` event.
- **Buttons** go through Phaser: `setInteractive`, `pointerdown`, and `e.stopPropagation()` so a button click doesn't also count as a game input. At least 18px tall; 44px wide for anything a thumb will press often.
- Right mouse button is ignored (`e.button !== 0`). The context menu is already disabled globally.
- F, M, F2 are global keys handled in `main.js`; don't reuse them.

## 5. Screen and text

- Internal resolution **480×270**, integer positions. HUD bar 28px at the top (depth 60+), overlays at depth 100.
- Colors from `C` (CSS strings, for text) and `N` (numbers, for Graphics) in `src/config.js`. Add a new named color to the palette instead of scattering hex values, unless it's a one-off sprite shade.
- Text only through `text()` from `ui.js`: sizes 8 or 16, UI strings in **UPPERCASE Italian**. Write `CAFFE'`, `PERCHE'`, `PIU'` instead of accented capitals (the font draws them like lowercase). Lowercase dialogue can keep accents.
- The HTML sound/fullscreen buttons (`#controls` in `index.html`) sit in the bottom-right corner of the page and can overlap the canvas when it fills the screen: don't put buttons or targets the player must hit in the bottom-right corner.

## 6. Done means

1. `npm run build` passes.
2. Play it with the `playtest` skill: full loop intro → play → pause → win and lose → retry → next → menu, on desktop and iPad-landscape sizes, with no console errors.
3. Menu: the entry is no longer greyed out, and `mei` in `games.js` reads well on the chalkboard.
4. README controls table updated.
