import { TRANSPARENT } from './palette';

export type PanelStyle = 'parchment' | 'iron' | 'ironDown' | 'ironOff' | 'ironSel';

/*
 * Buttons are dark iron: 1px outline with clipped corners, slate fill, 1px
 * light-stone bevel top-left and deepest-dark bevel bottom-right. Pressed:
 * soul-green border, bevel inverted. Parchment is for panels only.
 * Flat fills, no specks or dithering.
 */
const STYLE: Record<PanelStyle, { border: string; lit: string; dark: string; body: string; inner: string }> = {
  iron: { border: 'a', lit: 'e', dark: 'A', body: 'c', inner: 'c' },
  ironDown: { border: 'w', lit: 'A', dark: 'e', body: 'b', inner: 'b' },
  ironSel: { border: 'a', lit: 'x', dark: 'A', body: 'b', inner: 'b' },
  ironOff: { border: 'a', lit: 'c', dark: 'A', body: 'b', inner: 'b' },
  parchment: { border: 'a', lit: 'U', dark: 'k', body: 'g', inner: 'u' },
};

/** Button / panel as a letter grid. */
export function panelGrid(w: number, h: number, style: PanelStyle): string[] {
  const f = STYLE[style];
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      let ch: string;
      if (corner) ch = TRANSPARENT;
      else if (edge === 0) ch = f.border;
      else if (edge === 1) ch = x === 1 || y === 1 ? (x === w - 2 || y === h - 2 ? f.body : f.lit) : f.dark;
      else ch = y < h / 2 ? f.inner : f.body;
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}
