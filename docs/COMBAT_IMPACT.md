# Combat impact feedback

The basic combo finisher and Iron Rush use a heavy impact; Skyfall Slam uses
a heavier slam. Feedback is emitted after positive direct damage is applied.
Misses, dead enemies, airborne untargetable dragons, status ticks and NPC
support attacks do not produce the new player impact shake or shove. Existing
weapon swings and attack artwork still play when attacks miss.

Impact audio shares one scene-wide gate: 110 ms for ordinary impacts and
220 ms for heavy ones. A heavy impact layers at most one existing punch/slam
with the existing flesh impact; hitting a crowd does not layer a sound for
every target. The old unconditional slam/rush feedback and duplicate basic
finisher feedback are removed.

Ordinary enemies accepting a heavy stagger can move back 9 world units, or
12 on a slam. Stagger immunity is unchanged. Bosses retain their existing
resistance; Crescent Flurry retains its stationary containment. No added
stun duration, knockback tween, particle emitter or frame-loop work is used.
At most three shove validations run per 120 ms across the entire fight.
Swept ground/furniture checks and player, NPC and enemy clearance reject
unsafe destinations, including interiors and story arenas.

Menu > Advanced graphics > Combat camera shake saves a device-local setting.
Reduced-motion preferences suppress these shakes. It also covers existing
dodge and dragon combat shakes; volcanic rumble retains its separate control.
Shakes do not restart an active pulse, and share a 300 ms cooldown. A confirmed
heavy player hit uses 85 ms at .0014 intensity; a slam uses 100 ms at .002.

Validation is application TypeScript and whitespace checks. Audio balance,
collision feel, crowd impacts, the camera toggle and reduced motion require
manual gameplay checking. No production build or automated gameplay tests.
