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

## 0.2 (2026-11-02)

14. **One `SpriteDef` format** (src/art/spriteDef.ts) replaces bare grids.
    0.1's palette letters, `gridToRgba`, `addGridSheet` are kept and reused;
    `NECROMANCER_IDLE` became `NECROMANCER.frames` (same pixels). Alternative:
    separate JSON/PNG-like files — rejected, TS gives type checks for free.

15. **Validator lives in `src/logic/spriteCheck.ts`** and runs over
    `ALL_SPRITES` in Vitest (one test per sprite), so `npm run test` fails on a
    broken sprite. It also enforces the outline and tile-opacity rules.

16. **Tile variants are separate sprites** (`tile-cobble-a` / `-b`, etc.), not a
    `variants` field. Simpler for Boot/Gallery. Variants share the border ring
    (cobble: border stones keep their tone; grass/mud: same noise field, only
    interior tufts/pebbles differ), so A/B tile with each other. Map picks A or
    B with a seeded hash (`variantAt`, ~1/3 B).

17. **Sprites drafted by a scratch generator, committed as literal grids**
    (same as 0.1 decision 6): material maps -> auto top-left shading ->
    auto 4-neighbour outline. The grids are the source of truth.

18. **Extra tile "Wall with door"** — the house front needs a door; it is a
    wall tile with an arched plank door. 16 sprites total (9 tiles incl.
    variants and door, 4 characters, 3 props).

19. **Recolour = simultaneous letter swap per slot**, seed -> one option per
    slot (`rollRecolor`). Targets must be palette letters (throws otherwise).
    Peasant skin shade uses roof `q` so it never collides with clothes ramps.

20. **Character shadow = 18x6 `a` ellipse at 50% alpha.** The only
    alpha-blended colour in the world (requested); everything else stays
    palette-pure.

21. **Test Village is drawn at 1x** (240x144 patch centred in 480x270).
    The brief requires the whole 10x6 patch to fit; 2x would be 288px tall
    (> 270) and fractional zoom is banned. 0.3 brings a scrolling camera at 2x.

22. **Y-sort = depth by the bottom pixel row** (`10 + feetY`) for props and
    actors; the moving player re-sorts every frame. Walls/roof are ground
    tiles (depth 0) because nothing can stand north of them in this patch.
    Props are anchored bottom-left; overhang (stall awning) is not blocking.

23. **Buttons: visual 30-34 game px, tap area padded to >= 44 CSS px** using
    the live CSS scale (`registry.cssScale`). Alternative: 44 game px tall
    buttons — too big at 4x on desktop and on a 270px-high screen.

24. **Gallery detail scale = largest whole scale <= 6 that fits** (`fitScale`).
    The 48x48 stall shows at x4 (x6 = 288px > screen height). The grid overlay
    draws 24px tile lines plus the anchor point (gold dot).

25. **A\*: 4-directional, Manhattan, deterministic tie-break** (lowest f, then
    lowest h, then oldest). Linear open-list scan is fine for small maps;
    swap in a binary heap when maps grow past ~50x50.

26. **Tap vs long-press vs swipe**: tap = release within 12px of the press;
    long-press (450 ms) on the village shows the tile's name (inspect);
    swipe > 40px pages the gallery. A tap while walking re-plans after the
    current step lands.

27. **`window.__PHASER_GAME__` / `window.__GRIMSHARD__`** expose read-only
    state for the headless smoke test (scene list, player tile).
