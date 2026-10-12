# Portquill cutlass crew and boardable flagship

Source implementation, 12 October 2026. Base revision: `bba9019`.
This combines the user's requested M03/M09/M10 family. It does not claim
executed animation, boarding, performance or save acceptance.

## Implemented

- `cutlass-pirate`: adult deckhand, 76-unit neutral body calibration, four
  directional idle/walk rows plus complete cutlass attack, hurt and death.
  Source subjects are isolated before packing 42 padded atlas frames. Walking
  left uses its authored direction, not a second mirror; right-facing combat
  mirrors west. Human vocals and sword foley reuse the existing bounded audio.
- Portquill bandits converted in ambient weights, regional road-spawn gateway,
  dynamic events and Salt King summons. New ordinary patrols admit 2–3 separated
  members as a complete encounter. Mainland bandits remain unchanged.
- Existing saved Portquill bandit spawns retain IDs, positions, HP/HP-max,
  encounter identity, defeats and reward history while changing enemy family.
  The original authored location determines the region; no broad save reset.
- One moored flagship at Tidewatch's eastern harbor mouth, outside civilian
  defenses and east of the ferry channel. Boat travel code is unchanged.
  Walk south along the eastern beach from the Salt King's sea-cave territory
  to the **Outlaw anchorage** marker, then west across the wooden gangplank.
  No teleport, menu-selected stage, or general water-walking permission.
- Measured deck polygon, eastern boarding strip, body clearance, mast footing
  and nine-node cached navigation graph. Shore/plank join has a deliberate
  dry-land handoff, not a body-radius gap. Terrain/path/skill safety and crew
  steering share these boundaries; procedural scenery is excluded.
- Five authored cutlass crew members with stable IDs and stations, shared
  alert/leash logic, complete-group admission under the 16-hostile budget,
  pirate-only body separation and no pursuit off the deck. Mast routing is
  cached for 250 ms per actor; the deck itself never moves.
- Crew wounds/defeats survive streaming and saves. Only clearing all five
  schedules a common 20-minute return. Returns wait until the player is off
  the boarding footprint and away from the ship. Partial clears do not refill.
- One persistent stolen-cargo chest (35 coins), approach sign, and Salt King
  aboard the aft fighting deck with his established quest/boss identity.
- Compact base, mast, stern-rail/cabin and pennant layers. Foreground artwork
  occludes actors at its ground plane. Outside generated haze is cut away by
  tight source masks. A correction removes the cannon crowding the entry.
  Existing water foam, crew/player contact shadows, five night light anchors
  and small independent pennant sway preserve a stationary fighting deck.
  Layers, colliders and motion release with the streamed ship owner.

## Deliberate scope adaptations

M09's review layout was directly fitted to the generated final source, then
integrated for the requested playable M10 slice. The original M07/M08 dependency
is **not** secretly complete: no harpoon thrower, boatswain or enemy projectile
family is added here. The enabled flagship uses five cutlass deckhands; ranged
crew and heavy crew remain separate later additions. No ship sailing controls,
ship interiors are claimed. The user's later request explicitly relocates the
Salt King aboard, superseding the initial shore-only slice.

The new pirate atlas and ship layers are prepared once at boot with source
textures released afterward. Actor streaming is bounded; texture eviction by
region is not implemented. Mobile GPU/startup cost must be measured before
adding more families or claiming no performance change.

## Artwork and generation record

Built-in image-generation skill/tool was used; no paid CLI fallback was used.
Selected project assets:

- `public/assets/enemies/cutlass_pirate/poses.png` (1312×1199): globally isolated
  subjects, not assumed exact source grid cuts. Six columns/seven authored rows.
- `public/assets/vehicles/pirate_flagship/ship-boardable.png` (1024×1536): consumed
  source with the eastern-entry cannon removed.
- `public/assets/vehicles/pirate_flagship/ship.png`: original ship reference,
  retained non-destructively; not loaded by the game.

Prompt briefs used:

1. Neutral deckhand: detailed painted top-down adult chibi pirate, red bandanna,
   navy short sailor jacket, red sash, brown leather boots, curved cutlass,
   no captain hat/shield/cloak; complete body and transparent background.
2. Animation board: preserve that outfit, use existing Salt King only for
   proportion/style reference; six columns by seven rows: down/left/right/up
   idle/walk, then six attack, six hurt and six death poses; consistent complete
   body/weapon, common ground baseline, no energy lines or motion blur.
3. Flagship: north-facing broad empty timber combat deck, dark navy weathered
   hull, brass fittings, edge cannons, stern cabin, small central mast, furled
   sail and red pennant; eastern horizontal gangplank, no actors/shore/water/text.
4. Entry repair: preserve 1024×1536 placement and camera; remove the cannon and
   carriage beside x550–640/y735–825 and clear the central eastern entrance,
   replacing its footprint with matching boards; preserve all other ship art.

An intermediate background-only correction did not adequately remove the
outside haze and was not selected. The source-derived runtime masks are used
instead. Source images and handful-of-pixel alpha/dimension metadata were
inspected, but no rendered atlas/animation acceptance was performed.

## Verification still required

### Salt King aboard follow-up

The captain now starts at source deck point (410,910), on the aft fighting deck.
Boss movement and saved deck-origin helpers share deck confinement and cached
mast routing. His body uses larger foot clearance than the ordinary crew. Only
his validated summons may spawn on the deck; ordinary regional encounters still
cannot materialize aboard. Helpers use persistent encounter homes to retain ship
navigation after reload. Crew/captain body separation avoids their model stacking.
The captain's existing scheduled return also waits while the player is aboard
or close to the ship, rather than popping up beside a stationary player.

Existing inland/shore boss save positions, or unsafe positions by the mast/edge,
move to his deck home while preserving health, HP-max, defeat flags, respawn
deadline and quest progression. Valid saved deck movement remains. Harbor-master
dialogue, regional cinematic text, bay outlook, approach sign and quest guidance
now describe boarding the flagship; boss/content/quest IDs remain unchanged.
This follow-up is source-reviewed only; no test/build/game launch performed.

### Boarding/local-testing follow-up

The approach sign originally sat directly in front of the plank. Although its
content requested `solid:false`, the shared sign-art profile enforces a solid
footing. Moved it south/east off the entrance, preserved its ID, widened the
walking strip to the visible boards (source y780–834), and removed the 2-source-
pixel centered-art offset so ship rendering and source-based traversal agree.
Deck/rail/mast/water safety remains; no water-walking workaround was added.
These corrections are source-reviewed, not gameplay-confirmed.

Local Vite development now defaults to unlimited health/stamina on localhost
and private-IPv4 Wi-Fi addresses, through the same local-only gate as settlement
travel. Values remain finite normal maxima; sprint, dash, attacks and skills do
not consume stamina and incoming hits do not lower HP. Hit feedback, skill level
requirements and cooldowns remain. Production/APK builds keep normal rules.
Use `?localCheats=0` to disable this for local normal-combat checks. `?e2e` retains
normal vitals by default; `?e2e&localCheats=1` explicitly opts into local cheats.
Refresh an already running game to initialize the new local mode.

No unit tests, type checks, browser/game launches, builds, commits or pushes
were executed for this combined implementation, per the user's standing rule.

Before calling M03/M09/M10 fully accepted: verify actual 42-frame boot/preparation
and loops; west combat and death/body registration; walk both gangplank directions
on PC/mobile; prevent rail/mast/water escapes and dashes; fight five crew without
stacking or stuck routing; stream/save/reload partial clears; verify 20-minute
return waits offboard; check Salt King summons and Portquill conversion with old
saves; inspect day/night depth and lamps; compare frame/GPU costs and ferry travel.
Keep earlier unrelated failures separate from this new work.

### Side-walking artwork follow-up (2026-10-12)

Replaced only the captain/deckhand left/right idle and walking frames with
complete right-facing poses, mirrored in locomotion for westward movement.
Their original up/down walks, combat/death frames, collision bodies and combat
timings remain. The new side boards use one neutral-body scale per character,
head-centered registration and grounded feet; lifted boots never cause per-frame
resizing. The existing movement-speed cadence adjustment still applies.

Assets created using the image-generation skill, with original sheets retained:

- `public/assets/enemies/salt_king/walk-sides-v2.png`: 3x3 board, neutral +
  eight walking poses; appended atlas frames 20-28.
- `public/assets/enemies/cutlass_pirate/walk-sides-v2.png`: 3x3 board, neutral +
  seven accepted walking poses; appended atlas frames 42-49. The ninth source
  pose changes the sword hand and is deliberately excluded from packing/playback.

Prompt set: edit the existing complete pirate poses into nine right-facing side
poses with transparent gutters, preserving outfits, weapons, painted RPG style
and chibi proportions. Request neutral, contact/down/passing/up phases for each
leg, visibly lifted knees/boots and stable scale. Refinement prompts requested
opposite-leg leads, clearer passing poses and unchanged sword/shield hands.
Final source sheets were visually inspected; runtime acceptance is still pending.

The captain walking atlas is 1280x1344; the crew atlas is 1920x2016 (both within
2048 per axis). Artwork is isolated/packed once during boot and source textures
are released afterward; no per-frame pixel processing or extra per-enemy effects.

No tests, typechecks, builds or game launches were performed. User manual checks:
walk/chase both directions, stop to idle, turn up/down, and transition through
attack/hurt/death. Check for boot clipping, size jumps, sliding or weapon-hand
changes. Manual visual acceptance does not guarantee unrelated gameplay is
bug-free or replace the outstanding ship/save/respawn acceptance checks above.

Authorized quick verification: `npm test -- tests/directionalActors.test.ts
tests/spriteComponents.test.ts` passed 9/9 checks in 1.67 seconds. The first run
found the coverage test omitted the custom pirate loader; that test now includes
its species, atlas counts and new asset paths. This checks registration metadata,
direction selection and subject isolation, not rendered footwork. No full suite,
build or browser/game launch was performed; manual visual checks remain needed.

### Gait and strike-phase refinement (2026-10-12)

The previous v2 sheets contained several similar boot poses, so a numerical
row-major loop was not a reliable alternating gait. New complete six-pose sheets
are saved at `public/assets/enemies/salt_king/walk-gait-v3.png` and
`public/assets/enemies/cutlass_pirate/walk-gait-v3.png`. Originals/v2 remain;
only the v2 neutral pose is still used in each atlas.

Both v3 boards have two columns and three rows. Columns represent opposing leg
leads; rows represent contact, weight/down, passing. `pirateMotion.ts` explicitly
orders source poses `[0,2,4,1,3,5]`, rather than treating sheet order as playback.
Captain atlas playback is `[21,23,25,22,24,26]`; crew playback is
`[43,45,47,44,46,48]`. Fixed scale for each complete cycle and grounded feet are
retained. Captain frame holds are 150/100/110 ms per half-stride (720 ms cycle);
crew holds are 110/80/90 ms (560 ms cycle), before movement-speed scaling.
Crew start at deterministic instance-specific phases and retain their phase
through idle; a separate seed leaves combat/wander randomness unchanged.
Up/down walking sequences, body radii and combat artwork are untouched.

Attack artwork now has separate one-shot windup/recovery clips. Captain uses
frames 0-2 then 3-5; crew uses 24-25 then 26-29. Existing windup timers launch
the strike/recovery clip on the same callback as damage evaluation, including
misses. Each phase scales to its existing gameplay duration and preserves
interruption checks. Damage, cooldown, summons and encounter rules are unchanged.
Other enemy families retain their current playback logic.

Built-in image-generation skill prompt set: preserve the existing full-body
identity, style, scale, weapon hands and transparent gutters; draw six right-
facing contact/down/passing poses with opposing leg leads by column. Targeted
refinements requested crossing-thigh/boot overlap in the right column while
keeping the left column and all weapons unchanged. Final source sheets were
visually inspected. In-game gait and transition quality are NOT yet verified.

Atlas counts are now captain 27 and crew 49; texture dimensions are unchanged
from v2. Additional source isolation occurs once at boot; no per-frame pixel
work, tweens or extra objects were introduced. Actual load/frame costs remain
unmeasured. The small existing coverage test's counts/asset paths were updated,
but no tests, typecheck, build or game/browser launch ran for this refinement.
The preceding 9/9 result applies only to the earlier implementation.

Manual acceptance: compare both facing directions at stroll/chase speed, stop
and restart, turn up/down, confirm different crew phases, and inspect attack
contact versus damage plus interrupted/missed attacks. Check body-size jumps,
ground-foot alignment, sword/shield consistency and the cycle seam.

### Crowd steering and crew locomotion correction (2026-10-12)

The crew vertical loops included both their leading and trailing standing poses.
Moving clips now use only the four interior steps: down 1-4, up 19-22. Side
walking uses the original modest right-facing poses 13-16, mirrored west;
side idle uses 12. This removes the generated exaggerated knee-lift cycle rather
than accelerating it. All crew walks use 9 fps before movement-speed scaling.
Attack/hurt/death and the captain's artwork are unchanged. The generated crew
assets remain on disk but are no longer loaded; its atlas returns to 42 frames,
1920x1568, avoiding those extra boot-time images/isolation passes.

Pirate/captain movement now reserves eight candidate approaches within attack
reach, preferring a stable unoccupied position. Candidates are checked every
600 ms against terrain, scenery and ship boundaries. Local lateral avoidance
and seven bounded heading probes steer around allied bodies, including stopped
attackers. Already-overlapping actors may move outward but not deepen an overlap.
Physical ally collisions remain enabled. Ship navigation, leash/return behavior,
intentional attack locks, damage and cooldowns remain unchanged. Other enemy
families do not use this steering. Work is bounded by the existing live actor cap;
no full-world navigation or per-frame neighbor-array allocation was added.

Pirate/captain locomotion now has an 8-unit/s start threshold, 2-unit/s stop
threshold and 90-ms sustained-stop grace, reducing walk/idle flicker from brief
collision recovery. Movement-speed cadence and independent crew phases remain.

Source-reviewed only: no test, typecheck, build or game launch. Actual visual
acceptance and performance remain unverified. Manual checks: all four crew
facings, multiple pursuing pirates plus captain, movement around a stationary
attacker/mast, deck-edge confinement, stopping at approach positions, missed/
interrupted attacks, and disengagement/return. Do not treat earlier tests as
verification of this follow-up.

Follow-up correction: the old original four-pose side walk above looked too
static. Restored the generated crew gait as the side-only cycle: idle frame 42,
walking order `[43,45,47,44,46,48]` (contact, down, passing on each lead leg).
Per-frame holds are 110/80/90 ms per lead for a 560-ms base cycle. The six-pose
art was source-inspected earlier; in-game smoothness remains pending manual
confirmation. Up/down loops still omit their standing endpoints.
