import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, panel, goTo, fadeIn, droneTexture, overlay, button, banner, typeText, hitArea } from '../ui.js';
import { sfx } from '../sfx.js';
import { loadSave, writeSave } from '../save.js';
import { LEVELS, ROSANNA } from '../games/muro/levels.js';
import { createView } from '../games/muro/views.js';
import { createTextures, wallPattern, CURSOR_KEY } from '../games/muro/textures.js';
import { WALL, FREE, TRAIL, makeGrid, cellAt, isEdge, canEnter, closeTrail, clearTrail, percentDown, cutPoints, endBonus, nearestEdge } from '../games/muro/rules.js';

const HUD_H = 28;
const CELL = 4; // px per cell of Muro
const COLS = 120;
const ROWS = 60;
const FX = 0; // top-left corner of the field
const FY = 30;
const SPEED = 20; // cells per second, walking or drawing
const LIVES = 3;
const SAFE_SECONDS = 1.5; // after losing a life, drones can't hit you
const STICK_DEAD = 5; // joystick: px of drag before it moves
const STICK_MAX = 22; // joystick: the base follows a finger dragged further
const GRAVITY = 420;
const GAME_ID = 'muro'; // in the save
const pick = Phaser.Utils.Array.GetRandom;
const rand = Phaser.Math.FloatBetween;
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] };

// Muro Panic: Gals Panic on the Muro. Teresa's marker leaves the edge, draws a
// line through the Muro and comes back: the piece without drones falls and
// Torino shows through. Knock down enough Muro to clear the level; a drone
// touching the line while it's being drawn costs a life.
export default class MuroPanic extends Phaser.Scene {
  constructor() {
    super('MuroPanic');
  }

  init(data) {
    this.save = loadSave();
    this.progress = this.save[GAME_ID] ?? { unlocked: 0, best: {} };
    this.level = Phaser.Math.Clamp(data?.level ?? this.progress.unlocked, 0, LEVELS.length - 1);
  }

  create() {
    fadeIn(this);
    this.lv = LEVELS[this.level];
    createTextures(this);
    droneTexture(this);
    this.pattern = this.pattern ?? wallPattern();
    this.patternPx = this.patternPx ?? this.pattern.getContext('2d').getImageData(0, 0, COLS * CELL, ROWS * CELL).data;

    this.state = 'intro';
    this.add.rectangle(0, 0, WIDTH, HEIGHT, N.black).setOrigin(0);
    this.add.image(FX, FY, createView(this, this.lv.view)).setOrigin(0);
    this.setupField();
    this.trailGfx = this.add.graphics().setDepth(3);
    this.player = this.add.image(0, 0, CURSOR_KEY).setDepth(5);
    this.debrisGfx = this.add.graphics().setDepth(20);
    this.stickGfx = this.add.graphics().setDepth(80);
    this.setupRound();
    this.drawHud();

    this.listenForStick();
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.input.keyboard.on('keyup', (e) => this.releaseKey(e.code));
    const blur = () => (this.held = []);
    window.addEventListener('blur', blur);
    this.events.once('shutdown', () => window.removeEventListener('blur', blur));

    this.showIntro();
  }

  // ---------------------------------------------------------------- setup

  // The Muro lives on a canvas texture: redrawn from the pattern, cell by cell,
  // every time a piece falls.
  setupField() {
    const key = 'muro-field';
    this.fieldTex = this.textures.exists(key) ? this.textures.get(key) : this.textures.createCanvas(key, COLS * CELL, ROWS * CELL);
    this.add.image(FX, FY, key).setOrigin(0).setDepth(2);
  }

  setupRound() {
    this.grid = makeGrid(COLS, ROWS);
    this.score = 0;
    this.lives = LIVES;
    this.timeLeft = this.lv.time;
    this.percent = 0;
    this.pos = { x: Math.floor(COLS / 2), y: ROWS - 1 };
    this.drawing = false;
    this.trail = []; // cells of the line, in order
    this.trailStart = null;
    this.moveAcc = 0;
    this.safeLeft = 0;
    this.held = []; // arrow keys held down, newest last
    this.stick = null; // { id, ox, oy, x, y } while a finger steers
    this.debris = [];
    this.drones = this.lv.drones.map((d) => this.makeDrone(d));
    this.redrawWall();
    this.placePlayer();
  }

  makeDrone({ speed, size }) {
    const img = this.add.image(0, 0, 'drone').setScale(size).setDepth(6);
    const a = (Phaser.Math.Between(0, 3) * Math.PI) / 2 + rand(0.35, 1.2);
    const d = { img, hw: 9 * size, hh: 5 * size, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, phase: rand(0, 6) };
    d.x = rand(FX + 80, FX + COLS * CELL - 80);
    d.y = rand(FY + 50, FY + ROWS * CELL - 50);
    img.setPosition(Math.round(d.x), Math.round(d.y));
    return d;
  }

  drawHud() {
    this.add.rectangle(0, 0, WIDTH, HUD_H, N.black, 0.85).setOrigin(0).setDepth(60);
    this.scoreText = text(this, 8, 10, '', { color: C.ocraLight }).setDepth(61);
    text(this, 120, 10, 'MURO', { color: C.chalkDim }).setDepth(61);
    // Progress bar with a tick at the target.
    this.barGfx = this.add.graphics().setDepth(61);
    this.pctText = text(this, 270, 10, '', { color: C.white }).setDepth(61);
    this.timeText = text(this, 382, 10, '', { color: C.white, origin: [1, 0] }).setDepth(61);
    this.lifeIcons = [0, 1, 2].map((i) => this.add.image(400 + i * 13, HUD_H / 2, CURSOR_KEY).setDepth(61));
    // Pause button (mainly for touch).
    const pb = this.add.rectangle(452, 4, 22, 20, N.night2).setOrigin(0).setDepth(61).setStrokeStyle(1, N.ocra);
    text(this, 463, 10, 'II', { color: C.ocraLight, origin: [0.5, 0] }).setDepth(62);
    pb.setInteractive({ ...hitArea(22, 20, 4, 4), useHandCursor: true }).on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      if (this.state === 'play') this.pause();
    });
    this.updateHud();
  }

  updateHud() {
    this.scoreText.setText(`PUNTI ${String(this.score).padStart(6, '0')}`);
    const pct = Math.floor(this.percent);
    const done = pct >= this.lv.target;
    const BX = 156;
    const BW = 108;
    this.barGfx.clear().fillStyle(N.night2).fillRect(BX, 10, BW, 8);
    this.barGfx.fillStyle(done ? 0x9be36b : N.pink).fillRect(BX, 10, Math.round((BW * Math.min(100, this.percent)) / 100), 8);
    this.barGfx.fillStyle(N.white).fillRect(BX + Math.round((BW * this.lv.target) / 100), 7, 1, 14);
    this.pctText.setText(`${pct}%`).setColor(done ? '#9be36b' : C.white);
    const s = Math.max(0, Math.ceil(this.timeLeft));
    this.timeText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`).setColor(s <= 10 ? C.red : C.white);
    this.lifeIcons.forEach((icon, i) => icon.setAlpha(i < this.lives ? 1 : 0.2));
  }

  // Rosanna's comments, briefly, in the top-left corner of the field.
  say(lines, chance = 1) {
    if (Math.random() > chance) return;
    this.bubble?.destroy();
    const line = typeof lines === 'string' ? lines : pick(lines);
    const t = (this.bubble = text(this, 8, FY + 6, line, { color: C.white }).setDepth(55));
    const bg = this.add.rectangle(4, FY + 2, t.width + 8, t.height + 8, N.black, 0.8).setOrigin(0).setDepth(54);
    t.once('destroy', () => bg.destroy());
    this.time.delayedCall(2400, () => t.active && t.destroy());
  }

  // ---------------------------------------------------------------- overlays

  showIntro() {
    this.state = 'intro';
    const o = (this.introUi = overlay(this));
    const P = { x: 20, y: 36, w: 440, h: 206 };
    panel(o.add(this.add.graphics()), P.x, P.y, P.w, P.h);

    const g = o.add(this.add.graphics());
    panel(g, P.x + 12, P.y + 14, 96, 96, { fill: N.black, alpha: 1 });
    o.add(this.add.image(P.x + 12, P.y + 14, 'rosanna-96').setOrigin(0));
    o.add(text(this, P.x + 60, P.y + 116, 'MAESTRA', { color: C.ocraLight, origin: [0.5, 0] }));
    o.add(text(this, P.x + 60, P.y + 127, 'ROSANNA', { color: C.ocraLight, origin: [0.5, 0] }));

    const X = P.x + 124;
    const unlocked = Math.min(this.progress.unlocked, LEVELS.length - 1);
    o.add(text(this, X, P.y + 12, `MURO ${this.level + 1}/${LEVELS.length}`, { color: C.chalkDim }));
    if (unlocked > 0) {
      // A greyed arrow still swallows the tap: a near miss must not start the game.
      const step = (label, x, dir, enabled) => {
        if (enabled) return button(this, o, x, P.y + 6, label, () => this.changeLevel(dir), 44);
        const bg = o.add(this.add.rectangle(x, P.y + 6, 44, 18, N.night).setOrigin(0).setStrokeStyle(1, N.night3));
        bg.setInteractive(hitArea(44, 18)).on('pointerdown', (p, lx, ly, e) => e.stopPropagation());
        o.add(text(this, x + 22, P.y + 11, label, { color: '#3a4560', origin: [0.5, 0], shadow: null }));
      };
      step('<', P.x + P.w - 108, -1, this.level > 0);
      step('>', P.x + P.w - 56, 1, this.level < unlocked);
    }
    o.add(text(this, X, P.y + 28, this.lv.name, { color: C.ocraLight, wrap: 300 }));
    o.add(text(this, X, P.y + 46, `ABBATTI IL ${this.lv.target}% DEL MURO`, { color: C.white }));
    const best = this.progress.best[this.level];
    const drones = this.lv.drones.length;
    o.add(text(this, X, P.y + 60, `TEMPO ${this.lv.time}s   ${drones} DRON${drones > 1 ? 'I' : 'E'}${best ? `   RECORD ${best}` : ''}`, { color: C.chalkDim }));

    const order = o.add(text(this, X, P.y + 80, '', { color: C.white, wrap: 300, lineSpacing: 5 }));
    typeText(this, order, this.lv.order);

    const touch = matchMedia('(pointer: coarse)').matches;
    o.add(text(this, WIDTH / 2, P.y + 148, touch ? 'DITO GIU\' OVUNQUE E TRASCINA PER MUOVERTI' : 'FRECCE PER MUOVERTI', { color: C.chalkDim, origin: [0.5, 0] }));
    o.add(text(this, WIDTH / 2, P.y + 159, 'ESCI DAL BORDO, TRACCIA, TORNA: IL MURO CROLLA', { color: C.chalkDim, origin: [0.5, 0] }));
    o.add(text(this, WIDTH / 2, P.y + 170, `DRONE SULLA LINEA: PERDI UNA VITA   ${LIVES} VITE`, { color: '#e07a6a', origin: [0.5, 0] }));
    const go = o.add(text(this, WIDTH / 2, P.y + 186, touch ? 'TOCCA PER INIZIARE' : 'CLICCA PER INIZIARE', { color: C.ocraLight, origin: [0.5, 0] }));
    button(this, o, P.x + 12, P.y + 182, '< MENU', () => goTo(this, 'Menu'), 64);
    blink(this, go, 450);

    this.introClick = () => this.startPlay();
    this.time.delayedCall(250, () => this.input.once('pointerdown', this.introClick));
  }

  changeLevel(dir) {
    sfx.move();
    this.scene.restart({ level: this.level + dir });
  }

  startPlay() {
    if (this.state !== 'intro') return;
    this.input.off('pointerdown', this.introClick);
    this.introUi.close();
    this.state = 'ready';
    this.stick = null; // the tap that started the game doesn't steer
    sfx.confirm();
    banner(this, 'PRONTI...', C.white, 700);
    this.say(ROSANNA.start);
    this.time.delayedCall(800, () => {
      sfx.start();
      banner(this, 'VIA!', C.ocraLight, 600);
      this.state = 'play';
    });
  }

  pause() {
    this.state = 'pause';
    this.held = [];
    this.stick = null;
    this.stickGfx.clear();
    const o = (this.pauseUi = overlay(this));
    o.add(text(this, WIDTH / 2, 90, 'PAUSA', { size: 16, color: C.white, origin: 0.5 }));
    button(this, o, WIDTH / 2 - 85, 130, 'CONTINUA', () => this.resume(), 80);
    button(this, o, WIDTH / 2 + 5, 130, 'MENU', () => goTo(this, 'Menu'), 80);
  }

  resume() {
    this.pauseUi?.close();
    this.pauseUi = null;
    this.state = 'play';
  }

  onKey(e) {
    if (this.state === 'intro') {
      if (e.code === 'ArrowLeft' && this.level > 0) this.changeLevel(-1);
      else if (e.code === 'ArrowRight' && this.level < Math.min(this.progress.unlocked, LEVELS.length - 1)) this.changeLevel(1);
      else if (e.code === 'Escape') goTo(this, 'Menu');
      else if (['Enter', 'Space'].includes(e.code)) this.startPlay();
    } else if (this.state === 'play' || this.state === 'ready') {
      if (DIRS[e.code]) {
        this.releaseKey(e.code);
        this.held.push(e.code);
      } else if (this.state === 'play' && ['Escape', 'KeyP'].includes(e.code)) this.pause();
    } else if (this.state === 'pause') {
      if (['Escape', 'KeyP', 'Enter', 'Space'].includes(e.code)) this.resume();
    } else if (this.state === 'end' && this.endActions) {
      if (['Enter', 'Space'].includes(e.code)) this.endActions.primary();
      else if (e.code === 'KeyR') this.endActions.retry();
      else if (e.code === 'Escape') this.endActions.menu();
    }
  }

  releaseKey(code) {
    this.held = this.held.filter((k) => k !== code);
  }

  // ---------------------------------------------------------------- touch joystick

  // A floating joystick: the finger lands anywhere, dragging away from that
  // point steers (4 directions, the stronger one first). Read from the
  // window's pointer events like the Contrabbando swipes, for the same iOS
  // reasons (see listenForSwipes there). Works with the mouse too.
  listenForStick() {
    const toGame = (e) => {
      const r = this.game.canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * WIDTH) / r.width, y: ((e.clientY - r.top) * HEIGHT) / r.height };
    };
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (this.state !== 'play' && this.state !== 'ready') return;
      const p = toGame(e);
      if (p.y < HUD_H) return; // the pause button
      this.stick = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
    };
    const move = (e) => {
      const s = this.stick;
      if (!s || e.pointerId !== s.id) return;
      const p = toGame(e);
      s.x = p.x;
      s.y = p.y;
      const dx = s.x - s.ox;
      const dy = s.y - s.oy;
      const len = Math.hypot(dx, dy);
      if (len > STICK_MAX) {
        s.ox = s.x - (dx / len) * STICK_MAX;
        s.oy = s.y - (dy / len) * STICK_MAX;
      }
    };
    const up = (e) => {
      if (this.stick?.id === e.pointerId) this.stick = null;
    };
    const handlers = { pointerdown: down, pointermove: move, pointerup: up, pointercancel: up };
    for (const [ev, fn] of Object.entries(handlers)) window.addEventListener(ev, fn);
    this.events.once('shutdown', () => {
      for (const [ev, fn] of Object.entries(handlers)) window.removeEventListener(ev, fn);
    });
  }

  // Where the player wants to go: up to two directions, the main one first
  // (the second one helps sliding around corners).
  wanted() {
    if (this.stick) {
      const dx = this.stick.x - this.stick.ox;
      const dy = this.stick.y - this.stick.oy;
      if (Math.hypot(dx, dy) < STICK_DEAD) return [];
      const h = [Math.sign(dx), 0];
      const v = [0, Math.sign(dy)];
      const [main, other, k] = Math.abs(dx) >= Math.abs(dy) ? [h, v, Math.abs(dy) / Math.abs(dx)] : [v, h, Math.abs(dx) / Math.abs(dy)];
      return k > 0.4 ? [main, other] : [main];
    }
    const dirs = this.held.map((k) => DIRS[k]).reverse();
    const main = dirs[0];
    if (!main) return [];
    const other = dirs.find((d) => d[0] !== main[0] && d[1] !== main[1] && (d[0] === 0) !== (main[0] === 0));
    return other ? [main, other] : [main];
  }

  drawStick() {
    const g = this.stickGfx.clear();
    const s = this.stick;
    if (!s || this.state !== 'play') return;
    g.lineStyle(1, N.white, 0.35).strokeCircle(Math.round(s.ox), Math.round(s.oy), STICK_MAX);
    g.fillStyle(N.white, 0.3).fillCircle(Math.round(s.x), Math.round(s.y), 7);
  }

  // ---------------------------------------------------------------- moving and cutting

  updatePlayer(dt) {
    const dirs = this.wanted();
    if (!dirs.length) {
      this.moveAcc = 0;
      return;
    }
    this.moveAcc += dt * SPEED;
    while (this.moveAcc >= 1 && this.state === 'play') {
      this.moveAcc -= 1;
      const d = dirs.find(([dx, dy]) => canEnter(this.grid, this.pos.x + dx, this.pos.y + dy, this.drawing));
      if (!d) {
        this.moveAcc = 0;
        break;
      }
      this.stepTo(this.pos.x + d[0], this.pos.y + d[1]);
    }
  }

  stepTo(x, y) {
    const g = this.grid;
    const c = cellAt(g, x, y);
    if (c === WALL) {
      if (!this.drawing) {
        this.drawing = true;
        this.trailStart = { ...this.pos };
        this.trail = [{ ...this.pos }];
      }
      g.cells[y * g.cols + x] = TRAIL;
      this.trail.push({ x, y });
      if (this.trail.length % 4 === 0) sfx.tick();
    }
    this.pos = { x, y };
    if (c === FREE && this.drawing) this.cut();
    this.placePlayer();
  }

  // The line is closed: whatever has no drone in it falls.
  cut() {
    const g = this.grid;
    const before = g.cells.slice();
    const seeds = this.drones.map((d) => this.cellOf(d.x, d.y));
    const n = closeTrail(g, seeds);
    this.drawing = false;
    this.trail = [];
    const fallen = [];
    for (let i = 0; i < g.cells.length; i++) if (before[i] === WALL && g.cells[i] === FREE) fallen.push(i);
    this.spawnDebris(fallen, 160);
    this.redrawWall();
    if (!isEdge(g, this.pos.x, this.pos.y)) this.pos = nearestEdge(g, this.pos.x, this.pos.y);

    const points = cutPoints(n, g.interior);
    this.score += points;
    this.percent = percentDown(g);
    const big = n / g.interior >= 0.1;
    if (big) {
      sfx.crash();
      this.cameras.main.shake(160, 0.006);
      this.say(ROSANNA.cut, 0.7);
    } else {
      sfx.slice(rand(0.9, 1.1));
    }
    const px = FX + this.pos.x * CELL;
    const py = FY + this.pos.y * CELL;
    const t = text(this, Phaser.Math.Clamp(px, 20, WIDTH - 20), Phaser.Math.Clamp(py - 10, FY + 10, HEIGHT - 16), `+${points}`, { color: big ? C.pink : C.ocraLight, origin: 0.5 }).setDepth(55);
    this.tweens.add({ targets: t, y: t.y - 16, duration: 700, onComplete: () => t.destroy() });
    this.updateHud();
    if (this.percent >= this.lv.target) this.endRound('win');
  }

  cellOf(px, py) {
    return [Math.floor((px - FX) / CELL), Math.floor((py - FY) / CELL)];
  }

  placePlayer() {
    this.player.setPosition(FX + this.pos.x * CELL + CELL / 2, FY + this.pos.y * CELL + CELL / 2);
  }

  // Redraws the whole Muro on its canvas: pattern where there's still Muro
  // (and under the line), a bright edge where it was cut.
  redrawWall() {
    const ctx = this.fieldTex.getContext();
    const { cells } = this.grid;
    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);
    for (let y = 0; y < ROWS; y++) {
      let x = 0;
      while (x < COLS) {
        if (cells[y * COLS + x] === FREE) {
          x++;
          continue;
        }
        let end = x + 1;
        while (end < COLS && cells[y * COLS + end] !== FREE) end++;
        ctx.drawImage(this.pattern, x * CELL, y * CELL, (end - x) * CELL, CELL, x * CELL, y * CELL, (end - x) * CELL, CELL);
        x = end;
      }
    }
    ctx.fillStyle = C.ocraLight;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (cells[y * COLS + x] === FREE) continue;
        const px = x * CELL;
        const py = y * CELL;
        if (cellAt(this.grid, x - 1, y) === FREE) ctx.fillRect(px, py, 1, CELL);
        if (cellAt(this.grid, x + 1, y) === FREE) ctx.fillRect(px + CELL - 1, py, 1, CELL);
        if (cellAt(this.grid, x, y - 1) === FREE) ctx.fillRect(px, py, CELL, 1);
        if (cellAt(this.grid, x, y + 1) === FREE) ctx.fillRect(px, py + CELL - 1, CELL, 1);
      }
    }
    this.fieldTex.refresh();
  }

  drawTrail() {
    const g = this.trailGfx.clear();
    if (!this.trail.length) return;
    const pts = [...this.trail, this.pos];
    const at = (c) => [FX + c.x * CELL + CELL / 2, FY + c.y * CELL + CELL / 2];
    g.fillStyle(N.pink);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = at(pts[i - 1]);
      const [x1, y1] = at(pts[i]);
      g.fillRect(Math.min(x0, x1) - 1, Math.min(y0, y1) - 1, Math.abs(x1 - x0) + 2, Math.abs(y1 - y0) + 2);
    }
  }

  // Pieces of Muro falling off the field, colored like the Muro they were.
  spawnDebris(indexes, max) {
    const step = Math.max(1, Math.ceil(indexes.length / max));
    for (let k = 0; k < indexes.length; k += step) {
      const i = indexes[k];
      const x = (i % COLS) * CELL;
      const y = Math.floor(i / COLS) * CELL;
      const o = (y * COLS * CELL + x + 1) * 4;
      const color = (this.patternPx[o] << 16) | (this.patternPx[o + 1] << 8) | this.patternPx[o + 2];
      this.debris.push({ x: FX + x, y: FY + y, vx: rand(-40, 40), vy: rand(-90, -10), s: Phaser.Math.Between(2, 4), color });
    }
  }

  updateDebris(dt) {
    const g = this.debrisGfx.clear();
    this.debris = this.debris.filter((d) => {
      d.vy += GRAVITY * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      g.fillStyle(d.color).fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s);
      return d.y < HEIGHT + 8;
    });
  }

  // ---------------------------------------------------------------- drones

  // Drones fly straight inside what's left of the Muro and bounce off its
  // edges. A drone already overlapping free ground (a cut right next to it)
  // flies on until it's clear.
  updateDrones(dt, time) {
    for (const d of this.drones) {
      const stuck = this.blocked(d, d.x, d.y);
      const nx = d.x + d.vx * dt;
      if (!stuck && this.blocked(d, nx, d.y)) d.vx = -d.vx * rand(0.95, 1.05);
      else d.x = nx;
      const ny = d.y + d.vy * dt;
      if (!stuck && this.blocked(d, d.x, ny)) d.vy = -d.vy * rand(0.95, 1.05);
      else d.y = ny;
      d.x = Phaser.Math.Clamp(d.x, FX + CELL + d.hw, FX + (COLS - 1) * CELL - d.hw);
      d.y = Phaser.Math.Clamp(d.y, FY + CELL + d.hh, FY + (ROWS - 1) * CELL - d.hh);
      d.img.setPosition(Math.round(d.x), Math.round(d.y + Math.sin(d.phase + time / 300)));
    }
  }

  // Would the drone's box touch free ground at (x, y)?
  blocked(d, x, y) {
    const [x0, y0] = this.cellOf(x - d.hw, y - d.hh);
    const [x1, y1] = this.cellOf(x + d.hw, y + d.hh);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) if (cellAt(this.grid, cx, cy) === FREE) return true;
    }
    return false;
  }

  // A drone on the line, or on the marker while it's out in the Muro.
  checkHits() {
    if (!this.drawing || this.safeLeft > 0) return;
    const px = FX + this.pos.x * CELL + CELL / 2;
    const py = FY + this.pos.y * CELL + CELL / 2;
    for (const d of this.drones) {
      if (Math.abs(px - d.x) < d.hw + 3 && Math.abs(py - d.y) < d.hh + 3) return this.hit(d);
      const [x0, y0] = this.cellOf(d.x - d.hw, d.y - d.hh);
      const [x1, y1] = this.cellOf(d.x + d.hw, d.y + d.hh);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) if (cellAt(this.grid, cx, cy) === TRAIL) return this.hit(d);
      }
    }
  }

  hit(d) {
    this.lives--;
    sfx.alarm();
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(150, 224, 68, 58);
    d.img.setTint(0xff7070);
    this.time.delayedCall(600, () => d.img.active && d.img.clearTint());
    clearTrail(this.grid);
    this.drawing = false;
    this.trail = [];
    this.pos = { ...this.trailStart };
    this.placePlayer();
    this.safeLeft = SAFE_SECONDS;
    this.updateHud();
    if (this.lives <= 0) {
      banner(this, 'BECCATI!', C.red, 1000);
      this.endRound('caught');
      return;
    }
    banner(this, 'LINEA SPEZZATA!', C.red, 900);
    this.say(ROSANNA.hit);
  }

  // ---------------------------------------------------------------- loop

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000; // clamp: tab switches, iOS hiccups
    if (this.state === 'play') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateHud();
        this.endRound('time');
      } else {
        if (Math.ceil(this.timeLeft) !== Math.ceil(this.timeLeft + dt)) this.updateHud();
        this.safeLeft = Math.max(0, this.safeLeft - dt);
        this.updatePlayer(dt);
        if (this.state === 'play') {
          this.updateDrones(dt, time);
          this.checkHits();
        }
      }
    } else if (this.state === 'ready' || this.state === 'intro') {
      this.updateDrones(dt, time);
    }
    this.player.setVisible(this.safeLeft <= 0 || Math.floor(time / 100) % 2 === 0);
    this.drawTrail();
    this.drawStick();
    this.updateDebris(dt);
  }

  // ---------------------------------------------------------------- end of round

  endRound(result) {
    if (this.state === 'end') return;
    this.state = 'end';
    this.stick = null;
    this.held = [];
    this.stickGfx.clear();

    const win = result === 'win';
    const bonus = endBonus(win, this.percent, this.lv.target, this.timeLeft, this.lives);
    const total = win ? this.score + bonus.muro + bonus.time + bonus.lives : 0;
    const record = win && total > (this.progress.best[this.level] ?? 0);
    if (win) {
      if (record) this.progress.best[this.level] = total;
      this.progress.unlocked = Math.max(this.progress.unlocked, this.level + 1);
      this.save[GAME_ID] = this.progress;
      writeSave(this.save);
    }
    const results = () => this.showResults(result, bonus, total, record);

    if (!win) {
      sfx.lose();
      if (result === 'time') banner(this, 'TEMPO SCADUTO', C.red, 1000);
      this.time.delayedCall(1000, results);
      return;
    }
    // The whole Muro comes down and Torino is there.
    sfx.win();
    this.time.delayedCall(250, () => {
      sfx.crash();
      this.cameras.main.shake(600, 0.012);
      const left = [];
      this.grid.cells.forEach((c, i) => c !== FREE && left.push(i));
      this.spawnDebris(left, 1400);
      this.grid.cells.fill(FREE);
      this.redrawWall();
      this.drones.forEach((d) => this.tweens.add({ targets: d.img, y: -20, x: d.x + rand(-60, 60), duration: 900, ease: 'Quad.in' }));
      banner(this, 'IL MURO CROLLA!', C.ocraLight, 1400, 70);
    });
    this.time.delayedCall(1900, () => {
      this.add.rectangle(0, HEIGHT - 22, WIDTH, 22, N.black, 0.7).setOrigin(0).setDepth(50);
      text(this, WIDTH / 2, HEIGHT - 15, this.lv.name, { color: C.white, origin: [0.5, 0] }).setDepth(51);
    });
    this.time.delayedCall(4200, results);
  }

  showResults(result, bonus, total, record) {
    const win = result === 'win';
    const last = this.level === LEVELS.length - 1;
    const o = overlay(this);
    const P = { x: 60, y: 30, w: 360, h: 212 };
    panel(o.add(this.add.graphics()), P.x, P.y, P.w, P.h, { border: win ? N.ocra : N.red });

    const title = win ? 'MURO ABBATTUTO!' : result === 'caught' ? 'BECCATI!' : 'TEMPO SCADUTO';
    o.add(text(this, WIDTH / 2, P.y + 12, title, { size: 16, color: win ? C.ocraLight : C.red, origin: [0.5, 0] }));
    o.add(text(this, WIDTH / 2, P.y + 34, `${this.lv.name}   ${Math.floor(this.percent)}%`, { color: C.chalkDim, origin: [0.5, 0] }));

    if (win) {
      const rows = [
        ['PUNTI', this.score],
        ['BONUS MURO', bonus.muro],
        ['BONUS TEMPO', bonus.time],
        ['BONUS VITE', bonus.lives],
        ['TOTALE', total],
      ];
      rows.forEach(([k, v], i) => {
        o.add(text(this, P.x + 120, P.y + 54 + i * 12, k, { color: C.paper }));
        o.add(text(this, P.x + P.w - 20, P.y + 54 + i * 12, String(v), { color: i === rows.length - 1 ? C.ocraLight : C.white, origin: [1, 0] }));
      });
    }
    if (record) {
      const r = o.add(text(this, P.x + P.w - 20, P.y + 118, 'NUOVO RECORD!', { color: C.pink, origin: [1, 0] }));
      blink(this, r, 300);
    }

    const g = o.add(this.add.graphics());
    panel(g, P.x + 14, P.y + 52, 96, 96, { fill: N.black, alpha: 1 });
    o.add(this.add.image(P.x + 14, P.y + 52, 'rosanna-96').setOrigin(0));
    const line = win && last ? ROSANNA.final : pick(win ? ROSANNA.win : ROSANNA[result]);
    o.add(text(this, P.x + 120, P.y + (win ? 134 : 60), line, { color: C.white, wrap: P.w - 136, lineSpacing: 4 }));

    const next = () => this.scene.restart({ level: this.level + 1 });
    const retry = () => this.scene.restart({ level: this.level });
    const menu = () => goTo(this, 'Menu');
    const by = P.y + P.h - 26;
    if (win && !last) {
      button(this, o, P.x + 20, by, 'PROSSIMO', next, 96);
      button(this, o, P.x + 132, by, 'RIPROVA', retry, 96);
    } else {
      button(this, o, P.x + 20, by, 'RIPROVA', retry, 96);
    }
    button(this, o, P.x + P.w - 116, by, 'MENU', menu, 96);
    this.endActions = { primary: win && !last ? next : retry, retry, menu };
  }
}
