import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, goTo, fadeIn, panel } from '../ui.js';
import { sfx } from '../sfx.js';
import { loadSave, writeSave } from '../save.js';
import { Painter } from '../painter.js';
import { ADULT, KID, FRONT_ROW, SECOND_ROW, KIDS, NEIGHBOURS, luna } from '../finale/figures.js';
import { drawPiazza, PIAZZA_W } from '../finale/piazza.js';
import { drawStreet, drawRuspaSide, WALL, GROUND_Y, RUSPA_SIDE } from '../finale/muro.js';
import { drawWall } from '../games/muro/sprites.js';
import { createView } from '../games/muro/views.js';

const STEP_MS = 320; // one step of the march
const PANEL_W = 40; // the Muro's concrete panels
// What the Muro hid, one strip each: the five pictures of Muro Panic.
const BEHIND = ['universita', 'salute', 'parco', 'asilo', 'casa'];
const MEI_LINE = 'Muro giù. Bar aperto. Caffè costa uguale.';

// The finale, once every level of the four games is won: the neighbourhood
// marches down Piazza Crispi under its canopy, like Il Quarto Stato; the
// camera moves on to the Muro and the bulldozers, ours now, knock it down
// panel by panel, uncovering the Torino it hid. Then FINE. A tap skips to
// the next part; at the end it goes back to the menu.
export default class Finale extends Phaser.Scene {
  constructor() {
    super('Finale');
  }

  create() {
    fadeIn(this);
    const save = loadSave();
    save.finaleSeen = true; // shown on its own only once; the menu keeps it
    writeSave(save);

    this.part = 'march';
    this.figures = [];
    this.makeTextures();
    this.cameras.main.setBounds(0, 0, PIAZZA_W * 2, HEIGHT);
    this.add.image(0, 0, 'fin-piazza').setOrigin(0);
    this.setupStreet();
    this.setupMarch();

    this.input.on('pointerdown', () => this.skip());
    this.input.keyboard.on('keydown', (e) => {
      if (['Enter', 'Space', 'Escape'].includes(e.code)) this.skip();
    });
    this.elapsed = 0; // ms since the start, counted frame by frame (see update)
  }

  // The march's own clock: the title after 1.5 s, the Muro after 13 s. A
  // delayedCall set in create() could fire early, when the game clock is
  // behind as the scene starts and catches up on the first frame.
  update(time, delta) {
    if (this.part !== 'march') return;
    this.elapsed += Math.min(delta, 50);
    if (this.elapsed >= 1500 && !this.titleUi) this.showTitle();
    if (this.elapsed >= 13000) this.toMuro();
  }

  // ---------------------------------------------------------------- textures

  canvas(key, w, h, draw) {
    if (this.textures.exists(key)) return key;
    const p = new Painter(w, h);
    draw(p);
    this.textures.addCanvas(key, p.toCanvas());
    return key;
  }

  // Each figure in two walk frames, at the size of its row.
  figure(name, draw, w, h) {
    return [0, 1].map((f) => this.canvas(`fin-${name}-${h}-${f}`, w, h, (p) => draw(p, f)));
  }

  makeTextures() {
    this.canvas('fin-piazza', PIAZZA_W, HEIGHT, drawPiazza);
    this.canvas('fin-street', PIAZZA_W, HEIGHT, drawStreet);
    this.canvas('fin-wall', WALL.w, WALL.h, (p) => drawWall(p, WALL.w, WALL.h));
    this.canvas('fin-ruspa', RUSPA_SIDE.w, RUSPA_SIDE.h, drawRuspaSide);
    for (const v of BEHIND) createView(this, v);
  }

  // ---------------------------------------------------------------- the march

  // The rows from the back to the front, each a bit bigger and nearer, and
  // mixed all through: Barriera is many places at once. Franco, Mei Li and
  // Rosanna with Luna by the hand lead in the middle of the front row.
  setupMarch() {
    const F = { ...NEIGHBOURS, ...SECOND_ROW, ...KIDS, ...FRONT_ROW, luna };
    const rows = [
      // The far crowd, small, filling the end of the canopy.
      { y: 172, h: 28, w: 14, from: 150, to: 330, names: ['operaio', 'maghrebWoman', 'nigerianMan', 'nonna', 'chineseMan', 'bangladeshiMan', 'pakistaniWoman', 'nigerianWoman', 'maghrebMan', 'nonna', 'operaio', 'bangladeshiWoman', 'pakistaniMan', 'chineseMan'] },
      { y: 200, h: 40, w: 20, from: 112, to: 368, names: ['chineseMan', 'nonna', 'maghrebWoman', 'operaio', 'pakistaniMan', 'nigerianWoman', 'bangladeshiMan', 'nonna'] },
      { y: 222, h: 36, w: 20, from: 140, to: 340, names: ['teresa', 'chiara', 'gigi', 'samir', 'ayoub', 'marco'] },
      { y: 236, h: 48, w: 24, from: 130, to: 350, names: ['pakistaniWoman', 'donRemo', 'maghrebMan', 'bea', 'nigerianWoman'] },
    ];
    this.group = this.add.container(0, -24);
    for (const row of rows) {
      const n = row.names.length;
      row.names.forEach((name, i) => {
        const x = Math.round(row.from + ((row.to - row.from) * (i + 0.5)) / n);
        this.addFigure(name, F[name], row.w, row.h, x, row.y, (i + n) % 2);
      });
    }
    // The front row.
    this.addFigure('nigerianMan', F.nigerianMan, ADULT.w, ADULT.h, 128, 268, 0);
    this.addFigure('zioFranco', F.zioFranco, ADULT.w, ADULT.h, 184, 268, 1);
    this.addFigure('meiLi', F.meiLi, ADULT.w, ADULT.h, 240, 268, 0);
    this.addFigure('rosanna', F.rosanna, ADULT.w, ADULT.h, 296, 268, 1);
    this.addFigure('luna', luna, KID.w, KID.h, 324, 268, 0);
    this.addFigure('bangladeshiWoman', F.bangladeshiWoman, ADULT.w, ADULT.h, 360, 268, 1);

    // The march: every step all frames swap and the crowd comes a bit nearer.
    this.marchStep = 0;
    this.marchTimer = this.time.addEvent({
      delay: STEP_MS,
      loop: true,
      callback: () => {
        this.marchStep++;
        for (const f of this.figures) f.img.setTexture(f.frames[(this.marchStep + f.phase) % 2]);
        if (this.part === 'march') {
          sfx.step(this.marchStep % 2 === 0);
          this.group.y = Math.min(0, this.group.y + 0.6);
        }
      },
    });
  }

  // The title, in chalk on a dark band over the roof.
  showTitle() {
    const band = this.add.rectangle(WIDTH / 2, 22, 280, 26, N.black, 0.65).setDepth(20);
    const t1 = text(this, WIDTH / 2, 22, 'BARRIERA BABYLON', { size: 16, color: C.chalk, origin: 0.5 }).setDepth(21);
    this.titleUi = [band, t1];
    for (const o of this.titleUi) {
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: o === band ? 0.65 : 1, duration: 800 });
    }
  }

  addFigure(name, draw, w, h, x, feetY, phase) {
    const frames = this.figure(name, draw, w, h);
    const img = this.add.image(x, feetY, frames[phase]).setOrigin(0.5, 1);
    this.group.add(img);
    this.figures.push({ img, frames, phase });
  }

  // ---------------------------------------------------------------- the Muro

  // The street to the right of the piazza: the five pictures of Torino
  // behind, the Muro over them in panels, the bulldozers waiting off screen.
  setupStreet() {
    const ox = PIAZZA_W;
    this.add.image(ox, 0, 'fin-street').setOrigin(0);
    const strip = Math.ceil(WALL.w / BEHIND.length);
    // Each picture shows only its own strip, where the Muro stands.
    BEHIND.forEach((v, i) => this.add.image(ox + WALL.x, 0, `view-${v}`).setOrigin(0).setCrop(i * strip, WALL.y, strip, WALL.h));
    this.panels = [];
    for (let x = 0; x < WALL.w; x += PANEL_W) {
      const img = this.add
        .image(ox + WALL.x + x + PANEL_W / 2, WALL.y + WALL.h, 'fin-wall')
        .setOrigin(0.5, 1)
        .setCrop(x, 0, PANEL_W, WALL.h);
      // A crop keeps the whole texture's frame: pivot on this strip's foot,
      // so the panel tips over from there.
      img.setDisplayOrigin(x + PANEL_W / 2, WALL.h);
      this.panels.push({ img, x: ox + WALL.x + x, down: false });
    }
    // Waiting left of the street, which is still the piazza's frame: hidden
    // until they set off.
    this.ruspe = [0, 1, 2].map((i) =>
      this.add.image(ox - 80 - i * 120, GROUND_Y + 14, 'fin-ruspa').setOrigin(0, 1).setDepth(5).setVisible(false),
    );
  }

  toMuro() {
    if (this.part !== 'march') return;
    this.part = 'pan';
    for (const o of this.titleUi ?? []) this.tweens.add({ targets: o, alpha: 0, duration: 400 });
    this.cameras.main.pan(PIAZZA_W + WIDTH / 2, HEIGHT / 2, 4000, 'Sine.easeInOut');
    this.time.delayedCall(4200, () => this.bulldoze());
  }

  // The bulldozers drive along the foot of the Muro; every panel a blade
  // reaches tips over backwards and falls, with dust and a crash.
  bulldoze() {
    if (this.part === 'end') return;
    this.part = 'muro';
    const speed = 46; // px per second
    this.engineTimer = this.time.addEvent({ delay: 450, loop: true, callback: () => sfx.engine() });
    for (const r of this.ruspe) {
      r.setVisible(true);
      this.tweens.add({ targets: r, x: r.x + 900, duration: (900 / speed) * 1000, ease: 'Linear' });
    }
    this.muroCheck = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        for (const p of this.panels) {
          if (p.down) continue;
          const hit = this.ruspe.some((r) => r.x + RUSPA_SIDE.w >= p.x + PANEL_W / 2);
          if (hit) this.knockDown(p);
        }
        if (this.panels.every((p) => p.down)) {
          this.muroCheck.remove();
          this.time.delayedCall(2500, () => this.ending());
        }
      },
    });
  }

  knockDown(p) {
    p.down = true;
    sfx.crash();
    this.cameras.main.shake(160, 0.006);
    // Tipping backwards: it shrinks from the top down and darkens.
    this.tweens.add({ targets: p.img, scaleY: 0, duration: 520, ease: 'Quad.in', onUpdate: () => p.img.setTint(0x9a9a94) });
    // Dust along its foot, chunks of concrete flying forward.
    for (let i = 0; i < 6; i++) {
      const dust = this.add.circle(p.x + Math.random() * PANEL_W, GROUND_Y - 4, 4 + Math.random() * 5, 0xb8b0a0, 0.8).setDepth(6);
      this.tweens.add({ targets: dust, y: dust.y - 18 - Math.random() * 16, scale: 2.4, alpha: 0, duration: 900 + Math.random() * 400, onComplete: () => dust.destroy() });
    }
    for (let i = 0; i < 4; i++) {
      const chunk = this.add.rectangle(p.x + Math.random() * PANEL_W, GROUND_Y - 30 - Math.random() * 40, 3 + Math.random() * 4, 3, 0x6a6a64).setDepth(6);
      this.tweens.add({ targets: chunk, y: GROUND_Y + 10 + Math.random() * 30, x: chunk.x + (Math.random() - 0.5) * 30, angle: 180, duration: 500 + Math.random() * 300, ease: 'Quad.in', onComplete: () => chunk.destroy() });
    }
  }

  // ---------------------------------------------------------------- the end

  ending() {
    if (this.part === 'end') return;
    this.part = 'end';
    this.engineTimer?.remove();
    this.muroCheck?.remove();
    for (const p of this.panels) {
      if (!p.down) p.img.setScale(1, 0);
      p.down = true;
    }
    this.cameras.main.pan(PIAZZA_W + WIDTH / 2, HEIGHT / 2, 1); // in case it was skipped
    sfx.win();
    const cam = this.cameras.main;
    const at = (x, y) => ({ x: x + PIAZZA_W, y }); // in the street's frame, which the camera shows
    const P = { x: 70, y: 46, w: 340, h: 178 };
    const g = this.add.graphics().setDepth(30);
    panel(g, at(P.x).x, P.y, P.w, P.h);
    const ui = [g];
    const add = (o) => (ui.push(o.setDepth(31)), o);
    add(text(this, at(WIDTH / 2).x, P.y + 14, 'FINE', { size: 16, color: C.ocraLight, origin: [0.5, 0] }));
    const pg = this.add.graphics().setDepth(31);
    panel(pg, at(P.x + 14).x, P.y + 40, 96, 96, { fill: N.black, alpha: 1 });
    add(this.add.image(at(P.x + 14).x, P.y + 40, 'mei-li-96').setOrigin(0));
    add(text(this, at(P.x + 124).x, P.y + 44, MEI_LINE, { color: C.white, wrap: 200, lineSpacing: 5 }));
    add(text(this, at(P.x + 124).x, P.y + 96, 'La storia continua su', { color: C.chalkDim }));
    add(text(this, at(P.x + 124).x, P.y + 112, 'BARRIERA BABYLON', { color: C.ocraLight }));
    add(text(this, at(P.x + 124).x, P.y + 124, 'barrierababylon.it', { color: C.pink }));
    const touch = matchMedia('(pointer: coarse)').matches;
    const go = add(text(this, at(WIDTH / 2).x, P.y + P.h - 20, touch ? 'TOCCA PER TORNARE AL MENU' : 'CLICCA PER TORNARE AL MENU', { color: C.ocraLight, origin: [0.5, 0] }));
    blink(this, go, 450);
    for (const o of [...ui, pg]) {
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: 1, duration: 700 });
    }
    cam.flash(300, 255, 240, 200);
    this.canLeave = false;
    this.time.delayedCall(1200, () => (this.canLeave = true));
  }

  // A tap moves on: from the march to the Muro, from the Muro to the end,
  // from the end back to the menu.
  skip() {
    if (this.part === 'march') this.toMuro();
    else if (this.part === 'pan' || this.part === 'muro') this.ending();
    else if (this.part === 'end' && this.canLeave) goTo(this, 'Menu');
  }
}
