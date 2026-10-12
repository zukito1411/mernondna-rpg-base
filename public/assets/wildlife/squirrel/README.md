# Woodland squirrel artwork

Generated with the built-in image-generation tool on 12 October 2026. Style
reference: the project's existing rabbit prototype. `prototype.png` is the
squirrel identity anchor; `poses.png` is the final 1536x1024 source board.
Existing rabbit, character and scenery artwork was not replaced.

The board has 24 complete poses: east, south and north run cycles (six each),
then mounting/alternating-paw climbing/hiding poses. West mirrors east.
Source spacing is irregular, so `src/game/systems/SquirrelArt.ts` uses explicit
rectangles, not a regular grid split. All states use one body fit. Grounded
references preserve stride lift; climbing uses rear-paw contact coordinates,
not the dangling tail's alpha bottom. Neutral rendered height is 32 world
units including the upright tail, keeping the actual body smaller than a rabbit.

Boot prepares a padded 768x512 atlas (~1.5 MiB RGBA) and releases the source
texture. The prototype is retained for provenance and is not loaded in-game.
Brown RGB in fully transparent background pixels may appear in viewers that
ignore alpha; the game must preserve the alpha channel.

## Prompt set

Prototype (rabbit image as style reference only):

> Use case: stylized-concept. Asset: one game sprite prototype. Reference image is ONLY style reference, not subject identity or edit target. Create one natural red-brown woodland squirrel, complete body, bushy curled tail, short tufted ears, small black eyes, cream belly, tiny paws, crouched alert on all four feet, facing right in a three-quarter overhead fantasy RPG camera view. Detailed textured fur and crisp warm dark outlines matching reference painted sprite style. Anatomically squirrel, not rabbit, no long rabbit ears, not mascot. Full tail, limbs, ears visible, centered with generous padding. GENUINE TRANSPARENT ALPHA background. No floor, no shadow, no props, no text, no grid, no scene.

Animation board (squirrel prototype as identity/style reference):

> Use case: stylized-concept. Asset: transparent animation sprite sheet for top-down fantasy RPG. Image1 is squirrel identity/style reference, NOT edit target. SAME red woodland squirrel, tufted SHORT ears, cream belly, bushy tail, detailed warm outlined painted fur. Create EXACTLY 24 complete full-body poses on a 1536x1024 TRANSPARENT canvas in a strict SIX columns by FOUR rows grid (each cell256x256). Every animal fits within its own cell with 16px padding; uniformly reduce all poses to fit if needed. Same body size across states/directions; retain whole tail, legs, ears, no intersecting neighbors. Overhead 45degree game-camera perspective. Rows1–3 are ground running: row1 facing right (mirror will supply left), row2 down toward camera, row3 up away. In EACH ground row columns1–6: neutral crouched alert; gather hindlegs; hindlegs push, forelegs reaching; extended bounding stride; forepaws land, hindlegs tuck; crouched recovery. Use real distinct full-body motion. Grounded poses share one baseline at88% cell height, airborne paws slightly lifted. Row4 climbing straight UP an INVISIBLE vertical trunk toward top of screen, viewed from behind: column1 mounting forepaws raised; column2 left forepaw reaches up right hindpaw braces; column3 body stretches upward both hindlegs pushing; column4 right forepaw reaches up left hindpaw braces; column5 body gathered, tail curling; column6 tucks paws and folds tail close to body to hide under canopy. Full real gripping/climbing poses with short claws, alternating paws, head up, chest toward invisible bark; NEVER rotate a ground-running image as substitute. Climb row uses rear hindpaw contact at88% cell height. NO tree drawn. GENUINE TRANSPARENT ALPHA, no background RGB rendered, no ground, no shadow, no grids or text, no props. All24 squirrels only.

## Acceptance status

Source artwork and consuming code were inspected. No test suites, typechecks,
builds or game/browser launches were run, per the user's strict instructions.
In-engine cropping, body/paw registration, run-to-climb transitions, canopy
depth and physical-device performance remain unverified. Do not describe
this asset's runtime acceptance as passed on the basis of source inspection.

