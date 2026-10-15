# Story helper combat art

Created with the built-in image-generation tool. Existing walking and idle files are unchanged.

The follow-up [complete combatant audit](story_combat/README.md) covers all 43
marked combatants, their additional assets, exact generation prompts, projectile
behavior and remaining manual rendering checks. The two sheets below are now
the original eagerly prepared families, not the full combatant roster.

- `trandum_guard/story-attack.png`: 24 full-body spear-jab poses; rows down, left, right, up, six chronological poses per row.
- `general/story-attack.png`: 24 full-body sword-strike poses in the same order.

`src/data/npcCombatArt.ts` records body calibration, foot registration and the full identity-matched roster. `NpcCombatArt.ts` isolates subjects and pads atlas frames. These two original sheets are attacks, not substitute walking loops. Regional officers use their own race/culture-specific additions described in the complete audit, never these human bodies. The follow-up WebGL review and real-NPC transition checks passed for all 43 combatants; see the complete audit for scope and remaining gameplay/device checks. New walking sheets and exact prompts are documented in [walking/README.md](walking/README.md).

## Final generation prompts

### Guard

Use case: identity-preserve. Asset type: production 2D RPG NPC spear attack sprite sheet. Input images are identity/style references for the SAME green-and-gold helmeted guard, not redesigns. Create a NEW genuinely transparent PNG 1536x1024, precisely SIX equal columns and FOUR equal rows (256x256 cells), no labels, borders, effects, shadows or backdrop. Entire complete body and spear fit within each cell with wide transparent margins; boot soles always on row-local y=230, torso center x=128. Preserve this exact chibi guard: round silver helmet with gold central stripe, dark green tunic/cape with gold edging, silver shoulders, dark brown gloves and boots, green heater shield gold fleur-de-lis, wood spear with silver tip and gold collars. Same proportions, outline, face, materials and detailed pixel/painterly RPG shading as original. Body helmet-to-boots height 155 pixels, spear can extend above helmet. Rows in order: DOWN facing viewer; LEFT facing left; RIGHT facing right; UP rear view. In EACH row six complete successive poses of ONE short spear jab: 1 braced guard with spear tilted into attack direction, 2 draw back elbow/weight, 3 extend and lean into thrust, 4 maximum spear thrust with shield protecting torso, 5 retract, 6 recover toward braced guard. All rows attack their facing direction, downward spear projects toward viewer not upward. Strong purposeful hand grip on shaft, proper arms, knee/hip weight transfer; feet planted during attack with modest weight shift. No duplicates, no severed parts, no sprites crossing cells. Stable same character/body scale throughout, not a walking loop. Keep entire spear within cell even in side thrusts; shorten foreshortening not body size. Genuinely transparent alpha background.

### Roadwarden

Use case: identity-preserve. Asset type: 2D fantasy RPG NPC complete-body sword attack sprite sheet. The input is the IDENTITY and STYLE reference for the SAME brown-haired blue-and-gold roadwarden/general. Do not change his appearance, build, palette or game art. New PNG sheet 1536x1024 with genuine TRANSPARENT alpha background, no brown gradient and no ground or shadow. Exactly 6 columns x4 rows of separated complete-body frames. Columns equal256px. Rows in order DOWN facing viewer, LEFT profile, RIGHT profile, UP rear view. Six progressive frames in each row of a single controlled sword attack: 1 draw sword guard, 2 windup, 3 begin swing, 4 extended strike toward facing direction, 5 followthrough, 6 recover guard. Complete anatomically coherent bodies every frame. Preserve reference brown swept spiky hair, expressive human normal ears, silver pauldrons and arm armor, blue tabard with gold fleur de lis and gold edging, brown belt/boots, dark green cape with gold edging. Use plain silver longsword held naturally in right hand, visible entire hilt and blade. Keep helmetless head shape and large chibi head-to-body ratio identical to reference. Sword fully contained within each cell with at least14px transparent padding. Feet ground row-local y=230; body hair-to-boots height175px; stable root x=128. Downward swing projects toward viewer; upward swing goes away with back/cape visible. Side strikes use hips, bent knees and grounded feet, no skating, no floating severed parts. Match shaded pixel/painterly top-down RPG art, same detail and outline, no 3D render, no photorealism. Do not reuse walk steps as attacks. No effects, motion arcs, text or borders. Transparent background essential.

