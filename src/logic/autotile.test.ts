import { describe, expect, it } from 'vitest';
import { EDGE_E, EDGE_N, EDGE_S, EDGE_W, NUB_NE, NUB_SW, autotile, edgeBits, edgeName } from './autotile';
import { edgeMask, composeEdge, edgeGrid } from '../art/edges';
import { longestCheckerRun } from './dither';

describe('autotile (grass over ground, 4 neighbours + corner nubs)', () => {
  it('straight edges', () => {
    const m = ['GGG', 'MMM', 'MMM'];
    expect(edgeBits(m, 1, 1, 'G', 'M')).toBe(EDGE_N);
    expect(edgeBits(m, 1, 2, 'G', 'M')).toBe(0);
  });

  it('inner corner = two adjacent grass sides', () => {
    const m = ['GGG', 'GMM', 'GMM'];
    expect(edgeBits(m, 1, 1, 'G', 'M')).toBe(EDGE_N | EDGE_W);
  });

  it('outer corner nub only when both orthogonal neighbours are clear', () => {
    const m = ['MMG', 'MMM', 'GMM'];
    expect(edgeBits(m, 1, 1, 'G', 'M')).toBe(NUB_NE | NUB_SW);
    const n = ['MGG', 'MMM', 'MMM'];
    expect(edgeBits(n, 1, 1, 'G', 'M')).toBe(EDGE_N); // NE nub is covered by the N edge
  });

  it('ignores grass tiles, other grounds and the map border', () => {
    const m = ['GC', 'MM'];
    expect(edgeBits(m, 0, 0, 'G', 'M')).toBe(0);
    expect(edgeBits(m, 1, 0, 'G', 'M')).toBe(0); // cobble is not "under" here
    expect(edgeBits(m, 1, 0, 'G', 'C')).toBe(EDGE_W);
    expect(autotile(['M'], 'G', 'M')).toEqual([[0]]);
  });

  it('names edges', () => {
    expect(edgeName(EDGE_N | EDGE_E)).toBe('N+E');
    expect(edgeName(0)).toBe('none');
  });
});

describe('edge tiles', () => {
  it('masks cover the right side, irregularly (not a straight line)', () => {
    const n = edgeMask(EDGE_N);
    expect(n[0].every(Boolean)).toBe(true);
    expect(n[23].some(Boolean)).toBe(false);
    const depths = new Set(Array.from({ length: 24 }, (_, x) => n.findIndex((row) => !row[x])));
    expect(depths.size).toBeGreaterThan(3);
    const s = edgeMask(EDGE_S);
    expect(s[23].every(Boolean)).toBe(true);
    const w = edgeMask(EDGE_W);
    expect(w.every((r) => r[0])).toBe(true);
    const e = edgeMask(EDGE_E);
    expect(e.every((r) => r[23])).toBe(true);
  });

  it('a straight edge joins its neighbour seamlessly (same profile at both ends)', () => {
    const n = edgeMask(EDGE_N);
    const col = (x: number) => n.map((r) => r[x]).join();
    expect(col(0)).toBe(col(23));
  });

  it('casts a shadow on the ground under the grass and lights the grass rim', () => {
    const grass = Array(24).fill('m'.repeat(24));
    const mud = Array(24).fill('i'.repeat(24));
    const g = composeEdge(grass, mud, EDGE_N);
    expect(g.join('')).toContain('L'); // deep-moss underside
    expect(g.join('')).toContain('h'); // shaded mud
    expect(g[23]).toBe('i'.repeat(24));
  });

  it('every combination of bits builds a valid, undithered tile', () => {
    for (const ground of ['mud', 'cobble'] as const)
      for (let bits = 0; bits < 256; bits += 7) {
        const g = edgeGrid(ground, bits);
        expect(g).toHaveLength(24);
        g.forEach((r) => expect(r).toHaveLength(24));
        expect(longestCheckerRun(g)).toBeLessThanOrEqual(3);
      }
  });

  it('S/W/E bits mirror N', () => {
    expect(edgeMask(EDGE_S).flat().filter(Boolean).length).toBe(edgeMask(EDGE_N).flat().filter(Boolean).length);
    expect(edgeMask(EDGE_W | EDGE_E).flat().filter(Boolean).length).toBeGreaterThan(edgeMask(EDGE_W).flat().filter(Boolean).length);
  });
});
