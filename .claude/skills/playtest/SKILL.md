---
name: playtest
description: Run and play Barriera Babylon in the built-in browser to check a change, at desktop, iPad-landscape and iPhone-landscape sizes, with the ?debug overlay, console checks, scene jumping, simulated swipes and screenshots, then a production build. Use after any change that shows up in the game, and when the user reports a bug seen on their iPhone/iPad.
---

# Playtest

## Start

- `preview_start` with `{ name: "game" }` (`.claude/launch.json`: Vite on port **5180**, strict). Vite has HMR, but a scene that's already running keeps its old code: restart the scene or reload the page after an edit.
- Add `?debug` to the URL for the overlay from `src/debug.js`: fps, scene and `state`, pointers, native touch/pointer counts, canvas rect, viewport, and an event log. Use it whenever input is involved.
- In dev, `window.game` is the Phaser game.

## Get to the screen you need fast

The real path is Title (coin) → Bar (Mei Li) → Menu → game. To skip it, use `javascript_tool`:

```js
const s = game.scene.getScenes(true)[0];
s.scene.start('Contrabbando', { level: 2 });   // any scene key + its init data
```

Inspect state the same way: `game.scene.getScene('Contrabbando').state`, `.score`, `.objects.length`. Saved progress lives in `localStorage['barriera-babylon']`; clear it to test a first-time player, or write it to test unlocked levels.

Sound needs a user gesture: it starts after the first real click in the pane, not after `javascript_tool` calls.

## Sizes to check

Use `resize_window` (custom width/height), and reset with `preset: "desktop"` when done.

| Target | Size | Why |
|---|---|---|
| Desktop | pane default | mouse + keyboard; integer scaling |
| iPad landscape | 1180×820 and 1024×768 | main touch target |
| iPhone landscape | 844×390 | best effort; below 1x the game shrinks to fit |
| Portrait phone/tablet | 390×844 | must show the "RUOTA IL DISPOSITIVO" screen and freeze the game |

At each size: nothing cut off, text crisp (no half pixels), HUD readable, the `#controls` buttons (bottom-right) not covering anything that needs a tap.

Widths under 768 also emulate a touch phone (user agent, touch points), but clicks still arrive as mouse events. The pane can't reproduce iOS Safari quirks (toolbars moving the canvas, `touchcancel` from system gestures, audio unlock rules). For those, say what you verified and what still needs the user's real device, and suggest opening the game with `?debug` there and sending a screenshot of the overlay.

## Exercise the game

- Clicks: the game is a single canvas, so `find` / `read_page` can't see its buttons. Take a screenshot and `left_click` by coordinate.
- Swipes and drags: `left_click_drag` across the target. Several quick drags for combos.
- Keys: `computer` `key` (`Escape`, `p`, `Return`, arrows, digits for the OTP check).
- Go through the full loop of the game you touched: intro → play → pause/resume → win → lose → retry → next level → back to menu.
- After each step: `read_console_messages` with `onlyErrors`, and `preview_logs` for Vite errors.

Canvas game coordinates are 480×270 scaled; to click a game point, multiply by the scale (read the canvas rect from the debug overlay or `game.canvas.getBoundingClientRect()`).

## Before saying it works

1. No console errors during the loop above.
2. `npm run build` succeeds (Bash is fine for the build; never start the dev server from Bash).
3. Screenshot of the changed screen as proof to the user.
4. Report honestly what was checked in the pane and what only a real iPhone/iPad can confirm.

Pushing to `main` deploys to GitHub Pages; the title screen's `SOCIAL SCORE` is the build number (commit count), which tells whether a device runs a cached build. Only commit or push when the user asks.
