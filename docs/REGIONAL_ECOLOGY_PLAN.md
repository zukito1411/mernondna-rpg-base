# Regional monsters, pirate ship and ambient wildlife — implementation plan

Planning only, based on the current repository on 11 October 2026. The user uses ChatGPT Plus and intends to start after a full usage reset, complete tested milestones, commit them when requested, and resume after later resets. This turn authorizes updating the plan only. Resume from this document after the reset and recheck the working tree before implementation.

## Intended result

Give each region recognizable creatures, believable habitats and readable encounters. Add a large, boardable pirate ship and pirate crews to Portquill; add fleeting rabbits, squirrels and birds to living habitats. Preserve approved artwork and existing visual effects. New features must pass measured performance, sprite, navigation and save-compatibility checks before expanding the roster.

New creature names below are proposed designs, not claims that they already exist in the lore.

## Findings that determine the design

- `src/data/regions.ts` already establishes temperate farms, elven woodland, alpine passes, orcan steppe clans, dwarven river/mining forests, maritime Portquill, polar islands and volcanic Darkav. `WorldGenerator.getBiomeAt` supplies coast, forest, meadow, wetland, highland, snowfield, dryland and volcanic habitats.
- Ambient selection currently uses the player's region/biome before choosing a nearby spawn point. New placement must validate the region and habitat of the actual candidate point and each pack member, including border cases.
- Wolf encounters alone have coordinated pack identity, alpha roles, shared alerts and complete 4–6-member admission. Other enemies rely on individual spawns and event counts.
- Dynamic spawning currently stops at 16 live enemies and 512 persistent spawn records. Ambient caps vary from 7 to 12. Authored boss activation can bypass the ordinary activation limit: the future budget must reserve room for bosses and summons explicitly.
- Portquill bandits enter through ambient weights, road-ambush events and the generic road spawner. The Salt King also still summons road bandits. Changing one table will leave bandits in the region.
- Tidewatch is the existing harbor town in Portquill. Its travel boats use visual/passage systems; they do not provide a combat deck. Water is not normally walkable and friendly settlements reject hostile spawns.
- Enemy art is largely prepared at boot. Loading every future family this way would grow startup and GPU memory costs. Regional residency needs a bounded loading/eviction plan as the roster expands.
- Current rendered sprite validation exists in `enemyPresentation.spec.ts`, `enemyFootwork.spec.ts`, `enemyAtlas.spec.ts` and `saltKingArt.spec.ts`. Performance instrumentation exists in `renderPerformance.spec.ts` and `nightPerformance.spec.ts`.

## Proposed regional roster

| Region | New enemies | Habitat and encounter design |
| --- | --- | --- |
| Trandum | Hedge goblin scavenger; goblin stone-slinger | Abandoned farm stores and woodland margins, outside inhabited farms and towns. Packs of 2–3, usually two melee and one ranged. Keep existing wolves, boars and road bandits. |
| Narenthil | Blighted thornling; grove spider | Thornlings near corrupted roots/ruins, spiders in shaded woodland and cave mouths. Groups of 2–4. Keep healthy elven gardens and ordinary forest wildlife distinct from blighted areas. |
| Nardorous | Stone crawler | Rocky passes and cave entrances, groups of 2–3. Existing trolls remain mostly solitary; wolves retain their pack behavior. Avoid placing crawlers in every snowfield. |
| Rindass | Orc cleaver raider; orc spear thrower | Krag's hostile raiding warband at disputed wells and outlaw clan-road camps. Groups of 3–5, initially two melee plus one spear thrower. Friendly orcan townspeople and guards remain friendly. |
| Druganwoods | Rootgnawer; marsh crawler | Rootgnawers around infested mine approaches; crawlers along wetland banks. Groups of 2–3. Wraiths belong in haunted wetland/ruin sites, not every forest clearing. |
| Portquill | Cutlass deckhand; harpoon thrower; heavy boatswain; reef crab | Mixed pirate crews on the flagship and outlaw coast, normally 3–5; deck encounter 4–6. Crabs on appropriate sandy/rocky shores in groups of 2–3. Replace Portquill road-bandit encounters with pirates. |
| Frostlands | Frost wolf; ice crawler | Frost wolves on snowfield hunting routes, crawlers around ice caves and stony ice margins. Small hunting groups. Frost wolves can reuse the approved wolf anatomy in a separately validated regional presentation. |
| Darkav | Cinder hound; ash cultist | Hounds in cooler ash wastes, cultists at abandoned forge/vent shrines. Packs of 2–3 or small patrols. Never place ordinary land creatures in lava. Preserve Varkhul and appropriate existing trolls. |

Habitat definitions should include preferred region/biome, terrain exclusions, time preference, encounter weights, pack size/composition, faction, home/leash behavior and audio family. Monsters do not appear simply because a region has an empty enemy slot. Large predators and trolls are mostly solitary; pack species and organized crews use groups. Night changes species/activity weights within the same overall budget.

## Portquill pirate flagship

1. Author one large moored pirate flagship at an outlaw anchorage near the harbor mouth, outside Tidewatch's protected civilian area. Keep the friendly quay, docking boats, ferry channel, travel landing and patrol routes clear.
2. Size the ship against the player/crew's actual rendered height. The deck needs room for the player, 4–6 pirates, melee separation, ranged positions and turning around the mast. Validate space with rendered actors before accepting final ship art.
3. Give it a physical gangplank and exact deck walkability. Use authored deck/gangplank polygons, railing boundaries and a small deck navigation graph. Hostile occupancy is allowed only inside the explicit encounter footprint; no global water-walking or settlement-protection relaxation.
4. Split hull/deck, rear rigging and front rails/mast occlusion into a small set of layers. The player and pirates visibly stand inside the hull, on the deck, with consistent feet/depth and deck contact shadows. Ranged attacks respect rail and mast geometry where appropriate.
5. Start with 2–3 cutlass deckhands, one harpoon thrower and an occasional boatswain. The encounter has finite crew slots, home positions, alerts and retreat/leash behavior; defeated crew cannot immediately refill while the player is aboard.
6. The collision deck stays moored. Sail motion, water motion and restrained visual details can animate independently; visual movement must not make feet drift off the deck. Moving combat ships would require a separate follow-up design.
7. Keep the Salt King's existing cave fight and quest IDs initially. Current story and regional guidance explicitly send the player to his cave. The flagship is his crew's supply/boarding outpost, not an unannounced boss relocation. Replace his bandit summons with pirate crew. If a later decision moves him aboard, update quest guidance, dialogue, cutscenes, lair navigation, respawn and save migration together.
8. Remove Portquill bandits from ambient weights, event definitions, region-aware road encounters, authored encounters and boss summons. Migrate surviving saved coastal bandit records to appropriate pirate records while retaining IDs, damage/death state and reward/progression history. Preserve bandits in their other regions.

## Orc melee and throwing-spear combat

- Melee raiders use complete cleaver/shield poses and readable approach/windup/recovery. Spear throwers keep distance behind the melee line and cannot shoot through scenery.
- Build one shared projectile system reusable by spears, pirate harpoons and later goblin stones. Use real projectile sprites with clear release frames, committed aim, finite speed/range/lifetime and swept collision so fast throws cannot pass through thin walls.
- Spear throwers have visible anticipation and recovery, limited retreat and close-range fallback; they do not endlessly kite the player or track targets after releasing a spear.
- Preserve enemy stagger cooldown and Crescent Flurry suppression. Stagger interrupts unreleased throws, and skill cancellation/death/unloading clears pending attacks. Test the full immobile Flurry window against mixed melee/ranged packs and keep protection behavior coherent with the existing skill rules.
- Distinguish successful hostile hits from misses/blocks. Assign appropriate orc vocals, cleaver sounds and spear release/impact cues; do not use dragon/boar audio as a generic new-family fallback.

## General encounter packs

- Generalize wolf-only identity into persistent encounter/group IDs with configurable members and roles. Preserve wolf alpha/flanking behavior through that change.
- Reserve capacity and valid separated positions for the entire group before spawning it. A blocked site or insufficient capacity skips the encounter, rather than placing members on top of one another or creating malformed partial packs.
- Cache membership and role assignments. Shared alerting and pursuit stay within home/leash bounds; do not aggro the whole region when one member spots the player.
- Admission accounts for ambient enemies, road events, authored packs, bosses and summons. Keep a conservative initial total of 16 live hostile actors, with explicit boss/minion reservations. New variety shares this budget.
- Stream group records without resetting damage, quest kills, rewards or respawn history. Avoid duplicate leaders/members after unloading, loading or saving. No new enemy materializes next to the player in the middle of combat.

## Ambient wildlife

Use a separate lightweight `AmbientWildlifeSystem`; decorative animals have no combat AI, health bar, loot, quest rewards, saved spawn records or general physics bodies.

- Register suitable tree/cover anchors when authored and wilderness scenery loads; unregister on unload. Use a small nearby-cell index, not a scan of all world trees on every update.
- On entering a tree's proximity ring, roll a chance once. Select a loaded destination tree with a clear ground route before spawning. Start outside the solid trunk but behind its visual cover. If there is no suitable destination, skip the event.
- Rabbit: briefly emerges, uses real hopping/running frames, reaches another tree/root/shrub and disappears behind cover.
- Squirrel: emerges from a trunk, runs to another tree, then uses climbing/hiding frames to vanish into trunk/canopy cover.
- Bird: occasionally appears perched or feeding near cover. Approaching triggers a real takeoff and wingbeat sequence, with a smooth departure beyond the visible margin. Add coastal gull presentation for Portquill; do not turn every tree into a bird spawner.
- Ground animals never visibly pop into/out of open terrain. Paths avoid water/lava, blocked foundations, occupied NPC courts, busy patrol lanes and gangplank chokepoints. Daylight/region/habitat affect eligibility; ordinary squirrels/rabbits do not appear in barren lava fields or open sea.
- Initial tuning proposals: 20–30% eligible tree-entry chance; 8–15 seconds between emergence events; 45–90 seconds source-tree cooldown; destination about 200–500 world pixels away; at most four ground animals and two birds. These numbers are profiling starting points, not guarantees.
- Pool the six visual actors. Check triggers about every 100–150 ms, while moving and animating visible animals smoothly each frame. Compute routes at spawn, with bounded recovery if scenery changes.
- Pause appropriately for menus/cinematics and cleanly release wildlife when its cover unloads, on sea passage, hidden tabs or scene changes. Small contact shadows can reuse existing textures; avoid adding a dynamic light or expensive projection for each animal.
- Keep current bird/wind/day and cricket/owl/night ambience. Visual animal events do not each need a sound. Optional chirps/takeoff sounds have distance, volume and global overlap limits, preserving the quiet night mix.

## Boss model decisions

| Boss | Decision | Reason |
| --- | --- | --- |
| Captain Varr | Keep | Existing human bandit captain fits his road/watchtower lore. |
| Moonlit Warden | Keep | The spectral guardian silhouette fits a blighted, moonlit elven grove. No automatic regeneration just because it shares a spirit family. |
| Stonejaw | Keep | The approved large troll model fits an alpine pass-troll. |
| Krag the Iron-Tusk | Replace | Currently a boar, despite being an orcan clan war-chief. Give him a complete armored, tusked orc chieftain model. |
| Rootfather | Planned replacement, confirm full rendered review | Current blue skeletal wraith poorly communicates the rooted mine guardian described by the story. Proposed complete root-and-stone guardian, preserving existing boss/quest identity. |
| Salt King | Keep | The newly generated pirate captain already fits Portquill. Change crew/summons rather than regenerating his model. |
| Frost Wyrm | Replace | Currently a gray wolf, while story dialogue explicitly refers to scales. Use a scaled ground-dwelling ice wyrm with appropriate lunge poses; no flight sequence unless the encounter design actually needs flight. |
| Ashen Seer | Keep | Hooded spectral oracle fits wraith-binding volcanic lore. Review restrained ash/ember presentation if needed; no new full body by default. |
| Varkhul | Keep | Approved ember dragon already fits Darkav. Preserve ground/flight size, breath, attacking model and retreat behavior. |

Validate changed boss body dimensions, attacks, warning area and collision footprint together. Preserve stable IDs, defeat progression, respawn timers and cutscenes. Krag's warband summons can become appropriate orc raiders; Rootfather's existing spirit summons still make sense; Frost Wyrm helpers should be native Frostlands creatures.

## Art acceptance requirements

- Match current detailed fantasy art, full-body proportions and leg/weapon detail. Prototype one neutral pose per family before generating its full set.
- Every hostile family needs consistent directional idle/walk poses plus complete attack, hurt and death. Ranged families need actual windup/release/recovery; animals need their relevant idle/run/hide or perch/takeoff/flight states.
- Never assemble old upper bodies with new legs or substitute drawn line limbs/effects for sprite poses. Ordinary bandit's approved up/down sequence, sizing and cadence remain untouched; its side cycle still passes through its complete neutral pose.
- Use fixed body calibration and ground anchors across all states. A reaching spear, crouch or fallen body must not resize the model or move its collision feet.
- Use subject isolation, padded atlas cells and validated GPU frame coordinates. Inspect full animation loops and every frame at actual game scale, with contrasting backgrounds, all walk directions and transitions into/out of combat.
- Validate weapon placement, sprite containment, foreign-frame pixels, feet/body registration, scale, shadow placement and depth. Recheck the dragon's ground/flight transitions in the regression gallery even when its files were preserved.
- Pack art into compact atlases within measured mobile GPU limits. Crop and upload at preparation/load time, not during movement; release source boards and unload region atlases only when no live actors, corpses, projectiles or retained visuals reference them.

## Performance gates

Proposed initial caps: 16 shared live hostiles including boss reservations, six ambient wildlife actors, eight live enemy projectiles, and bounded impact/corpse/audio pools. Final tuning is based on measurement on the same device/settings, not on promising cost-free additions.

Record a baseline before implementation. Compare the same routes/scenes after each batch: quiet daytime woodland, afternoon transition, dense nighttime settlement, water near the pirate ship, max crew combat, mixed orc pack, wildlife trigger, and camera travel across chunk boundaries. Measure median/p95/p99 frame time, spikes, GPU texture bytes/uploads, draw calls, active bodies, AI decisions, projectiles and sounds. Repeat ship entry/exit and regional travel to check stable counts and memory rather than testing a single screenshot.

Keep visible artwork, lighting, water and cloud/night effects at their existing quality. Reduce offscreen AI frequency, repeated searches, allocations and activation bursts first. Spawn/upload work must be bounded across frames and must not recreate the afternoon/night slowdown. Regional asset residency should keep current/near-boundary families available without loading every future family at startup or causing combat-time decoding spikes.

Headless browser checks catch rendering work and regressions; actual Android profiling is needed later before claiming no phone performance drop. A family or encounter that exceeds the agreed frame/memory budget is held back and optimized before enabling it globally.

## Plus session usage targets

Use GPT-6.1 Sol at Medium as the starting configuration. A session here means a bounded work period using the available Plus allowance, not a promise that a particular milestone fits one reset. A full reset restores allowance; it does not make all tasks cost the same amount. The earlier broad implementation batches are divided below into smaller commit boundaries.

The percentages below are scheduling targets chosen for this project, not measured consumption forecasts or official limits. Only the usage dashboard/user-provided readings establish actual remaining allowance. Do not infer subscription percentages from token counts, tool calls, elapsed time or number of prompts. If multiple allowance windows are shown, use the lowest applicable remaining allowance when scheduling work.

| Session type | Implementation/generation target | Validation reserve | Checkpoint/commit reserve | Unspent safety margin | Typical scope |
| --- | --- | --- | --- | --- | --- |
| Foundation/code | 50% | 20% | 10% | 20% | One self-contained subsystem or migration |
| New art family | 40% | 25% | 10% | 25% | One complete creature family, including corrections |
| Integration/performance | 45% | 25% | 10% | 20% | One encounter integration or focused regression pass |

These targets assume a fresh 100% allowance. If starting lower, reduce scope and keep enough absolute headroom for checks and handoff; do not automatically spend all of the remainder. The first completed code milestone and first completed art family calibrate later session sizes. Image generation/editing is a major uncertainty, so an asset session must not also promise multiple new families and a large AI rewrite.

Session rules:

1. At the start, record the milestone/submilestone, base revision, working-tree state, requested commit/push/build actions and available usage readings if supplied. Re-read only relevant changes since the previous checkpoint; avoid repeating the full project audit.
2. Choose the smallest reviewable slice from the milestone table. Name the exact completion checks before starting. The initial priority is M01, then M02; pirate and orc artwork come in separate sessions after the foundation is verified.
3. Check reported usage after the first meaningful implementation block or completed source board and before another expensive generation batch. If readings are unavailable, keep the planned scope small and record usage as unknown rather than inventing a percentage.
4. Finish implementation at the allocated target and spend the reserved portion on verification and repairs. At about 25–30% remaining, focus on closing the current slice. Do not start another family or major feature at that point. Aim to finish with 20% remaining for code/integration sessions and 25% for art sessions; these are buffers, not hard requirements to abandon almost-finished safe work.
5. Keep only one new creature family in an asset-heavy slice. After two unsuccessful corrections for the same board, review the reference/layout/registration approach before making further generation calls. Never regenerate all approved boards merely because one pose needs correction.
6. If a milestone exceeds the budget, split it into a smaller named submilestone. Complete and validate that slice. Unfinished art remains outside enabled gameplay; do not ship missing animation states, clipped poses, debug ship drawings or unsafe spawn migrations to reach a quota target.
7. Commit only a tested slice when that future task authorizes committing. Foundational changes can be committed independently with future content disabled; experimental art or broken integration is recorded as local unfinished work. Preserve the user's edits and do not blindly reset the working tree to create a clean checkpoint.
8. Write the handoff before finishing. After the checkpoint, stop expansion work and resume with the next user request/reset. An unused reserve is acceptable; it protects the final checks and reduces costly repair work in the next session.

## Milestones and commit boundaries

Each row is a work package with a proposed commit title. It is not a fixed usage-reset count. Rows with several families are deliberately split into the listed submilestones, normally one family per asset session. A large row may need an additional foundation/art/integration split after measuring actual usage.

| ID | Session type | Target and safe commit scope | Completion checks / suggested commit title |
| --- | --- | --- | --- |
| M01 | Foundation/code | Capture day/afternoon/night and memory baselines; add candidate-location habitat rules and a shared hostile budget with boss/summon reservations. No new creature art. | Existing encounters still work; correct regional borders, water/lava/town exclusions and capacity handling. Record known unrelated failures. `Establish ecology rules and encounter budgets` |
| M02 | Foundation/code | Generalize persistent encounter/group identity, full-pack admission, cached membership, alerts and leash rules. Preserve the approved wolf pack behavior. | Full 4–6-wolf packs, alpha/flanking, blocked-site rejection, save/reload, no duplicate members and stable counts. `Generalize encounter packs without changing wolf behavior` |
| M03 | New art family | Complete one cutlass deckhand family, using Salt King as a style reference. Integrate the simple pirate melee role. Replace Portquill bandits in all current spawn channels and Salt King summons with this first validated pirate type; migrate relevant saved encounters. Split art and migration into M03a/M03b if needed. | All directions/combat states render correctly; no frame bleed; complete Portquill conversion; existing bandits elsewhere and saved damage/defeats remain correct. No harpoon or boatswain promise yet. `Add cutlass pirates and replace Portquill bandit encounters` |
| M04 | New art family | Complete one melee orc raider family and admit small hostile Rindass packs near appropriate camps/wells. | Smooth complete footwork/combat, hostile faction limited to Krag's warband, friendly orcan NPCs untouched, pack spacing and habitat checks pass. `Add Rindass melee orc raiders` |
| M05 | Foundation/code | Implement pooled enemy projectiles and a proper spear projectile asset, swept obstacle/player collision, finite lifetime, attack cancellation and sound hooks. Future throwers remain disabled until their complete family is ready. | Projectile cap, thin-wall collision, committed aim, no homing, pause/unload/death cleanup and no accumulating callbacks. `Add bounded enemy projectile infrastructure` |
| M06 | New art family | Complete the spear-throwing orc family; activate ranged behavior and mixed melee/ranged Rindass packs. | Spear release matches the hand/frame, windup/recovery is readable, close-range behavior and obstacles work, stagger and the full Crescent Flurry window are tested. `Add spear-throwing orcs and mixed warbands` |
| M07 | New art family | Complete one pirate harpoon thrower family, reuse M05 projectiles, add ranged pirate crew compositions. | Release/impact registration, deck-ready leashes, sensible ranged spacing, audio and sprite checks. `Add pirate harpoon throwers` |
| M08 | New art family | Complete one heavy boatswain family and tune the mixed pirate crew under the shared budget. | Stable body/weapon size in all states, clear heavy-attack warnings, no repeated stunlock or overlapping crew. `Add heavy pirate boatswains` |
| M09 | Integration/performance | Map the moored flagship encounter footprint, gangplank, deck boundaries, cover and navigation using existing validated actors in a disabled review encounter. Keep temporary geometry out of enabled gameplay. | Player and crew can enter/exit, remain inside the deck, respect rails/mast and cannot cross surrounding water; civilian docks and travel remain safe. `Add validated pirate flagship deck geometry` |
| M10 | New art / integration | Create final ship layers at real player/crew scale, replace the review presentation, enable 4–6-member crew encounters and add restrained ship/water motion and shadows. Split M10a art/M10b activation if needed. | Rendered boarding/combat/depth checks, no outside-hull player, no foot drift, fair ranged positions, save/respawn, day/night water performance and existing voyages pass. `Add boardable Portquill pirate flagship` |
| M11 | New art / foundation | Build the tree/cover index and pooled wildlife lifecycle, then complete and activate rabbit emergence/run/hide behavior. Split infrastructure and rabbit art if needed. | Tree-entry chance/cooldown, clear destination, convincing cover disappearance, pool limits, pause/unload cleanup and stable performance. `Add pooled rabbit wildlife around tree cover` |
| M12 | New art family | Complete squirrel run/climb/hide poses and add woodland squirrel events through the existing wildlife system. | Full-body motion, proper tree/canopy depth, obstacle-free routes, no open-ground popping, no extra saved records. `Add tree-to-tree squirrel wildlife` |
| M13a / M13b | New art family | M13a: one woodland bird family with perch/feeding/takeoff/flight. M13b: separately validated coastal gull presentation and Portquill habitat. Each is its own commit target. | Actual wingbeats and smooth departure, correct flight height/shadows, two-bird cap, quiet sound limits and no per-tree spawn flood. `Add proximity-triggered woodland birds` / `Add coastal gull wildlife` |
| M14a–d | New art family | Add one family per slice: hedge goblin, goblin stone-slinger, blighted thornling, grove spider. Reuse approved melee/projectile/pack infrastructure. | Each independently passes full art, region/habitat, pack, sound and performance checks before activation. Preserve healthy farms/groves. `Add <family> encounters in <region>` |
| M15a–c | New art family | Add stone crawler, rootgnawer and marsh crawler as three separate family slices. | Rocky/cave, mine/root and wetland placement respectively; appropriate pack sizes, scenery navigation and unchanged existing troll/wraith behavior. `Add <family> habitat encounters` |
| M16a–d | New art family | Add frost wolf, ice crawler, cinder hound and ash cultist as four separate slices. Reuse approved anatomy where genuinely compatible, without mixing body parts. | Native snow/ice or ash/forge habitats, correct audio, complete poses, no lava spawns and no new nighttime load spikes. `Add <family> regional encounters` |
| M17 | New art family | Complete reef crab poses and add small shore groups around suitable Portquill terrain. | Ground contact and side movement fit crab anatomy, correct shore placement, no unintended swimming or dock blockage. `Add Portquill reef crab encounters` |
| M18 | New art family | Replace Krag's boar model with a complete armored orc chieftain; update appropriate warband summons. | Boss scale, melee reach/warnings, hurt/death, quest/defeat IDs, saves and cutscenes stay coherent. `Give Krag the Iron-Tusk an orc chieftain model` |
| M19 | New art family | Replace Frost Wyrm's wolf model with a complete scaled ground-dwelling ice wyrm; use native helpers. | Ground/lunge registration, attack footprint, full hurt/death, story scales, navigation and save/quest compatibility. `Give the Frost Wyrm a region-appropriate model` |
| M20 | Conditional new art family | Perform the complete Rootfather review, then replace with a root-and-stone guardian only if the mismatch is confirmed. Record a keep decision if replacement is not justified. | Root/mine silhouette, consistent body and attacks, existing spirit summons, stable quest/boss identity. `Give the Rootfather a rooted guardian model` or a documented review checkpoint |
| M21 | Integration/performance | Run all-region end-to-end source, save, combat, rendered art and performance regression comparisons. Repair issues within scope; hold back any family that exceeds the budget. | Comparable day/afternoon/night scenes, max packs/crew/wildlife/projectiles, repeated streaming/boarding and stable memory. Preserve graphics. `Validate and optimize regional ecology expansion` |
| M22 | Device validation | When APK creation is explicitly requested, validate the integrated game on Android, including afternoon/night, ship combat, wildlife and extended travel. Record device/settings and measurements. | No justified phone-performance claim without measurements. Fix demonstrated regressions and perform only the requested build/publication actions. `Validate regional ecology performance on Android` |

Dependencies: M01/M02 precede new pack admission; M05 precedes spear/harpoon combat; M07/M08/M09 precede full flagship activation; M11 precedes other wildlife. Remaining regional families can be reordered after the core milestone checks pass, but keep one family per asset slice. Boss art does not block the initial pirate/orc/wildlife milestones.

The regional residency/loading work described in the performance gates must be in place before the expanded roster exceeds the measured startup/GPU budget. Schedule a separate code-only submilestone at that point rather than quietly preloading every new family or hiding the cost by reducing artwork quality.

## Definition of a completed milestone

- The exact feature slice works in the game or is a verified self-contained foundation with future content disabled. No new enabled family is missing required states.
- Application/test type checks and relevant meaningful unit/browser checks pass. Asset slices require actual rendered inspection of locomotion and combat; integration slices require navigation and save checks. Keep unrelated pre-existing failures separate from new regressions.
- Relevant performance comparisons stay within the baseline budget, with stable actor/projectile/audio counts and no repeated steady-state atlas uploads. Later content cannot skip this check simply because the shared infrastructure passed earlier.
- Review the diff for unrelated user changes, temporary outputs and accidental alterations to approved sprites. Retain generated source boards and prompt/provenance documentation only for the accepted assets.
- Update this plan's checkpoint with what is complete, evidence, unresolved work and the precise next slice. A large milestone name is not sufficient evidence that every submilestone is finished.
- If committing is authorized for the implementation task, create the milestone commit with the proposed scope. Push only when authorized; record the resulting commit and any automatic workflow in the user-facing handoff. An authorized push to `main` invokes the existing APK workflow, so it is also a release/build checkpoint to monitor. Do not manually build or publish additional APKs without the requested authorization.

## Resume checkpoint

Current status: **planning only; no implementation milestone started**. Next target: **M01 — baseline, habitat rules and shared budgets**. The plan file is currently local/uncommitted.

Before ending each future session, replace/append a short checkpoint using this template:

```text
Milestone/submilestone:
Date and base revision:
Requested actions: source / commit / push / build
Completed behavior and accepted assets:
Validation commands/results and rendered evidence paths:
Performance baseline/comparison and tested device, if applicable:
Known unrelated failures:
Usage at start / validation checkpoint / finish: reported readings or unknown
Working-tree state and any intentionally unfinished local work:
Commit/workflow: report final revision/run in the handoff; recover with git log next session
Remaining items in this milestone:
Next smallest target:
Relevant files to re-read:
```

Keep the handoff with the milestone's changes before an authorized commit; the resulting commit hash can be reported after committing and recovered from Git next session. No extra commit is needed just to insert that commit's own hash into its contents. On resume, inspect the checkpoint and intervening changes, then continue the recorded next slice instead of regenerating approved assets or restarting completed audits.

This update creates no game code, assets, build, commit or push. Future implementation requests control those actions for the chosen milestone.
