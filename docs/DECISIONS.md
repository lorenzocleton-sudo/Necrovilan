# Decisions log

Newest at the bottom. Each entry: decision, main alternative, why.

## 0.1 (2026-11-02)

1. **Phaser 4.2.1** (latest stable on npm) instead of Phaser 3.x.
   The header says "latest stable"; the API we use (scenes, sprites, canvas
   textures, tweens, anims, text) is the same. Vite 8.3, Vitest 5.1,
   TypeScript 7.0, vite-plugin-singlefile 2.3.

2. **Integer scale is measured in device pixels, not CSS pixels.**
   Alternative: whole CSS-pixel scale. On a phone (844x390 CSS, dpr 3) the
   CSS rule gives only 1x (480x270 CSS, tiny). Device-pixel rule gives 4
   physical pixels per game pixel (640x360 CSS) — still perfectly square,
   crisp pixels, much bigger. Canvas is placed on whole device pixels.
   Logic in `src/logic/scale.ts`, tested.

3. **Own scaling instead of Phaser.Scale.FIT.** `Scale.NONE` + `setZoom()`
   driven by `computeScale`, because FIT allows fractional scales.

4. **Title scene world layer drawn at 2x** (tiles, necromancer, vignette all
   `setScale(2)`), text at 1x. Alternative: 1x world, which leaves a 32px
   necromancer lost on the title. All world pixels share one size, so pixel
   density stays consistent.

5. **Vignette is a dithered (Bayer 4x4) palette texture**, not an alpha
   gradient — stays inside the locked palette.

6. **Sprites were drafted by a one-off generator script, then committed as
   literal letter grids** in `src/art/sprites.ts`. The grids are the source
   of truth; edit them directly. Outline rule is unit-tested.

7. **ZzFX is imported lazily on first tap.** The zzfx module creates its
   AudioContext at import time; importing it after the first gesture avoids
   the browser autoplay warning. ZzFX randomness parameter is always 0
   (deterministic; header requires seeded randomness).

8. **Fonts**: only the `latin-400` subsets of Jacquard 12 and Pixelify Sans
   are imported (woff2 + woff fallback, base64-inlined, ~60 KB total).

9. **Phaser banner disabled** (`banner: false`) so no console output with a URL.

10. **External-URL scan is a script** (`tools/scan-urls.mjs`, `npm run scan`).
    Phaser contains 4 strings that look like URLs but are never requested
    (banner text, a metadata string, two SVG xmlns namespaces). They are
    allowlisted with reasons; anything else fails the scan.

11. **Smoke test** (`tools/smoke.mjs`, `npm run smoke`) uses the
    pre-installed Playwright Chromium, loads `dist/index.html` over
    `file://`, checks console errors, outgoing requests, canvas non-blank,
    phone dpr-3 sizing and the portrait rotate screen.

12. **Play link = Claude Artifact; backup = raw.githack of `play/index.html`.**
    No GitHub Pages (owner must not change settings).

13. **Text antialiasing accepted for now.** Phaser renders web fonts with
    canvas antialiasing, so glyph edges have a few off-palette blend pixels.
    Alternative: bitmap fonts baked from the palette — revisit in 0.2.
