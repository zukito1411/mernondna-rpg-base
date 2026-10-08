# Highmere city and story slice — 2026-10-08

Historical slice notes: [COMBAT_WORLD_OVERHAUL.md](COMBAT_WORLD_OVERHAUL.md)
supersedes the outer-wall limitation, resident count and map behavior below.
Highmere now also has an outer perspective-correct enclosure, north/south
gatehouses and two additional named guards. Current changes are unverified;
no further execution is permitted without an explicit user request.

This continues the existing continuous Phaser world and React/Zustand UI. Towns
are not separate stages. The 3×3 near-player terrain/content streaming limit,
original content IDs, original image files, Capacitor and save storage remain.

## What is implemented

Highmere's authored survey is now 5600×5200 logical units, approximately three
times its former area. Its first twenty lot IDs remain; fourteen lots extend
the city to 34 structures. The castle illustration is enlarged independently
of actor physics and dominates the royal precinct. Seven connected land-use
areas distinguish the royal, central, merchant, residential, military, Lower
and outer wards; the craft ward remains a working subdistrict. Alleys, door
frontages, agricultural access, lamps, stalls, shared wells, cargo yards and
the central fountain use the existing full-sprite clearance rules.

The royal precinct has a closed five-corner curtain with one passable,
south-facing audience arch. Source-measured rising/falling diagonal wall
sections are used in their original perspective; no sideways gate or rotated
horizontal wall is used. Segment collision follows the visible ground seams,
including dash/path crossing checks and an explicit opening. A compact
five-frame wall atlas replaces loading the unused full 25-frame atlas. The
royal gate has night-only torch illumination. Other settlements retain no
isolated gates. This is **not** a completed outer city wall: the supplied art
does not support Highmere's orthogonal perimeter without the perspective
mistakes the user prohibited.

Highmere has 32 named residents, including six marching knights, two audience
sentinels, a drill instructor, royal petitions steward, Lower Ward households,
a missing dockworker, his runner friend and a grain official. Each new story
character has identity, history with Leigneron, family/connections, occupation,
dialogue style, faction and story consequences. Eighteen additional named
workers bring the other nine regional settlements to four residents each;
Oakmere's existing cast is retained. No hostile ambient spawns were added to
settlements or the Lower Ward.

NPC schedules now have actual local activity locations. Visible actors follow
a visibility-checked street graph between them, with bounded local roaming,
stalled-route recovery, obstacle checks and conversation pauses. Off-screen
actors still freeze; this is not far-field population simulation. The western
watch marches a shared closed circuit at 38 units/second, with 100-unit file
spacing that remains separated around corners. Ordinary citizens do not form
immovable player barriers. No occupation-specific animation is fabricated
where only idle/walk art exists.

## Playable stories

| Story | Start | Content |
| --- | --- | --- |
| Shadows Beneath Highmere | Mairin Reed, Lower Ward kitchen | 9 stages: account, receipt, customs comparison, runner choice, hidden ledger, missing witness, physical escort, official confrontation, inquiry decision |
| The Royal Guard's Trial | Captain Yselle Ward | 11 stages: orders, instructor, sword/dash/art drills, stores inquiry, signal board, correct-order puzzle, dispatch delivery, timed relief watch, report |
| A Kingdom Divided | Renna Vale, after Shadows | 8 stages: archive, merchant/worker accounts, physical tally, petition delivery, royal policy choice, kitchen return, charter closure |

Quest events only advance the next matching objective. Clues can be revisited
after early discovery. Wrong puzzle answers do not advance. Dialogue choices
are explicit PC/touch buttons and can be deferred. The witness walks the route,
waits if Leigneron moves more than 210 units away, and resumes after reload.
Returning him relocates his subsequent routine to the kitchen neighborhood.
The relief watch lasts twelve active-play seconds and resets if the player
leaves. It is a civilian supply-watch challenge, not a scripted raid.

Choices persist, affect subsequent conversations and determine whether a
household charter is posted or a joint merchant-worker council convenes.
Council participants physically relocate to the public assembly area. Dialogue
cooperation raises affinity. Rewards issue once; completing or skipping a
cinematic never independently issues rewards. Delivery papers are represented
by the ordered quest record, not by adding non-weapon IDs to the weapon-only
inventory. This is not a general crafting/material inventory implementation.

`J` or the HUD Journal button opens completed/current objectives and recorded
decisions. Tracking a story changes its compass target without cancelling other
active stories. New stories start by speaking to their named giver; they do not
replace Aldren's existing Broken Road or Eightfold Blight.

## Presentation, travel and recovery

Six finite story presentations cover capital arrival, evidence discovery,
witness return, guard service, the royal audience and charter resolution.
Camera-framed locations stream through the existing managers without moving or
healing the player. Formation actors can march during presentation. Escape or
the touch-compatible Skip button restores camera follow/input and marks the
scene seen. No music/audio pack or castle interior is supplied by this slice;
the castle's audience steps are the playable story interaction point.

Four east/west Highmere bridges continue authored roads. The eastern regional
route now crosses the central bridge squarely before resuming its valley bends.
The source stone bridge's foreground railing has a separate render layer;
terrain traversal admits a 56-unit deck corridor, not the entire illustration.
Willowcross and Deepford crossings use the same corridor policy. Existing
harbor piers remain provisionally inland; physical ships/coastline authoring
are unchanged later milestones.

After ten peaceful active-play seconds, health regenerates at 2% maximum HP per
second in settlements, including while walking. Outside settlements, standing
idle for eight seconds is also required and recovery is 1%/second. Damage,
offensive actions, casting or an enemy within 400 units interrupts recovery.
Paused menus, dialogue, cutscenes and unfocused/offline time do not heal.

The newer hero-art changes were inspected and retained. Actual side-walk/idle
files are 2172×724, not the 2048×682 image-preview size previously entered in
metadata. PNG dimensions/cells are reconciled, optional WebP paths are optional,
visible-alpha trimming ignores nearly transparent stray pixels, each strip uses
one uniform scale, and all standing/walking presentations retain a shared
76-unit human scale and foot/body baseline. PNG files are not rewritten.

## Persistence and limits

Save version 4 and the existing storage key remain compatible. Missing
`storyFlags`, `storyChoices` and tracked quest fields default safely in older
saves. New quests default locked, pending dialogue/camera/UI state is transient,
and rewards, shrine unlocks, boss defeats, affinity and original content IDs
remain intact. New static art follows authored positions on reload as before.

The full user brief is not complete: outer city fortifications need compatible
additional artwork; regional interiors/shops, occupation animations, simulated
off-screen schedules, scripted raids/waves, systemic crime/economy, cinematic
audio, native-device performance and final non-human regional architecture
remain future work. Existing regional town plans are retained and populated,
not replaced by another random settlement generator.

Do not treat earlier checks as verification of the subsequent continuation.
