import { describe, expect, it } from 'vitest';
import { buildBlocked, variantAt } from './tilemap';
import { findPath } from './path';
import {
  GROUND_TILES, PATCH_ACTORS, PATCH_GROUND, PATCH_H, PATCH_PLAYER_START, PATCH_PROPS, PATCH_SEED, PATCH_W,
} from '../data/testPatch';
import { ALL_SPRITES } from '../art/sprites';

const spec = {
  w: PATCH_W,
  h: PATCH_H,
  ground: PATCH_GROUND,
  blocksGround: (l: string) => GROUND_TILES[l].blocks,
  props: PATCH_PROPS,
  actors: PATCH_ACTORS,
  footprint: (k: string) => ALL_SPRITES.find((s) => s.key === k)?.footprint ?? { w: 1, h: 1 },
};

describe('test patch', () => {
  it('is 20x11 (480x264 px) with known ground letters and registered sprites', () => {
    expect(PATCH_GROUND).toHaveLength(PATCH_H);
    PATCH_GROUND.forEach((r) => {
      expect(r).toHaveLength(PATCH_W);
      for (const l of r) expect(GROUND_TILES[l]).toBeDefined();
    });
    for (const p of [...PATCH_PROPS, ...PATCH_ACTORS]) expect(ALL_SPRITES.some((s) => s.key === p.sprite)).toBe(true);
  });

  it('walls, roof, props and actors block; the player start is free', () => {
    const b = buildBlocked(spec);
    expect(PATCH_W * 24).toBe(480);
    expect(b[0][1] && b[1][2] && b[2][3]).toBe(true); // house 1 (3x3)
    expect(b[2][16]).toBe(true); // house 2 door
    expect(b[3][6] && b[3][7]).toBe(true); // stall footprint 2x1
    expect(b[2][6]).toBe(false); // under the awning overhang
    expect(b[5][14] && b[5][15]).toBe(true); // cart
    expect(b[3][11]).toBe(true); // well
    expect(b[8][2] && b[8][4] && b[10][3]).toBe(true); // graves
    expect(b[9][5]).toBe(true); // skeleton
    expect(b[PATCH_PLAYER_START.y][PATCH_PLAYER_START.x]).toBe(false);
  });

  it('every free tile is reachable from the start', () => {
    const b = buildBlocked(spec);
    for (let y = 0; y < PATCH_H; y++)
      for (let x = 0; x < PATCH_W; x++) {
        if (b[y][x]) continue;
        const p = findPath(PATCH_W, PATCH_H, (px, py) => b[py][px], PATCH_PLAYER_START, { x, y });
        expect(p, `tile ${x},${y}`).not.toBeNull();
      }
  });

  it('ground variants are deterministic and use both A and B', () => {
    const vs: number[] = [];
    for (let y = 0; y < PATCH_H; y++) for (let x = 0; x < PATCH_W; x++) vs.push(variantAt(x, y, PATCH_SEED));
    expect(new Set(vs)).toEqual(new Set([0, 1]));
    expect(variantAt(3, 2, PATCH_SEED)).toBe(variantAt(3, 2, PATCH_SEED));
  });
});
