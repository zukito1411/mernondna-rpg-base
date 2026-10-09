# Darkav ashfall, burnt ecology and Cinderpeak

Source implementation, 2026-10-09. No tests, builds, type checks, game/browser
launches, simulations or device checks were run.

## Atmosphere and existing-asset dressing

Darkav permanently uses `ash` weather rather than alternating dust/wind. Ash is
visible on entry instead of waiting for the six-minute weather period. Three
depth bands use reusable, softly shaded flake bitmaps with different fall
speeds, rotation, lateral drift, camera parallax and viewport-edge fades.
Flakes shift to a distinct ember-red palette at night, with sparse brighter red
embers rising against them. A restrained red-brown atmospheric haze complements
the existing red basalt, not a red screen wash.
Occasional low-intensity camera tremors signal volcanic activity while the
player explores Darkav. Tremors are spaced apart, pause with blocked gameplay,
and stop outside the region.
The overlay retains its CSS-sized working buffer and throttled uploads. Normal
pause/focus behavior and reduced-motion preferences are respected.

`darkav_props` derives four reusable frames from existing artwork at boot:
bare winter tree, fallen woodland log, stump and ruined building arch. Snow is
removed from the tree; all remaining wood/stone receives burnt red-charcoal
tones, including neutralized green growth. Original sheets and other regions
remain unchanged. Dead trees do not receive leaf sway. Some admitted deadwood
compositions get the existing campfire sprite at the base, with existing night
light registration. Trees, logs and rocks use normal road/settlement/lair
clearance fitting, bounded chunk counts and owner-cleaned collision geometry.
The ruin retains separate pillar contact rather than a solid door-sized box.

Added discoverable Ashwood Watch, Burnt Chainworks and Cinder Pilgrims' Rest,
with existing asset-based ruin/deadwood/brazier dressing. Their discovery flags
use the existing persistent ledger. These are exploration sites, not new
dungeons, interiors or complete questlines.

## Cinderpeak volcano

Saved asset: `public/assets/sprites/darkav_volcano.png` (1254x1254 transparent
PNG). Generated using the built-in image-generation tool and imagegen skill;
the existing asset library had lava props but no standalone mountain sprite.
The source generated image remains in the Codex generated-images directory.

The mountain stands at Blackspire + (6500, -6500), the head of the existing
lava flow, north of the dragon's lair. Its broad visible silhouette is about
3200 world units. Crater and lower-flow night lights use the existing lighting
system. The mountain uses illustrated shading rather than the generic flat
prop shadow. Its broad rock contour has explicit physical contact; smoke and
transparent corners are not collider rectangles. This is a non-traversable
volcanic landmark, not a walkable summit/interior or simulated eruption system.

An optional bounded `streamRadiusChunks` keeps this oversized authored actor
active before its base chunk enters the standard neighborhood. This does not
increase terrain streaming radius or change ordinary actor lifetime. Placement
is separate from Blackspire, the lair's fighting deck and its western approach.

### Final generation prompt

> Use case: stylized-concept. Asset type: one transparent environment sprite for
> the existing Mernodna top-down 2D RPG. Generate a single large active volcanic
> mountain, full silhouette entirely visible with transparent margins.
> Three-quarter overhead view matching detailed hand-painted pixel-art overworld
> sprites, crisp clustered rock textures and readable silhouette, not
> photorealistic, not low-poly, not vector. Broad irregular black basalt mountain
> with burnt brick-red slopes, bright red-orange molten crater near the upper
> center and natural flowing lava down its slopes, dark ash and a small restrained
> smoke plume above the summit. Mountain occupies most of a square image; broad
> base at bottom center for foot/depth registration. Cool external upper-left
> daylight plus warm internal molten highlights. No people, trees, buildings,
> UI, text, sky, horizon, rectangular terrain backdrop or shadow rectangle.
> Genuine transparent alpha background, no checkerboard baked in. This is a new
> standalone volcano sprite, not a whole scene.

## Remaining verification

Generated art was visually inspected; dimensions/alpha were read as asset
metadata. Runtime snow removal, appearance of burnt props, particle density,
night illumination, mountain streaming/contours, approach navigation, saves and
mobile performance remain unverified. No APK or deployed web bundle was rebuilt.
