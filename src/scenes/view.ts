import type Phaser from 'phaser';

/*
 * Rendering model (DECISIONS 0.2.1 #1): the canvas has the screen's real
 * device-pixel size (480*D x 270*D, D = whole device pixels per game pixel).
 * Each scene's camera zooms the 480x270 world by D, so pixel art stays
 * integer-scaled and crisp, while text, gradients and lights are rasterised at
 * full device resolution.
 */
export function deviceScale(scene: Phaser.Scene): number {
  return (scene.registry.get('deviceScale') as number | undefined) ?? 1;
}
export function cssScale(scene: Phaser.Scene): number {
  return (scene.registry.get('cssScale') as number | undefined) ?? 1;
}

/** Zoom the main camera so world (0,0)-(480,270) fills the canvas. */
export function setupCamera(scene: Phaser.Scene, bg?: string): Phaser.Cameras.Scene2D.Camera {
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0);
  cam.setZoom(deviceScale(scene));
  cam.setScroll(0, 0);
  cam.setRoundPixels(true);
  if (bg) cam.setBackgroundColor(bg);
  return cam;
}

/** Minimum readable UI text, CSS px (header + 0.2.1 Part F). */
export const MIN_TEXT_CSS = 16;
/** Font size in game units: the design size, raised so it is >= 16 CSS px on this screen. */
export function fontUnits(scene: Phaser.Scene, design: number): number {
  return Math.max(design, Math.ceil(MIN_TEXT_CSS / cssScale(scene)));
}
/** Screen distance (canvas px) -> game units. */
export function toUnits(scene: Phaser.Scene, px: number): number {
  return px / deviceScale(scene);
}
