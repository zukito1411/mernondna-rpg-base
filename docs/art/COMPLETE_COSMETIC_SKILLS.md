# Complete cosmetic skill poses

## Fix and scope

The old offline skill packer copied the base hero's crop rectangles and deleted
costume colors outside a padded body guard. Wider capes and armor were therefore
cut even when the finished GPU frame had an empty border. Azure Cleave and
Crescent Flurry also had adjoining baked effects in their original strips.
Ashen Seer and Varkhul's downward-thrust recovery poses touched the source edge.

- All nine outfits' four original skill atlases are prepared as whole poses.
- Azure Cleave and Crescent Flurry use new, separately spaced 3x2 masters.
- Crown Rally and the other eight Skyfall Slams retain their original artwork.
- Two downward-thrust masters are replaced with complete 3x2 sources.
- Varkhul's awakened Skyfall Slam opens the cape into dragon wings during
  takeoff, spreads them in flight, sweeps them back on descent, and restores the
  cape at landing/recovery. Normal Varkhul weapon appearance is unaffected.
- Existing independent multi-slash Flurry effects, projectile effects, impact
  effects, targeting, damage, collision and movement remain unchanged.

## Preparation and files

`node scripts/pack-cosmetic-skills.mjs` is an offline asset authoring operation,
not a browser/game test. Optional outfit names and `--states=` select its scope.
It isolates complete subjects, preserves their pixels, applies the existing
effect palette, and uniformly resamples them into density-3 atlases with 12px
clear padding. No body-part stitching or body-envelope clipping is used.
Body guards remain recolor protection only: Crown Rally's gold aura must not
turn flesh or armor into the weapon color, and neutral poses are not tinted.
Standing references establish one 76-world-unit body scale per clip. Authored
fists and body pivots keep the blade attached and ground registration independent
of wing/effect bounds. The ordinary pack command delegates these states to this
same path so regeneration cannot restore the old clipping masks.

Source replacements live in `docs/art/awakening-source/<outfit>/<skill>-v2.png`.
Each has a sibling `.layout.json` with its six source-space pivots and fists.
Runtime replacements retain the existing
`public/assets/characters/leigneron/awakened/<outfit>/<skill>-atlas-v1.png`
names and registration/manifest keys; no save or inventory IDs change.
All atlases remain within the existing 2048px mobile limit. No runtime scanning,
extra per-cast texture allocation, or new texture family is introduced.

## Generation prompt set (built-in image tool)

Each replacement was generated separately, one animation per image, with
transparent output requested. The exact outfit's original Azure Cleave strip
is the identity/style reference. The original Frost Wyrm Flurry strip supplies
only the Flurry pose sequence; its outfit is not copied onto other characters.

Shared specification: six full-body poses, three columns by two rows,
1536x1024, identical compact chibi anatomy, short legs and consistent head/body
scale. Preserve the reference face/hood/hat, armor, trim, cape and pixel detail.
No drawn sword (the equipped blade is a separate layer), no ground, labels,
guides or borders. Keep complete capes, hands, boots and effects inside each
cell with generous transparent separation; never join adjacent effects.

- **Azure Cleave:** neutral; raised-gauntlet overhead crescent windup; turning
  diagonal slash around the legs; forward follow-through with broad crescent;
  extended-gauntlet horizontal recovery slash; original neutral stance.
- **Crescent Flurry:** neutral; raised-gauntlet windup with small overhead arc;
  low diagonal front slash; forward gauntlet with upright crescent; strong
  follow-through with curved slash/starburst; original neutral stance.
- **Downward thrust (Ashen Seer and Varkhul):** preserve each original pose in
  sequence and the exact outfit; rearrange six poses into 3x2, repair the
  clipped final cape, preserve all toes/fingers, no sword or effects.
- **Varkhul Skyfall Slam:** retain Ember Sovereign brown hair/blue eyes, horned
  black-gold-red circlet, black dragon-scale plate, gold/ember edges, red-lined
  cape and short armored limbs. Neutral cape; takeoff crouch with cape opening;
  airborne bent knees/raised fist with two black dragon wings and red membranes;
  downward fists with wings swept back; impact crouch folding wings; neutral
  cape. Wings attach at shoulder blades; no extra limbs, sword, baked effects,
  dust or floor. A follow-up requested removal of the background/glow while
  preserving every pose and wingtip; normal whole-subject isolation discards
  detached background haze before atlas preparation.

## Verification boundary

Source artwork, packed PNG appearances, registration formulas and consuming
code were inspected. After explicit permission, the focused Chrome/Phaser WebGL
check rendered all nine outfits: 756 skill poses, including mirrored facings,
vertical thrusts, Crown Rally/Renewing Light poses and Varkhul's winged Slam.
All passed the GPU alpha-coverage comparison (2-screen-pixel sampling tolerance)
and 3-pixel atlas-gutter checks, with zero page errors and 15 retained outfit
textures. Weapon-visible comparison sheets were also captured.

Run: `node scripts/check-awakened-skill-clipping.mjs`, using the existing review
fixture on port 5174. Results: `test-results/awakening/skill-clipping/index.html`
and `report.json`. The old capture rectangle was widened to avoid falsely
cutting broad effects/wings in review images. Transparent alpha probes avoid
misclassifying dark cloth against the background as missing pixels.

This verifies the production sprite/weapon renderer in a focused WebGL fixture;
it is not a full combat simulation or physical Android-device performance test.
No production/APK build or unrelated test suite was run.
