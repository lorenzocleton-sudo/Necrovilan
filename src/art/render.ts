import type Phaser from 'phaser';
import { gridToRgba, type Grid } from './grid';

/** Paint a grid into a 2D context at (ox, oy). */
export function paintGrid(ctx: CanvasRenderingContext2D, grid: Grid, ox = 0, oy = 0): void {
  const w = grid[0].length;
  const h = grid.length;
  const img = ctx.createImageData(w, h);
  img.data.set(gridToRgba(grid));
  ctx.putImageData(img, ox, oy);
}

/** Register a single-frame texture from a letter grid. */
export function addGridTexture(scene: Phaser.Scene, key: string, grid: Grid): void {
  addGridSheet(scene, key, [grid]);
}

/**
 * Register a horizontal strip of equally sized grids as one texture with
 * numbered frames 0..n-1 (usable by animations).
 */
export function addGridSheet(scene: Phaser.Scene, key: string, frames: readonly Grid[]): void {
  if (scene.textures.exists(key)) return;
  const w = frames[0][0].length;
  const h = frames[0].length;
  const tex = scene.textures.createCanvas(key, w * frames.length, h);
  if (!tex) throw new Error(`could not create texture ${key}`);
  const ctx = tex.getContext();
  frames.forEach((g, i) => paintGrid(ctx, g, i * w, 0));
  tex.refresh();
  frames.forEach((_, i) => tex.add(i, 0, i * w, 0, w, h));
}
