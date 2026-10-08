# Character, combat and world continuation — 2026-10-08

Implemented in the existing React/TypeScript/Phaser/Zustand repository. No new
engine, dependency, disconnected region scene or save storage was introduced.
This supersedes the outer-wall and map limitations in earlier repair notes.

## Implementation report

1. **Character animation:** hero source dimensions are reconciled with the
   supplied 2172×724 side-walk/idle sheets. Uniform strip scaling and shared
   ground anchors preserve physical proportions. Walking animation rate follows
   actual velocity; brief acceleration/deceleration replaces abrupt ordinary
   movement changes. Standing preserves facing instead of always turning front.
   Dash and skill movement retain their deliberate immediate motion.
2. **Wolf:** the replacement walking sheet has six independently measured alpha
   rectangles and a common source ground line at Y=510. Its bounds differ from
   attack, so the walk no longer reuses attack crops. A consistent 0.22 scale
   retains the adult wolf silhouette without clipping its legs. Existing idle,
   hurt and death clips keep their own geometry. Side-facing wolf artwork mirrors
   left/right; unavailable front/back clips are not fabricated.
3. **NPCs and monsters:** ordinary movement eases velocity, NPCs slow near final
   destinations and continue through intermediate route corners. Formation
   followers correct phase with bounded velocity rather than resetting their
   physics positions every frame. Enemy pursuit/wandering checks upcoming
   occupancy and clear paths. Hurt cancels pending attacks; attack animation
   timing follows windup/recovery. Visible actors retain schedules, dialogue
   pauses and the existing streaming ledger; off-screen citizens are still frozen.
4. **Target indicators:** eligible visible enemies have overhead indicators;
   the selected enemy gets stronger gold marking and a ground ring. Eligibility
   checks life, range, line of sight and night visibility. Clicking/tapping an
   enemy selects it; invalid/unloaded/dead selection clears. Automatic skill
   acquisition uses the shared nearest-eligible rule. Manual highlighting does
   not override Azure's requested nearest-enemy acquisition.
5. **Azure Cleave:** releases an animated blue slash after preparation, aimed
   at the nearest eligible enemy within 620 logical units. The wave travels at
   620 units/second, uses swept/substepped collision, stops at solid obstacles,
   damages on actual contact once and then disappears. Without a target it
   follows facing. Cast completion does not prematurely delete an airborne wave;
   cancellation, respawn and teardown do clean it up.
6. **Skyfall Slam:** chooses a safe landing near a target within 360 units, or
   a short directional fallback. A visible 430ms travel arc raises the actor
   above a ground shadow before landing effects and the existing 150-unit impact.
   Landing/path checks respect terrain and solids. Obstruction stops ground
   travel safely rather than teleporting through scenery. Damage remains at
   impact; existing stamina, cooldown and progression calculations remain.
7. **Other combat:** Crescent Flurry retains ten full-circle damage pulses with
   four rotating visual arcs per pulse. Crown Rally retains its heal/defense
   behavior. Sword overlays, skill sprites, hit reactions and wolf attack/leap
   visuals remain tied to the supplied artwork and existing combat timings.
8. **Maps:** tapping the compact minimap opens an expanded regional terrain map
   with streets, defenses, destinations, quest and player heading. Its World Map
   control opens the separate illustrated **Merdnona** atlas. `M` / the HUD World
   Map button opens that atlas directly. Full-map zoom and scrolling keep image
   and all pins in one positioned container; touch and keyboard buttons remain.
9. **Settlement markers:** source-pixel survey anchors replace independent
   percentages. A cached piecewise-affine control mesh projects the moving player
   and town pins into the same atlas space. Pins remain aligned through resizing
   and zoom. The painting is interpretive geography, not a surveyed terrain map;
   the regional map remains authoritative for actual local routes.
10. **Cibar Plains:** an inland Druganwoods settlement with seven building lots,
    a grain square, irrigation lane, field-access paths, two agricultural parcels,
    orchard, shrine and a connected road from Deepford. Five named residents
    have identities, family/history, roles and routines. The eight-stage *When
    the Water Stops* story mixes inquiry, inspection, three distinct fitting
    caches, delivery, a public/cooperative decision, pump repair and reporting.
    Repair/choice flags persist and affect subsequent dialogue/pump appearance.
11. **Settlement perimeters:** all twelve settlements have connected six-sided
    enclosure definitions. Horizontal and original rising/falling diagonal wall
    sprites follow their actual perspective—no rotated fake vertical walls.
    Road intersections and river/harbor ports subtract explicit passages.
    Highmere has unrotated north/south outer gatehouses plus its royal precinct;
    other orientations use connected open passages, not sideways gate art.
    Corner towers and entrance posts have grounded footprints. Wall collision
    follows continuous visible curtain seams and includes analytic path checks.
    Shared supplied stone pieces are used, not newly invented regional wall art.
12. **Navigation/environment:** approach roads extend through the new enclosure
    instead of disappearing at old building-survey bounds. Building placement
    reserves streets, full visible silhouettes, fields, NPCs and shrine courts
    before frontage/decorations. Bridge deck corridors and separate foreground
    rail layering from the preceding Highmere pass remain. Creature exclusions
    cover the entire enclosure and buffer; legacy creature position repair now
    seeks positions beyond the enlarged perimeter without resetting health or
    deaths. Boss IDs/rewards remain while invalid authored sites move outside
    settlement protection. Night-only environmental lights remain; no player
    glow is restored.

Highmere retains its expanded 5600×5200 building survey, 34 structures, connected
wards, six marching knights, three multi-stage stories, finite/skippable story
presentations and the peaceful town/idle health recovery introduced in the
preceding slice. It now has 34 named residents including the outer gate guards.
Oakmere's cast and original quest/boss progression remain. Added optional story
fields and quest defaults retain save version 4 and its existing storage key;
render actors and temporary selection/projectiles are not saved.

## Main changed files

- Assets/presentation: `public/assets/enemies/gray_wolf/manifest.json`,
  `src/data/{art,animationPacks,activeSkills}.ts`,
  `src/game/scenes/{BootScene,WorldScene}.ts`,
  `src/game/entities/{Player,Npc,Enemy}.ts`.
- Combat/movement: `src/game/systems/{locomotion,TargetingSystem,PlayerSkillSystem,
  DayNightSystem,questNavigation,creaturePlacement}.ts`.
- World/content: `src/data/{mapSurvey,towns,roadRoutes,settlementProfiles,
  settlements,settlementDefenses,fortifications,capitalResidents,cibarResidents,
  cibarQuests,npcs,quests,content}.ts`, `src/game/systems/WorldGenerator.ts`.
- Maps/UI/persistence: `src/components/{RegionalMap,MapPanel,MiniMap,HUD}.tsx`,
  `src/game/systems/worldMapProjection.ts`, `src/game/types.ts`,
  `src/store/gameStore.ts`, `src/utils/save.ts`, `src/styles.css`.
- Preceding capital/story slice: `capitalResidents.ts`, `highmereQuests.ts`,
  `storyProgress.ts`, `CinematicDirector.ts`, `RecoverySystem.ts`, `BridgeArt.ts`,
  `QuestJournal.tsx`, `CinematicPanel.tsx` and their scene/store integration.

## Unverified and incomplete

**No tests, type checks, builds, browser/game launches or benchmarks were run
for this continuation, as explicitly requested.** Earlier results predate these
changes and do not establish current correctness. Actual gameplay, parcel
packing, wall seams/gate collisions, map calibration, formation spacing,
projectile/leap timing, reload behavior and desktop/native-mobile performance
still require permission-based verification.

Four-direction wolf actions, additional directional idle/skill artwork,
occupation-specific training animations, differentiated regional fortification
assets, completed shops/interiors, off-screen population simulation, physical
ships/coastline authoring and broader systemic economy/ecology remain incomplete.
Formation/cutscene motion uses existing walk art, not fabricated training frames.
Expanded flank courts are enclosed space rather than a claim of fully populated
new urban districts. The regional map currently samples terrain when its cached
512-unit origin changes; mobile cost has not been measured.
