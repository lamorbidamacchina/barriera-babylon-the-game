import Phaser from 'phaser';
import { WIDTH, HEIGHT, N } from '../config.js';

const PORTRAITS = ['mei-li', 'zio-franco', 'don-remo', 'rosanna', 'bea', 'barriera'];

export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Minimal loading bar, in case the network is slow.
    const g = this.add.graphics();
    this.load.on('progress', (p) => {
      g.clear();
      g.fillStyle(N.night2, 1).fillRect(WIDTH / 2 - 60, HEIGHT / 2, 120, 4);
      g.fillStyle(N.ocra, 1).fillRect(WIDTH / 2 - 60, HEIGHT / 2, 120 * p, 4);
    });

    for (const name of PORTRAITS) {
      this.load.image(`${name}-96`, `assets/portraits/${name}-96.png`);
      this.load.image(`${name}-160`, `assets/portraits/${name}-160.png`);
    }
  }

  create() {
    this.scene.start('Title');
  }
}
