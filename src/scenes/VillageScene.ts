import Phaser from 'phaser';
import { C, PALETTE, hexToInt } from '../art/palette';
import { ALL_SPRITES } from '../art/sprites';
import type { SpriteDef } from '../art/spriteDef';
import { ensureEdge, ensureSprite, idleAnimKey } from '../art/textures';
import { GAME_W, GAME_H, TILE } from '../data/config';
import {
  GROUND_TILES, PATCH_ACTORS, PATCH_GROUND, PATCH_H, PATCH_PLAYER_START, PATCH_PROPS, PATCH_SEED, PATCH_W,
  type Placement,
} from '../data/testPatch';
import { buildBlocked, variantAt } from '../logic/tilemap';
import { autotile } from '../logic/autotile';
import { findPath, type Pt } from '../logic/path';
import { play } from '../audio/sfx';
import { makeButton, text } from './ui';
import { setupCamera, toUnits } from './view';
import { duskGrade, softShadow, soulLight, vignette } from './fx';

const OX = (GAME_W - PATCH_W * TILE) / 2;
const OY = Math.floor((GAME_H - PATCH_H * TILE) / 2);
const STEP_MS = 150;
const LONG_PRESS_MS = 450;
/** characters' feet sit 1px above the tile's bottom edge */
const FOOT = TILE - 1;
const DEPTH_GROUND = 0;
const DEPTH_MARKS = 2;
const DEPTH_OBJECTS = 10;
const DEPTH_GRADE = 600;
const DEPTH_LIGHT = 610;
const DEPTH_VIGNETTE = 620;
const DEPTH_UI = 1000;
const BLOCKED_FLASH = hexToInt(PALETTE.s);
/** staff tip relative to the necromancer's feet (sprite col 2.5, row 3) */
const TIP = { x: -9.5, y: -29 };

const defOf = (key: string): SpriteDef => {
  const d = ALL_SPRITES.find((s) => s.key === key);
  if (!d) throw new Error(`unknown sprite ${key}`);
  return d;
};

interface Actor {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  tile: Pt;
}

/** Debug hook for the smoke test: read-only snapshot of the player tile. */
declare global {
  interface Window {
    __GRIMSHARD__?: { scene: string; player?: Pt; walking?: boolean };
  }
}

/** Test Village: hand-built 20x11 patch, A* walking, y-sorted sprites, light and shadow. */
export class VillageScene extends Phaser.Scene {
  private blocked: boolean[][] = [];
  private player!: Actor;
  private glow!: Phaser.GameObjects.Image;
  private tipGlow!: Phaser.GameObjects.Image;
  private path: Pt[] = [];
  private dots: Phaser.GameObjects.Image[] = [];
  private walking = false;
  private pendingGoal: Pt | null = null;
  private names: string[][] = [];
  private pressTimer?: Phaser.Time.TimerEvent;
  private longPressed = false;
  private inspectLabel?: Phaser.GameObjects.Text;

  constructor() {
    super('Village');
  }

  create(): void {
    this.path = [];
    this.dots = [];
    this.walking = false;
    this.pendingGoal = null;
    setupCamera(this, PALETTE.A);
    this.names = PATCH_GROUND.map((row) => [...row].map((l) => GROUND_TILES[l].name));

    this.drawGround();

    // props: bottom-left anchored, y-sorted by bottom edge, soft drop shadow + contact band
    for (const p of PATCH_PROPS) {
      const def = defOf(p.sprite);
      const fp = def.footprint ?? { w: 1, h: 1 };
      const left = OX + p.x * TILE;
      const bottom = OY + (p.y + 1) * TILE;
      const img = this.add.image(left, bottom, ensureSprite(this, def), 0).setOrigin(0, 1).setDepth(DEPTH_OBJECTS + bottom);
      if (p.flip) img.setFlipX(true);
      const sw = def.w;
      softShadow(this, left + sw / 2 + 3, bottom - 1, sw + 6, 9).setDepth(DEPTH_OBJECTS + bottom - 0.5);
      for (let dx = 0; dx < fp.w; dx++) for (let dy = 0; dy < fp.h; dy++) this.names[p.y - dy][p.x + dx] = def.name;
    }
    for (const a of PATCH_ACTORS) {
      this.spawn(a);
      this.names[a.y][a.x] = defOf(a.sprite).name;
    }
    this.player = this.spawn({ sprite: 'necro', ...PATCH_PLAYER_START });

    this.blocked = buildBlocked({
      w: PATCH_W,
      h: PATCH_H,
      ground: PATCH_GROUND,
      blocksGround: (l) => GROUND_TILES[l].blocks,
      props: PATCH_PROPS,
      actors: PATCH_ACTORS,
      footprint: (k) => defOf(k).footprint ?? { w: 1, h: 1 },
    });

    // light and grade: dusk tint over the world, soul light above it, vignette on top
    duskGrade(this).setDepth(DEPTH_GRADE);
    this.glow = soulLight(this, 0, 0, 44).setDepth(DEPTH_LIGHT);
    this.tipGlow = soulLight(this, 0, 0, 12).setDepth(DEPTH_LIGHT);
    vignette(this, 0.8, 0.6).setDepth(DEPTH_VIGNETTE);

    // UI layer: over the scene edges, not taking map space
    makeButton(this, 4, 4, 58, 30, 'Back', () => this.scene.start('Title'), { depth: DEPTH_UI });
    text(this, GAME_W / 2, 6, 'Test Village', 12, C.boneBright, { stroke: true }).setOrigin(0.5, 0).setDepth(DEPTH_UI);
    text(this, GAME_W / 2, GAME_H - 3, 'Tap to walk · hold to inspect', 10, C.bone, { stroke: true })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH_UI);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onUp(p));
    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.scene.start('Title'));
    const step = (dx: number, dy: number) => () => this.tapTile({ x: this.player.tile.x + dx, y: this.player.tile.y + dy });
    for (const [k, d] of [['UP', [0, -1]], ['W', [0, -1]], ['DOWN', [0, 1]], ['S', [0, 1]], ['LEFT', [-1, 0]], ['A', [-1, 0]], ['RIGHT', [1, 0]], ['D', [1, 0]]] as const)
      kb?.on(`keydown-${k}`, step(d[0], d[1]));

    this.update();
    this.publish();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.__GRIMSHARD__ = { scene: 'Title' };
    });
  }

  /** Ground tiles, then grass-edge transitions where grass meets mud or cobble. */
  private drawGround(): void {
    const edges = { mud: autotile(PATCH_GROUND, 'G', 'M'), cobble: autotile(PATCH_GROUND, 'G', 'C') };
    for (let y = 0; y < PATCH_H; y++)
      for (let x = 0; x < PATCH_W; x++) {
        const g = GROUND_TILES[PATCH_GROUND[y][x]];
        const v = variantAt(x, y, PATCH_SEED);
        let key = g.variants ? `${g.key}-${v ? 'b' : 'a'}` : g.key;
        if (g.edge) {
          const bits = edges[g.edge][y][x];
          if (bits) key = ensureEdge(this, g.edge, bits, v);
        }
        this.add.image(OX + x * TILE, OY + y * TILE, key).setOrigin(0).setDepth(DEPTH_GROUND);
      }
  }

  update(): void {
    // y-sort: lower on screen = in front. The player re-sorts every frame while moving.
    const p = this.player;
    p.sprite.setDepth(DEPTH_OBJECTS + p.sprite.y + 1);
    p.shadow.setPosition(p.sprite.x + 2, p.sprite.y - 1).setDepth(DEPTH_OBJECTS + p.sprite.y);
    const tx = p.sprite.x + TIP.x;
    this.glow.setPosition(tx + 4, p.sprite.y - 6);
    this.tipGlow.setPosition(tx, p.sprite.y + TIP.y);
  }

  private spawn(a: Placement): Actor {
    const def = defOf(a.sprite);
    const key = ensureSprite(this, def, a.seed);
    const x = OX + a.x * TILE + TILE / 2;
    const y = OY + a.y * TILE + FOOT;
    const shadow = softShadow(this, x + 2, y - 1, 20, 7).setDepth(DEPTH_OBJECTS + y);
    const sprite = this.add.sprite(x, y, key, 0).setOrigin(def.anchor?.x ?? 0.5, def.anchor?.y ?? 1).setDepth(DEPTH_OBJECTS + y + 1);
    if (def.frames.length > 1) {
      sprite.play(idleAnimKey(key));
      // desync idles so the village does not breathe in unison
      sprite.anims.setProgress(((a.x * 7 + a.y * 3) % 10) / 10);
    }
    return { sprite, shadow, tile: { x: a.x, y: a.y } };
  }

  private toTile(p: Phaser.Input.Pointer): Pt | null {
    const x = Math.floor((p.worldX - OX) / TILE);
    const y = Math.floor((p.worldY - OY) / TILE);
    return x >= 0 && y >= 0 && x < PATCH_W && y < PATCH_H ? { x, y } : null;
  }

  private onDown(p: Phaser.Input.Pointer): void {
    this.longPressed = false;
    this.pressTimer?.remove();
    const t = this.toTile(p);
    if (!t) return;
    this.pressTimer = this.time.delayedCall(LONG_PRESS_MS, () => {
      this.longPressed = true;
      this.inspect(t);
    });
  }

  private onUp(p: Phaser.Input.Pointer): void {
    this.pressTimer?.remove();
    if (this.longPressed) return;
    if (toUnits(this, Math.hypot(p.upX - p.downX, p.upY - p.downY)) > 12) return;
    const t = this.toTile(p);
    if (t) this.tapTile(t);
  }

  private inspect(t: Pt): void {
    this.inspectLabel?.destroy();
    const cx = Phaser.Math.Clamp(OX + t.x * TILE + TILE / 2, 50, GAME_W - 50);
    const label = text(this, cx, Math.max(16, OY + t.y * TILE - 2), this.names[t.y][t.x], 10, C.boneBright, { stroke: true })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH_UI + 1);
    this.inspectLabel = label;
    this.time.delayedCall(1400, () => label.destroy());
  }

  private tapTile(t: Pt): void {
    if (t.x < 0 || t.y < 0 || t.x >= PATCH_W || t.y >= PATCH_H) return;
    if (this.blocked[t.y][t.x]) {
      this.flashBlocked(t);
      return;
    }
    if (this.walking) {
      this.pendingGoal = t; // re-plan after the current step lands
      return;
    }
    this.planAndWalk(t);
  }

  private planAndWalk(goal: Pt): void {
    const path = findPath(PATCH_W, PATCH_H, (x, y) => this.blocked[y][x], this.player.tile, goal);
    if (!path) {
      this.flashBlocked(goal);
      return;
    }
    this.clearDots();
    this.path = path;
    this.dots = path.map((s) =>
      this.add.image(OX + s.x * TILE + TILE / 2, OY + s.y * TILE + TILE / 2, 'path-dot').setAlpha(0.5).setDepth(DEPTH_MARKS),
    );
    this.nextStep();
  }

  private nextStep(): void {
    if (this.pendingGoal) {
      const g = this.pendingGoal;
      this.pendingGoal = null;
      this.walking = false;
      this.planAndWalk(g);
      return;
    }
    const s = this.path.shift();
    if (!s) {
      this.walking = false;
      this.publish();
      return;
    }
    this.walking = true;
    this.tweens.add({
      targets: this.player.sprite,
      x: OX + s.x * TILE + TILE / 2,
      y: OY + s.y * TILE + FOOT,
      duration: STEP_MS,
      ease: 'Linear',
      onComplete: () => {
        this.player.tile = s;
        this.dots.shift()?.destroy();
        play('step');
        this.publish();
        this.nextStep();
      },
    });
  }

  private clearDots(): void {
    this.dots.forEach((d) => d.destroy());
    this.dots = [];
  }

  private flashBlocked(t: Pt): void {
    play('bump');
    const r = this.add.rectangle(OX + t.x * TILE, OY + t.y * TILE, TILE, TILE, BLOCKED_FLASH, 0.6).setOrigin(0).setDepth(DEPTH_MARKS);
    this.tweens.add({ targets: r, alpha: 0, duration: 320, ease: 'Quad.In', onComplete: () => r.destroy() });
  }

  private publish(): void {
    window.__GRIMSHARD__ = { scene: 'Village', player: { ...this.player.tile }, walking: this.walking };
  }
}
