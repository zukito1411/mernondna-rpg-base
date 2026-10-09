# Implementation progress

## Milestone 1 — stabilization (2026-10-07)

The existing React / TypeScript / Vite / Phaser / Zustand game remains a single continuous world with Leigneron as protagonist.

Fixed runtime issues:

- Normalize the supplied high-resolution sprite strips at boot using explicit art metadata. Remove their black background in runtime textures, keep logical physics dimensions, use the available eight hero frames, mirror side movement, and match terrain indices to the supplied strip. Original PNGs and lore references are preserved.
- Keep Oakmere buildings outside the starter movement/NPC area and place Captain Varr outside the solid watchtower.
- Latch keyboard action presses so short taps cannot disappear between game frames. Add touch sprint, capture/release multitouch input, clear queued actions on UI/focus interruptions, and dash along the facing direction even from rest.
- Pause physics, encounters and the game clock while a panel or dialogue is open. Correct the landscape touch HUD height.
- Record enemy death, boss state, quest progress and rewards atomically. Previously defeated quest bosses count when their objective becomes available; the return conversation is still required, and rewards cannot be repeated.
- Validate local saves before hydration, tolerate unavailable storage, flush current simulation state before saving, save progress immediately and flush on page hide/blur. New-game reload uses fresh state.
- Clean up resize, focus and scene listeners and per-enemy colliders.

Validation: dependency installation, 12 unit tests, production build, and three headless Chrome scenarios pass. Browser scenarios cover movement/sprint/dash, short key taps, chunk-boundary traversal, Oakmere, NPC dialogue, all panels, touch joystick/multitouch/buttons, a full-health Varr defeated through keyboard attacks, immediate reload, quest return/rewards, and fresh-game reset. Combat setup positions the player and retreats between blows; no enemy health or attack/reward/death method is bypassed. Screenshots are saved under ignored `test-results/`.

Run `npm test`, `npm run test:browser` and `npm run build`. Browser tests use installed Chrome (`channel: chrome`), a local server on port 5174, and a development-only scene handle enabled by `?e2e`. Native device performance and Android/iOS builds have not been verified.

## Milestone 2 — streamed authored content

Implemented the first complete streaming slice:

- A Phaser-independent `ContentChunkManager` and shared clipped 3×3 neighborhood for terrain and content.
- Stable definitions for all existing settlement labels/buildings, eight Oakmere NPCs, both bosses, the watchtower, two local creatures, and example harvest/loot/road-marker/cellar interactables.
- Dispose distant render/physics actors while preserving position, creature HP/death, NPC trust and used interaction flags. Reindex moving creatures across chunk boundaries.
- Route ambient/event creatures through the same manager with saved identities and wounded/dead state. Use enemy definition region weights and increment failed ambient attempts so a rejected seed cannot permanently stop spawning.
- Three shared scene-wide colliders; repeated visits do not accumulate colliders. Terrain textures release distant allocations before baking replacements.
- Save version 2 with explicit v1 migration; keep the original storage key and old quest/boss/player progress. Persistent interaction rewards and content deaths are saved atomically with their logical state.
- One-time roadwarden cache, berry harvest, direction marker and sealed cellar site demonstrate persistent interactables using both existing interaction paths. Full dungeons, crafting and NPC routines remain later milestones.

Unit coverage includes state retention, moving-actor reindexing, stable dynamic IDs, deferred actor budgets, save migration/validation, death/loot persistence and reference integrity. Browser coverage additionally travels Oakmere → Highmere → Oakmere, checks actor unload/recreation, wounded/event creatures and NPC trust after reload, non-repeating cache rewards and bounded colliders.

The test runner was updated to patched Vitest 4 after npm reported advisories in the original development toolchain. It supports the existing Vite 7 and Node versions; installation reports zero known vulnerabilities.

Limits: unloaded creatures are frozen; there is no far-world ecology yet. Ordinary active creatures are capped at eleven with an authored boss slot reserved; dynamic encounter records are capped at 512 per playthrough until population lifecycles arrive. The sealed cellar does not open another stage. Terrain remains the current ellipse/noise geography; islands still await physical sailing in Milestone 12. NPC relationship graphs/routines and richer town simulation remain their planned milestones.

Next milestone: authored continuous geography (Milestone 3), keeping the new content ledger and existing scene.

Final checkpoint: `npm run test:types` passes; all 24 unit tests pass on Vitest 4.1.11; all six Chrome scenarios pass (desktop, full-health Varr/quest/save/reset, landscape touch, portrait touch, streamed authored state and dynamic encounter state); `npm run build` passes. Native Android/iOS testing and physical-device performance remain unverified. Vite still reports the Phaser-heavy bundle-size warning (about 1.50 MB minified / 425 KB gzip); this is not a build failure.

## Navigation, character labels and supplied art (2026-10-07)

- Added a north-up local minimap using generated terrain, player heading, nearby buildings/people/encounters and the current quest destination. Clicking/tapping it opens the existing atlas.
- Added objective-aware HUD compass direction/distance, an in-world direction arrow and a destination beacon. Target resolution follows live actors, persistent relocation and authored positions; it tracks Aldren → Varr → Aldren and clears on quest completion.
- Added NPC name labels, proximity titles, nearby interaction hints, creature/boss names and health bars. Annotation objects are disposed with streamed actors.
- Analyzed all supplied PNGs, measured their alpha bounds, corrected padded/uneven sprite framing, aligned actor size/feet, corrected side mirroring/idle poses and mapped all eight NPC frames to suitable roles. The formerly unused world prop sheet is loaded and every frame is represented in the nearby world.
- Added fences, wheat plots, trees, pines, rocks, cargo, a signpost, roadside shrine, rest fire and a wraith encounter. Farmland uses the previously unused terrain frame. Town centers have clearer plaza/street terrain. These additions retain the existing streamed content and save format.
- Added sprite-based conversation portraits, displayed saved NPC trust, exposed weapon recovery/stamina/reach, and moved notifications away from the quest card.

See `ART_GUIDE.md` for the complete sheet/frame mapping and placeholder limitations. Navigation state is transient; existing v2 saves remain compatible. This is the requested UI/art pass; remaining world simulation/geography milestones are still planned.

Validation: TypeScript application/test checks pass; 29 unit tests and all nine desktop/portrait/landscape browser scenarios pass; both touch control scenarios were repeated twice successfully after replacing temporary tracing with a nearby-interaction state assertion. Production build passes, with the existing Phaser bundle-size warning (approximately 1.51 MB minified / 430 KB gzip). The portrait/landscape checks cover minimap placement, quest visibility, sprite readability, actor-label unload/recreation and unchanged save/quest/boss behavior. Native-device performance remains unverified.

## Rendering fidelity and world-asset scale (2026-10-07)

Continued the existing renderer and chunk streamers; no game rewrite, region-selection screen or new save schema.

- Re-inspected all current sprite/terrain PNGs, including the replaced Leigneron sheet and new guard/woman sheets. Corrected Leigneron to all 24 poses across four true facing directions. Measured irregular guard/woman layouts and prepared compact multi-row atlases; Elara uses the new guard art. The woman sheet is available for an appropriate authored staff-user rather than changing another NPC's identity to use an image.
- Separated logical sizes from high-density texture sizes. Actor textures retain four times the previous per-axis detail, with compensating physics dimensions/offsets and unchanged movement/combat sizes. World-object and prop illustration proportions now produce larger cottages, inns, trees and small objects instead of uniform miniature icons.
- Enabled smooth source resampling, linear texture filtering, antialiasing, fractional camera motion and a less magnified view. Increased name/title text resolution and removed forced pixelation from dialogue portraits.
- Replaced full-terrain-panel repetition every 32 pixels with detailed 256-pixel reflected patterns, border cropping and blended road/biome/farm masks. Neighbor margins align chunk transitions; the existing terrain generator still controls traversal and minimap geography. Reused scratch canvases and kept the existing nine-chunk streaming limit.
- Ground-anchored and depth-sorted world art; added linked shadows and narrow structure-foundation colliders. Arranged Oakmere's existing five buildings around open routes without moving its NPCs. Added two courtyard/garden trees and bounded deterministic wilderness trees/pines outside towns, roads and authored sites. Cosmetic scenery is destroyed with its owning chunk; authored interactables retain their logical persistence.
- Added tests for texture density, mobile-safe atlas dimensions, source-region integrity and cross-chunk transition samples. Browser visual checks now assert the retained high-resolution hero frames, original actor body sizes, guard assignment and linear filter mode in addition to existing controls/UI/persistence checks.

Final validation: `npm install` reports zero known vulnerabilities; all **32 unit tests**, test TypeScript checks, and all **nine Chrome browser scenarios** pass. The full-health Varr/quest/reload/reset scenario was also repeated three times successfully after one timing-sensitive missed hit in an earlier full run; temporary diagnostics were removed before the final passing suite. Desktop, portrait and landscape screenshots were inspected, including the terrain border correction. `npm run build` passes with the existing Phaser-heavy bundle warning (about 1.52 MB minified / 432 KB gzip).

Limits: the supplied artwork still has its original pixel-art style; this pass removes added renderer blockiness rather than inventing replacement art. Wilderness scenery is cosmetic, not ecology/harvestable-tree simulation. Unassigned character poses await NPC routines/appropriate authored cast. Native Android/iOS frame rates and high-DPI behavior remain unverified. Remaining game-design milestones retain their original order.

## Character proportions and settlement/field layout (2026-10-07)

The previous art-fidelity pass kept small character frames while enlarging structures; it also excluded nearly all cosmetic woodland inside a 640-pixel town radius. This follow-up addresses those concrete scale/placement problems without rebuilding the game.

- Enlarged player, named NPC and creature illustrations to 80-pixel logical frames (humans visibly about 68–76 pixels), with 4× texture density. Recalibrated cottages/inns to 224-pixel logical frames. Derived actor origins/body offsets keep the player/NPC 18×22 bodies, creature collision sizes, foot positions and combat reach intact. Moved names/titles/health/beacons above the larger art.
- Added shared settlement land-use definitions consumed by the terrain generator, streamed props and farm metadata. Individually designed Oakmere's five named lots, public square, connected through-roads/door frontages, shrine court, smith's stone apron, caravan yard, training ground, herb beds, orchard and crop fringe around its existing named NPC coordinates.
- Planted visible broadleaf/pine assets as village shade, shrine grove, orchard rows and woodland boundaries. Wilderness trees now form habitat-dependent stands with meadow openings, cold-region pine preference, guaranteed spacing, and road/shore/site exclusions. Authored settlement trees use the content ledger instead of being suppressed by a blanket radius.
- Replaced random building rings in the other settlements with ordered frontage/road templates. Those settlements remain prototypes, not fully authored cities. Continent/island masks and the rest of the original milestones remain unfinished.
- Derived wheat rows and horizontal fence boundaries from field dimensions, leaving road entrances and a central field lane open. Crop fields and visible props agree with the same terrain plan; the HUD now recognizes the settlement's agricultural parcels.
- Removed whole-panel mirror repetition from terrain rendering. Narrow opposite-edge blending preserves source interiors and avoids symmetrical/kaleidoscope motifs while retaining smooth transitions and existing chunk ownership.
- Retained old NPC, boss, building, decoration and farm IDs. Save schema remains v2; no progress/trust/used/dead state was deleted and no new generic important NPCs were added. Building captions identify places but do not claim to implement working shops or interiors.

See `SETTLEMENT_DESIGN.md` for the atlas interpretation, spatial rules and limitations; `ART_GUIDE.md` now records the corrected dimensions. This is a completed local settlement-design slice, not a claim to finish the entire living world, soil/hydrology, ecology, economy or physical sailing systems.

Validation: dependency installation reports zero known vulnerabilities. All **39 unit tests**, test TypeScript checks and **10 Chrome browser scenarios** pass; `npm run build` passes with the existing Phaser-heavy bundle warning (about 1.53 MB minified / 435 KB gzip). New tests check road-network connectivity, foundation clearance, accessible doors, retained saved IDs, cultivated crop placement, field entrances, named-NPC visibility and cross-chunk trunk spacing. Browser checks cover actual walking down the farm lane, planted tree presence, character/body proportions and the existing full-health Varr/quest/save, keyboard/touch and streaming regressions. Desktop/portrait/landscape and survey/field screenshots were inspected. Native-device performance remains unverified.

## No hostile village spawns (2026-10-07)

- Added shared hostile-creature exclusion for settlement bounds, fields/orchards and a 96-unit outer buffer, independent of player traversal. Authored activation, ambient spawns, event spawns and enemy movement now use the same policy.
- Moved the authored Oakmere wolf/boar out of the expanded village and Stonejaw out of Starhold's prototype footprint. Captain Varr stays at the existing wilderness watchtower; all encounter IDs, rewards and quest links are retained.
- Suppressed ambient attack events while the player is protected. Events announce only when at least one spawn succeeds. Enemies no longer pursue protected players and turn back after crossing a boundary.
- Added idempotent scene-load position repair for old alive creature/event records. It preserves wounds, IDs and spawn sequences; dead creatures, NPC trust and loot flags remain untouched. Unplaceable records stay dormant. Save schema remains v2; a new game is not required.
- Added unit coverage across every settlement/parcel/buffer, authored bosses, legacy state repair, impossible placement and event suppression; added browser checks for actual spawn rejection, boundary correction, protected-player health and old-save reload. The old-save fixture is injected before app boot because production pagehide intentionally saves the current world.

Validation: **45 unit tests**, test TypeScript and production build pass (existing Phaser-heavy bundle warning remains). The initial 12-scenario browser run passed 10, including full-health Varr/quest/reload, PC/touch controls, navigation and streamed persistence. The new old-save fixture needed pre-boot injection and the field traversal timed out once; after correction, the village boundary, old-save and field scenarios were each repeated twice successfully (six targeted passes). Temporary field diagnostics were removed.

Concurrent asset change observed during verification: `public/assets/sprites/leigneron.png` and `enemies.png` were removed and replacement packs appeared under `characters/`, `npcs/` and `enemies/`. Current Boot/art metadata still references those removed strips, and the new manifests contain `assets/v2/...` paths despite the actual folders being directly under `assets/`. This can render missing-texture placeholders; it is a separate loader-integration issue, not resolved or hidden by the spawning fix. Original/user asset changes were preserved. The user was asked whether to connect those new packs next; native-device performance and clean visual verification remain pending that integration.

## Replacement animation packs and architecture (2026-10-07)

Continued the existing scene, actor adapters and content ledger after the supplied art changed. No engine/stack rewrite, disconnected regions, new save schema or generic important NPCs.

- Visually inspected all 32 PNG animation strips and eight new transparent pose boards, plus the new six-building sheet. Checked source dimensions and measured per-cell or connected-alpha bounds. Original image files remain untouched; the hidden preview backdrop is not removed because the sources already have transparency.
- Corrected all seven manifests from absent `assets/v2/…` URLs to actual paths. Added one small watched Vite/Vitest virtual-manifest adapter so public JSON remains the source of truth rather than duplicating it under `src`. Boot deduplicates source loads, checks dimensions/alpha, releases source textures and reports missing required files clearly.
- Connected all four real Leigneron facing directions and standing poses. Added directional sword/greatsword visual overlays using all 24 supplied attack poses, including blade extensions outside nominal cells. Animation follows the existing weapon recovery and shared keyboard/touch input; stamina, damage, collision body and reach remain unchanged. Overlays clear on completion, UI pause, respawn and destruction.
- Connected all 119 unique enemy poses and 20 idle/walk/attack/hurt/death clips, respecting manifest timing and the five-frame boar attack. Hurt overrides locomotion briefly. Death visuals are separate, non-physical and self-destroying; defeat/rewards/save happen immediately as before. Boss persistence and village hostile exclusions are retained.
- Matched Joren to blacksmith, Mira to huntress, Aldren to general, Sena to attendant, Elara to directional guard, and Orin to the expanded staff-bearing source. Nearby directional NPCs face the player without fake walking. The old eight-role `npcs` adapter is rebuilt from replacement sources; no deleted NPC strip or browser-test backup is restored.
- Torren and Silas provisionally share the supplied adventurer outfit while dedicated merchant/hunter replacements are requested. Names, dialogue, roles, trust, histories and stable IDs remain separate. Villager and royal-guard boards are prepared for appropriate authored use, not turned into unnamed filler. Tall pike/sword canvases preserve human body proportions rather than shrinking people to weapon extents. Stonejaw's missing troll-specific art remains an explicit placeholder limitation.
- Assigned new cottages, inn, smithy, shrine and intact guard tower to Oakmere's existing lots/sites. The cellar and Varr's ruined tower use ruined architecture consistent with their story. Preserved all original lot positions, street/field plans, content IDs and solid foundation sizes independently of roof/illustration dimensions. Original world props, terrain, vegetation and wilderness shrine remain in use.
- Added asset-integrity, animation-state, irregular-frame, blade-fit and foundation tests plus browser loading/facing/portrait/death/sword-cleanup checks. Corrected a browser assertion that expected `null` instead of checking object absence, and made the chunk-crossing test wait for the streamer after physics crosses its boundary. One development reload during the first full run interrupted the legacy-save test; final verification runs with source edits stopped.

Final validation: all **51 unit tests**, **15 Chrome browser scenarios**, application/test TypeScript and production build pass. The stable full browser rerun covers actual PC/touch controls, first quest, full-health Captain Varr, immediate reload, boss persistence, legacy-save repair, inventory/map/minimap/navigation, farm traversal, village protection and streamed content state, plus the new animation/loading checks. Desktop, portrait/landscape and settlement-overview screenshots have been inspected. The existing Phaser-heavy bundle warning remains (about 1.54 MB minified / 439 KB gzip). Native Android/iOS performance/high-DPI validation is still pending; later world simulation/movement milestones remain in their original order.

## Connected roads, Highmere and browser installation (2026-10-08)

- Authored a shared eight-link mainland road graph: terrain, settlement approaches, tree clearance and walkability checks now use the same routes. This preserves physical foot travel across the existing mainland topology.
- Gave Highmere a distinct 3500x2800 capital plan with crown, market, craft and residential wards; 20 named building lots, paved stone streets and green strips; a curved river; and three walkable stone bridges. It remains in the continuous chunked world, not a separate stage. Added sixteen named residents with profession, Leigneron history, dialogue and schedules. Existing actor streaming preserves their position/trust across travel and saves.
- Made boulders, cargo, field fences, the wilderness shrine and interactables use grounded physics footprints. Interaction rays ignore only the target's own footprint, retaining line-of-sight blocking from other structures. Cosmetic wilderness trunks and authored trees still use their previous colliders.
- Reduced landscape touch HUD and movement controls while retaining PC/touch action parity and a 70px attack target. Added a scoped standalone web manifest, generated 192/512 PNG icons, and a production-only service worker for visited-file offline fallback. Browser installation requires HTTPS or localhost; Capacitor remains available separately.
- Preserved malformed incoming gray-wolf attack files and routed the runtime to separately recovered tracked frames until proper replacements arrive; see `ART_GUIDE.md`.

Validation: `npm install` reported zero vulnerabilities; 62 unit tests and the production build pass. The focused browser check covers capital terrain, river/bridge, all 16 residents and physical boulder collision. Desktop/touch, navigation label lifecycle and full-health Varr/quest/reload flows have passed in focused reruns. A final full browser rerun and physical-device landscape/installation checks remain pending at this checkpoint. Other settlements remain regional prototypes; functioning shops, laws/economy and NPC event consequences are not yet implemented. The Phaser bundle-size warning is still present.

## Shrine travel, actual darkness and new idle artwork (2026-10-08)

- Moved Orin's priestess model into an expanded, clear Oakmere shrine forecourt and Maren into Highmere's shrine forecourt; both have a patrol radius of 32. Older obscured saved positions relocate there without resetting trust or story progress.
- Added interactable shrines for all eleven settlements. Interacting attunes the local shrine and opens a PC/touch destination panel; only attuned settlements can be selected. Travel validates the origin, streams destination chunks, finds a clear landing and preserves vitals. Oakmere and Highmere retain their existing shrine content IDs. Save v4 migrates v1–v3 and preserves previously used shrine unlocks.
- Fixed the invisible night overlay: its fill alpha was zero, so object opacity had no visual effect. The dark blue overlay now reaches 84% opacity at night and fades at dawn/dusk. Removed the large additive player glow; small pulsing/moving fireflies remain.
- Inspected all six new NPC idle strips and measured alpha components. They use one body scale through breathing/blinking, keep polearms outside guard body-height measurements, and preserve the physics body/foot baseline when switching to walking or directional standing poses.
- Reconnected the updated wolf attack directly. Its larger 2172x724 source now has per-clip geometry, explicit bounds for all six poses and a scale matching the existing wolf. This avoids clipped lunges or neighboring-frame contamination. Recovery frames remain unused backups.

Per the user's latest instruction, no tests, browser scenarios or production build were run for these changes. Validation now requires an explicit user request. Existing assertions were updated for the removed glow, clip geometry and save version, but were not executed. The earlier full browser run had an intermittent territory snapshot assertion pending; current changes are documented without claiming a completed regression run.

## Full-map teleport prompts and local settlement exploration (2026-10-08)

- Full-map settlement pins are now keyboard/touch buttons. Selecting a pin opens a destination confirmation; Cancel returns to the map, while Teleport submits the destination to the existing streamed arrival flow. Locked destinations explain how to attune their shrine. A collapsible settlement list provides the same controls when nearby pins are difficult to select on a small screen.
- Map requests can originate anywhere and require an attuned destination in normal play. Shrine-menu requests still check proximity to their origin. Both paths retain collision-checked arrival, vitals and saves. Request source is transient; save version remains 4.
- Local Vite development on loopback/private LAN addresses permits travel to all eleven settlements, including towns, villages, cities and harbors. This discovery bypass does not mutate the saved shrine unlock list and is absent from production builds. LAN support gives mobile development the same access.
- Updated player instructions. No tests or builds run, per the user's preference; manual local exploration is now available through the full map.

## Remaining NPC idle strips (2026-10-08)

Integrated `idle_hunt.png`, `idle_general.png` and `idle_priestess.png` through the existing idle atlas/animation pipeline. Inspected their artwork and measured all six alpha components per strip. Huntress/general sizes match their walking models; priestess sizing excludes the staff and retains the requested 12% enlargement. A taller priestess idle canvas avoids cropping the staff. Standing/walking transitions retain their existing physics body and foot baseline. No tests or builds run, per the user's instruction.

NPCs no longer turn toward Leigneron on proximity. Facing follows their patrol movement, and resting uses the supplied idle animation; the nearby interaction pause and proximity labels remain. No tests or builds run for this requested behavior change.

## Complete world-map repair pass (2026-10-08)

Implemented the supplied world-repair task in the existing continuous game;
no framework replacement, scene rewrite or new save storage was introduced.
The task explicitly requested validation, superseding the earlier testing pause.

- Removed generated perimeter walls/gates and their detached invisible barriers.
  Retained collision on visible foundations, trunks, rocks, cargo and field rails;
  NPCs no longer barricade streets. Legacy wall records cannot respawn on reload.
- Measured and corrected capital, bridge and civic-prop crops, uniform alpha
  trimming, ground anchors, actor body offsets and source-space light positions.
  Original image files remain intact. Bridges now anchor to their visible decks
  rather than the middle of padded atlas canvases.
- Individually authored all eleven settlements with named districts, clear
  streets, connected door frontages, protected residents/shrine courts, crop
  access and intentional trees. Largest landmarks reserve their parcels first.
  Preserved existing gameplay IDs and regional road bends; added explicit
  Willowcross/Deepford crossings and harbor basin/pier access. Snow and charcoal
  terrain distinguish cold regions and Darkav from paved streets.
- Added night-only environmental illumination and emissive window/lantern
  pixels using existing Phaser textures. Darkness reveals local pools of warm
  light, flames flicker, fireflies drift/pulse, and no player glow returns.
  Streaming owns light cleanup; daytime avoids full-screen mask uploads.
- Preserved save v4, progress, trust, boss defeats and shrine discovery. Static
  props adopt corrected coordinates, obscured NPCs recover safely, and saved
  players inside repaired foundations load on clear ground without healing.
  Corrected landscape touch-grid overlap and existing RegionId build errors.

Validation: `npm install` completed; 69 unit tests across 14 files, application/
test TypeScript and production build pass. All 20 browser scenarios have passing
results across the full run and focused reruns (not one final 20-test run).
Reruns cover PC/portrait/landscape controls, four skills, first quest, full-health
Captain Varr, immediate reload, persistence, streaming, map travel, capital
crossings and all eleven settlements. Final day/night and overview screenshots
were inspected. The existing Phaser bundle warning remains (~1.64 MB minified /
471 KB gzip); native Android/iOS performance remains unverified.

See [WORLD_REPAIR.md](WORLD_REPAIR.md) for the settlement identities, spatial
rules, save handling and remaining shared-art/simulation/hydrology limitations.

## Crescent Flurry full-circle attack (2026-10-08)

Crescent Flurry now hits nearby enemies in every direction on each of its ten
damage pulses, independent of Leigneron's facing. Surrounding slash effects
rotate around the retained skill sprite to communicate the circular attack.
Range, damage, stamina cost, cooldown and duration are unchanged. Solid obstacles
still block hits, and knockback remains outward from the player. No tests,
type checks or builds were run, as requested.

## Highmere stories, animation, combat and world continuation (2026-10-08)

- Retained the expanded Highmere survey, 34 building lots, connected wards,
  named capital/regional residents, marching watch, three multi-stage stories,
  journal/tracking, physical witness escort, persistent decisions, skippable
  story presentations and peaceful settlement/idle healing.
- Reconciled newer hero source geometry; corrected the replacement wolf walk's
  six measured crops and common ground anchor. Preserved standing directions,
  added velocity easing/stride timing, removed per-frame formation body resets
  and tied monster action playback to combat timing.
- Added shared visibility/LOS target eligibility, selected/ordinary enemy
  indicators and tap/click selection. Azure Cleave now travels and hits on
  contact; Skyfall Slam visibly leaps toward a collision-checked landing.
- Split compact → regional minimap expansion from the illustrated Merdnona
  World Map. Added shared atlas calibration, aligned player/town pins, full-map
  zoom/scrolling and retained shrine/local-development travel permissions.
- Added Cibar Plains: seven lots, planned farm/market streets, five named
  residents, Deepford road, shrine and an eight-stage irrigation quest with
  distinct caches and persistent repair/governance consequences.
- Added connected horizontal/diagonal perspective enclosures for all twelve
  settlements. Road/water openings follow actual routes; Highmere has outer
  north/south gatehouses in addition to its royal precinct. No sideways gate
  sprites or rotated horizontal walls were introduced. Approach terrain and
  legacy-creature relocation now use the enlarged perimeter.

The latest attachment and AGENTS.md explicitly prohibit execution without
permission. **No tests, type checks, builds, game/browser launches or benchmarks
were run for this continuation.** Older recorded results do not verify these
changes. See [COMBAT_WORLD_OVERHAUL.md](COMBAT_WORLD_OVERHAUL.md) for the fourteen
requested report categories, principal files, behavior and remaining limits.

## Inhabited perimeter neighborhoods (2026-10-08)

The former building-survey rectangle excluded the large diagonal-wall flanks;
settlement scenery exclusions then left those interiors bare. Added explicit
west/east neighborhoods for all twelve settlements, with frontage plots,
connected spines/terraces, working courts, shared wells/stalls, rear gardens,
avenue planting, crop commons and wall-side outlooks. Highmere receives the
largest frontage allocation. Original civic/story districts remain intact.

Added 48 named household residents using existing artwork and street routines,
with connections to established characters and reserved work/social/home points.
Original building IDs stay stable; expanded plots fit the enclosure rather than
being rejected by the old rectangle. New optional infill never scatters to
arbitrary fallback sites. Farm fences/crops use full-sprite street clearance;
explicit dirt/paved lane surfaces also appear in the regional map.

No tests, type checks, builds, game launches or benchmarks were run, per the
standing instruction. Visual results, admitted plot counts, routes, saves and
performance remain unverified. See [SETTLEMENT_INFILL.md](SETTLEMENT_INFILL.md)
for the neighborhood identities, changed design rules and remaining limits.

## Wilderness, weather, main story and relaunch source repair (2026-10-08)

Implemented build-specific offline shell caching/early worker control, native
worker separation, readable startup failures and protected unreadable-save
recovery. The old HTML-only/late-registration cache gaps were identified in
source; the user's installed-app failure/platform was not reproduced or confirmed.

Added measured flora crops and bounded habitat scenery; broader biome transitions;
authored drainage outlets, connected harbor bays and a volcanic fissure; wider
surface-specific roads and aligned/enlarged crossings. Added reproducible regional
weather, gradual transitions, roof masking, a small minimap label and optional
procedural ambience. Twelve lore discoveries and two named field-camp residents
make roads useful beyond combat; encounter frequency is lower.

New main order: Broken Road → Highmere charter/witness inquiry → regional
briefings/evidence/bosses/reports → Highmere/Aldren closure. Existing Lower Ward
content is required by the capital chapter; two new skippable presentations and
charter dialogue integrate the royal audience. Original boss IDs/progress and
save version 4 remain, with explicit legacy narrative grandfathering.

No tests, type checks, builds, application/browser launches or benchmarks ran.
Nothing was deployed to an installed application. See
[WILDERNESS_WEATHER_STORY.md](WILDERNESS_WEATHER_STORY.md) for all fourteen report
categories, exact files, implementation/compatibility distinctions and remaining
native, geography, ship, simulation and performance limits.

## NPC front/back resting poses (2026-10-09)

NPCs now rest facing only up or down after walking, roaming, escort waiting or
conversation stops. Vertical travel records the resting direction; horizontal
travel retains it, defaulting to down. Down-facing rests use the supplied idle
strip; up-facing rests use the standing back frame because no back idle strip
is supplied. Walking still supports all four directions. Actor sizes, foot
anchors, collisions and the rule against facing Leigneron are unchanged.
No tests, builds or game launches were run.

## Larger trees, regional object integration and atmosphere (2026-10-09)

Inspected all world sprite sheets, terrain and world/lore references. Integrated
all twelve objects from each new desert, woodland and snow/lava sheet with
measured crops and appropriate regional placement roles. Enlarged visible
tree heights, retained smaller orchards/saplings and refitted town canopies
against circulation/roofs/residents. Cold forests use actual snow-pine art.
Added runtime leaf-only wind motion with stationary trunk collision.

Added region-specific habitat/work/garden palettes, discovery-site and lake-bank
compositions, connected headwater streams, off-road pond/tarn candidates,
solid-ice terrain, rocky upland bands, larger blended natural ground patterns
and painted hill/valley relief. Added viewport water movement, layered
volumetric-style 2D mist and new molten/brazier/rune night emissions. Expanded
the optional World ambience switch with quiet procedural regional sound beds
and woodland day/night calls. Existing continuous traversal, source images,
story/boss/quest state, shrine travel and character-normalization edits remain.

No tests, type checks, builds, application/browser launches, simulations or
benchmarks were run. Visual results, admitted decoration counts, navigation,
save behavior and platform performance are unverified. This is not a finished
continent/sea-travel/ecology implementation. See
[REGIONAL_SCENERY.md](REGIONAL_SCENERY.md) for precise scope and remaining work.

## Leigneron side-pose integration follow-through (2026-10-09)

Inspected the supplied six-frame right-facing side idle, walking and running
strips and retained their existing manifest/ground-anchor integration. The idle
file currently lives under `characters/leigneron/idle_sides.png`, not its parent
folder. Left/right standing and walking use the side art mirrored for left;
horizontal sprint/dash uses the running strip with the same mirror behavior.
Vertical travel retains real front/back poses with velocity-adjusted cadence
instead of displaying a sideways run. Existing stride-phase continuity remains.

Fixed texture-switch registration: explicitly select frame zero, restore the
shared foot origin, and align the invariant 18×22 player body above that origin
at world y. A subsequent contact audit found the offset-only correction left
the rendered soles 20px below that body; the shared origin is corrected in the
world-sprite geometry pass below. Side animation definitions now
forward optional manifest frame durations. PC and mobile share this path; PNGs
and unrelated NPC/world work are preserved. No tests, type checks, builds or
game/browser launches were run; runtime results remain unverified.

## World-sprite ground contact and occlusion (2026-10-09)

Inspected all eleven world sprite sheets and relevant character, prop, bridge,
lighting and collision code. Fixed the rendered-foot/body mismatch from the
previous player animation change and aligned NPC/enemy/sword/skill presentation
to the same ground line. Replaced generic scenery contact with shared surveyed
ground contours, including tree roots, building sides/stoops, solid stock and
separate hollow-structure pillars. Both persistent authored content and chunk
scenery use the same owner-cleaned geometry and source-based sort depth.

Replaced the bridge's horizontal foreground crop with curved front/back masks
and source-aligned rail contact while leaving its deck separate. Fixed window
emissions painting above foreground actors. Added swept foot-path protection
against thin-contour tunneling, preserved interaction target exclusions and
existing shrine/story state, and kept unrelated dirty-worktree edits intact.

No tests, builds, type checks, game/browser launches or simulations were run.
Visual contact, bridge traversal, routes, old saves and mobile performance
remain unverified. See [WORLD_SPRITE_GEOMETRY.md](WORLD_SPRITE_GEOMETRY.md) for
the actual source findings, contour approximation and remaining limits.

## Reference-inspired settlement environment detail (2026-10-09)

Requested 12% larger building presentation with fitted visible footprints,
per-lot smaller-growth fallbacks and original-scale retry for constrained cores.
Added workplace-specific entrance supplies/furniture and public-court planting,
seating and civic details using existing assets. Existing ward landmarks and
story/stock/civic objects retain priority; new optional pieces are omitted when
they cannot clear circulation and existing footprints. Added reservations so
the older loose-prop relocation pass cannot overlap fitted furniture.

Added chunk-baked regional flowers, ferns, mushrooms, dry vegetation and stones,
with denser settlement margins and clear working courts, roof bounds, paths,
water and crop rows. Enlarged stone cobbles and world-aligned all terrain
patterns to avoid phase resets at chunk seams. GUI, camera zoom, source PNGs,
quests and continuous world topology were not changed.

No tests, builds, type checks, game/browser launches or simulations were run.
Actual visual results, placement admission, traversal and device performance
remain unverified; APK output was not rebuilt. See
[ENVIRONMENT_DETAIL.md](ENVIRONMENT_DETAIL.md) for precise scope and limits.

## Density-aware phone rendering and shared ground rings (2026-10-09)

Replaced CSS-pixel-only RESIZE rendering with bounded density-sized backing
dimensions and FIT display scaling, using the installed Phaser 3.90 APIs.
Responsive world zoom still uses CSS breakpoints; gameplay and cinematic zoom
include the density multiplier. Added resize/DPR observers with destruction
cleanup and kept the React HUD/mobile controls at their existing CSS sizes.
Soft night/weather/water buffers retain logical resolution with corrected
viewport fitting and world-to-screen conversion to limit texture upload cost.

Centralized NPC quest and enemy selection rings at the physical foot line +2;
the enemy ring no longer uses its separate +4 offset. Added an unexecuted
`cap:android:refresh` script for production build plus Android asset sync. No
generated Android files were manually patched, and no installed APK changed.

No tests, builds, type checks, game/browser launches, simulations or Capacitor
commands were run. Sharpness, input, rotation, cutscenes and platform performance
remain unverified. See [MOBILE_RENDERING.md](MOBILE_RENDERING.md) for implementation,
quality budgets and the future authorized APK refresh workflow.
## New troll art and repeatable Darkav dragon (2026-10-09)

Inspected the new troll/dragon strips, including transparent bounds, irregular
dragon flight illustrations and two empty club-impact cells. Added separate
registered atlases instead of forcing large artwork into generic enemy cells.
Common trolls and existing Stonejaw now use actual troll animations and a
telegraphed club-impact slam; original enemy/boss IDs remain intact.

Added Varkhul as a large, strong quest boss with fire breath, stomp circles,
airborne reposition and marked landing strikes. Added a lava-rimmed basalt lair,
shared terrain/clearance ash trail, clue/return marker and optional volcanic
dressing. Existing Vexa/Dain anchor the five-objective Returning Ember quest.
The dragon retreats in flight instead of dying and returns after a saved
30-real-minute UTC deadline. Rematches award combat loot/XP without resetting
quest completion or duplicating quest rewards. Permanent bosses retain their
existing one-time behavior. Optional cooldown state remains within v4 saves.

No tests, builds, type checks, game/browser launches or gameplay simulations
were run. Rendering, navigation, balance, cooldown/reward persistence and device
performance remain unverified. See [DRAGON_TROLL.md](DRAGON_TROLL.md) for source
findings, complete scope and limitations.

## Darkav volcanic floor identity (2026-10-09)

Replaced Darkav's use of pale/mossy global paving with a regional charcoal
basalt palette. Added porous ash with subtle warm mineral seams, scorched
trails and brighter molten channels around cooled crust. Regional masks apply
per world cell to Blackspire, the countryside and the dragon's safe deck;
other regions and authoritative terrain/walkability remain unchanged. Ground
relief no longer adds green shadows to Darkav ash. Patterns are prepared once
and remain aligned across chunk seams; no whole-scene tint was introduced.

No tests, builds, type checks, game/browser launches or simulations were run.
Visuals, edge blending and device performance remain unverified; packaged app
assets were not rebuilt. See [DARKAV_GROUND.md](DARKAV_GROUND.md).

## Darkav red-rock asset correction (2026-10-09)

Superseded neutral charcoal paving with ember-red ground tones matching the
volcanic props. Ground detail now samples actual lava-boulder and lava-pool
surface interiors from the prepared `lava_snow.png` atlas. Removed generated
fissure polylines, outlined polygon crust and the old five-line generic lava
texture. The dragon's molten rim shares the asset-derived lava surface. Existing
roads, safe fighting deck and lava collision boundaries are preserved.

No tests, builds, type checks, game/browser launches or simulations ran.
Actual palette/texture appearance and device performance remain unverified.

## Darkav ashfall, burnt sites and Cinderpeak (2026-10-09)

Added default regional ashfall with layered drifting flakes, sparse rising
embers and restrained reddish haze. Derived burnt bare trees, logs, stumps and
ruins from existing source art at boot; original winter/woodland sheets remain
unchanged. Some admitted deadwood bases use the existing fire sprite and night
lighting. Added three named discoverable ruin sites with fitted compositions.

Used the imagegen skill/built-in image tool for a dedicated transparent volcano
sprite, saved in `public/assets/sprites/darkav_volcano.png`. Cinderpeak stands at
the existing lava headwater, with surveyed broad contact and extended actor-only
streaming so the summit can appear before the base chunk loads. Roads, Blackspire
and the dragon encounter remain separate from its footprint.

No tests, builds, type checks, game/browser launches or gameplay simulations
ran. Runtime art, navigation, streaming, lighting and mobile performance remain
unverified. See [DARKAV_ATMOSPHERE.md](DARKAV_ATMOSPHERE.md) for details, generated
asset provenance/final prompt and remaining limitations.

