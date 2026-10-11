# Enemy stagger and Crescent Flurry

The first eligible damaging hit now interrupts an enemy's pending attack and
plays its complete existing hurt animation (600-667ms). After that hurt window,
normal enemies have a 1000ms stagger cooldown and named bosses have 1500ms.
Hits during this cooldown still deal damage without cancelling every windup.
Cancelled windups invalidate their pending damage callback and remove warnings
and wolf leap visuals.

Crescent Flurry bypasses normal stagger immunity on every damage pulse. Its
reachable targets are held from cast start through all four seconds, including
the first 200ms before damage, the gaps between slashes and the final 200ms.
The same radius, direction and line-of-sight checks govern damage and suppression.
New arrivals are interrupted, while targets leaving the sweep are released.
Finishing, cancelling or destroying the cast releases every held target. Flurry
hits do not knock enemies out of the stationary sweep. This does not give global
invulnerability against attacks outside the skill's area.

Grounded dragons cancel breath/stomp windups, live fire, warnings and breath
audio when staggered. Their AI cannot start another attack during a hurt window
or Flurry hold. Flight and landing remain untargetable and retain their existing
sprite registrations, sizes and collision behavior. Sprite assets, walking
sequences and character proportions are unchanged.

Validation includes real pending-attack callbacks, cooldown retaliation, a full
simulated Flurry with incoming attacks, targets on several sides, new arrivals,
range exit/re-entry, walls, cancellation, grounded dragon attacks, flight/landing,
keyboard casting and GPU pose/collision-foot registration. The visual audit also
renders complete idle, walking, attacking, hurt and dragon flight poses.

The full unit suite had 25 failures in 11 files on the original `30f80a7` checkout,
before these edits. Its post-change result is identical: 109 passed, 25 failed
out of 134 tests. Those existing failures concern art/content/settlement,
progression, quest and PWA expectations. The focused combat browser checks and
production build are checked separately; this change does not mark that baseline
suite green or change its assertions.

Production `npm run build` and test TypeScript checks passed. All five focused
browser checks passed, including real keyboard casting, unchanged player HP
through the cast, cooldown retaliation and the rendered enemy pose audit.
