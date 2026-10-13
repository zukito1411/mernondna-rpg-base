# Regional monsters, pirate ship and ambient wildlife — implementation plan

Originally planned from the repository on 11 October 2026. The user uses ChatGPT Plus and intends to complete tested milestones, commit them when requested, and resume after later resets. Current implementation/verification status is recorded in the resume checkpoint below. Recheck the working tree on resume; the original plan-only authorization does not describe subsequent implementation requests.

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
| Ashen Seer | Replace (user-requested distinction) | Previously shared Moonlit Warden's blue wraith model. Dedicated obsidian-masked, ash-robed ember oracle now preserves the volcanic wraith-binding lore and existing encounter identity. Source implemented; rendered acceptance pending. See `ASHEN_SEER_ART.md`. |
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
| M07 | Dropped by user | Pirate harpoon throwers are removed from the plan. Pirate crews use melee roles. | No implementation planned. |
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

Dependencies: M01/M02 precede new pack admission; M05 precedes orc spear combat; M09 supplies flagship navigation, M10 its presentation, and M08 adds the heavy melee crew role to the existing ship. M07 is dropped. M11 precedes other wildlife. Remaining regional families can be reordered after the core milestone checks pass, but keep one family per asset slice. Boss art does not block the initial pirate/orc/wildlife milestones.

The regional residency/loading work described in the performance gates must be in place before the expanded roster exceeds the measured startup/GPU budget. Schedule a separate code-only submilestone at that point rather than quietly preloading every new family or hiding the cost by reducing artwork quality.

## Definition of a completed milestone

- The exact feature slice works in the game or is a verified self-contained foundation with future content disabled. No new enabled family is missing required states.
- Apply the user's impact-based verification policy: low/no-impact work may finish with documented source review and skipped execution. Combat/save/spawning work needs focused affected checks; do not automatically rerun the full suite. Asset slices require actual rendered inspection of that family's locomotion/combat; integration checks target affected navigation/save behavior. Keep unrelated pre-existing failures separate from new regressions.
- Run performance comparisons when the milestone materially changes rendering, asset residency or runtime workload, or diagnostics suggest a regression. Preserve bounded actor/projectile/audio counts and avoid recurring atlas uploads; use the smallest useful affected scenario rather than automatically repeating the all-region baseline. Added families cannot rely solely on an earlier infrastructure pass.
- Review the diff for unrelated user changes, temporary outputs and accidental alterations to approved sprites. Retain generated source boards and prompt/provenance documentation only for the accepted assets.
- Update this plan's checkpoint with what is complete, evidence, unresolved work and the precise next slice. A large milestone name is not sufficient evidence that every submilestone is finished.
- If committing is authorized for the implementation task, create the milestone commit with the proposed scope. Push only when authorized; record the resulting commit and any automatic workflow in the user-facing handoff. An authorized push to `main` invokes the existing APK workflow, so it is also a release/build checkpoint to monitor. Do not manually build or publish additional APKs without the requested authorization.

## Resume checkpoint

Current status: **M01 and M02 complete within their defined foundation scopes**. M01 evidence/limitations: [M01 validation record](M01_ECOLOGY_VALIDATION.md). M02 uses focused risk-based verification below, not another full profiling pass.

- Date/base: 12 October 2026, `27e8807` (`cleaning`). The user subsequently authorized milestone-completion tests/runtime checks. Source and validation changes only; no commit, push, production/APK build or release requested/performed. Complete the implementation, execute/fix the current milestone's checks, and hand off that milestone before moving on; avoid repeating tiny unverified slices.
- Candidate-location habitat rules now govern new ambient/event/road spawns and each new wolf-pack member. Ambient species weights and density follow the candidate's region/biome. Native region weights, water/lava/farmland exclusions, protected settlements, existing geometry and the dragon arena remain enforced. Existing authored/saved creature records are retained rather than deleted by the new habitat rules.
- Shared admission limits every activated hostile, including authored bosses, to 16. New encounters leave space for nearby pending bosses and their reinforcement allowance (up to six for a wolf pack). Explicit live-boss summon requests retain the existing non-native helper exceptions; generic events cannot claim summon privileges. No reservation is held for distant or defeated bosses awaiting return.
- Wolf placement admits all planned points or none; encounter IDs now use the saved monotonic spawn sequence rather than the record count, avoiding reuse after defeated-record pruning. Existing pack combat and approved art are unchanged.
- M01b: new encounters now budget nearby inactive undefeated creature records as committed slots, preventing additional records from overbooking the local queue. The query visits only local chunk buckets at admission time, excludes active actors and separately reserved bosses, and uses indexed persistent locations. Candidate density caps include the queued records too. Restoration does not count those records twice, so capacity can still be filled by existing creatures.
- M02 preparation (continued source-only at the user's request): wolf membership is indexed at registration and cleaned when defeated records are pruned. A host group-admission callback checks the full pending survivor count against the shared restore budget before creating any actors; blocked or distant pending survivors defer that group. Existing active members count normally, casualties stay defeated, and no distant pack members are forcibly loaded. Constructor failure rolls back already returned actors without deleting their logical records. Hosts without the optional callback retain their previous individual activation behavior.
- Further M02 source preparation: optional `encounterId` now survives version-5 save parsing; IDs are bounded identifiers and cannot contradict an accompanying wolf-pack ID. No save-key/version change or destructive migration. Generic non-wolf records can use the existing group-admission path, but no new encounter content is enabled. Legacy wolf IDs remain authoritative, even with mixed old/new records, and group-key namespaces prevent accidental wolf/non-wolf merging. Authored bosses remain independently admitted. New wolves include both identity fields; existing wolf leader/member queries now use indexed active actors, retaining alpha/instance-ID ordering and combat behavior.
- Batch source preparation: `ContentChunkManager.addEncounter` now accepts a complete logical encounter and caller-supplied shared capacity. It rejects insufficient capacity, empty/oversized batches, invalid/non-finite/out-of-world positions, unknown enemies, authored boss species, incomplete new wolf packs, persistent-cap overflow and exhausted sequence IDs. Accepted batches generate one monotonic encounter ID; wolf batches retain 4–6 members and one alpha. Every initializer is resolved before registration so an initializer exception leaves no new records/indices or consumed IDs. It creates no actors, does not replace scene habitat checks and still prunes eligible old defeated records when checking persistence capacity. WorldScene now uses this API for new wolves. Generic mixed-species batches are foundation capability only, not new enabled content.
- Individual active members still unload normally when leaving the streamed neighborhood; rejoining pending members are admitted together. A fully pending pack spanning beyond the neighborhood can intentionally remain absent until all pending survivors are local. No new family has been enabled.
- Restored creatures share the hard cap and leave room for pending bosses, but are not deleted to enforce reinforcement headroom. Crowded legacy saves can therefore temporarily prevent reinforcements. Queued counting is deliberately conservative: blocked local records still own a slot rather than being silently discarded.
- Executed focused habitat/admission, content-streaming, save, group and batch tests: **40 passed**. Added/executed `ecologyWorldRules.test.ts`: **3 passed**, covering all settlement centers/parcels, repaired authored encounters, a 1,200-point survey spanning all nine regions, and explicit narrow lava channels. Typechecking exposed/fixed the new habitat object-widening error with an explicit `CreatureHabitat` return type; final `npm run test:types` passed.
- Final full `npm test`: **141 passed, 25 failed** (166 total). An isolated unchanged base worktree produced **117 passed, the same 25 failed** (142 total), with identical failed names. No M01-added test failures remain. Existing failures span art/atlas, raw placement, settlement, quest/progression and PWA expectations; they are recorded, not all dismissed as harmless or rewritten to obtain a green suite.
- Relevant browser checks: **9 passed**: six existing light/fog/shadow/water checks plus runtime exclusions/boss/minion/hard-cap/save checks and desktop/touch day/afternoon/night baseline comparisons. Shared admission stopped normal spawns at 14 with Varr present, admitted two summons to 16, blocked overflow and activated a deferred boss after a slot was freed. Rejections spent no records; saves retained defeat state and version 5.
- Captured before/after frame median/p95/p99/max, texture-size estimates/counts, bodies, resident AI-update calls, uploads/draws and reported JS heap on Windows Headless Chrome 155/SwiftShader. Desktop 1280×720 DPR1 and touch 844×390 DPR2 both passed the declared median/p95 comparison tolerances; six repeated round trips settled to unchanged counts/texture estimates. Corrected the profiling fixture to drain Arcade's normal postUpdate destruction queue during synchronous paused travel and disabled screencast tracing overhead. The superseded traced attempt was not counted as passed evidence.
- Approved art/effects/graphics quality unchanged. The existing texture footprint is large (~720 MiB desktop/~703 MiB touch by estimate), and headless tail spikes remain disclosed. This is not physical Android validation or a guarantee of smooth phone performance; M22 and later residency work remain necessary. Detailed evidence/commands and baseline limitations are in `M01_ECOLOGY_VALIDATION.md`; ignored JSON/screenshots remain under `test-results/m01-*`.
- Usage: user reported 89% at start; whether this means consumed/remaining is unknown. Checkpoint/finish readings unknown. Working changes intentionally remain local/uncommitted.
- Remaining M01 scoped work: none. Preserve the separately identified existing suite failures and physical-device limitations; do not imply the entire repository is green or M02 complete.
- M02 completed on 12 October 2026, same uncommitted base: generalized per-group alerts/cleanup; persisted home/station/leash/roles and stable flank slots; legacy normalization, including deterministic duplicate-alpha repair; radius-aware batch spacing; collision-aware return movement; disengagement/impact attack cancellation; no mid-melee/immediate-range ordinary spawns. Existing wolf alpha stats, model scale, flank/lunge math, stagger/Flurry behavior, save identities and defeat state remain intact. Group pursuit now deliberately has a 900-unit default home leash, a 510-unit shared response range and a 5.5-second alert lifetime. Generic ranged/heavy roles are assignments for later families, not premature ranged-combat activation. Bosses and ungrouped creatures keep independent combat.
- M02 impact assessment: combat/AI/save changes warrant focused checks. **47 targeted unit tests across six files passed**, plus typechecking; **one real-engine browser check passed** for sibling alert pursuit, queued attack cancellation, home return, immediate-spawn rejection, profile stability through unloading/reloading, retained casualties and one alpha. No full-suite rerun, baseline worktree, broad render/performance pass or asset generation. M01's 25 known baseline failures remain separate and were not reclassified as fixed. Local steering is intentionally bounded, not global pathfinding; obstructed routes stop/retry rather than crossing scenery or teleporting.
- Verification policy updated by the user: assess each milestone's impact. Low/no-impact changes may use source review and skip test execution; document the choice. Combat, save, movement or spawning changes use narrowly affected unit/runtime checks. New art requires focused rendered acceptance; broad profiling/full-suite runs are reserved for a demonstrated need, not automatic milestone rituals. Builds/APKs, commits and pushes still need explicit requests. Finish one milestone per work session, then hand off.
- Priority changed by the user: **M11 rabbits, then M12 squirrels, M13a woodland birds and M13b coastal gulls**. M03 remains deferred, not completed. Preserve the Salt King's cave location and all existing combat/save work.
- M11 implementation on 12 October 2026, same local base: `AmbientWildlifeSystem` now receives actual visible tree/shrub bounds through the common `WorldSpriteSystem` registration path, including authored and wilderness scenery. Loaded cover is indexed in 512-unit cells and removed with its scenery. Four reusable ground sprites share the six-slot wildlife budget; two bird slots remain reserved rather than allocating unused visuals. Rabbits have no physics bodies, enemy admission slots, logical content records, health, loot, rewards or new audio/lights.
- Rabbit events: one entry opportunity per 220-unit source ring, 25% chance, daylight 06:30–18:30, eligible meadow/forest habitats in temperate regions. Select loaded cover 200–500 units away and a collision/terrain-checked route before revealing anything. Only one placement attempt per scan and at most twelve route probes; successful events are separated by 8–15 seconds and both covers rest for 45–90 seconds. Roads, settlement courts, farms, water/lava, foundations, fortifications and nearby NPCs are excluded. There is no open-field/random-coordinate spawn fallback.
- Pooled rabbits emerge under foliage, use full-body hopping poses and hide in destination cover. Shared source-space fit and per-direction grounded references preserve airborne lift without resizing each pose; west mirrors east. Fixed 26-unit neutral height and contact-only shadows. Source art generated using the image-generation skill is retained at `public/assets/wildlife/rabbit/`, with prompts/provenance in its README. Boot packs eighteen poses into a 576×288 atlas (~0.63 MiB RGBA) and releases the source texture. Explicit source rectangles preserve the extended side-hop artwork instead of cropping it at assumed grid boundaries.
- Wildlife scans every 125 ms, moves each frame, pauses with menus/dialogue/cinematics, releases on cover unload, shrine travel, sea passage, hidden tabs and scene shutdown. A blocked path permits one checked return toward source cover; otherwise the rabbit waits and can be released offscreen, never teleports through scenery or fades in open ground. Loading only the rabbit family avoids preloading the remaining planned wildlife families.
- **M11 acceptance is pending, not 100% verified.** The user's latest pasted AGENTS instructions prohibit tests, time-consuming validation/builds and game launches unless explicitly requested. Only source/diff review and static image inspection were performed; no test files were added/edited for M11, no game/browser launched, no typecheck/build/test suite executed, no commit/push/release. Source artwork is inspected, but GPU crops, visual cover transitions, trigger frequency, real-engine movement and actual performance have not been validated. Do not claim this milestone's rendered/performance acceptance passed or roll the earlier M01/M02 evidence forward as rabbit evidence.
- The user requested the next implementation slice without authorizing execution checks: **M12 squirrel implementation added on 12 October 2026**, same local/uncommitted base. M11's deferred acceptance is still pending; continuing source work does not retroactively mark it verified.
- M12 reuses the exact four ground visual slots, cover index, entry rolls, cooldowns, route-probe budget and scene lifecycle. It does not create a second animal population or consume reserved bird slots. Forest tree entries in Trandum/Narenthil/Druganwoods can select a squirrel (45% of otherwise eligible tree events); shrub and meadow entries retain rabbits. Both endpoints must be loaded trees with prepared wood/leaf layers and suitable dimensions. Both native forest endpoints and the entire ground route are checked before emergence.
- Squirrels run through directional full-body poses at 160 units/second. A short checked route around the destination's root contour reaches the front of the trunk; only then does a visual climb rise along its bark using mounting, alternating gripping paws and a tucked hiding pose. The squirrel sorts between the static wood and swaying leaf layers, so canopy pixels occlude it rather than placing it above the forest. Contact shadows are disabled during climbing and restored when a pooled slot is reused; ordinary actor/scenery shadow defaults remain unchanged. Player/enemy walkability and collision were not relaxed.
- M12 art: built-in image generation, identity prototype and a 24-pose board retained at `public/assets/wildlife/squirrel/`; exact prompts/provenance in its README. `SquirrelArt.ts` uses explicit isolated rectangles because source row spacing is irregular. Shared calibration preserves full-body proportions across run/climb states; climbing anchors follow rear paw contacts, not hanging tail bounds. Fixed 32-unit neutral silhouette including the tail, with a smaller body than a rabbit. Runtime atlas 768×512 (~1.5 MiB RGBA); source texture released after boot preparation. Existing approved art preserved.
- **M12 runtime/art acceptance remains pending.** Source/diff review and static asset inspection only; no test files changed for this milestone, test suites/typechecking/builds not run, no game/browser launches, profiling, commits, pushes or releases. Real-engine crop registration, run/climb transitions, canopy layering, route admission frequency and physical-device performance have not been verified. Four-ground/two-reserved-bird limits and bounded work are design constraints, not measured performance evidence.
- **M13a woodland bird implementation added on 12 October 2026**, same local/uncommitted base, following the user's next-slice request. `WoodlandBirdSystem` uses the parent wildlife cover index, clock, pause/cleanup and shared event spacing. It allocates only the two previously reserved bird slots, retaining the four-ground/six-total cap. Birds have no physics, saved records, rewards, individual audio or lights. Existing ambient bird/wind/night sound remains untouched.
- Woodland robins occur only beside eligible forest/meadow trees in Trandum/Narenthil/Druganwoods during daylight. A 12% new-ring-entry opportunity, 18–30-second bird-event gap, existing shared 8–15-second emergence spacing and cover cooldown/occupancy prevent every tree spawning a bird. Placement checks visit bounded indexed cells, with at most four ground-site probes per check. The approach ring adapts to the camera, capped at 1,100 units, to retain offscreen resting opportunities on PC and mobile without requesting unloaded trees.
- Resting birds are created outside an 80-unit visible margin, either feeding on checked clear woodland ground or perched on the oak's authored exposed right fork. Other tree artwork offers ground feeding until suitable branch anchors are authored; no arbitrary floating canopy perches. Rest lasts 12–20 seconds, with occasional full feeding poses. Approaching within 150 units, rest expiration or nightfall triggers a committed away-from-player takeoff, acceleration, tracked altitude and real raised/mid/lowered-wing animation. Foot contact shadows apply only while feeding; perches/flight suppress them. Flights end beyond a 160-unit camera margin rather than a visible timed fade; shared travel/hidden-tab/cover-unload/shutdown cleanup still applies.
- M13a art: the built-in image-generation skill produced an identity prototype and eighteen full-body directional perch/feed/takeoff/flight poses, retained at `public/assets/wildlife/woodland-bird/` with exact prompts/provenance in its README. `WoodlandBirdArt.ts` reuses whole-subject segmentation before packing, preserving raised wing tips and isolating neighboring pixels across approximate source cells. A common body fit, authored torso centers and fixed per-direction ground references prevent wing bounding boxes independently shrinking or shifting the body. Neutral height 14 units; padded runtime atlas 768×384 (~1.125 MiB RGBA); source texture released after boot preparation. No existing approved artwork replaced.
- **M13a acceptance remains pending**, alongside M11/M12: source/diff review and static source-art inspection only. No tests/typechecks/builds, browser/game launches, profiling, commits/pushes/releases or test-file edits for this slice. GPU segmentation/crops, foot registration, branch placement, wingbeat/takeoff continuity, event frequency and real-device performance have not been verified. Bounded actor/work/texture design is not measured performance evidence.
- **M13b coastal gull implementation added on 12 October 2026**, same local/uncommitted base. The existing bird system now selects robin/gull presentation per habitat while retaining exactly two bird slots and four ground slots. No second bird population, general physics bodies, saved records, individual sounds/lights, extra source timers or global collision exceptions. Existing robin cadence, size and woodland admission are preserved.
- Loaded Portquill coastal vegetation/rocks and its pier register shore-only anchors through the existing world-sprite lifecycle/index. Ground animals cannot use shore anchors. Gulls require the actual candidate's Portquill/coast habitat and a dry sand/stone/grass/dirt footprint, clear scenery/fortifications, no road, deck, close NPC, landing or moored boat. At most four resting-site probes per scan. A bounded radial water query (eight bearings, four distances up to 384 units) establishes an actual nearby shoreline/open-water bearing; biome labels alone cannot admit inland gulls. Existing player/enemy walkability and protected settlements remain unchanged.
- Gull behavior: offscreen shore feeding or perching on a source-inspected pier side-post cap, 18% eligible-entry chance under shared cooldown/event limits, 16–26-second resting interval and 190-unit startle distance. The pier's dry upper-side feeding check is separate from its elevated cap; ropes, gangplanks and the whole opaque image are not treated as resting decks. Larger 26-unit neutral gull bodies, 440-ms takeoff, slower 140-ms wing phases and brief horizontal-wing glides distinguish them from 14-unit robins. Flight favors nearby open water while retaining an away-from-player component, tracks altitude, suppresses contact shadows aloft and releases beyond the visible margin. All earlier pause/travel/unload/hidden-tab/shutdown cleanup applies.
- M13b art: generated with the built-in image-generation skill; prototype, eighteen full-body directional standing/feed/takeoff/wingbeat poses and exact prompts retained at `public/assets/wildlife/coastal-gull/`. `CoastalGullArt.ts` supplies gull-specific torso registration to the shared isolated-subject atlas preparer; a single fit preserves body proportions across extended wings. Runtime atlas 768×384 (~1.125 MiB RGBA); source texture released after boot preparation. Only the requested wildlife families are loaded; no future monster roster was preloaded or existing approved artwork replaced.
- **M13b acceptance remains pending**, as do M11/M12/M13a runtime checks. Source/diff review and static art inspection only. No tests/typechecking/builds, game/browser launches, profiling, commits/pushes/releases or test-file changes for this slice. Actual Portquill shore/pier admission frequency, GPU subject isolation/crops, body/foot/cap registration, launch/glide transitions and mobile performance are unverified. Six bounded actors and compact atlases are implementation constraints, not measured performance claims.
- The user-prioritized **M11/M12/M13a/M13b source slices are implemented, not 100% runtime-accepted**. When testing is explicitly authorized, use a focused wildlife pass rather than automatically repeating the full suite/all-region profiling. Next development milestone in the original remaining sequence is **M03 cutlass pirate family and Portquill conversion**, preserving the Salt King's cave/story/save identity and following the current no-test rule unless changed. Previous unrelated changes, known baseline failures and physical Android limitations remain preserved; usage readings unknown.

### Wildlife frequency adjustment — 12 October 2026

The user asked for commonly visible birds/squirrels and an 80% rabbit appearance
chance. This supersedes the earlier deliberately rare wildlife tuning above.

- `wildlifeTuning.ts` centralizes the live settings: **80% independent rabbit
  eligibility roll per suitable cover entry**, 90% squirrel opportunity at native
  forest trees and 90% bird refill opportunity in suitable habitats. Placement,
  cooldown, loaded cover and free slots still govern actual appearances; these
  are not guarantees that every visit produces an animal. Successful rabbit rolls
  remain pending within the entry ring if a squirrel goes first or the route is
  temporarily unavailable. Failed/cooldown/full-pool entries are not silently
  discarded before their eligibility roll.
- Ground events now have a 2–4-second gap; source/destination cover rests for
  12–20 seconds. Squirrels get bounded repeat opportunities near their trees
  while the player remains nearby, with a 3-second per-cover retry delay and the
  existing one-search/twelve-route-probe limit. Successful rabbit/squirrel
  opportunities alternate where possible instead of one family monopolizing
  the four ground slots. Rabbit rolls remain per-entry, not continuous re-rolls
  until success; pending opportunities clear on departure/unload/travel.
- Birds refill independently every 4–7 seconds, so ground activity no longer
  starves their slots. Nearby visible resting sites are preferred. A bird aimed
  at an onscreen checked perch/feeding spot flies in from beyond the camera edge,
  uses wingbeats and a landing transition, then rests/feeds for 45–75 seconds
  unless approached. Existing offscreen resting opportunities remain supported.
  This makes birds observable without forcing constant travel and avoids visibly
  popping birds into open ground. Arrival can be startled into departure from
  its current position without teleporting. Refill searches run only with a free
  slot and a due timer; unsuccessful searches retry after one second, with at
  most four probes and three-second per-cover retries.
- **Caps unchanged: four ground animals and two birds, six total.** No new
  artwork, GPU atlases, bodies, lights, individual sounds, saved records or
  unbounded timers. Native habitats, daylight, route/shore/NPC/deck safety and
  menu/cinematic/travel/unload/hidden-tab cleanup remain enforced. Common means
  common in an appropriate habitat, not woodland wildlife on barren lava/open sea.
- Source review only. No tests, typechecking/builds, game/browser launches or
  profiling performed under the user's strict rule. Arrival/landing continuity,
  actual sightings and increased active-pool workload remain unverified; this
  adjustment does not change the previous runtime-acceptance status.

### Small wildlife groups — 12 October 2026

At the user's request, birds and squirrels may now appear in social pairs.
This is ambient grouping, not an assertion that every real species is always
social, and it does not reuse hostile pack AI.

- `wildlifeTuning.ts` gives eligible squirrel/bird events an 80% companion
  opportunity, conditional on free existing slots and safe placement. Solitary
  sightings remain valid if a group cannot be admitted. Rabbit appearance
  tuning remains 80%, unchanged. **Four ground slots/two bird slots/six total
  remain the limits**; no larger pool, new art, bodies, saved records or audio.
- Squirrel pairs share a source tree and runtime group ID. A companion reserves
  an existing slot, waits 650 ms hidden in cover, then performs its own bounded
  route search on a later scan to a distinct loaded tree. This spreads admission
  work across scans instead of doubling the route search in the leader's frame.
  Failed geometry, a returning/released leader or unloading cancels the reserved
  companion. The follower yields near its leader; source emergence, runs and
  climbs remain independently animated and ground-safe.
- Bird pairs use independently checked resting spots rather than two birds on
  the same branch/post. Feeding companions are spaced 36 units for robins and
  64 for gulls; native habitat, shore/route checks and player distance apply to
  the companion too. The companion consumes the existing four-probe budget.
  Fly-ins share an entry edge with wing-safe lateral spacing and a 300-ms delay.
  Startling either bird alerts its partner, which follows after 180 ms with the
  same departure bearing. Delays use active updates, not asynchronous timers;
  a delayed arrival's current airborne position is preserved on early takeoff.
- Group identities, pending admission and staggered departures are cleared on
  release/travel/hidden tabs/cover unload/shutdown and never serialized. Existing
  menu/cinematic pause handling applies. Membership scans are over the four/two
  pooled slots, not over all world actors.
- Source review only; no tests, typechecks/builds, game/browser launches or
  profiling. Group spacing, route separation, flock arrivals/startles and active
  workload remain unverified in-engine. Earlier wildlife acceptance is still
  pending; there is no new performance or real-device claim.

### Focused wildlife verification — 12 October 2026

The user explicitly authorized a narrowly scoped test pass before considering
a commit and reported a manual run without encountered problems. No commit,
push, production/APK build or release was requested/performed.

- Group presentation clarification: current groups coordinate emergence,
  movement, arrival and departure. They **do not have a deliberate face-to-face
  idle/socializing state**. Verification did not add or claim that behavior.
- `npm test -- tests/contentStreaming.test.ts tests/save.test.ts
  tests/encounterAdmission.test.ts tests/encounterGroups.test.ts`: **38 passed**.
  These target existing streaming/save/admission/group behavior, not the full
  repository suite. Previously documented unrelated failures were not rerun
  or reclassified as fixed.
- `npm run test:types`: **passed** after removing a redundant `climate_props`
  comparison already excluded by the earlier wildlife registration guard.
  The focused browser spec is also included in the final passing typecheck.
- `npx playwright test tests/browser/wildlifeGroups.spec.ts`: **1 passed**
  (Windows desktop Chrome/SwiftShader). The real Phaser engine boots/prepares
  all wildlife art. Controlled habitat/route fixtures verify squirrel slot
  reservation, staggered pairs and distinct destination trees; robin/gull
  pairs, spaced fly-ins/landing and shared startled departure; pause/unload/
  reset cleanup; rejected route admission; exactly six production pool slots;
  no additional physics bodies/saved records and no retained fixture displays.
  Fixture admission uses controlled safety callbacks, not an all-region
  survey of production navigation or natural appearance frequency.
- First browser attempt exposed fixture mistakes: a 125-ms supplied update is
  capped to 100 ms, so it cannot alone trigger the 125-ms scan; the initial bird
  fixture placed its feeding point inside the intentional 220-unit player
  exclusion. Corrected those fixtures without relaxing production admission
  or changing the expected pair assertions; the final browser run passed.
- Prepared bounds for all 78 wildlife frames remain inside their GPU cells.
  Rendered the existing rabbit/squirrel/robin/gull atlases at their actual
  game-scale calibration and inspected `test-results/wildlife-acceptance.png`;
  no visible frame clipping/neighbor contamination identified in the gallery.
  Some gallery cells are covered by the existing HUD, so this is not exhaustive
  unobstructed frame-by-frame animation acceptance. No page errors observed.
- `git diff --check`: passed (only existing Windows line-ending notices).
  Test artifacts remain ignored. New focused spec and the one type fix remain
  local with the earlier implementation changes. No full suite, broad profiling,
  extra baseline worktree, mobile browser run or physical Android validation.
- No blocker identified in these focused checks. This is **not** a blanket
  whole-repository/Android release sign-off: natural regional admission rates,
  full cover/branch/climb presentation during exploration, mobile performance
  and deliberate face-to-face socializing remain outside this pass. Preserve
  those limitations when deciding the final commit scope.

### Face-to-face wildlife follow-up — 2026-10-12 (source only)

- Squirrel pairs can approach two separated, route-checked clearing positions,
  pause facing each other for 2.8 seconds, then continue to their independently
  admitted trees. A rejected meeting detour preserves their ordinary movement.
  Waiting is bounded; player proximity, route obstruction or a missing partner
  cancels the pause. No teleporting or new actors/physics bodies.
- Ground-resting robin/gull pairs face one another during periodic 2.8-second
  social pauses, retaining their existing feeding poses and staged departure.
  Mixed branch/ground pairs remain perching/feeding rather than facing through
  tree trunks. Open ground/coastal admission is checked before each opportunity.
- Existing frame rows, mirrored west-facing artwork, sizes, active-play clock,
  pool limits and unload/reset cleanup are preserved. No new raster assets.
- No tests, type checks, builds or game launches performed for this follow-up,
  per the current request. The earlier passing checks above predate these new
  social states; rendered social behavior is not yet verified. No commit/push.
- Next smallest target: manually observe paired facing and resumed movement;
  execute focused social-state checks only when requested.
- Relevant files: `AmbientWildlifeSystem.ts`, `WoodlandBirdSystem.ts`,
  `wildlifeTuning.ts`. Existing unrelated local changes remain untouched.

### Tree-side squirrels and settlement birds — 2026-10-12 (source only)

- Squirrel meetings now use separated spots beside the source tree's roots,
  under its crown rather than midway across a clearing. Root contours and all
  added approach/exit segments still require admission; unsafe meetings are
  skipped. Meadow/highland groves in the existing native regions are eligible.
- Bird ground admission now permits walkable roads and settlement paving,
  plus nearby open ground around loaded trees/shrubs. Separate footprint checks
  reject scenery, fortifications, water/lava and occupied NPC positions without
  relaxing rabbit/squirrel route admission. Coastal gulls may rest on roads too.
- Added inspected roof perches to cottage/inn/smithy and selected capital civic,
  residential/service building art. Perches use visible bounds and retain owner
  depth; roof birds have no ground shadow and fly in/out normally. Unsupported
  roofs are not guessed. Existing oak branch and coastal pier perches remain.
- Existing wildlife pools/cadence, regional species rules, paired social pauses
  and chunk-owner destruction cleanup remain. No new artwork, timers or bodies.
- No tests, typechecks, builds or game launches run; runtime appearance and
  performance of these additions remain unverified. No commit/push performed.
- Next smallest target: manually observe roof landing/layering, paved-road
  feeding and tree-side squirrel pairs; focused checks only on request.

### Authorized focused wildlife verification — 2026-10-12

- `npm run test:types`: passed after the final focused-spec edits.
- `npx playwright test tests/browser/wildlifeGroups.spec.ts`: 1 passed
  (40.7 seconds total on the final run). Extended the existing single real-engine
  check: squirrel facing/pause/resume; robin/gull facing and shared departure;
  inspected roof landing and owner unload; paved-ground pairs/social pauses;
  pause/reset, six-slot cap, no added bodies/saved records, fixture cleanup and
  prepared frame containment. No production source changes needed in this pass.
- Two initial attempts exposed fixture assumptions, not production defects:
  squirrel meeting positions entered the deliberate 110-unit player buffer;
  a temporary bird pause was checked after it had ended. Moved the source within
  valid entry/meeting bounds and observed social state during the update loop.
  Kept production safety checks and expected facing assertions intact.
- Fixtures control habitat and placement callbacks; this verifies runtime state
  transitions/registration, not every production road, roof or region's visual
  layout. Earlier unrelated suite failures remain outside this focused run.
  No full suite, build, physical mobile run, commit or push performed.

### Tidewatch sea gull flybys — 2026-10-12 (source only)

- Added daylight aerial gull opportunities around Tidewatch's sea frontage,
  independent of dry cover/perch admission. Three bounded camera-relative
  corridor candidates sample actual water on both separated flock tracks.
  No suitable water corridor means no aerial spawn; existing coastal resting
  behavior remains available.
- Reuses existing gull wingbeat/glide frames and calibrated size. Gulls enter
  from beyond the camera, cross the sea with matching flock headings and
  72-unit separation, then release offscreen. Temporary flight owners have no
  scenery, physics, persistence or saved content; existing pause/travel/reset
  cleanup and the shared two-bird/six-wildlife cap remain unchanged.
- No tests, typecheck, builds, game launches, commit or push for this follow-up.
  The earlier passing wildlife check predates this new flyby path. Manual
  Tidewatch sea-front observation remains outstanding.
- This concludes the requested wildlife additions for this session; defer
  the next ecology milestone until the user's next request.

### Tidewatch visibility correction — 2026-10-12

- Diagnosed overly restrictive habitat/admission: inland Tidewatch homes were
  outside the coast biome, coastal rooftops were not registered, and flybys
  demanded an entirely water-covered camera corridor. That excluded ordinary
  housing/shoreline views despite the harbor nearby.
- Tidewatch's housing wards now count as local gull habitat. Compatible roofs
  register correctly; dry feeding sites can find actual nearby harbor water
  farther inland. Ground collision/landing exclusions remain intact.
- Harbor-water-anchored flyovers may cross houses/shoreline at altitude. Refills
  use 1–2 active-play seconds, alternate aerial/resting opportunities and avoid
  filling both slots with long-lived resting birds. Flights enter 140 units
  beyond the camera instead of relying on a water-only screen. The existing
  two-bird/six-wildlife cap and daylight hours remain; no global density increase.
- Authorized verification: TypeScript passed; focused real-engine Tidewatch
  check passed with actual streamed roof anchors and production callbacks at
  housing, bay and sea camera positions. Each showed recurring visible gull
  flights over 15 seconds of controlled active-play updates, plus reset cleanup
  and rejection outside Tidewatch. No fake habitat/terrain callbacks in this
  check. This is state/visibility verification, not mobile profiling or complete
  visual acceptance of every roof. Existing wildlife regression also passed:
  `npx playwright test tests/browser/tidewatchGulls.spec.ts
  tests/browser/wildlifeGroups.spec.ts` — **2 passed**, 1.1 minutes total.
- No build, commit or push performed. Next milestone remains deferred.

### Salt King shoreline relocation — 2026-10-12 (source only)

- User explicitly changed the earlier cave-location constraint: place him near
  the shoreline in preparation for a later pirate ship. Moved his authored
  territory to Tidewatch's eastern harbor-mouth shore at town offset
  (+2450,+2400), outside settlement defenses. The existing harbor-bank formula
  places the water edge at x+1880 there, leaving 570 units of dry sand to the
  boss center. Future ship/boarding content remains unimplemented.
- Retained boss/content/quest IDs, combat, rewards, defeat and respawn behavior.
  Existing story/cinematic/outlook guidance now directs players south along
  the eastern shore to his sea-cave stores, preserving the stolen-seal story.
  Quest/map targets already derive from authored/persisted creature positions.
- Save parsing relocates Salt King records outside the new territory's 900-unit
  neighborhood without changing health, defeat, quest progress or respawn
  deadlines; nearby saved movement remains intact. No broad save reset.
- This supersedes the earlier inland-location preservation instruction, not
  the deferred M03 pirate crew/art milestone. No ship or new cave interior added.
- Source reviewed only: no tests, typecheck, build, game launch, commit or push.
  Actual shoreline fight/navigation and old-save migration need authorized
  runtime verification. Relevant files: `enemies.ts`, `save.ts`, `mainStory.ts`,
  `cinematics.ts`, `wildernessSites.ts`.

### Combined pirate family M03/M09/M10 — 2026-10-12 (source implementation)

- User changed workflow to complete related task families together. Implemented
  cutlass pirate art/combat, all Portquill bandit conversion channels and saved
  spawn conversion; a source-measured walkable flagship, gangplank/mast navigation,
  five persistent crew, cargo, safe delayed replenishment and layered final art.
- Base `bba9019`; preserved pre-existing shoreline/story/save edits. No new
  framework, disconnected scene, general water walking or civilian port changes.
- M10 uses cutlass-only crew: M07 harpoons/M08 boatswains are not complete and
  were not implicitly added. Salt King remains on his eastern shoreline.
- Image-generation skill influenced full-pose art, transparent source handling,
  non-destructive ship correction and geometry fitted to actual source pixels.
  See `PIRATE_FLAGSHIP.md` for assets/prompt briefs and implementation details.
- No tests/typechecks/builds/game launches/commits/pushes. These are implemented
  source slices, **not 100% runtime-accepted milestones**. All new rendered,
  boarding/save/collision/performance checks remain pending explicit permission.
- Next smallest target: focused combined pirate/boarding acceptance and fixes
  before claiming completion or expanding to ranged/heavy crew. Existing unrelated
  failures remain untouched. Usage readings unknown.
- Re-read `PIRATE_FLAGSHIP.md`, `pirateFlagship.ts`, `PirateFlagshipArt.ts`,
  `PirateArt.ts`, `WorldGenerator.ts`, relevant `WorldScene`/`Enemy` adapters,
  `ContentChunkManager.ts` and `save.ts` on resume.

### Boarding correction and local unlimited vitals — 2026-10-12

- User reported blocked boarding. Source inspection found the entrance sign's
  art-forced solid footing directly in the approach, a narrow boarding strip and
  a two-source-pixel centered-art offset. Moved the sign off the route, matched
  boarding bounds to visible boards and aligned the ship origin with its layout.
  Existing sign persistence and deck/rail/mast/water restrictions remain.
- Added development-only unlimited HP/stamina with finite normal-max values;
  localhost/private-IPv4 Vite play includes PC/mobile parity. Release builds are
  unaffected. Sprint/dash/attack/skill costs share the local bypass; level/cooldown
  rules and hit feedback remain. Normal e2e combat remains the default.
- No tests, typecheck, game launch or builds; reported boarding issue is addressed
  in source, not yet runtime-confirmed. See `PIRATE_FLAGSHIP.md` for local toggles
  and the remaining combined M03/M09/M10 acceptance checks. No commit/push.

### Salt King aboard the flagship — 2026-10-12 (source only)

- User explicitly moved the captain aboard, superseding the earlier shore/cave
  placement constraint. Boss home is source deck point (410,910), on the aft
  fighting deck. Existing boss/content/quest identity, rewards and timing remain.
- Captain and deck-home summons use ship confinement, larger boss foot clearance,
  cached mast routing and pirate/captain separation. Validated Salt King helpers
  are the only new dynamic spawns admitted on deck; their saved encounter homes
  retain ship behavior on reload. Global regional-spawn exclusion remains.
- Save parsing repairs off-deck/unsafe captain positions without resetting
  damage, defeat, respawn deadline or quest progress. Valid deck movement remains.
  Captain respawn now shares the offboard/away safety gate with cleared crew.
- Updated quest, dialogue, cinematic, outlook and sign directions to the
  flagship. No ship sailing, interior, ranged/heavy crew or new boss art added.
- No tests, typecheck, build, game launch, commit or push. Refresh an existing
  session to apply saved-position migration. Full ship/boss acceptance remains
  pending the user's authorization. See `PIRATE_FLAGSHIP.md`.

### Pirate-family side-walk checkpoint (2026-10-12)

- Source/art follow-up: new complete Salt King and cutlass crew side-walk boards,
  clearer contact/passing/lift poses, shared right-facing cycles mirrored left.
  Fixed neutral-body scale; up/down and combat artwork unchanged.
- Created `walk-sides-v2.png` in both enemy folders. Crew's incorrect final
  sword-hand pose is excluded. See `PIRATE_FLAGSHIP.md` for prompt/provenance,
  atlas bounds and manual checks.
- No tests, typecheck, build, game launch, commit or push. User will manually
  verify this visual change; overall M03/M09/M10 acceptance remains pending.
- Next: review the user's manual result before starting another milestone.

### Pirate-family gait/strike refinement checkpoint (2026-10-12)

- Added complete six-pose `walk-gait-v3.png` sheets for captain/crew and explicit
  half-stride ordering, weighted holds and deterministic independent crew phases.
- Split pirate/captain attacks into timed windup and strike/recovery clips using
  existing gameplay timers. Up/down, damage, cooldowns and body radii unchanged.
- Source reviewed and final source images inspected; no tests/typecheck/build,
  game launch, commit or push. Previous quick test result predates this change.
- Manual gait/attack acceptance remains pending. Details, paths and prompt set
  in `PIRATE_FLAGSHIP.md`; do not mark the whole pirate milestone accepted yet.

### Pirate crowd/locomotion checkpoint (2026-10-12)

- Removed crew standing poses from moving up/down loops. Crew sides now use
  original modest steps rather than exaggerated generated lifts; generated crew
  sheets remain on disk but are not loaded. Captain artwork remains unchanged.
- Pirate/captain chase uses spaced attack approaches and local ally-aware heading
  probes; physical collisions, ship confinement and intentional attack pauses
  remain. Brief movement-state hysteresis reduces walk/idle flicker.
- Source review only; no tests, typecheck, build, launch, commit or push. Manual
  acceptance/performance pending; see latest `PIRATE_FLAGSHIP.md` section.

Latest follow-up: restored the six-pose crew side gait from `walk-gait-v3.png`
after the original modest side frames looked too static. The side cycle uses
contact/down/passing phases for both leg leads and excludes idle. No tests,
typecheck, build or launch. Manual visual confirmation remains pending.

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

The original plan-only update created no game code or assets. The M01a checkpoint above records the subsequent authorized source-only implementation. Future requests control validation, remaining implementation, commits, pushes and builds.

### M14a–d combined implementation checkpoint (2026-10-13)

The user requested the remaining M14 family in one batch, superseding the
previous one-family-per-session pacing. All four M14 families now have source
implementations; none is claimed runtime-approved without manual acceptance.

- M14b: complete directional goblin stone-slinger artwork, actual stone sprite,
  shared bounded projectile combat, mixed two-melee/one-ranged goblin groups,
  authored freight encounter upgrade and surviving saved-group migration.
- M14c: complete directional blighted thornling artwork and two-to-four-member
  groups restricted to corrupted Greenward/pilgrim sites, not healthy gardens.
- M14d: complete directional grove spider artwork, anatomy-guided eight-leg
  refinement, readable bite windup/recovery, shaded-forest groups away from
  roads/towns, and a persistent pilgrim-clearing nest. No invented poison/web
  obstruction subsystem or boss-model replacements.
- Shared group spacing, alerts, home leashes, stat growth, targeting, collision,
  save and chunk streaming are retained. Dead member records survive pruning
  until the whole group is defeated, preserving casualty/composition history.
- Spears and stones share the same eight-flight pool and clear on source
  defeat/unload/travel/shutdown. Corrected release-position aiming; existing
  spear speed/range/lifetime are unchanged. New stones are finite non-homing
  shots using scaled damage, not decorative lines or generic circles.
- Added serial on-demand atlas loading for M14b–d with two-family residency,
  live-actor protection, corpse grace, source release and shutdown cleanup.
  No permanent boot preload of all three new family atlases. Resource estimates,
  selected PNGs, exact built-in image-generation prompts and acceptance limits
  are documented in `M14_CREATURE_ART.md`.
- No tests, type checks, builds or game launches ran. Rendered gait/registration,
  projectile behavior, save/resume, residency transitions and actual device
  performance remain pending authorized/manual verification. Next family is
  M15a–c: stone crawler, rootgnawer and marsh crawler.

### M14a hedge goblin implementation checkpoint (2026-10-13)

- Added the Trandum hedge goblin scavenger with matching painted artwork and
  complete directional idle, four-phase walking, dagger attack, hurt and death
  poses. The left-facing profile mirrors whole right-facing poses. Corrected
  repeated front contacts and a clipped back-facing fallen pose using separately
  generated complete figures, not stitched limbs. Assets, exact prompts and
  source-registration notes are documented in `HEDGE_GOBLIN_ART.md`.
- Added persistent three-goblin scavengers beside abandoned crown freight,
  beyond the safe camp radius, plus atomic two/three-member ambient groups at
  Trandum woodland/margins or near that abandoned store. Native habitat,
  settlement/farmland/water/lava exclusion, scenery clearance, encounter budgets,
  saved damage/defeats and chunk streaming use the existing implementations.
- Goblins use shared approach spacing/collision and group alerts/leashes.
  Generalized the bounded idle patrol-following helper so short-leash groups
  remain together; wolves retain their approved pack behavior and the ship's
  posted actors retain separate routines. Reused quieter distance-gated human
  vocal assets at a higher playback pitch and existing dagger/impact cues.
- Base stats: 54 HP, 8 damage, 85 movement, 16 XP; existing regional scaling
  applies. Attack windup/recovery is 320/480 ms with matching impact playback.
  Goblin stone-slingers remain disabled/unimplemented until M14b.
- Source implementation complete, not runtime-approved. No tests, builds,
  type checks or game launches ran. The single 44-frame density-2 atlas costs
  10.5 MiB raw; source textures are released. Actual performance, all-facing
  GPU/body/foot/weapon registration and save/combat behavior remain for manual
  acceptance. Next family: M14b goblin stone-slinger.

### Legacy single-pirate correction (2026-10-13)

- Corrected the saved-crew migration's exclusion of pirates with no encounter
  ID. Surviving legacy singleton deckhands/coastal bandits now receive a stable
  encounter ID and two safely placed companions, forming the same two-deckhand,
  one-boatswain composition as new patrols. All additions are staged before
  committing IDs/records: unsafe placement or insufficient persistent capacity
  leaves the original record untouched instead of creating an incomplete crew.
- Retained original actor IDs, saved damage and defeated states. Grouped lone
  survivors are not replenished, because previous companions may have been
  killed and their corpses pruned. Ship encounters remain separate.
- Existing shared admission activates pending group members atomically; new
  pirate patrols already reject fewer than three available hostile slots.
- Field patrol followers now keep near their living lowest-slot leader during
  idle roaming rather than independently drifting across their whole leash.
  Wolf behavior and the ship's posted crew/deck routines are unchanged.
- Source review only; no tests, builds, type checks or game launches ran.

### Enemy tier and elite threat tuning (2026-10-13)

- Audited damage delivery: ordinary attacks, pooled spears and dragon damage
  already consume the actor's scaled definition, not a shared fixed damage.
  Player defense/rally modifiers and local unlimited-health cheats still apply.
- Increased per-level growth above the existing level-5 baseline: HP +16%
  and damage +8.5% of base per level, replacing +11% / +3.5%. Existing XP
  scaling remains +13% per level, so durability and attack threat now grow
  faster than XP reward. No new per-frame scaling or player-level rubber banding.
- Boatswains, ranged orcs and alpha wolves now receive +5 levels above their
  regular pack members. Bosses retain +10. Encounter home determines the
  shared area tier, preventing wandering/restoration from changing members'
  relative levels. Alpha wolves retain their existing extra stat multipliers.
- Raised spear-orc baseline HP/damage from 88/12 to 120/16 and XP from 28 to
  35, making the higher-level ranged role genuinely stronger than melee orcs.
  Boatswains already have stronger baseline stats than deckhands.
- Updated saved pirate composition migration to use the same elite level rule.
  Existing HP/max-HP restoration preserves saved damage fractions; casualties
  remain defeated. Legacy saves without maxima retain their recorded raw HP.
- Source inspection only; no tests, builds, type checks or game launches ran.
  Gameplay difficulty is not claimed runtime-balanced without manual review.

### Mandatory mixed pirate patrols (2026-10-13)

- Regular pirate groups now require exactly three actors: two cutlass deckhands
  and one boatswain. Removed the capacity fallback that created deckhand pairs;
  insufficient capacity/clear positions reject the entire new patrol. Ambient
  selection skips pirate patrols when fewer than three slots are available.
- Salt King reinforcements now use the same atomic three-member composition,
  with a single group request and three reserved summon slots. This supersedes
  the prior two-member reinforcement correction below. The authored flagship
  retains its existing five-member complement (three deckhands/two heavies).
- At scene creation, saved off-ship two/three-member pirate groups are upgraded
  to this composition. Existing IDs, damage fractions, casualties and timers
  remain; a surviving old pair gains its missing third member only when a safe
  nearby native position and persistent-record capacity exist. Cleared pairs,
  unsafe placements and singleton ship reinforcements are left untouched.
- New group admission still respects the global hostile cap, boss reservations,
  protected settlements, scenery, habitat, and ship rail/cover boundaries.
- Source review only; no tests, builds, type checks or game launches ran.

### Boatswain spawn-path correction (2026-10-13)

- The authored flagship already assigns crew slots 1 and 3 to boatswains, but
  Salt King reinforcement requests were exclusively cutlass deckhands. Each
  reinforcement wave now requests a boatswain first, then a deckhand, keeping
  the existing count, shared budget and on-deck restrictions. Up to eight
  nearby deck candidates are tried per member to avoid losing that role to a
  single blocked rail/body position. Other bosses' summon behavior is unchanged.
- Removed direct boatswain-to-deckhand coercion. Direct boatswain requests now
  form a mixed crew led by a heavy, while ordinary three-member coastal crews
  retain their existing two-deckhand/one-heavy composition.
- Existing crew IDs, defeated states, timers and player saves are not reset.
  Already-defeated authored boatswains remain absent until the crew's normal
  replacement cycle; reinforcements provide an additional live spawn path.
- Source and supplied sprite inspection only. No tests, builds or game launches
  ran; live actor counts/save contents and rendered visibility are unverified.

### Shared ground-enemy chase spacing (2026-10-13)

- Orcs and other non-wolf ground enemies now use the pirate approach-slot and
  local ally-avoidance logic instead of converging directly on the player.
  Nearby live enemies of every family participate in avoidance. Spear throwers
  reserve positions on a separate 280-unit ring, retaining ranged standoff.
- Extended the existing pirate collision safeguard to other living ground
  enemies, including roaming/returning actors. Wolf-to-wolf collisions remain
  disabled to preserve approved pack movement; dragon movement/flight remains
  under its dedicated combat controller.
- Preserved wolf hunting lanes and staggered attack windows, extending their
  soft repulsion to nearby enemies outside their own pack. Attack locks,
  recovery pauses, movement speeds, scenery checks and hostile limits remain.
- Source inspection only; no tests, builds, type checks or runtime checks ran.
  Crowd behavior and rendered spacing remain pending manual acceptance.

### Rindass orc visibility correction (2026-10-13)

- Fixed an admission contradiction: the abandoned Southern Caravan Shelter
  contained an authored warband but the universal safe-camp radius prevented
  its actors from activating. Only this occupied shelter is marked hostile;
  civilian camps and protected settlement areas remain safe.
- Moved the two existing warbands into their sites' clearings, away from the
  discovery markers/ruined foundation. Living saved actors still on the old
  marker are relocated without resetting HP, rewards or defeated records.
- Added two persistent Red Mesa field patrols, north and south of the actual
  six-sided defended perimeter. Each contains two melee orcs and one ranged
  orc and uses existing chunk streaming, group admission and save persistence.
- Orc habitat now includes Rindass meadow/coastal ground (still excluding
  water, lava, farmland and protected settlements). Dryland uses wilderness
  spawn cadence/chance/density; ambient selection skips a three-orc family
  when fewer than three admission slots remain. The global 16-hostile cap
  and boss reservations are unchanged.
- Source review only. No tests, builds, type checks or game launches requested
  or performed; rendered appearance and actual traversal need manual review.

### M04 implementation checkpoint (2026-10-12)

- Added a complete Rindass melee orc asset family: four directional neutral
  poses, six authored alternating-foot steps per direction, and six-frame
  attack, hurt, and death sequences. The neutral frames are excluded from the
  locomotion loops; full-body frames share a fixed scale and ground alignment.
- Added one persistent three-raider group at each of the Shared Well and Empty
  Caravan Shelter wilderness sites. The family also has a Rindass ambient
  weight, constrained to dryland/highland wilderness outside settlements;
  friendly orcan NPC definitions and Krag's existing boss/summon setup remain
  unchanged. Random ambient raider admissions use the 2-melee/1-ranged
  formation once M06 is active.
- Source and sprite-board review only. No tests, typecheck, build, or game launch
  were run under the standing no-test rule; runtime gait, combat, pack spacing,
  and habitat acceptance remain unverified. Asset layout and generation notes
  are recorded in `RINDASS_ORC_RAIDER_ART.md`. M04 implementation is complete;
  the requested manual acceptance remains with the user.

### M05/M06 implementation checkpoint (2026-10-13)

- Registered the saved Rindass spear-thrower assets and directional idle/walk,
  attack, hurt, and death clips. The authored attack holds the wind-up poses so
  projectile release aligns with the throwing motion; directional side poses
  are not mirrored.
- Added an eight-shot pooled projectile system with release-time committed aim,
  swept player/scenery checks, terrain stopping, finite lifetime/range, and
  cleanup on source defeat/unload, travel, and scene shutdown. UI/dialogue/
  cinematic pauses do not advance shots. The spear thrower maintains a ranged
  standoff and only fires through a clear line.
- Random ambient Rindass raider spawns validate and commit complete encounters
  atomically: exactly two melee raiders and one spear thrower, each
  individually checked for region/biome, walkability, settlement/building
  clearance, player spacing, and group spacing. Capacity shortfalls reject the
  whole encounter. Authored M04 camp patrols and other event-spawn patrols keep
  their existing persistent identities/compositions; spearmen have no
  independent ambient weight.
- Source review only. No tests, build, typecheck, or game launch were run at the
  user's request. Runtime projectile registration/impact and the art in motion
  remain for the user's manual acceptance. M04 is implemented but not claimed
  runtime-verified; M05 and M06 source implementation is complete, pending that
  same manual acceptance.

### M08 implementation checkpoint (2026-10-13)

- Added a heavy pirate boatswain matching the approved cutlass crew's painted
  style. Three saved PNGs provide 28 directional idle/walking poses, 24
  directional mallet-attack poses, and 24 directional hurt/death poses. Source
  alpha/subject review found all expected complete figures. Neutral poses stay
  out of walking loops; side facings use their own authored poses.
- The dedicated atlas isolates complete connected subjects across approximate
  source grid seams, calibrates body size once per facing/state against a
  standing pose, and anchors raised/low mallets independently of boot soles.
  Its 76 frames occupy one 2048x2560 RGBA texture (20 MiB before driver
  overhead); source textures are released after atlas preparation. This is a
  source resource calculation, not a measured mobile-performance claim.
- Boatswains have slower movement, greater health/damage, a 700ms frontal
  windup matching the impact frame, 700ms recovery, and longer ordinary stagger
  immunity. Crescent Flurry still forces the existing full suppression window.
  They use human vocals and heavy impact audio, existing warning artwork,
  pirate ally steering, collision, deck navigation, leashes, and cleanup.
- The flagship keeps five crew members: three cutlass deckhands and two
  boatswains. Original crew IDs, positions, defeat/respawn ledgers, and saved
  health ratios are preserved. New three-member Portquill crews contain two
  cutlass pirates and one heavy; crews admitted with only two available slots
  remain cutlass pairs. Heavies do not receive a separate ambient spawn weight.
- Source implementation is complete; no tests, typecheck, build, browser/game
  launch, commit, or push were performed. Rendered body/weapon registration,
  gait, telegraph reach, deck crowding, Flurry behavior, and performance remain
  for authorized/manual review. Artwork and exact built-in generation prompts
  are recorded in `BOATSWAIN_ART.md`. Next unfinished family: M14a hedge goblin;
  M09/M10 and M11-M13 already have implementation checkpoints above.

### M08 gait correction (2026-10-13)

- The user rejected the original walking animation. The original sheet's pose
  variety did not establish a coherent support/passing cycle; its six-frame
  loops are superseded rather than described as accepted.
- Added `walk-side-v2.png` and `walk-vertical-v2.png` using complete full-body
  generation with an explicit hip/knee/ankle guide. Selected only contact and
  lifted passing poses: side source 0,2,3,5; down contacts from the original
  source plus new passing poses 2/3; up source 4,6,5,7. Rejected duplicate lead
  contacts and a side pose that changes the mallet hand.
- All facings now play four poses at 7fps with the existing speed adjustment
  and phase-preserving direction changes. Side walking is mirrored from one
  canonical cycle during atlas preparation. Idle/combat poses and their
  registration remain unchanged. Reused existing locomotion cells, keeping
  the same 76-slot / 20-MiB atlas; new source textures are released after use.
- Source art/code review only; no tests, typecheck, build, browser/game launch,
  commit or push. Actual rendered gait and transitions remain unverified.
  This correction is pending the user's manual appearance acceptance.

### M18-M20 boss-family implementation checkpoint (2026-10-13)

- Krag now uses a complete armored orc chieftain instead of the boar model,
  directional melee/windup/hurt/death poses and orc-raider reinforcements.
  Dedicated whole side contact/passing sources alternate the supporting leg;
  duplicated generated lead-foot poses are excluded. Stable `iron-tusk` boss
  and `redmesa-chieftain` enemy IDs remain unchanged.
- Frost Wyrm now has a scaled, four-legged, wingless ice body with a grounded
  lunge. Native frost wolves reuse approved wolf anatomy and coordinated pack
  behavior; frost alpha wolves retain the five-level elite rule. Save loading
  preserves IDs, wounds and pack state when upgrading old Frostlands wolves.
- Source review confirmed Rootfather's blue skeletal-wraith silhouette did
  not communicate the mine/root guardian. Implemented a complete root-and-stone
  replacement with amber core, rooted gait, warned slam and full hurt/death
  poses. Its existing marsh-wraith summons and quest identity are retained.
  This source decision does not substitute for the plan's rendered review.
- All bosses are 12% larger with proportional collision radii, reach and
  warning footprints. No other boss artwork, health, damage, reward, timer,
  quest ID or cinematic hook was replaced. Dragon ground/flight share the
  same new appearance multiplier.
- Reused the on-demand art loader: two ambient family atlases plus one boss
  atlas maximum, boss queue priority, no eviction of live textures, released
  source images. The 16-hostile and 512-persistent-spawn ceilings are unchanged.
- Source implementation of M18, M19 and M20 is complete; rendered acceptance
  remains pending. No tests, typecheck, build or game launch were run.
  Assets, prompts and registration limitations: `BOSS_REPLACEMENT_ART.md`.
  Subsequent all-boss source review and updated one-board walking assets:
  `BOSS_ANIMATION_REVIEW.md`. No claim of perfect/rendered gait acceptance.

### M14 habitat expansion (2026-10-13)

- Goblin encounters are uncommon wilderness trios in all eight land regions:
  two hedge-goblin melee scavengers plus one stone slinger. They are not town
  residents and do not spawn inside protected settlements, farms, sea or lava.
  Every member must pass occupancy and spacing checks before atomic admission.
- Grove spiders inhabit forests in any region, away from roads. Night adds
  eight selection-weight units and targets 3-4 members rather than daytime
  2-3, subject to existing density/reservation caps. Night uses the same 18:00
  to 06:00 clock boundary as ambient encounter admission.
- Thornlings may inhabit ordinary land within 350 world units of actual
  loaded trees as well as the existing Narenthil blight sites. A separate
  bounded scenery tree index includes regional/dried trees without introducing
  woodland wildlife into inappropriate biomes; entries leave with their trees.
- Broadened old goblin-crew upgrades beyond Trandum while preserving casualties
  and health. Habitat changes affect new admission; they do not refill defeated
  packs or remove persistent encounter identities.
- Source review only; user manual exploration and rendered review remain the
  acceptance path. No tests or builds were executed.
