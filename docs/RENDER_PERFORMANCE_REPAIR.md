# Shadows, water and NPC rest

Scenery shadows use a cached world-space layer. Characters and vehicles use a
second layer, repainted at up to 30 Hz only when a visible pose or position
changes. Both buffers include camera overscan; gentle camera movement reuses
them. Static geometry, sunlight/cloud buckets and streaming changes invalidate
the scenery cache. Silhouette storage is bounded by a 192-frame LRU cache.

Contact shading is darker and sunlight silhouettes are more visible. Casts
respect sprite flips and prop rotation. All registered raised scenery, including
bridges and the volcano, casts shadows. Flat ground decorations remain ground.
NPCs, enemies, the player, carts, wheels, horses and boat hulls are registered;
helmsmen/passengers have contact shading on the deck rather than on the water.
Cloud coverage now controls sunlight shading instead of wind strength.

Water has its own overscan buffer, a terrain mask reused until the viewport
leaves that buffer, and a 20 Hz animation budget while scrolling. Painted foam
remains world anchored and masked off banks/bridges. Open ocean uses its existing
GPU tile animation. NPC schedules/model scales and traffic route lists are
cached; stationary scenery skips per-frame content migration calculations.

All nine NPC families have side/back breathing idles made from complete existing
poses, prepared once during boot. Four unique poses play a six-phase inhale/
exhale cycle. Source-row debris is excluded by whole-subject ownership. No
walking footsteps run at rest, and animation never changes collision dimensions.
Front breathing art is preserved. Proximity and story stops retain facing.

## Local verification

Type checking and development browser tests cover desktop/touch actor directions,
road/sea traffic, docked vessels, shadow registration, camera buffering, shoreline
mask isolation, idle uploads, NPC GPU coordinates and collision registration.
The NPC capture is `test-results/npc-directional-idles-rendered.png`.

Controlled 120-call shadow comparison with a moving player and a stationary
camera in Oakmere: 1,440 drawing operations before, 480 after (67% fewer); measured
CPU time was 14.6 ms before and 9.0 ms after. This is a local system workload
measurement, not a device FPS guarantee. Scenery uploaded zero times during that
movement; completely unchanged shadows performed zero drawing/uploads. A
120-call gentle-camera water check made zero new terrain queries and 17 uploads,
with water-mask alpha 255 and land-mask alpha 0, on both desktop and touch layouts.

The selected unit run passed 22 checks but found two existing world-layout
failures: a stale expected settlement count of 11 against 12 current settlements,
and a Starhold avenue tree overlapping Ropemakers Terrace Upper House 4. Both
failures were reproduced using the HEAD art configuration. These layout checks
are outside the rendering changes and remain unresolved.

No production/APK build, commit, push or release was performed.
