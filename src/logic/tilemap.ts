import type { Placement } from '../data/testPatch';

export interface PatchSpec {
  w: number;
  h: number;
  ground: readonly string[];
  blocksGround: (letter: string) => boolean;
  props: readonly Placement[];
  actors: readonly Placement[];
  /** footprint size per prop sprite key (default 1x1) */
  footprint: (sprite: string) => { w: number; h: number };
}

/**
 * Blocked-tile grid: blocking ground (walls, roof), prop footprints (counted
 * up and right from the prop's bottom-left tile) and standing actors.
 */
export function buildBlocked(p: PatchSpec): boolean[][] {
  const b = Array.from({ length: p.h }, (_, y) => Array.from({ length: p.w }, (_, x) => p.blocksGround(p.ground[y][x])));
  const mark = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < p.w && y < p.h) b[y][x] = true;
  };
  for (const pr of p.props) {
    const fp = p.footprint(pr.sprite);
    for (let dy = 0; dy < fp.h; dy++) for (let dx = 0; dx < fp.w; dx++) mark(pr.x + dx, pr.y - dy);
  }
  for (const a of p.actors) mark(a.x, a.y);
  return b;
}

/** Deterministic A/B ground variant per tile (seeded hash, no Math.random). */
export function variantAt(x: number, y: number, seed: number): 0 | 1 {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 3 === 0 ? 1 : 0;
}
