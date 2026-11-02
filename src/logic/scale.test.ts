import { describe, expect, it } from 'vitest';
import { computeScale, isPortrait } from './scale';

describe('computeScale', () => {
  it('uses the largest whole-number device-pixel scale', () => {
    // iPhone 12-ish landscape: 844x390 CSS, dpr 3 -> 2532x1170 device px
    const s = computeScale(844, 390, 3, 480, 270);
    expect(s.deviceScale).toBe(4); // min(5.27, 4.33) -> 4
    expect(s.cssScale).toBeCloseTo(4 / 3);
    expect(Number.isInteger(s.deviceScale)).toBe(true);
  });

  it('desktop 1920x1080 at dpr 1 gives exactly 4x with no letterbox', () => {
    const s = computeScale(1920, 1080, 1, 480, 270);
    expect(s).toEqual({ deviceScale: 4, cssScale: 4, left: 0, top: 0 });
  });

  it('centres the letterboxed canvas on whole device pixels', () => {
    const s = computeScale(1000, 600, 1, 480, 270);
    expect(s.deviceScale).toBe(2);
    expect(s.left).toBe(20);
    expect(s.top).toBe(30);
  });

  it('never returns zero for tiny viewports', () => {
    const s = computeScale(200, 100, 1, 480, 270);
    expect(s.deviceScale).toBeGreaterThan(0);
    expect(s.deviceScale).toBeLessThan(1);
  });

  it('treats bad dpr as 1', () => {
    expect(computeScale(960, 540, 0, 480, 270).deviceScale).toBe(2);
  });
});

describe('isPortrait', () => {
  it('detects portrait', () => {
    expect(isPortrait(390, 844)).toBe(true);
    expect(isPortrait(844, 390)).toBe(false);
  });
});
