/**
 * LOCKED PALETTE (24 colours) — see docs/STYLE.md.
 * Each colour has one letter used in sprite grids; '.' is transparent.
 * Adding a colour requires an entry in docs/DECISIONS.md.
 */
export const PALETTE = {
  // darks
  a: '#120e12', b: '#231a22', c: '#3a2c34',
  // stone
  d: '#4b4a52', e: '#6d6a6e', f: '#9a958f', g: '#c9c2b2',
  // earth
  h: '#3b2a1e', i: '#5c4130', j: '#7f5d42', k: '#a8835c',
  // moss
  l: '#2f3a24', m: '#4a5a32', n: '#6f7d45',
  // roof
  o: '#5e2a22', p: '#8c3f2f', q: '#b7623f',
  // warm
  r: '#d9a37e', s: '#8a2f2f', t: '#c49a3a',
  // bone / undead
  u: '#e6dfc8', v: '#7d8a96',
  // necromancy: soul-green, bruise purple
  w: '#7cffb2', x: '#5a2d6e',
} as const;

export type PaletteKey = keyof typeof PALETTE;
export const TRANSPARENT = '.';

/** Named handles for code that needs a specific colour. */
export const C = {
  ink: PALETTE.a,
  night: PALETTE.b,
  bone: PALETTE.u,
  stoneLight: PALETTE.g,
  soul: PALETTE.w,
  bruise: PALETTE.x,
  gold: PALETTE.t,
} as const;

/** '#rrggbb' -> 0xrrggbb */
export function hexToInt(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

/** '#rrggbb' -> [r, g, b] */
export function hexToRgb(hex: string): [number, number, number] {
  const n = hexToInt(hex);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
