import '@fontsource/jacquard-12/latin-400.css';
import '@fontsource/pixelify-sans/latin-400.css';
import './style.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GalleryScene } from './scenes/GalleryScene';
import { VillageScene } from './scenes/VillageScene';
import { GAME_W, GAME_H } from './data/config';
import { PALETTE } from './art/palette';
import { computeScale, isPortrait } from './logic/scale';
import { paintGrid } from './art/render';
import { PHONE_ICON } from './art/sprites';
import { unlockAudio } from './audio/sfx';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: PALETTE.A,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  banner: false,
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene, GalleryScene, VillageScene],
});

let lastDevice = 0;
/**
 * Largest whole-number scale (in device pixels), letterboxed in #0a080b.
 * The canvas gets the real device-pixel size (480*D x 270*D); cameras zoom by
 * D (src/scenes/view.ts). Text and lights are drawn at that full resolution.
 */
function fit(): void {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const portrait = isPortrait(vw, vh);
  document.body.classList.toggle('portrait', portrait);
  if (portrait && lastDevice) return; // keep the landscape layout while hidden
  const dpr = window.devicePixelRatio || 1;
  const s = computeScale(vw, vh, dpr, GAME_W, GAME_H);
  const w = Math.max(1, Math.round(GAME_W * s.deviceScale));
  const h = Math.max(1, Math.round(GAME_H * s.deviceScale));
  game.registry.set('cssScale', s.cssScale); // buttons size their touch area from this
  game.registry.set('deviceScale', s.deviceScale);
  if (game.scale.width !== w || game.scale.height !== h) {
    game.scale.setZoom(s.cssScale / s.deviceScale);
    game.scale.resize(w, h);
  }
  const canvas = game.canvas;
  if (canvas) {
    // Phaser skips the CSS size when it equals the backing size (dpr 1), so set it here
    canvas.style.width = `${(w * s.cssScale) / s.deviceScale}px`;
    canvas.style.height = `${(h * s.cssScale) / s.deviceScale}px`;
    canvas.style.left = `${s.left}px`;
    canvas.style.top = `${s.top}px`;
  }
  if (lastDevice && lastDevice !== s.deviceScale) {
    // text resolution and camera zoom depend on D: rebuild the running scenes
    for (const sc of game.scene.getScenes(true)) if (sc.scene.key !== 'Boot') sc.scene.restart();
  }
  lastDevice = s.deviceScale;
}

function drawRotateIcon(): void {
  const c = document.getElementById('rotate-icon') as HTMLCanvasElement | null;
  const ctx = c?.getContext('2d');
  if (c && ctx) paintGrid(ctx, PHONE_ICON);
}

game.events.once(Phaser.Core.Events.READY, fit);
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 150));
window.visualViewport?.addEventListener('resize', fit);
// Audio unlock on the very first gesture anywhere on the page.
window.addEventListener('pointerdown', () => void unlockAudio(), { once: true, capture: true });
window.addEventListener('keydown', () => void unlockAudio(), { once: true, capture: true });
document.addEventListener('contextmenu', (e) => e.preventDefault());
drawRotateIcon();

// Read-only handle for the headless smoke test (tools/smoke.mjs).
(window as unknown as { __PHASER_GAME__: Phaser.Game }).__PHASER_GAME__ = game;
