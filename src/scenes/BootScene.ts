import Phaser from 'phaser';
import { addGridTexture } from '../art/render';
import { ALL_SPRITES, SOUL_MOTE } from '../art/sprites';
import { ensureSprite } from '../art/textures';

/** Builds every texture from code and waits for the inlined fonts. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    for (const def of ALL_SPRITES) ensureSprite(this, def);
    addGridTexture(this, 'soul-mote', SOUL_MOTE);
    addGridTexture(this, 'path-dot', ['ww', 'ww']);
    void waitForFonts().then(() => this.scene.start('Title'));
  }
}

async function waitForFonts(): Promise<void> {
  if (!document.fonts) return;
  const loads = Promise.all([
    document.fonts.load('24px "Jacquard 12"'),
    document.fonts.load('16px "Pixelify Sans"'),
  ]);
  const timeout = new Promise((r) => setTimeout(r, 2500));
  await Promise.race([loads, timeout]).catch(() => {});
}
