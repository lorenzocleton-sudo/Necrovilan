import Phaser from 'phaser';
import { addGridSheet, addGridTexture } from '../art/render';
import { NECROMANCER_IDLE, SOUL_MOTE, TILE_COBBLE, TILE_MUD } from '../art/sprites';
import { vignetteGrid } from '../art/grid';
import { GAME_W, GAME_H, TITLE_WORLD_SCALE } from '../data/config';

/** Builds every texture from code and waits for the inlined fonts. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    addGridSheet(this, 'necro', NECROMANCER_IDLE);
    addGridTexture(this, 'tile-cobble', TILE_COBBLE);
    addGridTexture(this, 'tile-mud', TILE_MUD);
    addGridTexture(this, 'soul-mote', SOUL_MOTE);
    addGridTexture(
      this,
      'vignette',
      vignetteGrid(GAME_W / TITLE_WORLD_SCALE, GAME_H / TITLE_WORLD_SCALE),
    );

    this.anims.create({
      key: 'necro-idle',
      frames: this.anims.generateFrameNumbers('necro', { frames: [0, 1, 0, 2] }),
      frameRate: 3,
      repeat: -1,
    });

    void waitForFonts().then(() => this.scene.start('Title'));
  }
}

async function waitForFonts(): Promise<void> {
  if (!document.fonts) return;
  const loads = Promise.all([
    document.fonts.load('24px "Jacquard 12"'),
    document.fonts.load('10px "Pixelify Sans"'),
  ]);
  const timeout = new Promise((r) => setTimeout(r, 2500));
  await Promise.race([loads, timeout]).catch(() => {});
}
