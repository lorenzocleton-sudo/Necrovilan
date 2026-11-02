# Progress

## Version: 0.2 — Style kit + Art Gallery + Test Village (2026-11-02)

**PLAY LINK (artifact, update this same one every session):**
https://claude.ai/artifact/LyXXV5pthgdUzJStqMXSBX

**BACKUP LINK:**
https://raw.githack.com/lorenzocleton-sudo/Necrovilan/main/play/index.html

## What works
- Title: necromancer on a cobble/mud strip, three parchment/iron buttons
  (Begin, Gallery, Test Village), tap areas >= 44 CSS px. Keys: Enter, G, V.
- One sprite format (`SpriteDef`) for all art; validator runs over every
  sprite in Vitest; seeded recolour helper (peasant: hair, tunic, cap,
  trousers).
- 16 code-authored sprites: cobblestone A/B, grass A/B, mud A/B, stone wall,
  wall with door, terracotta roof (24x24); necromancer, peasant, town guard,
  skeleton (24x32, outlined, 3-frame idle, shadow); grave (24x32), cart
  (48x32), market stall (48x48).
- Art Gallery: Tiles / Characters / Props / Palette tabs, x4 animated,
  pages with arrows or swipe; tap a sprite for the detail view (x6 or
  largest fit, palette letters used, 24px grid + anchor toggle, Recolour
  button for the peasant); Palette page with 24 swatches + hex.
- Test Village (10x6, 1x, centred, vignette): tap a tile -> A* path shown as
  soul-green dots, necromancer walks tile by tile with a footstep tick;
  blocked tile -> red flash + thud. Long-press = name of the tile/thing.
  Arrows/WASD step. Y-sort: walk behind the cart from above, in front from
  below. Peasant, guard, skeleton idle (no AI).
- Single-file build ~1.48 MB, zero runtime network requests.
- Tests: 60 Vitest tests (16 sprite validator cases + validator negatives,
  A*: straight, around a wall, unreachable, blocked/off-map, deterministic;
  recolour, layout, test patch reachability, scale, palette, rng).
- Smoke test (`npm run smoke`): Title -> Gallery -> all tabs -> detail ->
  back -> Test Village -> walk + blocked tap; dpr-3 sizing; portrait.
  Screenshots in docs/screens/0.2-*.png.

## Known bugs / limits
- Test Village is drawn at 1x (the brief requires the whole 10x6 patch on
  one 480x270 screen), so tiles are ~32 CSS px on a phone: tappable but small.
- Web-font text is antialiased by the canvas (a few off-palette edge pixels).
- Character shadows use 50% alpha (the only blended colour).
- Not tested on a real phone; headless Chromium only (844x390 dpr 1 & 3,
  390x844 portrait). Sound not verified by ear.
- The artifact viewer warns about a "download link": unused Phaser
  internals, not the game.
- No save system yet (nothing worth saving).

## Next step
0.3 = full plague village: bigger map with a 2x scrolling camera, fog of
war, turn system (player step = 1 turn, villagers move), first save to
localStorage + save code.
