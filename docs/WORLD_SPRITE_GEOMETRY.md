# World sprite contact and occlusion — 2026-10-09

Implemented from source and supplied-image inspection only. No tests, builds,
type checks, browser/game launches or simulations were run. This document does
not certify appearance, traversal, saves or device performance.

## Causes found

The previous side-animation follow-through changed the player body to end at
world `y`, but left the artwork's soles at `y + 20`. That offset-only correction
was incomplete and introduced a real presentation/contact mismatch. Original
NPCs also used `y + 20` feet while sorting by `y`. The old shared character
origin subtracted 22 logical pixels even though the atlas ground padding is 2.

World props mostly used a guessed 72%-width, shallow base rectangle. Mature
trees had tiny trunk rectangles that ignored spreading roots and attached
base rocks. Buildings could admit feet through their side foundations, porch
stock and projecting lower wings. Hollow ruins were also treated as closed
rectangles. Collision, visible bounds and sorting did not share a surveyed
ground plane.

The old bridge overlay copied an entire horizontal image band, including
paving, rather than its curved foreground parapet. Its back rail remained
part of a background-only image. Finally, window emission sprites were drawn
above every actor, allowing lit building pixels to paint over a foreground
character at night.

## Implemented changes

- Character soles, physical feet and character sort depth share world `y`.
  Player/NPC contact remains 18×22 world pixels; enemy circle radii remain
  unchanged and are grounded at the same foot line. Sword/idle/walk/run
  presentation uses the shared corrected origin. Skill canvases retain their
  existing padding (so airborne poses are not newly cropped), with a -20px
  presentation offset to align their feet. Ground quest rings and slam shadows
  use the corrected foot line.
- Boot attaches exact prepared visible bounds, source rectangles and source
  fit to each frame. Compact wood/leaf frames preserve that registration.
- `worldSpriteGeometry.ts` separates visible illustration extent, solid
  ground contour and foreground sort line. Surveyed profiles cover existing
  building/capital/object/prop sheets and the new woodland, desert and winter/
  volcanic sheets. Contours include roots, rock bases, building sides, stoops,
  forge wheels, porches, stockpiles, wells, benches, signs and lamp bases.
  Canopies, roofs, banners and hanging lanterns are not whole-image colliders.
  Flowers/crops/ground water remain appropriately non-solid.
- Ruins and gate-like hollow structures use separate pillar contours, not a
  bounding rectangle across their opening. Curtain/gate fortification seams
  still use the existing surveyed defense system; no rotated-wall workaround
  or new rectangular settlement perimeter was introduced.
- `WorldSpriteSystem` is shared by authored content and chunk scenery. It
  projects those contours through the actual prepared frame, density, scale,
  origin and rotation. Small stepped ground bands provide Arcade collision
  without a per-frame pixel scan or a new physics engine. These are surveyed
  approximations, not arbitrary full-alpha walls or exact polygon physics.
- Stone bridge art is split in memory along source-space curved back/front
  parapet/post masks. The deck stays below actors; each rail has its own
  ground-depth line. Rail contact follows its source-space contour and preserves
  separate intervals of the curved shapes rather than filling the deck between
  them. The existing bridge ground anchor and water/crossing terrain rules stay
  in place. Arched bridge movement is not a simulated elevation system.
- Night window/fire emission pixels use the owner's depth. Ambient glows still
  illuminate the environment, but foreground actor pixels are no longer
  overwritten by an unconditional topmost copy of the building's windows.
- Ground bodies and bridge layers are owned by their source sprite and removed
  on chunk/content unloading. Interaction line-of-sight excludes all shapes
  belonging to its target, retaining access to shrines/quests/loot. NPC/enemy
  collision uses the same static ground group. Swept player-foot checks use
  Phaser's static spatial index to stop fast movement tunneling through a thin
  contour; existing land/fortification checks remain.

## Scope and follow-up limits

Inspected all eleven world sprite sheets (including the new regional sheets)
and the relevant rendering, collision, character, lighting and bridge code.
Source PNGs, source dimensions, character art, terrain, town/quest/boss IDs,
trust state, shrine unlocks and save format were not rewritten. Existing
safe-spawn/arrival handling can relocate a saved player out of a newly corrected
foundation without resetting progression. Concurrent character/control/world
work in the dirty tree was preserved.

Profiles are calibrated for the currently supplied artwork. A replacement with
a different ground-plane composition requires an updated contour even though
alpha trimming automatically updates its visible bounds. The stepped contours
can be refined further after actual runtime visual review. Bridge-bank entry,
the curved deck lane, narrow urban paths, NPC routines, interactions, night
occlusion, old-save contact recovery and additional collider cost on mobile
remain unverified until the user requests execution. Unused bridge variants
retain their ground/floor classification; the detailed two-rail presentation
is specifically implemented for the stone-arch bridge currently used by roads.
