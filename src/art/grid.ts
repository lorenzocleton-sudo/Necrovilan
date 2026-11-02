import { PALETTE, TRANSPARENT, hexToRgb, type PaletteKey } from './palette';

export type Grid = readonly string[];

/** Throws if a grid is ragged or uses a letter outside the palette. */
export function validateGrid(grid: Grid, w: number, h: number, name = 'grid'): void {
  if (grid.length !== h) throw new Error(`${name}: expected ${h} rows, got ${grid.length}`);
  grid.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${name}: row ${y} has ${row.length} cols, expected ${w}`);
    for (const ch of row) {
      if (ch !== TRANSPARENT && !(ch in PALETTE)) throw new Error(`${name}: bad letter '${ch}' in row ${y}`);
    }
  });
}

/** Convert a letter grid to RGBA bytes (pure; used by the texture renderer and tests). */
export function gridToRgba(grid: Grid): Uint8ClampedArray {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = grid[y][x];
      if (ch === TRANSPARENT) continue;
      const [r, g, b] = hexToRgb(PALETTE[ch as PaletteKey]);
      const i = (y * w + x) * 4;
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = 255;
    }
  }
  return out;
}
