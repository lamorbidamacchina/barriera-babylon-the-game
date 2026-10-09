// Position check: the game freezes and the player must type the 4-digit code
// before the countdown ends (shorter on harder recipes), as Bea does every
// day. Missing it ends the round. Two flavours: the random
// "verifica obbligatoria", and the one a drone starts when you touch it
// (chapter 1: "Cittadino, la tua posizione non è stata confermata").
// On harder recipes the keypad digits come shuffled, like a bank's.
import Phaser from 'phaser';
import { WIDTH, HEIGHT, C, N } from '../../config.js';
import { text, panel } from '../../ui.js';
import { sfx } from '../../sfx.js';

const P = { x: 112, y: 30, w: 256, h: 214 };
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export class OtpCheck {
  constructor(scene, onDone) {
    this.scene = scene;
    this.onDone = onDone;
    this.objects = [];
    this.closed = true; // nothing open yet
  }

  add(obj) {
    this.objects.push(obj.setDepth(200));
    return obj;
  }

  open(reason = 'random', seconds = 8, shuffle = false) {
    const s = this.scene;
    this.code = String(Math.floor(1000 + Math.random() * 9000));
    this.entry = '';
    this.left = seconds;
    this.closed = false;

    // Full-screen blocker so clicks don't reach the game underneath.
    this.add(s.add.rectangle(0, 0, WIDTH, HEIGHT, N.black, 0.75).setOrigin(0).setInteractive());
    const g = this.add(s.add.graphics());
    panel(g, P.x, P.y, P.w, P.h, { fill: 0x1a0a0c, border: N.red });

    const [l1, l2, l3] =
      reason === 'drone'
        ? ['CITTADINO, CONFERMA', 'LA TUA POSIZIONE', 'Il drone ti ha scansionato.']
        : ['VERIFICA DI POSIZIONE', 'OBBLIGATORIA', 'Cittadinanza Barriera attiva.'];
    this.add(text(s, WIDTH / 2, P.y + 10, l1, { color: C.red, origin: [0.5, 0] }));
    this.add(text(s, WIDTH / 2, P.y + 22, l2, { color: C.red, origin: [0.5, 0] }));
    this.add(text(s, WIDTH / 2, P.y + 38, l3, { color: C.chalkDim, origin: [0.5, 0] }));
    this.add(text(s, P.x + 16, P.y + 56, 'CODICE', { color: C.paper }));
    this.add(text(s, P.x + 72, P.y + 52, this.code, { size: 16, color: C.ocraLight }));
    this.countText = this.add(text(s, P.x + P.w - 16, P.y + 52, String(this.left), { size: 16, color: C.red, origin: [1, 0] }));
    this.entryText = this.add(text(s, WIDTH / 2, P.y + 78, '____', { size: 16, color: C.white, origin: [0.5, 0] }));

    // Keypad, 3x4: nine digits, then C, the last digit, <.
    const d = shuffle ? Phaser.Utils.Array.Shuffle([...DIGITS]) : DIGITS;
    const keys = [...d.slice(0, 9), 'C', d[9], '<'];
    const bw = 40;
    const bh = 18;
    const gap = 6;
    const x0 = WIDTH / 2 - (bw * 3 + gap * 2) / 2;
    const y0 = P.y + 104;
    keys.forEach((k, i) => {
      const x = x0 + (i % 3) * (bw + gap);
      const y = y0 + Math.floor(i / 3) * (bh + gap);
      const bg = this.add(s.add.rectangle(x, y, bw, bh, 0x2a1418).setOrigin(0).setStrokeStyle(1, N.red, 0.7));
      this.add(text(s, x + bw / 2, y + 5, k, { color: C.white, origin: [0.5, 0] }));
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        bg.setFillStyle(0x5a2028);
        s.time.delayedCall(80, () => bg.setFillStyle(0x2a1418));
        this.press(k);
      });
    });

    this.onKey = (e) => {
      const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
      if (m) this.press(m[1]);
      else if (e.code === 'Backspace') this.press('<');
      else if (e.code === 'Delete') this.press('C');
    };
    s.input.keyboard.on('keydown', this.onKey);

    sfx.alarm();
    this.timer = s.time.addEvent({
      delay: 1000,
      repeat: seconds - 1,
      callback: () => {
        this.left--;
        this.countText.setText(String(this.left));
        sfx.tick();
        if (this.left <= 0) this.close(false);
      },
    });
  }

  press(k) {
    if (this.closed) return;
    if (k === 'C') this.entry = '';
    else if (k === '<') this.entry = this.entry.slice(0, -1);
    else if (this.entry.length < 4) this.entry += k;
    sfx.key();
    this.entryText.setText(this.entry.padEnd(4, '_'));

    if (this.entry.length === 4) {
      if (this.entry === this.code) {
        this.close(true);
      } else {
        sfx.error();
        this.entryText.setColor(C.red);
        this.scene.time.delayedCall(250, () => {
          if (this.closed) return;
          this.entry = '';
          this.entryText.setText('____').setColor(C.white);
        });
      }
    }
  }

  // Closes at once without calling back (e.g. the round's time ran out).
  abort() {
    if (this.closed) return;
    this.closed = true;
    this.timer.remove();
    this.scene.input.keyboard.off('keydown', this.onKey);
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
  }

  close(success) {
    if (this.closed) return;
    this.closed = true;
    this.timer.remove();
    this.scene.input.keyboard.off('keydown', this.onKey);
    this.entryText.setText(success ? 'OK' : 'SCADUTO').setColor(success ? '#9be36b' : C.red);
    this.scene.time.delayedCall(450, () => {
      this.objects.forEach((o) => o.destroy());
      this.objects = [];
      this.onDone(success);
    });
  }
}
