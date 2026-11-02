import { describe, expect, it } from 'vitest';
import { findPath, type Pt } from './path';

/** '#' = wall, anything else free */
function grid(rows: string[]) {
  return {
    w: rows[0].length,
    h: rows.length,
    blocked: (x: number, y: number) => rows[y][x] === '#',
  };
}
const adjacent = (a: Pt, b: Pt) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

describe('A* findPath', () => {
  it('walks a straight line', () => {
    const m = grid(['.....']);
    const p = findPath(m.w, m.h, m.blocked, { x: 0, y: 0 }, { x: 4, y: 0 });
    expect(p).toEqual([1, 2, 3, 4].map((x) => ({ x, y: 0 })));
  });

  it('goes around a wall with a shortest path', () => {
    const m = grid([
      '.....',
      '.###.',
      '..#..',
      '.....',
    ]);
    const start = { x: 1, y: 2 };
    const goal = { x: 3, y: 2 };
    const p = findPath(m.w, m.h, m.blocked, start, goal)!;
    expect(p).not.toBeNull();
    expect(p).toHaveLength(4); // down, right, right, up
    expect(p[p.length - 1]).toEqual(goal);
    [start, ...p].forEach((q, i, arr) => {
      expect(m.blocked(q.x, q.y)).toBe(false);
      if (i) expect(adjacent(arr[i - 1], q)).toBe(true);
    });
  });

  it('returns null for an unreachable target', () => {
    const m = grid([
      '..#..',
      '..#..',
      '..#..',
    ]);
    expect(findPath(m.w, m.h, m.blocked, { x: 0, y: 1 }, { x: 4, y: 1 })).toBeNull();
  });

  it('returns null for a blocked or off-map goal, [] for the start tile', () => {
    const m = grid(['.#.']);
    expect(findPath(m.w, m.h, m.blocked, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNull();
    expect(findPath(m.w, m.h, m.blocked, { x: 0, y: 0 }, { x: 5, y: 0 })).toBeNull();
    expect(findPath(m.w, m.h, m.blocked, { x: 0, y: 0 }, { x: 0, y: 0 })).toEqual([]);
  });

  it('is deterministic', () => {
    const m = grid(['....', '....', '....']);
    const a = findPath(m.w, m.h, m.blocked, { x: 0, y: 0 }, { x: 3, y: 2 });
    const b = findPath(m.w, m.h, m.blocked, { x: 0, y: 0 }, { x: 3, y: 2 });
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
  });
});
