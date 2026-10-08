import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, goTo, fadeIn, droneTexture } from '../ui.js';
import { sfx } from '../sfx.js';
import { sprayTag } from '../graffiti.js';

const WALL_Y = 222;

// Attract screen: Barriera skyline at night, a drone sweeping its searchlight,
// the Muro in the foreground and the classic INSERT COIN → PRESS START.
export default class Title extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    fadeIn(this);
    this.credits = 0;
    this.canStart = false;
    const rnd = new Phaser.Math.RandomDataGenerator(['barriera']);

    this.drawSky();
    this.drawSkyline(rnd);
    this.drawDrone();
    this.drawWall();
    this.drawTitle();
    this.drawHud();

    this.input.on('pointerdown', () => this.press());
    this.input.keyboard.on('keydown', (e) => {
      if (['KeyF', 'KeyM', 'F2'].includes(e.code)) return;
      this.press();
    });
  }

  // Night sky in flat bands, with the yellowish smog on the horizon
  // ("Il cielo su Torino era giallastro, sporco di fritto riciclato e smog").
  drawSky() {
    const g = this.add.graphics();
    const bands = [0x070b14, 0x0a1020, 0x0e1626, 0x141e33, 0x1b2a44, 0x2a3047, 0x3d3a40, 0x5a4630];
    const bandH = 20;
    bands.forEach((c, i) => g.fillStyle(c, 1).fillRect(0, i * bandH + 40, WIDTH, bandH));
    g.fillStyle(bands[0], 1).fillRect(0, 0, WIDTH, 40);
    g.fillStyle(0x5a4630, 1).fillRect(0, 200, WIDTH, 30);
    // Dithered seam between bands, for that 16-bit gradient look.
    for (let i = 1; i < bands.length; i++) {
      g.fillStyle(bands[i], 1);
      const y = i * bandH + 40 - 1;
      for (let x = (i % 2); x < WIDTH; x += 2) g.fillRect(x, y, 1, 1);
    }
    const stars = this.add.graphics();
    const rnd = new Phaser.Math.RandomDataGenerator(['stelle']);
    for (let i = 0; i < 40; i++) {
      stars.fillStyle(0xc8d0e0, rnd.realInRange(0.3, 0.9));
      stars.fillRect(rnd.between(0, WIDTH), rnd.between(0, 100), 1, 1);
    }
  }

  drawSkyline(rnd) {
    const back = this.add.graphics();
    const front = this.add.graphics();
    this.windows = [];

    // Back row: flat silhouettes.
    for (let x = -10; x < WIDTH; ) {
      const w = rnd.between(24, 46);
      const h = rnd.between(40, 75);
      back.fillStyle(0x161c2a, 1).fillRect(x, WALL_Y - h - 20, w, h + 20);
      x += w + rnd.between(-4, 2);
    }

    // Front row: old Barriera blocks with antennas, balconies and lit windows.
    for (let x = -6; x < WIDTH; ) {
      const w = rnd.between(40, 72);
      const h = rnd.between(48, 96);
      const top = WALL_Y - h;
      front.fillStyle(0x0f1420, 1).fillRect(x, top, w, h);
      front.fillStyle(0x1c2333, 1).fillRect(x, top, w, 2);
      // antennas
      for (let a = 0; a < rnd.between(1, 3); a++) {
        const ax = x + rnd.between(4, w - 6);
        const ah = rnd.between(6, 14);
        front.fillStyle(0x2a3142, 1).fillRect(ax, top - ah, 1, ah);
        front.fillRect(ax - 3, top - ah + 2, 7, 1);
        front.fillRect(ax - 2, top - ah + 5, 5, 1);
      }
      // window grid
      for (let wy = top + 6; wy < WALL_Y - 8; wy += 10) {
        front.fillStyle(0x1a2030, 1).fillRect(x + 1, wy + 6, w - 2, 1); // balcony line
        for (let wx = x + 4; wx < x + w - 5; wx += 8) {
          const lit = rnd.frac() < 0.3;
          this.windows.push({ x: wx, y: wy, lit, warm: rnd.frac() < 0.75 });
        }
      }
      x += w + rnd.between(2, 8);
    }

    this.windowGfx = this.add.graphics();
    this.paintWindows();
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        for (let i = 0; i < 3; i++) {
          const w = Phaser.Utils.Array.GetRandom(this.windows);
          w.lit = !w.lit;
        }
        this.paintWindows();
      },
    });
  }

  paintWindows() {
    const g = this.windowGfx.clear();
    for (const w of this.windows) {
      if (w.lit) g.fillStyle(w.warm ? N.ocraLight : 0x9fc4e8, 1);
      else g.fillStyle(0x1f2738, 1);
      g.fillRect(w.x, w.y, 3, 4);
    }
  }

  drawDrone() {
    droneTexture(this);
    this.cone = this.add.graphics();
    this.drone = this.add.image(-20, 140, 'drone').setOrigin(0.5);
    this.droneLed = this.add.rectangle(0, 0, 1, 1, N.red).setOrigin(0);
    this.tweens.add({
      targets: this.drone,
      x: WIDTH + 20,
      duration: 14000,
      repeat: -1,
      repeatDelay: 2500,
      onRepeat: () => sfx.drone(),
    });
    this.tweens.add({ targets: this.drone, y: 134, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.sweep = 0;
  }

  drawWall() {
    const g = this.add.graphics();
    // Coping and panels of the Muro.
    g.fillStyle(N.concrete, 1).fillRect(0, WALL_Y, WIDTH, HEIGHT - WALL_Y);
    g.fillStyle(N.concreteLight, 1).fillRect(0, WALL_Y, WIDTH, 3);
    g.fillStyle(0x45453f, 1).fillRect(0, WALL_Y + 3, WIDTH, 1);
    for (let x = 0; x < WIDTH; x += 48) {
      g.fillStyle(0x45453f, 1).fillRect(x, WALL_Y + 3, 1, HEIGHT - WALL_Y);
      g.fillStyle(0x6a6a64, 1).fillRect(x + 1, WALL_Y + 3, 1, HEIGHT - WALL_Y);
    }
    // stains
    const rnd = new Phaser.Math.RandomDataGenerator(['muro']);
    for (let i = 0; i < 60; i++) {
      g.fillStyle(0x4c4c47, 1).fillRect(rnd.between(0, WIDTH), rnd.between(WALL_Y + 6, HEIGHT), rnd.between(1, 4), 1);
    }
    // barbed wire on top
    g.fillStyle(0x2a2a28, 1);
    for (let x = 0; x < WIDTH; x += 6) {
      g.fillRect(x, WALL_Y - 3 + ((x / 6) % 2), 4, 1);
      g.fillRect(x + 2, WALL_Y - 4, 1, 3);
    }
    // Teresa's tags.
    sprayTag(this, 300, WALL_Y + 2, 'COMITATO CAOS', { color: N.pink });
    // A second writer: greener, more upright and jumpier, no crown.
    sprayTag(this, 16, WALL_Y + 2, 'MURITE FUNGOIDE!', {
      color: 0x7ad34f,
      outline: 0x0b1a08,
      slant: 0.12,
      advance: 9.6,
      bounce: 2,
      swoosh: false,
      crown: null,
      drips: 10,
    });
  }

  drawTitle() {
    const t1 = text(this, WIDTH / 2, -40, 'BARRIERA', { size: 32, color: C.ocra, origin: 0.5, shadow: '#3a2408' });
    const t2 = text(this, WIDTH / 2, -40, 'BABYLON', { size: 32, color: C.white, origin: 0.5, shadow: '#2a3048' });
    t1.setShadow(3, 3, '#1a1006', 0, false, true).setPadding(0, 0, 3, 3);
    t2.setShadow(3, 3, '#0a0e18', 0, false, true).setPadding(0, 0, 3, 3);
    this.tweens.add({ targets: t1, y: 46, duration: 900, ease: 'Bounce.out' });
    this.tweens.add({ targets: t2, y: 84, duration: 900, delay: 250, ease: 'Bounce.out' });

    const sub = text(this, WIDTH / 2, 112, 'THE GAME', { color: C.paper, origin: 0.5 }).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, delay: 1200, duration: 1 });

    this.prompt = text(this, WIDTH / 2, 190, 'INSERIRE GETTONE', { color: C.white, origin: 0.5 });
    this.prompt.setVisible(false);
    this.time.delayedCall(1300, () => {
      this.prompt.setVisible(true);
      this.promptBlink = blink(this, this.prompt, 520);
    });
  }

  drawHud() {
    text(this, 8, 6, '1P 000000', { color: C.ocraLight });
    // The score is the build number (see vite.config.js).
    const build = String(__BUILD__).padStart(6, '0');
    text(this, WIDTH - 8, 6, `SOCIAL SCORE ${build}`, { color: C.red, origin: [1, 0] });
    text(this, 8, HEIGHT - 12, '© 2026 BAR STELLA SOFT', { color: C.paper, shadow: '#2a2a28' });
    this.creditText = text(this, WIDTH - 8, HEIGHT - 12, 'CREDITI 00', { color: C.paper, origin: [1, 0], shadow: '#2a2a28' });
  }

  press() {
    if (this.credits === 0) {
      this.insertCoin();
    } else if (this.canStart) {
      this.startGame();
    }
  }

  insertCoin() {
    this.credits = Math.min(this.credits + 1, 9);
    sfx.coin();
    this.creditText.setText(`CREDITI 0${this.credits}`);
    this.prompt.setText('PREMI START').setColor(C.ocraLight).setVisible(true);
    this.promptBlink?.remove();
    this.promptBlink = blink(this, this.prompt, 220);
    // Small delay so a double click doesn't skip straight past the coin.
    this.time.delayedCall(350, () => (this.canStart = true));
  }

  startGame() {
    this.canStart = false;
    sfx.start();
    this.promptBlink?.remove();
    this.prompt.setVisible(true).setText('BUONA FORTUNA');
    this.cameras.main.flash(120, 255, 240, 200);
    this.time.delayedCall(700, () => goTo(this, 'Bar'));
  }

  update(time) {
    // Searchlight cone follows the drone and sways left/right.
    const d = this.drone;
    const sway = Math.sin(time / 900) * 38;
    const gx = d.x + sway;
    this.cone
      .clear()
      .fillStyle(N.droneLight, 0.13)
      .fillTriangle(d.x - 1, d.y + 4, gx - 22, WALL_Y, gx + 22, WALL_Y)
      .fillStyle(N.droneLight, 0.1)
      .fillTriangle(d.x, d.y + 4, gx - 9, WALL_Y, gx + 9, WALL_Y)
      .fillStyle(N.droneLight, 0.25)
      .fillRect(Math.round(gx - 20), WALL_Y, 40, 2);
    this.droneLed.setPosition(Math.round(d.x - 1), Math.round(d.y - 2));
    this.droneLed.setVisible(Math.floor(time / 300) % 2 === 0);
  }
}
