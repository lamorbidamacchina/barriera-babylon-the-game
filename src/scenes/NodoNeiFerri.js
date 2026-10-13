import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, panel, goTo, fadeIn, droneTexture, overlay, button, banner, typeText, hitArea } from '../ui.js';
import { sfx } from '../sfx.js';
import { loadSave, writeSave } from '../save.js';
import { refreshRecords, beatsRecord } from '../leaderboard.js';
import { drawBarrieraRecord, askNickname } from '../records.js';
import { rng } from '../rng.js';
import { LEVELS, DON_REMO } from '../games/ferri/levels.js';
import { FIELD, MARGIN, KNOT_R, STRIKES, layout, crossings, beamHits, score } from '../games/ferri/rules.js';
import { YARN, SCARF_H, scarfEnd } from '../games/ferri/sprites.js';
import { createTextures, scarfTexture, KNOT_KEY, NEEDLES_KEY, TABLE_KEY, SCARF_TEX_W } from '../games/ferri/textures.js';

const HUD_H = 28;
const GRAB_R = 14; // a finger landing this close to a knot picks it up
const KEY_SPEED = 90; // px per second, moving a knot with the arrow keys
const WARN_SECONDS = 1.5; // the drone is heard before it flies in
const SAFE_SECONDS = 1; // after an X, the beam can't give another one
const SCARF = { x: 414, y: 32 }; // top-left of the scarf on its peg
const GAME_ID = 'ferri'; // in the save and in the Barriera records
const pick = Phaser.Utils.Array.GetRandom;
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] };

// Il nodo nei ferri: Don Remo's tangle of wool. Drag the knots until no thread
// crosses another, without cutting anything, before Irene arrives; a knot
// held under the drone's scan is a suspicious movement (an X). Each tangle
// undone is a stripe of his scarf.
export default class NodoNeiFerri extends Phaser.Scene {
  constructor() {
    super('NodoNeiFerri');
  }

  init(data) {
    this.save = loadSave();
    this.progress = this.save[GAME_ID] ?? { unlocked: 0, best: {} };
    this.level = Phaser.Math.Clamp(data?.level ?? this.progress.unlocked, 0, LEVELS.length - 1);
  }

  create() {
    fadeIn(this);
    refreshRecords();
    this.lv = LEVELS[this.level];
    createTextures(this, FIELD);
    droneTexture(this);

    this.state = 'intro';
    this.add.rectangle(0, 0, WIDTH, HEIGHT, N.night).setOrigin(0);
    this.add.image(FIELD.x, FIELD.y, TABLE_KEY).setOrigin(0);
    this.threadGfx = this.add.graphics().setDepth(5);
    this.markGfx = this.add.graphics().setDepth(12);
    this.beamGfx = this.add.graphics().setDepth(15);
    this.setupScarf();
    this.setupRound();
    this.drawHud();

    this.listenForDrags();
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.input.keyboard.on('keyup', (e) => this.releaseKey(e.code));
    const blur = () => this.dropKnot();
    window.addEventListener('blur', blur);
    this.events.once('shutdown', () => window.removeEventListener('blur', blur));

    this.showIntro();
  }

  // ---------------------------------------------------------------- setup

  setupRound() {
    const { threads, start, solution } = layout(this.lv);
    this.threads = threads;
    this.solution = solution; // where the knots go: for tests and debugging
    // One colour per line as a hint, or the line's colours mixed up.
    const r = rng(this.lv.seed);
    this.colors = threads.map((t) => YARN[this.lv.hintColors ? t.line : Math.floor(r() * this.lv.lines)]);
    this.knots = start.map((p) => ({ ...p, img: this.add.image(p.x, p.y, KNOT_KEY).setDepth(10) }));
    this.timeLeft = this.lv.time;
    this.elapsed = 0;
    this.strikes = 0;
    this.moves = 0;
    this.safeLeft = 0;
    this.drag = null; // { pointer, knot, ox, oy, from } while a finger or the mouse holds a knot
    this.selected = -1; // the knot the keyboard moves (Tab)
    this.keyMove = null; // { knot, from } while arrow keys move it
    this.held = []; // arrow keys held down
    this.drone = { phase: 'idle', next: this.lv.drone.first, dir: 1, img: this.add.image(-40, FIELD.y + 12, 'drone').setScale(2).setDepth(16) };
    this.droneShadow = this.add.ellipse(0, FIELD.y + 20, 30, 8, N.black, 0.45).setDepth(14).setVisible(false);
    this.recount();
    this.drawThreads();
  }

  // The scarf with the stripes knitted so far, and the needles under them.
  setupScarf() {
    this.stripes = this.stripesUpTo(this.progress.unlocked);
    this.scarf = this.add.image(SCARF.x, SCARF.y, scarfTexture(this, this.stripes)).setOrigin(0).setDepth(2);
    this.needles = this.add.image(SCARF.x + SCARF_TEX_W / 2, 0, NEEDLES_KEY).setDepth(3);
    this.showScarf(scarfEnd(this.stripes.length));
  }

  stripesUpTo(n) {
    return LEVELS.slice(0, Math.min(n, LEVELS.length)).map((l) => ({ pattern: l.stripe, colors: YARN.slice(0, l.lines) }));
  }

  showScarf(h) {
    this.scarf.setCrop(0, 0, SCARF_TEX_W, Math.min(h, SCARF_H));
    this.needles.setY(SCARF.y + h);
  }

  drawHud() {
    this.add.rectangle(0, 0, WIDTH, HUD_H, N.black, 0.85).setOrigin(0).setDepth(60);
    this.crossText = text(this, 8, 10, '', { color: C.ocraLight }).setDepth(61);
    text(this, 200, 10, 'IRENE', { color: C.chalkDim }).setDepth(61);
    this.timeText = text(this, 290, 10, '', { color: C.white, origin: [1, 0] }).setDepth(61);
    this.strikeIcons = [0, 1, 2].map((i) => text(this, 384 + i * 16, 10, 'X', { color: C.red }).setDepth(61));
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
    const n = this.tangle.count;
    this.crossText.setText(n ? `INCROCI ${n}` : 'SCIOLTO!').setColor(n ? C.ocraLight : '#9be36b');
    const s = Math.max(0, Math.ceil(this.timeLeft));
    this.timeText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`).setColor(s <= 10 ? C.red : C.white);
    this.strikeIcons.forEach((icon, i) => icon.setColor(i < this.strikes ? C.red : '#3a4560'));
  }

  // Don Remo's comments, briefly, at the bottom of the table.
  say(lines, chance = 1) {
    if (Math.random() > chance) return;
    this.bubble?.destroy();
    const line = typeof lines === 'string' ? lines : pick(lines);
    const t = (this.bubble = text(this, 14, FIELD.y + FIELD.h - 18, line, { color: C.white }).setDepth(55));
    const bg = this.add.rectangle(10, FIELD.y + FIELD.h - 22, t.width + 8, t.height + 8, N.black, 0.6).setOrigin(0).setDepth(54);
    t.once('destroy', () => bg.destroy());
    this.time.delayedCall(2800, () => t.active && t.destroy());
  }

  // ---------------------------------------------------------------- overlays

  showIntro() {
    this.state = 'intro';
    const o = (this.introUi = overlay(this));
    const P = { x: 20, y: 36, w: 440, h: 206 };
    panel(o.add(this.add.graphics()), P.x, P.y, P.w, P.h);

    const g = o.add(this.add.graphics());
    panel(g, P.x + 12, P.y + 14, 96, 96, { fill: N.black, alpha: 1 });
    o.add(this.add.image(P.x + 12, P.y + 14, 'don-remo-96').setOrigin(0));
    drawBarrieraRecord(this, o, GAME_ID, this.level, P.x + 60, P.y + 116, ['DON', 'REMO']);

    const X = P.x + 124;
    const unlocked = Math.min(this.progress.unlocked, LEVELS.length - 1);
    o.add(text(this, X, P.y + 12, `NODO ${this.level + 1}/${LEVELS.length}`, { color: C.chalkDim }));
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
    o.add(text(this, X, P.y + 46, 'NESSUN FILO INCROCIATO', { color: C.white }));
    o.add(text(this, X, P.y + 60, `TEMPO ${this.lv.time}s   ${this.knots.length} GOMITOLI`, { color: C.chalkDim }));
    o.add(text(this, X, P.y + 71, `DRONE OGNI ${this.lv.drone.every}s`, { color: C.chalkDim }));
    const best = this.progress.best[this.level];
    if (best) {
      o.add(text(this, P.x + 60, P.y + 152, 'TUO RECORD', { color: C.chalkDim, origin: [0.5, 0] }));
      o.add(text(this, P.x + 60, P.y + 163, String(best), { color: C.chalkDim, origin: [0.5, 0] }));
    }

    const order = o.add(text(this, X, P.y + 90, '', { color: C.white, wrap: 300, lineSpacing: 5 }));
    typeText(this, order, this.lv.order);

    const touch = matchMedia('(pointer: coarse)').matches;
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
    this.drag = null; // the tap that started the game doesn't grab
    sfx.confirm();
    banner(this, 'PRONTI...', C.white, 700);
    this.time.delayedCall(800, () => {
      sfx.start();
      banner(this, 'VIA!', C.ocraLight, 600);
      this.state = 'play';
      this.say(this.level === 0 && !this.progress.unlocked ? DON_REMO.first : DON_REMO.start);
    });
  }

  pause() {
    this.dropKnot();
    this.state = 'pause';
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
    } else if (this.state === 'play') {
      if (e.code === 'Tab') {
        e.preventDefault(); // not out of the game
        this.dropKnot();
        const n = this.knots.length;
        this.selected = this.selected < 0 ? 0 : (this.selected + (e.shiftKey ? n - 1 : 1)) % n;
        sfx.move();
      } else if (DIRS[e.code]) {
        e.preventDefault();
        if (this.selected < 0) this.selected = 0;
        if (this.drag) return;
        this.held = this.held.filter((k) => k !== e.code).concat(e.code);
        if (!this.keyMove) {
          const k = this.knots[this.selected];
          this.keyMove = { knot: this.selected, from: { x: k.x, y: k.y } };
          sfx.blip();
        }
      } else if (['Escape', 'KeyP'].includes(e.code)) this.pause();
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
    if (!this.held.length && this.keyMove) this.finishMove(this.keyMove);
  }

  // ---------------------------------------------------------------- dragging

  // Knots are dragged with the browser's pointer events on the whole window,
  // like the Contrabbando swipes (see listenForSwipes there for the iOS
  // reasons). Buttons and menus still use Phaser.
  listenForDrags() {
    const toGame = (e) => {
      const r = this.game.canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * WIDTH) / r.width, y: ((e.clientY - r.top) * HEIGHT) / r.height };
    };
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (this.state !== 'play' || this.keyMove) return;
      const p = toGame(e);
      if (p.y < HUD_H) return; // the pause button
      let best = -1;
      let bestD = GRAB_R;
      this.knots.forEach((k, i) => {
        const d = Math.hypot(k.x - p.x, k.y - p.y);
        if (d < bestD) (best = i), (bestD = d);
      });
      if (best < 0) return;
      const k = this.knots[best];
      this.drag = { pointer: e.pointerId, knot: best, ox: k.x - p.x, oy: k.y - p.y, from: { x: k.x, y: k.y } };
      this.selected = best;
      sfx.blip();
    };
    const move = (e) => {
      if (!this.drag || e.pointerId !== this.drag.pointer || this.state !== 'play') return;
      const p = toGame(e);
      this.moveKnot(this.drag.knot, p.x + this.drag.ox, p.y + this.drag.oy);
    };
    const up = (e) => {
      if (!this.drag || e.pointerId !== this.drag.pointer) return;
      const d = this.drag;
      this.drag = null;
      if (this.state === 'play') this.finishMove(d);
    };
    const handlers = { pointerdown: down, pointermove: move, pointerup: up, pointercancel: up };
    for (const [ev, fn] of Object.entries(handlers)) window.addEventListener(ev, fn);
    this.events.once('shutdown', () => {
      for (const [ev, fn] of Object.entries(handlers)) window.removeEventListener(ev, fn);
    });
  }

  moveKnot(i, x, y) {
    const k = this.knots[i];
    k.x = Phaser.Math.Clamp(x, FIELD.x + MARGIN, FIELD.x + FIELD.w - MARGIN);
    k.y = Phaser.Math.Clamp(y, FIELD.y + MARGIN, FIELD.y + FIELD.h - MARGIN);
    k.img.setPosition(Math.round(k.x), Math.round(k.y));
    this.recount();
    this.updateHud();
  }

  // A knot let go: one move, if it went anywhere. Untangled → won.
  finishMove({ knot, from }) {
    this.keyMove = null;
    this.held = [];
    const k = this.knots[knot];
    if (Math.hypot(k.x - from.x, k.y - from.y) < 2) return;
    this.moves++;
    sfx.move();
    if (this.tangle.count === 0) this.endRound('win');
  }

  // The knot in hand (finger, mouse or arrow keys), or -1.
  heldKnot() {
    return this.drag?.knot ?? this.keyMove?.knot ?? -1;
  }

  // Let go without it counting as a move (pause, focus lost).
  dropKnot() {
    this.drag = null;
    this.keyMove = null;
    this.held = [];
  }

  recount() {
    this.tangle = crossings(this.knots, this.threads, KNOT_R);
  }

  // ---------------------------------------------------------------- drawing

  drawThreads() {
    const g = this.threadGfx.clear();
    const { bad, points } = this.tangle;
    this.threads.forEach((t, i) => {
      const a = this.knots[t.a];
      const b = this.knots[t.b];
      // Tangled threads thin and faded, free ones full and thick.
      if (bad.has(i)) g.lineStyle(1, this.colors[i], 0.6);
      else g.lineStyle(2, this.colors[i], 1);
      g.lineBetween(a.x, a.y, b.x, b.y);
    });
    const m = this.markGfx.clear();
    for (const p of points) {
      m.fillStyle(N.black, 1).fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 5, 5);
      m.fillStyle(N.red, 1).fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3);
    }
    // The knot in hand stands out; the keyboard's choice gets a ring.
    const held = this.heldKnot();
    this.knots.forEach((k, i) => k.img.setScale(i === held ? 1.3 : 1));
    if (this.selected >= 0 && this.state === 'play' && !this.drag) {
      const k = this.knots[this.selected];
      m.lineStyle(1, N.ocraLight, 1).strokeCircle(k.x, k.y, 9);
    }
  }

  // ---------------------------------------------------------------- the drone

  // Idle until its time comes, then heard (warn), then flies across the table
  // dragging its scan. Passes alternate between left→right and right→left.
  updateDrone(dt, time) {
    const d = this.drone;
    const { band, speed, every } = this.lv.drone;
    if (d.phase === 'idle') {
      if (this.elapsed < d.next) return;
      d.phase = 'warn';
      d.t = WARN_SECONDS;
      d.x = d.dir > 0 ? FIELD.x - 30 : FIELD.x + FIELD.w + 30;
      sfx.drone();
      this.say(DON_REMO.drone);
      this.droneShadow.setVisible(true).setPosition(d.dir > 0 ? FIELD.x + 16 : FIELD.x + FIELD.w - 16, FIELD.y + 20);
    } else if (d.phase === 'warn') {
      d.t -= dt;
      this.droneShadow.setAlpha(0.25 + 0.25 * Math.sin(time / 80));
      if (d.t <= 0) {
        d.phase = 'fly';
        this.droneShadow.setVisible(false);
      }
    } else {
      d.x += d.dir * speed * dt;
      if (Math.floor(time / 600) !== Math.floor((time - dt * 1000) / 600)) sfx.drone();
      const k = this.heldKnot();
      if (k >= 0 && this.safeLeft <= 0 && beamHits(this.knots[k].x, d.x, band / 2)) {
        this.strike(k);
        if (this.state !== 'play') return; // the third X: endRound has cleared the scan
      }
      if ((d.dir > 0 && d.x > FIELD.x + FIELD.w + 30) || (d.dir < 0 && d.x < FIELD.x - 30)) {
        d.phase = 'idle';
        d.dir = -d.dir;
        d.next = this.elapsed + every;
      }
    }
    d.img.setPosition(Math.round(d.x), FIELD.y + 10 + Math.round(Math.sin(time / 200) * 2));
    this.drawBeam();
  }

  drawBeam() {
    const g = this.beamGfx.clear();
    const d = this.drone;
    if (d.phase !== 'fly') return;
    const half = this.lv.drone.band / 2;
    const top = FIELD.y + 16;
    g.fillStyle(N.droneLight, 0.16).fillRect(d.x - half, top, half * 2, FIELD.y + FIELD.h - top);
    g.fillStyle(N.droneLight, 0.4).fillRect(d.x - half, top, 1, FIELD.y + FIELD.h - top).fillRect(d.x + half - 1, top, 1, FIELD.y + FIELD.h - top);
  }

  // Caught moving a knot under the scan: an X, and the knot goes back where
  // the move started.
  strike(i) {
    const from = (this.drag ?? this.keyMove).from;
    this.dropKnot();
    this.moveKnot(i, from.x, from.y);
    this.strikes++;
    this.safeLeft = SAFE_SECONDS;
    sfx.alarm();
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(150, 224, 68, 58);
    this.updateHud();
    if (this.strikes >= STRIKES) {
      banner(this, 'FASCICOLO APERTO!', C.red, 1000);
      this.endRound('strikes');
      return;
    }
    banner(this, 'MOVIMENTO SOSPETTO!', C.red, 900);
    this.say(DON_REMO.caught);
  }

  // ---------------------------------------------------------------- loop

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000; // clamp: tab switches, iOS hiccups
    if (this.state === 'play') {
      this.timeLeft -= dt;
      this.elapsed += dt;
      this.safeLeft = Math.max(0, this.safeLeft - dt);
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateHud();
        this.endRound('time');
      } else {
        if (Math.ceil(this.timeLeft) !== Math.ceil(this.timeLeft + dt)) this.updateHud();
        this.moveWithKeys(dt);
        this.updateDrone(dt, time);
      }
    }
    if (this.state !== 'end') this.drawThreads();
  }

  moveWithKeys(dt) {
    if (!this.keyMove || !this.held.length) return;
    const [dx, dy] = DIRS[this.held[this.held.length - 1]];
    const k = this.knots[this.keyMove.knot];
    this.moveKnot(this.keyMove.knot, k.x + dx * KEY_SPEED * dt, k.y + dy * KEY_SPEED * dt);
  }

  // ---------------------------------------------------------------- end of round

  endRound(result) {
    if (this.state === 'end') return;
    this.state = 'end';
    this.dropKnot();
    this.beamGfx.clear();
    this.droneShadow.setVisible(false);

    const win = result === 'win';
    const s = score({ knots: this.knots.length, timeLeft: this.timeLeft, strikes: this.strikes, moves: this.moves });
    const total = win ? s.total : 0;
    const record = win && total > (this.progress.best[this.level] ?? 0);
    const barriera = win && beatsRecord(GAME_ID, this.level, total);
    if (win) {
      if (record) this.progress.best[this.level] = total;
      this.progress.unlocked = Math.max(this.progress.unlocked, this.level + 1);
      this.save[GAME_ID] = this.progress;
      writeSave(this.save);
    }
    const results = (named) => this.showResults(result, s, total, record, named);
    this.tweens.add({ targets: this.drone.img, y: -30, duration: 700, ease: 'Quad.in' });

    if (!win) {
      sfx.lose();
      if (result === 'time') banner(this, "IRENE E' ARRIVATA", C.red, 1000);
      this.time.delayedCall(1100, () => results(false));
      return;
    }
    sfx.win();
    this.drawThreads();
    banner(this, 'NODO SCIOLTO!', C.ocraLight, 1200, 80);
    // The knots and their threads slide into the scarf...
    const end = { x: SCARF.x + SCARF_TEX_W / 2, y: SCARF.y + scarfEnd(this.level) };
    const from = this.knots.map((k) => ({ x: k.x, y: k.y }));
    this.time.delayedCall(900, () => {
      this.markGfx.clear();
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 900,
        ease: 'Quad.in',
        onUpdate: (tw) => {
          const t = tw.getValue();
          this.knots.forEach((k, i) => {
            k.x = from[i].x + (end.x - from[i].x) * t;
            k.y = from[i].y + (end.y - from[i].y) * t;
            k.img.setPosition(k.x, k.y).setAlpha(1 - t * 0.8).setScale(1 - t * 0.6);
          });
          this.drawThreads();
          this.threadGfx.setAlpha(1 - t);
        },
        onComplete: () => this.knitStripe(() => {
          if (barriera) askNickname(this, { game: GAME_ID, level: this.level, points: s.knots, total, portrait: 'don-remo-96', line: pick(DON_REMO.record) }, results);
          else results(false);
        }),
      });
    });
  }

  // ...and the stripe is knitted a row at a time, the needles going down.
  knitStripe(done) {
    this.knots.forEach((k) => k.img.setVisible(false));
    this.threadGfx.clear();
    this.stripes = this.stripesUpTo(this.progress.unlocked);
    this.scarf.setTexture(scarfTexture(this, this.stripes)).setOrigin(0);
    const from = scarfEnd(this.level);
    const to = scarfEnd(this.stripes.length);
    let h = from;
    this.showScarf(h);
    this.time.addEvent({
      delay: 40,
      repeat: to - from - 1,
      callback: () => {
        h++;
        this.showScarf(h);
        if (h % 3 === 0) sfx.tick();
        if (h === to) this.time.delayedCall(700, done);
      },
    });
  }

  showResults(result, s, total, record, barriera) {
    const win = result === 'win';
    const last = this.level === LEVELS.length - 1;
    const o = overlay(this);
    const P = { x: 40, y: 30, w: 360, h: 212 }; // left of the scarf: it stays in view
    panel(o.add(this.add.graphics()), P.x, P.y, P.w, P.h, { border: win ? N.ocra : N.red });

    const title = win ? 'NODO SCIOLTO!' : result === 'time' ? "IRENE E' ARRIVATA" : 'FASCICOLO APERTO';
    o.add(text(this, P.x + P.w / 2, P.y + 12, title, { size: 16, color: win ? C.ocraLight : C.red, origin: [0.5, 0] }));
    o.add(text(this, P.x + P.w / 2, P.y + 34, `${this.lv.name}   ${this.moves} MOSSE`, { color: C.chalkDim, origin: [0.5, 0] }));

    if (win) {
      const rows = [
        ['GOMITOLI', s.knots],
        ['BONUS TEMPO', s.time],
        ['BONUS X', s.strikes],
        ['BONUS MOSSE', s.moves],
        ['TOTALE', total],
      ];
      rows.forEach(([k, v], i) => {
        o.add(text(this, P.x + 120, P.y + 54 + i * 12, k, { color: C.paper }));
        o.add(text(this, P.x + P.w - 20, P.y + 54 + i * 12, String(v), { color: i === rows.length - 1 ? C.ocraLight : C.white, origin: [1, 0] }));
      });
    }
    if (record || barriera) {
      const label = barriera ? 'RECORD DI BARRIERA!' : 'NUOVO RECORD!';
      const r = o.add(text(this, P.x + P.w - 20, P.y + 118, label, { color: C.pink, origin: [1, 0] }));
      blink(this, r, 300);
    }

    const g = o.add(this.add.graphics());
    panel(g, P.x + 14, P.y + 52, 96, 96, { fill: N.black, alpha: 1 });
    o.add(this.add.image(P.x + 14, P.y + 52, 'don-remo-96').setOrigin(0));
    const line = win ? this.lv.win : pick(DON_REMO[result]);
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
