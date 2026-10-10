# Complete enemy poses and consistent sprite detail

The previous leg-compositing approach was removed, including its loader and
unused gait images. Enemy sprites now use complete authored bodies in every
movement frame. There are no waist seams or mixed old/new body halves.

The bandit's old combat strips subsequently proved anatomically incomplete:
their boots had already been cropped inside the source PNGs. Complete attack,
hurt and death replacements now use a separate padded atlas. See
`BANDIT_COMBAT_REPAIR.md` for the source diagnosis, assets and rendered checks.

## Movement

All six species use their full directional sheets for standing and walking.
The bandit uses neutral → step 1 → step 2 → neutral → step 3 → step 4 only for
left/right, keeping each pair of walking poses together instead of interrupting
the boot swing with a standing pose. Neutral lasts 70 ms, each walking pose
130 ms: a 660 ms loop at full movement speed. The complete native side-standing
artwork shown by the user remains between strides. Complete side poses are also
registered by the hood to remove source-cell torso jitter without altering feet
or stitching body parts. Up/down retain the previous four-step sequence at 8 fps and
the previously approved shared profile scale; no standing frames are inserted
into vertical walking. The other species are unchanged by this bandit correction.
Scale stays constant through each direction's entire cycle. Turning retains
stride progress. The wraith retains floating poses rather than invented feet.

Spawning initializes the actor with the same complete neutral texture used at
rest, and immediately registers its collision circle. Texture-layout changes
keep the physical feet and collision circle fixed during attacks.

## Quality

The built-in imagegen tool restored the dragon directional sheet and created
complete high-detail troll/dragon attack, hurt and death sheets, plus matching
dragon flight artwork. These are complete bitmap sprites, not runtime drawings.
The ground attack, hit and collapse poses retain their original frame ordering
and attack timing. Each clip shares one scale calibrated against its neutral
body height. Flight uses authored body anchors and a fixed .65 scale so wing
bounds do not resize the body through the wingbeat. Dragon breath uses mouth
coordinates registered in the new full attack art.

Enemy atlases use consistent nearest-neighbor GPU filtering. Original small
sprites are not blurred by an interpolated upscale during preparation; larger
restored images are reduced with high-quality sampling. Source processing happens
once during boot; gameplay uses the cached frames. Combat textures are uploaded
once after all restored action clips have been prepared. Wider canvas cells make
room for extended clubs, tails and claws without reducing the model's size.

## Frame containment

Connected components identify complete subjects. Each subject retains only its
own pixels, including nearby detached details and anti-aliased contours. This
prevents a neighboring wing or foot from appearing inside a rectangular crop
when two subjects' bounding boxes overlap. Before scaling, each cropped subject
is copied into an isolated surface with transparent padding. Atlas dimensions
are allocated before GPU frame coordinates are assigned and never resized.

The browser audit checks all 321 enemy frames, including idle, walking, attack,
hurt, death and flight: source image bounds, whole-body registration, transparent
sampling gutters, UV coordinates, crop ownership and neighbor-pixel probes.
A unit regression also uses two complete figures with overlapping bounding
rectangles and verifies that all their own pixels survive without borrowing any
neighbor pixels. Desktop/touch checks cover direction playback and dragon fire;
all 14 definitions are exercised in locomotion/attack/idle transitions.

Rendered review files are written to `test-results/enemy-footwork-rendered.png`,
`enemy-footwork-left-rendered.png`, `bandit-directions-rendered.png`, `enemy-combat-rendered.png`,
`dragon-body-rendered.png`, and the dragon-breath desktop/touch captures.
These previews are development artifacts; the packaged APK is unchanged.

No production build, APK build, commit, push or release was performed.

## Selected bitmap asset prompts

Generation mode: built-in imagegen. All selected assets are saved in this
workspace at the paths listed below.

### public/assets/enemies/refined/cave-troll-attack.png

Use case: precise-object-edit. Edit target image1: original troll attack sprite strip. Identity/detail/style reference image2: matching high-quality complete directional model. Restore attack as crisp detailed hand-painted pixel RPG artwork at HIGH RESOLUTION, preferably 2048x2048, SIX complete sprites in exactly 3 columns by 2 rows with generous transparent gutters. Preserve first FIVE source poses in order: ready club, turn to anticipate, club raised, overhead strike windup, club swung forward and return. Sixth pose repeats the ready stance. ALL face RIGHT at same three-quarter angle as original. Keep character identity and short stocky proportions, same clothing/anatomy/colors/weapon/wing shape as reference. Each frame contains the ENTIRE model, no stitched body, no partial sprites, no clipping, no changes of scale between poses. Match original body and head positions relative to grounded feet; retain action geometry, improving artwork detail only. Green troll, brown shaggy mane, ivory tusks, brown loincloth, white wrist wraps, knobbly wood club with pale studs; stocky original hunched stance, never a tall humanoid. Transparent background, no motion lines, no floor/shadows, no labels, no glows. Clear crisp edges matching the directional sheet, no blurry upscale. Entire sprite including all toes, tail and club must fit its cell with clear empty margin.

### public/assets/enemies/refined/cave-troll-hurt.png

Use case: precise-object-edit. Edit target image1: original troll hurt sprite strip. Identity/detail/style reference image2: matching high-quality complete directional model. Restore hurt as crisp detailed hand-painted pixel RPG artwork at HIGH RESOLUTION, preferably 2048x2048, SIX complete sprites in exactly 3 columns by 2 rows with generous transparent gutters. Six sequential hit reaction/recoil poses and recovery. Preserve source pose order and torso/head dimensions. No red tint: runtime handles damage tint. ALL face RIGHT at same three-quarter angle as original. Keep character identity and short stocky proportions, same clothing/anatomy/colors/weapon/wing shape as reference. Each frame contains the ENTIRE model, no stitched body, no partial sprites, no clipping, no changes of scale between poses. Match original body and head positions relative to grounded feet; retain action geometry, improving artwork detail only. Green troll, brown shaggy mane, ivory tusks, brown loincloth, white wrist wraps, knobbly wood club with pale studs; stocky original hunched stance, never a tall humanoid. Transparent background, no motion lines, no floor/shadows, no labels, no glows. Clear crisp edges matching the directional sheet, no blurry upscale. Entire sprite including all toes, tail and club must fit its cell with clear empty margin.

### public/assets/enemies/refined/cave-troll-death.png

Use case: precise-object-edit. Edit target image1: original troll death sprite strip. Identity/detail/style reference image2: matching high-quality complete directional model. Restore death as crisp detailed hand-painted pixel RPG artwork at HIGH RESOLUTION, preferably 2048x2048, SIX complete sprites in exactly 3 columns by 2 rows with generous transparent gutters. Six sequential collapse poses, ready/recoil, weakened stagger, knees buckle, falling, nearly down, settled on ground. Preserve source pose order and body size. Death poses must actually fall and progressively flatten, not six repeated upright stances. ALL face RIGHT at same three-quarter angle as original. Keep character identity and short stocky proportions, same clothing/anatomy/colors/weapon/wing shape as reference. Each frame contains the ENTIRE model, no stitched body, no partial sprites, no clipping, no changes of scale between poses. Match original body and head positions relative to grounded feet; retain action geometry, improving artwork detail only. Green troll, brown shaggy mane, ivory tusks, brown loincloth, white wrist wraps, knobbly wood club with pale studs; stocky original hunched stance, never a tall humanoid. Transparent background, no motion lines, no floor/shadows, no labels, no glows. Clear crisp edges matching the directional sheet, no blurry upscale. Entire sprite including all toes, tail and club must fit its cell with clear empty margin.

### public/assets/enemies/refined/ash-dragon-attack.png

Use case: precise-object-edit. Edit target image1: original dragon attack sprite strip. Identity/detail/style reference image2: matching high-quality complete directional model. Restore attack as crisp detailed hand-painted pixel RPG artwork at HIGH RESOLUTION, preferably 2048x2048, SIX complete sprites in exactly 3 columns by 2 rows with generous transparent gutters. Preserve first FIVE original poses in order: crouched ready, rise/open jaw upward, lean/open jaw FORWARD at the exact original height, lean forward open jaw (NO baked flame), crouched recovery. Sixth pose repeats ready stance. No fire or smoke; fire is a separate in-game asset. ALL face RIGHT at same three-quarter angle as original. Keep character identity and short stocky proportions, same clothing/anatomy/colors/weapon/wing shape as reference. Each frame contains the ENTIRE model, no stitched body, no partial sprites, no clipping, no changes of scale between poses. Match original body and head positions relative to grounded feet; retain action geometry, improving artwork detail only. Black and ember red stocky dragon, orange chest scales, red folded wings, curling tail, horns, four legs. Fixed head/torso size; wings folded during ground actions. Transparent background, no motion lines, no floor/shadows, no labels, no glows. Clear crisp edges matching the directional sheet, no blurry upscale. Entire sprite including all toes, tail and club must fit its cell with clear empty margin.

### public/assets/enemies/refined/ash-dragon-hurt.png

Use case: precise-object-edit. Edit target image1: original dragon hurt sprite strip. Identity/detail/style reference image2: matching high-quality complete directional model. Restore hurt as crisp detailed hand-painted pixel RPG artwork at HIGH RESOLUTION, preferably 2048x2048, SIX complete sprites in exactly 3 columns by 2 rows with generous transparent gutters. Six sequential hit reaction/recoil poses and recovery. Preserve source pose order and torso/head dimensions. No red tint: runtime handles damage tint. ALL face RIGHT at same three-quarter angle as original. Keep character identity and short stocky proportions, same clothing/anatomy/colors/weapon/wing shape as reference. Each frame contains the ENTIRE model, no stitched body, no partial sprites, no clipping, no changes of scale between poses. Match original body and head positions relative to grounded feet; retain action geometry, improving artwork detail only. Black and ember red stocky dragon, orange chest scales, red folded wings, curling tail, horns, four legs. Fixed head/torso size; wings folded during ground actions. Transparent background, no motion lines, no floor/shadows, no labels, no glows. Clear crisp edges matching the directional sheet, no blurry upscale. Entire sprite including all toes, tail and club must fit its cell with clear empty margin.

### public/assets/enemies/refined/ash-dragon-death.png

Use case: precise-object-edit. Edit target image1: original dragon death sprite strip. Identity/detail/style reference image2: matching high-quality complete directional model. Restore death as crisp detailed hand-painted pixel RPG artwork at HIGH RESOLUTION, preferably 2048x2048, SIX complete sprites in exactly 3 columns by 2 rows with generous transparent gutters. Six sequential collapse poses, ready/recoil, weakened stagger, knees buckle, falling, nearly down, settled on ground. Preserve source pose order and body size. Death poses must actually fall and progressively flatten, not six repeated upright stances. ALL face RIGHT at same three-quarter angle as original. Keep character identity and short stocky proportions, same clothing/anatomy/colors/weapon/wing shape as reference. Each frame contains the ENTIRE model, no stitched body, no partial sprites, no clipping, no changes of scale between poses. Match original body and head positions relative to grounded feet; retain action geometry, improving artwork detail only. Black and ember red stocky dragon, orange chest scales, red folded wings, curling tail, horns, four legs. Fixed head/torso size; wings folded during ground actions. Transparent background, no motion lines, no floor/shadows, no labels, no glows. Clear crisp edges matching the directional sheet, no blurry upscale. Entire sprite including all toes, tail and club must fit its cell with clear empty margin.

### public/assets/enemies/directional/ash-dragon.png

Use case: precise-object-edit. Edit target: provided dragon directional sprite sheet. HIGH RESOLUTION RESTORATION of this EXACT sheet, preferably 2800x2240. Preserve all TWENTY COMPLETE sprites and EXACT layout FIVE columns FOUR rows. Row1 face down/front, row2 LEFT, row3 RIGHT, row4 up/back; each row neutral stance then four original walk poses. Every head, wing, tail, body proportion and stance must stay unchanged. Improve fine black scale, orange chest scale, red wing membrane and claw detail to match crisp high-resolution painted pixel RPG sprites, without changing silhouette or model. This is restoration not redesign. Keep full wing/tail/claw pixels separated by clear transparent gutters; if needed slightly increase spacing while preserving row/column order. Full alpha transparency, no background/glow/shadows, no text, no motion lines. Consistent identical body dimensions in every pose; never detached limbs or half-body compositions. Sharp fine pixel-textured edges, no blurry enlargement. At least 350px native painted body height per sprite so it stays detailed when enlarged in the game.

### public/assets/enemies/refined/ash-dragon-fly.png

Use case: precise-object-edit. Edit target image1: dragon flying strip with SIX wingbeat poses. Identity and crisp rendering reference image2: this SAME dragon on the ground. Restore flight animation as high-detail sharp painted pixel RPG sprites matching the exact ground model: same black scales, glowing ember seams, orange chest scales, head/horns/tail/stocky torso and red wing membrane. No darker/muddier alternate model. Preserve all six original wingbeat phases in order: wings up, descending, level, downstroke, ascending, wings up. Exactly SIX COMPLETE sprites in 3 columns x 2 rows, transparent background and generous gutters. Keep torso, head and tail dimensions CONSTANT across all six images; articulate both wings without stretching body or changing model. Body/head proportions match ground reference; only legs tucked and wings unfold during flight. High resolution preferably2048x2048, every wingtip/claw/tail fully drawn and contained, at least20px clear border around every cell, no cropping. No blur, no floor/shadows, no effects/lines, no words or extra parts. Ground reference is for identity/detail, NOT a grounded pose: all six fly with tucked legs. Preserve pose alignment so flight is a stable body with moving wings, not six differently sized monsters.

