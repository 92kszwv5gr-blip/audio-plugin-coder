# Materials Recipes v1 (2026-10-22)

All textures are generated **once at load** into offscreen canvases at 2× stage resolution (`S = 2`) from a seeded `mulberry32` PRNG. Nothing is a photo. Code: `motion/velloway-m84/index.html` → `aluminium()`, `walnut()`, `anodized()`, `screw()`, `knobSprites()`.

## Brushed aluminium (#C9CCCF)
- Per row: `v = 0.026·rowRand + 0.024·vn1(x/240 + off) + 0.012·vn1(x/30 + off·1.7)`, clamped to **±6%**. Rows are independent, so streaks run horizontally.
- Specular band: `+0.075·exp(−((y/H − 0.28)/0.15)²)`, plus a lamp falloff of `−0.07·y/H` and `−0.05·nx²`. These are baked in, so the light never moves.
- Cheap version to avoid: a vertical grey `linearGradient`. Without per-row noise it reads as plastic.

## Walnut (#5A3420 → grain #3B2113, chamfer #8A5634)
- Grain coordinate `s = (x + 11·fbm2(x·0.028, y·0.0065) + 2.4·vn2(x·0.16, y·0.045)) / 4.6`. The noise warp makes the lines wander like real figure.
- Line mask `pow(0.5 + 0.5·sin(2πs), 7)`, figure `fbm2` squared, sparse pores from a hash > 0.985.
- Chamfer: a 10 px stroke clipped to the cheek, so 5 px shows, with a lit-from-above gradient and a 1 px dark inner line.

## Black anodized (#1B1C1F)
- ±2.5% per-pixel noise and a −6% vertical falloff. A top seam is drawn as a dark 2 px line plus a 1 px highlight.

## Slotted screws
- Radial gradient #EEF0F2 → #7C8085, highlight offset to the top-left (the lamp side), slot at a seeded angle.

## Knobs (132 / 92 / 72 px)
Three sprites per size:
1. **Knurl** (rotates): a #2B2C2F ring with ridges every ~5.2 px of circumference, each one a light rect next to a dark groove.
2. **Light** (fixed): a ring-shaped linear gradient, white 34% at the top to black 50% at the bottom, plus a top arc highlight.
3. **Cap** (fixed): a matte radial gradient plus a **conic** sheen (peaks at 45° and 225°, alpha ≤ 0.15) and a rim gradient.

The indicator is a vector line drawn every frame, rotated with the knurl. Ticks: 11 over 300° (−150° to +150°), with the end and centre ticks longer.

## Lighting rules
- One lamp, above and slightly in front. Every highlight, shadow and glass reflection is placed in world space and never follows a control.
- `shadowBlur` is in device pixels: multiply it by the current pixel scale `G` every frame.

## History
- v1 (2026-10-22): recipes extracted from the M-84 reference build.
