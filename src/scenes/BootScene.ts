import Phaser from 'phaser';
import { addGridTexture } from '../art/render';
import { ALL_SPRITES, SHADOW, SOUL_MOTE } from '../art/sprites';
import { ensureSprite } from '../art/textures';
import { vignetteGrid } from '../art/grid';
import { GAME_W, GAME_H, TITLE_WORLD_SCALE, TILE } from '../data/config';
import { PATCH_H, PATCH_W } from '../data/testPatch';

/** Builds every texture from code and waits for the inlined fonts. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    for (const def of ALL_SPRITES) ensureSprite(this, def);
    addGridTexture(this, 'shadow', SHADOW);
    addGridTexture(this, 'soul-mote', SOUL_MOTE);
    addGridTexture(this, 'path-dot', ['ww', 'ww']);
    addGridTexture(this, 'vignette', vignetteGrid(GAME_W / TITLE_WORLD_SCALE, GAME_H / TITLE_WORLD_SCALE));
    // Test Village: ground darkened gently toward the edges of the patch
    addGridTexture(
      this,
      'vignette-patch',
      vignetteGrid(PATCH_W * TILE, PATCH_H * TILE, 'a', { inner: 0.32, range: 0.5, max: 0.55 }),
    );
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
