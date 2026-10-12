# Portquill coastal gull artwork

Generated on 12 October 2026 with the built-in image-generation tool.
The existing woodland robin supplied style only; `prototype.png` is the gull
identity reference and `poses.png` the final 1536x1024 alpha source board.
No existing approved character, scenery or other wildlife artwork was replaced.

Eighteen full-body poses: east/south/north rows of standing, feeding, takeoff,
raised wings, horizontal wings and downstroke. West mirrors east. The shared
bird atlas preparer isolates whole subjects across approximate cell seams;
`CoastalGullArt.ts` supplies this board's own torso centers. One body fit applies
to all states, never resizing against each wing span. Runtime neutral height
is 26 world units (woodland robin 14), with slower beats and brief glides.

Padded runtime atlas: 768x384 (~1.125 MiB RGBA). Preparation/upload happens at
boot and releases the source texture. The prototype is not loaded in-game.
Transparent pixels retain backdrop RGB; consumers must preserve alpha.

## Prompt set

Prototype (robin as style reference only):

> Use case: stylized-concept. Game sprite prototype. Image1 is ONLY detailed painted fantasy sprite style reference, not identity or edit target. Create ONE natural coastal seagull, full body, facing right at45degree overhead RPG camera. White head/breast, pale silver-gray back/folded wings, dark primary tips, slim yellow beak, small black eye, peach webbed feet, streamlined adult gull anatomy and long folded wing contour, not a round robin or duck, not mascot. Match warm crisp outlined feather detail of reference. Complete tail, beak, feet visible with generous padding. Genuine transparent alpha background; no ground, cast shadows, water, branch, props, grid or text.

Animation board (gull prototype as identity/style reference):

> Use case: stylized-concept. Asset: transparent coastal gull sprite sheet for fantasy top-down RPG. Image1 gull identity/style reference only. Same streamlined adult gull: white head/breast, pale silver-gray back/wings, black primary tips, yellow beak, peach webbed feet. Create EXACTLY18 complete poses on1536x1024 alpha canvas,6columns x3rows. Rows right-facing, down toward camera, up away. 45degree overhead view. In each row columns1–6: neutral standing/perching with folded wings; feeding head/beak dips while feet remain planted; crouched takeoff opening wings halfway; flight both wings HIGH UP bent at elbows; flight both wings spread HORIZONTAL; flight both wings swept DOWN BELOW body. Long articulated gull wings with clear feather detail and varied real wingbeats, not rotated copies. SAME torso/head physical size across all states; extended wings enlarge silhouette but must NOT shrink the bird body. Keep torso centered in each cell and virtual grounded feet at75% cell height. Separate whole poses with wide transparent gaps, full wings/feet/beak/tail intact, no touching neighbors. Detailed warm outlined painted fantasy sprite style of reference. GENUINE transparent alpha background. No ground, shadow, water, branch, props, grid lines or text.

## Acceptance status

Source art and code were inspected. Tests, typechecks, builds, game/browser
launches and profiling were not run under the user's strict instructions.
Runtime crop containment, body/foot registration, pier-cap placement, shoreline
admission frequency, takeoff/glide continuity and device performance remain
unverified. Source inspection does not establish rendered-game acceptance.

