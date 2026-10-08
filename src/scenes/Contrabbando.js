import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, panel, goTo, fadeIn } from '../ui.js';
import { sfx } from '../sfx.js';

// Placeholder until the real minigame exists.
export default class Contrabbando extends Phaser.Scene {
  constructor() {
    super('Contrabbando');
  }

  create() {
    fadeIn(this);
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x10180f).setOrigin(0);

    const g = this.add.graphics();
    panel(g, 24, 40, 160, 160, { fill: N.black, alpha: 1 });
    this.add.image(24, 40, 'zio-franco-160').setOrigin(0);

    text(this, 208, 44, 'IL CONTRABBANDO\nDI ZIO FRANCO', { size: 8, color: C.ocraLight, lineSpacing: 6 });
    const wip = text(this, 208, 84, 'LAVORI IN CORSO', { color: C.red });
    blink(this, wip, 450);
    text(this, 208, 112, '"Ti porto zucchine, ma solo se prometti di non cucinarle male."', {
      color: C.paper,
      wrap: 248,
      lineSpacing: 6,
    });
    text(this, 208, 176, '- ZIO FRANCO', { color: C.chalkDim });
    text(this, WIDTH / 2, HEIGHT - 26, 'CLICCA PER TORNARE AL MENU', { color: C.white, origin: [0.5, 0] });

    const back = () => {
      sfx.confirm();
      goTo(this, 'Menu');
    };
    this.input.once('pointerdown', back);
    this.input.keyboard.on('keydown', (e) => {
      if (['Enter', 'Space', 'Escape', 'KeyZ'].includes(e.code)) back();
    });
  }
}
