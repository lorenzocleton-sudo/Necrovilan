/**
 * LOCKED PALETTE (32 colours) — see docs/STYLE.md.
 * Each colour has one letter used in sprite grids; '.' is transparent.
 * v0.2.1 added 8 colours as UPPERCASE letters: the uppercase of a letter is
 * the extra step at the end of that material's ramp (A deepest dark, H deep
 * earth, K earth highlight, L deep moss, N moss highlight, O deep roof,
 * Q roof highlight, U bright bone).
 * Adding a colour requires an entry in docs/DECISIONS.md.
 */
export const PALETTE = {
  // darks (A = deepest)
  A: '#0a080b', a: '#120e12', b: '#231a22', c: '#3a2c34',
  // stone
  d: '#4b4a52', e: '#6d6a6e', f: '#9a958f', g: '#c9c2b2',
  // earth: H deep, h, i, j, k, K highlight
  H: '#2a1f17', h: '#3b2a1e', i: '#5c4130', j: '#7f5d42', k: '#a8835c', K: '#c8a274',
  // moss: L deep, l, m, n, N highlight
  L: '#1f2818', l: '#2f3a24', m: '#4a5a32', n: '#6f7d45', N: '#8f9c58',
  // roof: O deep, o, p, q, Q highlight
  O: '#3d1a16', o: '#5e2a22', p: '#8c3f2f', q: '#b7623f', Q: '#d98a5a',
  // warm
  r: '#d9a37e', s: '#8a2f2f', t: '#c49a3a',
  // bone / undead (U = bright bone)
  u: '#e6dfc8', U: '#f2ecd8', v: '#7d8a96',
  // necromancy: soul-green, bruise purple
  w: '#7cffb2', x: '#5a2d6e',
} as const;

export type PaletteKey = keyof typeof PALETTE;
export const TRANSPARENT = '.';

/** Material ramps, darkest -> lightest (used by tools, tests and the gallery). */
export const RAMPS: Readonly<Record<string, string>> = {
  darks: 'Aabc',
  stone: 'cdefg',
  earth: 'Hhijk' + 'K',
  moss: 'LlmnN',
  roof: 'OopqQ',
  bone: 'vuU',
  robe: 'Abcx',
};

/** Named handles for code that needs a specific colour. */
export const C = {
  deep: PALETTE.A,
  ink: PALETTE.a,
  night: PALETTE.b,
  slate: PALETTE.c,
  bone: PALETTE.u,
  boneBright: PALETTE.U,
  stoneLight: PALETTE.g,
  stoneMid: PALETTE.f,
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
