import Phaser from 'phaser';
import { C, PALETTE } from '../art/palette';
import { GAME_W, GAME_H, TILE, TITLE_WORLD_SCALE as S, VERSION } from '../data/config';
import { makeRng } from '../logic/rng';
import { play, unlockAudio } from '../audio/sfx';

const UI_FONT = '"Pixelify Sans", monospace';
const TITLE_FONT = '"Jacquard 12", serif';

export class TitleScene extends Phaser.Scene {
  private started = false;
  private prompt!: Phaser.GameObjects.Text;
  private rng = makeRng(0x6e3c);

  constructor() {
    super('Title');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.b);
    this.drawGround();

    const necro = this.add.sprite(GAME_W / 2, 196, 'necro', 0).setScale(S).setOrigin(0.5, 1);
    necro.play('necro-idle');

    // vignette sits above the world, below the text
    this.add.image(0, 0, 'vignette').setOrigin(0).setScale(S);

    this.add
      .text(GAME_W / 2, 50, 'GRIMSHARD', { fontFamily: TITLE_FONT, fontSize: '48px', color: C.bone })
      .setOrigin(0.5)
      .setShadow(2, 2, C.soul, 0, false, true);
    this.add
      .text(GAME_W / 2, 86, "a necromancer's tale", { fontFamily: UI_FONT, fontSize: '12px', color: PALETTE.f })
      .setOrigin(0.5);

    this.prompt = this.add
      .text(GAME_W / 2, 236, 'Tap to begin', { fontFamily: UI_FONT, fontSize: '14px', color: C.bone })
      .setOrigin(0.5);
    this.tweens.add({ targets: this.prompt, alpha: 0.25, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.add
      .text(GAME_W - 4, GAME_H - 3, `v${VERSION}`, { fontFamily: UI_FONT, fontSize: '10px', color: PALETTE.e })
      .setOrigin(1, 1);

    this.input.on('pointerdown', () => this.begin(necro));
    this.input.keyboard?.on('keydown-ENTER', () => this.begin(necro));
    this.input.keyboard?.on('keydown-SPACE', () => this.begin(necro));
  }

  /** One row of 2x-scaled tiles: mud at the edges, cobble in the middle. */
  private drawGround(): void {
    const size = TILE * S;
    const y = 196 - size / 2 - 4;
    const cols = Math.ceil(GAME_W / size) + 1;
    const offset = (GAME_W - cols * size) / 2;
    for (let i = 0; i < cols; i++) {
      const edge = Math.min(i, cols - 1 - i);
      const key = edge < 3 || (edge === 3 && i % 2 === 0) ? 'tile-mud' : 'tile-cobble';
      this.add.image(offset + i * size, y, key).setOrigin(0).setScale(S);
    }
  }

  private begin(necro: Phaser.GameObjects.Sprite): void {
    void unlockAudio();
    if (this.started) return;
    this.started = true;
    play('soul');

    this.tweens.killTweensOf(this.prompt);
    this.prompt.setAlpha(1).setText('Soon...').setColor(C.soul);

    // soul motes rise from the staff tip
    const tipX = necro.x - (necro.displayWidth / 2) + 3.5 * S;
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
