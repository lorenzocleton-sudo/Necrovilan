import Phaser from 'phaser';
import { C, hexToRgb } from '../art/palette';
import { GAME_W, GAME_H } from '../data/config';

/*
 * Screen-resolution effects: smooth gradients drawn into canvas textures with
 * linear filtering (not pixel art), so they stay soft at any zoom.
 * Shadows, lights, vignette and the colour grade live here.
 */
const RES = 4; // texture pixels per game unit

const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

function radialTexture(scene: Phaser.Scene, key: string, w: number, h: number, stops: [number, string][], res = RES): string {
  if (scene.textures.exists(key)) return key;
  const tw = Math.ceil(w * res), th = Math.ceil(h * res);
  const tex = scene.textures.createCanvas(key, tw, th);
  if (!tex) throw new Error(`no texture ${key}`);
  const ctx = tex.getContext();
  ctx.save();
  ctx.translate(tw / 2, th / 2);
  ctx.scale(tw / 2, th / 2);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return key;
}

/** Soft drop shadow: deepest dark, ~45% in the middle, fading out. */
export function softShadow(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Image {
  const key = radialTexture(scene, `shadow-${w}x${h}`, w, h, [
    [0, rgba(C.deep, 0.45)],
    [0.55, rgba(C.deep, 0.4)],
    [1, rgba(C.deep, 0)],
  ]);
  return scene.add.image(x, y, key).setScale(1 / RES);
}

/** Soul-green light pool (additive, gently pulsing). */
export function soulLight(scene: Phaser.Scene, x: number, y: number, radius: number): Phaser.GameObjects.Image {
  const key = radialTexture(scene, `soul-light-${radius}`, radius * 2, radius * 2, [
    [0, rgba(C.soul, 0.5)],
    [0.25, rgba(C.soul, 0.22)],
    [0.6, rgba(C.soul, 0.07)],
    [1, rgba(C.soul, 0)],
  ]);
  const img = scene.add.image(x, y, key).setScale(1 / RES).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: img, alpha: { from: 0.75, to: 1 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  return img;
}

/** Smooth dark vignette over the whole view (replaces the old dithered one). */
export function vignette(scene: Phaser.Scene, strength = 0.85, inner = 0.55): Phaser.GameObjects.Image {
  const key = radialTexture(scene, `vignette-${strength}-${inner}`, GAME_W, GAME_H, [
    [0, rgba(C.deep, 0)],
    [inner, rgba(C.deep, 0)],
    [0.85, rgba(C.deep, strength * 0.45)],
    [1, rgba(C.deep, strength)],
  ], 1);
  return scene.add.image(0, 0, key).setOrigin(0);
}

/** "Plague dusk" grade: a faint cool-purple multiply over the world. */
export function duskGrade(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(0, 0, GAME_W, GAME_H, 0xa898c8, 0.28)
    .setOrigin(0)
    .setBlendMode(Phaser.BlendModes.MULTIPLY);
}
