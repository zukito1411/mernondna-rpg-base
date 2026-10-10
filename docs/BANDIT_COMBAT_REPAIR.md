# Complete bandit combat sprites

The old road-bandit attack, hurt and death PNGs were already cropped at the
bottom inside their source cells. Transparent atlas gutters and valid GPU
coordinates did not reveal the missing anatomical artwork. The previous audit
therefore overstated the completeness of the bandit's combat poses.

Complete authored replacement sheets now live in:

- `public/assets/enemies/refined/road-bandit-attack.png`
- `public/assets/enemies/refined/road-bandit-hurt.png`
- `public/assets/enemies/refined/road-bandit-death.png`

Generation mode: built-in imagegen, using the old action strips as edit targets
and the current complete directional bandit as the identity/detail reference.
All selected PNGs preserve actual alpha transparency and contain six complete
poses in three columns by two rows. Original files remain as legacy resources.

The bandit alone uses a dedicated `enemy_bandit` combat atlas: eighteen frames,
192 by 144 logical pixels, density two. It is allocated once before uploading.
Complete poses have transparent gutters and isolated pixel ownership. Source
standing/recovery poses calibrate each sheet to the approved neutral walking
height, with one fixed fit through each action. Extra sword reach does not shrink
the model and collapse poses become shorter by falling, not by rescaling.
Authored horizontal body roots and grounded soles register the physical actor.

The Road Bandit, Captain Varr and Salt King retain their appearance multipliers,
health, collision circles, action ordering and timing: attack 12 fps, hurt 10 fps,
death 8 fps. Their walk sheets and approved up/down movement are unchanged.
Other accepted enemy artwork is unchanged. NPC idles, performance and shadow
changes from the prior task remain present; no earlier source task was discarded
when the conversation was steered to performance work. The two previously noted
world-layout test failures remain separate from this bandit repair.

Validation includes complete attack/hurt/death playback in both directions for
all three bandit definitions, fixed physical feet/circle through transitions,
actual death-clone texture selection, boot-pixel probes in all six attack poses,
frame containment and GPU coordinates across 321 enemy frames, and rendered
action grids at `test-results/bandit-combat-rendered.png` and
`test-results/bandit-combat-left-rendered.png`. These are development captures.
No APK/production build, commit or push was performed.

## Attack prompt

Use case: precise-object-edit. Asset type: RPG bandit attack sprite sheet. Image 1 is the EDIT TARGET, the existing six-frame bandit attack strip whose boots were cut off at its bottom edge. Image 2 is the COMPLETE character identity, proportions, boots and painterly detail reference. Restore the SIX original attack phases IN ORDER as SIX COMPLETE WHOLE BODY sprites, 3 columns by 2 rows, generous transparent gutters, preferably 1536x1024. Preserve the hooded green cloak, red scarf, short stocky human proportions, brown leather/bronze segmented armour, curved sword and small round wooden shield. SAME character as image 2, same fine painted pixel RPG detail, same boot size and body proportions through all frames. ALL face right at the same three-quarter side angle as the right-facing row of image 2; never front-facing combat for a sideways enemy. Phases: 1 ready crouch sword low/shield near chest; 2 anticipation sword pulled back/shield raised; 3 sword lifted overhead; 4 forward downward slash with shield braced; 5 low horizontal follow-through crouch; 6 upright recovery matching the complete standing right pose. Translate the original arm/sword action phases into this right-facing angle. Both full legs and both FULL BOOTS with intact toes/heels/soles in EVERY frame, no amputated feet, no cutouts or detached parts. Entire hood, cloak, sword tips and shield remain inside each cell with at least 24 pixels of transparent margin. Fixed head, torso, shield and weapon size, bent knees during the strike rather than scaling the whole model smaller. Whole-body authored poses, never stitch existing torsos onto separate legs. No motion lines, no slash effects, no fire/glows, no shadows, no ground, no text, no grid lines. Genuine transparent background. Keep existing character design, improve completeness and match the current walking art only.

## Hurt prompt

Use case: precise-object-edit. Asset type: RPG bandit hurt sprite sheet. Image 1 EDIT TARGET is six original hurt/recoil poses, with boots cropped at bottom. Image 2 complete identity/style reference is the SAME bandit directional artwork. Restore exactly six sequential hit-reaction poses in 3 columns x 2 rows, transparent background and generous gutters, 1536x1024 preferred. Same green hooded cloak, red scarf, brown/bronze leather segmented armour, short stocky human model, curved sword and round wooden shield. Preserve ORIGINAL order and corresponding pose dynamics: upright hit start, flinch forward, deeper recoil, knees bent/head bowed, knees dropping, weakened very low crouch; this is hurt not a death animation. Match original three-quarter combat angle consistently across all six sprites, retain face and gear identities and painted pixel RPG detail matching image2. EVERY pose must be a complete connected WHOLE BODY with both full legs, both full boots/toes/heels/soles and entire sword/shield/cloak. Boots completely visible, no model cropped at the bottom, no half bodies, no detached limbs, no stitching body halves. Fixed torso/head/boot size across every pose; bend knees and torso, never shrink body to make a lower pose. At least24px completely clear transparent space around every complete character including weapon tip. No hurt flash/red tint, no effects/motion lines, no ground/shadows, no text/grid/background/glow. Change completeness and detail only, retain old action sequence and this same character.

## Death prompt

Use case: precise-object-edit. Asset type: complete RPG bandit death sprite sheet. Image1 EDIT TARGET is the original six-frame bandit death strip; image2 is the same character's COMPLETE directional identity/style/boots reference. Restore EXACT original SIX collapse phases/order in 3 columns by 2 rows, generous transparent gutters, 1536x1024 preferred. Same short stocky hooded bandit, green cloak, red scarf, segmented bronze/brown leather armour, curved sword and small round wooden shield. Fine painted pixel RPG detail exactly matching image2, preserve model identity and proportions. Pose1 upright recoil; pose2 knees buckling and head bowed; pose3 kneeling and tipping sideways; pose4 crumpling onto side; pose5 fully fallen almost settled; pose6 prone settled body on ground matching original final pose. Real progressive flattening, not six crouching/standing poses. Head/torso/boot/weapon size CONSTANT as character falls; don't resize each pose to same height. All original limbs and BOTH WHOLE BOOTS including toes/heels/soles fully included in every frame, full sword/shield/cloak. Every pose contains ONE complete connected character, no half bodies, amputations, detached duplicates or stitched parts. Preserve same three-quarter combat view as original, last poses rotate with the falling body, not change identity. At least24px clear margin around every sprite/weapon; all pixels fully fit cells, no sprite crosses into another frame or touches sheet boundary. Genuine transparent background, no floor/shadow/blood/FX/red tint, no motion lines, no text/grid/glow. Complete high-detail assets only.

