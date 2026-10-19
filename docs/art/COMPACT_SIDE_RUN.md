# Compact side-running replacement

Superseded by [upright running v3](UPRIGHT_SIDE_RUN.md). The v2 crouch described
below was still visibly too short; retain this document only as art history.

Only side RUNNING is replaced, for base Leigneron and all nine awakened outfits.
Walking, idles, rear walking and combat artwork stay unchanged. The built-in
image tool created one six-frame run sheet per model; no body parts were spliced.
Frames retain the walking body's short thigh/shin proportions with compact
bent-knee strides and a restrained lean. Both left/right use the same mirrored
complete poses, retaining existing animation cadence, phase and movement speed.

## Sources and runtime files

- Original generation: `docs/art/leigneron-run-side-v2.png`.
- Base registered source: `public/assets/characters/leigneron/modular/run-side-body-v2.png`.
- Base fist points: `src/data/heroRunRegistration.json`; clip cells and ground
  anchors live in the existing hero manifest.
- Outfit sources: `docs/art/awakening-source/<slug>/run-side-v2.png`, with 3x2 layouts.
- Runtime outfit replacements retain `run-side-atlas-v1.png` and existing texture
  keys, changing only the matching registration/manifest state.
- Offline preparation: `node scripts/pack-compact-side-run.mjs`. It loads no
  game or browser, reuses complete-subject isolation and premultiplied-alpha
  atlas resampling, and preserves transparent gutters.
- Asset comparison gallery: `test-results/awakening/run-v2.html` (not GPU captures).

## Scaling correction

A leaning sprint has no upright frame, including the first/last frames.
Consequently it must NOT be normalized to the 76-unit standing height.
The base source is authored in the side walk's source units and BootScene reuses
its walking scale. Outfit runs are prepared using the corresponding approved
side-walk head width as the uniform scale reference; their entire clip keeps
that scale. Body registration no longer adds the former roughly 6–8% extra
run enlargement. Scale is uniform, not separate head/leg stretching and not
a fit recalculated per action frame. Foot and fist registration are updated
together. No collision, weapon stats or movement speeds change.

## Exact base generation prompt

Use case: identity-preserve / production game animation edit.
Image 1 (walk-side-body-v1.png) is the authoritative APPROVED body/anatomy/outfit/style reference. Image 2 is the OLD running strip whose legs look much too long and should NOT be copied anatomically.
Draw a replacement RIGHT-FACING side RUN cycle for the exact same short, stocky Leigneron in Image 1. Same brown hair, blue eye, compact head, green gold-trimmed cloak, blue/gold tunic, thick short brown boots and gauntlets. Keep the SAME head-to-torso ratio, SAME short thighs and shins, SAME boot length and thickness as the walking character. Do NOT turn him into a tall lanky runner or lengthen the legs to fill the canvas. The run is naturally a little lower because the hips and knees flex.
Use a modest forward torso lean (10–15 degrees), the head remains large and stable, compact bent-knee steps UNDER the body, restrained forward/back arm counter-swing with visible clenched gripping fist. No deep horizontal lunge, no rear leg stretched a full body length, no straight dangling shins, no enormous forward kick, no repeated idle frames. Cape lifts subtly, not giant horizontal wings. NO held sword, the game adds equipment.
Make exactly SIX distinct sequential full-body frames of one coherent running loop: right support/left recovery, right push-off/left passing, left contact/right folded, left support/right recovery, left push-off/right passing, right contact/left folded. Preserve short bones in every pose, knee and ankle bend rather than stretching. Must return smoothly to frame 1.
One animation sheet only: 3 equal columns x 2 equal rows, left-to-right then top-to-bottom order, all full figures with consistent body scale, feet kept near a common row baseline, plenty of transparent gutters and outer padding so no part touches another frame. Same detailed painted pixel-RPG style and crisp dark outlines as Image 1, not glossy 3D or smooth vector. Genuine transparent background, no glows, shadows, ground, labels, dividers, captions or extra characters. Repaint whole complete poses, do not splice body parts.

## Shared outfit edit prompt

Use case: identity-preserve. Production six-frame right-facing RUN animation costume edit.
Image 1 is the corrected BASE RUN sheet, the exact POSE AND ANATOMY target. Image 2 and 3 are this outfit's approved SIDE WALK and FRONT WALK designs.
Change ONLY clothing, armor, cape materials and matching headwear on Image 1 to match Images 2/3. Preserve complete original poses and exact sequence, short thigh/shin lengths, stocky chibi body, big head, modest forward lean, compact bent-knee strides and gripping fists. These are the SAME compact legs as the approved walking body, not longer legs on a tall runner. Do not fill the same vertical height when crouching or extend a rear leg a body length. Head, torso, boot length, body scale, outfit ornament placement and light direction consistent through all six frames. Blue-eyed brown-haired Leigneron except hood/skull-mask outfits fully retain their approved headwear.
One sheet for ONE animation, exactly THREE columns and TWO rows with six distinct ordered full-body frames, clear transparent gutters and outer margins. Keep all heads, fists, hems and boots complete. Right side only; no front/rear poses. Same detailed painted pixel-RPG rendering, outlines and materials as approved outfit. Not vector, 3D, photoreal or smooth cartoon. Keep hands EMPTY for equipped-sword overlay. No text, labels, gridlines, ground shadows, magical aura, fog, opaque background, extra weapons, detached pieces or anatomy splicing. Truly transparent alpha background.
Only RUN is requested: do not alter the walking, rear or attack artwork.

Each outfit also receives its established theme from `src/data/awakening.ts`:
Crimson Shadow charcoal/crimson ninja; Moonreaper silver/violet skull-mask
reaper; Mountain Sentinel slate/gold; Dune War Sovereign bronze/amber/cream;
Verdant Ironwood iron/green roots; Dread Captain black/gold/burgundy pirate;
Glacial Sovereign silver/ice blue; Crimson Reaper blood-red/black skull mask;
Ember Sovereign black dragon plate with gold/red. Approved front/side sheets
remain the material reference, not new costume redesigns.

No tests, game launches or builds ran for this replacement. Rendered movement,
equipped-hand motion and walk/run transitions still require an explicitly
authorized runtime check; native source/atlas inspection does not prove GPU
registration or Android animation quality.

