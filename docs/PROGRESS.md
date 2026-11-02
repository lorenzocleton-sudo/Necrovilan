# Progress

## Version: 0.1 — Foundation (2026-11-02)

**PLAY LINK (artifact, update this same one every session):**
https://claude.ai/artifact/LyXXV5pthgdUzJStqMXSBX

**BACKUP LINK:**
https://raw.githack.com/lorenzocleton-sudo/Necrovilan/main/play/index.html

## What works
- Single-file build: `dist/index.html` (~1.44 MB), copied to `play/index.html`.
- Zero runtime network requests (scan script + browser request log).
- Title scene: cobblestone/mud ground strip, dithered vignette,
  "GRIMSHARD" in Jacquard 12 (bone, soul-green shadow), subtitle in
  Pixelify Sans, 3-frame idling necromancer, pulsing "Tap to begin",
  v0.1 corner text.
- Tap / click / Enter / Space: ZzFX "soul" sound, soul-green motes rise from
  the staff, text becomes "Soon...".
- Audio unlocks on first gesture.
- Portrait shows "Rotate your phone" with a pixel phone icon that turns.
- Integer scaling in device pixels, letterboxed in #120e12, handles resize
  and rotation.
- Tests: 15 Vitest tests (scale maths, palette = 24 colours, sprite sizes,
  outline rule, vignette, RNG).

## Known bugs / limits
- Web-font text is antialiased by the canvas, so glyph edges contain a few
  off-palette blend pixels.
- No save system yet (nothing to save); localStorage + save codes come with
  the first game state.
- Not tested on a real phone; tested in headless Chromium at 844x390
  (dpr 1 and dpr 3) and 390x844 portrait.
- The artifact viewer reports a "download link" warning: it comes from
  unused Phaser internals, not from the game.

## Next step
0.2 = style kit + Art Gallery scene (palette swatches, tile set, UI panel
kit, character sheet viewer).
