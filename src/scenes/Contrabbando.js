import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, panel, goTo, fadeIn, makeTexture } from '../ui.js';
import { sfx } from '../sfx.js';
import { loadSave, writeSave } from '../save.js';
import { VEGGIES, POWERUPS, createTextures, vegKey, iconKey, droneKey, powerKey } from '../games/contrabbando/textures.js';
import { RECIPES, FRANCO, MEI_END } from '../games/contrabbando/recipes.js';
import { OtpCheck } from '../games/contrabbando/otp.js';

const GRAVITY = 300; // px/s²
const COUNTER_Y = 236; // veggies pop up from behind the bar counter
const HUD_H = 28;
const TRAIL_MS = 110;
const MAX_STRIKES = 3;
const RANDOM_OTP_CHANCE = 0.5; // one surprise position check, or none
const SCAN_SECONDS = 1; // how long a caught drone scans before asking the code
const pick = Phaser.Utils.Array.GetRandom;
const rand = Phaser.Math.FloatBetween;

// Il contrabbando di Zio Franco: Fruit Ninja behind the Bar Stella.
// Franco tosses smuggled veggies from behind the counter; slice what Mei Li's
// recipe needs, never slice the surveillance drones.
export default class Contrabbando extends Phaser.Scene {
  constructor() {
    super('Contrabbando');
  }

  init(data) {
    this.save = loadSave();
    this.progress = this.save.contrabbando ?? { unlocked: 0, best: {} };
    this.level = Phaser.Math.Clamp(data?.level ?? this.progress.unlocked, 0, RECIPES.length - 1);
  }

  create() {
    fadeIn(this);
    createTextures(this, RECIPES[this.level].size);

    this.state = 'intro';
    this.objects = []; // veggies, power-ups, drones, debris
    this.particles = [];
    this.trail = [];
    this.timeScale = 1;

    this.drawKitchen();
    this.stains = this.add.layer().setDepth(1);
    this.beams = this.add.graphics().setDepth(5);
    this.drawCounter();
    this.fx = this.add.graphics().setDepth(30);
    this.lockGfx = this.add.graphics().setDepth(35);
    this.trailGfx = this.add.graphics().setDepth(40);
    this.slowTint = this.add.rectangle(0, 0, WIDTH, HEIGHT, N.pink, 0.07).setOrigin(0).setDepth(45).setVisible(false);
    this.drawFranco();

    this.setupRecipe();
    this.drawHud();
    this.otp = new OtpCheck(this, (ok) => this.otpDone(ok));

    this.listenForSwipes();
    this.input.keyboard.on('keydown', (e) => this.onKey(e));

    this.showIntro();
  }

  // ---------------------------------------------------------------- setup

  setupRecipe() {
    const r = (this.recipe = RECIPES[this.level]);
    this.remaining = { ...r.needs };
    this.score = 0;
    this.strikes = 0;
    this.timeLeft = r.time;
    this.elapsed = 0;
    this.spawnTimer = 0.6;
    this.droneTimer = r.droneEvery ? r.droneEvery * 0.8 : Infinity;
    this.slowLeft = 0;
    this.frenzyLeft = 0;
    this.completed = false;
    // Maybe one surprise position check, between 20% and 80% of the time.
    // (A player who finishes the recipe earlier just doesn't get it.)
    this.otpTimes = Math.random() < RANDOM_OTP_CHANCE ? [r.time * rand(0.2, 0.8)] : [];
    this.caughtBy = null;
  }

  drawKitchen() {
    // 2x2 block of tiles in slightly different shades of tired off-white.
    makeTexture(this, 'tile', 32, 32, (g) => {
      g.fillStyle(0x6a6450).fillRect(0, 0, 32, 32);
      [[0, 0, 0xc8bea0], [16, 0, 0xbdb391], [0, 16, 0xb8ae8c], [16, 16, 0xc4ba9a]].forEach(([x, y, c]) => {
        g.fillStyle(c).fillRect(x, y, 15, 15);
        g.fillStyle(0xddd4b8).fillRect(x + 1, y + 1, 5, 1).fillRect(x + 1, y + 1, 1, 4);
      });
      g.fillStyle(0x9a9070).fillRect(20, 4, 1, 3).fillRect(21, 7, 1, 3).fillRect(22, 10, 1, 2); // crack
    });
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tile').setOrigin(0);

    const grime = this.add.graphics();
    const rnd = new Phaser.Math.RandomDataGenerator(['unto']);
    for (let i = 0; i < 26; i++) {
      // Grease stains, denser near the counter where the frying happens.
      const y = rnd.between(40, COUNTER_Y - 4) * 0.5 + COUNTER_Y * 0.45;
      grime.fillStyle(0x5a4a20, rnd.realInRange(0.15, 0.35)).fillEllipse(rnd.between(0, WIDTH), y, rnd.between(10, 40), rnd.between(4, 14));
    }
    for (let i = 0; i < 6; i++) {
      // Missing tiles.
      const x = rnd.between(0, 29) * 16;
      const y = rnd.between(3, 12) * 16;
      grime.fillStyle(0x5a5240, 0.75).fillRect(x, y, 15, 15).fillStyle(0x6a6450, 0.8).fillRect(x + 2, y + 9, 6, 3);
    }
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x0c0a12, 0.6).setOrigin(0);
    this.add.rectangle(0, COUNTER_Y - 40, WIDTH, 40, 0x0c0a12, 0.25).setOrigin(0);

    const g = this.add.graphics();
    // Hanging lamp and its light.
    g.fillStyle(0x1a1a1a).fillRect(239, HUD_H, 2, 14);
    g.fillStyle(0x2a3a2a).fillRect(226, HUD_H + 14, 28, 6).fillRect(230, HUD_H + 12, 20, 2);
    g.fillStyle(N.droneLight, 0.9).fillRect(232, HUD_H + 20, 16, 1);
    g.fillStyle(N.droneLight, 0.05).fillTriangle(232, HUD_H + 20, 248, HUD_H + 20, 340, COUNTER_Y).fillTriangle(232, HUD_H + 20, 140, COUNTER_Y, 340, COUNTER_Y);
    // Pots and ladles on the rail.
    g.fillStyle(0x3a3a3a).fillRect(24, 48, 150, 2);
    [[34, 0x8a8a8a], [70, 0xb87333], [112, 0x8a8a8a], [150, 0xb87333]].forEach(([x, c], i) => {
      g.fillStyle(0x2a2a2a).fillRect(x, 50, 1, 6 + i * 2);
      if (i % 2) g.fillStyle(c).fillCircle(x, 64 + i * 2, 9).fillStyle(0x05070c, 0.4).fillCircle(x, 64 + i * 2, 6);
      else g.fillStyle(c).fillRect(x - 1, 56, 3, 14).fillCircle(x, 74, 5);
    });
    // Back door with emergency sign, the smugglers' entrance.
    g.fillStyle(0x2a1c12).fillRect(372, 70, 64, COUNTER_Y - 70);
    g.fillStyle(0x3e2a1a).fillRect(376, 74, 56, COUNTER_Y - 74);
    g.fillStyle(0xc0a060).fillRect(424, 150, 4, 8);
    g.fillStyle(0x1a5a2a).fillRect(386, 58, 36, 10);
    text(this, 404, 60, 'USCITA', { color: '#b8f0b0', origin: [0.5, 0], shadow: null });
  }

  drawCounter() {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(N.woodLight).fillRect(0, COUNTER_Y, WIDTH, 3);
    g.fillStyle(N.wood).fillRect(0, COUNTER_Y + 3, WIDTH, 8);
    g.fillStyle(N.woodDark).fillRect(0, COUNTER_Y + 11, WIDTH, HEIGHT - COUNTER_Y - 11);
    for (let x = 60; x < WIDTH; x += 44) g.fillStyle(0x2e1c0f).fillRect(x, COUNTER_Y + 15, 30, HEIGHT - COUNTER_Y - 19);
    // Cutting board.
    g.fillStyle(0xc89a5a).fillRect(200, COUNTER_Y - 3, 80, 4);
    g.fillStyle(0xa87a3a).fillRect(200, COUNTER_Y, 80, 1);
  }

  // Zio Franco's face in the corner, with a speech bubble.
  drawFranco() {
    const g = this.add.graphics().setDepth(50);
    panel(g, 6, COUNTER_Y - 2, 32, 32, { fill: N.black, alpha: 1 });
    this.add.image(6 - 24, COUNTER_Y - 2 - 4, 'zio-franco-96').setOrigin(0).setCrop(24, 4, 32, 32).setDepth(50);
    this.bubbleBg = this.add.graphics().setDepth(50);
    this.bubble = text(this, 48, COUNTER_Y + 5, '', { color: C.white, wrap: WIDTH - 60, lineSpacing: 3 }).setDepth(51);
  }

  say(lines, chance = 1) {
    if (Math.random() > chance) return;
    const line = typeof lines === 'string' ? lines : pick(lines);
    this.bubble.setText(line);
    const w = this.bubble.width + 10;
    const h = this.bubble.height + 6;
    this.bubbleBg.clear().fillStyle(N.black, 0.85).fillRect(43, COUNTER_Y + 2, w, h).fillTriangle(43, COUNTER_Y + 6, 43, COUNTER_Y + 12, 39, COUNTER_Y + 9);
    this.bubbleTimer?.remove();
    this.bubbleTimer = this.time.delayedCall(2600, () => {
      this.bubble.setText('');
      this.bubbleBg.clear();
    });
  }

  drawHud() {
    this.add.rectangle(0, 0, WIDTH, HUD_H, N.black, 0.75).setOrigin(0).setDepth(60);
    this.scoreText = text(this, 8, 10, 'PUNTI 000000', { color: C.ocraLight }).setDepth(61);

    // Recipe goals, centered: icon + counter.
    this.goalTexts = {};
    const items = Object.keys(this.recipe.needs);
    const widths = items.map((k) => this.textures.get(iconKey(k)).getSourceImage().width + 36);
    let x = Math.round(WIDTH / 2 - widths.reduce((a, b) => a + b, 0) / 2) + 16;
    items.forEach((k, i) => {
      const icon = this.add.image(x, HUD_H / 2, iconKey(k)).setOrigin(0, 0.5).setDepth(61);
      this.goalTexts[k] = text(this, x + icon.width + 3, 10, '', { color: C.white }).setDepth(61);
      x += widths[i];
    });
    this.updateGoals();

    this.timeText = text(this, 384, 10, '', { color: C.white, origin: [1, 0] }).setDepth(61);
    this.strikeTexts = [0, 1, 2].map((i) => text(this, 396 + i * 12, 10, 'X', { color: '#3a3f48', shadow: null }).setDepth(61));
    // Pause button (mainly for touch).
    const pb = this.add.rectangle(452, 4, 22, 20, N.night2).setOrigin(0).setDepth(61).setStrokeStyle(1, N.ocra);
    text(this, 463, 10, 'II', { color: C.ocraLight, origin: [0.5, 0] }).setDepth(62);
    pb.setInteractive({ useHandCursor: true }).on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      if (this.state === 'play') this.pause();
    });
    this.updateTime();
  }

  updateGoals() {
    for (const [k, t] of Object.entries(this.goalTexts)) {
      const done = this.recipe.needs[k] - this.remaining[k];
      if (this.remaining[k] <= 0) t.setText('OK').setColor('#9be36b');
      else t.setText(`${done}/${this.recipe.needs[k]}`);
    }
  }

  updateTime() {
    const s = Math.max(0, Math.ceil(this.timeLeft));
    this.timeText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    this.timeText.setColor(s <= 10 ? C.red : C.white);
  }

  addScore(n, x, y, label) {
    this.score = Math.max(0, this.score + n);
    this.scoreText.setText(`PUNTI ${String(this.score).padStart(6, '0')}`);
    if (x === undefined) return;
    const str = label ?? (n < 0 ? `${n}` : `+${n}`);
    const t = text(this, x, y, str, { color: n < 0 ? C.red : C.ocraLight, origin: 0.5 }).setDepth(55);
    this.tweens.add({ targets: t, y: y - 18, duration: 700, onComplete: () => t.destroy() });
  }

  banner(str, color = C.white, ms = 1100, y = 100) {
    this.lastBanner?.destroy();
    const t = (this.lastBanner = text(this, WIDTH / 2, Math.round(y), str, { size: 16, color, origin: 0.5 }).setDepth(70));
    this.tweens.add({ targets: t, scale: { from: 0.5, to: 1 }, duration: 160, ease: 'Back.out' });
    this.time.delayedCall(ms, () => t.active && t.destroy());
    return t;
  }

  // ---------------------------------------------------------------- overlays

  overlay() {
    const objs = [];
    const add = (o) => (objs.push(o.setDepth(100)), o);
    add(this.add.rectangle(0, 0, WIDTH, HEIGHT, N.black, 0.72).setOrigin(0).setInteractive());
    return { add, close: () => objs.forEach((o) => o.destroy()) };
  }

  showIntro() {
    this.state = 'intro';
    const o = (this.introUi = this.overlay());
    const P = { x: 20, y: 36, w: 440, h: 206 };
    panel(o.add(this.add.graphics()), P.x, P.y, P.w, P.h);

    const g = o.add(this.add.graphics());
    panel(g, P.x + 12, P.y + 14, 96, 96, { fill: N.black, alpha: 1 });
    o.add(this.add.image(P.x + 12, P.y + 14, 'mei-li-96').setOrigin(0));
    o.add(text(this, P.x + 60, P.y + 116, 'MEI LI', { color: C.ocraLight, origin: [0.5, 0] }));

    const X = P.x + 124;
    const unlocked = Math.min(this.progress.unlocked, RECIPES.length - 1);
    o.add(text(this, X, P.y + 12, `RICETTA ${this.level + 1}/${RECIPES.length}`, { color: C.chalkDim }));
    if (unlocked > 0) {
      // Big enough to hit with a thumb; greyed out when there's nowhere to go.
      // A greyed arrow still swallows the tap: a near miss must not start the game.
      const step = (label, x, dir, enabled) => {
        if (enabled) return this.button(o, x, P.y + 6, label, () => this.changeLevel(dir), 44);
        const bg = o.add(this.add.rectangle(x, P.y + 6, 44, 18, N.night).setOrigin(0).setStrokeStyle(1, N.night3));
        bg.setInteractive(this.hitArea(44, 18)).on('pointerdown', (p, lx, ly, e) => e.stopPropagation());
        o.add(text(this, x + 22, P.y + 11, label, { color: '#3a4560', origin: [0.5, 0], shadow: null }));
      };
      step('<', P.x + P.w - 108, -1, this.level > 0);
      step('>', P.x + P.w - 56, 1, this.level < unlocked);
    }
    o.add(text(this, X, P.y + 28, this.recipe.name, { color: C.ocraLight, wrap: 300 }));

    // What to slice.
    let x = X;
    for (const [k, n] of Object.entries(this.recipe.needs)) {
      const icon = o.add(this.add.image(x, P.y + 58, iconKey(k)).setOrigin(0, 0.5));
      o.add(text(this, x + icon.width + 4, P.y + 54, `x${n}`, { color: C.white }));
      x += icon.width + 44;
    }
    const best = this.progress.best[this.level];
    o.add(text(this, X, P.y + 78, `TEMPO ${this.recipe.time}s${best ? `   RECORD ${best}` : ''}`, { color: C.chalkDim }));

    const order = o.add(text(this, X, P.y + 96, '', { color: C.white, wrap: 300, lineSpacing: 5 }));
    this.typeText(order, this.recipe.order);

    o.add(text(this, WIDTH / 2, P.y + 148, 'TIENI PREMUTO E TRASCINA PER TAGLIARE', { color: C.chalkDim, origin: [0.5, 0] }));
    o.add(text(this, WIDTH / 2, P.y + 159, 'FUORI RICETTA: -10 PUNTI E UNA X   3 X = FINE', { color: '#e07a6a', origin: [0.5, 0] }));
    o.add(text(this, WIDTH / 2, P.y + 170, `DRONE O VERIFICA: CODICE IN ${this.recipe.otp}s O FINE`, { color: '#e07a6a', origin: [0.5, 0] }));
    const go = o.add(text(this, WIDTH / 2, P.y + 186, 'CLICCA PER INIZIARE', { color: C.ocraLight, origin: [0.5, 0] }));
    this.button(o, P.x + 12, P.y + 182, '< MENU', () => goTo(this, 'Menu'), 64);
    blink(this, go, 450);

    this.introClick = () => this.startPlay();
    this.time.delayedCall(250, () => this.input.once('pointerdown', this.introClick));
  }

  typeText(t, str) {
    let i = 0;
    this.time.addEvent({
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

  changeLevel(dir) {
    sfx.move();
    this.scene.restart({ level: this.level + dir });
  }

  startPlay() {
    if (this.state !== 'intro') return;
    this.input.off('pointerdown', this.introClick);
    this.introUi.close();
    this.state = 'ready';
    sfx.confirm();
    this.banner('PRONTI...', C.white, 700);
    this.say(FRANCO.start);
    this.time.delayedCall(800, () => {
      sfx.start();
      this.banner('VIA!', C.ocraLight, 600);
      this.state = 'play';
    });
  }

  pause() {
    this.state = 'pause';
    this.strokeEnd();
    const o = (this.pauseUi = this.overlay());
    o.add(text(this, WIDTH / 2, 90, 'PAUSA', { size: 16, color: C.white, origin: 0.5 }));
    this.button(o, WIDTH / 2 - 70, 130, 'CONTINUA', () => this.resume());
    this.button(o, WIDTH / 2 + 10, 130, 'MENU', () => goTo(this, 'Menu'));
  }

  resume() {
    this.pauseUi?.close();
    this.pauseUi = null;
    this.state = 'play';
  }

  button(o, x, y, label, onClick, w = 60) {
    const bg = o.add(this.add.rectangle(x, y, w, 18, N.night2).setOrigin(0).setStrokeStyle(1, N.ocra));
    o.add(text(this, x + w / 2, y + 5, label, { color: C.ocraLight, origin: [0.5, 0] }));
    bg.setInteractive({ ...this.hitArea(w, 18), useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(N.night3));
    bg.on('pointerout', () => bg.setFillStyle(N.night2));
    bg.on('pointerdown', (p, lx, ly, e) => {
      e.stopPropagation();
      sfx.confirm();
      onClick();
    });
    return bg;
  }

  // Buttons are tiny on a phone (the game shrinks below 1x), and on the intro a
  // tap that misses one starts the game: hits count a few pixels outside.
  hitArea(w, h, padX = 4, padY = 8) {
    return { hitArea: new Phaser.Geom.Rectangle(-padX, -padY, w + padX * 2, h + padY * 2), hitAreaCallback: Phaser.Geom.Rectangle.Contains };
  }

  onKey(e) {
    if (this.otp && !this.otp.closed && this.state === 'otp') return; // OTP has its own keys
    if (this.state === 'intro') {
      if (e.code === 'ArrowLeft' && this.level > 0) this.changeLevel(-1);
      else if (e.code === 'ArrowRight' && this.level < Math.min(this.progress.unlocked, RECIPES.length - 1)) this.changeLevel(1);
      else if (e.code === 'Escape') goTo(this, 'Menu');
      else if (['Enter', 'Space'].includes(e.code)) this.startPlay();
    } else if (this.state === 'play') {
      if (['Escape', 'KeyP'].includes(e.code)) this.pause();
    } else if (this.state === 'pause') {
      if (['Escape', 'KeyP', 'Enter', 'Space'].includes(e.code)) this.resume();
    } else if (this.state === 'end' && this.endActions) {
      if (['Enter', 'Space'].includes(e.code)) this.endActions.primary();
      else if (e.code === 'KeyR') this.endActions.retry();
      else if (e.code === 'Escape') this.endActions.menu();
    }
  }

  // ---------------------------------------------------------------- slicing

  // Swipes are read straight from the browser's pointer events on the whole
  // window, not through Phaser's pointers: on iOS, moves are only delivered
  // to the element where the finger landed (so a swipe starting beside the
  // canvas never reached Phaser), and a touch cancelled by the system could
  // leave Phaser's pointer stuck "down". Buttons and menus still use Phaser.
  listenForSwipes() {
    const toGame = (e) => {
      const r = this.game.canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * WIDTH) / r.width, y: ((e.clientY - r.top) * HEIGHT) / r.height, isDown: true };
    };
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.strokePointer = e.pointerId; // the newest finger always wins
      this.strokeStart(toGame(e));
    };
    const move = (e) => {
      if (e.pointerId === this.strokePointer) this.strokeMove(toGame(e));
    };
    const up = (e) => {
      if (e.pointerId !== this.strokePointer) return;
      this.strokePointer = null;
      this.strokeEnd();
    };
    const handlers = { pointerdown: down, pointermove: move, pointerup: up, pointercancel: up };
    for (const [ev, fn] of Object.entries(handlers)) window.addEventListener(ev, fn);
    this.events.once('shutdown', () => {
      for (const [ev, fn] of Object.entries(handlers)) window.removeEventListener(ev, fn);
    });
  }

  strokeStart(p) {
    if (this.state !== 'play') return;
    this.stroke = { combo: 0, lastX: p.x, lastY: p.y };
    this.trail = [{ x: p.x, y: p.y, t: this.time.now }];
  }

  strokeMove(p) {
    if (this.state !== 'play' || !this.stroke || !p.isDown) return;
    const { lastX, lastY } = this.stroke;
    const dx = p.x - lastX;
    const dy = p.y - lastY;
    if (dx * dx + dy * dy < 4) return;
    if (dx * dx + dy * dy > 900 && this.time.now - (this.lastSwoosh ?? 0) > 180) {
      sfx.swoosh();
      this.lastSwoosh = this.time.now;
    }
    this.trail.push({ x: p.x, y: p.y, t: this.time.now });
    this.stroke.lastX = p.x;
    this.stroke.lastY = p.y;
    for (const o of this.objects) {
      if (o.dead || o.debris || o.locked) continue;
      if (distToSegment(o.x, o.y, lastX, lastY, p.x, p.y) <= o.r) this.slice(o, Math.atan2(dy, dx));
      if (!this.stroke) break; // a drone caught the blade: the swipe is over
    }
  }

  strokeEnd() {
    const s = this.stroke;
    this.stroke = null;
    if (!s || s.combo < 3 || this.state !== 'play') return;
    const bonus = s.combo * 10;
    this.addScore(bonus, s.lastX, s.lastY - 12, `COMBO x${s.combo} +${bonus}`);
    sfx.combo(s.combo);
    this.say(FRANCO.combo, 0.6);
  }

  slice(o, angle) {
    if (o.kind === 'drone') {
      this.droneHit(o); // drones can't be cut: they catch you instead
      return;
    }
    o.dead = true;
    this.splitInHalves(o, angle);

    if (o.kind === 'power') {
      this.activatePower(o.type);
      return;
    }
    sfx.slice(rand(0.85, 1.2));
    this.splash(o.x, o.y, VEGGIES[o.type].juice, o.img.width);
    // Scoring: +15 for what the recipe still needs, +5 for a recipe
    // ingredient already complete, -10 and an X for anything not in the recipe.
    if (!(o.type in this.remaining)) {
      sfx.error();
      this.addScore(-10, o.x, o.y - 10);
      this.say(FRANCO.wrong, 0.35);
      this.addStrike();
      return;
    }
    if (this.stroke) this.stroke.combo++;
    const needed = this.remaining[o.type] > 0;
    if (needed) {
      this.remaining[o.type]--;
      this.updateGoals();
    }
    this.addScore(needed ? 15 : 5, o.x, o.y - 10);
    if (!this.completed && Object.values(this.remaining).every((n) => n <= 0)) {
      this.completed = true; // stop clock and checks, let the last juice fly
      this.time.delayedCall(350, () => this.endRound('win'));
    }
  }

  splitInHalves(o, angle) {
    const rotation = o.img.rotation;
    o.img.destroy();
    if (o.kind === 'power') return;
    const key = o.tex;
    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);
    for (const [frame, dir] of [['left', -1], ['right', 1]]) {
      const img = this.add.image(o.x, o.y, key, frame).setRotation(rotation).setDepth(10);
      this.objects.push({
        debris: true,
        img,
        x: o.x + nx * dir * 3,
        y: o.y + ny * dir * 3,
        vx: (o.vx ?? 0) * 0.5 + nx * dir * 50,
        vy: Math.min(o.vy ?? 0, 0) * 0.3 - 40 + ny * dir * 30,
        spin: dir * rand(3, 7),
      });
    }
  }

  splash(x, y, colors, size = 24) {
    const k = size / 24;
    for (let i = 0; i < 10 + 6 * k; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(40, 140) * Math.sqrt(k);
      const s = Math.random() < 0.3 * k ? 3 : 2;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rand(0.3, 0.7), color: pick(colors), s });
    }
    // A stain on the tiles that slowly fades.
    const g = this.add.graphics();
    g.fillStyle(colors[0], 0.55);
    const spread = 8 * k;
    for (let i = 0; i < 8 + 6 * k; i++) g.fillRect(Math.round(x + rand(-spread, spread)), Math.round(y + rand(-spread * 0.7, spread * 0.7)), Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3));
    for (let i = 0; i < Math.ceil(k); i++) g.fillRect(Math.round(x + rand(-spread, spread) * 0.5), Math.round(y), 2, Phaser.Math.Between(4, 12)); // drips
    this.stains.add(g);
    this.tweens.add({ targets: g, alpha: 0, delay: 1800, duration: 1500, onComplete: () => g.destroy() });
  }

  // ---------------------------------------------------------------- hazards & bonuses

  // Touching a drone doesn't cut it: it stops, locks on and scans the kitchen,
  // then asks you to confirm your position (OTP). Right code: no penalty, but
  // the clock kept running, and it flies off. Wrong or late: the round is over.
  droneHit(o) {
    o.locked = true;
    o.lockT = 0;
    o.img.setTint(0xff7070);
    this.state = 'caught';
    this.caughtBy = o;
    this.time.delayedCall(SCAN_SECONDS * 1000, () => {
      if (this.state === 'caught') this.openOtp('drone');
    });
    this.strokeEnd(); // the blade is "caught": end this swipe
    this.trail = [];
    sfx.alarm();
    this.cameras.main.shake(180, 0.008);
    this.cameras.main.flash(150, 224, 68, 58);
    // Banner above the drone (or below, if it's high), never covering it.
    const by = o.y > 90 ? o.y - o.img.height / 2 - 20 : o.y + o.img.height / 2 + 20;
    this.banner('SCANSIONE!', C.red, 1000, by);
    this.say(FRANCO.drone);
  }

  addStrike() {
    this.strikes++;
    this.strikeTexts.forEach((t, i) => t.setColor(i < this.strikes ? C.red : '#3a3f48'));
    // Make the new X impossible to miss.
    const x = this.strikeTexts[this.strikes - 1];
    if (x) this.tweens.add({ targets: x, scale: { from: 3, to: 1 }, duration: 350, ease: 'Back.out' });
    if (this.strikes >= MAX_STRIKES) this.time.delayedCall(400, () => this.endRound('wasted'));
  }

  activatePower(type) {
    sfx.powerup();
    this.banner(POWERUPS[type].label, '#' + POWERUPS[type].color.toString(16).padStart(6, '0'), 1000);
    if (type === 'laser') {
      sfx.laser();
      this.say(FRANCO.laser);
      const drones = this.objects.filter((o) => o.kind === 'drone' && !o.dead);
      this.fx.lineStyle(1, N.red, 1);
      for (const d of drones) {
        this.fx.lineBetween(WIDTH - 10, COUNTER_Y, d.x, d.y);
        d.dead = true;
        this.splitInHalves(d, Math.PI / 2);
        this.splash(d.x, d.y, [0xe0443a, 0xfff2b0], d.img.width);
        this.addScore(25, d.x, d.y - 10);
      }
      this.time.delayedCall(150, () => this.fx.clear());
    } else if (type === 'valzer') {
      this.say(FRANCO.valzer);
      this.slowLeft = 5;
      this.timeScale = 0.4;
      this.slowTint.setVisible(true);
      let step = 0;
      this.waltz?.remove();
      sfx.waltzBar(step++);
      this.waltz = this.time.addEvent({ delay: 1000, repeat: 4, callback: () => sfx.waltzBar(step++) });
    } else if (type === 'attivatore') {
      this.say(FRANCO.attivatore);
      this.frenzyLeft = 3.5;
      this.frenzySpawn = 0;
    }
  }

  openOtp(reason) {
    this.state = 'otp';
    this.otpReason = reason;
    this.strokeEnd();
    this.trail = [];
    this.otp.open(reason, this.recipe.otp);
  }

  otpDone(ok) {
    if (this.state !== 'otp') return;
    this.state = 'play';
    if (this.caughtBy) {
      this.caughtBy.released = true; // the drone can leave now
      this.caughtBy = null;
    }
    if (ok && this.otpReason === 'drone') {
      sfx.confirm();
      this.banner('POSIZIONE CONFERMATA', '#9be36b', 1000);
    } else if (ok) {
      sfx.powerup();
      this.addScore(13, WIDTH / 2, 120, '+13 SOCIAL SCORE');
    } else {
      sfx.error();
      this.banner('CITTADINO IRREGOLARE', C.red, 1200);
      this.endRound('scanned');
    }
  }

  // ---------------------------------------------------------------- spawning

  spawnVeggie(onlyNeeded = false) {
    const needed = Object.keys(this.remaining).filter((k) => this.remaining[k] > 0);
    const decoys = Object.keys(VEGGIES).filter((k) => !(k in this.remaining));
    const type = needed.length && (onlyNeeded || Math.random() >= this.recipe.decoys) ? pick(needed) : pick(decoys.length ? decoys : needed);
    this.launch('veggie', type, vegKey(type, this.recipe.size));
  }

  launch(kind, type, texture) {
    const x = rand(60, WIDTH - 60);
    const y = HEIGHT + 40;
    const apex = rand(HUD_H + 34, 140);
    const vy = -Math.sqrt(2 * GRAVITY * (y - apex));
    const flight = (2 * -vy) / GRAVITY;
    const vx = (rand(120, WIDTH - 120) - x) / flight;
    const img = this.add.image(x, y, texture).setDepth(10);
    // Hit circle between the short and the long side (objects spin), plus
    // some slack for fingers that shrinks with the sprites on later recipes.
    const r = (img.width + img.height) / 4 + 5 * this.recipe.size;
    this.objects.push({ kind, type, img, tex: texture, x, y, vx, vy, r, spin: rand(-3, 3) });
  }

  spawnWave() {
    const r = this.recipe;
    const n = Phaser.Math.Between(1, r.waveMax);
    for (let i = 0; i < n; i++) {
      const hasPower = this.objects.some((o) => o.kind === 'power' && !o.dead);
      if (r.powerups.length && !hasPower && i === 0 && Math.random() < 0.1) {
        const type = pick(r.powerups);
        this.launch('power', type, powerKey(type, this.recipe.size));
      } else {
        this.spawnVeggie();
      }
    }
  }

  spawnDrone() {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -30 : WIDTH + 30;
    const vx = (fromLeft ? 1 : -1) * rand(40, 80);
    const baseY = rand(HUD_H + 30, 150);
    const tex = droneKey(this.recipe.size);
    const img = this.add.image(x, baseY, tex).setDepth(12);
    this.objects.push({ kind: 'drone', type: 'drone', img, tex, x, y: baseY, baseY, vx, vy: 0, r: (img.width + img.height) / 4 - 1, phase: rand(0, 6) }); // tight: it's a penalty
    sfx.drone();
  }

  // ---------------------------------------------------------------- loop

  update(time, delta) {
    const realDt = Math.min(delta, 50) / 1000;
    if (this.state === 'play') this.updateRules(realDt);
    if (this.state === 'caught' || this.state === 'otp') this.tickClockOnly(realDt);
    if (['play', 'end', 'ready', 'caught'].includes(this.state)) this.updateWorld(realDt * this.timeScale, time);
    this.updateParticles(realDt);
    this.drawTrail();
  }

  // While a drone scans you or a check is open the world stops, the clock doesn't.
  tickClockOnly(dt) {
    if (this.completed) return;
    this.timeLeft -= dt;
    this.updateTime();
    if (this.timeLeft <= 0) {
      this.otp.abort();
      this.endRound('time');
    }
  }

  updateRules(dt) {
    if (this.completed) return;
    this.elapsed += dt;
    this.timeLeft -= dt;
    this.updateTime();
    if (this.timeLeft <= 0) return this.endRound('time');

    if (this.otpTimes.length && this.elapsed >= this.otpTimes[0]) {
      this.otpTimes.shift();
      this.openOtp('random');
      return;
    }

    if (this.slowLeft > 0) {
      this.slowLeft -= dt;
      if (this.slowLeft <= 0) {
        this.timeScale = 1;
        this.slowTint.setVisible(false);
      }
    }

    const sdt = dt * this.timeScale;
    if (this.frenzyLeft > 0) {
      this.frenzyLeft -= dt;
      this.frenzySpawn -= dt;
      if (this.frenzySpawn <= 0) {
        this.spawnVeggie(true);
        this.frenzySpawn = 0.12;
      }
    }
    this.spawnTimer -= sdt;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      this.spawnTimer = this.recipe.spawnEvery * rand(0.8, 1.2);
    }
    this.droneTimer -= sdt;
    if (this.droneTimer <= 0) {
      this.spawnDrone();
      this.droneTimer = this.recipe.droneEvery * rand(0.7, 1.3);
    }
  }

  updateWorld(dt, time) {
    this.beams.clear();
    this.lockGfx.clear();
    for (const o of this.objects) {
      if (o.dead) continue;
      if (o.kind === 'drone' && o.locked) {
        this.updateLockedDrone(o, dt, time);
      } else if (o.kind === 'drone') {
        o.x += o.vx * dt;
        o.y = o.baseY + Math.sin(o.phase + time / 400) * 5;
        // Searchlight down to the counter.
        this.beams.fillStyle(N.droneLight, 0.07).fillTriangle(o.x - 2, o.y + o.img.height / 2, o.x - 18, COUNTER_Y, o.x + 18, COUNTER_Y);
        if ((o.vx > 0 && o.x > WIDTH + 40) || (o.vx < 0 && o.x < -40)) o.dead = true;
      } else {
        o.vy += GRAVITY * dt;
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        o.img.rotation += o.spin * dt;
        if (o.y > HEIGHT + 50 && o.vy > 0) o.dead = true;
      }
      o.img.setPosition(Math.round(o.x), Math.round(o.y));
    }
    // Remove what's gone (destroyed by slicing, or off screen).
    this.objects = this.objects.filter((o) => {
      if (!o.dead) return true;
      if (o.img.active) o.img.destroy();
      return false;
    });
  }

  // Caught drone: hovers in place scanning until the check is over, then
  // escapes upwards.
  updateLockedDrone(o, dt, time) {
    o.lockT += dt;
    if (!o.released) {
      o.y = o.baseY + Math.sin(time / 60) * 1.5;
      const g = this.lockGfx;
      const eyeY = o.y + o.img.height / 2;
      // Red scanning cone sweeping the kitchen, with a scanline running down.
      const sweep = Math.sin(o.lockT * 9) * 50;
      g.fillStyle(N.red, 0.22).fillTriangle(o.x, eyeY, o.x + sweep - 40, COUNTER_Y, o.x + sweep + 40, COUNTER_Y);
      const k = (o.lockT * 3) % 1;
      const ly = eyeY + (COUNTER_Y - eyeY) * k;
      const half = 40 * k;
      g.lineStyle(1, N.red, 0.9).lineBetween(o.x + sweep * k - half, ly, o.x + sweep * k + half, ly);
      // Blinking lock-on brackets around the drone.
      if (Math.floor(o.lockT * 8) % 2 === 0) {
        const rx = o.img.width / 2 + 5;
        const ry = o.img.height / 2 + 5;
        g.lineStyle(1, N.red, 1);
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          g.lineBetween(o.x + sx * rx, o.y + sy * ry, o.x + sx * (rx - 5), o.y + sy * ry);
          g.lineBetween(o.x + sx * rx, o.y + sy * ry, o.x + sx * rx, o.y + sy * (ry - 5));
        }
      }
    } else {
      // Off it goes, towards the closest side, climbing.
      if (!o.escaping) {
        o.escaping = true;
        o.img.clearTint();
        sfx.drone();
      }
      const dir = o.x < WIDTH / 2 ? -1 : 1;
      o.x += dir * 260 * dt;
      o.baseY -= 90 * dt;
      o.y = o.baseY;
      if (o.x < -40 || o.x > WIDTH + 40 || o.y < -30) o.dead = true;
    }
  }

  updateParticles(dt) {
    const g = this.particleGfx ?? (this.particleGfx = this.add.graphics().setDepth(31));
    g.clear();
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      g.fillStyle(p.color, Math.min(1, p.life * 3)).fillRect(Math.round(p.x), Math.round(p.y), p.s ?? 2, p.s ?? 2);
      return p.life > 0;
    });
  }

  drawTrail() {
    const g = this.trailGfx.clear();
    const now = this.time.now;
    this.trail = this.trail.filter((p) => now - p.t < TRAIL_MS);
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1];
      const b = this.trail[i];
      const age = 1 - (now - b.t) / TRAIL_MS;
      g.lineStyle(age > 0.6 ? 3 : 2, N.ocraLight, 0.5 * age).lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(1, 0xffffff, age).lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  // ---------------------------------------------------------------- end of round

  endRound(result) {
    if (this.state === 'end') return;
    this.state = 'end';
    this.otp.abort();
    if (this.caughtBy) this.caughtBy.released = true;
    this.caughtBy = null;
    this.strokeEnd();
    this.trail = [];
    this.timeScale = 1;
    this.slowTint.setVisible(false);
    this.waltz?.remove();

    const win = result === 'win';
    const timeBonus = win ? Math.ceil(Math.max(0, this.timeLeft)) * 5 : 0;
    const total = this.score + timeBonus;
    const prevBest = this.progress.best[this.level] ?? 0;
    const record = total > prevBest;
    if (record) this.progress.best[this.level] = total;
    if (win) this.progress.unlocked = Math.max(this.progress.unlocked, this.level + 1);
    this.save.contrabbando = this.progress;
    writeSave(this.save);

    if (win) sfx.win();
    else sfx.lose();
    if (result === 'time') this.banner('TEMPO SCADUTO', C.red, 1000);
    this.time.delayedCall(900, () => this.showResults(result, timeBonus, total, record));
  }

  showResults(result, timeBonus, total, record) {
    const win = result === 'win';
    const last = this.level === RECIPES.length - 1;
    const o = this.overlay();
    const P = { x: 60, y: 36, w: 360, h: 200 };
    panel(o.add(this.add.graphics()), P.x, P.y, P.w, P.h, { border: win ? N.ocra : N.red });

    const title = win ? 'PIATTO SERVITO!' : { scanned: 'SCANSIONATO!', wasted: 'TROPPI SPRECHI' }[result] ?? 'PIATTO BRUCIATO';
    o.add(text(this, WIDTH / 2, P.y + 12, title, { size: 16, color: win ? C.ocraLight : C.red, origin: [0.5, 0] }));
    o.add(text(this, WIDTH / 2, P.y + 34, this.recipe.name, { color: C.chalkDim, origin: [0.5, 0] }));

    const rows = [
      ['PUNTI', this.score],
      ['BONUS TEMPO', timeBonus],
      ['TOTALE', total],
    ];
    rows.forEach(([k, v], i) => {
      o.add(text(this, P.x + 120, P.y + 56 + i * 14, k, { color: C.paper }));
      o.add(text(this, P.x + P.w - 20, P.y + 56 + i * 14, String(v), { color: i === 2 ? C.ocraLight : C.white, origin: [1, 0] }));
    });
    if (record) {
      const r = o.add(text(this, P.x + P.w - 20, P.y + 100, 'NUOVO RECORD!', { color: C.pink, origin: [1, 0] }));
      blink(this, r, 300);
    }

    const g = o.add(this.add.graphics());
    panel(g, P.x + 14, P.y + 52, 96, 96, { fill: N.black, alpha: 1 });
    o.add(this.add.image(P.x + 14, P.y + 52, 'mei-li-96').setOrigin(0));
    const line = win && last ? MEI_END.final : pick(win ? MEI_END.win : MEI_END[result] ?? MEI_END.lose);
    o.add(text(this, P.x + 120, P.y + 118, line, { color: C.white, wrap: P.w - 136, lineSpacing: 4 }));

    const next = () => this.scene.restart({ level: this.level + 1 });
    const retry = () => this.scene.restart({ level: this.level });
    const menu = () => goTo(this, 'Menu');
    const by = P.y + P.h - 26;
    if (win && !last) {
      this.button(o, P.x + 20, by, 'PROSSIMA', next, 96);
      this.button(o, P.x + 132, by, 'RIPROVA', retry, 96);
    } else {
      this.button(o, P.x + 20, by, 'RIPROVA', retry, 96);
    }
    this.button(o, P.x + P.w - 116, by, 'MENU', menu, 96);
    this.endActions = { primary: win && !last ? next : retry, retry, menu };
  }
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Phaser.Math.Clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
