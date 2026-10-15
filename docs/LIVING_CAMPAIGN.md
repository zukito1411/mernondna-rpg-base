# The living roads campaign

Story authority: `main-storyline.md`. Implementation continues the existing five
acts, stable NPC/boss identities, level-30 balance and camera-aware streaming.

## What changed

| Story beat | Playable change |
| --- | --- |
| Oakmere | The rescued carter's return leads to a warning bell and three small raider waves on the village approach. Residents react and capable guards assist. |
| Highmere witness | Finding Thomas triggers the false-watch ambush before his existing escort. |
| Narenthil | A surviving pilgrim is physically present beyond the cleared approach, using the approved elven model; her testimony links the Warden's anger to the stolen binding. She returns home offscreen after rescue. |
| Nardorous | Protect the pass beacon, then interact and remain beside it to light the signal. Its existing fire artwork stays lit after completion/reloading. |
| Red Mesa | Krag's two bounded warbands attack the clan meeting approach before the well agreement. Peaceful orc residents remain allies. |
| Frostlands | Set the recovered shore signal: a quiet, noncombat event after the larger bay hunt. |
| Darkav | Fight the chainworks spirits and open the survivors' route before retrieving the charge book. Later, secure a separate route for the final repair crews. |
| Returning to Highmere | Hired men attack inside the Royal Archive. Defeat both waves and secure the records before Walter's confession/arrest scene. |
| Optional adventures | Alice's poachers; Willowcross's disputed guardianship (watch/diplomacy or confrontation); the missing soldier's letter; Tidewatch's betrayed sailor and his daughter's right to the truth. |

The compulsory cottage conversation was removed from the opening rescue path;
the existing cottage NPC/history remains available. Cibar's existing murder
inquiry remains optional rather than blocking Bruni's main-story revelation.
Existing larger 15-enemy operations, bosses, ship boarding and the final dragon
battle remain. Varkhul survives and retains the existing repeat-battle timer.

Leigneron's parents definitively died saving families during a flood. Prior
dialogue, evidence and cinematics claiming their bridge was deliberately
sabotaged have been corrected. No hidden royal inheritance or resurrection is
introduced. Walter remains responsible for the ward-iron conspiracy, not for
personally murdering Leigneron's parents.

## Integration and lifecycle

- `adventure.ts` authorizes finite encounters only at the current quest stage.
  Optional and main events are selected by location, not a global first-match
  order that could starve a nearby side quest.
- `StoryEncounterSystem` creates ordinary `Enemy` actors through WorldScene.
  It does not replace AI, targeting, attacks, equipment, skills or damage.
  Waves contain at most three living enemies, share the existing global cap,
  validate separation/terrain/geometry, and retry invalid placements instead
  of forcing actors into furniture or the player.
- Ordinary creatures are captured/unloaded during a story battle; their normal
  content admission resumes afterward. Settlement safety remains unchanged for
  ambient enemies. Only owned story actors receive the bounded exception.
- Defeated slots live in saved story flags. Temporary actors are disposed on
  leaving, death or shutdown, and unfinished slots can return. There is no
  per-kill XP/gold for repeatable event actors: the quest milestone pays once.
- Working requires a fresh interaction, proximity and standing still. Moving,
  damage or changing context interrupts it. Both keyboard and mobile use the
  existing interaction control and quest marker.
- Existing rooms retain paused world physics. Player and Enemy feet advance
  through the same floor/furniture constraints with small swept steps. A bounded,
  cached room route search supports obstructed approaches. Only authorized room
  encounters enable attacks and skills. Exit/death cleanup restores outdoors.
- Enemy warnings, health labels, skill effects, projectiles and weapon poses use
  interior depth offsets. Room contact shadows reuse the existing shadow canvas;
  owned images remove their update listeners on destruction. Idle-only regional
  NPCs do not slide around pretending to have walking frames.
- Dialogue completion/choices now advance the conversation's own quest, avoiding
  a single Halla conversation silently consuming both a main and a side objective.
- Existing cinematic preloading, viewport streaming and skip restoration remain.
  Event introductions can be skipped without completing the battle. During an
  event intro, unrelated ordinary bosses deliberately remain suspended with the
  ambient population; subsequent boss scenes use normal cinematic readiness.
- Older saves backfill newly inserted event/pilgrim stages only behind saved progress.
  New-game saves include the revision flag. Inventory, balance and the save
  storage key are unchanged.

## Limits and required runtime review

Focused quest, navigation, story, save and release-data unit checks, plus the
application/configuration and test TypeScript checks, were run after the user
requested verification. No production/APK build, game launch or automated
browser check was run; this is not a verified APK release.

PC/Android gameplay still needs to confirm wave placement/approaches, room
collision and routing, directional skill/weapon effects, touch interaction,
leaving/re-entering, death, save/reload mid-event, skipping introductions,
signals after streaming, NPC reactions, and return to ordinary ambient spawning.
Recheck existing dragon ground/flight rendering with the preserved cinematic code.

Guards provide capped, nonlethal assistance rather than a second full NPC combat
simulation. Civilian movement uses existing walking art where available; other
residents use alert barks. Records/evacuation are resolved through the battle and
interaction, not destructible-building or civilian-death simulations. No new NPC
models or replacement skill icons were introduced.

The 2–3-hour main story and 1–1.5-hour optional-story figures remain design goals.
They have not been measured or established by this change.
