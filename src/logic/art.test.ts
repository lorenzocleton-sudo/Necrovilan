import { describe, expect, it } from 'vitest';
import { PALETTE } from '../art/palette';
import { gridToRgba, validateGrid, vignetteGrid } from '../art/grid';
import { NECROMANCER, PHONE_ICON, SOUL_MOTE, ALL_SPRITES } from '../art/sprites';
import { CHAR_H, CHAR_W, TILE } from '../data/config';
import { makeRng } from './rng';

describe('palette', () => {
  it('has exactly 24 unique colours with single-letter keys', () => {
    const keys = Object.keys(PALETTE);
    const values = Object.values(PALETTE);
    expect(keys).toHaveLength(24);
    expect(new Set(values).size).toBe(24);
    keys.forEach((k) => expect(k).toMatch(/^[a-z]$/));
    values.forEach((v) => expect(v).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('keeps soul-green and bruise purple', () => {
    expect(PALETTE.w).toBe('#7cffb2');
    expect(PALETTE.x).toBe('#5a2d6e');
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

  it('every opaque character pixel touching transparency is outline or glow', () => {
    // 1px dark outline rule (soul glow at the staff tip is the exception)
    const f = NECROMANCER.frames[0];
    for (let y = 0; y < f.length; y++)
      for (let x = 0; x < f[0].length; x++) {
        const ch = f[y][x];
        if (ch === '.') continue;
        const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (f[y + dy]?.[x + dx] ?? '.') === '.');
        if (edge) expect('aw').toContain(ch);
      }
  });

  it('gridToRgba converts letters and transparency', () => {
    const px = gridToRgba(['a.', '.w']);
    expect([...px.slice(0, 4)]).toEqual([0x12, 0x0e, 0x12, 255]);
    expect(px[7]).toBe(0);
    expect([...px.slice(12, 16)]).toEqual([0x7c, 0xff, 0xb2, 255]);
  });

  it('vignette is clear in the centre and dark in the corners', () => {
    const v = vignetteGrid(240, 135);
    validateGrid(v, 240, 135);
    expect(v[67][120]).toBe('.');
    expect(v[0][0]).toBe('a');
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
    for (const st of ['parchment', 'parchmentDown', 'iron', 'ironDown'] as const) {
      const g = panelGrid(60, 34, st);
      validateGrid(g, 60, 34, st);
      expect(g[0][0]).toBe('.');
      expect(g[0][1]).toBe('a');
    }
  });
});
