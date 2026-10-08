# Architecture

## Current capital/story additions (2026-10-08)

See HIGHMERE_OVERHAUL.md for the implemented Highmere slice and its limits.
`fortifications.ts` shares measured visible curtain seams with traversal and
path checks; only a closed royal precinct is instantiated. `npcRoutes.ts`
caches street graphs for physical routines and a deterministic marching file.
`highmereQuests.ts` / `storyProgress.ts` extend ordered objectives with evidence,
delivery, puzzle, choice, escort and training events. `CinematicDirector` streams
framed areas without moving the logical player; presentations are finite and
skippable. `RecoverySystem` advances only during peaceful active play. Optional
story deltas are backward-compatible additions to the retained version-4 save.

## Goal

Mernodna should become a large continuous top-down action RPG playable on desktop and mobile from one TypeScript codebase.

The game is deliberately split into four layers:

1. **React UI** — HUD, dialogue, map, inventory, menus, quest journal, crafting and other panels.
2. **Phaser realtime simulation** — player movement, enemies, NPC world actors, collisions, cameras, particles and combat.
3. **Data/content** — regions, settlements, NPC biographies/relationships, items, weapons, monsters, quests, bosses, events and later ecology/faction definitions.
4. **Persistence** — saves record world changes and player state without serializing the entire generated world.

## React/Phaser boundary

React must not own the world simulation loop. Phaser can read/write the Zustand store when UI-visible state changes, but should throttle high-frequency updates.

Do:

```text
Phaser movement/combat -> throttled Zustand update -> React HUD
React touch button -> mobile input bridge -> Phaser consumes action
```

Do not:

```text
React state -> 60 FPS player coordinates -> thousands of component rerenders
```

## World coordinates

The current world uses:

- 32 px logical tiles
- 48×48 tile chunks
- 1536×1536 px chunks
- 120×90 chunk world bounds

This gives a large coordinate space while only rendering nearby terrain chunks.

Only a 3×3 chunk neighborhood is kept rendered around the player. Future systems should follow the same near/far approach:

- near player: full actors, collisions, navigation and combat
- far away: abstract state such as population, settlement economy, migration and event timers

## Continuous geography

`WorldGenerator.ts` currently models a mainland plus Portquill, Frostlands and Darkav island landmasses. Region identity is deterministic from position.

This is an architectural seed, not final geography. Improve it using authored masks/polygons aligned to the supplied map instead of throwing it away and replacing the game with disconnected scenes.

## Content definitions

All authored content should be data-first. An NPC should be definable without editing the NPC engine class. A town should be definable without adding a special case to `WorldScene`.

As content grows, migrate large arrays from `.ts` files to validated JSON if useful, but keep strong TypeScript schemas and Zod validation.

## Save strategy

The base saves:

- Leigneron state
- world position
- time/day
- quests
- defeated bosses
- inventory/equipment

Future saves should add **world deltas**, not a dump of every generated tile. Examples:

- opened chest IDs
- destroyed/cleared camps
- defeated named bosses
- settlement prosperity/security changes
- NPC deaths or relocations
- player-built objects
- faction standings
- ecology/population deltas
- repaired bridges

Add explicit save migrations whenever the save format changes.

## Performance targets

Target:

- desktop: 60 FPS on common integrated/discrete GPUs
- mobile: 60 FPS where possible, stable 30 FPS fallback on midrange devices
- no thousands of active AI actors outside the local area
- pooled effects/projectiles/loot
- baked/static chunk visuals where possible
- local pathfinding only
- abstract off-screen simulation

## World content streaming

`ContentChunkManager` now shares `chunkNeighborhood.ts` with the terrain streamer. Stable definitions in `src/data/content.ts` activate/deactivate:

- NPC world actors
- wildlife
- local event actors
- settlement props
- harvestables
- dungeon entrances
- interactables

Do not delete their persistent logical state when their render actor unloads.

The manager is independent of Phaser. Its host creates/captures/destroys render actors, while its ledger retains position, health, defeat/use flags and NPC trust. Moving creatures are reindexed by their current chunk; unloading snapshots their state. Checkpoints publish content deltas to Zustand, rather than publishing each actor position every frame. Enemy/NPC/prop physics use shared groups and three scene-wide colliders.

The scene reserves a slot for a local authored boss and caps ordinary active creatures at eleven. Deferred creatures remain logical records. Dynamic encounter records have a conservative save budget of 512 per playthrough; the ecology/population milestone will replace this prototype cap with population-driven lifecycles. Authored content is not subject to that record cap. Off-screen actors are currently frozen, not simulated abstractly.

Save version 4 keeps the original browser storage key and migrates v1–v3 saves.
It preserves the content ledger, progression and stable spawn IDs, and adds
attuned settlement shrine IDs. Travel requests/menu state remain transient.
Persist meaningful deltas, never rendered tiles or Phaser objects.

## Visual rendering

The 2026-10-08 world repair adds `settlementGeometry.ts` for shared full-visible
bounds and road clearance; individual district plans for all eleven settlements;
and `environmentLights.ts` / `EnvironmentLightArt.ts` for source-measured window,
lantern and flame emission. `DayNightSystem` owns a bounded darkness canvas and
streamed light registrations. Perimeter wall/gate generation was retired, while
visible foundation/trunk collision remains. Static ledger positions are repaired
to authored coordinates without resetting use flags; old wall IDs are filtered
during save parsing. See WORLD_REPAIR.md for the current behavior and limitations.

Art metadata separates source regions, logical dimensions and texture density. Boot prepares compact high-density atlases; actor adapters compensate body dimensions so texture quality never changes combat reach or movement collision sizes. World-object adapters anchor sprites at their feet and use grounded foundation colliders instead of full image rectangles.

`TerrainBaker` retains the supplied terrain illustrations at a useful world scale, cross-fades narrow opposite edge bands and blends masks with neighboring chunk samples. Panel interiors are not mirrored. `ChunkManager` owns bounded deterministic, non-interactive wilderness scenery and releases it along with its terrain textures. These cosmetic trees have no logical persistence; anything harvestable, destructible, named or interactive must use `ContentChunkManager` instead. The existing terrain generator remains authoritative for traversal, minimap sampling and collision. This art pass changes no save schema or physical region connectivity.

`src/data/settlements.ts` is now the shared spatial plan: parcels, connected street polylines, building lots and authored tree plantings. Terrain generation, field metadata and streamed content consume it together. Oakmere is individually authored; the remaining settlements use ordered street/frontage prototypes, not finished regional cities. `sceneryPlan.ts` handles habitat-based cosmetic woodland outside those plans. Actor visual frames are enlarged while derived origins/offsets preserve their original body/foot coordinates. See `SETTLEMENT_DESIGN.md` for access/placement constraints and tests.

Hostile-creature territory is separate from player walkability. `protectedSettlementAt` expands each settlement's bounds by a 96-unit buffer; `WorldGenerator.canCreatureOccupy` applies it alongside normal land/world-bound checks. The scene's spawn gateway, content-activation adapter, event director and creature AI share the rule. `creaturePlacement.ts` repairs legacy alive-creature positions before registering the content ledger, preserving health/IDs/death/use/trust state. Invalid unplaceable records remain logical but inactive. No transient renderer position repair requires a new save format.

### Replacement animation packs

`scripts/assetManifestPlugin.ts` exposes the seven public manifests to Vite/Vitest through a watched virtual module. `animationPacks.ts` builds exact directional cells and 119 unique enemy poses; `spriteBoards.ts` holds measured alpha-component bounds for irregular boards, including sword/polearm extensions that cross nominal cells. `BootScene` loads deduplicated lossless sources, checks dimensions/alpha, prepares bounded atlases and releases source textures. Missing required files stop boot with explicit paths. Do not import public JSON directly or assume every animation has six frames.

Enemy state clips and player sword overlays keep gameplay bodies, hit timing,
recovery, stamina and reach independent of artwork. Defeat persists immediately
before a separate death animation runs. Sword overlays clear on pause, respawn,
completion and destruction. NPCs make collision-checked local patrols, rest and
return to their authored home points; full location-based daily schedules remain
future work. Six new NPC idle strips use measured body heights and a shared
foot baseline. Clip-specific geometry supports larger replacement wolf artwork.

Oakmere's new building appearance is separate from its original lot/foundation geometry. Content retains stable IDs and explicit foundation sizes so changing roofs or sprite aspect ratios does not alter street access. The compatibility `npcs` atlas uses supplied replacement sources rather than requiring the deleted old strip. Actor texture keys remain data-driven and outside the save schema. See `ART_GUIDE.md` for assignments and provisional/unassigned art.
