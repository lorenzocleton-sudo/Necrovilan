export interface Box {
  w: number;
  h: number;
}
export interface Placed {
  index: number;
  x: number;
  y: number;
}

/**
 * Flow-pack boxes left-to-right into rows, rows top-to-bottom into pages
 * of areaW x areaH. Each row is centred horizontally. A box bigger than the
 * area gets a page of its own. Returns pages of placed indices.
 */
export function packPages(boxes: readonly Box[], areaW: number, areaH: number, gapX: number, gapY: number): Placed[][] {
  type Row = { items: number[]; w: number; h: number };
  const rows: Row[] = [];
  let row: Row = { items: [], w: 0, h: 0 };
  boxes.forEach((b, i) => {
    const need = row.items.length ? row.w + gapX + b.w : b.w;
    if (row.items.length && need > areaW) {
      rows.push(row);
      row = { items: [], w: 0, h: 0 };
    }
    row.w = row.items.length ? row.w + gapX + b.w : b.w;
    row.h = Math.max(row.h, b.h);
    row.items.push(i);
  });
  if (row.items.length) rows.push(row);

  const pages: Placed[][] = [];
  let page: Placed[] = [];
  let y = 0;
  for (const r of rows) {
    if (page.length && y + r.h > areaH) {
      pages.push(page);
      page = [];
      y = 0;
    }
    let x = Math.floor((areaW - r.w) / 2);
    for (const i of r.items) {
      page.push({ index: i, x, y: y + (r.h - boxes[i].h) });
      x += boxes[i].w + gapX;
    }
    y += r.h + gapY;
  }
  if (page.length) pages.push(page);
  return pages;
}

/** Largest whole scale <= max at which w x h fits in areaW x areaH (min 1). */
export function fitScale(w: number, h: number, areaW: number, areaH: number, max: number): number {
  return Math.max(1, Math.min(max, Math.floor(areaW / w), Math.floor(areaH / h)));
}
