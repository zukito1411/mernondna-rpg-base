# Woodland robin artwork

Generated on 12 October 2026 using the built-in image-generation tool. The
project's rabbit prototype supplied the painted fantasy style; `prototype.png`
is the bird identity reference and `poses.png` the final 1536x1024 alpha board.
Existing approved character, scenery, rabbit and squirrel art was not replaced.

The board contains eighteen complete poses in east/south/north rows: alert,
feeding, takeoff, raised wings, midway stroke, lowered wings. West mirrors east.
Runtime preparation uses the existing whole-subject component extractor rather
than cutting wings at approximate grid seams. One body fit is shared across
all frames; authored torso centers keep the opened wings from shifting the body
sideways. Directional grounded references remain fixed as the feet tuck in flight.

Runtime neutral height: 14 world units. Padded atlas: 768x384 (~1.125 MiB RGBA),
prepared/uploaded once at boot; the source texture is then released. Prototype
art is retained for provenance and is not loaded in-game. Transparent pixels
retain background RGB; consumers must preserve alpha.

## Prompt set

Prototype (rabbit reference is style only):

> Use case: stylized-concept. Asset: one woodland bird game-sprite prototype. Reference image1 is ONLY painted fantasy sprite STYLE reference, not an edit target. Create ONE natural small woodland robin, complete body, warm rusty orange breast, brown head/back/wings, pale cream belly, small black eye, slender pointed dark beak, tiny clawed feet and short tail. Facing RIGHT, folded wings, alert neutral standing/perching pose, 45degree overhead top-down RPG camera view. Detailed feather texture with warm crisp outlines matching reference, not a mascot or photo. Full beak, tail, toes visible, generous transparent padding. GENUINE transparent alpha, no branch, no floor, no shadow, no scene, no text, no grid.

Animation board (bird prototype is identity/style reference):

> Use case: stylized-concept. Asset: transparent woodland robin sprite sheet. Image1 identity/style reference only. Create SAME small robin in exactly18 complete poses on1536x1024 alpha-transparent canvas: six columns by three rows, each cell256x341, generous padding20px, no overlap. Row1 facing right, row2 down toward camera, row3 up away; 45degree overhead RPG camera. Each row columns1–6: 1 alert neutral with wings folded, feet grounded/perching; 2 feeding beak dips low, head tilts downward, folded wings and same feet baseline; 3 takeoff crouch then opening wings halfway, toes push ground; 4 flying WINGS RAISED high in upstroke with bent elbows and clearly spread primary feathers; 5 flying BOTH WINGS OUTSTRETCHED horizontally midway through stroke; 6 flying BOTH WINGS SWEPT DOWN BELOW body in powerful downstroke. Genuine varied articulated wings, not pasted or rotated copies. No branch or floor. Keep body/head SAME physical size in all18 poses; larger extended wings must not make body smaller. Center bird TORSO horizontally in each cell, keep virtual feet/body ground anchor at75% cell height; flex wings within padding not over neighboring cells. Rust-orange breast, brown back/head/wings, cream belly, tiny dark beak and clawed feet, short tail. Complete wing tips, feathers, body, toes and beak retained. Detailed painted fur/feather style of reference, crisp warm outlines. Real transparent alpha everywhere except birds; no backgrounds, gradients, shadows, grid lines, text, logos or props.

## Acceptance status

Source artwork and code were inspected. No game/browser launches, tests,
typechecks, builds or profiling were run, per the user's instructions. GPU frame
containment, body/foot registration, wingbeat cadence, resting branch placement,
takeoff continuity and phone performance remain unverified. Source inspection
is not rendered-game acceptance.

