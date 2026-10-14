# Regional citizens v2 — approved human body templates

Replaces the mismatched regional presentation with 36 full-pose reskins of the
existing Oakmere/Highmere adventurer, attendant, general, villager and smith.
Narenthil's approved elves and Trandum's original NPC artwork remain unchanged.
Existing NPC identities, dialogue, trust, quest links and interior residency
are preserved; this is a presentation repair, not replacement story characters.

## Active source artwork

Each transparent 1536x1024 board contains six distinct complete standing poses:
male traveler, female attendant, male officer, female herbalist, male smith,
female elder. Variations change clothing, age, hair and regional/racial details.

| Region | Active board | Regional details |
| --- | --- | --- |
| Rindass | `rindass-v2.png` | Peaceful olive-skinned orcs, small tusks, clan clothing |
| Druganwoods | `druganwoods-v2.png` | Dwarven beards/braids and guild outfits, round ears |
| Frostlands | `frostlands-v2.png` | Fur-lined winter outfits, round human ears |
| Portquill | `portquill-v2.png` | Maritime coats, ropes, voyager outfits, round human ears |
| Nardorous | `nardorous-v2.png` | Alpine wool, capes and mountain armor, round human ears |
| Darkav | `darkav-v2.png` | Charcoal, ash, rust and copper clothing, round human ears |

All models use the existing civilian idle height of **80 world pixels**, including
dwarves and orcs. There is no racial shrink multiplier. The full-body variants
retain the original NPC style rather than borrowing elven silhouettes.

## Framing and idle presentation

`src/data/regionalCitizenArt.ts` records measured complete outlines, including the poses
that cross nominal 512px cell boundaries. Each is extracted separately with
transparent gutters and an alpha-connected subject mask. Neighboring poses and
background haze are not copied into the runtime atlas. Edge-touching subjects
fall back to the original complete template and produce a console/registry
warning (`citizenArtWarnings`) instead of becoming cut sprites.

One complete pose per variant produces four subtly breathing idle frames,
played `0,1,2,3,2,1` at 3fps with staggered start phases. Breathing now spans about
1.8 world pixels at normal civilian size, instead of the almost invisible 0.6px.
These are grounded
whole-pose breathing states, not independently generated blink or walking
frames. Scale, costume and boot baseline stay registered across every frame.
Regional actors remain stationary, as requested; no fake locomotion is added.
Idle playback starts on creation and resumes if interrupted without changing
the grounded body registration.

## Mixed settlement population

`src/data/settlementResidents.ts` adds named local workers and visiting traders
to all twelve settlements. Villages/towns add two locals and up to two visitors;
capitals, strongholds and harbors add four locals and up to four visitors. The
visitor count is further capped at one per three natives (25% of the total).
People keep stable IDs, household contacts, affinity, schedules and dialogue;
they are not rerolled when chunks reload.

`visualRegion` chooses a character's artwork independently of the hosting town.
A human guest in Red Mesa therefore stays human, and an elf in Deepford retains
the approved elven model. Native clothing still follows the local regional kit;
human travelers in cold hosts use existing winter outfits. The same resolver is
used for dialogue/cinematic portraits. Human/elven additions reuse the supplied
multi-frame idle strips; regional variants use the four grounded breathing
frames. Approved existing NPC identities/artwork are unchanged.

New residents use authored work/gathering-court anchors, checked road clearance,
roof/foot obstruction checks, personal spacing and safe deferred chunk admission.
No extra atlas, generated artwork or dependency was added for this population.

The 1920x1920 atlas stays within a 2048px texture limit. Source GPU textures
are released after packing. Unavailable safe exterior positions are deferred
and retried once per second instead of spawning inside scenery or repeatedly
searching every frame. Exterior regional NPCs have immovable foot collision.
Interior regional residents also check their full silhouette against foreground
furniture and reserve separate workplace slots, without moving approved original
human/elven residents. An unsafe room placement aborts entry safely rather than
leaving a resident inside furniture.

The earlier `idle-animated.png`, `craft-idle.png`, `travel-idle.png` and
`highland-idle.png` boards are retained for comparison but are **not loaded**.

## Provenance and review boundary

Generated with built-in imagegen using the actual original human idle sheets
as references. The exact six prompts and reference paths are saved in
`docs/art/regional-citizen-v2-prompts.json`. Original approved artwork was not
overwritten.

All six source boards were visually inspected and their alpha outlines measured.
No tests, game launch, browser automation or builds were run for this repair.
In-game GPU registration, lighting and placement still require visual review;
source inspection alone cannot establish that every rendered result is perfect.
