import Phaser from 'phaser';
import { WIDTH, HEIGHT, FONT, C, N } from './config.js';
import { sfx } from './sfx.js';

// Pixel text. Press Start 2P is drawn on an 8px grid, so sizes should be
// multiples of 8 and positions whole numbers to stay crisp.
// Its accented capitals look like lowercase: in UPPERCASE strings write
// CAFFE' instead of CAFFÈ, like on old Italian arcade cabinets.
export function text(scene, x, y, str, opts = {}) {
  const {
    size = 8,
    color = C.white,
    origin = 0,
    shadow = C.black,
    wrap,
    lineSpacing = 4,
    align = 'left',
  } = opts;
  const t = scene.add.text(Math.round(x), Math.round(y), str, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    align,
    lineSpacing,
    wordWrap: wrap ? { width: wrap } : undefined,
    // Fixed font metrics instead of measuring them at runtime: Safari on iPad
    // measures this font differently and glyphs got clipped. Every glyph
    // fits its size×size cell; the extra eighth is safety for descenders.
    metrics: { ascent: size, descent: size / 8, fontSize: size + size / 8 },
    // Room for the drop shadow, which Phaser doesn't count in the text size.
    padding: shadow ? { right: 1, bottom: 1 } : undefined,
  });
  if (shadow) t.setShadow(1, 1, shadow, 0, false, true);
  if (Array.isArray(origin)) t.setOrigin(origin[0], origin[1]);
  else t.setOrigin(origin);
  return t;
}

// Arcade-style on/off blinking (no fading: it's 1987).
export function blink(scene, obj, ms = 500) {
  return scene.time.addEvent({
    delay: ms,
    loop: true,
    callback: () => obj.setVisible(!obj.visible),
  });
}

// Double-bordered panel used for dialogue boxes and frames.
export function panel(g, x, y, w, h, { fill = N.night, border = N.ocra, alpha = 0.94 } = {}) {
  g.fillStyle(N.black, 1).fillRect(x - 2, y - 2, w + 4, h + 4);
  g.fillStyle(border, 1).fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle(fill, alpha).fillRect(x, y, w, h);
  g.lineStyle(1, border, 0.5).strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
}

// Stepped fade to black, then start the next scene.
export function goTo(scene, key, data) {
  if (scene._leaving) return;
  scene._leaving = true;
  scene.cameras.main.fadeOut(260, 5, 7, 12);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

export function fadeIn(scene) {
  scene._leaving = false;
  scene.cameras.main.fadeIn(260, 5, 7, 12);
}

// Builds a small texture from a draw callback, once per game.
export function makeTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// Dark surveillance drone, 16x8, with a red light that the scene can blink.
export function droneTexture(scene) {
  makeTexture(scene, 'drone', 18, 9, (g) => {
    g.fillStyle(0x9aa0a8, 1).fillRect(0, 0, 7, 1).fillRect(11, 0, 7, 1); // rotors
    g.fillStyle(0x3a3f48, 1).fillRect(3, 1, 1, 2).fillRect(14, 1, 1, 2); // arms
    g.fillStyle(0x2a2e36, 1).fillRect(2, 3, 14, 3);
    g.fillStyle(0x4a505a, 1).fillRect(5, 2, 8, 5);
    g.fillStyle(0x1a1d22, 1).fillRect(7, 7, 4, 2); // camera
    g.fillStyle(N.droneLight, 1).fillRect(8, 8, 2, 1);
  });
}

// A real HTML text field over the canvas, centered on (x, y) in game pixels:
// the only way to get the on-screen keyboard on iPad and iPhone. Its font is
// the game font at the game's scale, so it looks drawn on the canvas. iOS opens
// the keyboard only when the player taps it; on a computer it takes the focus.
// Removed with the scene, or by calling remove().
export function textInput(scene, x, y, { maxLength = 12, value = '', placeholder = '', filter = (s) => s, onEnter, onEscape } = {}) {
  const canvas = scene.game.canvas;
  const el = document.createElement('input');
  Object.assign(el, { type: 'text', value, placeholder, maxLength, enterKeyHint: 'done', spellcheck: false, autocomplete: 'off' });
  el.setAttribute('autocapitalize', 'characters');
  el.setAttribute('autocorrect', 'off');
  el.className = 'game-input';
  el.style.width = `${maxLength + 1}em`;
  canvas.parentElement.appendChild(el);

  // Follows the canvas when the game is rescaled (window resize, rotation).
  const place = () => {
    const scale = canvas.getBoundingClientRect().width / scene.scale.width;
    el.style.fontSize = `${8 * scale}px`;
    el.style.left = `${canvas.offsetLeft + x * scale}px`;
    el.style.top = `${canvas.offsetTop + y * scale}px`;
  };
  place();
  scene.scale.on('resize', place);
  window.addEventListener('resize', place);

  el.addEventListener('input', () => {
    const clean = filter(el.value);
    if (clean !== el.value) el.value = clean;
  });
  // Typing must not reach the game or the global keys (F, M, F2).
  el.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') onEnter?.(el.value);
    if (e.key === 'Escape') onEscape?.();
  });
  el.addEventListener('keyup', (e) => e.stopPropagation());
  if (!matchMedia('(pointer: coarse)').matches) el.focus();

  const remove = () => {
    if (!el.isConnected) return;
    el.blur();
    el.remove();
    scene.scale.off('resize', place);
    window.removeEventListener('resize', place);
  };
  scene.events.once('shutdown', remove);
  return { el, remove, value: () => el.value };
}

// ------------------------------------------------------------------ game UI
// Shared by the minigames: overlays, buttons, banners, typed-out text.

// Dark full-screen layer at depth 100 that swallows clicks; add() puts more
// objects on it, close() removes them all.
export function overlay(scene) {
  const objs = [];
  const add = (o) => (objs.push(o.setDepth(100)), o);
  add(scene.add.rectangle(0, 0, WIDTH, HEIGHT, N.black, 0.72).setOrigin(0).setInteractive());
  return { add, close: () => objs.forEach((o) => o.destroy()) };
}

// Buttons are tiny on a phone (the game shrinks below 1x), and on the intro a
// tap that misses one starts the game: hits count a few pixels outside.
export function hitArea(w, h, padX = 4, padY = 8) {
  return { hitArea: new Phaser.Geom.Rectangle(-padX, -padY, w + padX * 2, h + padY * 2), hitAreaCallback: Phaser.Geom.Rectangle.Contains };
}

export function button(scene, o, x, y, label, onClick, w = 60) {
  const bg = o.add(scene.add.rectangle(x, y, w, 18, N.night2).setOrigin(0).setStrokeStyle(1, N.ocra));
  o.add(text(scene, x + w / 2, y + 5, label, { color: C.ocraLight, origin: [0.5, 0] }));
  bg.setInteractive({ ...hitArea(w, 18), useHandCursor: true });
  bg.on('pointerover', () => bg.setFillStyle(N.night3));
  bg.on('pointerout', () => bg.setFillStyle(N.night2));
  bg.on('pointerdown', (p, lx, ly, e) => {
    e.stopPropagation();
    sfx.confirm();
    onClick();
  });
  return bg;
}

// Big 16px message that pops in and goes away by itself; a new one replaces it.
export function banner(scene, str, color = C.white, ms = 1100, y = 100) {
  scene._lastBanner?.destroy();
  const t = (scene._lastBanner = text(scene, WIDTH / 2, Math.round(y), str, { size: 16, color, origin: 0.5 }).setDepth(70));
  scene.tweens.add({ targets: t, scale: { from: 0.5, to: 1 }, duration: 160, ease: 'Back.out' });
  scene.time.delayedCall(ms, () => t.active && t.destroy());
  return t;
}

// Types str into a text object a letter at a time, with a blip every 3.
export function typeText(scene, t, str) {
  let i = 0;
  scene.time.addEvent({
    delay: 22,
    repeat: str.length - 1,
    callback: () => {
      i++;
      if (!t.active) return;
      t.setText(str.slice(0, i));
      if (i % 3 === 0) sfx.blip();
    },
  });
}
