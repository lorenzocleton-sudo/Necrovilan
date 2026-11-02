import { TRANSPARENT } from '../art/palette';

/**
 * Longest run of 2x2 checkerboard windows (two different opaque letters
 * alternating, ab/ba) along any row pair or column pair. Ordered dithering
 * shows up as long runs; clustered texture stays at 0-2.
 */
export function longestCheckerRun(g: readonly string[]): number {
  const h = g.length;
  const w = g[0]?.length ?? 0;
  const at = (x: number, y: number) => g[y][x];
  const isChecker = (x: number, y: number) => {
    const a = at(x, y), b = at(x + 1, y);
    return a !== b && a !== TRANSPARENT && b !== TRANSPARENT && at(x, y + 1) === b && at(x + 1, y + 1) === a;
  };
  let best = 0;
  for (let y = 0; y + 1 < h; y++) {
    let run = 0;
    for (let x = 0; x + 1 < w; x++) best = Math.max(best, (run = isChecker(x, y) ? run + 1 : 0));
  }
  for (let x = 0; x + 1 < w; x++) {
    let run = 0;
    for (let y = 0; y + 1 < h; y++) best = Math.max(best, (run = isChecker(x, y) ? run + 1 : 0));
  }
  return best;
}

/** STYLE.md: no checkerboard of two alternating letters repeated more than 3 times in a row. */
export const MAX_CHECKER_RUN = 3;
