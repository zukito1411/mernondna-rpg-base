# Grand Magus spell effects

Created with the built-in image-generation tool, then refined for containment.
Runtime: `public/assets/enemies/grand_magus/spells-v1.png`.
Versioned master: `docs/art/grand-magus/spells-master-v1.png`.

Prompt: Finished transparent raster spell-effect atlas for the detailed medieval
pixel RPG Tales of Leigneron. Exact evenly spaced 2x2 grid: orange-red fireball
with a white-hot core travelling right, cyan crystalline ice lance pointing
right, downward branching golden-white lightning with an electric splash,
and a violet-black sphere with a lavender corona and curling tendrils. Strong
readable silhouettes, crisp detailed clusters, restrained transparent glow,
complete effects inside their own cells with clear gutters. No terrain,
characters, labels, text, divider, watermark or painted checkerboard.

Refinement prompt: Preserve the four designs and order; reduce each to 70%
and center in its quadrant with at least 15% clear inset on every side,
including the fire tail and lightning endpoints. True transparent background.

Registration: alpha-isolate each 2x2 cell once on pack preparation; uniformly
fit to 104px within a 128px centered frame; add GPU sampling gutters. Effects
use their own small companion atlas, not extra boss-body cells. Casting palms
are registered from the original down/side/up source boards for both windup
and release, mirrored together for left. Damage and warnings retain the
shared combat area's authoritative geometry and full windup duration.

Presentation: charges ease in, arriving projectiles dissolve for 180ms while
the impact blooms in over 80ms. Impacts hold briefly and smoothly dissipate
over 800-1150ms, with restrained uniform expansion; fire and shadow gently
rise. Hollow-ring effects do not expand into the warned safe centre. These
visual-only tails advance during active play independently of attack recovery,
so follow-up casts do not erase them. No extra damage, timers or textures are
introduced. Interruption, death and room teardown still clear owned sprites
immediately for safe cleanup.

Source art was visually inspected. In-engine crop, alignment and Android
frame pacing remain unverified in this change; no gameplay tests authorized.
