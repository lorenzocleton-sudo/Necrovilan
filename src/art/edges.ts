import type { Grid } from './grid';
import type { SpriteDef } from './spriteDef';
import { TILE_COBBLE_A, TILE_COBBLE_B, TILE_GRASS_A, TILE_GRASS_B, TILE_MUD_A, TILE_MUD_B } from './sprites/tiles';
import {
  EDGE_E, EDGE_N, EDGE_S, EDGE_W, NUB_NE, NUB_NW, NUB_SE, NUB_SW,
} from '../logic/autotile';

/*
 * Grass-over-ground transition tiles, composed from the grass tile and the
 * ground tile through a tufted mask, then shaded: lit moss rim where grass
 * faces up/left, deep-moss rim where it faces down/right, and a 2px shadow on
 * the ground below / 1px right of the grass (light from the top-left).
 * Pure letter-grid code: same rules as hand-drawn tiles (validator + dither test).
 */
const S = 24;
/** Tuft profile: how deep grass reaches in from an edge, per pixel along it. f(0) = f(23) so edges join. */
const TUFT = [4, 5, 7, 5, 4, 3, 4, 6, 8, 6, 4, 3, 4, 5, 6, 9, 6, 4, 3, 4, 6, 7, 5, 4];
const CORNER_R = 5;
const NUB_R = 4.6;

/** True where grass covers the ground for the given edge bits. */
export function edgeMask(bits: number): boolean[][] {
  const m = Array.from({ length: S }, () => Array<boolean>(S).fill(false));
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      let on = false;
      if (bits & EDGE_N) on ||= y < TUFT[x];
      if (bits & EDGE_S) on ||= S - 1 - y < TUFT[S - 1 - x];
      if (bits & EDGE_W) on ||= x < TUFT[S - 1 - y];
      if (bits & EDGE_E) on ||= S - 1 - x < TUFT[y];
      // inner corners: round the ground's corner where two edges meet
      const c = 4 + CORNER_R;
      const corner = (cx: number, cy: number) => {
        const dx = Math.abs(x + 0.5 - cx) , dy = Math.abs(y + 0.5 - cy);
        return Math.hypot(dx, dy) > CORNER_R;
      };
      if ((bits & EDGE_N) && (bits & EDGE_W) && x < c && y < c) on ||= corner(c, c);
      if ((bits & EDGE_N) && (bits & EDGE_E) && x >= S - c && y < c) on ||= corner(S - c, c);
      if ((bits & EDGE_S) && (bits & EDGE_W) && x < c && y >= S - c) on ||= corner(c, S - c);
      if ((bits & EDGE_S) && (bits & EDGE_E) && x >= S - c && y >= S - c) on ||= corner(S - c, S - c);
      // outer corners: a small tufted nub of grass in the corner
      const nub = (cx: number, cy: number) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < NUB_R + ((x * 5 + y * 3) % 4 === 0 ? 1 : 0);
      if (bits & NUB_NW) on ||= nub(0, 0);
      if (bits & NUB_NE) on ||= nub(S, 0);
      if (bits & NUB_SW) on ||= nub(0, S);
      if (bits & NUB_SE) on ||= nub(S, S);
      m[y][x] = on;
    }
  return m;
}

/** Ground letter -> its shade when grass casts a shadow on it. */
const SHADOW: Readonly<Record<string, string>> = {
  K: 'j', k: 'i', j: 'i', i: 'h', h: 'H', H: 'H',
  g: 'e', f: 'e', e: 'd', d: 'c', c: 'b', b: 'b', A: 'A',
  N: 'n', n: 'm', m: 'l', l: 'L', L: 'L', t: 'H',
};

/** Compose grass `over` onto `under` through the mask for `bits`, with rim light and shadow. */
export function composeEdge(over: Grid, under: Grid, bits: number): string[] {
  const m = edgeMask(bits);
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < S && y < S;
  const grassAt = (x: number, y: number) => inside(x, y) && m[y][x];
  const groundAt = (x: number, y: number) => inside(x, y) && !m[y][x];
  const rows: string[] = [];
  for (let y = 0; y < S; y++) {
    let row = '';
    for (let x = 0; x < S; x++) {
      let ch: string;
      if (m[y][x]) {
        ch = over[y][x];
        if (groundAt(x, y + 1) || groundAt(x + 1, y)) ch = 'L'; // underside of the tuft
        else if (groundAt(x, y - 1) || groundAt(x - 1, y)) ch = 'N'; // lit rim
      } else {
        ch = under[y][x];
        const shaded = grassAt(x, y - 1) || grassAt(x, y - 2) || grassAt(x - 1, y);
        if (shaded) ch = SHADOW[ch] ?? ch;
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

export type EdgeGround = 'mud' | 'cobble';
const GRASS = [TILE_GRASS_A, TILE_GRASS_B];
const UNDER: Record<EdgeGround, SpriteDef[]> = { mud: [TILE_MUD_A, TILE_MUD_B], cobble: [TILE_COBBLE_A, TILE_COBBLE_B] };

export const edgeKey = (ground: EdgeGround, bits: number, variant: 0 | 1 = 0) => `edge-${ground}-${bits}-${variant}`;

/** Grid for one transition tile; variant picks the A/B ground and grass. */
export function edgeGrid(ground: EdgeGround, bits: number, variant: 0 | 1 = 0): string[] {
  return composeEdge(GRASS[variant].frames[0], UNDER[ground][variant].frames[0], bits);
}

/** The 12 canonical transitions per ground: straight edges, inner (L) corners, outer corner nubs. */
export const CANONICAL_EDGES: readonly { bits: number; label: string }[] = [
  { bits: EDGE_N, label: 'N' }, { bits: EDGE_E, label: 'E' }, { bits: EDGE_S, label: 'S' }, { bits: EDGE_W, label: 'W' },
  { bits: EDGE_N | EDGE_W, label: 'in NW' }, { bits: EDGE_N | EDGE_E, label: 'in NE' },
  { bits: EDGE_S | EDGE_W, label: 'in SW' }, { bits: EDGE_S | EDGE_E, label: 'in SE' },
  { bits: NUB_NW, label: 'out NW' }, { bits: NUB_NE, label: 'out NE' }, { bits: NUB_SW, label: 'out SW' }, { bits: NUB_SE, label: 'out SE' },
];

const TITLE: Record<EdgeGround, string> = { mud: 'Grass/mud', cobble: 'Grass/cobble' };

/** Edge tiles as sprites (gallery + validator). */
export const EDGE_SPRITES: readonly SpriteDef[] = (['mud', 'cobble'] as const).flatMap((g) =>
  CANONICAL_EDGES.map(({ bits, label }) => ({
    name: `${TITLE[g]} ${label}`,
    key: edgeKey(g, bits),
    category: 'tile' as const,
    group: 'edge',
    label,
    w: S,
    h: S,
    frameMs: 1000,
    frames: [edgeGrid(g, bits)],
  })),
);
