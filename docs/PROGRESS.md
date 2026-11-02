# Progress

## Version: 0.2.1 — Style deepening (2026-11-02)

**PLAY LINK (artifact, update this same one every session):**
https://claude.ai/artifact/LyXXV5pthgdUzJStqMXSBX

**BACKUP LINK:**
https://raw.githack.com/lorenzocleton-sudo/Necrovilan/main/play/index.html
(main and branch `ccr-e912be30-f76qvv` both carry 0.2.1)

## What works
- Rendering: canvas at the real device-pixel size, world zoomed by a whole
  number (crisp pixels), all text rasterised at screen resolution, >= 16 CSS
  px, Pixelify Sans; letterbox #0a080b. Tested 1920x1200, 2400x1080, 844x390.
- Palette 32 (8 new colours, 4-5 step ramps per material). No dithering
  anywhere; the validator fails any checkerboard run > 3.
- Redrawn: grass (tufts), mud (darker; puddles, pebbles, ruts), roof
  (overlapping rows), wall, door; new house (3x3 prop: ridge, chimney,
  overhang + shadow band, door, window, sign) and well; necromancer (hood
  rim light, shadowed face, glowing eyes, 4-shade robe, bone staff with
  soul-green tip); grave/cart/stall re-ramped; peasant/guard/skeleton on the
  new palette with the selective (lit-side) outline.
- Grass edges over mud and cobble: 12 canonical tiles each (straight, inner,
  outer corners) + any combination on demand, auto-picked by
  `src/logic/autotile.ts`.
- Light/depth: soft drop shadows under all characters and props, contact
  shadow rows, pulsing soul-green staff light, smooth vignette, plague-dusk
  grade.
- Title: big glowing GRIMSHARD, dark-iron buttons, "Begin" disabled with a
  "soon" tag. Gallery: Tiles / Edges / Characters / Props / Palette (32).
- Test Village 20x11 (fills the screen): square, roads, two houses, stall,
  cart, well, three graves, NPCs; tap-to-walk A*, long-press inspect, keys.
- Tests: 146 Vitest (validator + dither per sprite, palette 32, autotile 10,
  A* 5, scale incl. tablet/phone cases, outline, layout, recolour).
  Smoke: 20/20 checks, 0 console errors, 0 external requests.

## Known bugs / limits
- Not tested on a real device; headless Chromium only. Sound not checked by ear.
- Rotating or resizing so the integer scale changes restarts the current
  scene (the village resets the player position).
- On dpr-1 phones (cssScale 1) the 16 CSS px floor makes UI text larger and
  the gallery tabs tight.
- GRIMSHARD in Jacquard 12 blackletter capitals is stylised; readable at
  tablet size, tighter on a small phone.
- Grave/cart/stall were re-ramped automatically, not redrawn from scratch.
- Artifact viewer warns about a "download link": unused Phaser internals.
- No save system yet.

## Next step
0.3 = plague village: larger map with a 2x scrolling camera, fog of war,
turn system, first save to localStorage + save code.
