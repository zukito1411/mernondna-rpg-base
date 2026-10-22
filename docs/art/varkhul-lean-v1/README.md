# Varkhul — lean dragon redesign v1

Generated with the built-in image-generation tool. The existing Varkhul model
was the pixel-art and palette reference; `design.png` became the anatomy
reference for all five replacement source sheets.

## Design brief / prompt set

Terrifying ancient western dragon with a small cruel skull, long curved neck,
muscular shoulders and legs, a tucked waist, long tapering tail, charcoal scales,
burnt-red wings and ember-orange throat plates. Fatalis-like predatory anatomy,
while retaining Varkhul's own appearance and the game's pixel-RPG rendering.

The shared animation prompt was:

> Use case: identity-preserve. Asset type: complete production sprite animation sheet for Tales of Leigneron, a detailed 2D pixel RPG. Reference image is the EXACT NEW VARKHUL design. Maintain this ONE dragon consistently in every pose: long curved neck, small vicious horned skull, charcoal black intricate scales, lean muscular legs and tucked waist, long tapering tail, burnt red membranes and ember-orange throat, gold-tipped claws, four legs PLUS two separate wings. This is NOT the old round fat baby dragon. Preserve the same proportions, scale, skull, horns, dorsal spikes, limb anatomy and colors in every frame. Slightly elevated 3/4 RPG view, not top-down. Crisp richly detailed pixel-RPG rendering like the reference. Every frame is a complete independently drawn full-body pose, not an upper/lower body collage. True TRANSPARENT alpha background; NO ground or cast shadows, NO glow/fog/haze behind subjects, NO fire, NO lettering, NO labels, NO grid lines. ALL horn tips, wing tips, claws and complete tail inside each cell, clear transparent padding and wide gutters so subjects NEVER touch or overlap neighbors. Use the FULL canvas for the specified equal cell grid. Preserve each cell's same character anatomy scale; do not enlarge smaller action silhouettes. Final art not a diagram.

Separate sheet prompts specified:

- `walk.png`: twenty complete grounded stalking poses, four rows of five;
  down, left, right, up. Each row begins with a planted neutral pose followed
  by four alternating walk steps. Rear faces show no face.
- `attack.png`: six right-facing poses in a three-by-two sheet: crouched
  windup, upright open-mouth roar, forward breath/slam release, reaching
  follow-through, recovery, neutral. No baked fire or attack effects.
- `hurt.png`: six right-facing complete poses in a three-by-two sheet:
  neutral, slight recoil, stronger recoil, braced recoil, recovery, neutral.
- `death.png`: six right-facing complete poses in a three-by-two sheet:
  knees buckle, shoulders lower, chest drops, settle, collapse, still.
- `fly.png`: six complete right-facing wingbeat poses in a three-by-two
  sheet: high wings, descending, level, low wings, rising, high wings.
  Four tucked legs, same torso/head scale, complete wing tips and tail.

All prompts required true alpha, full-pose containment, generous gaps,
consistent identity and no scene backgrounds, text, shadows or baked effects.
Actual generated dimensions are recorded by the packing script; requested
canvas sizes are not assumed by runtime code.

## Runtime integration

Run `node scripts/pack-varkhul-lean.mjs` to reproduce the three runtime PNG
atlases, `src/data/varkhulAtlas.json`, and `registered-preview.png`.
This is an offline asset-authoring operation, not a gameplay test.

Runtime assets:

- `public/assets/enemies/varkhul-lean-v1/ground.png`
- `public/assets/enemies/varkhul-lean-v1/walk.png`
- `public/assets/enemies/varkhul-lean-v1/fly.png`

Original source masters remain recoverable in their existing locations.
These new authoring sheets live outside `public` and do not ship in the APK.

Packing uses whole-pose isolation, uniform clip scales, a shared containment
factor, transparent sampling gutters, and trimmed virtual-cell registration.
It does not stitch body parts or independently resize individual frames.
The rear origin follows the claws rather than the lower coil of the tail.
Jaw anchors follow attack poses 0–2, including mirrored fire breath.

Boot loads the three prepared images instead of the old dragon source set.
Texture keys, animation/frame IDs, physics radius, boss progression, combat
timing, flight/retreat handling and save IDs remain unchanged. Runtime texture
renaming avoids a second GPU upload, and no new per-frame pixel scan is added.

## Review scope

`registered-preview.png` is a static authoring view of twelve representative
registered poses, not an in-game screenshot. Rows show four grounded facings;
windup/roar/release/hurt; then three wing phases and the final fallen pose.

Required application/test-source and configuration TypeScript compiler checks
passed after integration.

### Authorized browser review — 22 October 2026

`node scripts/review-varkhul.mjs` opened an isolated New Game using production
boot and actual Chrome WebGL textures. It captured all 55 registered frames
plus mirrored ground/combat and flight frames: 90 rendered poses in total.
At that review, walking had dedicated left/right artwork. The later side-gait
revision below now mirrors complete poses offline for matching left/right
anatomy; these earlier screenshots do not validate the replacement gait.

The source-atlas gutters were clear. GPU/source comparison found no foreign
neighboring sprite regions. An initial strict missing-pixel check reported 58
isolated sample differences; investigation found nearby rendered pixels at
those fractional-scale edges, not missing body parts. The symmetric 3-pixel
CPU/WebGL rasterization guard now applies in both comparison directions.
`node scripts/review-varkhul.mjs --pixels-only` rechecked the saved GPU captures
without another game launch: zero foreign regions or missing regions. The raw
pre-tolerance report is retained rather than discarded.

The live production dragon controller's flame matched its registered mouth
in east/west/north/south aim at 1280x720 and 844x390 viewport sizes. No browser
page errors or missing asset responses were recorded. The browser context,
browser process and owned Vite server were closed; cleanup was recorded.

Artifacts are generated under `test-results/varkhul-model/`: `index.html`, all
pose/breath PNGs, `report.json`, `raw-raster-report.json` and `cleanup.json`.
They are ignored by Git; the focused review scripts remain reproducible.

This establishes the reviewed frame containment, sampling and registered
attachment behavior in desktop Chrome WebGL, including phone-sized views. It
does not certify every animation transition, artistic anatomy, Android device
performance, APK packaging or saved-game continuation. No production build or
real Android device test was run.

### Later mouth-axis correction

The breath now commits to the authored left/right release-mouth axis rather
than pointing a side-facing head's flame north/south at a foot-relative target.
Charging starts only after the forward release pose is shown. Flame, warning
and damage share the locked release mouth, angle and cone extent. Tower range
checks use that same origin and decline casts that cannot fit safely.

The browser review harness now starts a real committed cast and checks its
angle as well as attachment. The captures described above predate this angle
correction; they are not runtime verification of the later behavior. Only the
required compiler checks were authorized for the mouth-axis implementation;
the updated behavioral tests were authored but not executed.

### Walking registration and cadence correction

The initial correction kept all twenty original walking poses intact. `walk-registration-v1.json`
records source-space torso landmarks and planted-claw contact lines for the
four facings. The packer translates complete poses using those landmarks,
rather than assuming the generated artwork sits at equal cell intervals.
Facing-specific scales remain uniform across the whole clip. The rear tail
does not define ground contact, and no limbs are stretched or stitched.

`walking-preview.png` shows neutral plus four steps for down, left, right and
up, against matching ground lines. It is a static authoring contact sheet,
not a running-game screenshot or proof of natural animation in motion.

The production dragon controller now scales walking cadence with movement
speed (72 world pixels/second = the authored 8fps cycle). The slower 45%
patrol therefore uses 45% cadence. Idle and action animation speeds remain
unchanged. Direction selection and diagonal hysteresis still belong to the
shared locomotion method, without an extra left/right mirror beforehand.

No gameplay/browser test was launched for this correction under the current
permission-only testing rule. A rendered moving review, including turns and
Android behavior, remains pending explicit testing permission.

### Side gait v2: rejected / superseded by the user-selected sheet below

The original source's hind-foot articulation was too subtle. A first
hind-focused draft also failed to give the forelegs a convincing cycle and
was not integrated. The selected replacement uses complete generated poses
with separate, readable forefeet, rear hock articulation and alternating
diagonal passing poses. The final passing pose was drawn separately to show
the near forefoot and far hind foot lifting, rather than repeating the same
lifted diagonal twice.

Selected built-in image-generation outputs are saved as:

- `side-walk-v2.png`: full poses; the first three cells are used.
- `side-walk-passing-v2.png`: the complete opposite-passing pose, not a limb patch.
- `side-walk-registration-v2.json`: authored roots and source-density conversion.

Both side directions use the same complete gait, reflected offline with its
origin. Runtime still uses its existing twenty walk frame IDs, four-step
cycles and three bounded atlases. Source masters do not ship in `public`.
The separate passing source is twice the pixel density of a source cell,
so its source-unit conversion is 0.5. There is no per-frame silhouette fit,
limb stretching, stitching, recoloring or additional runtime image processing.

Existing attack and flight artwork were supplied as generation references
alongside the original walking design to retain charcoal scales, blood-red
membranes, orange throat plates and gold claws/horns. Their source pixels,
pose geometry, mouth anchors and shared containment scale are unchanged;
the ground atlas is repacked because its legacy walk aliases also change.
Original idle and down/up walking poses are preserved.

`walking-preview.html` provides standalone playback of the actual packed
frame rectangles with idle, attack and flight references alongside them.
It is an authoring preview, not a Phaser gameplay test. The old browser report
under `test-results/varkhul-model` predates this revision and must not be used
as evidence that the new walking cycle has passed rendered gameplay review.
No game, browser test or production build was launched for this revision.
Mandatory application/test-source and configuration compiler checks passed.

The historical prompt set is recorded in `side-walk-prompts-v2.md`. These
sources are retained only as recoverable authoring history. The packer no
longer reads either v2 image or its registration.

### Current side gait v3: user-selected `walk-varkhul.png`

The user provided and selected
`public/assets/enemies/varkhul-lean-v1/walk-varkhul.png` as the proper model.
It has eight complete right-facing poses in a four-by-two 1536x1024 sheet.
The master is left unchanged; the packer isolates complete poses and uses
`side-walk-registration-v3.json` for one uniform 0.625 clip scale, stable
torso registration and planted-claw baselines. No palette edits, limb
stretching, generated replacement artwork or stitching are applied to it.

Source inspection found shorter bent legs and separate fore/hind stepping.
Among opaque source pixels, the bright-red share (red channel above 200,
red > 1.5 times green and blue) is about 8.4%, versus 8.9% in the approved
attack-neutral pose and 8.0% in the flight-level pose. This supports the
closer palette match; it does not prove exact artistic identity. The rejected
v2 sources measured about 15.3% and 19.2% by the same diagnostic.

All eight steps are registered. Existing frame slots remain valid; four
additional side-step slots extend the walking texture to twenty-four slots.
Left/right animations share the same eight complete packed poses and mirror
the actor for left facing. Idle uses the same source's planted first pose,
avoiding the rejected model when stopping. The eight side steps run at 16fps
to retain the previous half-second cycle; four-pose down/up cycles stay at
8fps. The controller still scales cadence with movement speed.

Only eighteen unique poses are stored in the walking atlas (down/up plus the
shared side cycle), now 2048x1440. Its aliases do not duplicate pixel storage.
Ground fallback walk/idle aliases are refreshed, while existing attack, hurt,
death and flight source artwork, mouth anchors, body scale and shared
containment factor remain unchanged. Loading paths, page dimensions and frame
rectangles are generated together; no extra runtime source decoding is added.

`walking-preview.html` and `walking-preview.png` now show this selected sheet,
not the rejected generated cycle. The HTML includes the existing attack and
flight references and mirrors left-facing playback like the runtime actor.
This is standalone authoring playback, not rendered gameplay verification.
The old `test-results/varkhul-model` screenshots predate this replacement.

Both required compiler checks passed. No game, automated browser test or
production build was launched. GPU sampling, actual transition appearance and
Android-device behavior remain pending explicit testing permission.

The supplied master did not come with a generation prompt, so none is
invented or claimed for it. Later generated drafts were not integrated.

