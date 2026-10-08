import Phaser from 'phaser';
import '@fontsource/press-start-2p/latin-400.css';
import '@fontsource/press-start-2p/latin-ext-400.css';
import './style.css';

import { WIDTH, HEIGHT, FONT, C } from './config.js';
import { unlockAudio, toggleMute } from './sfx.js';
import Boot from './scenes/Boot.js';
import Title from './scenes/Title.js';
import Bar from './scenes/Bar.js';
import Menu from './scenes/Menu.js';
import Contrabbando from './scenes/Contrabbando.js';

const screenEl = document.getElementById('screen');
const crtEl = document.getElementById('crt');

// Canvas text needs the web font loaded before the first frame is drawn.
await document.fonts.load(`8px ${FONT}`);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: screenEl,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: C.black,
  pixelArt: true,
  roundPixels: true,
  audio: { noAudio: true }, // sound is handled by sfx.js
  scale: { mode: Phaser.Scale.NONE },
  scene: [Boot, Title, Bar, Menu, Contrabbando],
});

// Integer scaling in *device* pixels: on a Retina iPad (dpr 2) the game can
// grow in half-CSS-pixel steps while every game pixel stays perfectly square.
function fit() {
  const dpr = window.devicePixelRatio || 1;
  const factor = Math.max(
    1,
    Math.floor(Math.min((innerWidth * dpr) / WIDTH, (innerHeight * dpr) / HEIGHT)),
  );
  const zoom = factor / dpr;
  game.scale.setZoom(zoom);
  crtEl.style.setProperty('--px', `${zoom}px`);
}

if (import.meta.env.DEV) window.game = game;

game.events.once(Phaser.Core.Events.READY, fit);
window.addEventListener('resize', fit);

// Shell-level controls, available in every scene.
function toggleFullscreen() {
  const el = document.getElementById('stage');
  if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}

window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (e.code === 'KeyF') toggleFullscreen();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'F2') crtEl.classList.toggle('off');
});
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('contextmenu', (e) => e.preventDefault());
