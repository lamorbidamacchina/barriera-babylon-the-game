---
name: pixel-sprite
description: Draw or change pixel-art sprites, tiles, backgrounds and portraits for Barriera Babylon. Sprites are drawn in code with the Painter (src/painter.js) and previewed as an enlarged PNG with tools/sprite-preview.mjs before going in the game; portraits come from the promo art via tools/pixelize.mjs. Use for any new character, object, enemy, tile or icon, or when a sprite looks wrong.
---

# Pixel sprites

The game has no sprite sheets. Everything small is drawn in code, rasterized at the exact size it's needed, and turned into a Phaser texture once per game. The look is 16-bit: hard pixels, a dark 1px outline, dithered top-left lighting, a limited palette.

## Tools

- **`Painter`** (`src/painter.js`): a pixel grid with `ellipse`, `rect`, `line` (all take `{ over: true }` to paint only on existing pixels, for details on a body), `outline(color)`, `get/set`. Colors are `0xRRGGBB` numbers or `(x, y) => color` functions.
- **`shaded(pal, cx, cy, rx, ry)`**: the volume shader. `pal = { base, dark, light, hl }`; the bounding ellipse is the whole object, so several pieces share one light.
- **`paint(scene, key, w, h, fn)`** in `src/games/contrabbando/textures.js`: Painter → `generateTexture`. When a second game needs it, move it to `src/painter.js` or `ui.js` instead of copying it.
- **`makeTexture(scene, key, w, h, draw)`** in `ui.js`: for tiny things drawn directly with Graphics `fillRect` calls (the 18×9 drone).

## How to draw a sprite

1. **Parametric size.** A draw function takes `(p, w, h)` and places everything in fractions of `w`/`h`, with `Math.max(1, ...)` for details that must not disappear when small. Then the same sprite works at every level size (veggies shrink as recipes get harder) and as a HUD icon. Leave a 1px margin for the outline.
   Alternative for mechanical things (drone, power-ups): a fixed design grid scaled by whole pixels with an `R(x, y, w, h, color)` helper.
2. **Palette.** Per-material ramps of 3–4 colors (`dark`, `base`, `light`, `hl`); outline in a very dark version of the main hue, not pure black (`0x0e220c` on a zucchini, `0x3a0c06` on a tomato). Scene-level colors come from `C`/`N` in `src/config.js` (night blues, ocra, neon orange, chalk).
3. **Order**: body with `shaded()` → details with `{ over: true }` → parts sticking out (stems, leaves, antennas) → `outline()` last.
4. **Readability over detail.** At 480×270 a character is ~16–40px tall. Silhouette first; a face is 2–4 pixels. Look at it at 1x, not only enlarged.
5. **Texture keys** encode the size: `` `${type}@${Math.round(size * 100)}` ``. Create textures in `create()` for the current level; `paint` skips keys that already exist.
6. Sliceable or breakable sprites: add `left`/`right` frames like `addHalves()`.

## Preview before using it

Always look at the result before wiring it into a scene.

1. Write a sheet module (keep reusable ones in `tools/sprites/`, throwaway ones in the scratchpad), default-exporting `[{ name, w, h, draw(p) }]`. `tools/sprites/contrabbando.mjs` is the example: it imports the exported `draw` painters from the game's `textures.js`, so export yours too.
2. Render:
   ```bash
   npm run sprites -- tools/sprites/<game>.mjs <scratchpad>/sprites.png --scale 6 --bg night
   ```
   `--bg` is a palette name from `N` (`night`, `black`, `board`, `brick`...) or a hex; use the background the sprite will actually sit on. Each sprite appears at 1x and enlarged.
3. `Read` the PNG and judge it: silhouette at 1x, outline continuity, light direction (top-left), banding, colors fighting the background. Iterate on the draw function, re-render.
4. Then check it in the game with the `playtest` skill: scale, motion and contrast against the real scene.

Only the user's own approval settles taste. When a sprite is meant to represent a named character, show them the preview PNG (SendUserFile) before building on it.

## Characters without art

The Comitato Caos kids (Ayoub, Gigi, Teresa, Samir, Chiara, Luna, Marco) and Rosanna as a small sprite have no reference art. Use the descriptions in the `lore-voice` skill (age, one signature trait each: Ayoub's hood over the eyes, Teresa's marker, Chiara's marbles...) so they're recognizable from one detail, and keep them consistent: same height class, same head size, same outline color across the group.

## Portraits

Dialogue portraits are the promo comic illustrations, pixelized:

1. Put the illustration in `art/source/<name>.jpg` (from the promo site repo, `/Users/simone/Repo/side-projects/barriera-babylon`).
2. `npm run pixelize` → `public/assets/portraits/<name>-96.png` and `-160.png` (32 colors, no dithering, hand-drawn frame cropped).
3. Add `<name>` to `PORTRAITS` in `src/scenes/Boot.js`; use it as `'<name>-96'`.
4. `Read` the output PNG: faces with low contrast can turn to mush at 96px. Tweak `.linear()` contrast or the crop in `tools/pixelize.mjs` if needed, but don't change the result of the existing portraits without saying so.
