# Wilderness, weather, main story and installed startup — 2026-10-08

Continues the existing React/TypeScript/Vite/Phaser/Zustand world, including
settlement infill, combat skills, targets, maps and save version 4. No framework
replacement, new dependency or disconnected exploration stage was introduced.

## 1. Installed-app relaunch

Source inspection identified two concrete PWA weaknesses: the old worker cached
HTML/icons without precaching their hashed JS/CSS graph, and registration occurred
after initial game-art requests. Offline relaunch could therefore have a shell
without its executable modules or required artwork. One permanent cache name and
immediate worker replacement also allowed incompatible build resources to mix.
These are identified implementation defects, **not a confirmed diagnosis of the
reported device failure**. The browser/native platform and failure screen have
not yet been supplied; no app was launched to reproduce the symptom.

`offlineShellPlugin.ts` emits a build-specific module/CSS/HTML shell manifest and
a matching worker version. Public asset metadata also invalidates the version
when artwork changes. The worker completes shell installation atomically before
activation, waits for old clients to close on updates, and retains the preceding
shell for outstanding hashed requests. Version metadata lives in the version's
own cache, so worker process termination does not lose initialization state.
Required game images requested after initial worker control are cached before
their successful responses return. Cache write/storage failures do not kill a
live network load. Unvisited optional art can still require a connection.

Startup prepares worker control before importing the game. Capacitor native
startup skips web-worker registration and unregisters owned legacy web workers;
native builds continue to use packaged files. Startup/module/initial scene errors
now have readable retry presentation. No retry clears player storage.

Unreadable saves are preserved separately; a previous valid checkpoint is tried.
Without a usable checkpoint, automatic writes are blocked instead of overwriting
the original with a new character. If the unreadable backup cannot be stored,
the original remains write-protected. A recovery notice is retained in the menu.
Starting a new game requires confirmation. Optional backup storage pressure does
not prevent ordinary current-save writes.

**These source changes are not deployed into an existing installation.** A future
authorized production build/deployment is required. Updated workers activate once
old clients close. A browser installation of a live Vite development server still
depends on that server; it is not an offline production package. Storage eviction,
native packaging, OS restart and device-specific WebView behavior remain unverified.

## 2–3. Geography and regional biomes

`worldLandscape.ts` authors a crown drainage trunk, Willow tributary, Rootwater
drainage, mountain ridge spine, harbor bays and eastern volcanic fissure. Existing
town/world coordinates and local river/bridge surveys are preserved. Broader
vegetation fields replace tiny noisy checkerboard biome patches; woodland/meadow
coverage transitions gradually toward Narenthil and Druganwoods.

Implemented terrain/habitat identities include meadows, forest/clearings,
Druganwoods riparian wetland, ridge-adjacent highlands and snowfields, coastal sand,
Rindass drylands, Cibar grain-country meadow and Darkav ash/lava. Marsh is traversable
without a movement penalty; actual water and lava are nonwalkable. Lava follows a
continuous authored fissure away from the city; existing roads remain safe ground.
Coast detection includes the new bay margins. This is an atlas-informed extension
of the existing approximate continent/island geography, not a pixel-exact tracing
of the illustrated map or a new height-field/cliff engine.

## 4. Weather and atmosphere

One bounded screen canvas renders clear/overcast, light/heavy rain, variable
snowfall, drifting mist, wind and dryland dust/volcanic ash. Region, biome, saved
day and clock select weather reproducibly. Conditions fade out before changing
precipitation kind, then fade in; no rain/snow double emission. Conservative roof
bounds suppress precipitation under visible building art, including cinematic
camera framing. Effects are below the established night/light layers. No weather
combat/movement penalties or player night glow were introduced.

Maximum precipitation is 96 particles and drawing is throttled to 20Hz. A small
minimap label reports conditions. Optional synthesized weather ambience can be
enabled from the menu with a user gesture; it is initially off, quiets while
paused, suspends when hidden and releases its audio context on teardown. Weather
selection resumes from existing saved time/location; crossfade/particle positions
and the ambience preference are transient, not new save schema fields. Fireflies
are restricted to suitable forest/meadow/wetland habitat.

## 5–6. Roads, rivers and coasts

Road widths now distinguish a 96-unit forest trail, 128-unit mountain corridors,
144-unit Oakmere road and 176-unit main trade routes. Crown-connected roads use
stone; regional trails use dirt. Existing bends and settlement passage generation
remain authoritative. New river crossings get horizontal bridge approaches rather
than rotating front-facing bridge artwork. Bridges are enlarged uniformly, with
80-unit deck corridors and correspondingly separated foreground rails.

The Crown River now has upland headwaters and a western sea outlet; Willow joins
that trunk rather than ending at a detached pool. Rootwater runs from upland mine
country through Deepford to the southern ocean. Ports have widening sea-connected
bays beyond the existing southern basin and defended water ports. New crossings
stream through the same content manager. Exact crossing/shore alignment and
walkability have not been played or visually verified.

## 7–8. Assets and wilderness exploration

Inspected `flora.png` visually and measured connected-alpha component bounds in
the actual 1448×1086 source. Twelve complete crops supply white/yellow/blue flowers,
berry shrubs, meadow shrubs, reeds/cattails, dry grass/scrub, sage, mossy stones and
ferns. Original PNG files were not rewritten. Habitat/stand fields determine
placement; full-art road/shore/site exclusions prevent vegetation on highways.
Cold/volcanic outcrops use existing rock art with matching tint and visible grounded
colliders. Chunk-owned decorations are bounded to forty additions per chunk and
unload with it, separate from persistent interactive content.

Twelve named discoveries cover the charter stone, freight rest, Greenward ruin,
pilgrim clearing, pass signal station, clan muster ground, caravan shelter,
Rootwater watch, seed exchange, two bay outlooks and Cinder Vent Watch. Their
inscriptions link geography, households, old wards and current conflicts. Discovery
flags persist even before their quest stage and later count as evidence. Two named
roadside residents—Eda Ashfield and Lysa Thorneleaf—have existing-cast ties, dialogue
and local camp routines. Peaceful field/rest stops reject ambient hostile territory;
random encounter frequency and ambient spawn probability are reduced.

## 9–12. Highmere, story, dialogue, cinematics and saves

New games follow **The Broken Road → A Charter for the Living → The Eightfold
Blight**. The nine-stage capital chapter carries Aldren's report to Renna,
compares Davin's customs records, hears Mairin, requires the existing nine-stage
Lower Ward evidence/witness story, obtains Yselle's testimony, presents a castle
audience to established Petitions Steward Adria and chooses public/watch report
oversight. It does not invent a contradictory monarch or replace the existing cast.

The regional inquiry now has local briefing, evidence discovery, the original boss
encounter and a return report in each of seven regions, then a Highmere archive
return and Aldren's original conclusion. Original boss/objective IDs and boss
rewards remain. There are 30 regional objectives, not 30 new combat waves. Two
new finite/skippable camera presentations cover the charter audience and the
regional return. Existing arrival/Lower Ward/guard/royal presentations remain.
Capital ambient dialogue acknowledges the charter and its chosen accountability.

Quest reconciliation now resolves chapter dependencies to a bounded fixed point.
One event cannot consume multiple ordered objectives in the same quest; rewards
issue once. The journal/compass can follow a required subquest instead of pointing
nowhere. Pending unseen objective presentations are reconstructed at load.

Save version/key remain unchanged. Completed legacy regional runs grandfather
new narrative objectives/charter without reissuing rewards. Old active runs retain
boss progress; completed regional combat stages grandfather their associated
brief/evidence/report steps. Their capital chapter may coexist with the already
active regional inquiry—an intentional compatibility exception to new-game order.
Omitted cosmetic infill records no longer invalidate a whole save. Players saved
on newly authored water/lava seek nearby valid ground before falling back to the
starter spawn; foundation repair and all vitals/progression are retained.

## 13. Principal files changed

- Startup: `scripts/offlineShellPlugin.ts`, `vite.config.ts`, `public/sw.js`,
  `public/manifest.webmanifest`, `index.html`, `src/main.tsx`,
  `src/utils/appStartup.ts`, `src/components/GameCanvas.tsx`, `src/utils/save.ts`.
- Geography/assets: `src/data/{worldLandscape,roadRoutes,rivers,art,content,
  wildernessSites,roadResidents,npcs,settlements}.ts`; `src/game/systems/
  {WorldGenerator,TerrainBaker,sceneryPlan,ChunkManager,EventDirector}.ts`.
- Weather/UI: `WeatherSystem.ts`, `DayNightSystem.ts`, `WorldScene.ts`,
  `gameStore.ts`, `MiniMap.tsx`, `RegionalMap.tsx`, `PausePanel.tsx`, `styles.css`.
- Story: `src/data/{mainStory,quests,cinematics}.ts`,
  `src/game/systems/{questProgress,questNavigation}.ts`, `src/game/types.ts`.
- README, progress notes and this report.

## 14. Incomplete and unverified

**No tests, type checks, builds, app/browser launches, gameplay simulations or
benchmarks were run.** Source tracing and source-image inspection are not runtime
verification. Cold/offline/native relaunch, worker updates, persistence migration,
all land/bridge/camp placements, weather rendering/audio, quest completion and
native/mobile performance still require explicitly authorized verification.

True elevation/cliffs, dedicated lava art/shaders, falling logs, water simulation,
frozen ponds, simulated migration/overhunting, moving inter-town caravans, accessible
interiors, more unique regional architecture and complete profession animation
remain incomplete. The two roadside residents are local field-camp characters,
not an inter-town caravan simulation. Physical controllable ships remain the
later milestone needed for normal continuous travel to island quest regions;
local-development shrine exploration is retained, not presented as a ship system.
