import Phaser from 'phaser';
import { C, PALETTE } from '../art/palette';
import { GAME_W, GAME_H, TILE, TITLE_WORLD_SCALE as S, VERSION } from '../data/config';
import { makeRng } from '../logic/rng';
import { play, unlockAudio } from '../audio/sfx';
import { idleAnimKey } from '../art/textures';
import { TITLE_FONT, makeButton, text } from './ui';
import { deviceScale, setupCamera } from './view';
import { duskGrade, softShadow, soulLight, vignette } from './fx';

const GROUND_Y = 186; // necromancer's feet on the title strip
const D_WORLD = 0;
const D_GRADE = 50;
const D_LIGHT = 60;
const D_VIGNETTE = 70;
const D_UI = 100;

export class TitleScene extends Phaser.Scene {
  private rng = makeRng(0x6e3c);
  private hint?: Phaser.GameObjects.Text;

  constructor() {
    super('Title');
  }

  create(): void {
    setupCamera(this, PALETTE.b);
    this.drawGround();

    softShadow(this, GAME_W / 2 + 3, GROUND_Y - 2, 40, 10).setDepth(D_WORLD + 1);
    const necro = this.add.sprite(GAME_W / 2, GROUND_Y, 'necro', 0).setScale(S).setOrigin(0.5, 1).setDepth(D_WORLD + 2);
    necro.play(idleAnimKey('necro'));
    const tip = this.staffTip(necro);
    duskGrade(this).setDepth(D_GRADE);
    soulLight(this, tip.x + 6, GROUND_Y - 10, 70).setDepth(D_LIGHT);
    soulLight(this, tip.x, tip.y, 22).setDepth(D_LIGHT);
    vignette(this, 0.95, 0.42).setDepth(D_VIGNETTE);

    const title = this.add
      .text(GAME_W / 2, 46, 'GRIMSHARD', {
        fontFamily: TITLE_FONT,
        fontSize: '64px',
        color: C.boneBright,
        stroke: C.deep,
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setLetterSpacing(4)
      .setPadding(16, 16, 16, 16) // room for the glow blur, otherwise it is clipped to a box
      .setResolution(deviceScale(this))
      .setDepth(D_UI);
    // soft soul-green glow behind the letters (canvas shadow blur is in device px)
    title.setShadow(0, 0, 'rgba(124,255,178,0.75)', 10 * deviceScale(this), true, true);
    text(this, GAME_W / 2, 86, "a necromancer's tale", 12, C.bone, { stroke: true }).setOrigin(0.5).setDepth(D_UI);

    const bw = 132, bh = 34, gap = 10;
    const x0 = (GAME_W - (bw * 3 + gap * 2)) / 2;
    const by = 222;
    makeButton(this, x0, by, bw, bh, 'Begin', () => this.soon(necro), { depth: D_UI, disabled: 'soon' });
    makeButton(this, x0 + bw + gap, by, bw, bh, 'Gallery', () => this.go('Gallery'), { depth: D_UI });
    makeButton(this, x0 + (bw + gap) * 2, by, bw, bh, 'Test Village', () => this.go('Village'), { depth: D_UI });

    text(this, GAME_W - 4, GAME_H - 2, `v${VERSION}`, 9, PALETTE.f).setOrigin(1, 1).setDepth(D_UI);
    this.hint = undefined;

    const kb = this.input.keyboard;
    kb?.on('keydown-ENTER', () => this.soon(necro));
    kb?.on('keydown-G', () => this.go('Gallery'));
    kb?.on('keydown-V', () => this.go('Village'));
  }

  private go(scene: string): void {
    void unlockAudio();
    this.scene.start(scene);
  }

  private staffTip(necro: Phaser.GameObjects.Sprite): { x: number; y: number } {
    return { x: necro.x - necro.displayWidth / 2 + 2.5 * S, y: necro.y - necro.displayHeight + 3 * S };
  }

  /** One row of 2x-scaled tiles: mud at the edges, cobble in the middle, grass beyond. */
  private drawGround(): void {
    const size = TILE * S;
    const y = GROUND_Y - size / 2 - 6;
    const cols = Math.ceil(GAME_W / size) + 1;
    const offset = (GAME_W - cols * size) / 2;
    for (let i = 0; i < cols; i++) {
      const edge = Math.min(i, cols - 1 - i);
      const base = edge < 2 ? 'tile-mud' : 'tile-cobble';
      this.add.image(offset + i * size, y, `${base}-${i % 3 === 1 ? 'b' : 'a'}`).setOrigin(0).setScale(S).setDepth(D_WORLD);
      // grass rows above and below the road
      for (const gy of [y - size, y + size]) this.add.image(offset + i * size, gy, `tile-grass-${(i + gy) % 2 ? 'a' : 'b'}`).setOrigin(0).setScale(S).setDepth(D_WORLD);
    }
  }

  /** "Begin" is not built yet: say so, with a puff of souls. */
  private soon(necro: Phaser.GameObjects.Sprite): void {
    void unlockAudio();
    play('soul');
    if (!this.hint) {
      this.hint = text(this, GAME_W / 2, 206, 'The plague village opens in v0.3', 12, C.soul, { stroke: true })
        .setOrigin(0.5)
        .setDepth(D_UI);
    }
    const tip = this.staffTip(necro);
    for (let i = 0; i < 14; i++) {
      const mote = this.add.image(tip.x, tip.y, 'soul-mote').setScale(S / 2 + Math.floor(this.rng() * 2)).setDepth(D_LIGHT + 1);
      this.tweens.add({
        targets: mote,
        x: tip.x + (this.rng() - 0.5) * 90,
        y: tip.y - 30 - this.rng() * 70,
        alpha: 0,
        duration: 900 + this.rng() * 900,
        delay: i * 40,
        ease: 'Quad.Out',
        onComplete: () => mote.destroy(),
      });
    }
  }
}
