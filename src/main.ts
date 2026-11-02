import '@fontsource/jacquard-12/latin-400.css';
import '@fontsource/pixelify-sans/latin-400.css';
import './style.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
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
  backgroundColor: PALETTE.a,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  banner: false,
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene],
});

/** Largest whole-number scale (in device pixels), letterboxed in #120e12. */
function fit(): void {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const portrait = isPortrait(vw, vh);
  document.body.classList.toggle('portrait', portrait);
  const s = computeScale(vw, vh, window.devicePixelRatio || 1, GAME_W, GAME_H);
  const canvas = game.canvas;
  if (canvas) {
    canvas.style.left = `${s.left}px`;
    canvas.style.top = `${s.top}px`;
  }
  game.scale.setZoom(s.cssScale);
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
fit();
