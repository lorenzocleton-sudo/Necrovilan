import Phaser from 'phaser';
import { C, PALETTE } from '../art/palette';
import { GAME_W, GAME_H, TILE, TITLE_WORLD_SCALE as S, VERSION } from '../data/config';
import { makeRng } from '../logic/rng';
import { play, unlockAudio } from '../audio/sfx';
import { idleAnimKey } from '../art/textures';
import { TITLE_FONT, UI_FONT, makeButton } from './ui';

const GROUND_Y = 180; // necromancer's feet on the title strip

export class TitleScene extends Phaser.Scene {
  private started = false;
  private rng = makeRng(0x6e3c);

  constructor() {
    super('Title');
  }

  create(): void {
    this.started = false;
    this.cameras.main.setBackgroundColor(PALETTE.b);
    this.drawGround();

    const necro = this.add.sprite(GAME_W / 2, GROUND_Y, 'necro', 0).setScale(S).setOrigin(0.5, 1);
    necro.play(idleAnimKey('necro'));

    // vignette sits above the world, below the text
    this.add.image(0, 0, 'vignette').setOrigin(0).setScale(S);

    this.add
      .text(GAME_W / 2, 42, 'GRIMSHARD', { fontFamily: TITLE_FONT, fontSize: '48px', color: C.bone })
      .setOrigin(0.5)
      .setShadow(2, 2, C.soul, 0, false, true);
    const sub = this.add
      .text(GAME_W / 2, 76, "a necromancer's tale", { fontFamily: UI_FONT, fontSize: '12px', color: PALETTE.f })
      .setOrigin(0.5);

    const bw = 124, bh = 34, gap = 12;
    const x0 = (GAME_W - (bw * 3 + gap * 2)) / 2;
    const by = 212;
    const begin = makeButton(this, x0, by, bw, bh, 'Begin', () => this.begin(necro, sub));
    makeButton(this, x0 + bw + gap, by, bw, bh, 'Gallery', () => this.go('Gallery'));
    makeButton(this, x0 + (bw + gap) * 2, by, bw, bh, 'Test Village', () => this.go('Village'));
    this.tweens.add({ targets: begin.label, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.add
      .text(GAME_W - 4, GAME_H - 3, `v${VERSION}`, { fontFamily: UI_FONT, fontSize: '10px', color: PALETTE.e })
      .setOrigin(1, 1);

    const kb = this.input.keyboard;
    kb?.on('keydown-ENTER', () => this.begin(necro, sub));
    kb?.on('keydown-SPACE', () => this.begin(necro, sub));
    kb?.on('keydown-G', () => this.go('Gallery'));
    kb?.on('keydown-V', () => this.go('Village'));
  }

  private go(scene: string): void {
    void unlockAudio();
    this.scene.start(scene);
  }

  /** One row of 2x-scaled tiles: mud at the edges, cobble in the middle. */
  private drawGround(): void {
    const size = TILE * S;
    const y = GROUND_Y - size / 2 - 4;
    const cols = Math.ceil(GAME_W / size) + 1;
    const offset = (GAME_W - cols * size) / 2;
    for (let i = 0; i < cols; i++) {
      const edge = Math.min(i, cols - 1 - i);
      const base = edge < 3 || (edge === 3 && i % 2 === 0) ? 'tile-mud' : 'tile-cobble';
      this.add.image(offset + i * size, y, `${base}-${i % 3 === 1 ? 'b' : 'a'}`).setOrigin(0).setScale(S);
    }
  }

  private begin(necro: Phaser.GameObjects.Sprite, sub: Phaser.GameObjects.Text): void {
    void unlockAudio();
    if (this.started) return;
    this.started = true;
    play('soul');
    sub.setText('Soon... the plague village awaits (v0.3)').setColor(C.soul);

    // soul motes rise from the staff tip
    const tipX = necro.x - necro.displayWidth / 2 + 3.5 * S;
    const tipY = necro.y - necro.displayHeight + 2.5 * S;
    for (let i = 0; i < 14; i++) {
      const mote = this.add.image(tipX, tipY, 'soul-mote').setScale(S / 2 + Math.floor(this.rng() * 2));
      this.tweens.add({
        targets: mote,
        x: tipX + (this.rng() - 0.5) * 90,
        y: tipY - 30 - this.rng() * 70,
        alpha: 0,
        duration: 900 + this.rng() * 900,
        delay: i * 40,
        ease: 'Quad.Out',
        onComplete: () => mote.destroy(),
      });
    }
  }
}
