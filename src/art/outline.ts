import { TRANSPARENT } from './palette';
import type { Grid } from './grid';
import type { SpriteDef } from './spriteDef';

/** Darkest shade of the material a letter belongs to (selective outline). */
export const DEEP_OF: Readonly<Record<string, string>> = {
  b: 'b', c: 'b', x: 'b',
  d: 'd', e: 'd', f: 'd', g: 'd',
  H: 'H', h: 'H', i: 'H', j: 'H', k: 'H', K: 'H', t: 'H',
  L: 'L', l: 'L', m: 'L', n: 'L', N: 'L',
  O: 'O', o: 'O', p: 'O', q: 'O', Q: 'O', r: 'O', s: 'O',
  u: 'v', U: 'v', v: 'v',
};
/** Letters the outline may become on the lit side. */
export const LIT_OUTLINE = 'bdHLOv';

const isT = (g: Grid, x: number, y: number) => (g[y]?.[x] ?? TRANSPARENT) === TRANSPARENT;

/**
 * Selective outline: an outline pixel ('a') on the lit top-left side of the
 * silhouette — transparent above or to the left, but solid below and to the
 * right — takes the darkest shade of the material it wraps (the pixel below
 * for top edges, to the right for left edges). Shadow-side outline stays 'a'.
 */
export function litOutline(g: Grid): string[] {
  return g.map((row, y) =>
    [...row]
      .map((ch, x) => {
        if (ch !== 'a') return ch;
        if (isT(g, x + 1, y) || isT(g, x, y + 1)) return ch; // shadow side
        const up = isT(g, x, y - 1);
        const left = isT(g, x - 1, y);
        if (!up && !left) return ch;
        const below = g[y + 1][x], right = g[y][x + 1];
        const inner = up ? (below !== 'a' ? below : right) : right !== 'a' ? right : below;
        return DEEP_OF[inner] ?? ch;
      })
      .join(''),
  );
}

/** Sprite with lit-side outline applied; keeps the raw frames so recolours run before the outline pass. */
export function withLitOutline(def: SpriteDef): SpriteDef {
  return { ...def, rawFrames: def.frames, frames: def.frames.map(litOutline) };
}
