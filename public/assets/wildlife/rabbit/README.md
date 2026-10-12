# Woodland rabbit artwork

Generated with the built-in image-generation tool on 12 October 2026.
Style reference: the existing `assets/sprites/fauna_1.png` woodland props.
Identity reference: `prototype.png`. Final source board: `poses.png` (1536 x
1024, genuine alpha; transparent pixels retain brown RGB, which some image
viewers display incorrectly). Neither existing scenery nor actor art was replaced.

Runtime crops are authored in `src/game/systems/RabbitArt.ts`, because the
extended side hop crosses its nominal grid boundary. Do not replace these
with a regular spritesheet split. Rows are east, south, north; columns are
alert, preparation, push-off, extension, landing, recovery. West mirrors east.
One shared fit preserves model proportions, and a fixed grounded reference
per direction preserves airborne lift. Runtime atlas: 576 x 288, about
0.63 MiB RGBA; the source texture is released after preparation. Prototype
art is retained for provenance and is not loaded by the game.

## Prompt set

Prototype:

> Create a game sprite prototype: ONE small wild brown rabbit, full body, right-facing three-quarter overhead view (top-down fantasy RPG camera looking down about 45 degrees). Art style reference image 1 is ONLY a palette/detail/style reference: detailed hand-painted sprite with crisp dark warm outlines, textured brown fur, tan belly, ivory short tail, long natural ears, compact realistic rabbit anatomy, small black eye. Match its detailed woodland fantasy rendering, NOT cartoon mascot, not photorealistic photo. Neutral standing/crouched rabbit pose, all four paws grounded on one baseline. Isolated centered full rabbit with generous transparent padding, no cast shadow baked in, no ground, no scenery, no extra objects, no text, no grid. Genuine transparent alpha background. This is an original new rabbit asset; do not alter reference artwork.

Animation board:

> Use case: stylized-concept. Asset type: TRANSPARENT rabbit animation sprite sheet for a top-down fantasy RPG. Image 1 is rabbit identity/art-style reference, not edit target. Create the SAME complete brown rabbit in EXACTLY 18 separate full-body animation poses in a STRICT 6-column x 3-row regular grid on a landscape 1536x1024 transparent canvas. Each cell exactly 256 wide and one-third canvas height, with generous empty padding and NO grid lines or labels. Row 1: facing RIGHT (three-quarter overhead view). Row 2: facing DOWN toward camera, overhead foreshortening. Row 3: facing UP away from camera, rabbit back/tail visible. Columns for EACH row left to right: 1 neutral alert grounded rabbit with ears upright; 2 crouched preparation ears tilted; 3 hind legs PUSH OFF body lengthens forepaws forward; 4 airborne extended HOP with forelegs/hindlegs stretched naturally; 5 forepaws landing hind legs tucked; 6 grounded crouched recovery then ready to return to preparation. Real different complete poses, not translated copies. Same animal anatomy, fur colors and BODY SIZE in every cell; never enlarge the head or body in another direction. Center body horizontally in every cell and use the SAME virtual ground baseline at 88% of each cell height; airborne rabbit's paws only slightly lifted. Full ears, tail, all limbs remain safely contained within their own cell, no foreign pixels crossing cells. Warm crisp painted fantasy sprite detail matching reference, brown fur/tan belly/ivory short tail, natural rabbit anatomy not mascot. Genuine TRANSPARENT alpha throughout. NO floor, NO ground, NO cast shadows, NO text, NO decorations, NO backdrop, NO grid marks. Only the 18 rabbits.

Final extraction/padding pass (the requested regular grid was not fully
achieved, so the consuming code uses explicit source rectangles):

> Edit target image 1 rabbit sprite sheet. Keep ALL 18 full rabbit poses, directions, proportions, colors, fur detail and arrangement. REMOVE THE ENTIRE BROWN BACKDROP, haze and cast shadows: the output MUST have genuine transparent alpha between every rabbit, absolutely no opaque or translucent brown/black/white/checkerboard background. Keep fine fur/whiskers and every limb intact. Fix cell containment while preserving artwork: image is1536x1024 in 6 columns x3 rows. Each rabbit must fit inside its own 256x341 cell with at least12pixels padding on ALL four edges, centered horizontally. Make all poses modestly smaller by the SAME uniform factor if necessary, NEVER resize one pose independently or crop limbs. Actual alpha channel transparency is essential: only rabbit pixels may be visible, all other pixels zero alpha. No text, no added scenery, no grid. This is sprite extraction/padding only; do not redesign poses.

Source-art inspection was performed. Rendered game acceptance, animation
cadence, GPU crop registration and physical-device performance remain
unverified: the user prohibited tests, builds and game launches for this task.
