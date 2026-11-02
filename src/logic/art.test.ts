import { describe, expect, it } from 'vitest';
import { PALETTE } from '../art/palette';
import { gridToRgba, validateGrid } from '../art/grid';
import { NECROMANCER, PHONE_ICON, SOUL_MOTE, ALL_SPRITES } from '../art/sprites';
import { CHAR_H, CHAR_W, TILE } from '../data/config';
import { makeRng } from './rng';

describe('palette', () => {
  it('has exactly 32 unique colours with single-letter keys', () => {
    const keys = Object.keys(PALETTE);
    const values = Object.values(PALETTE);
    expect(keys).toHaveLength(32);
    expect(new Set(values).size).toBe(32);
    keys.forEach((k) => expect(k).toMatch(/^[a-zA-Z]$/));
    values.forEach((v) => expect(v).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('keeps soul-green and bruise purple', () => {
    expect(PALETTE.w).toBe('#7cffb2');
    expect(PALETTE.x).toBe('#5a2d6e');
  });

  it('has the 8 colours added in 0.2.1', () => {
    expect(PALETTE).toMatchObject({
      A: '#0a080b', U: '#f2ecd8', H: '#2a1f17', K: '#c8a274',
      L: '#1f2818', N: '#8f9c58', O: '#3d1a16', Q: '#d98a5a',
    });
  });

  it('every ramp letter is a palette colour and ramps have 4-6 steps', async () => {
    const { RAMPS } = await import('../art/palette');
    for (const [name, r] of Object.entries(RAMPS)) {
      for (const ch of r) expect(ch in PALETTE, `${name} ${ch}`).toBe(true);
      if (name !== 'bone') expect(r.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('sprites', () => {
  it('necromancer idle has 3 frames of 24x32 using only palette letters', () => {
    expect(NECROMANCER.frames).toHaveLength(3);
    NECROMANCER.frames.forEach((f, i) => validateGrid(f, CHAR_W, CHAR_H, `necro${i}`));
  });

  it('ground tiles are 24x24, fully opaque, with no outline colour', () => {
    for (const t of ALL_SPRITES.filter((s) => /cobble|grass|mud/.test(s.key)).map((s) => s.frames[0])) {
      validateGrid(t, TILE, TILE);
      expect(t.join('')).not.toMatch(/[.a]/);
    }
  });

  it('small sprites are valid', () => {
    validateGrid(PHONE_ICON, 12, 20);
    validateGrid(SOUL_MOTE, 2, 2);
  });

  it('gridToRgba converts letters and transparency', () => {
    const px = gridToRgba(['a.', '.w']);
    expect([...px.slice(0, 4)]).toEqual([0x12, 0x0e, 0x12, 255]);
    expect(px[7]).toBe(0);
    expect([...px.slice(12, 16)]).toEqual([0x7c, 0xff, 0xb2, 255]);
  });
});

describe('rng', () => {
  it('is deterministic per seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    xs.forEach((x) => expect(x).toBeGreaterThanOrEqual(0));
    xs.forEach((x) => expect(x).toBeLessThan(1));
  });
});

describe('ui panels', () => {
  it('builds valid parchment/iron buttons of any size', async () => {
    const { panelGrid } = await import('../art/ui');
    for (const st of ['parchment', 'iron', 'ironDown', 'ironOff', 'ironSel'] as const) {
      const g = panelGrid(60, 34, st);
      validateGrid(g, 60, 34, st);
      expect(g[0][0]).toBe('.');
      expect('aw').toContain(g[0][1]);
    }
  });
});

describe('no dithering', () => {
  it('detects a checkerboard run', async () => {
    const { longestCheckerRun } = await import('./dither');
    expect(longestCheckerRun(['ababab', 'bababa'])).toBe(5);
    expect(longestCheckerRun(['aabb', 'aabb'])).toBe(0);
    expect(longestCheckerRun(['a.a.', '.a.a'])).toBe(0); // transparency is not dither
  });

  it('UI panels, icons and motes contain no checkerboard', async () => {
    const { longestCheckerRun, MAX_CHECKER_RUN } = await import('./dither');
    const { panelGrid } = await import('../art/ui');
    const grids = [PHONE_ICON, SOUL_MOTE, ...(['parchment', 'iron', 'ironDown', 'ironOff', 'ironSel'] as const).map((s) => panelGrid(80, 34, s))];
    for (const g of grids) expect(longestCheckerRun(g)).toBeLessThanOrEqual(MAX_CHECKER_RUN);
  });
});

describe('selective outline', () => {
  it('lit-side outline takes the material deep shade, shadow side stays black', async () => {
    const { litOutline } = await import('../art/outline');
    const g = litOutline(['.aaa.', 'aqqqa', 'aqqqa', '.aaa.']);
    expect(g[0]).toBe('.OOa.'); // top edge over roof q -> deep roof O; last one touches the right
    expect(g[1][0]).toBe('O'); // left edge
    expect(g[1][4]).toBe('a'); // right edge
    expect(g[3]).toBe('.aaa.'); // bottom edge
  });
});
