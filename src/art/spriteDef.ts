import type { Grid } from './grid';

export type SpriteCategory = 'tile' | 'character' | 'prop';

/** Swap a ramp of palette letters for one of several alternatives. */
export interface RecolorSlot {
  /** human label, e.g. "tunic" */
  name: string;
  /** source letters as they appear in the grid, e.g. "tkj" (light, mid, dark) */
  from: string;
  /** replacement ramps, same length as `from`; the first is usually `from` itself */
  options: readonly string[];
}

/**
 * The one sprite format (docs/STYLE.md, "How to make a sprite").
 * Frames are letter grids of exactly w x h; letters come from src/art/palette.ts.
 */
export interface SpriteDef {
  /** display name (gallery) */
  name: string;
  /** Phaser texture key, unique */
  key: string;
  category: SpriteCategory;
  w: number;
  h: number;
  frames: readonly Grid[];
  /** how long each frame shows, in ms */
  frameMs: number;
  /** playback order of frame indices; default 0..n-1 */
  sequence?: readonly number[];
  /**
   * Origin inside the sprite, normalised 0..1. Characters stand at
   * bottom-centre of their tile: { x: 0.5, y: 1 }. Default top-left.
   */
  anchor?: { x: number; y: number };
  /** props: tiles blocked, measured from the sprite's bottom-left (default 1x1) */
  footprint?: { w: number; h: number };
  /** letters allowed on the silhouette edge besides the outline (e.g. soul glow) */
  edgeGlow?: string;
  /** per-instance palette swaps (seeded) */
  recolor?: readonly RecolorSlot[];
  /** draw a soft shadow ellipse under it */
  shadow?: boolean;
  /** gallery grouping inside a category (e.g. 'edge' transition tiles) */
  group?: string;
  /** frames before the selective-outline pass (recolour uses these, then re-outlines) */
  rawFrames?: readonly Grid[];
  /** short gallery label (defaults to name) */
  label?: string;
}

export const CHARACTER_ANCHOR = { x: 0.5, y: 1 } as const;
