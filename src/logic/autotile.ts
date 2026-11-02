/*
 * Ground autotiling: which edges of a tile are covered by an overlay material
 * (grass growing over mud or cobble). 4-neighbour rule, plus a diagonal
 * "corner nub" only where both of its orthogonal neighbours are clear.
 */
export const EDGE_N = 1;
export const EDGE_E = 2;
export const EDGE_S = 4;
export const EDGE_W = 8;
export const NUB_NE = 16;
export const NUB_SE = 32;
export const NUB_SW = 64;
export const NUB_NW = 128;

/**
 * Edge bits for tile (x, y): bit set where the neighbour is `over`.
 * Tiles that are `over` themselves, or not in `under`, get 0. Off-map
 * neighbours never count (no edges along the map border).
 */
export function edgeBits(ground: readonly string[], x: number, y: number, over: string, under: string): number {
  const self = ground[y]?.[x];
  if (self === undefined || self === over || !under.includes(self)) return 0;
  const is = (dx: number, dy: number) => ground[y + dy]?.[x + dx] === over;
  let bits = 0;
  if (is(0, -1)) bits |= EDGE_N;
  if (is(1, 0)) bits |= EDGE_E;
  if (is(0, 1)) bits |= EDGE_S;
  if (is(-1, 0)) bits |= EDGE_W;
  if (is(1, -1) && !(bits & (EDGE_N | EDGE_E))) bits |= NUB_NE;
  if (is(1, 1) && !(bits & (EDGE_S | EDGE_E))) bits |= NUB_SE;
  if (is(-1, 1) && !(bits & (EDGE_S | EDGE_W))) bits |= NUB_SW;
  if (is(-1, -1) && !(bits & (EDGE_N | EDGE_W))) bits |= NUB_NW;
  return bits;
}

/** Edge bits for a whole map (0 = plain tile). */
export function autotile(ground: readonly string[], over: string, under: string): number[][] {
  return ground.map((row, y) => [...row].map((_, x) => edgeBits(ground, x, y, over, under)));
}

/** Short human name: "N", "N+W", "nub NE"... */
export function edgeName(bits: number): string {
  const parts: string[] = [];
  const names: [number, string][] = [
    [EDGE_N, 'N'], [EDGE_E, 'E'], [EDGE_S, 'S'], [EDGE_W, 'W'],
    [NUB_NE, 'nub NE'], [NUB_SE, 'nub SE'], [NUB_SW, 'nub SW'], [NUB_NW, 'nub NW'],
  ];
  for (const [b, n] of names) if (bits & b) parts.push(n);
  return parts.join('+') || 'none';
}
