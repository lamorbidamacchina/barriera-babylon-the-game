import Phaser from 'phaser';
import latinFont from '@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2';
import latinExtFont from '@fontsource/press-start-2p/files/press-start-2p-latin-ext-400-normal.woff2';
import './style.css';

import { WIDTH, HEIGHT, FONT, C } from './config.js';
import { unlockAudio, toggleMute, isMuted } from './sfx.js';
import { initDebug } from './debug.js';
import { refreshRecords } from './leaderboard.js';
import Boot from './scenes/Boot.js';
import Title from './scenes/Title.js';
import Bar from './scenes/Bar.js';
import Menu from './scenes/Menu.js';
import Contrabbando from './scenes/Contrabbando.js';

const stageEl = document.getElementById('stage');
const screenEl = document.getElementById('screen');
const crtEl = document.getElementById('crt');

// The game font, registered here with its unicode ranges. Fontsource's
// per-subset CSS files declare both subsets with no range, so the two faces
// collide and iOS Safari picked the latin-ext one, which has no A-Z: the
// canvas fell back to Times. Canvas text also needs both files loaded before
// the first frame is drawn, so wait for them.
const FONT_RANGES = [
  [latinFont, 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'],
  [latinExtFont, 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'],
];
await Promise.all(
  FONT_RANGES.map(([url, unicodeRange]) => {
    const face = new FontFace(FONT.replaceAll('"', ''), `url(${url}) format('woff2')`, { unicodeRange });
    document.fonts.add(face);
    return face.load();
  }),
);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: screenEl,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: C.black,
  pixelArt: true,
  roundPixels: true,
  audio: { noAudio: true }, // sound is handled by sfx.js
  // Several touch pointers: if iOS swallows the end of a touch (system
  // gestures, toolbar), that pointer stays "down" and a single-pointer setup
  // would ignore every new touch until it recovers.
  input: { activePointers: 3 },
  scale: { mode: Phaser.Scale.NONE },
  scene: [Boot, Title, Bar, Menu, Contrabbando],
});

if (import.meta.env.DEV) window.game = game;
initDebug(game); // only with ?debug in the URL
refreshRecords(); // in the background, ready by the time a level starts

// ------------------------------------------------------------------ scaling

// Integer scaling in *device* pixels: on a Retina iPad (dpr 2) the game can
// grow in half-CSS-pixel steps while every game pixel stays perfectly square.
function fit() {
  // The on-screen keyboard shrinks the visual viewport: keep the game as it is
  // while the player types, iOS scrolls the field into view by itself.
  if (document.activeElement?.classList.contains('game-input')) return;
  const dpr = window.devicePixelRatio || 1;
  const w = window.visualViewport?.width ?? innerWidth;
  const h = window.visualViewport?.height ?? innerHeight;
  const room = Math.min((w * dpr) / WIDTH, (h * dpr) / HEIGHT);
  // Below 1x (small phones) integer scaling is impossible: shrink to fit.
  const zoom = (room >= 1 ? Math.floor(room) : room) / dpr;
  game.scale.setZoom(zoom);
  crtEl.style.setProperty('--px', `${zoom}px`);
  // Touch coordinates are mapped through the canvas position on the page:
  // re-read it once the browser has finished laying out (iOS toolbars move it).
  requestAnimationFrame(() => game.scale.refresh());
}

game.events.once(Phaser.Core.Events.READY, fit);
for (const ev of ['resize', 'orientationchange', 'fullscreenchange', 'webkitfullscreenchange']) {
  window.addEventListener(ev, fit);
  document.addEventListener(ev, fit);
}
window.visualViewport?.addEventListener('resize', fit);
document.addEventListener('focusout', () => {
  window.scrollTo(0, 0); // iOS leaves the page scrolled after the keyboard closes
  requestAnimationFrame(fit);
});
window.visualViewport?.addEventListener('scroll', () => game.scale.updateBounds());

// ------------------------------------------------------------------ lost graphics

// iOS frees the GPU memory of a home screen app left in the background: the
// WebGL context is lost and the canvas stays black when the app comes back.
// There's nothing to recover, so reload as soon as the page is visible again.
// Not twice in a row within a minute, in case the context is lost at startup.
const RELOADED_FOR_GPU = 'reloaded-for-lost-context';
game.events.once(Phaser.Core.Events.READY, () => {
  game.canvas.addEventListener('webglcontextlost', () => {
    try {
      if (Date.now() - Number(sessionStorage.getItem(RELOADED_FOR_GPU)) < 60_000) return;
      sessionStorage.setItem(RELOADED_FOR_GPU, String(Date.now()));
    } catch {
      // storage blocked: reload anyway
    }
    const reload = () => document.visibilityState === 'visible' && location.reload();
    if (document.visibilityState === 'visible') reload();
    else document.addEventListener('visibilitychange', reload);
  });
});

// ------------------------------------------------------------------ orientation

// Landscape only on phones and tablets: style.css shows the "rotate" screen
// with the same media query; here we freeze the game while it's visible.
const portrait = matchMedia('(orientation: portrait) and (max-width: 1100px)');
function syncOrientation() {
  if (portrait.matches) game.loop.sleep();
  else if (!game.loop.running && document.visibilityState === 'visible') game.loop.wake(true);
}
portrait.addEventListener('change', syncOrientation);
// First check after the loop has actually started (it starts after READY).
game.events.once(Phaser.Core.Events.POST_STEP, syncOrientation);
// Phaser wakes the loop by itself when the tab becomes visible again.
game.events.on(Phaser.Core.Events.VISIBLE, syncOrientation);

// ------------------------------------------------------------------ updates

// GitHub Pages lets browsers keep index.html for 10 minutes, and iOS resumes a
// home screen app instead of relaunching it: both keep an old build running.
// version.json is never cached, so ask it for the latest build number; if it's
// newer, refresh the cached index.html and reload. On resume only from the
// title screen or the menu, never in the middle of a game.
const RELOADED_FOR = 'reloaded-for-build';

async function checkForUpdate() {
  if (import.meta.env.DEV) return;
  try {
    const res = await fetch('version.json', { cache: 'no-store' });
    const { build } = await res.json();
    // Tried once already for this build and still old: don't loop.
    if (!(build > __BUILD__) || sessionStorage.getItem(RELOADED_FOR) === String(build)) return;
    sessionStorage.setItem(RELOADED_FOR, String(build));
    await fetch('./', { cache: 'reload' });
    location.reload();
  } catch {
    // offline or storage blocked: keep playing this build
  }
}

checkForUpdate();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const scenes = game.scene.getScenes(true).map((s) => s.scene.key);
  if (scenes.every((key) => key === 'Title' || key === 'Menu')) checkForUpdate();
});

// ------------------------------------------------------------------ audio

// iOS unlocks audio only on some gesture events: try on all of them.
for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) {
  window.addEventListener(ev, unlockAudio, { capture: true });
}
// Cheap insurance: fresh canvas bounds right before Phaser reads a touch.
window.addEventListener('pointerdown', () => game.scale.updateBounds(), { capture: true });
window.addEventListener('contextmenu', (e) => e.preventDefault());

// ------------------------------------------------------------------ fullscreen

const fsTarget = stageEl;
const canFullscreen = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const isStandalone = navigator.standalone || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;

function toggleFullscreen() {
  if (!canFullscreen) return showHomeScreenHint();
  if (!fsElement()) {
    const req = fsTarget.requestFullscreen || fsTarget.webkitRequestFullscreen;
    const p = req?.call(fsTarget);
    p?.catch?.(() => {});
    screen.orientation?.lock?.('landscape').catch(() => {});
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
  }
}

// iPhone Safari can't put a page in fullscreen: explain the home screen way.
function showHomeScreenHint() {
  document.getElementById('hint').hidden = false;
}
document.getElementById('hint-ok').addEventListener('click', () => {
  document.getElementById('hint').hidden = true;
});

// ------------------------------------------------------------------ on-screen buttons

const btnFs = document.getElementById('btn-fullscreen');
const btnSound = document.getElementById('btn-sound');

if (isStandalone) btnFs.hidden = true; // already launched like an app
btnFs.addEventListener('click', toggleFullscreen);
btnSound.addEventListener('click', () => {
  toggleMute();
  syncButtons();
});

function syncButtons() {
  btnSound.classList.toggle('off', isMuted());
  btnSound.setAttribute('aria-label', isMuted() ? 'Attiva audio' : 'Disattiva audio');
  btnFs.classList.toggle('active', !!fsElement());
}
document.addEventListener('fullscreenchange', syncButtons);
document.addEventListener('webkitfullscreenchange', syncButtons);
syncButtons();

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF') toggleFullscreen();
  if (e.code === 'KeyM') {
    toggleMute();
    syncButtons();
  }
  if (e.code === 'F2') crtEl.classList.toggle('off');
});
