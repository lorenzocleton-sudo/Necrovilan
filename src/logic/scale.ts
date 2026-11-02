export interface ScaleResult {
  /** Whole number of device pixels per game pixel. */
  deviceScale: number;
  /** CSS pixels per game pixel (deviceScale / dpr). */
  cssScale: number;
  /** Canvas position in CSS px, snapped to whole device pixels. */
  left: number;
  top: number;
}

/**
 * Fit a baseW x baseH game into a viewport using the largest WHOLE-NUMBER
 * scale measured in device pixels, so every game pixel is an exact square
 * of physical pixels (crisp nearest-neighbour). The rest is letterbox.
 */
export function computeScale(
  viewW: number,
  viewH: number,
  dpr: number,
  baseW: number,
  baseH: number,
): ScaleResult {
  const d = dpr > 0 && Number.isFinite(dpr) ? dpr : 1;
  const devW = Math.floor(viewW * d);
  const devH = Math.floor(viewH * d);
  const fit = Math.min(devW / baseW, devH / baseH);
  // Never smaller than 1 device px per game px; if even that does not fit
  // (absurdly tiny window) fall back to the exact fit.
  const deviceScale = fit >= 1 ? Math.floor(fit) : Math.max(fit, 0.01);
  const cssScale = deviceScale / d;
  const left = Math.max(0, Math.floor((devW - baseW * deviceScale) / 2)) / d;
  const top = Math.max(0, Math.floor((devH - baseH * deviceScale) / 2)) / d;
  return { deviceScale, cssScale, left, top };
}

export function isPortrait(viewW: number, viewH: number): boolean {
  return viewH > viewW;
}
