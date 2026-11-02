import type { Grid } from './grid';
import type { SpriteDef } from './spriteDef';
import { NECROMANCER, PEASANT, GUARD, SKELETON } from './sprites/characters';
import { GRAVE, CART, STALL } from './sprites/props';
import {
  TILE_COBBLE_A, TILE_COBBLE_B, TILE_GRASS_A, TILE_GRASS_B, TILE_MUD_A, TILE_MUD_B,
  TILE_WALL, TILE_WALL_DOOR, TILE_ROOF,
} from './sprites/tiles';

/*
 * Sprite registry. Every SpriteDef listed here gets a texture at boot, shows
 * in the Art Gallery and is checked by src/logic/sprites.test.ts.
 * Add new sprites to ALL_SPRITES. Format: docs/STYLE.md "How to make a sprite".
 */
export const ALL_SPRITES: readonly SpriteDef[] = [
  TILE_COBBLE_A, TILE_COBBLE_B, TILE_GRASS_A, TILE_GRASS_B, TILE_MUD_A, TILE_MUD_B,
  TILE_WALL, TILE_WALL_DOOR, TILE_ROOF,
  NECROMANCER, PEASANT, GUARD, SKELETON,
  GRAVE, CART, STALL,
];

export { NECROMANCER, PEASANT, GUARD, SKELETON, GRAVE, CART, STALL };

/** Character ground shadow, 18x6, drawn at ~50% alpha. */
export const SHADOW: Grid = [
  '....aaaaaaaaaa....',
  '.aaaaaaaaaaaaaaaa.',
  'aaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaa',
  '.aaaaaaaaaaaaaaaa.',
  '....aaaaaaaaaa....',
];

/** Phone icon for the rotate screen, 12x20. */
export const PHONE_ICON: Grid = [
  'aaaaaaaaaaaa',
  'adddddddddda',
  'adeeeeeeeeca',
  'adbbbbbbbbca',
  'adbcccccccca',
  'adbcwwcccbca',
  'adbcwccccbca',
  'adbccccccbca',
  'adbccccccbca',
  'adbccccccbca',
  'adbccccccbca',
  'adbccccccbca',
  'adbccccccbca',
  'adbccccccbca',
  'adbbbbbbbbca',
  'adeeeeeeeeca',
  'adeeeggeeeca',
  'adeeeeeeeeca',
  'acccccccccca',
  'aaaaaaaaaaaa',
];

/** 2x2 soul-green particle. */
export const SOUL_MOTE: Grid = ['ww', 'wu'];
