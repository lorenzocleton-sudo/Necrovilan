import { PALETTE, TRANSPARENT } from '../art/palette';
import type { SpriteDef } from '../art/spriteDef';
import { TILE, CHAR_W, CHAR_H } from '../data/config';

const OUTLINE = 'a';
const isLetter = (ch: string) => ch === TRANSPARENT || ch in PALETTE;

/**
 * Check one sprite against the format and docs/STYLE.md.
 * Returns a list of problems (empty = valid).
 */
export function checkSprite(s: SpriteDef): string[] {
  const errs: string[] = [];
  const tag = s.key || s.name || '?';
  const err = (m: string) => errs.push(`${tag}: ${m}`);
  if (!s.name) err('missing name');
  if (!s.key) err('missing key');
  if (!(s.w > 0 && s.h > 0)) err(`bad size ${s.w}x${s.h}`);
  if (!(s.frameMs > 0)) err('frameMs must be > 0');
  if (s.frames.length === 0) err('no frames');
  s.frames.forEach((f, fi) => {
    if (f.length !== s.h) err(`frame ${fi}: ${f.length} rows, expected ${s.h}`);
    f.forEach((row, y) => {
      if (row.length !== s.w) err(`frame ${fi} row ${y}: width ${row.length}, expected ${s.w}`);
      for (const ch of row) if (!isLetter(ch)) err(`frame ${fi} row ${y}: letter '${ch}' not in palette`);
    });
  });
  s.sequence?.forEach((i) => {
    if (!Number.isInteger(i) || i < 0 || i >= s.frames.length) err(`sequence index ${i} out of range`);
  });
  if (errs.length) return errs; // shape is broken; style checks would be noise

  if (s.category === 'tile') {
    if (s.w !== TILE || s.h !== TILE) err(`tiles are ${TILE}x${TILE}`);
    if (s.frames.some((f) => f.join('').includes(TRANSPARENT))) err('tiles must be fully opaque');
  } else {
    if (s.category === 'character' && (s.w !== CHAR_W || s.h !== CHAR_H)) err(`characters are ${CHAR_W}x${CHAR_H}`);
    const allowed = OUTLINE + (s.edgeGlow ?? '');
    s.frames.forEach((f, fi) => {
      const bad = outlineViolations(f, allowed);
      if (bad.length) err(`frame ${fi}: ${bad.length} edge pixel(s) without outline, first at ${bad[0]}`);
    });
  }
  for (const slot of s.recolor ?? []) {
    for (const opt of slot.options) {
      if (opt.length !== slot.from.length) err(`recolor ${slot.name}: option '${opt}' length differs`);
      for (const ch of opt) if (!(ch in PALETTE)) err(`recolor ${slot.name}: '${ch}' not in palette`);
    }
  }
  const sources = (s.recolor ?? []).map((r) => r.from).join('');
  if (new Set(sources).size !== sources.length) err('recolor slots share a source letter');
  return errs;
}

/** Opaque pixels that touch transparency (4-neighbour) but are not outline/glow. */
export function outlineViolations(f: readonly string[], allowed: string): string[] {
  const out: string[] = [];
  for (let y = 0; y < f.length; y++)
    for (let x = 0; x < f[y].length; x++) {
      const ch = f[y][x];
      if (ch === TRANSPARENT || allowed.includes(ch)) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => f[y + dy]?.[x + dx] ?? TRANSPARENT);
      if (nb.includes(TRANSPARENT)) out.push(`${x},${y}`);
    }
  return out;
}
