# NPC and enemy direction audit

Audited all **134 authored NPC definitions** and **14 enemy/boss definitions**.
NPCs use nine role sheets; enemies and boss variants use six sprite families.
Existing IDs, appearances, collision sizes, health, quest relationships and save
format remain unchanged.

## NPC coverage

| Walking sheet | Named NPCs | Coverage |
| --- | ---: | --- |
| npc_general | 9 | Six poses per direction |
| npc_huntress | 5 | Six poses per direction |
| npc_blacksmith | 12 | Six poses per direction |
| npc_guard | 6 | Six poses per direction |
| npc_woman | 4 | Six poses per direction |
| npc_adventurer | 26 | Six poses per direction |
| npc_attendant | 23 | Six poses per direction |
| npc_villager | 35 | Six poses per direction |
| npc_royal_guard | 14 | Six poses per direction |

These existing sheets already contain usable left/right and front/back walking
art. The defect was the presentation code selecting only front or back at rest.
NPCs now retain their last actual travel direction, including sideways stops;
side and back rest use a held existing pose rather than walking in place.
Front-facing rest retains the dedicated breathing art. Direction selection uses
actual velocity with the same diagonal hysteresis as enemies. Existing stride
rate and collision-stall checks remain in use.

## New enemy artwork

The built-in imagegen tool generated transparent bitmap sheets under
`public/assets/enemies/directional/`:

| File | Used by |
| --- | --- |
| gray-wolf.png | Gray Wolf, Frost Wyrm |
| road-bandit.png | Road Bandit, Captain Varr, Salt King |
| boarfiend.png | Wild Boar, Krag the Iron-Tusk |
| marsh-wraith.png | Marsh Wraith, Moonlit Warden, Rootfather, Ashen Seer |
| cave-troll.png | Cave Troll, Stonejaw |
| ash-dragon.png | Varkhul |

Each sheet has five columns and four rows: south/front, west/left, east/right,
north/back. Each row contains one neutral pose and four distinct walk frames.
The wraith has floating robe phases rather than invented walking legs. Left and
right are independently drawn views, not a flipped frontal sprite. A targeted
troll correction kept the club in the correct hand in its final front step.

Boot appends the 120 new frames to the existing atlases. A single fit per family,
registered foot anchors and clipping-safe bounds keep body size and ground
position stable. Preparation happens once; combat uses cached atlas frames.
Direction-specific neutral poses stop foot motion at rest. Turning preserves
stride progress. Attack/hurt/death and the new dragon breath keep their original
combat frames; grounded dragon walking/standing uses the new directional art.
This task adds directional locomotion, not new four-direction combat clips.

## Validation

The unit audit checks every NPC's four six-frame clips, every enemy/boss family,
and stopped/diagonal facing. Browser coverage checks all 36 NPC role/direction
combinations and all 24 enemy family/direction combinations, distinct artwork,
weapon/body clipping, stable scale, held side/back rest and runtime errors on
desktop and touch layouts. Dragon breath regressions verify its jaw poses,
animated fire, pause, fade and cleanup after the atlas extension.

The APK workflow includes the new audit in its targeted regression checks.

## Generation prompts

### gray-wolf

Style reference: `public/assets/enemies/gray_wolf/walk.png`.

Use case: stylized-concept. Asset type: production transparent directional idle/walking sprite sheet for an existing 2D top-down medieval fantasy RPG. STYLE AND CHARACTER REFERENCE ONLY: keep the creature/person identity, outfit, colors, anatomy and detailed shaded pixel-art style of the supplied reference; generate the missing views. Subject: ferocious gray-brown wolf with cream muzzle, amber eyes, four anatomically correct canine legs, bushy tail, ragged fur. Walking, NOT bounding or jumping. Create ONE clean sprite sheet with EXACTLY FIVE COLUMNS and FOUR ROWS, 20 isolated complete sprites, preferably 1600x1280, uniform square cells, generous transparent gutters. Row 1: facing SOUTH toward viewer, three-quarter top-down front. Row 2: facing WEST, real left profile (head and body face LEFT). Row 3: facing EAST, real right profile (head and body face RIGHT). Row 4: facing NORTH away from viewer, back and rear head visible, face NOT visible. In EACH ROW column1 is a balanced neutral standing/resting pose; columns2-5 are FOUR consecutive looping walk phases: left-foot/diagonal-limb contact, passing/recoil, right-foot/opposite-diagonal contact, opposite passing/recoil. Distinct foot placement and flexing joints, natural counter-swinging arms/tail/cloth, stable head/body proportions and size across the sequence. Keep body centered, sole baseline at 86 percent of each cell, upright body height around 65 percent of a cell, entire tail/wings/weapons inside its OWN cell. Preserve both sides of asymmetric carried equipment physically, do not arbitrarily switch weapon hands. No fighting, no attack, no jumping, no fake bobbing copied poses. Transparent alpha everywhere outside silhouettes, no glow-painted background, no shadow, no labels, no numbers, no text, no grid lines, no circles, no scene, no extra characters. Legible sharply shaded pixel clusters matching the supplied game art, not smooth 3D rendering or vector drawings.

### road-bandit

Style reference: `public/assets/enemies/road_bandit/walk.png`.

Use case: stylized-concept. Asset type: production transparent directional idle/walking sprite sheet for an existing 2D top-down medieval fantasy RPG. STYLE AND CHARACTER REFERENCE ONLY: keep the creature/person identity, outfit, colors, anatomy and detailed shaded pixel-art style of the supplied reference; generate the missing views. Subject: human highway bandit in olive green hood and cloak, leather armor, dark trousers and boots, red neck wrap, short curved blade in RIGHT hand and round wooden shield in LEFT hand. Keep the actual weapon hands unchanged in every view. Create ONE clean sprite sheet with EXACTLY FIVE COLUMNS and FOUR ROWS, 20 isolated complete sprites, preferably 1600x1280, uniform square cells, generous transparent gutters. Row 1: facing SOUTH toward viewer, three-quarter top-down front. Row 2: facing WEST, real left profile (head and body face LEFT). Row 3: facing EAST, real right profile (head and body face RIGHT). Row 4: facing NORTH away from viewer, back and rear head visible, face NOT visible. In EACH ROW column1 is a balanced neutral standing/resting pose; columns2-5 are FOUR consecutive looping walk phases: left-foot/diagonal-limb contact, passing/recoil, right-foot/opposite-diagonal contact, opposite passing/recoil. Distinct foot placement and flexing joints, natural counter-swinging arms/tail/cloth, stable head/body proportions and size across the sequence. Keep body centered, sole baseline at 86 percent of each cell, upright body height around 65 percent of a cell, entire tail/wings/weapons inside its OWN cell. Preserve both sides of asymmetric carried equipment physically, do not arbitrarily switch weapon hands. No fighting, no attack, no jumping, no fake bobbing copied poses. Transparent alpha everywhere outside silhouettes, no glow-painted background, no shadow, no labels, no numbers, no text, no grid lines, no circles, no scene, no extra characters. Legible sharply shaded pixel clusters matching the supplied game art, not smooth 3D rendering or vector drawings.

### boarfiend

Style reference: `public/assets/enemies/boarfiend/walk.png`.

Use case: stylized-concept. Asset type: production transparent directional idle/walking sprite sheet for an existing 2D top-down medieval fantasy RPG. STYLE AND CHARACTER REFERENCE ONLY: keep the creature/person identity, outfit, colors, anatomy and detailed shaded pixel-art style of the supplied reference; generate the missing views. Subject: stocky brown bristled wild boar with heavy ivory tusks, orange snout, short four cloven-hoof legs and curled tail. Grounded four-legged walking, NOT jumping. Create ONE clean sprite sheet with EXACTLY FIVE COLUMNS and FOUR ROWS, 20 isolated complete sprites, preferably 1600x1280, uniform square cells, generous transparent gutters. Row 1: facing SOUTH toward viewer, three-quarter top-down front. Row 2: facing WEST, real left profile (head and body face LEFT). Row 3: facing EAST, real right profile (head and body face RIGHT). Row 4: facing NORTH away from viewer, back and rear head visible, face NOT visible. In EACH ROW column1 is a balanced neutral standing/resting pose; columns2-5 are FOUR consecutive looping walk phases: left-foot/diagonal-limb contact, passing/recoil, right-foot/opposite-diagonal contact, opposite passing/recoil. Distinct foot placement and flexing joints, natural counter-swinging arms/tail/cloth, stable head/body proportions and size across the sequence. Keep body centered, sole baseline at 86 percent of each cell, upright body height around 65 percent of a cell, entire tail/wings/weapons inside its OWN cell. Preserve both sides of asymmetric carried equipment physically, do not arbitrarily switch weapon hands. No fighting, no attack, no jumping, no fake bobbing copied poses. Transparent alpha everywhere outside silhouettes, no glow-painted background, no shadow, no labels, no numbers, no text, no grid lines, no circles, no scene, no extra characters. Legible sharply shaded pixel clusters matching the supplied game art, not smooth 3D rendering or vector drawings.

### marsh-wraith

Style reference: `public/assets/enemies/marsh_wraith/walk.png`.

Use case: stylized-concept. Asset type: production transparent directional idle/walking sprite sheet for an existing 2D top-down medieval fantasy RPG. STYLE AND CHARACTER REFERENCE ONLY: keep the creature/person identity, outfit, colors, anatomy and detailed shaded pixel-art style of the supplied reference; generate the missing views. Subject: hooded skeletal marsh wraith, black hood interior and pale skull, ragged teal-gray robes, long bony claw hands and flowing turquoise spectral hem. It FLOATS: four successive drifting robe/arm phases, no invented walking human legs. Create ONE clean sprite sheet with EXACTLY FIVE COLUMNS and FOUR ROWS, 20 isolated complete sprites, preferably 1600x1280, uniform square cells, generous transparent gutters. Row 1: facing SOUTH toward viewer, three-quarter top-down front. Row 2: facing WEST, real left profile (head and body face LEFT). Row 3: facing EAST, real right profile (head and body face RIGHT). Row 4: facing NORTH away from viewer, back and rear head visible, face NOT visible. In EACH ROW column1 is a balanced neutral standing/resting pose; columns2-5 are FOUR consecutive looping walk phases: left-foot/diagonal-limb contact, passing/recoil, right-foot/opposite-diagonal contact, opposite passing/recoil. Distinct foot placement and flexing joints, natural counter-swinging arms/tail/cloth, stable head/body proportions and size across the sequence. Keep body centered, sole baseline at 86 percent of each cell, upright body height around 65 percent of a cell, entire tail/wings/weapons inside its OWN cell. Preserve both sides of asymmetric carried equipment physically, do not arbitrarily switch weapon hands. No fighting, no attack, no jumping, no fake bobbing copied poses. Transparent alpha everywhere outside silhouettes, no glow-painted background, no shadow, no labels, no numbers, no text, no grid lines, no circles, no scene, no extra characters. Legible sharply shaded pixel clusters matching the supplied game art, not smooth 3D rendering or vector drawings.

### cave-troll

Style reference: `public/assets/enemies/troll/walk.png`.

Use case: stylized-concept. Asset type: production transparent directional idle/walking sprite sheet for an existing 2D top-down medieval fantasy RPG. STYLE AND CHARACTER REFERENCE ONLY: keep the creature/person identity, outfit, colors, anatomy and detailed shaded pixel-art style of the supplied reference; generate the missing views. Subject: hulking green-skinned cave troll with hunched shoulders, shaggy brown hair/back fur, brown leather loincloth, heavy stone-studded wooden club in RIGHT hand, thick bare feet. Heavy grounded alternating footstep gait. Create ONE clean sprite sheet with EXACTLY FIVE COLUMNS and FOUR ROWS, 20 isolated complete sprites, preferably 1600x1280, uniform square cells, generous transparent gutters. Row 1: facing SOUTH toward viewer, three-quarter top-down front. Row 2: facing WEST, real left profile (head and body face LEFT). Row 3: facing EAST, real right profile (head and body face RIGHT). Row 4: facing NORTH away from viewer, back and rear head visible, face NOT visible. In EACH ROW column1 is a balanced neutral standing/resting pose; columns2-5 are FOUR consecutive looping walk phases: left-foot/diagonal-limb contact, passing/recoil, right-foot/opposite-diagonal contact, opposite passing/recoil. Distinct foot placement and flexing joints, natural counter-swinging arms/tail/cloth, stable head/body proportions and size across the sequence. Keep body centered, sole baseline at 86 percent of each cell, upright body height around 65 percent of a cell, entire tail/wings/weapons inside its OWN cell. Preserve both sides of asymmetric carried equipment physically, do not arbitrarily switch weapon hands. No fighting, no attack, no jumping, no fake bobbing copied poses. Transparent alpha everywhere outside silhouettes, no glow-painted background, no shadow, no labels, no numbers, no text, no grid lines, no circles, no scene, no extra characters. Legible sharply shaded pixel clusters matching the supplied game art, not smooth 3D rendering or vector drawings.

### ash-dragon

Style reference: `public/assets/enemies/dragon/walk.png`.

Use case: stylized-concept. Asset type: production transparent directional idle/walking sprite sheet for an existing 2D top-down medieval fantasy RPG. STYLE AND CHARACTER REFERENCE ONLY: keep the creature/person identity, outfit, colors, anatomy and detailed shaded pixel-art style of the supplied reference; generate the missing views. Subject: the same stocky charcoal-black and lava-red dragon, horned angular head, orange throat and belly, four clawed ground legs, long tail, folded red-black bat wings. Calm heavy FOUR-LEGGED grounded walk, no flight, no flames, preserve folded wings. Create ONE clean sprite sheet with EXACTLY FIVE COLUMNS and FOUR ROWS, 20 isolated complete sprites, preferably 1600x1280, uniform square cells, generous transparent gutters. Row 1: facing SOUTH toward viewer, three-quarter top-down front. Row 2: facing WEST, real left profile (head and body face LEFT). Row 3: facing EAST, real right profile (head and body face RIGHT). Row 4: facing NORTH away from viewer, back and rear head visible, face NOT visible. In EACH ROW column1 is a balanced neutral standing/resting pose; columns2-5 are FOUR consecutive looping walk phases: left-foot/diagonal-limb contact, passing/recoil, right-foot/opposite-diagonal contact, opposite passing/recoil. Distinct foot placement and flexing joints, natural counter-swinging arms/tail/cloth, stable head/body proportions and size across the sequence. Keep body centered, sole baseline at 86 percent of each cell, upright body height around 65 percent of a cell, entire tail/wings/weapons inside its OWN cell. Preserve both sides of asymmetric carried equipment physically, do not arbitrarily switch weapon hands. No fighting, no attack, no jumping, no fake bobbing copied poses. Transparent alpha everywhere outside silhouettes, no glow-painted background, no shadow, no labels, no numbers, no text, no grid lines, no circles, no scene, no extra characters. Legible sharply shaded pixel clusters matching the supplied game art, not smooth 3D rendering or vector drawings.

### Troll correction

Precise-object-edit of this game sprite sheet. Preserve the entire existing transparent five-column four-row 20-sprite sheet and all nineteen other sprites, their size, arrangement, silhouettes, alpha, shading, palette and gait poses. Fix ONLY the fifth sprite in the FIRST row (upper-right front-facing troll). That sprite mistakenly holds the club in the left hand on the viewer's right. Put its same heavy studded wooden club back in the troll's RIGHT hand, on the viewer's LEFT, consistent with the first four sprites in this row. Preserve the last sprite's walking-leg pose and walking arm counter-swing; do not change into an attack pose. Keep every other sprite unchanged. Keep genuine transparent alpha background, no added backdrop, labels or border.
