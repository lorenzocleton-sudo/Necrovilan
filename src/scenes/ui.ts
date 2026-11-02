import Phaser from 'phaser';
import { C, PALETTE } from '../art/palette';
import { ensurePanel } from '../art/textures';
import { play } from '../audio/sfx';

export const UI_FONT = '"Pixelify Sans", monospace';
export const TITLE_FONT = '"Jacquard 12", serif';
/** Touch targets must be at least this many CSS px (header rule). */
const MIN_TOUCH_CSS = 44;

export function text(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: string,
  size = 10,
  color: string = C.bone,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, s, { fontFamily: UI_FONT, fontSize: `${size}px`, color }).setResolution(1);
}

export interface Button {
  bg: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  setLabel(s: string): void;
  setSelected(on: boolean): void;
  setVisible(on: boolean): void;
  destroy(): void;
}

/**
 * Parchment/iron button with a Pixelify Sans label. The tap area is padded
 * so it is at least 44 CSS px tall/wide at the current scale. Fires on
 * release inside the button (so a drag/swipe that starts on it is ignored).
 */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onTap: () => void,
  opts: { iron?: boolean; size?: number; depth?: number } = {},
): Button {
  let iron = opts.iron ?? false;
  const keys = () => ({
    up: ensurePanel(scene, w, h, iron ? 'iron' : 'parchment'),
    down: ensurePanel(scene, w, h, iron ? 'ironDown' : 'parchmentDown'),
  });
  const bg = scene.add.image(x, y, keys().up).setOrigin(0);
  const color = () => (iron ? C.bone : PALETTE.b);
  const txt = scene.add
    .text(x + w / 2, y + h / 2, label, { fontFamily: UI_FONT, fontSize: `${opts.size ?? 12}px`, color: color() })
    .setOrigin(0.5)
    .setResolution(1);
  if (opts.depth !== undefined) {
    bg.setDepth(opts.depth);
    txt.setDepth(opts.depth + 0.1);
  }
  const css = (scene.registry.get('cssScale') as number | undefined) ?? 1;
  const minGame = Math.ceil(MIN_TOUCH_CSS / css);
  const padX = Math.max(0, Math.ceil((minGame - w) / 2));
  const padY = Math.max(0, Math.ceil((minGame - h) / 2));
  bg.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(-padX, -padY, w + padX * 2, h + padY * 2),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  });
  let pressed = false;
  const release = () => {
    pressed = false;
    bg.setTexture(keys().up);
    txt.setY(y + h / 2);
  };
  bg.on('pointerdown', () => {
    pressed = true;
    bg.setTexture(keys().down);
    txt.setY(y + h / 2 + 1);
  });
  bg.on('pointerout', release);
  bg.on('pointerup', () => {
    if (!pressed) return;
    release();
    play('click');
    onTap();
  });
  return {
    bg,
    label: txt,
    setLabel: (s) => txt.setText(s),
    setSelected: (on) => {
      iron = !on;
      bg.setTexture(keys().up);
      txt.setColor(color());
    },
    setVisible: (on) => {
      bg.setVisible(on);
      txt.setVisible(on);
      if (on) bg.setInteractive();
      else bg.disableInteractive();
    },
    destroy: () => {
      bg.destroy();
      txt.destroy();
    },
  };
}
