import Phaser from 'phaser';
import { C, PALETTE, TRANSPARENT, hexToInt, type PaletteKey } from '../art/palette';
import { ALL_SPRITES } from '../art/sprites';
import type { SpriteCategory, SpriteDef } from '../art/spriteDef';
import { ensureSprite, idleAnimKey } from '../art/textures';
import { recolorFrames } from '../logic/recolor';
import { fitScale, packPages } from '../logic/layout';
import { GAME_W, GAME_H } from '../data/config';
import { makeButton, text, type Button } from './ui';

type Tab = SpriteCategory | 'palette';
const TABS: { id: Tab; label: string }[] = [
  { id: 'tile', label: 'Tiles' },
  { id: 'character', label: 'Characters' },
  { id: 'prop', label: 'Props' },
  { id: 'palette', label: 'Palette' },
];
const LIST_SCALE = 4;
const DETAIL_MAX_SCALE = 6;
const AREA = { x: 32, y: 42, w: 416, h: 226 };
const LABEL_H = 14;
const SWIPE_PX = 40;

/** Art Gallery: every sprite at x4, animated, by category; detail view; palette page. */
export class GalleryScene extends Phaser.Scene {
  private tab: Tab = 'tile';
  private page = 0;
  private pageCount = 1;
  private content: Phaser.GameObjects.GameObject[] = [];
  private tabButtons: Button[] = [];
  private prevBtn!: Button;
  private nextBtn!: Button;
  private pageLabel!: Phaser.GameObjects.Text;
  private detail: Phaser.GameObjects.GameObject[] = [];
  private detailCleanup: (() => void)[] = [];
  private detailOpen = false;

  constructor() {
    super('Gallery');
  }

  create(): void {
    this.detailOpen = false;
    this.content = [];
    this.detail = [];
    this.detailCleanup = [];
    this.tabButtons = [];
    this.cameras.main.setBackgroundColor(PALETTE.b);

    makeButton(this, 4, 4, 54, 30, 'Back', () => this.back(), { iron: true });
    TABS.forEach((t, i) => {
      this.tabButtons.push(makeButton(this, 64 + i * 84, 4, 80, 30, t.label, () => this.showTab(t.id), { iron: true, size: 11 }));
    });
    this.pageLabel = text(this, GAME_W - 8, 19, '', 10, PALETTE.f).setOrigin(1, 0.5);
    this.prevBtn = makeButton(this, 2, 132, 26, 44, '<', () => this.turn(-1), { iron: true, size: 14 });
    this.nextBtn = makeButton(this, GAME_W - 28, 132, 26, 44, '>', () => this.turn(1), { iron: true, size: 14 });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.detailOpen) return;
      const dx = p.upX - p.downX;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(p.upY - p.downY)) this.turn(dx < 0 ? 1 : -1);
    });
    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.back());
    kb?.on('keydown-LEFT', () => this.turn(-1));
    kb?.on('keydown-RIGHT', () => this.turn(1));

    this.showTab('tile');
  }

  private back(): void {
    if (this.detailOpen) this.closeDetail();
    else this.scene.start('Title');
  }

  private showTab(tab: Tab): void {
    this.tab = tab;
    this.page = 0;
    this.render();
  }

  private turn(d: number): void {
    if (this.detailOpen) return;
    const next = Math.max(0, Math.min(this.pageCount - 1, this.page + d));
    if (next === this.page) return;
    this.page = next;
    this.render();
  }

  private clear(list: Phaser.GameObjects.GameObject[]): void {
    list.forEach((o) => o.destroy());
    list.length = 0;
  }

  private render(): void {
    this.clear(this.content);
    TABS.forEach((t, i) => this.tabButtons[i].setSelected(t.id === this.tab));
    if (this.tab === 'palette') {
      this.pageCount = 1;
      this.renderPalette();
    } else {
      this.renderSprites(ALL_SPRITES.filter((s) => s.category === this.tab));
    }
    const multi = this.pageCount > 1;
    this.prevBtn.setVisible(multi && this.page > 0);
    this.nextBtn.setVisible(multi && this.page < this.pageCount - 1);
    this.pageLabel.setText(multi ? `${this.page + 1}/${this.pageCount}` : '');
  }

  private renderSprites(defs: SpriteDef[]): void {
    const boxes = defs.map((d) => ({ w: d.w * LIST_SCALE, h: d.h * LIST_SCALE + LABEL_H }));
    const pages = packPages(boxes, AREA.w, AREA.h, 8, 4);
    this.pageCount = pages.length;
    for (const pl of pages[this.page] ?? []) {
      const def = defs[pl.index];
      const x = AREA.x + pl.x;
      const y = AREA.y + pl.y;
      const sw = def.w * LIST_SCALE;
      const sh = def.h * LIST_SCALE;
      if (def.shadow) this.content.push(this.shadowAt(x + sw / 2, y + sh - 3 * LIST_SCALE, LIST_SCALE));
      const spr = this.add.sprite(x, y, def.key, 0).setOrigin(0).setScale(LIST_SCALE);
      if (def.frames.length > 1) spr.play(idleAnimKey(def.key));
      spr.setInteractive({ useHandCursor: true });
      spr.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (Math.hypot(p.upX - p.downX, p.upY - p.downY) < 12) this.openDetail(def);
      });
      this.content.push(spr, text(this, x + sw / 2, y + sh + 2, def.name, 10).setOrigin(0.5, 0));
    }
  }

  private shadowAt(cx: number, cy: number, scale: number): Phaser.GameObjects.Image {
    return this.add.image(cx, cy, 'shadow').setScale(scale).setAlpha(0.5);
  }

  private renderPalette(): void {
    const keys = Object.keys(PALETTE) as PaletteKey[];
    const cw = 72, ch = 52, cols = 6;
    const x0 = Math.floor((GAME_W - cols * cw) / 2) + 4;
    keys.forEach((k, i) => {
      const x = x0 + (i % cols) * cw;
      const y = AREA.y + 4 + Math.floor(i / cols) * ch;
      const r = this.add.rectangle(x, y, cw - 8, 28, hexToInt(PALETTE[k])).setOrigin(0).setStrokeStyle(1, hexToInt(C.ink));
      this.content.push(r, text(this, x, y + 31, `${k}  ${PALETTE[k]}`, 9, PALETTE.g));
    });
    this.content.push(text(this, GAME_W / 2, GAME_H - 8, 'Locked 24-colour palette · letters are used in sprite grids', 9, PALETTE.e).setOrigin(0.5, 1));
  }

  // ---------------- detail view ----------------
  private openDetail(def: SpriteDef): void {
    this.detailOpen = true;
    let seed: number | undefined;
    let gridOn = false;
    const D = 50;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      (o as unknown as Phaser.GameObjects.Components.Depth).setDepth?.(D);
      this.detail.push(o);
      return o;
    };
    add(this.add.rectangle(0, 0, GAME_W, GAME_H, hexToInt(PALETTE.b)).setOrigin(0).setInteractive());
    const close = makeButton(this, 4, 4, 54, 30, 'Close', () => this.closeDetail(), { iron: true, depth: D + 1 });
    add(text(this, 68, 19, def.name, 14).setOrigin(0, 0.5));

    const area = { x: 8, y: 42, w: 300, h: 224 };
    const s = fitScale(def.w, def.h, area.w, area.h, DETAIL_MAX_SCALE);
    const sx = area.x + Math.floor((area.w - def.w * s) / 2);
    const sy = area.y + Math.floor((area.h - def.h * s) / 2);
    if (def.shadow) add(this.shadowAt(sx + (def.w * s) / 2, sy + def.h * s - 3 * s, s));
    const spr = add(this.add.sprite(sx, sy, def.key, 0).setOrigin(0).setScale(s));
    if (def.frames.length > 1) spr.play(idleAnimKey(def.key));

    const grid = add(this.add.graphics());
    const drawGrid = () => {
      grid.clear();
      if (!gridOn) return;
      grid.lineStyle(1, hexToInt(C.soul), 0.55);
      const step = 24 * s;
      for (let gx = 0; gx <= def.w * s; gx += step) grid.lineBetween(sx + gx + 0.5, sy, sx + gx + 0.5, sy + def.h * s);
      for (let gy = def.h * s; gy >= 0; gy -= step) grid.lineBetween(sx, sy + gy + 0.5, sx + def.w * s, sy + gy + 0.5);
      grid.strokeRect(sx + 0.5, sy + 0.5, def.w * s - 1, def.h * s - 1);
      if (def.anchor) {
        const ax = sx + def.anchor.x * def.w * s;
        const ay = sy + def.anchor.y * def.h * s;
        grid.fillStyle(hexToInt(C.gold), 1).fillRect(ax - 2, ay - 2, 4, 4);
      }
    };

    const info = [
      `${def.w}x${def.h} ${def.category}`,
      `${def.frames.length} frame${def.frames.length > 1 ? 's' : ''}${def.frames.length > 1 ? ` · ${def.frameMs} ms` : ''}`,
      `shown at x${s}`,
      def.anchor ? (def.category === 'character' ? 'anchor: bottom-centre' : 'anchor: bottom-left') : 'anchor: top-left',
      def.footprint ? `blocks ${def.footprint.w}x${def.footprint.h} tile` : '',
    ].filter(Boolean);
    add(text(this, 316, 42, info.join('\n'), 9, PALETTE.f).setLineSpacing(1));
    const lettersLabel = add(text(this, 316, 104, 'Palette letters used:', 9, C.bone));
    const swatches: Phaser.GameObjects.GameObject[] = [];
    const drawLetters = () => {
      swatches.forEach((o) => o.destroy());
      swatches.length = 0;
      const frames = seed !== undefined && def.recolor ? recolorFrames(def.frames, def.recolor, seed) : def.frames;
      const used = [...new Set(frames.flat().join(''))].filter((ch) => ch !== TRANSPARENT).sort() as PaletteKey[];
      used.forEach((k, i) => {
        const x = 316 + Math.floor(i / 9) * 80;
        const y = lettersLabel.y + 14 + (i % 9) * 12;
        const sq = this.add.rectangle(x, y, 9, 9, hexToInt(PALETTE[k])).setOrigin(0).setStrokeStyle(1, hexToInt(PALETTE.e)).setDepth(D);
        const t = text(this, x + 13, y - 1, `${k} ${PALETTE[k]}`, 9, PALETTE.g).setDepth(D);
        swatches.push(sq, t);
      });
    };
    drawLetters();
    this.detailCleanup.push(() => swatches.forEach((o) => o.destroy()));

    const gridBtn = makeButton(this, 316, 234, 74, 30, 'Grid: off', () => {
      gridOn = !gridOn;
      gridBtn.setLabel(gridOn ? 'Grid: on' : 'Grid: off');
      drawGrid();
    }, { iron: true, depth: D + 1, size: 10 });
    const buttons = [close, gridBtn];
    if (def.recolor?.length) {
      let n = 0;
      buttons.push(
        makeButton(this, 396, 234, 78, 30, 'Recolour', () => {
          n += 1;
          seed = n;
          const key = ensureSprite(this, def, seed);
          spr.setTexture(key, 0);
          if (def.frames.length > 1) spr.play(idleAnimKey(key));
          drawLetters();
        }, { depth: D + 1, size: 10 }),
      );
    }
    this.detailCleanup.push(() => buttons.forEach((b) => b.destroy()));
  }

  private closeDetail(): void {
    this.detailOpen = false;
    this.clear(this.detail);
    this.detailCleanup.forEach((f) => f());
    this.detailCleanup = [];
  }
}
