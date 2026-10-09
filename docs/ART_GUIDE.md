# Supplied art: sources, scale and runtime use

Original PNGs/WebPs remain untouched. Transparent board previews can display hidden backdrop RGB; check alpha before attempting background removal. All newly supplied character boards are already transparent.

## Manifest-based animation packs

### Leigneron side idle, walking and running (2026-10-09)

The current supplied files are `characters/leigneron/idle_sides.png`,
`characters/leigneron/walking.png` and `characters/leigneron/running.png`.
The parent-folder `characters/idle_sides.png` is not present. The manifest
references the actual nested idle file; no PNG was moved, renamed or duplicated.
All three strips contain six right-facing poses. Side walking and standing
mirror left with `flipX`; horizontal sprint/dash uses the faster running strip
with the same mirroring. Front/back locomotion retains its existing directional
art (with speed-adjusted cadence), since no front/back running strip exists.

Side idle plays after left/right movement. Walk/run transitions preserve stride
progress, frame rates/durations come from the manifest, and shared registered
source scales/ground anchors keep the body consistent through leaning/airborne
poses. Texture switches now explicitly select frame zero and put the unchanged
18×22 physical body immediately above the foot anchor. The later world-contact
audit found this offset-only fix incomplete: the rendered soles still sat 20px
below the body. The shared rendered origin and physical foot line are now
corrected together; see [WORLD_SPRITE_GEOMETRY.md](WORLD_SPRITE_GEOMETRY.md).
Both PC and touch
use the same presentation path. Source images are untouched. No tests, builds,
type checks or game launches were run; runtime appearance remains unverified.

`public/assets/**/manifest.json` is the source of truth for the seven strip packs. Paths point to `assets/…`, not the absent `assets/v2/…`. `scripts/assetManifestPlugin.ts` exposes these public manifests through a watched virtual module in Vite/Vitest, avoiding duplicate manifests and unsupported direct public-directory imports.

| Pack | Frames and current use |
| --- | --- |
| Leigneron | Four directions × six poses; manifest 9 FPS walking and real direction-specific standing frames. |
| Trandum guard | Four directions × six poses; Elara and her conversation portrait. Nearby NPCs face the player without walking in place. |
| Shrine priestess | Four directions × six poses; Orin's existing staff-bearing visual expands to directional poses. Identity, dialogue and relationships are unchanged. |
| Gray wolf | Idle, walk, attack, hurt, death, six poses each. |
| Road bandit | All five states; shared species art also drives Captain Varr. |
| Boarfiend | All five states, with **five**, not six, attack poses. |
| Marsh wraith | All five states at their declared rates. |

PNG is the lossless runtime source; equivalent WebPs are verified but not loaded a second time. The compact enemy atlas contains **119 unique frames** and 20 animations. Its first four frame IDs preserve the old species order. Common normalization retains relative creature sizes instead of making every species the same height.

Stonejaw still uses the existing boar-frame fallback: no troll-specific sheet has been supplied. This integration does not claim that fallback is finished boss artwork.

Enemy animation is presentation, not a combat rewrite: attack damage/cooldowns remain unchanged. Hurt briefly overrides locomotion. On defeat, rewards, removal and persistence happen immediately; a separate non-physical, self-destroying sprite plays death. Paused menus also pause surviving enemy animation. A death effect cannot collide, award a second reward or resurrect a saved boss.

## Irregular pose boards

`src/data/spriteBoards.ts` records measured connected-alpha bounds for the 1536×1024 boards. Do not blindly slice into 256-pixel cells: sword swings and polearms cross cell boundaries. The four rows are front, left, right, back, six poses each. One uniform scale per board preserves body size across poses; sources are not resized independently to fill each frame.

Huntress art supplies Mira; blacksmith supplies Joren; general supplies Aldren; attendant supplies Sena; adventurer supplies Torren's travel outfit and provisionally Silas's hunter outfit. Their names, roles, dialogue, quest links and persistent trust are independent; dedicated merchant/hunter art is still requested. The `npcs` compatibility atlas reconstructs the old eight role indices from supplied replacements, not the deleted strip or browser backup. Villager and royal-guard boards now also serve named Highmere residents with individual roles, dialogue, schedules and relationships. No missing old strip is required to boot the game.

The updated `gray_wolf/attack.png` is now selected directly. Its six cells are 362x724, unlike the older 176x144 wolf strips. Clip-specific `frameWidth`, `frameHeight` and `renderScale` in the manifest preserve the measured 192–207px attack silhouettes at the normal wolf size. PNG remains the runtime source. Earlier recovered `attack-original` files are unused backups.

The replacement `gray_wolf/walk.png` uses 362x724 clip cells but different visible
bounds from attack. Its six measured regions retain the legs and airborne pose;
the shared source ground line is Y=510 with 0.22 render scale. Do not copy the
attack rectangles into walking. Walking loops at 12 FPS with velocity-based
playback adjustment; attack playback duration follows windup plus recovery.
Other wolf clips retain their original dimensions. Supplied wolf clips are side
views, so mirroring supports left/right, not invented front/back animations.

`npcIdleArt.ts` integrates all nine supplied 2172x724 idle strips: adventurer, attendant, blacksmith, royal guard, Trandum guard, villager, huntress, general and priestess. Measured alpha regions remove padding and keep one scale per strip. Huntress/general use 375px/390px source body references for their normal 76px models. The priestess uses a 412px source body reference and the walking body's 148/160 silhouette ratio, retaining her requested 12% enlargement. Staff/polearm height is excluded from body measurements; 96px priestess and 112px guard canvases preserve weapons. NPC texture changes retain an 18x22 physics body and the same foot baseline. Front-facing idle clips breathe/blink at 2.5 FPS; side/back interaction poses retain directional artwork.

Leigneron's sword board uses a **128×104** logical canvas, sized for the extended blade without shrinking his body. Accepted sword/greatsword attacks run its six poses in the selected direction, paced to the weapon's existing recovery. The overlay follows movement and clears on completion, UI pause, respawn or destruction. Other weapons retain their existing effects. Physics stays on the original player body; PC/touch attacks share this path.

The prepared royal guard similarly uses a taller 96×112 canvas: its pike extends above the helmet and must not be used to shrink the human body. Ground anchors and physical body sizes remain independent of that taller illustration.

## Architecture and world objects

| Source | Measured frames and use |
| --- | --- |
| `sprites/buildings.png` | Thatched cottage, inn, smithy, shrine, ruined arch, watchtower. Oakmere's existing named lots use matching architecture; the guard post uses the intact tower. The sealed cellar and Varr's ruined eastern watchtower use the ruin, matching their existing story descriptions. |
| `sprites/world_objects.png` | Original cottages/inn, ruin and road shrine remain available. Prototype settlements and the wilderness shrine retain appropriate original art. |
| `sprites/world_assets.png` | Broadleaf tree, pine, boulder, fence, wheat, signpost, campfire, cargo; all eight types occur in the streamed Oakmere area. |
| `tiles/terrain.png` | Grass, dirt, stone, farmland, forest, sand, snow, water; ash uses stone. Source is 3546×443 with equal terrain panels. |

`buildings.png` measures 1448×1086 and has uneven illustrated extents; the two original world strips measure 2172×724. `art.ts` records alpha rectangles rather than assuming uniform illustrated cells. Oakmere's lot coordinates, access streets and original foundation sizes are retained independently of the new visuals. New art does not create new content IDs or invalidate old saves.

World objects use 224×224 logical frames at 2× density; props use 128×128 at 4×. Ground anchors, depth sorting, linked shadows and narrow foundation collisions keep roofs/canopies from blocking whole sprite rectangles. Characters remain approximately 68–76 world pixels tall, with taller trees and proportionate buildings. Manifest-based hero/guard/shrine atlases use 4× density; creature and full-board atlases use 2×. All packed textures remain below 4096 pixels per side. `actorArtLayout` retains feet and original 18×22 player/NPC bodies; creature radii and attack reach do not change.

## Terrain, planting and navigation

Terrain stays at 256×256 per panel, with the source border cropped. Narrow opposite-edge blending retains the panel interior without whole-panel mirror/kaleidoscope repetition. `TerrainBaker` blends biome/road/farm masks from the authoritative world generator. A neighbor-cell margin aligns independent chunk borders; scratch canvases are reused and distant chunk textures released.

Settlement terrain, authored trees, orchard rows, streets and wheat/fence placement share `settlements.ts` land-use plans. Wilderness `sceneryPlan.ts` uses deterministic habitat stands, meadow openings, cold-region pines and road/shore/site exclusions. Trunks are spaced at least 128 units, even across chunk borders, with at most 36 cosmetic sprites per chunk. These trees are scenery, not completed harvest/ecology simulation. Authored interactables retain persistent logical state. Hostile settlement exclusions remain enforced for all monster sources and movement.

The minimap samples generated terrain, not the lore atlas. It shows nearby structures, people, danger, player heading and current quest target. Terrain caching and the existing throttled HUD bridge avoid per-frame React world updates. Names, titles, health bars, building captions and shadows unload with their owner. No image, marker or portrait introduces a teleport or disconnected region.

Linear filtering, smooth resampling, antialiasing and fractional camera movement avoid added renderer blockiness. The original pixel-art style remains intentional. Native Android/iOS performance and physical high-DPI displays still need device validation.

## Regional object sheets and larger trees (2026-10-09)

`desert_1.png`, `fauna_1.png` and `lava_snow.png` now have measured 1254×1254
source rectangles and twelve individually named frames each. They are used in
regional habitats, settlement work/garden courts and existing discovery sites,
not treated as grid terrain tiles or untyped clutter. Mature trees are sized by
visible body/canopy height; snow pines replace green trees in cold regions.
Runtime compact wood/leaf atlases enable leaf-only sway without moving trunks
or their collisions. Natural ground patterns, painted upland relief, pond/ice
terrain, moving water and layered mist complement the existing source art.
See [REGIONAL_SCENERY.md](REGIONAL_SCENERY.md) for all asset assignments, sizing,
regional direction, source-only review and explicit remaining limits.

## Ground contours and draw order (2026-10-09)

Prepared frame metadata now includes actual source/crop registration. Shared
`WorldSpriteSystem` uses surveyed per-asset ground contours and sort lines for
authored props and streamed scenery, replacing the narrow generic trunk/base
boxes. Root spreads, side foundations, stockpiles and hollow pillar openings
are distinguished from roofs/canopies and padding. The currently used stone
bridge has separate curved back/front layers and matching rail boundaries;
window emissions respect structure depth instead of painting over foreground
actors. Character feet, physical contact and depth share world y. See
[WORLD_SPRITE_GEOMETRY.md](WORLD_SPRITE_GEOMETRY.md) for the regression found in
the previous animation offset, exact implementation and unverified limits.

## Reference-inspired settlement detail (2026-10-09)

Buildings request a 12% increase with footprint-aware fitting and smaller
growth/original-scale fallbacks for constrained lots. Existing district details
retain priority; new role-aware core courts use flowers, shrubs, awnings,
seating, supplies, fountains and noticeboards where clearance permits. Low
regional cover is baked from measured atlas crops into chunk ground textures,
without extra collision bodies. Stone paving has larger, world-aligned cobbles.
The reference is used for environment composition only; GUI and source images
remain unchanged. See [ENVIRONMENT_DETAIL.md](ENVIRONMENT_DETAIL.md) for exact
scope, implementation and source-only verification limits.

## Phone rendering density (2026-10-09)

The main backing canvas now grows with bounded device pixel ratio (up to 2x),
with matching gameplay/cinematic camera zoom and FIT-based input mapping. This
retains the CSS-sized field of view and HUD while rendering world sprites and
marker strokes with more pixels. Soft night/weather/water overlays keep smaller
working buffers with density-aware fitting. NPC and enemy ground rings share
the actor foot line +2. Original raster resolution and pixel-art style remain;
old installed APKs require a future authorized build/sync/reinstall. See
[MOBILE_RENDERING.md](MOBILE_RENDERING.md); runtime/device results are unverified.

## Troll and dragon sheets (2026-10-09)

New troll ground/impact and dragon ground/flying illustrations use separate
2x atlases and body/foot registration. The dragon flight manifest has measured
irregular silhouette rectangles, not equal-width crops; lower padding keeps
downstroke wings intact. Empty impact cells are excluded. Existing generic
species IDs and source rasters are preserved. Stonejaw/common trolls now use
actual troll art. Varkhul uses fire, stomp and flight presentation and retreats
without playing the available death strip. See [DRAGON_TROLL.md](DRAGON_TROLL.md)
for asset inspection, sizing, encounter behavior and unverified limits.

## Darkav ground palette (2026-10-09)

Darkav uses ember-red basalt paving, red ash and scorched red-brown trails.
Surface detail comes from interior crops of the supplied lava boulder and lava
pool in `lava_snow.png`, combined with existing ground relief. Synthetic fissure
lines, outlined rock polygons and the old generic five-line lava pattern have
been removed. Per-cell masks cover Blackspire and the dragon deck without
scene-wide tinting or changes to road/lava navigation. See
[DARKAV_GROUND.md](DARKAV_GROUND.md) for implementation and unverified limits.

## Darkav atmosphere and mountain (2026-10-09)

Default ashfall uses reusable flake sprites, three depth bands and sparse ember
motes. `darkav_props` reuses existing bare-tree/log/stump/ruin illustrations with
runtime snow removal and red-charcoal recoloring; original sheets are preserved.
Burning deadwood bases reuse the actual fire sprite. The dedicated transparent
`darkav_volcano.png` was generated with the imagegen skill and saved in the
project; it anchors Cinderpeak at the lava headwater. Extended actor streaming,
source-based contour contact and night lights cover the large landmark without
increasing terrain streaming radius. See [DARKAV_ATMOSPHERE.md](DARKAV_ATMOSPHERE.md)
for final generation prompt, provenance and source-only verification limits.

## Failure handling and tests

Current animation/combat/world continuation has not been tested, built or
launched, per the user's explicit instruction. The descriptions of existing
test coverage below are not a claim that those suites pass against this code.

Missing required source files stop world boot with a readable path-specific message rather than silently displaying missing-texture actors. Source dimensions and non-empty alpha bounds are checked during atlas preparation. Unit tests verify source PNG/WebP existence, dimensions, manifest rates, all enemy frames, board bounds, oversized sword poses, texture limits and preserved foundations. Browser tests cover loading failure, real NPC facing/portraits, enemy movement/hurt/attack/death and sword-input cleanup alongside the existing movement, touch, streaming, quest, boss, village-safety and persistence suites.
