import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, panel, goTo, fadeIn, overlay, button, banner, typeText, hitArea, droneTexture } from '../ui.js';
import { sfx } from '../sfx.js';
import { loadSave, writeSave } from '../save.js';
import { refreshRecords, beatsRecord } from '../leaderboard.js';
import { drawBarrieraRecord, askNickname } from '../records.js';
import { LEVELS, ROSANNA, BAR } from '../games/ruspe/levels.js';
import { FIELD, TILE, COLS, ROWS, STEP, createRound, useTool, step, position, score, forecast, patrolCells, SIM_DT, MARBLES_TIME, FOAM_TIME } from '../games/ruspe/rules.js';
import { createTextures, MAP_KEY, RUSPA_KEY, signKey, CURSOR_KEY, MARBLES_KEY, FOAM_KEY, faceKey } from '../games/ruspe/textures.js';

const HUD_H = FIELD.y;
const BAR_Y = FIELD.y + FIELD.h; // the tool bar, under the map
const TOOL_W = 60;
const SAY_W = 320; // Rosanna's lines: 40 characters a line
const GAME_ID = 'ruspe'; // in the save and in the Barriera records
const KIDS = { teresa: { name: 'TERESA', what: 'CARTELLO' }, chiara: { name: 'CHIARA', what: 'BIGLIE' }, gigi: { name: 'GIGI', what: 'SCHIUMA' } };
// What Chiara and Gigi leave on the street: texture, and how long it lasts.
const SPREAD = { marbles: { key: MARBLES_KEY, life: MARBLES_TIME }, foam: { key: FOAM_KEY, life: FOAM_TIME } };
const pick = Phaser.Utils.Array.GetRandom;
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] };
const cellCenter = (x, y) => ({ x: FIELD.x + x * TILE + TILE / 2, y: FIELD.y + y * TILE + TILE / 2 });

// Ruspe in fuga: the Muro bulldozers drive themselves and follow the signs.
// The Comitato Caos changes the signs (and more, one kid per tool) to send
// them into the shopping mall by the back entrance, before time runs out.
export default class RuspeInFuga extends Phaser.Scene {
  constructor() {
    super('RuspeInFuga');
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
    createTextures(this, this.level, this.lv);

    this.state = 'intro';
    this.add.rectangle(0, 0, WIDTH, HEIGHT, N.night).setOrigin(0);
    this.add.image(FIELD.x, FIELD.y, MAP_KEY(this.level)).setOrigin(0);
    this.round = createRound(this.lv);
    this.ruspaImgs = new Map(); // bulldozer id → image
    this.signImgs = new Map(); // cell key → image
    this.spreadImgs = { marbles: new Map(), foam: new Map() }; // cell key → image
    this.resets = 0; // signs the drone has put back
    this.setupDrone();
    this.hover = this.add.image(0, 0, CURSOR_KEY).setOrigin(0).setDepth(20).setVisible(false);
    this.cursor = null; // the keyboard's cell, once the arrows are used
    this.syncSigns();
    this.drawHud();
    this.drawToolBar();

    this.input.on('pointerdown', (p) => this.onTap(p));
    this.input.on('pointermove', (p) => this.onHover(p));
    this.input.keyboard.on('keydown', (e) => this.onKey(e));

    this.showIntro();
  }

  // The guide drone over its patrol, drawn as a faint dotted line so its
  // round can be planned around.
  setupDrone() {
    if (!this.round.drone) return;
    droneTexture(this);
    const g = this.add.graphics().setDepth(4);
    const { path } = this.lv.drone;
    // Its zone, tinted: no sign there lasts.
    g.fillStyle(N.droneLight, 0.2);
    for (const [x, y] of patrolCells(path)) g.fillRect(FIELD.x + x * TILE, FIELD.y + y * TILE, TILE, TILE);
    g.fillStyle(N.droneLight, 0.35);
    path.forEach(([x, y], i) => {
      const [nx, ny] = path[(i + 1) % path.length];
      const a = cellCenter(x, y);
      const b = cellCenter(nx, ny);
      const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 4;
      for (let k = 0; k <= n; k++) g.fillRect(Math.round(a.x + ((b.x - a.x) * k) / n) - 1, Math.round(a.y + ((b.y - a.y) * k) / n) - 1, 2, 2);
    });
    this.droneShadow = this.add.ellipse(0, 0, 34, 10, N.black, 0.4).setDepth(14);
    this.droneImg = this.add.image(0, 0, 'drone').setScale(3).setDepth(16);
    this.drawDrone(0);
  }

  drawDrone(time) {
    const d = this.round.drone;
    if (!d) return;
    const c = cellCenter(d.x, d.y);
    this.droneShadow.setPosition(Math.round(c.x), Math.round(c.y) + 6);
    this.droneImg.setPosition(Math.round(c.x), Math.round(c.y) - 14 + Math.round(Math.sin(time / 200) * 2));
  }

  // ---------------------------------------------------------------- HUD and tool bar

  drawHud() {
    this.add.rectangle(0, 0, WIDTH, HUD_H, N.black, 0.85).setOrigin(0).setDepth(60);
    this.inText = text(this, 8, 7, '', { color: C.ocraLight }).setDepth(61);
    this.outText = text(this, 150, 7, '', { color: C.chalkDim }).setDepth(61);
    this.timeText = text(this, 420, 7, '', { color: C.white, origin: [1, 0] }).setDepth(61);
    // Offered when the tools are used up and the bulldozers won't make it.
    const rb = (this.retryBtn = this.add.rectangle(262, 2, 80, 18, N.night2).setOrigin(0).setDepth(61).setStrokeStyle(1, N.red));
    this.retryText = text(this, 302, 7, 'RIPROVA', { color: C.red, origin: [0.5, 0] }).setDepth(62);
    rb.setInteractive({ ...hitArea(80, 18, 4, 2), useHandCursor: true }).on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      if (rb.visible && this.state === 'play') this.scene.restart({ level: this.level });
    });
    this.showRetry(false);
    // Pause button (mainly for touch).
    const pb = this.add.rectangle(446, 2, 30, 18, N.night2).setOrigin(0).setDepth(61).setStrokeStyle(1, N.ocra);
    text(this, 461, 7, 'II', { color: C.ocraLight, origin: [0.5, 0] }).setDepth(62);
    pb.setInteractive({ ...hitArea(30, 18, 4, 2), useHandCursor: true }).on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      if (this.state === 'play') this.pause();
    });
    this.updateHud();
  }

  showRetry(on) {
    this.retryBtn.setVisible(on);
    this.retryText.setVisible(on);
  }

  updateHud() {
    const r = this.round;
    this.inText.setText(`DENTRO ${r.inside}/${this.lv.need}`).setColor(r.inside >= this.lv.need ? '#9be36b' : C.ocraLight);
    this.outText.setText(`RUSPE ${r.spawned}/${this.lv.count}`);
    const s = Math.max(0, Math.ceil(r.timeLeft));
    this.timeText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`).setColor(s <= 10 ? C.red : C.white);
  }

  // One button per kid on the left, with how many uses are left. The right
  // end stays empty: the page's sound and fullscreen buttons sit there.
  drawToolBar() {
    this.add.rectangle(0, BAR_Y, WIDTH, HEIGHT - BAR_Y, N.black, 0.85).setOrigin(0).setDepth(60);
    this.toolIds = Object.keys(this.lv.tools);
    this.tool = this.toolIds[0];
    this.toolUi = this.toolIds.map((id, i) => {
      const x = 4 + i * (TOOL_W + 4);
      const y = BAR_Y + 1;
      const h = HEIGHT - BAR_Y - 2;
      const bg = this.add.rectangle(x, y, TOOL_W, h, N.night2).setOrigin(0).setDepth(61);
      this.add.image(x + 2, y + 1, faceKey(id)).setOrigin(0).setDepth(62);
      text(this, x + 26, y + 7, String(i + 1), { color: C.chalkDim }).setDepth(62);
      const count = text(this, x + TOOL_W - 3, y + 7, '', { color: C.white, origin: [1, 0] }).setDepth(62);
      // The bar is low: the buttons also take taps a little above it.
      bg.setInteractive({ ...hitArea(TOOL_W, h, 2, 6), useHandCursor: true }).on('pointerdown', (p, lx, ly, e) => {
        e.stopPropagation();
        if (this.state === 'play' || this.state === 'ready') this.selectTool(id);
      });
      return { id, bg, count };
    });
    this.toolName = text(this, 4 + this.toolIds.length * (TOOL_W + 4) + 4, BAR_Y + 8, '', { color: C.ocraLight }).setDepth(62);
    this.updateToolBar();
  }

  updateToolBar() {
    for (const t of this.toolUi) {
      const left = this.round.tools[t.id];
      t.bg.setStrokeStyle(t.id === this.tool ? 2 : 1, t.id === this.tool ? N.ocraLight : N.night3);
      t.count.setText(`x${left}`).setColor(left ? C.white : C.red);
    }
    const k = KIDS[this.tool];
    this.toolName.setText(`${k.name}: ${k.what}`);
  }

  selectTool(id) {
    if (this.tool === id) return;
    this.tool = id;
    sfx.move();
    this.updateToolBar();
  }

  // Rosanna's comments, briefly, on a dark strip at the top of the map: the
  // maps keep their top row for buildings.
  say(lines, chance = 1) {
    if (Math.random() > chance) return;
    this.bubble?.destroy();
    const line = typeof lines === 'string' ? lines : pick(lines);
    const t = (this.bubble = text(this, 10, FIELD.y + 6, line, { color: C.white, wrap: SAY_W }).setDepth(55));
    const bg = this.add.rectangle(6, t.y - 4, t.width + 8, t.height + 8, N.black, 0.7).setOrigin(0).setDepth(54);
    t.once('destroy', () => bg.destroy());
    this.time.delayedCall(3200, () => t.active && t.destroy());
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
    drawBarrieraRecord(this, o, GAME_ID, this.level, P.x + 60, P.y + 116, ['MAESTRA', 'ROSANNA']);

    const X = P.x + 124;
    const unlocked = Math.min(this.progress.unlocked, LEVELS.length - 1);
    o.add(text(this, X, P.y + 12, `NOTTE ${this.level + 1}/${LEVELS.length}`, { color: C.chalkDim }));
    if (unlocked > 0) {
      // A greyed arrow still swallows the tap: a near miss must not start the game.
      const stepBtn = (label, x, dir, enabled) => {
        if (enabled) return button(this, o, x, P.y + 6, label, () => this.changeLevel(dir), 44);
        const bg = o.add(this.add.rectangle(x, P.y + 6, 44, 18, N.night).setOrigin(0).setStrokeStyle(1, N.night3));
        bg.setInteractive(hitArea(44, 18)).on('pointerdown', (p, lx, ly, e) => e.stopPropagation());
        o.add(text(this, x + 22, P.y + 11, label, { color: '#3a4560', origin: [0.5, 0], shadow: null }));
      };
      stepBtn('<', P.x + P.w - 108, -1, this.level > 0);
      stepBtn('>', P.x + P.w - 56, 1, this.level < unlocked);
    }
    o.add(text(this, X, P.y + 28, this.lv.name, { color: C.ocraLight, wrap: 300 }));
    o.add(text(this, X, P.y + 46, `${this.lv.need} RUSPE SU ${this.lv.count} DENTRO`, { color: C.white }));
    o.add(text(this, X, P.y + 60, `TEMPO ${this.lv.time}s`, { color: C.chalkDim }));
    const tools = this.toolIds.map((id) => `${KIDS[id].name} x${this.lv.tools[id]}`).join('  ');
    o.add(text(this, X, P.y + 71, tools, { color: C.chalkDim }));
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
    this.startedAt = this.time.now; // the tap that started the game places nothing
    sfx.confirm();
    banner(this, 'PRONTI...', C.white, 700);
    this.time.delayedCall(800, () => {
      sfx.start();
      banner(this, 'VIA!', C.ocraLight, 600);
      this.state = 'play';
      this.say(this.progress.unlocked <= this.level ? this.lv.tip : ROSANNA.start);
    });
  }

  pause() {
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
      const n = Number(e.key);
      if (n >= 1 && n <= this.toolIds.length) this.selectTool(this.toolIds[n - 1]);
      else if (DIRS[e.code]) {
        e.preventDefault();
        this.moveCursor(...DIRS[e.code]);
      } else if (['Enter', 'Space'].includes(e.code)) {
        e.preventDefault();
        if (!this.cursor) this.moveCursor(0, 0);
        else this.apply(this.cursor.x, this.cursor.y);
      } else if (['Escape', 'KeyP'].includes(e.code)) this.pause();
      else if (e.code === 'KeyR' && this.retryBtn.visible) this.scene.restart({ level: this.level });
    } else if (this.state === 'pause') {
      if (['Escape', 'KeyP', 'Enter', 'Space'].includes(e.code)) this.resume();
    } else if (this.state === 'end' && this.endActions) {
      if (['Enter', 'Space'].includes(e.code)) this.endActions.primary();
      else if (e.code === 'KeyR') this.endActions.retry();
      else if (e.code === 'Escape') this.endActions.menu();
    }
  }

  // ---------------------------------------------------------------- using the tools

  cellAt(p) {
    const x = Math.floor((p.x - FIELD.x) / TILE);
    const y = Math.floor((p.y - FIELD.y) / TILE);
    return x >= 0 && y >= 0 && x < COLS && y < ROWS ? { x, y } : null;
  }

  onTap(p) {
    if (this.state !== 'play' || this.time.now - this.startedAt < 900) return;
    if (p.button !== 0 && p.event?.pointerType === 'mouse') return;
    const c = this.cellAt(p);
    if (c) this.apply(c.x, c.y);
  }

  onHover(p) {
    const c = this.state === 'play' && p.pointerType !== 'touch' && !p.wasTouch ? this.cellAt(p) : null;
    this.hover.setVisible(!!c && !this.cursor);
    if (c) this.hover.setPosition(FIELD.x + c.x * TILE, FIELD.y + c.y * TILE);
  }

  // The keyboard cursor starts at the gate and moves a cell at a time.
  moveCursor(dx, dy) {
    if (!this.cursor) {
      const g = this.round.map.gates[0];
      this.cursor = { x: g.x + STEP[g.dir][0], y: g.y + STEP[g.dir][1] };
    } else {
      this.cursor.x = Phaser.Math.Clamp(this.cursor.x + dx, 0, COLS - 1);
      this.cursor.y = Phaser.Math.Clamp(this.cursor.y + dy, 0, ROWS - 1);
    }
    this.hover.setVisible(true).setPosition(FIELD.x + this.cursor.x * TILE, FIELD.y + this.cursor.y * TILE);
    sfx.blip();
  }

  apply(x, y) {
    const res = useTool(this.round, this.tool, x, y);
    if (!res.ok) {
      sfx.error();
      if (res.empty) this.say(ROSANNA.empty);
      return;
    }
    if (res.free) sfx.move();
    else sfx.confirm();
    this.syncSigns();
    this.updateToolBar();
    const img = this.signImgs.get(`${x},${y}`);
    if (img) this.tweens.add({ targets: img, scale: { from: 1.8, to: 1 }, duration: 160, ease: 'Back.out' });
    this.checkHopeless();
  }

  // With every tool used up the rest of the round is already written: play
  // it ahead. If it's lost and nothing can change any more, end it now; if
  // Teresa's own signs can still be turned, say so and offer a retry.
  checkHopeless() {
    if (Object.values(this.round.tools).some((n) => n > 0)) return;
    const lost = forecast(this.round) !== 'win';
    this.showRetry(lost);
    if (!lost) return;
    if (![...this.round.signs.values()].some((s) => s.mine)) {
      this.endRound('hopeless');
      return;
    }
    if (!this.warnedHopeless) this.say(ROSANNA.hopeless);
    this.warnedHopeless = true;
  }

  // One image per sign on the map, turned to where it points.
  syncSigns() {
    for (const [k, s] of this.round.signs) {
      let img = this.signImgs.get(k);
      if (!img) {
        const [x, y] = k.split(',').map(Number);
        const c = cellCenter(x, y);
        // Above the bulldozers: a 28 px bulldozer on a crossing would hide the arrow.
        img = this.add.image(c.x, c.y, signKey('official', s.dir)).setDepth(11);
        this.signImgs.set(k, img);
      }
      img.setTexture(signKey(s.mine ? 'mine' : 'official', s.dir));
    }
    for (const [k, img] of this.signImgs) {
      if (!this.round.signs.has(k)) {
        img.destroy();
        this.signImgs.delete(k);
      }
    }
  }

  // ---------------------------------------------------------------- loop

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000; // clamp: tab switches, iOS hiccups
    if (this.state !== 'play') return;
    const before = Math.ceil(this.round.timeLeft);
    // The rules in fixed steps, as many as the frame took: the round then
    // plays out exactly as forecast() and the tests play it.
    this.simTime = (this.simTime ?? 0) + dt;
    const events = [];
    while (this.simTime >= SIM_DT && !this.round.result) {
      this.simTime -= SIM_DT;
      step(this.round, SIM_DT);
      events.push(...this.round.events);
    }
    for (const ev of events) {
      if (this.state !== 'play') break;
      this.onEvent(ev);
    }
    if (this.state !== 'play') return; // ended by an event (nothing left to do)
    this.drawRuspe(time);
    this.drawSpread(time);
    this.drawDrone(time);
    if (Math.ceil(this.round.timeLeft) !== before || events.length) this.updateHud();
    if (this.round.result) this.endRound(this.round.result);
  }

  onEvent(ev) {
    if (ev.type === 'out') sfx.move();
    else if (ev.type === 'skid') sfx.swoosh();
    else if (ev.type === 'stuck') sfx.tick();
    else if (ev.type === 'reset') {
      sfx.error();
      this.syncSigns();
      const c = cellCenter(ev.x, ev.y);
      const flash = this.add.rectangle(c.x, c.y, TILE, TILE, N.droneLight, 0.5).setDepth(9);
      this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
      const x = Phaser.Math.Clamp(c.x, 36, WIDTH - 36);
      if (this.lastNote?.active) {
        // One at a time: notes on neighbouring cells would overlap.
        this.tweens.killTweensOf(this.lastNote);
        this.lastNote.destroy();
      }
      const note = (this.lastNote = text(this, x, c.y - 22, 'RIMESSO!', { color: C.droneLight, origin: 0.5 }).setDepth(56));
      this.tweens.add({ targets: note, y: note.y - 12, alpha: 0, delay: 700, duration: 600, onComplete: () => note.destroy() });
      // The first time, Rosanna says what to do about it.
      this.say(this.resets++ ? ROSANNA.drone : ROSANNA.firstReset, this.resets > 1 ? 0.5 : 1);
      this.checkHopeless(); // one of Teresa's signs fewer to turn
    }
    else if (ev.type === 'in') {
      sfx.coin();
      const c = cellCenter(ev.x, ev.y);
      const puff = this.add.circle(c.x, c.y, 12, N.paper, 0.6).setDepth(12);
      this.tweens.add({ targets: puff, scale: 2.5, alpha: 0, duration: 400, onComplete: () => puff.destroy() });
      this.say(ROSANNA.in, 0.35);
    }
  }

  // Chiara's marbles and Gigi's foam where they still are; they blink in
  // their last seconds.
  drawSpread(time) {
    for (const [what, { key, life }] of Object.entries(SPREAD)) {
      const imgs = this.spreadImgs[what];
      for (const [k, left] of this.round[what]) {
        let img = imgs.get(k);
        if (!img) {
          const [x, y] = k.split(',').map(Number);
          const c = cellCenter(x, y);
          img = this.add.image(c.x, c.y, key).setDepth(7);
          imgs.set(k, img);
          this.tweens.add({ targets: img, scale: { from: 1.8, to: 1 }, duration: 160, ease: 'Back.out' });
        }
        img.setVisible(left > life * 0.25 || Math.floor(time / 150) % 2 === 0);
      }
      for (const [k, img] of imgs) {
        if (this.round[what].has(k)) continue;
        img.destroy();
        imgs.delete(k);
      }
    }
  }

  // The bulldozers where the rules put them, with a little engine shake.
  drawRuspe(time) {
    const alive = new Set();
    for (const r of this.round.ruspe) {
      alive.add(r.id);
      let img = this.ruspaImgs.get(r.id);
      if (!img) {
        img = this.add.image(0, 0, RUSPA_KEY).setDepth(10);
        this.ruspaImgs.set(r.id, img);
      }
      const pos = position(r);
      const c = cellCenter(pos.x, pos.y);
      const shake = Math.floor(time / 90 + r.id) % 2;
      // Stuck in the foam they pile up: spread them a little to show how many.
      const pile = r.stuck !== undefined ? (r.id % 3) - 1 : 0;
      img.setPosition(Math.round(c.x) + pile * 5, Math.round(c.y) + pile * 4 + (r.dir % 2 && r.stuck === undefined ? shake : 0)).setAngle(r.dir * 90);
    }
    // Gone into the mall: they shrink through the door.
    for (const [id, img] of this.ruspaImgs) {
      if (alive.has(id)) continue;
      this.ruspaImgs.delete(id);
      this.tweens.add({ targets: img, scale: 0.2, alpha: 0, duration: 300, onComplete: () => img.destroy() });
    }
  }

  // ---------------------------------------------------------------- end of round

  endRound(result) {
    if (this.state === 'end') return;
    this.state = 'end';
    this.hover.setVisible(false);
    this.showRetry(false);
    this.bubble?.destroy();
    this.updateHud();

    const win = result === 'win';
    const s = score(this.round);
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

    if (!win) {
      sfx.lose();
      banner(this, result === 'hopeless' ? 'NON CE LA FANNO' : 'ARRIVANO GLI OPERAI', C.red, 1400);
      this.time.delayedCall(1500, () => results(false));
      return;
    }
    sfx.win();
    banner(this, 'RUSPE DENTRO!', C.ocraLight, 1200);
    this.time.delayedCall(1300, () => {
      if (barriera) askNickname(this, { game: GAME_ID, level: this.level, points: s.ruspe, total, portrait: 'rosanna-96', line: pick(ROSANNA.record) }, results);
      else results(false);
    });
  }

  showResults(result, s, total, record, barriera) {
    const win = result === 'win';
    const last = this.level === LEVELS.length - 1;
    const o = overlay(this);
    const P = { x: 40, y: 30, w: 400, h: 212 };
    panel(o.add(this.add.graphics()), P.x, P.y, P.w, P.h, { border: win ? N.ocra : N.red });

    const title = win ? 'RUSPE DENTRO!' : result === 'hopeless' ? 'NIENTE DA FARE' : 'ARRIVANO GLI OPERAI';
    o.add(text(this, P.x + P.w / 2, P.y + 12, title, { size: 16, color: win ? C.ocraLight : C.red, origin: [0.5, 0] }));
    o.add(text(this, P.x + P.w / 2, P.y + 34, `${this.lv.name}   ${this.round.inside}/${this.lv.need} DENTRO`, { color: C.chalkDim, origin: [0.5, 0] }));

    if (win) {
      const rows = [
        ['RUSPE DENTRO', s.ruspe],
        ['BONUS ATTREZZI', s.tools],
        ['BONUS TEMPO', s.time],
        ['TOTALE', total],
      ];
      rows.forEach(([k, v], i) => {
        o.add(text(this, P.x + 120, P.y + 54 + i * 12, k, { color: C.paper }));
        o.add(text(this, P.x + P.w - 20, P.y + 54 + i * 12, String(v), { color: i === rows.length - 1 ? C.ocraLight : C.white, origin: [1, 0] }));
      });
      o.add(text(this, P.x + 120, P.y + 110, this.lv.win, { color: C.white, wrap: P.w - 136, lineSpacing: 4 }));
    }
    if (record || barriera) {
      const label = barriera ? 'RECORD DI BARRIERA!' : 'NUOVO RECORD!';
      const r = o.add(text(this, P.x + P.w - 20, P.y + 98, label, { color: C.pink, origin: [1, 0] }));
      blink(this, r, 300);
    }

    // The morning after at the Bar Stella: one of the regulars comments.
    const bar = pick(win ? BAR.win : BAR.lose);
    const g = o.add(this.add.graphics());
    panel(g, P.x + 14, P.y + 52, 96, 96, { fill: N.black, alpha: 1 });
    o.add(this.add.image(P.x + 14, P.y + 52, bar.portrait).setOrigin(0));
    o.add(text(this, P.x + 62, P.y + 152, bar.who, { color: C.ocraLight, origin: [0.5, 0] }));
    const ly = win ? P.y + 140 : P.y + 60;
    o.add(text(this, P.x + 120, ly, `"${bar.line}"`, { color: C.chalk, wrap: P.w - 136, lineSpacing: 4 }));

    const next = () => this.scene.restart({ level: this.level + 1 });
    const retry = () => this.scene.restart({ level: this.level });
    const menu = () => goTo(this, 'Menu');
    const by = P.y + P.h - 26;
    if (win && !last) {
      button(this, o, P.x + 20, by, 'PROSSIMA', next, 96);
      button(this, o, P.x + 132, by, 'RIPROVA', retry, 96);
    } else {
      button(this, o, P.x + 20, by, 'RIPROVA', retry, 96);
    }
    button(this, o, P.x + P.w - 116, by, 'MENU', menu, 96);
    this.endActions = { primary: win && !last ? next : retry, retry, menu };
  }
}
