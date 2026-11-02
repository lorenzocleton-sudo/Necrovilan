/*
 * Test Village: a hand-built 10x6 patch (v0.2 slice).
 * Ground letters: C cobblestone, G grass, M mud, R roof, W wall, D wall with door.
 * Props/actors are placed by tile; props use their bottom-left footprint tile.
 */
export const PATCH_W = 10;
export const PATCH_H = 6;

export const PATCH_GROUND: readonly string[] = [
  'GRRGCCCCGG',
  'GWDGCCCCCG',
  'GMMMCCCCCG',
  'GGMGCCCCCG',
  'GGMMMCCCCG',
  'GGGGMMMGGG',
];

/** Ground letter -> texture base key (variants -a/-b are picked per tile). */
export const GROUND_TILES: Readonly<Record<string, { key: string; variants: boolean; blocks: boolean; name: string }>> = {
  C: { key: 'tile-cobble', variants: true, blocks: false, name: 'Cobblestone' },
  G: { key: 'tile-grass', variants: true, blocks: false, name: 'Grass' },
  M: { key: 'tile-mud', variants: true, blocks: false, name: 'Mud path' },
  R: { key: 'tile-roof', variants: false, blocks: true, name: 'Terracotta roof' },
  W: { key: 'tile-wall', variants: false, blocks: true, name: 'Stone wall' },
  D: { key: 'tile-wall-door', variants: false, blocks: true, name: 'Door (locked)' },
};

export interface Placement {
  /** sprite key from the registry */
  sprite: string;
  x: number;
  y: number;
  /** recolour seed (peasants) */
  seed?: number;
}

export const PATCH_PROPS: readonly Placement[] = [
  { sprite: 'stall', x: 5, y: 1 },
  { sprite: 'cart', x: 7, y: 4 },
  { sprite: 'grave', x: 0, y: 4 },
];

export const PATCH_ACTORS: readonly Placement[] = [
  { sprite: 'peasant', x: 5, y: 2, seed: 3 },
  { sprite: 'guard', x: 3, y: 1 },
  { sprite: 'skeleton', x: 1, y: 4 },
];

export const PATCH_PLAYER_START = { x: 6, y: 3 };
/** Seed for ground variant choice. */
export const PATCH_SEED = 0x0202;
