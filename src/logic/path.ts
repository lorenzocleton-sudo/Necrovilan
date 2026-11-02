export interface Pt {
  x: number;
  y: number;
}

const DIRS: readonly Pt[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

/**
 * A* on a w x h grid, 4-directional, unit step cost, Manhattan heuristic.
 * Returns the steps from start to goal (start excluded, goal included),
 * [] if start === goal, or null if the goal is blocked or unreachable.
 * Ties are broken deterministically (insertion order), no randomness.
 */
export function findPath(
  w: number,
  h: number,
  blocked: (x: number, y: number) => boolean,
  start: Pt,
  goal: Pt,
): Pt[] | null {
  const inside = (p: Pt) => p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
  if (!inside(start) || !inside(goal) || blocked(goal.x, goal.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [];
  const id = (p: Pt) => p.y * w + p.x;
  const hFn = (p: Pt) => Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
  const g = new Map<number, number>([[id(start), 0]]);
  const from = new Map<number, number>();
  const open: { p: Pt; f: number; n: number }[] = [{ p: start, f: hFn(start), n: 0 }];
  const closed = new Set<number>();
  let counter = 1;
  while (open.length) {
    // small grids: linear scan for lowest f (then lowest h, then oldest)
    let best = 0;
    for (let i = 1; i < open.length; i++) {
      const a = open[i], b = open[best];
      if (a.f < b.f || (a.f === b.f && (hFn(a.p) < hFn(b.p) || (hFn(a.p) === hFn(b.p) && a.n < b.n)))) best = i;
    }
    const cur = open.splice(best, 1)[0].p;
    const cid = id(cur);
    if (closed.has(cid)) continue;
    if (cur.x === goal.x && cur.y === goal.y) {
      const path: Pt[] = [];
      let k: number | undefined = cid;
      while (k !== undefined && k !== id(start)) {
        path.push({ x: k % w, y: Math.floor(k / w) });
        k = from.get(k);
      }
      return path.reverse();
    }
    closed.add(cid);
    for (const d of DIRS) {
      const nb = { x: cur.x + d.x, y: cur.y + d.y };
      if (!inside(nb) || blocked(nb.x, nb.y)) continue;
      const nid = id(nb);
      const ng = (g.get(cid) ?? 0) + 1;
      if (ng < (g.get(nid) ?? Infinity)) {
        g.set(nid, ng);
        from.set(nid, cid);
        open.push({ p: nb, f: ng + hFn(nb), n: counter++ });
      }
    }
  }
  return null;
}
