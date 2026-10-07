# Paste this into Codex

You are continuing an existing repository named **Mernodna RPG Base**. Do not restart it from scratch and do not replace its stack.

## Product goal

Build Mernodna into a very large, continuous, top-down open-world action RPG that runs on **both PC and mobile** from one codebase. Development must remain practical using **VS Code + Codex + normal Node/npm tooling**. The stack is **React + TypeScript + Vite + Phaser + Zustand**, with Capacitor for native Android/iOS packaging later.

The default protagonist is **Leigneron**. Keep him as the canonical default character.

The player must physically travel through the world. Do not turn regions into disconnected menu-selected stages. Mainland realms must be reachable by walking/riding through roads and wilderness. Portquill, Frostlands and Darkav should eventually be reached through controllable boats/ships and physical sea travel, not a teleport menu.

## First action

Before changing code, read these files completely:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/GAME_DESIGN.md`
- `docs/CONTENT_SCHEMA.md`
- `src/game/types.ts`
- all files in `src/data/`
- `src/game/scenes/WorldScene.ts`
- `src/game/systems/WorldGenerator.ts`
- `src/game/systems/ChunkManager.ts`
- `src/store/gameStore.ts`
- all lore/reference images in `public/assets/reference/lore/` and the world map in `public/assets/reference/mernondna-world-map.jpg`

Then inspect the current repository and run:

```bash
npm install
npm test
npm run build
```

Fix build/test/runtime defects before adding major features. Preserve working behavior while refactoring.

## Non-negotiable architecture

1. React owns menus/HUD/dialogue/inventory/map/journal/crafting/UI.
2. Phaser owns realtime actors, movement, collisions, combat, camera, particles and local world simulation.
3. Do not update React player/world coordinates at 60 FPS. Keep bridge updates throttled.
4. Content must remain data-driven. Adding an NPC/town/weapon/species/quest should not require editing core engine classes.
5. Keep deterministic chunk/world generation and persistent world deltas.
6. Maintain PC and touch input parity for every core action.
7. Do not introduce Unity, Unreal, Godot, Tiled, Blender or a required external editor. Optional art tools are fine, but the project itself must remain authorable from VS Code. If a world editor is needed, build it into this repository as a development tool.
8. Never delete the supplied Mernodna reference map from `public/assets/reference/`.
9. Keep Leigneron’s identity centralized and easy to expand; do not silently replace him with a character creator.
10. Add save migrations whenever persisted state changes.

## NPC quality rule

Every important NPC must have a tailored identity rather than a generic job label. Define:

- town/region
- profession and social role
- gameplay role
- relationship/history with Leigneron
- trust or affinity
- weapons/combat style where relevant
- faction/family ties
- daily/weekly schedule
- home/work/social locations
- dialogue voice
- quest/story links
- possible relocation/state changes
- consequences if events affect them

Model relationships between NPCs too, not only NPC -> Leigneron. Build a relationship graph so towns feel socially connected.

## Settlement quality rule

Every major town must be authored with:

- geography/reason for existing
- districts/roads/gates
- economy/resources
- architecture and terrain set
- leadership/factions
- laws/customs
- local NPC network
- services/shops
- surrounding farms/mines/forests/fishing/etc.
- local dangers
- trade routes to other settlements
- event pool
- state variables such as food/security/prosperity/population

## World/content direction

Use the supplied lore as source material for these realms:

- Trandum
- Narenthil
- Nardorous
- Rindass
- Druganwoods
- Portquill
- Frostlands
- Darkav
- Dead Sea / surrounding ocean

The final world should include towns, villages, farms, ruins, mines, shrines, caves, dungeons, forts, roads, passes, rivers, coasts, islands, harbors and wilderness. The existing coordinate/chunk architecture is the foundation; improve its geography instead of replacing it with scene-to-scene teleportation.

## Required development milestones

Work sequentially. After every milestone, run tests and production build. Do not attempt all milestones in one giant rewrite.

### Milestone 1 — Stabilize the existing base

- run the current project
- fix all TypeScript/build/runtime bugs
- verify PC controls
- verify touch controls using browser device emulation and pointer events
- confirm save/load works
- confirm first quest can be completed
- confirm Captain Varr can be defeated and stays defeated after reload
- add tests for critical fixed bugs

### Milestone 2 — Proper streamed content layer

Terrain is already chunk streamed, but authored world actors are still small enough to be globally instantiated. Build a `ContentChunkManager` that activates/deactivates render actors and interactables by chunk while preserving logical state.

Support:

- NPC actors
- wildlife/monsters
- harvestables
- world props
- settlement props
- dungeon entrances
- local event actors
- loot containers

Do not lose persistence when a chunk unloads.

### Milestone 3 — Authored world geography

Replace rough ellipse-only landmasses with data-driven authored region/land/sea masks or polygon layers aligned to the supplied Mernodna reference map.

Add:

- coastlines
- rivers
- mountain barriers and passes
- biome transition masks
- road graph
- bridges
- settlement footprints
- named landmarks

Keep generation deterministic and chunk-compatible.

### Milestone 4 — In-repo WorldForge developer editor

Create a dev-only route/tool in this repository that lets us edit the world from a browser while coding in VS Code.

WorldForge should eventually support:

- terrain/biome painting
- road/path drawing
- river/coast editing
- town/POI placement
- building/prop placement
- NPC spawn/home/work placement
- creature habitat zones
- event zones
- boss/lair placement
- collision/nav areas
- validation
- export back to repository JSON/data files through a development-only Node/Vite endpoint

Do not ship write-to-disk editor endpoints in production builds.

### Milestone 5 — Leigneron combat framework

Turn the current basic melee hit into a real combat framework:

- attack state machine
- light/heavy attacks
- stamina
- dodge/dash i-frames where appropriate
- block/parry
- hitboxes/hurtboxes
- stagger/knockback
- damage types/resistances
- readable enemy telegraphs
- animation event timing
- reusable weapon movesets

Add sword first, then sword+shield, spear, axe, bow, crossbow, daggers and staff/magic. Mobile controls must remain viable without excessive buttons; use context/skill slots where needed.

### Milestone 6 — Inventory/equipment/loot/crafting

Build:

- armor slots
- weapon slots
- consumables
- materials
- weight or sensible inventory limits if useful
- loot tables
- item rarity only if it fits the world
- crafting recipes
- smithing/upgrades
- regional materials
- monster trophies such as serpent scales, leviathan bone, troll fangs, wraith ectoplasm, ash-hound ember and boarfiend tusks

### Milestone 7 — NPC simulation and social graph

Implement data-driven schedules and relationships.

NPCs need:

- daily routines
- home/work/leisure locations
- reactions to danger/weather/crime
- relationship graph between NPCs
- relationship changes from Leigneron’s actions
- relocation/refugee states
- conditional dialogue
- memory/story flags
- optional mortality for appropriate NPCs

Start by making all Oakmere NPC schedules visibly functional before expanding the town roster.

### Milestone 8 — Quest and dialogue system

Upgrade linear dialogue/quests to support:

- conditions
- branches
- choices
- consequences
- skill/reputation checks
- world-state checks
- multi-NPC objectives
- timed/urgent events where justified
- quest failure without always forcing reload
- quest-generated world changes

Do not turn every story into “kill N enemies.”

### Milestone 9 — Ecology

Create separate definitions for species ecology and combat archetypes.

Model:

- habitat
- activity times
- diet
- prey/predators
- carrying capacity
- reproduction
- mortality
- migration
- weather/season effects
- overhunting
- settlement pressure

Near Leigneron use full actors. Far away use abstract population simulation. Changes must be able to generate gameplay consequences such as hungry predators moving toward farms.

### Milestone 10 — Dynamic world events

Upgrade the simple event director into a state-driven event system.

Examples:

- bandit camp grows -> caravan attacks -> prices rise -> road becomes unsafe
- drought -> prey migration -> wolf attacks -> hunting contracts
- faction tension -> patrols -> skirmish -> fortified border
- storm -> shipwreck -> scavengers/survivors -> temporary quest chain
- boss activity -> displaced wildlife/refugees/terrain danger

Events should persist/escalate/resolve rather than spawn randomly and vanish without consequence.

### Milestone 11 — Settlements, economy, factions and law

Add simulation fields for:

- population
- food
- wealth
- security
- prosperity
- trade route health
- faction control
- shop supply

Create faction relationships and region-specific law/crime handling.

### Milestone 12 — Mounts and physical sea travel

Add horses and culturally appropriate mounts, then controllable boats/ships.

Sea travel must support:

- boarding/disembarking
- sailing physics appropriate for a top-down RPG
- storms
- reefs/shoals
- pirate/bandit vessels
- sea monsters
- wrecks
- harbors
- route planning without menu teleportation

This milestone is required before calling Portquill/Frostlands/Darkav fully connected to the open world.

### Milestone 13 — Weather and seasons

Add regional weather fronts and seasonal state that affect visibility, navigation, ecology, sea danger, fire, snow, harvests and events.

### Milestone 14 — Boss framework

Support boss territories, phases, telegraphs, persistent death/state, loot, story consequences and world effects.

Use Mernodna creatures and myths for bosses/legendary encounters, including future support for things such as frost wyrms, ash drakes, leviathans, cave trolls, mythic stags and supernatural regional threats.

### Milestone 15 — Art/content production pipeline

The current art is placeholder. Create a replacement-safe pipeline for:

- terrain tiles
- props
- buildings
- character sprites
- 4/8-direction animation sheets
- enemy animation sheets
- particles/VFX
- UI icons
- portraits

Keep art metadata data-driven. Do not bake gameplay logic into filenames.

## Testing requirements

Maintain automated tests for:

- deterministic world generation
- content reference integrity
- save migration
- quest progression
- combat math
- ecology updates
- faction/settlement state transitions
- event conditions

Add browser tests later for keyboard/touch input and critical UI flows.

## Performance budget

Design for mobile from the start:

- avoid thousands of active actors
- pool frequently spawned objects
- unload distant render actors
- use abstract far-world simulation
- throttle React store updates
- avoid creating garbage every frame
- limit expensive pathfinding to nearby actors
- use spatial indexing for nearby queries once actor counts grow
- provide graphics quality knobs later

## Coding workflow

For each task:

1. inspect existing implementation
2. state the minimal architectural change
3. implement it in small coherent commits/patches
4. add/update tests
5. run `npm test`
6. run `npm run build`
7. report exactly what changed and what remains

When a requested feature is too large for one safe patch, implement the smallest complete vertical slice rather than leaving half-integrated systems.

## Immediate next task

Start with **Milestone 1**. Validate and repair the existing base until it cleanly builds and runs. Then implement **Milestone 2: streamed authored content**, beginning with Oakmere NPCs and nearby enemies. Preserve all user-facing behavior while doing so.
