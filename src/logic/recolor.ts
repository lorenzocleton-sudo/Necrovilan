import { PALETTE } from '../art/palette';
import type { Grid } from '../art/grid';
import type { RecolorSlot } from '../art/spriteDef';
import { makeRng } from './rng';

export type LetterMap = Readonly<Record<string, string>>;

/** Swap letters in a grid (all at once, so a->b, b->c never chains). */
export function recolorGrid(grid: Grid, map: LetterMap): string[] {
  for (const to of Object.values(map)) {
    if (!(to in PALETTE)) throw new Error(`recolor target '${to}' is not a palette letter`);
  }
  return grid.map((row) => [...row].map((ch) => map[ch] ?? ch).join(''));
}

/** Pick one option per slot from a seed; returns the combined letter map. */
export function rollRecolor(slots: readonly RecolorSlot[], seed: number): Record<string, string> {
  const rng = makeRng(seed);
  const map: Record<string, string> = {};
  for (const slot of slots) {
    const opt = slot.options[Math.floor(rng() * slot.options.length)];
    [...slot.from].forEach((ch, i) => {
      if (opt[i] !== ch) map[ch] = opt[i];
    });
  }
  return map;
}

export function recolorFrames(frames: readonly Grid[], slots: readonly RecolorSlot[], seed: number): string[][] {
  const map = rollRecolor(slots, seed);
  return frames.map((f) => recolorGrid(f, map));
}
