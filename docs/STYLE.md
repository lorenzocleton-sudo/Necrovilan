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

## How to make a sprite

Every sprite is a `SpriteDef` (src/art/spriteDef.ts) written as literal
letter grids in `src/art/sprites/{tiles,characters,props}.ts`, then added to
`ALL_SPRITES` in `src/art/sprites.ts`. That is all: Boot builds the texture
and idle animation, the Gallery shows it, and the Vitest validator
(`src/logic/sprites.test.ts` -> `checkSprite`) fails the build if it breaks
a rule.

### Format
```ts
export const LANTERN: SpriteDef = {
  name: 'Lantern',          // gallery label
  key: 'lantern',           // unique texture key
  category: 'prop',         // 'tile' | 'character' | 'prop'
  w: 24, h: 32,             // every row of every frame must match
  frameMs: 300,             // time per frame
  sequence: [0, 1, 0, 2],   // optional playback order
  anchor: { x: 0, y: 1 },   // props bottom-left; characters { x: 0.5, y: 1 }
  footprint: { w: 1, h: 1 },// props: tiles blocked, from the bottom-left
  edgeGlow: 'w',            // optional: letters allowed on the silhouette edge
  shadow: false,            // characters: true (ellipse under the feet)
  recolor: [...],           // optional per-instance palette swaps
  frames: [[ /* h strings of w letters */ ]],
};
```

### Rules the validator enforces
- Each frame has exactly `h` rows of exactly `w` letters; all frames same size.
- Only palette letters `a`..`x` and `.` (transparent).
- Tiles: 24x24 and fully opaque (no `.`). Ground tiles never use `a`.
- Characters: 24x32. Characters and props: every opaque pixel touching
  transparency is the outline `a` (or an `edgeGlow` letter).
- Recolour options are palette letters, same length as `from`, and slots
  never share a source letter.

### Rules you enforce by eye (check in the Gallery, detail view, grid on)
- Light from the top-left: lightest ramp step on top/left edges, darkest on
  bottom/right. 3 steps per material (e.g. stone `g f e`, earth `k j i`,
  roof `q p o`, skin `r r q`).
- Characters stand at bottom-centre of their tile: feet on rows 29-30,
  outline on row 31, body roughly columns 5-18.
- 3-frame idle: 0 rest, 1 upper body 1px down (breathe), 2 one small
  detail (blink, glint, glow). Played 0,1,0,2.
- Ground tiles must tile seamlessly; variants share the border ring so A
  and B also tile with each other. Keep structured details (cracks,
  pebbles, tufts) at least 1px inside the edge.
- Living = warm, undead = cold. Soul-green `w` only for necromancy.
- Recolour: give each slot its own source letters (peasant: hair `ih`,
  tunic `tkj`, cap `po`, trousers `ed`) so swaps never bleed.

### Example (12x8 headstone sketch, outlined, light top-left)
```
'...aaaaaa...',
'..agggggfa..',
'.aggfddffea.',
'.agfddddfea.',
'.agffddffea.',
'.agfffffeea.',
'.afeeeeeeda.',
'..aaaaaaaa..',
```
