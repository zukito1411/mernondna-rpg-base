# Sword-free Leigneron foundation

Built-in image-generation edits of the original hero sheets, saved separately.
Original artwork, sprite manifests, frame anchors and four original skill icons
are untouched. Source-image review shows consistent costume/body and complete
weapon-free poses. No gameplay launch, tests, build, or GPU registration review
was run for this pass.

## Available sheets

- `attack-body-v1.png`: six poses × four directions (down, left, right, up).
- `idle-front-body-v1.png`: six breathing/blinking front poses.
- `walk-side-body-v1.png`: six right-facing walk poses; future left mirroring.

## Runtime integration (subsequent pass)

Added `idle-side-body-v1.png`, `run-side-body-v1.png`, `walk-down-body-v1.png`
and the four `*-body-v1.png` original skill strips. The existing rear walking
sheet is already weapon-free and remains unchanged. Original sheets remain on
disk; BootScene loads the modular alternatives through `heroBodySource`.

`src/data/modularHero.ts` defines source-space grip positions and angles.
BootScene converts those points using the actual prepared frame registration.
The enlarged front-walk export uses measured ground bounds, not the old tiny
manifest coordinates. `EquippedSwordVisual` uses one small sword atlas built
from the same artwork as Bag; a back/front blade and cropped original glove
layer follow the live body, attack or skill actor. Physics stays on Player.

This integration is implemented but NOT runtime/GPU verified. Hand pivots,
pose transitions and crop containment need rendered review before calling
the appearance polished or release-verified. No tests/builds were run.
See `REMAINING_PROMPTS.md` for the additional built-in edit prompts.

## New usable skills

Stable save IDs are retained while names/mechanics are revised:

- `ember-cleave` → Ember Snare: stationary field at cast target; three delayed
  eruptions at 0.6/1.4/2.2 seconds. Enemies can leave its radius. Walls block hits.
- `iron-tempest` → Iron Rush: 160px ground rush, 8px swept collision steps,
  one frontal heavy strike, not an omnidirectional multi-hit flurry.
- `renewing-light`: six timed healing ticks, broken by incoming hits. No Rally
  protection. Pausing/transition input resets cancel persistent art instances.

They use the live hero stance, not duplicated original skill strips. Their own
four-row effects sheet is `assets/effects/distinct-combat-arts-v2.png`. Four-slot
selection, learning costs and ID-bound cooldowns still apply.

## Prompts (built-in mode)

### Attack body

Precise sprite-sheet edit. Image 1 is the edit target: the original Leigneron attack sheet. Remove EVERY sword completely, including blade, guard, grip, scabbard and any weapon fragments, from all24 poses. Reconstruct only tiny body/clothing areas previously hidden by the sword. Keep all24 WHOLE CHARACTER poses, exact row/column layout6 columns4 rows (down,left,right,up), exact positions, proportions, spiky brown hair, blue eyes, green cape with gold trim, navy/gold tunic, brown gloves/boots, crisp detailed pixel-art style and stepping anatomy. Hands must remain in their original weapon-gripping positions, now closed empty grips ready for separately drawn weapons; do not turn attacks into punches or change pose/motion. Truly transparent background, no shadow clouds or effects, no new equipment, no text, no clipping, no bleed, preserve original1536x1024 aspect ratio. Body-only reusable combat sheet, NOT a character redesign.

### Front idle body

Precise pixel-art sprite sheet edit. Image1 is the edit target, original Leigneron idle six-frame strip. Remove ONLY all swords, weapon grips/guards, scabbards and visible sheathed blade fragments from every pose. Reconstruct the navy/gold clothing where the sword used to cover it, retaining belt and all nonweapon accessories. Preserve the exact six whole-character frames and their positions, front-facing breathing/blinking idle, spiky brown hair, blue eyes, green gold-trimmed cape, navy gold tunic, brown gloves and boots, body/head proportions, original pixel detail and art style. Both hands empty; do not add fists-forward fighting pose. No restyling, no scaling differences between poses, no clipped toes/cape, no extra figures, no text/shadows/effects. Genuine transparent background including between all poses. Keep original six-column single-row layout and3:1 aspect ratio. Weapon-free modular hero foundation for separately equipped sword art.

### Side walk body

Precise pixel-art sprite sheet edit. Image1 is the edit target, original Leigneron walking six-frame strip. Remove ONLY all swords, weapon grips/guards, scabbards and visible sheathed blade fragments from every pose. Reconstruct the navy/gold clothing where the sword used to cover it, retaining belt and all nonweapon accessories. Preserve the exact six whole-character frames and their positions, right-facing genuine alternating footfalls/arm swing with neutral passing phases, spiky brown hair, blue eyes, green gold-trimmed cape, navy gold tunic, brown gloves and boots, body/head proportions, original pixel detail and art style. Both hands empty; do not add fists-forward fighting pose. No restyling, no scaling differences between poses, no clipped toes/cape, no extra figures, no text/shadows/effects. Genuine transparent background including between all poses. Keep original six-column single-row layout and3:1 aspect ratio. Weapon-free modular hero foundation for separately equipped sword art.

### Distinct skill effects

A polished transparent pixel-art fantasy RPG VFX atlas. Exact4x4 equal-cell grid on square canvas, no text/no guide lines/no borders, every effect fully contained with generous24px transparent gutters. Animate each row in four coherent frames with identical centers: forming, active, strongest, fading. Row1: elliptical patch of smoldering roots and orange embers erupting into small ground flames, a planted fire trap not a sword crescent. Row2: directional silver-blue gust and cloak-like wind ribbons trailing to LEFT, sharp forward momentum to RIGHT, a charging knight's wind trail with no knight or weapon visible. Row3: gentle gold-green healing garden with sprouting leaves, pale blossoms and drifting pollen, no crown, no rune ring. Row4: compact iron-silver forward impact burst with stone chips and short luminous streaks, not a circular spin. Match detailed outlined painted pixel-art world sprites, no modern vector geometric lines, actual transparent background no opaque haze. Uniform spacing, no edge cropping or intercell bleeding. Effects-only no people, no swords, no UI.
# Dedicated new skill poses

Iron Rush also includes `iron-rush-up-body-v1.png` and
`iron-rush-down-body-v1.png`: complete six-frame rear/front thrust sequences,
selected by the dominant aiming axis. Each strip retains a common body scale
and foot baseline with independent hand grips. Sword tips and attached gust /
impact effects now use up/down axes; left/right keep the approved side sheet.
The 160-pixel travel budget, targeting, damage and collision logic are unchanged.
Prompts: `IRON_RUSH_DIRECTIONAL_PROMPTS.md` (built-in image generator).
Source appearances inspected; GPU/rendered alignment is not verified.

- `ember-snare-body-v1.png`: six complete raised-hand / downward ground-cast poses. One-second cast; trap is planted at the ground-contact frame (600 ms). Weapon overlay is hidden during this open-hand spell.
- `iron-rush-body-v1.png`: six complete side-profile windup / forward-thrust / recovery poses. Actual extended-fist gutters are registered individually; the equipped sword follows its gripping fist. Left-facing casts mirror the strip.
- Renewing Light uses the existing Crown Rally body sheet/animation; its healing behavior remains distinct.

Generated with the built-in image generator using the existing hero as identity/style reference. Prompts: `NEW_SKILL_PROMPTS.md`. Source appearances inspected; no game launches, tests or runtime/GPU registration checks performed.

