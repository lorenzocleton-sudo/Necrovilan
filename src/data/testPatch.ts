/*
 * Test Village: a hand-built 20x11 patch (v0.2.1) = 480x264 px, filling the
 * internal resolution. Cobblestone square in the middle, mud roads leading
 * out, grass around; two houses, a stall, a cart, a well, three graves.
 * Ground letters: C cobblestone, G grass, M mud.
 * Props/actors are placed by tile; props use their bottom-left footprint tile.
 * Grass edges over mud/cobble are auto-tiled (src/logic/autotile.ts).
 */
export const PATCH_W = 20;
export const PATCH_H = 11;

export const PATCH_GROUND: readonly string[] = [
  'GGGGGGGGMMGGGGGGGGGG',
  'GGGGGGGGMMGGGGGGGGGG',
  'GGGGGGGGMMGGGGGGGGGG',
  'GGMGGGCCCCCCCGGGMGGG',
  'MMMMMMCCCCCCCMMMMMMM',
  'MMMMMMCCCCCCCMMMMMMM',
  'GGGGGGCCCCCCCGGGGGGG',
  'GGGGGGGGMMGGGGGGGGGG',
  'GGGGGGGGMMGGGGGGGGGG',
  'GGGGGGGGMMMGGGGGGGGG',
  'GGGGGGGGGMMGGGGGGGGG',
];

/** Ground letter -> texture base key (variants -a/-b are picked per tile). */
export const GROUND_TILES: Readonly<Record<string, { key: string; variants: boolean; blocks: boolean; name: string; edge?: 'mud' | 'cobble' }>> = {
  C: { key: 'tile-cobble', variants: true, blocks: false, name: 'Cobblestone', edge: 'cobble' },
  G: { key: 'tile-grass', variants: true, blocks: false, name: 'Grass' },
  M: { key: 'tile-mud', variants: true, blocks: false, name: 'Mud path', edge: 'mud' },
};

export interface Placement {
  /** sprite key from the registry */
  sprite: string;
  x: number;
  y: number;
  /** recolour seed (peasants) */
  seed?: number;
  /** mirror horizontally */
  flip?: boolean;
}

export const PATCH_PROPS: readonly Placement[] = [
  { sprite: 'house', x: 1, y: 2 },
  { sprite: 'house', x: 15, y: 2, flip: true },
  { sprite: 'stall', x: 6, y: 3 },
  { sprite: 'well', x: 11, y: 3 },
  { sprite: 'cart', x: 14, y: 5 },
  { sprite: 'grave', x: 2, y: 8 },
  { sprite: 'grave', x: 4, y: 8 },
  { sprite: 'grave', x: 3, y: 10 },
];

export const PATCH_ACTORS: readonly Placement[] = [
  { sprite: 'peasant', x: 7, y: 4, seed: 3 },
  { sprite: 'guard', x: 13, y: 3 },
  { sprite: 'skeleton', x: 5, y: 9 },
];

export const PATCH_PLAYER_START = { x: 9, y: 6 };
/** Seed for ground variant choice. */
export const PATCH_SEED = 0x0221;
