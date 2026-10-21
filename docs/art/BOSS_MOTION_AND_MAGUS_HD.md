# Boss motion and Magus HD revision

## Causes and scope

The Magus's source poses were reduced to about 112 physical pixels high and then
enlarged by his appearance and tower multipliers. Filtering cannot restore that
discarded detail. The replacement retains the approved whole poses at twice the
physical density, without changing his current world size, stats or hit circle.

Committed boss aim was passed to a walking-direction helper with a speed dead
zone of 3. A normalized aim vector has length 1, so directional bosses retained
their previous walking direction. `actorAimDirection` now handles aim separately;
walking keeps its existing dead zone and diagonal hysteresis. Facing follows
the committed attack, not the player's movement after a dodge.

Directional M14 world bosses also used a combined attack clip whose preparation
ratio differed from some combat profiles. Separate registered preparation and
release clips now follow actual warning/recovery phases. Magus's manual casting,
pirates' existing phased clips and Varkhul's dedicated controller are retained.

## Delivered art and registration

- Runtime Magus: `public/assets/enemies/grand_magus/atlas-hd-v2.png`.
- Registration: `src/data/grandMagusAtlas.json` (448px virtual body frames, logical
  boot baseline 210 / physical 420; mirrored palms in physical coordinates).
- Recoverable approved poses: `public/assets/enemies/grand_magus/` down, side,
  up, dissolve and bat v1 boards. No replacement character design was generated.
- Offline packer: `node scripts/pack-grand-magus-hd.mjs`.
- Runtime effects: `public/assets/effects/boss-motion-v1.png`.
- Versioned new source masters: `docs/art/boss-motion-melee-source-v1.png`,
  `boss-motion-ground-source-v1.png`, `boss-motion-magic-source-v1.png` and
  `boss-motion-sea-sweep-source-v1.png` (all in this directory).
- Offline effect packer: `node scripts/pack-boss-motion.mjs`.

Effects were generated with the built-in image-generation tool, then mechanically
isolated and packed. Whole connected effects and contained detached details are
kept; edge-cut fragments from neighboring source cells are rejected. A four-stage
row shares scale and source registration: gathering, peak, follow-through, decay.
No independent fitting of each fading remnant, procedural replacement artwork,
sprite generation during combat, or new damage timers.

The new effect sheet is 2048x1280 (10 MiB RGBA before renderer overhead), forty
256px frames, eight columns and five rows. The existing 4.5 MiB impact/accent
sheet stays for low ground hazards, projectiles, charges and magical seals. The
two optional shared sheets decode sequentially, outside boot/Continue readiness,
with request/decode deadlines, disposed-scene guards and shutdown cleanup.
Actors share texture pages and retain their existing 24-sprite pool bound.

Sword/axe/brine sweeps rotate with committed aim; reverse cuts turn the other
way. Ground-contact registrations anchor stone, roots, ice, brine, ash and ember
eruptions to the warned location rather than centering their tall silhouettes
on it. Ground hazards retain their low accent formations; hollow rings retain
their visible safe centre. Remote Warden seals are not replaced with sword cuts.
Varkhul keeps his authored mouth-registered sustained breath and flight artwork;
his stomp/landing gains the animated ember impact. Magus retains elemental
projectile, palm, staff-contact and fade logic with density-correct anchors.

## Final generation prompt set

Use case: stylized-concept. Built-in generation, genuine transparency requested.
Three initial boards used the game's existing boss VFX as style references.
The common brief was:

> Finished production in-world VFX animation for a detailed medieval pixel-RPG,
> not icons or cards. Exactly four equal columns and three equal rows. Each row
> is one effect in four successive stages: gathering/leading motion, bright peak,
> follow-through or settling, then sparse fading remnants. Shared viewpoint,
> center and scale across that row; do not resize a small final remnant to fill
> its cell. Detailed sharp materials and restrained transparent glow. All art,
> particles and tips contained with wide transparent borders. No characters,
> complete weapons, UI, text, grid lines, opaque ground tiles or backgrounds.

Row subjects:

- Melee: Varr crimson sword crescent, Warden silver-violet lunar crescent,
  Krag heavy amber axe sweep. All initially sweep toward the right.
- Ground: Stonejaw basalt/dust eruption, Rootfather tangled thorn-root eruption,
  Frost Wyrm crystalline ice eruption. Same grounded contact line per row.
- Magic: Salt King spectral brine/cannon impact, Ashen Seer violet-black
  ash eruption with orange core, Varkhul molten volcanic eruption.

The final containment edit for each board was:

> Precise containment repair. Preserve four columns, three rows, twelve effects,
> order, identity and stages. Reduce each cell's whole artwork to 60 percent.
> At least 20 percent clear transparent border on every side of every cell.
> Retain native colors and every complete particle. Shared scale across the four
> frames of each row; never fit a small final remnant to full size. No redesign.

Separate Salt King saber sequence (melee board as supporting style reference):

> Generate a finished transparent sprite animation board for Tales of Leigneron,
> matching the detailed medieval pixel-RPG magic rendering and crescent motion
> of the reference. Exactly one horizontal row of four equal cells; consecutive
> stages of one sea-pirate captain's enchanted saber sweep, not an explosion or
> cannonball. Single forward-curving crescent opening left, bright cutting edge
> pointing right; foaming white seawater, turquoise brine ribbons, warm gold
> sparks. Gathering cut, extended bright crescent, trailing broken spray, sparse
> dissolving spray. Shared center and scale. No actual sword, person, hand, text,
> UI, frames or background. Complete effects with broad transparent padding.

## Verification limits

Source masters, packed artwork, loaders, registrations, consumers and cleanup
were inspected. Both required local TypeScript compiler commands passed.
Regression assertions were added for aim direction, separate M14 phases, HD
virtual geometry and effect frame ranges; they were NOT executed. The stale
Magus-size assertion now reflects the current 1.8 multiplier / 35px radius;
neither gameplay value changed in this revision.

No game launch, automated tests, Playwright, development server, production build
or APK build was authorized or run. GPU trim/origin rendering, all-facing combat,
warning/effect alignment, perceived sharpness, fade appearance and real Android
frame pacing remain runtime verification requirements. This improves presentation
and timing; it does not claim a full Souls-style combat redesign or measured FPS.
