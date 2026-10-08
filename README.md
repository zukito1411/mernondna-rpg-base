# Mernodna RPG Base

A playable **React + TypeScript + Phaser** foundation for a large, continuous, top-down open-world RPG that targets both desktop and mobile.

The default playable hero is **Leigneron**. The current build starts him in **Oakmere, Trandum** with keyboard and touch controls, streamed terrain chunks, towns, NPC relationships, dialogue, a quest, enemies, a boss, day/night, local saves, dynamic encounters, a world map, and data-driven content definitions.

This is intentionally a **base game**, not a claim that the entire final RPG is finished. The architecture is designed so Codex can continue expanding the same repository instead of replacing it.

## Run it in VS Code

Requirements:

- Node.js 20.19+ or 22.12+ (Node 24 also supported)
- npm
- VS Code

From the integrated terminal:

```bash
npm install
npm run dev
```

Open the local Vite address shown in the terminal.

The web build is also installable as a standalone app. Serve `npm run build` with
`npm run preview` on localhost, or deploy it over HTTPS, then use your browser's
**Install app** control. The manifest includes 192/512-pixel icons and a
service worker that caches visited game files for subsequent offline use.
Installation support and UI vary by browser; the browser build and Capacitor
packages use the same game code.

Build a production web version:

```bash
npm run build
npm run preview
```

Run tests:

```bash
npm test
```

Check application and test TypeScript, then run desktop and touch browser regressions:

```bash
npm run test:types
npm run test:browser
```

Browser tests use installed Google Chrome, run headlessly, and start a local Vite server on port 5174. See `docs/PROGRESS.md` for milestone validation and known limits.

## Controls

### PC

- `WASD` — move
- `Shift` — sprint
- `Q` — dash
- `Space` — attack
- `1`–`4` — Azure Cleave, Skyfall Slam, Crown Rally and Crescent Flurry
- `J` — quest journal and story tracking (also available from the HUD)
- `E` — interact
- `M` — world map
- `I` — inventory / gear
- `C` — status and skills
- `Esc` — menu

### Mobile / touch

- Virtual joystick — move
- `⚔` — attack
- `Dash` — dash
- `Run` — hold to sprint
- Four numbered combat-art buttons — the same skills as PC keys `1`–`4`
- `E` — interact
- HUD buttons — map, gear, menu

The same React/Phaser codebase is used for both.

Click/tap the minimap to open the expanded regional map. Its **World Map** control,
the HUD **World Map** button, or `M` opens the illustrated Merdnona atlas, with
zoom and scrolling. Select a settlement
pin, then confirm **Teleport**. Interact with a settlement's shrine using `E`
or the touch Interact button to unlock that destination. Shrine discoveries
persist in your existing save; the shrine's own travel menu also remains available.

When running the Vite development server on localhost or a private LAN address,
all settlement destinations are available for local exploration. This bypass
does not permanently unlock shrines and is disabled in production builds.

## Native Android later with Capacitor

The Capacitor configuration is already included. After installing dependencies and building once:

```bash
npm run build
npx cap add android
npm run cap:sync
npm run cap:android
```

The base also works directly in mobile browsers, so Android packaging is not required for development.

## What exists now

- Leigneron as the default player character
- responsive PC + touch controls
- Phaser action movement, sprint, dash and melee attack
- streamed 3×3 terrain chunk rendering around the player
- matching content streaming for settlements, props, NPCs, creatures, bosses and interactables
- persistent wounded/defeated creatures, used caches/harvestables and NPC logical state
- validated version 4 saves with migration from versions 1–3
- approximately continent-scale world coordinates rather than room-sized levels
- region-aware procedural terrain
- coastline/ocean blocking
- named Mernodna regions and starter settlements
- roads connecting mainland settlements
- Oakmere starter village with collision objects
- NPC definitions with role, town, weapon, schedule, relationship to Leigneron, dialogue and quest links
- eight authored Oakmere NPCs
- inventory/equipped weapon foundation
- multiple weapon definitions
- ambient enemy spawning
- dynamic event director
- bosses with persistent defeated state
- first quest: **The Broken Road**
- day/night cycle
- local autosave
- original Mernodna world map shown in the in-game map UI
- local minimap with heading, nearby people/danger and the current quest destination
- objective-aware quest compass, world direction arrow and destination beacon
- NPC name/title labels, conversation portraits, trust values and nearby interaction hints
- creature/boss health bars and streamed farm/camp/woodland details using every supplied sprite sheet
- optimized copies of the supplied regional/monster/dragon/myth/bandit lore sheets under `public/assets/reference/lore/` for ongoing Codex/content work
- supplied directional character packs, enemy idle/walk/attack/hurt/death clips and Leigneron's directional sword animation
- role-specific Oakmere architecture, with original streets/foundations and persistent content IDs retained
- Vitest integrity tests

## Project layout

```text
src/
  components/          React HUD, panels and touch controls
  data/                data-driven regions, towns, NPCs, weapons, enemies, quests, streamed content and art metadata
  game/
    entities/          Leigneron, NPC and enemy Phaser entities
    scenes/            Boot and continuous World scene
    systems/           world generation, chunk streaming, day/night, event director
  store/               Zustand state shared by React and Phaser
  utils/               save and deterministic random helpers
public/assets/
  reference/           supplied Mernodna map used by the game map screen
  characters/          Leigneron walking strips, manifest and sword pose board
  npcs/                directional NPC packs and irregular transparent pose boards
  enemies/             species animation strips and manifests
  sprites/             world objects, architecture and vegetation/props
  tiles/               supplied terrain illustrations

docs/
  ARCHITECTURE.md
  GAME_DESIGN.md
  CONTENT_SCHEMA.md
  CODEX_CONTINUATION_PROMPT.md
  PROGRESS.md
```

## Important design rule

**React is the UI layer. Phaser is the realtime game layer.** Do not render moving game actors as React components and do not update React state at 60 FPS.

The world should remain physically traversable. Do not turn the realms into menu-selected disconnected stages. Mainland regions should be reachable by walking/riding. Islands such as Portquill, Frostlands and Darkav should become physically reachable by controllable ships/boats rather than map teleport buttons.

## Art

The supplied sprite strips/boards use manifest cells or measured alpha bounds in `src/data/art.ts`, `animationPacks.ts` and `spriteBoards.ts`, normalized to logical gameplay dimensions at boot. Public manifests are the single source of truth through a small Vite plugin. Original PNGs/WebPs are preserved; no deleted sprite-strip backup is restored. See `docs/ART_GUIDE.md` for assignments, provisional/unassigned art, dimensions and animation behavior. The supplied Mernodna world map remains the reference/map UI asset.

Oakmere now uses shared street/parcel/building/tree definitions rather than scattered lots. See `docs/SETTLEMENT_DESIGN.md` for the reference-map interpretation, field access rules, visual proportions, tests and remaining prototype limits. Author local layouts in `src/data/settlements.ts`; terrain and streamed props consume the same plan.

## Continue with Codex

The current environmental repair is documented in [docs/WORLD_REPAIR.md](docs/WORLD_REPAIR.md): individual layouts for all eleven settlements, full-sprite road clearance, retired perimeter walls, corrected atlas crops, localized night lighting and save-safe placement repair. Original assets and continuous chunk streaming are retained.

The subsequent [combat and world continuation](docs/COMBAT_WORLD_OVERHAUL.md)
adds shared enemy targeting, traveling Azure Cleave, Skyfall leap/landing,
corrected wolf walking, separate regional/world maps, Cibar Plains and connected
perspective-correct enclosures for all twelve settlements. It supersedes the
earlier retired-perimeter notes. See [Highmere's story slice](docs/HIGHMERE_OVERHAUL.md)
for the expanded capital, named residents and multi-stage quests. These latest
changes have not been tested or built: execution requires the user's permission.

Open `docs/CODEX_CONTINUATION_PROMPT.md`, copy the prompt into Codex, and let Codex work milestone-by-milestone in this repository.
