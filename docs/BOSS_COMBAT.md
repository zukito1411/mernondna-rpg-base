# Boss combat and rare drops

Boss weapons use a 25% base chance. The existing Luck bonus adds 0.5 percentage
points per point, reaching 45% at Luck 40. The Character screen and real loot
roll both read `bossWeaponDropChance`.

A successful roll adds a six-second, nonblocking notification with the existing
weapon icon and name. An owned weapon becomes one matching forge material;
the popup distinguishes a new weapon, duplicate material, and material-cap
salvage. Notifications queue separately from ordinary toasts and wait while
menus, dialogue or cinematics cover gameplay. They are transient and are not
serialized into saves.

Holding Space or the touch Attack button repeats basic attacks through the
existing weapon recovery, stamina, casting and dodge checks. A quick tap still
produces one press. Touch capture ends on release, cancellation or lost capture;
focus/menu resets clear the hold.

Basic attacks cycle through the existing slash (100% damage), a reverse return
slash (120%), then a heavy cleave (170%). The first two use normal stamina and
recovery; the finisher costs 175% stamina, rounded up, and takes 135% recovery.
The return cut has a slightly wider forward arc. Its impact occurs one-third
through the stroke; the heavy cut holds its raised pose and strikes halfway
through. Aim is locked when each swing starts, and range/line of sight are
checked at impact. Weapon enhancements and ordinary status-effect rules apply
to every strike without multiplying status strength by combo damage.

The next tap can continue the chain for 700ms after recovery. Holding Attack
cycles automatically. Missing an enemy still advances a committed swing;
insufficient stamina does not advance or spend any stamina. A dodge, received
hit, successful combat art, equipment change, respawn or input/menu reset breaks
the chain and cancels any pending impact. Existing complete directional poses,
foot registration and equipped-weapon attachment are retained.

## Ground boss profiles

`bossCombatProfiles.ts` defines eight identities. `BossCombat` drives their
movement and finite sequences using active-play delta. Half-health sequences
combine at most three moves. Each follow-up gets its own windup and recovery,
and is abandoned if the player escapes range or breaks line of sight.

| Boss | Behavior |
| --- | --- |
| Captain Varr | Circling cuts, broad cleave and a committed thrust |
| Moonlit Warden | Long moonlit rush, fixed moonfall marks and crescent claws |
| Stonejaw | Slow boulder crushes followed by annular earthquake echoes |
| Krag | Long charge lanes, wide flank sweeps and close stamps |
| Rootfather | Fixed root traps, crushing roots and hollow eruption rings |
| Salt King | Strong lateral footwork, broad deck cuts and boarding thrusts |
| Frost Wyrm | Long glacial rushes, ground eruptions and tail sweeps |
| Ashen Seer | Ranged ash marks, sequential echoes and hollow coronas |

Varkhul retains the dedicated ground/breath/flight/landing controller. Below
half health it uses more breath/flight pressure. Its landing circle is visible
through the full flight and descent, filling continuously to landing impact.
The breath warning uses the same flat far edge as the actual breath hit area.

Ground patterns lock facing or target ground at windup start. Charges validate
the advertised lane and move in short collision-checked steps, damaging at most
once when the boss actually reaches the player. Collision changes, staggering,
death, disengagement and unloading cancel pending attacks. Menu pauses freeze
the boss attack clock. Existing full actor animations and registered feet are
used; no sprite sheets, tiles, terrain or approved bandit walk frames change.

## Warning timing

`AttackTelegraph` keeps the full boundary visible and fills its interior toward
impact, turning red near completion. Hollow rings retain their safe center.
Boss hit checks and new warning geometry share the same `AttackArea` values.
Ordinary enemy windups also gain the fill; their progress reads the actual
attack timer, including frost slowing. The boss HUD shows the current move and
a small windup meter, quantized to avoid unnecessary UI updates.

## Enhancement verification

The existing enhancement action consumes exactly one spare copy of the selected
boss weapon, retains the owned weapon, and leaves other weapon materials alone.
Each rank adds 8% base damage, reduces base recovery by 2%, and adds one
percentage point of proc chance, to a maximum of +5. The real equipped-weapon
resolver feeds enhanced values to basic attacks and combat arts; status damage
also resolves the enhanced weapon. Upgrade ranks and remaining materials retain
their existing version-6 save fields.

Focused checks cover drop boundaries, material identity/consumption, service
access, the +5 cap, enhanced stats and persistence; held-input release; warning
geometry; locked aiming, delayed damage, cancellation and blocked charges.
The lightweight browser review renders the warning fills and popup, uses the
real forge UI and combat weapon resolver, checks touch capture, and exercises
the player update loop at upgraded recovery speed. It does not validate all
boss animation states or replace full-world manual balance testing.
