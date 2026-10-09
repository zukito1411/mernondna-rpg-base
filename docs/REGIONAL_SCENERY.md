# Regional scenery and atmosphere — 2026-10-09

This is an implementation pass in the existing continuous Phaser world, not a
replacement map/game or a claim that the entire RPG is finished. No tests,
type checks, builds, game/browser launches, simulations or benchmarks were run.
Source and supplied-image inspection only; visual appearance, admitted placement
counts, navigation, saves and device performance remain unverified.

## Reference and asset inspection

Inspected `public/assets/reference/mernondna-world-map.jpg`, every supplied lore
plate, every PNG in `public/assets/sprites/`, and `tiles/terrain.png`. The atlas
guides the regional character: fertile western Trandum, northern Narenthil
woodlands, the central/eastern Nardorous ridge, southern Rindass steppe,
Druganwoods river-forest country and Cibar grain land, southwest Portquill,
eastern Frostlands and northeast volcanic Darkav.

The new three sheets are actually **1254×1254**, with irregular illustration
boundaries, not uniform cells. `art.ts` crops measured objects, including extra
headroom for detached brazier sparks. Each prepared sheet has twelve 256px
logical frames, four atlas columns and 2× density (2048×1536 texture). Original
PNGs and filenames are not rewritten by this scenery pass; concurrent character
artwork updates are preserved. `fauna_1.png` is woodland
vegetation/objects, not animal animations.

| Sheet | Integrated objects and intended uses |
| --- | --- |
| `desert_1.png` | Flowering cactus, prickly pear, scrub, dry grasses, sandstone stack/shelf and bones in steppe habitats; wagon, signs, crates and trader tents in caravan/work courts and field camps; ruined arch at clan/ruin sites. A traveler tent is appropriate outside Rindass too, not a desert biome painted into Trandum. |
| `fauna_1.png` | Reeds at banks; flowers, ferns, shrubs, saplings and mushrooms in matching woodland/meadow/garden palettes; fallen logs and stumps in woods and timber yards; mossy stones/highland outcrops in rocky ground; direction signs at garden/travel stops. |
| `lava_snow.png` | Snow pines and bare winter trees in cold country; ice formations, snowy rocks/fences and watch braziers in winter courts/discoveries; ember crystals, basalt columns, lava boulders, braziers and rune altars in Darkav; lava-pool dressing only where the underlying terrain is already non-walkable lava. |

All 36 objects have matching placement roles in the implementation. This does
not mean every optional piece is guaranteed to fit a given court: clearance
rules intentionally omit unsuitable decoration. Older building, capital,
bridge, prop and terrain sheets remain in use. Incompatible wall/gate artwork
is not forced into new orientations merely to consume every possible frame.

## Trees and regional design

`regionScenery.ts` defines separate habitat palettes, visible tree heights,
ground colors and fog colors for all eight land regions plus the Dead Sea.
Mature wilderness tree targets are roughly 270–355 world pixels before
regional variation, versus Leigneron's unchanged 76px body. Narenthil has the
tallest old-growth canopy. Courtyard/ward trees target 245px, other town shade
up to 335px, and pruned orchard trees 190px. Saplings, shrubs and berries stay
smaller. Height comes from actual visible artwork, not source PNG dimensions.

Cold settlements and forests use the supplied snow pine, not a green conifer
with a white tint. Blackspire does not receive green shelter belts; Red Mesa
does not receive generic edge woodland. Winter work yards, caravan courts,
forge/rune courts, woodland gardens, herb beds and timber yards are authored
extensions of each settlement's existing neighborhood plan.

Whole silhouettes are fitted against streets, roofs, waterways, farm plots,
resident anchors and other reserved art. A larger decorative tree that cannot
fit is omitted, not allowed to block circulation or throw a startup error.
Tree bodies cover only their grounded trunks. Bare winter tree scenery uses
the same narrow trunk rules rather than a boulder-sized hidden body.

`TreeArt.ts` separates foliage from the prepared atlas in memory. Green leaves
and snowy pine foliage move subtly in `TreeSwaySystem`; brown wood, roots and
collision remain stationary. Bare winter branches are deliberately static.
Two compact two-frame atlases per tree sheet avoid copying the whole object
library for each layer. Leaf motion is throttled/camera-culled, reacts to wind,
respects reduced-motion preference and is destroyed with its streamed owner.

## Travel geography and ground

- Woodland spring and mountain meltwater tributaries join the Willow headwater
  network. The road survey reads these same streams, so applicable crossings
  use the existing east/west bridge pipeline rather than sideways bridge art.
- Seven authored pond/tarn candidates have irregular shorelines. Whole shore
  envelopes overlapping roads or defended settlements are rejected. Warm
  ponds are water/non-walkable; polar/alpine tarns use a new walkable solid-ice
  terrain entry, also represented in minimap/regional-map palettes.
- Crown downs and western Druganwoods upland bands introduce rocky meadow
  travel; Rindass ridge shoulders use dry rock rather than green grass. Roads,
  settlements, farms and existing river crossings retain priority.
- Natural ground swatches use larger blended 512px seamless patterns and
  world-space hill/valley coloring. Paving, crop rows and sea panels retain
  their intended orientation. Painted relief is not simulated 3D elevation.
- Existing lore discoveries get small region-appropriate compositions, such
  as tents/stores, mossy ruins, winter watches and volcanic shrines. Lake banks
  get matching reeds/logs or ice/rocks. Cross-chunk pieces use global authored
  reservations and belong to the chunk containing their actual position.

Wilderness still uses deterministic habitat stands and patches with finite
per-chunk counts, not one handcrafted placement per meter. Detailed settlement
plots are authored. This pass improves variation; it does not hand-author the
entire continent or introduce procedural city clutter.

## Water, mist, light and sound

`WaterSurfaceSystem` adds viewport-only world-anchored current strokes and
shoreline shimmer. Authoritative water sampling masks banks, bridge decks and
solid ice. The sea remains continuous non-walkable water: this does **not** add
ships or sea traversal. Reduced motion freezes animated surface movement.

`FogArt` replaces three horizontal gradient bands with soft density-field
billows in three parallax layers, regional coloration and restrained daylight
shafts. Dawn/night bank and woodland mist fades gradually alongside existing
regional weather. This is **volumetric-style 2D fog**, not 3D ray-marched fog.
It renders below the existing night-darkness overlay and adds no player light.

New winter/volcanic braziers, runes and molten materials use the existing
night-only illumination and warm emission masks. Ordinary daylight window/
lamp behavior and nighttime fireflies are preserved.

The existing optional audio switch is now labeled **World ambience**. Quiet
procedural surf/wind beds, daytime woodland chirps and night insect-like calls
join rain/storm ambience. No audio assets were supplied or downloaded. Audio
stays off until opted in, requires a browser user gesture, mutes during blocked
gameplay and suspends when the page is hidden. These synthesized placeholders
are not a finished recorded/musical soundscape.

## Compatibility and remaining work

No stack, world seed, town/story IDs, boss IDs, quest objectives, protagonist,
save version or travel controls were replaced. Existing content logical state
and discovery flags remain in the content ledger; cosmetic scenery/layers are
released with chunks. Existing safe-spawn recovery handles saved positions
that are no longer dry ground. New visual overlays have shutdown cleanup.
Concurrent character normalization edits were preserved, not credited to this
scenery pass.

Still pending: actual visual/gameplay/device review (only when requested),
artist review of the foliage color-mask split, collision/bridge/shore traversal
review, measured rendering/memory budgets, a fully surveyed Frostlands
archipelago/continent geography, controllable ships, full ecology simulation,
handcrafted coverage of every expedition and bespoke audio/music. The supplied
reference atlas remains the lore map; it is not an exact gameplay coastline.
