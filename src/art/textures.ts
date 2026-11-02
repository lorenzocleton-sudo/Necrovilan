import type Phaser from 'phaser';
import { addGridSheet, addGridTexture } from './render';
import type { SpriteDef } from './spriteDef';
import { recolorFrames } from '../logic/recolor';
import { panelGrid, type PanelStyle } from './ui';

export const idleAnimKey = (texKey: string) => `${texKey}-idle`;

/**
 * Make sure a sprite's texture (and idle animation, if it has frames) exist.
 * With a seed and recolour slots, builds a per-instance recoloured copy.
 * Returns the texture key to use.
 */
export function ensureSprite(scene: Phaser.Scene, def: SpriteDef, seed?: number): string {
  const recolor = seed !== undefined && def.recolor?.length;
  const key = recolor ? `${def.key}#${seed}` : def.key;
  if (!scene.textures.exists(key)) {
    const frames = recolor ? recolorFrames(def.frames, def.recolor!, seed!) : def.frames;
    addGridSheet(scene, key, frames);
  }
  const anim = idleAnimKey(key);
  if (def.frames.length > 1 && !scene.anims.exists(anim)) {
    const order = def.sequence ?? def.frames.map((_, i) => i);
    scene.anims.create({
      key: anim,
      frames: order.map((frame) => ({ key, frame })),
      frameRate: 1000 / def.frameMs,
      repeat: -1,
    });
  }
  return key;
}

/** Panel/button texture of any size, cached by key. */
export function ensurePanel(scene: Phaser.Scene, w: number, h: number, style: PanelStyle): string {
  const key = `panel-${style}-${w}x${h}`;
  addGridTexture(scene, key, panelGrid(w, h, style));
  return key;
}
