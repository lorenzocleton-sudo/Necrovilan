import { describe, expect, it } from 'vitest';
import { ALL_SPRITES, PEASANT } from '../art/sprites';
import { checkSprite } from './spriteCheck';
import { recolorFrames, recolorGrid, recolorSprite, rollRecolor } from './recolor';
import { PALETTE } from '../art/palette';
import type { SpriteDef } from '../art/spriteDef';
import { longestCheckerRun, MAX_CHECKER_RUN } from './dither';

describe('sprite registry', () => {
  it('holds every reference sprite (9 tiles, 24 edge tiles, 4 characters, 5 props)', () => {
    const count = (c: string) => ALL_SPRITES.filter((s) => s.category === c && s.group !== 'edge').length;
    expect(count('tile')).toBe(9);
    expect(ALL_SPRITES.filter((s) => s.group === 'edge')).toHaveLength(24);
    expect(count('character')).toBe(4);
    expect(count('prop')).toBe(5);
    expect(new Set(ALL_SPRITES.map((s) => s.key)).size).toBe(ALL_SPRITES.length);
  });

  it.each(ALL_SPRITES.map((s) => [s.key, s] as const))('%s passes the validator', (_k, s) => {
    expect(checkSprite(s)).toEqual([]);
  });

  it.each(ALL_SPRITES.map((s) => [s.key, s] as const))('%s has no checkerboard dithering', (_k, s) => {
    for (const f of s.frames) expect(longestCheckerRun(f)).toBeLessThanOrEqual(MAX_CHECKER_RUN);
  });

  it('characters have a 3-frame idle and a bottom-centre anchor', () => {
    for (const s of ALL_SPRITES.filter((d) => d.category === 'character')) {
      expect(s.frames).toHaveLength(3);
      expect(s.anchor).toEqual({ x: 0.5, y: 1 });
      expect(s.shadow).toBe(true);
    }
  });

  it('ground tiles tile seamlessly with their variant (shared border pixels)', () => {
    for (const base of ['cobble', 'grass', 'mud']) {
      const [a, b] = ['a', 'b'].map((v) => ALL_SPRITES.find((s) => s.key === `tile-${base}-${v}`)!.frames[0]);
      expect(a).not.toEqual(b);
      // the outer ring is identical in both variants
      expect(b[0]).toBe(a[0]);
      expect(b[23]).toBe(a[23]);
      expect(b.map((r) => r[0] + r[23])).toEqual(a.map((r) => r[0] + r[23]));
    }
  });

  it('ground tiles have clear value contrast: mud darkest, grass mid, cobble lightest', async () => {
    const { hexToRgb, PALETTE } = await import('../art/palette');
    const lum = (key: string) => {
      const f = ALL_SPRITES.find((s) => s.key === key)!.frames[0].join('');
      let sum = 0;
      for (const ch of f) {
        const [r, g, b] = hexToRgb(PALETTE[ch as keyof typeof PALETTE]);
        sum += 0.299 * r + 0.587 * g + 0.114 * b;
      }
      return sum / f.length;
    };
    expect(lum('tile-mud-a') + 25).toBeLessThan(lum('tile-grass-a'));
    expect(lum('tile-grass-a') + 6).toBeLessThan(lum('tile-cobble-a'));
  });
});

describe('validator catches broken sprites', () => {
  const ok: SpriteDef = { name: 'T', key: 't', category: 'prop', w: 3, h: 3, frameMs: 100, frames: [['aaa', 'aga', 'aaa']] };
  it('accepts a good one', () => expect(checkSprite(ok)).toEqual([]));
  it('ragged row', () => expect(checkSprite({ ...ok, frames: [['aaa', 'ag', 'aaa']] }).join()).toMatch(/width 2/));
  it('wrong row count', () => expect(checkSprite({ ...ok, frames: [['aaa', 'aaa']] }).join()).toMatch(/2 rows/));
  it('unknown letter', () => expect(checkSprite({ ...ok, frames: [['aaa', 'aZa', 'aaa']] }).join()).toMatch(/'Z' not in palette/));
  it('frames of different size', () =>
    expect(checkSprite({ ...ok, frames: [ok.frames[0], ['aaaa', 'aaaa', 'aaaa']] }).join()).toMatch(/frame 1 row 0: width 4/));
  it('missing outline on a prop', () => expect(checkSprite({ ...ok, frames: [['.g.', 'aga', 'aaa']] }).join()).toMatch(/without outline/));
  it('deep shade allowed on the lit side only', () => {
    expect(checkSprite({ ...ok, frames: [['.da', 'dga', 'aaa']] })).toEqual([]);
    expect(checkSprite({ ...ok, frames: [['aaa', 'agd', 'aaa']] }).join()).toMatch(/without outline/);
  });
  it('checkerboard dither', () =>
    expect(checkSprite({ ...ok, category: 'tile', w: 24, h: 24, frames: [Array.from({ length: 24 }, (_, y) => (y % 2 ? 'mn' : 'nm').repeat(12))] }).join()).toMatch(/checkerboard/));
  it('transparent tile', () =>
    expect(checkSprite({ ...ok, category: 'tile', w: 24, h: 24, frames: [Array(24).fill('.'.repeat(24))] }).join()).toMatch(/opaque/));
  it('bad sequence', () => expect(checkSprite({ ...ok, sequence: [0, 3] }).join()).toMatch(/sequence index 3/));
});

describe('recolour', () => {
  it('swaps letters all at once (no chaining)', () => {
    expect(recolorGrid(['ab', 'ba'], { a: 'b', b: 'c' })).toEqual(['bc', 'cb']);
  });

  it('refuses targets outside the palette', () => {
    expect(() => recolorGrid(['a'], { a: 'Z' })).toThrow();
  });

  it('is deterministic per seed and stays in the palette', () => {
    const slots = PEASANT.recolor!;
    expect(rollRecolor(slots, 7)).toEqual(rollRecolor(slots, 7));
    for (let seed = 1; seed < 40; seed++) {
      const frames = recolorSprite(PEASANT, seed);
      expect(checkSprite({ ...PEASANT, frames })).toEqual([]);
      for (const ch of frames.join('').replace(/[.,]/g, '')) expect(ch in PALETTE).toBe(true);
    }
  });

  it('produces several different villagers', () => {
    const looks = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) looks.add(recolorFrames(PEASANT.frames, PEASANT.recolor!, seed)[0].join(''));
    expect(looks.size).toBeGreaterThan(5);
  });
});
