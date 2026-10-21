# Boss second phases

All nine world bosses, ten tower bosses and four cave-leader profiles now have
an explicit, named second phase. Every first health bar must reach **zero HP**
before the second form starts, including tower/ascended bosses and cave leaders.

Depleting the first bar immediately cancels its remaining attacks, projectiles
and hazards without awarding loot or quest credit. The boss then pauses for a
1,250ms active-combat-clock roar. During that roar the real HP
smoothly refills to the current maximum, and the existing health bar follows it.
Two small red dots sit directly below the bar: both initially lit, then the
second dims as the roar begins. No phase name, numeral or awakening timer is
displayed. Normal attack names/warnings resume afterward.

The refill is protected from direct/status damage and stagger, without hiding
the targeted boss or its health bar. Direct hits and status ticks can both empty
the first bar; excess damage never carries over into the second bar. Zero HP
with an active refill is explicitly living state, not a 1-HP damage floor.
The roar itself deals no damage; the next attack still receives its full warning.
Spent resolve remains latched after the full refill: only the existing genuine
out-of-combat recovery condition (12 seconds away plus full HP), or a fresh
respawn, resets both dots. Partial disengagement does not grant another refill.
Varkhul's recovery uses his actual arena engagement, not his smaller initial
detection radius, so ranged combat cannot accidentally reset his spent resolve.

| Boss | Second-phase identity and pressure |
| --- | --- |
| Varr | Rededge blood-crosses, returning executions and pursuing thrusts |
| Moonlit Warden | Flanking moon seals, eclipse rings and reaping pursuits |
| Stonejaw | Delayed outer fault lines, falling summits and earthquake echoes |
| Krag / Iron-Tusk | Blood-oath charges, two-sided axe executions and earthbreakers |
| Rootfather | Lingering thorn prisons, heartwood crowns and closing gardens |
| Salt King | Staggered ghost batteries, crossing broadsides and boarding reprisals |
| Frost Wyrm | Advancing forked ice fangs, inward jaws and avalanche pursuits |
| Ashen Seer | Marked fates, delayed judgment echoes and hollow black-sun attacks |
| Varkhul | Actual breath/flight/claw combos and separately warned hollow aftershocks |
| Grand Magus (tower) | Elemental chains, multi-strike realm thunder and a hollow devouring eclipse |

Tower versions retain their stronger authored attack sets and gain additional
phase-exclusive sequences. Normal-world versions have region-sized second-phase
moves. World Ascension at level 75 resolves to the **same tower profile object**
for the matching world boss, including the fury title, sequences and
cooldown reduction. It does not import tower HP, rewards or room coordinates.

Recovery windows remain intact. Phase-two between-combo cooldown is 75–80% of
normal for ordinary bosses, 72% for tower/ascended bosses. Warning windups are not
globally accelerated; damage/range changes are authored per move rather than an
unbounded stat multiplier. Up to six committed zones and the existing effect
pool limits remain. No terrain destruction, extra summons or persistent hazards
are generated outside these bounded, warned attack areas.

## Owning systems and integration

- `bossCombatProfiles.ts`: normal/tower/cave phase data and shared ascension map.
- `BossPhaseState.ts`: shared transition/latch, smooth HP interpolation and
  optional snapshot parsing, without independent timers.
- `BossCombat.ts`: safe phase entry, pattern selection and elemental multi-zone
  windups; tower circles/rings are fitted once at commitment to the round floor.
- `DragonCombat.ts`: full combo cursor (previously only `[0]` was used), larger
  registered impacts and one reusable warned aftershock; landing/aftershock
  bounds, actual damage and displayed warnings use the same dimensions.
- `Enemy.ts`, `TargetingSystem.ts`, `gameStore.ts`, `HUD.tsx`, `styles.css`: phase
  metadata in the deliberately engaged boss HUD; fixed-size red dots do not
  change character art or HUD text sizing. Health publication retains existing
  comparisons and the bar uses short linear interpolation during the refill.

Transition time pauses with combat. Disengagement pauses an unfinished refill;
re-engagement resumes its remaining time, not a second heal. Room exit and scene
destruction release owned visuals. The airborne dragon remains untargetable;
depletion safely clears its attack presentation and restores ground collision.
Only one dragon aftershock is active at a time; it cannot hit before its warning
completes and can hit once. It leaves a safe inner pocket and fades its warning.
The next action waits until the aftershock and recovery finish.

## Roar artwork and persistence

Existing complete poses were visually inspected. Varr/Salt King raise their
blades, Stonejaw raises his club, Krag uses his authored head-up chest-thump,
Frost Wyrm uses its open-mouth rearing pose, Rootfather/Seer raise their arms,
and the Magus raises his casting hand. Varkhul uses his actual head-up,
open-jaw pose. These are held challenge/channeling poses, not newly generated
multi-frame roar sheets. No body stitching, scaling, missing-frame fallback,
extra atlas decoding or startup artwork was introduced. Gameplay appearance
still requires rendered verification.

World bosses' existing HP records now optionally retain `bossPhase`: spent
resolve and an unfinished roar's elapsed time/start-health ratio. Streaming and
save/load restore that state; returning to a boss cannot reset its dots merely
because the roar healed it fully. Genuine respawns clear it. Old saves omit the
field and keep existing health/progression. Invalid optional roar timing is
discarded without rejecting the save or restoring spent resolve. Save version,
quest IDs, inventory, loot and tower floor/checkpoint rules remain unchanged.
A living zero-HP record is accepted only with a valid, unfinished boss refill;
ordinary zero-HP records still require a defeat flag.

## Varkhul durability

Varkhul's authored base HP is reduced from **1,800 to 900 (50%)**. The same
reduction applies before normal regional scaling, the level-50 breakthrough
trial and the permanent level-75 world ascension multiplier. Damage, defense,
attack patterns and rewards are unchanged. His tower echo retains its separately
authored 47,000 HP per bar. Both forms use the resulting encounter maximum.
Older saves with the former, larger HP maximum remain valid; actor restoration
maps their saved damage fraction onto the reduced maximum.

## Verification

Both required TypeScript compiler checks passed. No unit/browser tests, game launch,
build or APK build is authorized for this task. Added regression assertions
cover latching, the safe transition boundary, real HP refill/resume, optional
metadata parsing and save round trips, shared ascended profiles, bounded
patterns and multi-action dragon data; not executed.
Gameplay pacing, mobile HUD placement, all-facing effects, dodge fairness and
Android frame pacing still require runtime verification. Source inspection and
compilation do not establish measured performance or complete gameplay balance.
