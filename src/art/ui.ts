import { TRANSPARENT } from './palette';

export type PanelStyle = 'parchment' | 'parchmentDown' | 'iron' | 'ironDown';

const FILL: Record<PanelStyle, { body: string; lit: string; dim: string; speck: string }> = {
  parchment: { body: 'g', lit: 'u', dim: 'k', speck: 'f' },
  parchmentDown: { body: 'k', lit: 'j', dim: 'g', speck: 'j' },
  iron: { body: 'c', lit: 'e', dim: 'b', speck: 'b' },
  ironDown: { body: 'b', lit: 'a', dim: 'c', speck: 'a' },
};

/**
 * Button / panel as a letter grid: 1px ink outline with clipped corners,
 * 2px iron frame (lit top-left, dark bottom-right, rivets), worn parchment
 * or dark iron inside with a 1px bevel. Pressed styles invert the bevel.
 */
export function panelGrid(w: number, h: number, style: PanelStyle): string[] {
  const f = FILL[style];
  const down = style.endsWith('Down');
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      let ch: string;
      if (corner) ch = TRANSPARENT;
      else if (edge === 0) ch = 'a';
      else if (edge === 1) ch = x === 1 || y === 1 ? (down ? 'd' : 'f') : down ? 'f' : 'd';
      else if (edge === 2) ch = 'e';
      else if (edge === 3) ch = x === 3 || y === 3 ? (down ? f.dim : f.lit) : down ? f.lit : f.dim;
      else ch = (x * 7 + y * 13) % 23 === 0 ? f.speck : f.body;
      if (edge === 2 && (x === 2 || x === w - 3) && (y === 2 || y === h - 3)) ch = 'g'; // rivets
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}
