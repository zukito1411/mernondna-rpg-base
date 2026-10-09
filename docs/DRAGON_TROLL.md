# Troll and Darkav dragon integration

Source implementation, 2026-10-09. Source and supplied-image inspection only;
no tests, type checks, builds, game/browser launches or gameplay simulations.

## Asset findings and registration

The new folders are `enemies/troll` and `enemies/dragon`. Their ordinary poses
are 192x152 cells: six frames for idle/walk/hurt/death, five for attacks. Both
use transparent backgrounds. All supplied ground strips were inspected.

- Troll attacks show a lifting club followed by a downward strike. The club's
  reach must not recenter the torso or be clipped into the old 96x80 atlas.
  Trolls now use a separate 160x128 logical atlas and a fixed torso/foot anchor.
  Lower padding accommodates the hurt/death poses extending below idle feet.
- `troll/club_impact.png` is 768x128, with six nominal 128px cells. Cells 0 and 5
  are empty; cells 1 through 4 contain the real dust/impact sequence. Only those
  four poses are packed, retaining the original strip dimensions.
- The dragon attack strip already contains an illustrated fire-breath pose.
  Ground animations use their own 256x224 atlas and fixed body registration,
  retaining the fire plume rather than trimming it into a generic monster.
- `dragon/flying.png` is 2172x724. Its six illustrations are **not** equal-width
  cells. Alpha-component inspection found distinct silhouettes with widths
  336, 335, 390, 360, 335 and 316px. Uniform 362px cuts would include adjacent
  art and truncate wings. The manifest now records individual frame rectangles,
  the original image size, a constant fit and per-pose body registration.
  A separate 416x416 logical atlas includes lower wing clearance.

These atlases are packed at 2x density, below 4096px per side. Source PNGs/WebPs
are unchanged. Existing species IDs 0 through 3 and their generic atlas remain
unchanged; new troll/dragon animation species use 4 and 5 in separate textures.
Dragon death art is available but deliberately not played for a retreat.
Flying body/foot anchors are art-space estimates and have not been reviewed in
motion on a device.

## Monsters and combat

Common Cave Trolls now use the troll artwork rather than wraith art. They roam
Nardorous, Druganwoods, Rindass and Darkav through existing ambient spawning,
with existing settlement protection retained. They have 180 HP, a larger body,
and a telegraphed club slam with the supplied impact sequence. Stonejaw retains
his existing boss identity, content ID, quest and rewards while using a larger
version of the same troll presentation.

Varkhul, the Returning Ember is an additional Darkav quest boss, not a
replacement for the Ashen Seer. Grounded visible height is about 275 world
pixels compared with Leigneron's 76. He has 1800 HP, a 64px physical radius and
three local, delta-driven attacks:

1. A marked 240px stomp circle with a one-second windup and shockwave.
2. A frozen-direction triangular fire warning, then sustained breath pulses.
   Damage matches the marked triangle and respects scenery line of sight.
3. A curved airborne reposition, moving shadow, then a marked landing stomp.
   He cannot be targeted/damaged while airborne; ground collision resumes on
   landing. Ordinary hits do not repeatedly cancel his windups. Hurt poses are
   shown during idle/recovery instead.

Fire uses the authored attack pose plus bounded additive flame graphics.
Attack timing stops during normal UI/focus pauses; damaging dragon logic has
no detached delayed callbacks. Owner destruction clears warnings, fire, flying
presentation and shadow. Leaving the lair cancels attacks and returns the boss
home rather than dragging him into Blackspire. Ground markers scale with the
new large physical bodies.

## Lair and quest

The lair is a fixed Darkav basalt shelf northeast of Blackspire, beside the
existing volcanic flow: Blackspire world position + (6100, -4500). It has a
900x700 half-extent fighting deck, a molten rim, and an open western approach.
The authored ash trail follows the southern exterior road east, then north
outside the fortifications to that approach. Terrain and road-clearance queries
share the same trail. No arena gate, invisible fence, player teleport or lava
crossing was added. Optional wilderness scenery and ambient/event monster
spawns are excluded from the combat deck.

The Cinderwatch Ward on the safe western bank provides a quest clue and, during
recovery, a rounded real-minute return countdown. Surrounding basalt/ember
details use existing volcanic world assets and night emissions.

`The Returning Ember` is offered by existing Blackspire characters Vexa Cinder
and Dain Emberfall: hear Vexa's warning, inspect the ward, force Varkhul to
retreat, report to Dain, then return to Vexa. Its texts tie the encounter to
their existing forge/ash-road responsibilities. The quest awards 650 XP and
300 gold once; completed objectives and quest rewards do not reset on rematch.
Victory before accepting the quest remains in boss history and is recognized
when preceding story objectives are completed.

## Retreat and persistent rematches

Reaching zero encounter HP means a forced **retreat**, not a slain dragon.
Varkhul visibly flies away instead of playing a death animation. Combat rewards
are 520 XP and 70-100 gold per victory. The repeatable boss is not subject to
the existing one-time boss reward guard; ordinary bosses retain that guard.

A saved `worldContent.states['boss:varkhul'].respawnAt` UTC deadline schedules
his return after **30 real minutes**, including time offline or in menus. The
deadline, victory history and rewards are saved together on retreat. Only
scheduled returns are examined, including distant/unloaded chunks. At expiry,
the logical record returns to the authored lair with full HP; its render actor
activates only when the player streams that area. Permanent victory history
does not suppress this repeatable boss on load.

The existing v4 save accepts the new optional deadline with shape/boss checks;
the save key/version are unchanged and older saves need no new required field.
Quest progress and encounter availability are separate. This offline game uses
the local device clock, not an authoritative server cooldown. Mid-attack phases
are disposable; loading restores a grounded encounter with saved HP.

## Remaining verification

Actual atlas loading, flying motion/registration, combat balance, night effects,
approach walkability, old-save loading, offline deadline restoration, repeated
reward behavior, PC/mobile input and performance remain unverified. No generated
web/Android package was rebuilt or refreshed. Existing sea-travel limitations
remain; this addition does not introduce controllable ships.
