# Upright running — v3

Only side-running artwork changes: base Leigneron and nine awakened outfits.
Approved walking, rear walking, idles, attacks and skill artwork are untouched.
Movement speed, collision and animation cadence do not change.

The previous v2 head-matched run was only 66–69 world units tall against a
76-unit walk. Matching head size alone concealed how deeply the figures were
crouched. This replacement redraws complete poses with an upright torso, high
pelvis and supporting leg beneath the hips. It does not enlarge the whole
character, stretch limbs or normalize each frame's silhouette independently.

## Assets and authoring

- Base master: `docs/art/leigneron-run-side-v3.png` and sibling layout JSON.
- Outfit masters: `docs/art/awakening-source/<outfit>/run-side-v3.png`, each with
  six independently authored source-space fist points in its layout JSON.
- Base registered strip: `public/assets/characters/leigneron/modular/run-side-body-v3.png`.
- Outfit runtime atlases retain `run-side-atlas-v1.png` and existing texture keys.
- All other manifest states are preserved. Save/equipment IDs do not change.
- `scripts/pack-compact-side-run.mjs` reuses each approved walking head width as
  the uniform whole-clip scale reference. It rejects a master whose body/head
  stature falls below 95% or exceeds 104% of walking, inconsistent six-pose
  anatomy, cut source contours, incomplete fists, or a mobile atlas overflow.
  Rejection requires an artwork correction, not arbitrary runtime enlargement.
- Fists, fixed-foot anchors and cloth-leading offsets are authored together.
  Only after all requested outfits are prepared are the runtime files written.
- The normal art-packing command delegates running to this same authoring path;
  a forced generic repack cannot restore the old deeply crouched proportions.

## Built-in image-generation prompt set

Base edit references: the approved `walk-side-body-v1.png` (anatomy/style) and
rejected `leigneron-run-side-v2.png` (motion to correct).

Primary request: six complete RIGHT-facing run poses, 3 columns by 2 rows,
1536x1024, genuinely transparent. Preserve exact brown-haired blue-eyed hero,
green/gold cape, navy/gold tunic, brown gloves and short thick boots. Torso only
5 degrees forward, pelvis nearly walking height, one supporting leg under the
hips while the other folds; not a squat, lunge or long-legged sprint. Keep
head-to-pelvis length and thigh/shin/boot proportions from walking. Aim for
95–100% of walking stature at equal head size. Distinct alternating contacts,
passing/support and push-off poses, opposite arm swing, complete EMPTY gripping
glove for the separate equipped sword. Crisp detailed outlined pixel-RPG art,
restrained cape flutter, all six anatomical sizes consistent. Generous gutters
and outer margins. No labels, guides, ground, shadows, glow backdrop or sword.
Do not splice body parts, enlarge the head or stretch legs.

A targeted follow-up corrected the first draft's oversized head: match the
walking body's approximately 2.08:1 silhouette-height/head-width ratio rather
than the draft's 1.91:1. Redraw complete coherent poses, retaining the same
torso, short-leg build, face/hair identity, outfit and sequence; rejoin the neck
naturally, never paste a mechanically scaled head onto old body parts.

Each outfit is a separate image-generation edit. The corrected base v3 is the
pose/anatomy target and that outfit's approved side-walk atlas is its costume,
headwear and material reference. Change only the outfit to the established
theme from `src/data/awakening.ts`; preserve all six upright poses and layout.
Human forms retain brown hair/blue eyes; the two reapers retain their approved
hood/skull mask and the pirate retains the compact tricorn. Match that outfit's
walking body/head ratio (including headwear), with no enlarged lower-row heads,
miniature torso, elongated legs, deep crouch, clipping or simplification.

Varr received a further complete-pose correction against his approved walking
atlas: the initial head was too large, while the first correction was too small.
The selected master uses an intermediate head/torso proportion, targeting about
2.10:1 silhouette height/head width. Only that selected master is published;
its source-space fists are registered independently from the discarded drafts.

`test-results/awakening/run-v3.html` presents the base and nine outfit atlases at identical
world scale with shared ground lines and a left/right mirror toggle. It is an
offline art comparison, not evidence of a game or GPU test.

No new game/browser tests or builds are authorized by the implementation-only
request. Source/artwork preparation is not a fresh GPU movement test. The prior
756-pose WebGL skill result remains applicable to the unchanged skill atlases,
not to this new run/walk transition.
