import Phaser from 'phaser';
import { C, PALETTE } from '../art/palette';
import { ensurePanel } from '../art/textures';
import { play } from '../audio/sfx';
import { cssScale, deviceScale, fontUnits } from './view';

export const UI_FONT = '"Pixelify Sans", monospace';
export const TITLE_FONT = '"Jacquard 12", serif';
/** Touch targets must be at least this many CSS px (header rule). */
const MIN_TOUCH_CSS = 44;
/** Default UI text size in game units (>= 16 CSS px on phones; raised further where needed). */
export const UI_SIZE = 12;

export interface TextOpts {
  stroke?: boolean;
  font?: string;
}

/**
 * UI text, rasterised at the device resolution (crisp, never upscaled), in
 * Pixelify Sans, at least 16 CSS px. A 1-unit deepest-dark stroke keeps it
 * readable over the world.
 */
export function text(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: string,
  size = UI_SIZE,
  color: string = C.bone,
  opts: TextOpts = {},
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, s, {
    fontFamily: opts.font ?? UI_FONT,
    fontSize: `${fontUnits(scene, size)}px`,
    color,
    stroke: opts.stroke ? C.deep : undefined,
    strokeThickness: opts.stroke ? 3 : 0,
  });
  return t.setResolution(deviceScale(scene));
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
 * Dark-iron button: slate fill, light-stone bevel top-left, deepest-dark
 * bevel bottom-right, bright-bone label; soul-green border while pressed.
 * Disabled: dimmed with a small "soon" tag. The tap area is padded to at
 * least 44 CSS px. Fires on release inside the button.
 */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onTap: () => void,
  opts: { size?: number; depth?: number; disabled?: string } = {},
): Button {
  let selected = false;
  const disabled = opts.disabled !== undefined;
  const upKey = () => ensurePanel(scene, w, h, disabled ? 'ironOff' : selected ? 'ironSel' : 'iron');
  const downKey = () => ensurePanel(scene, w, h, 'ironDown');
  const bg = scene.add.image(x, y, upKey()).setOrigin(0);
  const color = () => (disabled ? PALETTE.e : selected ? C.soul : C.boneBright);
  const txt = text(scene, x + w / 2, y + h / 2, label, opts.size ?? UI_SIZE, color()).setOrigin(0.5);
  const extra: Phaser.GameObjects.GameObject[] = [];
  if (disabled) {
    bg.setAlpha(0.7);
    const tag = text(scene, x + w - 3, y + 1, opts.disabled!, 9, PALETTE.f).setOrigin(1, 0);
    // "soon" sits on a small dark plate so it reads as a label, not a fault
    const plate = scene.add.rectangle(tag.x + 1, tag.y, tag.displayWidth + 4, tag.displayHeight, 0x0a080b, 0.85).setOrigin(1, 0);
    plate.setDepth((opts.depth ?? 0) + 0.05);
    tag.setDepth((opts.depth ?? 0) + 0.2);
    txt.setY(y + h / 2 + 3);
    extra.push(plate, tag);
  }
  if (opts.depth !== undefined) {
    bg.setDepth(opts.depth);
    txt.setDepth(opts.depth + 0.1);
  }
  const minGame = Math.ceil(MIN_TOUCH_CSS / cssScale(scene));
  const padX = Math.max(0, Math.ceil((minGame - w) / 2));
  const padY = Math.max(0, Math.ceil((minGame - h) / 2));
  bg.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(-padX, -padY, w + padX * 2, h + padY * 2),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: !disabled,
  });
  let pressed = false;
  const baseY = txt.y;
  const release = () => {
    pressed = false;
    bg.setTexture(upKey());
    txt.setY(baseY);
  };
  bg.on('pointerdown', () => {
    pressed = true;
    if (disabled) return;
    bg.setTexture(downKey());
    txt.setY(baseY + 1);
  });
  bg.on('pointerout', release);
  bg.on('pointerup', () => {
    if (!pressed) return;
    release();
    play(disabled ? 'bump' : 'click');
    onTap();
  });
  return {
    bg,
    label: txt,
    setLabel: (s) => txt.setText(s),
    setSelected: (on) => {
      selected = on;
      bg.setTexture(upKey());
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
      extra.forEach((o) => o.destroy());
    },
  };
}
