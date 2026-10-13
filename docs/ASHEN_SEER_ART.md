# Ashen Seer — distinct volcanic oracle

Implemented 2026-10-13 at the user's request to distinguish the two spirit bosses.

## Identity and saved assets

Moonlit Warden and Ashen Seer previously both used species 3: the blue skeletal marsh-wraith model and animations. Moonlit Warden remains unchanged. Ashen Seer now uses species 18 and its own `enemy_ashen_seer` texture: charcoal hood, faceted obsidian mask, ember slit eyes, jagged lava-cracked stone mantle, ash-gray charred robes, blackened hands and bronze geometric talismans. No exposed ribcage, blue glow, weapon, new walking feet or flight state.

Generated with the built-in imagegen tool (no CLI/API fallback), saved as:

- `public/assets/enemies/ashen_seer/walk-v2.png`: 4 columns x 3 rows, down/right/up cloth-glide phases; left consistently mirrors the complete right-facing model.
- `public/assets/enemies/ashen_seer/actions.png`: 6 columns x 3 rows, down/right/up windup, shockwave release, relaxed recovery, recoil, collapse and fallen whole poses.

Whole-subject preparation reuses the existing 44-cell atlas format and on-demand boss residency. The cloth-glide loop runs at 6fps before the usual speed adjustment. Standing idle uses the relaxed casting recovery pose; no neutral frame interrupts movement. Gliding and casting register the hood, not a trailing robe interpreted as planted feet. A fixed standing/recovery scale is retained throughout each facing/state, including lowered/fallen poses. Sources are released after preparation. The new atlas is 3584 x 2304 RGBA (~31.5 MiB), only on demand, under the existing one-boss/two-ambient-family cache limits; this is an allocation calculation, not measured mobile performance.

The stable `ashen-seer` enemy/boss/quest IDs, Darkav location, level, health, damage, movement speed, aggro, attack reach and radius, 980ms windup, 1400ms recovery, cooldown, radial attack behavior, marsh-wraith summons, rewards, defeat state and respawn timer remain unchanged. The previously requested 12% boss multiplier still applies to its new base model and unchanged base collision radius. Voices remain the existing spectral cues. No change to Moonlit Warden or ordinary marsh wraiths.

## Exact prompts

### Locomotion

Use case: stylized-concept. Production Mernodna top-down fantasy RPG boss locomotion sheet. Input images are ART-STYLE references only, not identity or edit targets: painted outlined elevated viewpoint and readable game proportions. Design a DISTINCT Ashen Seer volcanic oracle, NOT a recolored blue skeletal wraith. Whole robed adult spectral oracle: angular charcoal hood, smooth OBSIDIAN ritual face-mask (not skull/beak) with two narrow amber eyes, thick jagged black-stone shoulder mantle, ash-gray layered fabric with fine burnt-bronze embroidered seams and tiny restrained ember cracks, blackened hands, bronze geometric chest talisman, long tapered charred robe hem. No staff, sword, shield, blue glow, exposed ribcage, antlers or wings. Character glides/levitates subtly: NO exposed feet or stepping legs, no hopping. Exactly FOUR columns x THREE rows transparent1536x1024 PNG, twelve COMPLETE figures. Rows DOWN toward viewer / RIGHT elevated profile / UP away. Four columns are contiguous phases of a smooth CLOTH-GLIDE loop: hem trailing left, neutral trailing, hem trailing right, neutral return; hands relaxed, modest shoulder/cloth sway, no change to head/torso scale or armor/talisman geometry. Uniform body height roughly240px and identical lighting/material/detail every cell. The black stone mask and hood must read distinctly from the old wraith's skeletal face. Entire robe, hood and hands contained with20px+ clear gutters. No shadows, ground, smoke clouds or disconnected ashes, labels, text, grids, effect lines, background. Genuine transparent alpha. Single coherent character model, do not assemble body fragments.

### Combat

Use case: identity-preserve. Production Mernodna boss combat sprite sheet. Image1 is EXACT Ashen Seer character identity and art reference, not merely style. Preserve its charcoal pointed hood, smooth faceted black obsidian mask with amber slit eyes (NO visible skull), jagged lava-cracked dark stone shoulder mantle, layered ash-gray charred robes with restrained amber ember seams, black hands and bronze diamond chest talismans. Same head/body dimensions, mantle plate shapes, talismans, fine painted outline, elevated game camera and lighting across all poses. Transparent1536x1024 PNG, exactly SIX columns by THREE rows (18 complete bodies). Rows DOWN / RIGHT elevated profile / UP. Columns0 anticipation: both black hands rise gathering a ritual pulse;1 impact: both palms thrust downward and outward for an ASH SHOCKWAVE, garment leans but body coherent;2 recovery: relaxed upright neutral hovering matching input glide figure;3 hurt: whole torso recoils with same mask/clothes;4 collapse: mantle and robed torso fold low toward ground as figure loses strength;5 defeated: complete fallen robed body lying sideways with entire hood, mantle, hands, hem and talismans included. Maintain body size calibrated to recovery across all, never shrink corpse or enlarge raised-hands head. Make upright characters~220px tall so entire fallen bodies fit256px-wide cells, all poses20px+ padded. Seer FLOATS: no visible walking feet, new legs, wings, staff or weapons. Do not generate the shockwave/effects, smoke clouds, separate flying rocks, disconnected rubble, blue/cyan magic, shadows, ground, motion lines, labels, text, grids or backgrounds. Actual transparent alpha. COMPLETE full poses only, no anatomical fragment stitching. Same boss from input in every cell; not a generic skeleton.

## Review boundary

Source PNGs and consuming code were inspected. No tests, typecheck, build, game/browser launch, simulation, commit or push ran. Rendered UVs, body/hood registration, mask proportions across casting/gliding/hurt/death, spell-warning alignment, save/resume and mobile performance remain pending authorized/manual review. This is not a claim of perfect rendered animation.

