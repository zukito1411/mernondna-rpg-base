# Level gains and road life

Level gains from kills, quests and other rewards now set a dedicated transient
notice. The six-and-a-half-second banner includes the attained level and earned
attribute/learning points; multiple gains accumulate until dismissed. Other
loot/toasts cannot replace it. Menus, dialogue and cinematics defer it. A gold
ground ring, rising sparks, overhead level label and bell accompany it in play.
Reduced-motion settings suppress the rising particles and entry movement.
Loading a save clears these transient notices without changing saved progress.

Road life streams up to two parties (at most six people). Adventurers can travel
alone or in mixed two/three-person parties of swordhands, huntresses and archers,
using their existing walking and combat art. Town approaches can host a commander and two
guards, using regional presentations where available. These are separate from
quest residents and the existing capital formations. Parties enter outside the
camera margin and unload beyond the local view. Adventurers follow complete
surveyed town-to-town roads, including authored streets and bridge approaches.
Guard patrols cover roughly 2,600 pixels of exterior gate approach, returning
at each end. They remain on existing roads rather than crossing scenery.
Offscreen journeys advance on an active-play clock; unloading first projects
the party's actual feet onto its route, preserving delays caused by combat or
obstacles. Party composition remains stable when its renderer returns.
Terrain, swept feet, scenery, walls, neighboring residents and player clearance
are checked before admission; moving actors recheck their approaches. They wait
when blocked, try checked pedestrian sidesteps, and never teleport through an
obstacle to catch up. Road parties also avoid each other when passing or turning.

Each traveler follows persistent route corners at a steady walking speed.
Route following runs every active frame independently of the slower combat
decision tick, so catching a temporary moving marker cannot cause repeated
stops. Corner changes do not insert idle frames, and genuine waits preserve
the last facing rather than snapping upward walkers to a front-facing idle.
After combat or a pause, travelers physically rejoin a reachable route segment.

Threat checks run every 150 ms, within 320 pixels for adventurers and 400 for
guards. Ordinary enemies can provoke combat whether procedurally spawned or
authored, including enemies beside the player and enemies the player has hit.
Complete
existing NPC attacks deal damage at their animation impact frame, with locked
aim, range and line-of-sight checks. Roaming enemies can respond using their
ordinary warning/attack animations. Huntresses and archers release pooled arrows
at the bow animation's impact frame; arrows check swept contact and walls before
applying damage. Pausing or unloading a party cancels its arrows.
Wounded travelers or guards disengage,
recover and return toward their route. Player intervention remains possible.
Ranged enemies can aim spears/stones at their NPC opponent; those projectiles
retain a fixed release aim and use swept contact against that opponent.
Bosses, boss summons, mission reserve patrols and story encounters are excluded. Engagement leashes use
the traveler's position when combat began, rather than its original spawn point.
NPC-only kills update the roaming creature ledger without awarding the player
XP, gold, drops, journal kills or quest progress. A player who hits the opponent
receives the ordinary defeat credit if an NPC subsequently finishes it.

The prop blend samples a wide footprint of the existing baked ground and uses
its median color, so one pebble/highlight cannot tint an entire asset base.
Per-frame profiles isolate painted sand, vegetation, snow and ash ground mats.
Desert profiles include cacti, scrub, grass, bones, rocks and roadside props;
forest, winter, volcanic and regional/story assets have corresponding masks.
Color masks and protected object regions retain cactus green, ivory bone,
wood/stone structures, ice crystals and glowing lava/fire. Masked soil keeps
its fine shading, admits some of the real underlying tile texture, and fades
around its whole outer contour. Architectural masks cover vegetation fringes,
not foundations; bare cutouts, bridges and the intentional lava pool are excluded.
Split trees blend their stationary wood/root layer after canopy registration.

Props whose ground chunks are not ready retry rather than permanently missing
the blend. Full frame dimensions, metadata, collision registration and origins
remain unchanged. A bounded shared cache merges similar shades before reusing
memory, and releases variants with their scenery. Terrain, tile assets and
terrain baking are unchanged.

The runtime sprite pipeline now copies source crops onto transparent surfaces
before scaling and gives prepared atlas frames four-pixel external gutters.
Packing preserves frame dimensions, metadata, weapon grips and collision-foot
registration. Hero attack poses use complete connected subjects, removing the
previous row's boot fragments from expanded upward-attack crops. Skill palette
indices are prepared after final packing; streamed enemy atlases use the same
gutter protection. Terrain and tile textures are excluded.

Verification: application TypeScript check and focused WebGL art inspection.
The rendered review covered hero locomotion and all directional attack poses,
guard/adventurer/huntress walking and combat poses, twelve enemy families across
idle/walk/attack/hurt/death, actual dragon flight/landing/ground transitions, and
regional/story/scenery prop sets. It caught and verified removal of the upward
hero attack fragments, volcanic brazier row sliver and mossy-stone crop debris.
Travel pacing and live NPC combat remain for manual gameplay testing. No unit
suite, production/APK build, commit or push was run for this pass.
