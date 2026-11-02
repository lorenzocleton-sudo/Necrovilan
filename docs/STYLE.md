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
- 4-5 step ramp per material: deep, dark, mid, light, highlight.
- Shadows shift toward purple, highlights toward yellow.
- Value contrast between grounds: mud darkest, grass mid, cobble lightest
  (unit-tested).
- 1px dark outline on characters, items, props; none on ground.
- Selective outline on characters: on the lit top-left side the outline is
  the darkest shade of the wrapped material (`b d H L O v`), black elsewhere.
  Applied automatically by `withLitOutline` (src/art/outline.ts).
- NO checkerboard or ordered dithering, anywhere. Texture = clustered pixel
  clumps (tufts, pebbles, puddles, stone blocks). The validator fails any
  sprite with a 2x2 checkerboard repeated more than 3 times in a row.
- Soft drop shadow (deepest dark ~45%, offset down-right) under every
  character and prop; contact-shadow rows where walls meet the ground; the
  roof overhang casts a band on the wall below it.
- Light effects are screen-resolution, not pixel art: soul-green additive
  glow from the necromancer's staff (gentle pulse), smooth dark vignette,
  faint cool-purple "plague dusk" multiply grade over the world.
  Holy-gold light is reserved for later.
- Grass meets mud/cobble through auto-tiled edge tiles (irregular tufts,
  lit rim, shadow on the ground below) — never a hard square seam.
- Living = warm colours; undead = cold (bone, grey-blue, green glow).

## Animation
- 2-4 frame idles.
- Attacks/hits via tweens (lunge, shake, white flash), not many frames.

## Gore
Small stylised pixel blood/bone bits, never graphic.

## UI
- All text is rasterised at the screen's real resolution (never small pixel
  text scaled up): Pixelify Sans, at least 16 CSS px, bone on dark, thin
  deepest-dark stroke when over the world.
- Buttons: dark iron — slate fill, 1px light-stone bevel top-left,
  deepest-dark bevel bottom-right, bright-bone label; soul-green border while
  pressed; disabled = dimmed + small "soon" tag. Parchment only for panels.
- Later: bottom hotbar, top bars for HP / Essence / Souls.

## Fonts
Titles: Jacquard 12. Everything else: Pixelify Sans.

## Sound
Short synthesised SFX, low drone ambience, no bright melodies.

## LOCKED PALETTE (32)
| group | colours (deep -> highlight) |
|---|---|
| darks | `A #0a080b` `a #120e12` `b #231a22` `c #3a2c34` |
| stone | `d #4b4a52` `e #6d6a6e` `f #9a958f` `g #c9c2b2` |
| earth | `H #2a1f17` `h #3b2a1e` `i #5c4130` `j #7f5d42` `k #a8835c` `K #c8a274` |
| moss | `L #1f2818` `l #2f3a24` `m #4a5a32` `n #6f7d45` `N #8f9c58` |
| roof | `O #3d1a16` `o #5e2a22` `p #8c3f2f` `q #b7623f` `Q #d98a5a` |
| warm | `r #d9a37e` (skin) `s #8a2f2f` (blood) `t #c49a3a` (gold) |
| bone/undead | `v #7d8a96` `u #e6dfc8` `U #f2ecd8` |
| necromancy | `w #7cffb2` (soul-green) `x #5a2d6e` (bruise purple) |

A new colour requires an entry in docs/DECISIONS.md.

### Letter codes (src/art/palette.ts)
Lowercase as before; the 8 colours added in 0.2.1 are UPPERCASE, and the
uppercase of a letter is the extra end of that ramp: `A` deepest dark,
`H` deep earth, `K` earth highlight, `L` deep moss, `N` moss highlight,
`O` deep roof, `Q` roof highlight, `U` bright bone. `.` = transparent.
Robe ramp (necromancer): `A b c x`.

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
- Only palette letters and `.` (transparent).
- Tiles: 24x24 and fully opaque (no `.`). Ground tiles never use `a`/`A`.
- No checkerboard dithering (2x2 alternating pattern > 3 in a row).
- Characters: 24x32. Characters and props: every opaque pixel touching
  transparency on the right/bottom is the outline `a`/`A` (or an `edgeGlow`
  letter); on the lit top/left side it may also be a deep shade `b d H L O v`.
- Recolour options are palette letters, same length as `from`, and slots
  never share a source letter.

### Rules you enforce by eye (check in the Gallery, detail view, grid on)
- Light from the top-left: lightest ramp step on top/left edges, darkest on
  bottom/right. Use the full ramp (e.g. earth `K k j i h H`, roof
  `Q q p o O`, moss `N n m l L`, skin `r q`).
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
