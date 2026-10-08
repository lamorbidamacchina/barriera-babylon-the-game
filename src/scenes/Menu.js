import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../config.js';
import { text, blink, goTo, fadeIn } from '../ui.js';
import { sfx } from '../sfx.js';
import { GAMES } from '../data/games.js';

const LIST_X = 40;
const LIST_Y = 62;
const ROW_H = 34;
const PIC = { x: 348, y: 62, size: 96 };

// Game selection, written in chalk on the Bar Stella blackboard.
export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    fadeIn(this);
    this.index = 0;

    this.drawBoard();
    this.rows = GAMES.map((game, i) => this.drawRow(game, i));
    this.drawPicture();
    this.meiText = text(this, 32, 226, '', { color: C.chalkHi, wrap: WIDTH - 64, lineSpacing: 4 });
    this.select(0, false);

    this.input.keyboard.on('keydown', (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.select(this.index - 1);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.select(this.index + 1);
      if (['Enter', 'Space', 'KeyZ'].includes(e.code)) this.choose();
      if (e.code === 'Escape' || e.code === 'Backspace') goTo(this, 'Title');
    });
  }

  drawBoard() {
    const g = this.add.graphics();
    g.fillStyle(N.woodDark, 1).fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(N.wood, 1).fillRect(4, 4, WIDTH - 8, HEIGHT - 8);
    g.fillStyle(N.woodLight, 1).fillRect(4, 4, WIDTH - 8, 2).fillRect(4, 4, 2, HEIGHT - 8);
    g.fillStyle(N.board, 1).fillRect(14, 14, WIDTH - 28, HEIGHT - 28);

    // Chalk smudges from previous menus nobody erased properly.
    const rnd = new Phaser.Math.RandomDataGenerator(['lavagna']);
    for (let i = 0; i < 70; i++) {
      g.fillStyle(0x3a4a40, rnd.realInRange(0.15, 0.4));
      g.fillRect(rnd.between(16, WIDTH - 40), rnd.between(16, HEIGHT - 20), rnd.between(6, 28), 1);
    }
    // Chalk ledge at the bottom.
    g.fillStyle(N.woodLight, 1).fillRect(14, HEIGHT - 16, WIDTH - 28, 3);
    g.fillStyle(N.chalk, 1).fillRect(60, HEIGHT - 18, 10, 2);
    g.fillStyle(0xd6a0a0, 1).fillRect(400, HEIGHT - 18, 7, 2);

    text(this, WIDTH / 2, 22, 'MENU DEL GIORNO', { size: 16, color: C.chalk, origin: [0.5, 0], shadow: '#0e1410' });
    // Hand-drawn wavy underline.
    for (let x = 120; x < 360; x += 2) {
      g.fillStyle(N.chalk, 0.8).fillRect(x, 42 + Math.round(Math.sin(x / 6)), 2, 1);
    }

    // Divider between the list and Mei Li's comment.
    for (let x = 30; x < WIDTH - 30; x += 6) g.fillStyle(N.chalkDim, 0.6).fillRect(x, 216, 3, 1);
  }

  drawRow(game, i) {
    const y = LIST_Y + i * ROW_H;
    const color = game.available ? C.chalk : C.chalkDim;
    const title = text(this, LIST_X, y, game.title, { color, shadow: '#0e1410' });
    const sub = game.available ? game.desc : 'DOMANI';
    const desc = text(this, LIST_X, y + 12, sub, { color: C.chalkDim, shadow: null });
    if (!game.available) {
      // Crossed out in chalk, like a dish that's finished.
      const g = this.add.graphics();
      g.fillStyle(N.chalkDim, 0.8).fillRect(LIST_X - 2, y + 3, title.width + 4, 1);
    }
    const hit = this.add.zone(LIST_X - 16, y - 4, 300, ROW_H - 4).setOrigin(0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => this.select(i));
    hit.on('pointerdown', () => {
      this.select(i, false);
      this.choose();
    });
    return { title, desc, y };
  }

  drawPicture() {
    const g = this.add.graphics();
    g.lineStyle(1, N.chalk, 0.8).strokeRect(PIC.x - 3.5, PIC.y - 3.5, PIC.size + 7, PIC.size + 7);
    this.pic = this.add.image(PIC.x, PIC.y, GAMES[0].portrait).setOrigin(0);
    this.picShade = this.add.rectangle(PIC.x, PIC.y, PIC.size, PIC.size, N.board, 0.65).setOrigin(0);
    this.picStamp = text(this, PIC.x + PIC.size / 2, PIC.y + PIC.size / 2 - 4, 'DOMANI', { color: C.red, origin: 0.5, shadow: C.black });
    this.picCaption = text(this, PIC.x + PIC.size / 2, PIC.y + PIC.size + 10, '', { color: C.chalkHi, origin: [0.5, 0] });

    this.cursor = text(this, LIST_X - 14, LIST_Y, '>', { color: C.chalkHi });
    blink(this, this.cursor, 300);
  }

  select(i, withSound = true) {
    const next = Phaser.Math.Wrap(i, 0, GAMES.length);
    if (next === this.index && withSound) return;
    this.index = next;
    if (withSound) sfx.move();

    const game = GAMES[next];
    this.rows.forEach((row, r) => {
      const on = r === next;
      row.title.setColor(on ? C.chalkHi : GAMES[r].available ? C.chalk : C.chalkDim);
    });
    this.cursor.setY(this.rows[next].y);
    this.pic.setTexture(game.portrait);
    this.picShade.setVisible(!game.available);
    this.picStamp.setVisible(!game.available);
    this.picCaption.setText(game.available ? '1 GETTONE' : 'CHIUSO');
    this.meiText.setText(`MEI LI: ${game.mei}`);
  }

  choose() {
    const game = GAMES[this.index];
    if (!game.available) {
      sfx.error();
      const row = this.rows[this.index];
      this.tweens.add({ targets: [row.title, row.desc], x: LIST_X + 3, duration: 40, yoyo: true, repeat: 3, onComplete: () => row.title.setX(LIST_X) });
      return;
    }
    sfx.start();
    this.cameras.main.flash(100, 255, 240, 200);
    this.time.delayedCall(400, () => goTo(this, game.scene));
  }
}
