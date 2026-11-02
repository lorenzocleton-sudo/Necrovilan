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

/** 4x4 Bayer matrix, values 0..15. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * Dithered vignette as a letter grid: palette-pure darkening toward the
 * edges (no alpha blending, so no off-palette colours).
 */
export function vignetteGrid(
  w: number,
  h: number,
  letter: PaletteKey = 'a',
  opts: { inner?: number; range?: number; max?: number } = {},
): string[] {
  const { inner = 0.4, range = 0.28, max = 1 } = opts;
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5) / w - 0.5;
      const ny = (y + 0.5) / h - 0.5;
      const d = Math.sqrt(nx * nx * 1.1 + ny * ny * 2.2); // ellipse
      const strength = Math.min(max, Math.max(0, (d - inner) / range));
      const threshold = (BAYER4[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      row += strength > threshold ? letter : TRANSPARENT;
    }
    rows.push(row);
  }
  return rows;
}
