# Content Schema Rules

## Capital story slice additions

NPC timetable periods may include a local `location`; the current actor walks
between those anchors through `npcRoutes.ts`. Optional faction/family,
connections, homeLocation, personality and consequences accompany new named
characters. `formation` selects the shared western watch circuit, not random
roaming. Off-screen routines are still frozen.

Quest objective types additionally include `investigate`, `deliver`, `choice`,
`puzzle`, `train` and `escort`. Objective dialogue and explicit choices provide
ordered story context. A wrong puzzle choice has `correct:false`; narrative
choices set separate persistent flags. Interactables may supply `questTargetId`,
`questEventType` and `repeatable` so early inspection does not permanently lock
a later quest. Never invent events that skip the next objective.

New prop texture `royal_walls` packs only the five compatible source sections.
Its visible curtain geometry is authoritative in `fortifications.ts`; no
independent rotated rectangles are created. Optional story flags, choice records
and tracked quest ID extend existing save v4 with defaults for older saves.

The current TypeScript interfaces live in `src/game/types.ts`.

## NPC

Important NPCs must populate these concepts even if the interface later grows:

```ts
{
  id,
  name,
  title,
  townId,
  role,
  spriteFrame,
  spriteTexture, // optional: npcs (default), npc_guard or npc_woman
  worldOffset,
  weaponId,
  schedule,
  relationshipToLeigneron: {
    kind,
    trust,
    summary
  },
  dialogue,
  questIds,
  combatant
}
```

Future additions should include faction, family graph, disposition tags, routine locations, mortality policy, companion capability, profession inventory, voice style and story flags.

`spriteTexture` and `spriteFrame` select art only; they must not change an NPC's identity, quest ID or saved trust. See `ART_GUIDE.md` for measured sheet regions and logical-versus-texture dimensions. Prop scales are logical world scales, not raw texture-pixel scales. Solid prop footprints are separate from visible roofs and atlas padding.

Settlement ground and placements are now authored together in `src/data/settlements.ts`: parcels, connected streets, building lots and plantings. `landmarks.ts` derives crop fields and `content.ts` derives stable building/tree/crop IDs. Optional prop `label` supplies a building caption, not a shop implementation. Preserve existing IDs when editing layouts; check door/road clearance, NPC visibility and field access using the settlement tests. See `SETTLEMENT_DESIGN.md` for the spatial design rules and prototype limits.

Building lots may select an `appearance` (`world_buildings` texture/frame) independently of their original foundation frame. Derived solid content receives an explicit `footprint` in world units; the runtime consumes it unchanged. Replacing artwork must not resize gameplay foundations, move access streets or regenerate IDs. Prop/interactable `texture` also accepts `world_buildings`. None of these presentation definitions belong in persisted `ContentState`.

## Settlement

Current town definitions include identity, region, world position, map position, services and tags. Add economy, government, population, security, prosperity, architecture set, law profile and local event pools before adding dozens of settlements.

## Weapon

Weapon definitions contain damage/reach/timing/stamina data. Future weapon content should reference reusable movesets rather than hardcoding animation logic per item.

## Enemy/species

The current enemy definition is combat-oriented. Split future wildlife/monster content into:

- `SpeciesDefinition` — ecology/habitat/population/behavior
- `CombatArchetype` — stats and combat brain
- `CreatureVariant` — visuals, loot, regional variation

## Quest

Keep quests data-driven and objective-based, but do not make every narrative problem a checklist. Add conditions, branches, world-state predicates, dialogue choices and consequences as the story layer matures.

## Streamed content

`ContentDefinition` binds a stable ID and world position to an existing NPC, creature, settlement, prop, harvestable, loot container, dungeon entrance or other interactable. IDs must never depend on actor creation order. Settlement building IDs are deterministic; authored NPC/boss IDs reference the existing content tables. Dynamic creatures receive `spawn:<sequence>` IDs persisted with their definitions.

`ContentState` stores logical position plus optional health, defeat, use or trust values. Engine actors are disposable; unloading cannot reset these values. Add authored content to `src/data/content.ts` and validate references/positions in tests. New content kinds need one actor adapter, not special-case branches per town/NPC in the world scene.

The Oakmere streaming slice includes a one-time supply cache, berry patch, road marker and sealed cellar site. The cellar is a persistent entrance record only; dungeon interiors are not implemented. NPC daily routines, social graphs, settlement economy and ecology remain later milestones.

Settlement shrines are defined in `src/data/townShrines.ts`. An interactable's
`townShrineId` connects it to a settlement and its safe arrival point. Interacting
attunes that shrine and opens travel to other attuned destinations. Oakmere's
existing shrine ID and Highmere's shrine lot ID remain stable. Save version 4
persists `unlockedTownShrines`; v1–v3 saves migrate, including previously used
shrines. The active shrine menu/origin, pending travel request and request source
are transient. Full-map settlement pins open a confirmation prompt and may
target any attuned shrine. A request from the shrine menu additionally validates
its physical origin. The scene streams the arrival area and selects an
unobstructed landing without changing health or stamina. Local Vite play permits
unattuned destinations without mutating unlocks; production builds keep the rule.

Optional NPC `patrolRadius` constrains local roaming. Orin's keeper routine is
limited to the visible shrine forecourt; older obscured saved positions are
relocated there while trust and story state are retained.
