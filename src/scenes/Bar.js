import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, panel, goTo, fadeIn, makeTexture, droneTexture } from '../ui.js';
import { sfx } from '../sfx.js';
import { Painter } from '../painter.js';
import { YARN, POSTER, POSTERS, SCALDATELLI, drawYarn, drawScaldatelli } from '../sprites/bar.js';
import { GREETINGS, QUOTES, INVITE } from '../data/meili.js';

const BOX = { x: 192, y: 112, w: 272, h: 84 };
const WIN = { x: 392, y: 52, w: 72, h: 46 };
const CPS = 40; // typewriter speed, characters per second

// Bar Stella: Mei Li welcomes the player with a few lines, then the menu.
export default class Bar extends Phaser.Scene {
  constructor() {
    super('Bar');
  }

  create() {
    fadeIn(this);
    this.lines = [
      Phaser.Utils.Array.GetRandom(GREETINGS),
      Phaser.Utils.Array.GetRandom(QUOTES),
      INVITE,
    ];
    this.lineIndex = -1;

    this.drawRoom();
    this.drawWindow();
    this.drawPortrait();
    this.drawDialogue();
    this.nextLine();

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard.on('keydown', (e) => {
      if (e.code === 'Escape') return goTo(this, 'Title');
      if (['Enter', 'Space', 'KeyZ', 'KeyX', 'ArrowRight'].includes(e.code)) this.advance();
    });
  }

  drawRoom() {
    makeTexture(this, 'brick', 32, 16, (g) => {
      g.fillStyle(N.mortar, 1).fillRect(0, 0, 32, 16);
      g.fillStyle(N.brick, 1);
      g.fillRect(0, 1, 15, 6).fillRect(16, 1, 16, 6);
      g.fillRect(-8, 9, 15, 6).fillRect(8, 9, 15, 6).fillRect(24, 9, 8, 6);
      g.fillStyle(0x6b3a2e, 1).fillRect(1, 1, 6, 1).fillRect(17, 1, 5, 1).fillRect(9, 9, 6, 1);
    });
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'brick').setOrigin(0);
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x05070c, 0.45).setOrigin(0);

    // Shelf with bottles behind the counter.
    const g = this.add.graphics();
    g.fillStyle(N.woodDark, 1).fillRect(192, 92, 188, 4);
    const bottles = [0x2f5d3a, 0x6b2a2a, 0x2f5d3a, 0xb8a46a, 0x3a3f6b, 0x6b2a2a, 0x2f5d3a, 0xc9963a, 0x4a2a5a, 0x2f5d3a, 0x8a3a2a];
    bottles.forEach((c, i) => {
      const x = 198 + i * 16;
      const h = 14 + ((i * 7) % 9);
      g.fillStyle(c, 1).fillRect(x, 92 - h, 7, h);
      g.fillRect(x + 2, 92 - h - 5, 3, 5);
      g.fillStyle(0xffffff, 0.25).fillRect(x + 1, 92 - h + 2, 1, h - 4);
      g.fillStyle(N.paper, 0.8).fillRect(x + 1, 92 - h / 2, 5, 4);
    });

    // Counter.
    g.fillStyle(N.woodLight, 1).fillRect(0, 214, WIDTH, 4);
    g.fillStyle(N.wood, 1).fillRect(0, 218, WIDTH, 10);
    g.fillStyle(N.woodDark, 1).fillRect(0, 228, WIDTH, HEIGHT - 228);
    for (let x = 12; x < WIDTH; x += 40) g.fillStyle(0x2e1c0f, 1).fillRect(x, 232, 24, HEIGHT - 240);

    // Cup of "cicoria deluxe", a bag of scaldatelli, and a ball of yarn with
    // needles (foreshadowing).
    g.fillStyle(0xe9e4d8, 1).fillRect(260, 204, 14, 10).fillRect(274, 206, 3, 5);
    g.fillStyle(0xd8d0c0, 1).fillRect(256, 213, 22, 2);
    g.fillStyle(0x3a2414, 1).fillRect(261, 204, 12, 2);
    const sprite = (key, { w, h }, draw) =>
      makeTexture(this, key, w, h, (tg) => {
        const p = new Painter(w, h);
        draw(p);
        p.toGraphics(tg);
      });
    sprite('yarn', YARN, drawYarn);
    this.add.image(409, 195, 'yarn').setOrigin(0);
    // Two bags of scaldatelli under the dialogue box: the back one a bit
    // higher and darker, the front one lower and overlapping it.
    sprite('scaldatelli', SCALDATELLI, drawScaldatelli);
    this.add.image(206, 197, 'scaldatelli').setOrigin(0).setTint(0xc8c8c8);
    this.add.image(217, 200, 'scaldatelli').setOrigin(0);

    // Posters stuck on the front of the counter, under Mei Li.
    // Three of them, different every visit.
    const names = Phaser.Utils.Array.Shuffle(Object.keys(POSTERS)).slice(0, 3);
    names.forEach((name, i) => {
      sprite(`poster-${name}`, POSTER, POSTERS[name]);
      this.add.image(20 + i * 64, 220 + (i % 2), `poster-${name}`).setOrigin(0);
    });

    // Neon sign, with a cheap glow and an unreliable transformer.
    const glow = [];
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      glow.push(text(this, 284 + dx, 18 + dy, 'BAR STELLA', { size: 16, color: C.neon, origin: [0.5, 0], shadow: null }).setAlpha(0.35));
    }
    const sign = text(this, 284, 18, 'BAR STELLA', { size: 16, color: C.neonGlow, origin: [0.5, 0], shadow: null });
    this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        const off = Math.random() < 0.04;
        sign.setAlpha(off ? 0.25 : 1);
        glow.forEach((t) => t.setVisible(!off));
      },
    });
    text(this, 284, 40, "CAFFE' 1,00  VINO 2,00", { color: C.paper, origin: [0.5, 0] }).setAlpha(0.7);
  }

  // A window on the street: every so often a drone comes to peek, and Mei Li
  // chases it away with her toy laser ("con una lentezza offesa").
  drawWindow() {
    droneTexture(this);
    const g = this.add.graphics();
    g.fillStyle(N.night, 1).fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    g.fillStyle(0x161c2a, 1).fillRect(WIN.x, WIN.y + 26, 20, 20).fillRect(WIN.x + 24, WIN.y + 18, 26, 28).fillRect(WIN.x + 54, WIN.y + 30, 18, 16);
    g.fillStyle(N.ocraLight, 1).fillRect(WIN.x + 28, WIN.y + 22, 2, 3).fillRect(WIN.x + 40, WIN.y + 30, 2, 3).fillRect(WIN.x + 6, WIN.y + 32, 2, 3);

    this.peeker = this.add.image(0, 0, 'drone').setAlpha(0);

    const frame = this.add.graphics();
    frame.lineStyle(2, N.woodLight, 1).strokeRect(WIN.x - 1, WIN.y - 1, WIN.w + 2, WIN.h + 2);
    frame.fillStyle(N.woodLight, 1).fillRect(WIN.x + WIN.w / 2 - 1, WIN.y, 2, WIN.h).fillRect(WIN.x, WIN.y + WIN.h / 2 - 1, WIN.w, 2);
    this.laser = this.add.graphics();

    this.time.addEvent({ delay: 7000, loop: true, startAt: 3500, callback: () => this.dronePeek() });
  }

  dronePeek() {
    const d = this.peeker;
    d.setPosition(WIN.x + 10, WIN.y + 14).setAngle(0).setAlpha(0);
    this.tweens.chain({
      targets: d,
      tweens: [
        { alpha: 1, duration: 200 },
        { x: WIN.x + WIN.w / 2 - 6, duration: 1400, ease: 'Sine.out' },
        { y: WIN.y + 16, duration: 300, yoyo: true, repeat: 1 },
        {
          duration: 1,
          onComplete: () => {
            sfx.laser();
            this.laser.clear().lineStyle(1, N.red, 1).lineBetween(130, 150, d.x, d.y + 2);
            this.time.delayedCall(120, () => this.laser.clear());
          },
        },
        { angle: -18, duration: 120 },
        { x: WIN.x + WIN.w - 12, y: WIN.y + 8, duration: 2200, ease: 'Sine.in' },
        { alpha: 0, duration: 200 },
      ],
    });
  }

  drawPortrait() {
    const g = this.add.graphics();
    panel(g, 16, 24, 160, 160, { fill: N.black, alpha: 1 });
    this.add.image(16, 24, 'mei-li-160').setOrigin(0);
    // Name plate.
    panel(g, 16, 192, 160, 14, { fill: N.night });
    text(this, 96, 195, 'MEI LI', { color: C.ocraLight, origin: [0.5, 0] });
  }

  drawDialogue() {
    panel(this.add.graphics(), BOX.x, BOX.y, BOX.w, BOX.h);
    const g = this.add.graphics();
    g.fillStyle(N.ocra, 1).fillRect(BOX.x + 8, BOX.y - 6, 60, 11);
    text(this, BOX.x + 38, BOX.y - 4, 'MEI LI', { color: C.night, origin: [0.5, 0], shadow: null });

    this.body = text(this, BOX.x + 10, BOX.y + 14, '', { color: C.white, wrap: BOX.w - 20, lineSpacing: 6 });
    this.caret = this.add.triangle(BOX.x + BOX.w - 14, BOX.y + BOX.h - 10, 0, 0, 7, 0, 3.5, 4, N.ocraLight).setOrigin(0);
    this.caret.setVisible(false);
    this.caretBlink = blink(this, this.caret, 350);
    this.caretBlink.paused = true;
    text(this, WIDTH - 16, HEIGHT - 14, 'CLICCA O INVIO', { color: C.paper, origin: [1, 0] }).setAlpha(0.6);
  }

  nextLine() {
    this.lineIndex++;
    if (this.lineIndex >= this.lines.length) {
      sfx.confirm();
      return goTo(this, 'Menu');
    }
    this.full = this.lines[this.lineIndex];
    this.shown = 0;
    this.typing = true;
    this.caret.setVisible(false);
    this.caretBlink.paused = true;
    this.body.setText('');
    this.typer?.remove();
    this.typer = this.time.addEvent({
      delay: 1000 / CPS,
      repeat: this.full.length - 1,
      callback: () => {
        this.shown++;
        this.body.setText(this.full.slice(0, this.shown));
        if (this.shown % 2 === 0 && this.full[this.shown - 1] !== ' ') sfx.blip();
        if (this.shown >= this.full.length) this.finishLine();
      },
    });
  }

  finishLine() {
    this.typer?.remove();
    this.typing = false;
    this.body.setText(this.full);
    this.caret.setVisible(true);
    this.caretBlink.paused = false;
  }

  advance() {
    if (this.typing) this.finishLine();
    else this.nextLine();
  }
}
