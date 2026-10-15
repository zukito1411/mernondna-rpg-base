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

Follow-up source fixes keep the night mask in world space and refresh it after
respawn/travel, expose the quest HUD toggle on mobile, and restrict the boss HUD
to deliberate selection or a hit on the current target. Campaign placement no
longer rewrites combat stages as report conversations: full reserve patrols use
validated clearing recovery, persist replacement homes/stations, and retain
their quota and defeat records. Passed legacy report stages are grandfathered
without repeat rewards; current partial hunts remain partial. These follow-up
changes have not been tested or built.

Focused quest, navigation, story, save and release-data unit checks, plus the
application/configuration and test TypeScript checks, were run after the user
requested verification. No production/APK build, game launch or automated
browser check was run; this is not a verified APK release.

PC/Android gameplay still needs to confirm wave placement/approaches, room
collision and routing, directional skill/weapon effects, touch interaction,
leaving/re-entering, death, save/reload mid-event, skipping introductions,
signals after streaming, NPC reactions, and return to ordinary ambient spawning.
Recheck existing dragon ground/flight rendering with the preserved cinematic code.

All 43 currently authored combatants have an identity-matched combat profile:
human guards/roadwardens, both hunter models, sword travelers, smiths, elven
pike sentries, and the five regional household officer variants. These use
dedicated four-direction complete-body attacks. Original walking source files remain;
seven base families now use dedicated contact/passing walking sheets. Regional
officers use their own five event-only gaits. The huntress
and male hunter release visible, pooled non-homing arrows from their bow hands,
with swept collision, wall occlusion and interior-aware depth. Nearby marked
combatants are all eligible, including marching guards. Each defender has an
independent target and cooldown; eight pooled arrows and 200ms decision ticks
bound active work without a global two-attacker queue. Civilians remain noncombatants. Escorts temporarily keep
their escort duty. Helpers choose clear approach positions, face their
opponent, and apply a single small hit on the strike/release frame. Each hit deals
2.5% of enemy maximum HP before defense, no more often than every 2.3 seconds.
Defenders attack unwounded event enemies too, favor less-contested targets,
reserve spaced approach positions, and sidestep crowds within the event arena.
There is no lifetime damage ceiling; they can finish event enemies through the
normal saved-wave defeat path, without granting extra kill rewards. Their hits
do not use player luck, select the player's target or stagger-lock enemies.
Paused/cinematic actions and arrows are cancelled without delayed callbacks.
Event cleanup restores NPC presentation and requests a checked walk back to the
post; marching guards route back to the moving formation instead of snapping.
Only the original two combat sheets prepare at boot. Additional families load
on demand through the shared loader into a six-family cache, never evicting a
sheet used by an actor or returning guard. Unreferenced sheets are released
after returning guards finish; packed atlases stay below 2048px per side.
Source images are released after preparation. Isolated subjects, padded GPU frames, calibrated body dimensions
and separate boot registration prevent neighboring-pose sampling. Original
walking/idle files, portraits, NPC/quest IDs and regional identities are unchanged.
Before the independent-targeting/size follow-up, focused verification passed application/test TypeScript checks, three
sprite-isolation unit cases, and two real-WebGL browser checks (desktop and touch
2x-density). All 21 atlases were reviewed with correct UVs and clear edges;
43 real NPCs passed four-direction walking, 172 attacks, impact/completion and
collision-foot registration checks. Elven guard source-row bleed was corrected.
Full-world startup timed out in a separate check, so complete gameplay and actual
Android remain unverified. Review first-use loading, indoor routing, return-to-post
and pause/skip/death/exit manually. No production/APK build ran. Records/evacuation
remain battle and work interactions, not civilian-death simulations.

Release verification of the independent-targeting and size follow-up passed:
test/application TypeScript, the production web build, 89 scoped regression
cases, two independent-defender logic cases, and both desktop/touch WebGL
reviews across 21 atlases and all 43 combatants. The defender cases cover
untouched enemies, distributed targets, damage beyond the old cap, finishing
enemies, pause and event cleanup. Rendered pose sheets were inspected again.
Physical Android and complete-world playthrough remain unverified locally;
the repository workflow performs APK packaging and publication after push.
Walking references match idle silhouettes; combat references match body height
without counting raised weapons. The existing elven size multiplier now applies
to combat too, with its idle helmet-to-boots reference rather than pike height.

The 2–3-hour main story and 1–1.5-hour optional-story figures remain design goals.
They have not been measured or established by this change.
