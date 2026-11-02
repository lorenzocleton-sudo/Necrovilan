import { describe, expect, it } from 'vitest';
import { fitScale, packPages } from './layout';

describe('packPages', () => {
  it('fills rows then pages', () => {
    const boxes = Array.from({ length: 9 }, () => ({ w: 96, h: 110 }));
    const pages = packPages(boxes, 416, 230, 8, 6);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(8);
    expect(pages[1]).toHaveLength(1);
    expect(pages[0][4].y).toBe(116);
  });

  it('puts an oversized box on its own page', () => {
    const pages = packPages([{ w: 96, h: 140 }, { w: 192, h: 140 }, { w: 192, h: 206 }], 416, 230, 8, 6);
    expect(pages.map((p) => p.map((q) => q.index))).toEqual([[0, 1], [2]]);
  });
});

describe('fitScale', () => {
  it('caps at max and fits the area', () => {
    expect(fitScale(24, 32, 300, 220, 6)).toBe(6);
    expect(fitScale(48, 48, 300, 220, 6)).toBe(4);
    expect(fitScale(500, 500, 300, 220, 6)).toBe(1);
  });
});
