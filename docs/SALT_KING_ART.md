# Salt King sprite source and prompts

Generated with the built-in imagegen tool, using the existing road bandit as the style reference. No CLI/API fallback or hand-drawn limbs were used. The original road-bandit assets and its approved walking/combat sequences are unchanged.

Final source boards:

- `public/assets/enemies/salt_king/walk.png`: five columns, four directions (down, left, right, up); neutral plus four stepping poses per direction.
- `public/assets/enemies/salt_king/attack.png`: three columns, two rows; six complete cutlass attack poses.
- `public/assets/enemies/salt_king/hurt.png`: three columns, two rows; six complete flinch/recovery poses.
- `public/assets/enemies/salt_king/death.png`: three columns, two rows; six complete collapse poses.

`SaltKingArt.ts` isolates complete connected subjects before packing GPU frames. Each direction is calibrated to its neutral body, and each combat board to its first standing pose (76 world pixels before the existing boss multiplier). A single scale applies throughout each sequence: reaching swords and fallen bodies never resize the model. Every frame has transparent gutters, feet share the actor's ground line, and physics registration remains constant across texture changes. The Salt King uses species 6 and dedicated atlases; regular bandits remain species 1.

The atlases retain full-resolution artwork while using 128×112 locomotion cells and 160×112 combat cells, reducing unused texture space. [Rendered pose audit](images/salt-king-poses.png).

Final prompt set follows. All calls requested transparent output.

## Walking board

Reference: `public/assets/enemies/directional/road-bandit.png`.

> Create a production game sprite sheet as a new pirate adaptation of the provided road-bandit reference (reference for art style, body proportions and pose layout; DO NOT edit the original bandit). Character: The Salt King, a dangerous pirate captain, dark navy tricorn hat with gold edging, burgundy neck scarf and sash, weathered navy coat with brass trim over leather armor, brown trousers, two intact leather boots, curved steel cutlass and round small wooden buckler. Match the reference's richly shaded miniature fantasy RPG painted pixel art, warm outlines and squat heroic body proportions, consistent face/clothing/equipment across ALL frames. True transparent background, no floor, no shadows, no text or numbers or grid lines. EXACTLY 5 columns and 4 rows in equally sized grid cells, ample fully transparent gutters, each complete character centered within its cell with boots on common baseline, no pose touches any cell edge. Row 1 facing down/front, row 2 facing left, row 3 facing right, row 4 facing up/back. In each row: column 1 complete neutral standing pose, column 2 left-foot contact with right foot behind, column 3 right leg passing under body, column 4 right-foot contact with left foot behind, column 5 left leg passing under body. Clearly articulated stepping legs and visible COMPLETE boots in every pose, stable torso height and body size, believable smooth walk footwork, weapons move naturally without obscuring legs. Side-facing poses must show side anatomy and feet properly. Both hands remain equipped; no duplicated weapons or cropped limbs. This is a sprite sheet used directly in a game, rigorously keep exact 5 by 4 cell layout with one full-body pose per cell. Pirate should fit same body proportions as reference bandit.

## Combat boards

Reference: generated pirate walking board. Each call used this common prefix, followed by the corresponding sequence below.

> Use the attached Salt King pirate sprites as CHARACTER AND STYLE reference. Same navy gold-edged tricorn, burgundy scarf and sash, navy coat, leather armor, trousers, two boots, cutlass in right hand, round wooden buckler in left. Match detailed painted pixel fantasy RPG art, squat heroic proportions, same identity and outfit throughout. Output a TRUE TRANSPARENT game sprite sheet, EXACTLY THREE equal columns by TWO equal rows, six complete separate poses in reading order, generous transparent gutters, every pose entirely inside its cell with no clipped hat, legs, boots, weapon or shield. No text, grid, ground, shadows, trails, slash lines, effects or extra characters. ALL SIX face right, stable body anatomy and size.

Attack:

> Six frames of a complete cutlass melee attack: 1 neutral ready standing (both boots grounded), 2 wind-up sword raised behind shoulder weight on back boot, 3 anticipation front knee bends with both feet visible, 4 strike cutlass reaches forwards with front boot planted and back boot grounded, 5 follow-through blade extended low with weight shifted forwards, 6 returns to neutral ready standing. The entire body moves convincingly, no detached feet or disappearing boots. Weapons visibly remain held in hands. Neutral frames 1 and 6 same character height as reference. No fire or drawn attack lines.

Hurt:

> Six frames of a restrained hurt reaction, without changing character size: 1 full neutral ready standing, 2 flinch backwards with knees soft and shield held, 3 strongest backwards recoil torso leans boots stay visible and planted, 4 settle recovering from recoil, 5 straighten and lower shield, 6 full neutral ready standing. Cutlass stays held; complete two legs and two boots remain in EVERY frame, consistent torso length.

Death:

> Six frames of a death animation with complete bodies: 1 same full neutral ready standing, 2 buckling knees shield lowered and sword held, 3 down on one knee with both complete boots visible, 4 collapsing sideways to right, 5 lying completely on right side on the ground, 6 fully settled lying on right side. Maintain same anatomical lengths and character scale; crouching and lying silhouettes naturally shorter, NEVER resize fallen poses to be standing-height. Every lying body including weapons and boots is entirely contained within its cell. Generous gutters especially for wide final corpse poses.

Each combat board received this final refinement prompt, referencing that board:

> Edit this game sprite sheet ONLY to remove the entire background, haze and glows. Make ALL non-character pixels 100% transparent (actual alpha=0), including the dark black and brown backgrounds and the halos around cutlasses. Keep the six pirate characters exactly as drawn in the supplied image, same poses, full boots, weapons, faces, sizes, grid positions and exact 3 columns by 2 rows. Do not redesign, rescale, crop, repaint or rearrange the sprites. Preserve the dark navy clothing and black outlines of each character. The result is a clean transparent PNG sprite sheet with six isolated full-body pirate poses, no glow, no fog, no shadow, no ground, absolutely no colored or dark background.
