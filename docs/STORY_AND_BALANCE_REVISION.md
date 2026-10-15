# Story, input and progression revision

Campaign continuation: see `LIVING_CAMPAIGN.md` and `main-storyline.md` for the
current narrative authority and playable story events. The earlier murder plot
does not apply to Leigneron's parents: they died saving people during a flood.
The balance/input formulas documented below remain in force.

## Scope and inspection limits

Implemented against `1ddc238` (the repository version pulled before this task).
No tests, type checks, builds, game launches or browser simulations were run.
Source sheets were visually inspected, including actual dimensions and corner
alpha. Rendered GPU registration, touch behavior and combat pacing still need
manual confirmation; this is not a claim of a verified release build.

## Changed systems

- `BootScene.ts`: isolated connected subjects for the ranged orc's 6×4 throw
  and hurt/death boards. Copy only owned RGBA pixels into padded atlas cells;
  use the existing neutral actor height, foot-mass registration for standing
  poses, and ground registration for fallen poses. Walking and other species
  are untouched. Existing 420ms throw windup and directional frame order remain.
- `uiInputGuard.ts`, `App.tsx`, `gameStore.ts`: pointer ownership across UI
  transitions, separate multi-touch ownership, double-click/repeated-key
  suppression, 120ms dialogue/travel transition debounce, and UI/world event
  isolation. Fresh gestures are not subject to a long universal lockout.
- `storyRevision.ts`, `campaignWorld.ts`, `quests.ts`, `cinematics.ts`,
  `storyDialogue.ts`: connected murder/witness inquiry, illegal household
  transfers and adoption, Cibar's murder evidence, sabotaged beacon, divided
  clans, buried miners, captive passengers, refugee reunions and burned
  chainworks. Leigneron's family history leads to Varkhul as the final boss.
  Choices affect later speech and scene variants, not invented new combat
  systems. Existing escort, investigation, training, puzzles and cutscenes stay.
- `npcConversations.ts`, `npcs.ts`, `wardResidents.ts`,
  `settlementResidents.ts`, `castleResidents.ts`: individual and regional
  conversations, occupations, domestic concerns and humor. Appearance,
  portraits, schedules and accessible story placements are unchanged.
- `progression.ts`, `CharacterPanel.tsx`, `enemyTiers.ts`, `Enemy.ts`,
  `Player.ts`, `WorldScene.ts`, `types.ts`: shared balance and reward rules.
- `save.ts`: schema 6 under the existing `mernondna-save-v1` storage key.
  `content.ts` now translates clue names after all campaign content is added;
  dialogue, clues and scenes use current NPC display identities.

## Player formulas

All allocated attributes cap at 40; maximum player level is 30.

| Attribute | Effect per allocated point |
| --- | --- |
| STR | +3.5% weapon damage, additive with passive damage bonuses |
| VIT | +10 maximum HP |
| AGI | +2 stamina; weapon/art recovery time −0.6%; movement +1% only through 20 points |
| EVA | 1% evasion per resolved enemy hit, maximum 40% |
| LUK | 0.625% chance of a 1.5× critical hit, maximum 25%; +1% earned XP and gold |

Base HP and stamina remain 100. Passive HP/stamina bonuses remain additive.
Movement talents add up to another 10%; Battle Rhythm adds 6% cooldown
reduction, for a minimum combined recovery multiplier of 0.70 at AGI 40.
Actual enemy hit areas must still connect before the EVA roll. Luck does not
raise the existing 10% boss-weapon drop chance. Reward bonuses apply once to
combat, quest, one-time loot and duplicate-trophy salvage income.

Each level after the first awards 3 attribute points and 1 learning point:
87 attributes and 29 learning points at level 30. Attributes are competing
build choices, not a promise to maximize all five. Twelve passive talents cost
22 points total; the three learnable combat arts cost 7. The full catalog costs
exactly 29. Late passive unlocks extend through levels 24, 26 and 28; learnable
arts retain levels 18, 20 and 22. Original automatic art unlocks are preserved.
Total XP to level 30 is 17,400; further XP cannot grant extra levels or points.

## Enemy formulas

Regional wilderness floors are Trandum 5, Narenthil 10, Nardorous 15,
Rindass 20, Druganwoods 25, Portquill 30, Frostlands 35 and Darkav 50.
Higher existing settlement-route tiers still apply. Elite boatswains,
spear raiders and alpha wolves stay +5 above their local regular members;
bosses stay +10. Then add the global player-level bonus:

| Player level | Additional enemy levels |
| --- | --- |
| 1–19 | 0 |
| 20–24 | 5 |
| 25–29 | 10 |
| 30 | 15 |

Live actors update when a threshold changes, preserving their health fraction.
Reloaded actors use the same tier rules and existing saved `hpMax` ratios.
For `s = max(0, enemyLevel − 5)`:

- HP = authored HP × `(1.20 + 0.19s)`.
- Attack damage = authored damage × `(1.15 + 0.10s)`.
- Defense absorbs `min(45%, 4% + 0.6%s)` of player hit damage.
- Movement = authored movement × `(1 + min(12%, 0.3%s))`.
- XP = authored XP × `(1 + 0.065s)`, with a 1.25× boss factor.
- Gold range = authored range × `(1 + 0.025s)`.

Authored species tactics, warnings, attack cadence, collision, boss identities,
return timers and dragon flight/retreat mechanics remain intact. Rewards from
enemies more than five levels below the player lose 8% per extra level, down
to 15%; owned boss summons pay another 20% multiplier. Global difficulty does
not compound repeatedly into an already-scaled definition.

## Quest availability and save handling

Six regional clear stages and the opening watchtower blockade now require 15
actual persistent enemies each. The blockade's one-time 320 XP milestone puts
the opening rescue, preparation and patrols before Varr instead of requiring
unrelated grinding to approach the first boss.
Reinforcements are spread across small encounters on accessible terrain near
their existing story sites. The live-hostile cap remains 16. No repeat-death
credit, new per-frame world scan or respawn requirement was added. The tutorial
rescue remains three enemies; the flagship remains five to fit its actual deck.
Streaming reads objective quotas rather than obsolete 3/5-kill constants.
Authored mission groups share the existing obstruction-recovery path. Spider
placements still require off-road forest, and thornlings remain near blighted
sites; ambient habitat restrictions are unchanged.

Stable quest, objective, content and NPC IDs are preserved. Version-5 saves
with completed old 3/5-kill stages receive the new completed quota; partial
counts remain actual counts and additional persistent actors supply the rest.
Completed chapters do not restart. Existing flags/choices are retained, even
when their legacy names still mention grain or irrigation. Already finished
chapters are not replayed to force a new story interpretation on old saves.

Old characters above level 30 are capped without removing their inventory,
gold, consumables, boss history, world ledger, shrine unlocks or story flags.
Legal allocations are retained. An attribute build exceeding the new cap or
87-point budget receives a free full attribute respec. Learned usable arts
are prioritized, then talents retained in prerequisite order as the new level budget permits; anything
outside that budget becomes learnable again, and invalid loadout entries are
cleared. Remaining points are recomputed, not silently accumulated beyond the
new cap. Vitals are bounded to the new maxima. Existing last-good and
unreadable-backup recovery behavior remains in place.

New story consequences use existing dialogue and cinematic variants. There
are no newly simulated courts, refugee crowds or off-screen political battles;
those outcomes are narrated by the existing regional cast. Visual staging and
the stronger endgame economy have not been playtested during this task.
