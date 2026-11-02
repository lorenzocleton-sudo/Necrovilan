# Grimshard — Style Bible

This file is law. Every sprite, tile, UI panel and sound obeys it.

## Look
"Stoneshard after the plague": muted earth tones, terracotta roofs,
cobblestone and mud; soul-green is the ONLY bright colour, holy-gold the only
other accent.

## Perspective and resolution
- Top-down 3/4 (flat ground, buildings show front wall + roof).
- Tiles 24x24, characters 24x32.
- Internal resolution 480x270, integer scaling only, nearest-neighbour,
  `pixelArt: true`, `roundPixels`.

## Light and shading
- Light from the top-left.
- 3-step shade ramp per material.
- Shadows shift toward purple, highlights toward yellow.
- 1px near-black outline on characters, items, props; none on ground.
- Living = warm colours; undead = cold (bone, grey-blue, green glow).

## Animation
- 2-4 frame idles.
- Attacks/hits via tweens (lunge, shake, white flash), not many frames.

## Gore
Small stylised pixel blood/bone bits, never graphic.

## UI
Dark iron + worn parchment panels, 1px bevel, bottom hotbar, top bars for
HP / Essence / Souls.

## Fonts
Titles: Jacquard 12. Everything else: Pixelify Sans.

## Sound
Short synthesised SFX, low drone ambience, no bright melodies.

## LOCKED PALETTE (24)
| group | colours |
|---|---|
| darks | `#120e12` `#231a22` `#3a2c34` |
| stone | `#4b4a52` `#6d6a6e` `#9a958f` `#c9c2b2` |
| earth | `#3b2a1e` `#5c4130` `#7f5d42` `#a8835c` |
| moss | `#2f3a24` `#4a5a32` `#6f7d45` |
| roof | `#5e2a22` `#8c3f2f` `#b7623f` |
| warm | `#d9a37e` `#8a2f2f` `#c49a3a` |
| bone/undead | `#e6dfc8` `#7d8a96` |
| necromancy | `#7cffb2` (soul-green) `#5a2d6e` (bruise purple) |

A new colour requires an entry in docs/DECISIONS.md.

### Letter codes (src/art/palette.ts)
`a b c` darks · `d e f g` stone · `h i j k` earth · `l m n` moss ·
`o p q` roof · `r s t` warm (skin, blood, gold) · `u v` bone, grey-blue ·
`w` soul-green · `x` bruise purple · `.` transparent.
