# Varkhul and Iron-Tusk rear walking only

The user approved all seven other cosmetic outfits. Do not regenerate or
re-register them as part of this correction.

Built-in image-generation edit mode was used. The edit target and exact
six-pose, three-column/two-row walking benchmark was:
`public/assets/characters/leigneron/awakened/frost-wyrm/walk-up-atlas-v1.png`.
The corresponding `docs/art/awakening-source/<form>/walk-side-v1.png` was
the destination outfit reference only, not a pose/anatomy reference.

Prompt set: keep the approved rear-facing head/body proportions, complete
walking poses, alternating feet, original phase order, cape placement/sway,
scale and centers. Change only the existing outfit. Varkhul uses black/gold/red
dragon armor, matching compact circlet and gold-edged black/red-lined cloak.
Iron-Tusk uses bronze armor, compact ivory shoulder tusks, orange neck scarf,
bronze boots and a bronze-edged cream cloak. Both must face straight away,
with the back of the cape covering the back: no side-facing torso, front
breastplate, pendant or tabard pasted onto the back. No anatomy redesign,
limb stitching, weapons, shadows, effects, opaque backgrounds, clipped
extremities, detached particles or neighboring frame fragments. Keep clean
transparent gutters and the same outfit throughout all six phases.

Full-resolution sources and explicit source layouts:

- `docs/art/awakening-source/varkhul/walk-up-v2.png`
- `docs/art/awakening-source/iron-tusk/walk-up-v2.png`
- Each has a matching `walk-up-v2.layout.json` declaring its 3x2 grid.

The original v1 sources are retained. The runtime atlas filenames remain stable;
only these two rear-walk atlases, their registrations and corresponding manifest
entries are replaced. Physics, combat, save data, timing and other animations
are unchanged. Rear registration follows the original head/feet rather than
the moving outside edge of a cloak; this preparation happens offline only.

Scoped preparation (development server on 5174):
`node scripts/pack-awakened-hero.mjs --forms=varkhul,iron-tusk --states=walk-up --force`

The form/state selectors preserve the other states and do not prepare unrelated
items or outfits. This is asset preparation, not a production/APK build.

Preparation results: both six-frame rear walks have zero opaque gutter pixels
and zero required grip corrections. Maximum/minimum source pose height ratios
are 1.0344 for Iron-Tusk and 1.0467 for Varkhul. The focused WebGL contact sheets
compare 24 poses per outfit (rear walking, side walking, front idle and rear
attacking), using the production cosmetic and equipped-weapon renderer. No
other animation art was changed. SHA-256 directory comparisons confirm all
runtime assets/registrations/manifests of the seven approved outfits are
byte-for-byte unchanged. No unit suite, production build or APK build was run
for this two-outfit correction.
