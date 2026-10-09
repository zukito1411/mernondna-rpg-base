# Dragon breath artwork and animation

The breath now uses six painted flame frames in
`public/assets/effects/dragon-breath.png`, generated with the built-in imagegen
tool using the existing dragon attack strip as a style reference. The original
dragon artwork is retained. The PNG is 1536x1024 with a genuine alpha channel,
three columns and two rows; the corners and gutters are transparent.

Boot prepares a single compact atlas, registering every flame frame to its
narrow nozzle with one shared scale. No per-frame canvas uploads or allocated
particles are needed during combat. Two persistent sprites provide the main
painted flame and a restrained additive glow; the former triangle-and-circle
fire renderer is removed. The thin ground outline remains a deliberate attack
telegraph, separate from the fire artwork.

The dragon anticipates with three existing body poses, holds its open-jaw
forward pose during the sustained breath, and returns to idle during recovery.
The attack no longer repeats the baked-fire frame or closes its mouth mid-jet.
The flame originates at the registered jaw, mirrors with the dragon, points
toward the locked attack direction, grows for 140ms, loops at about 13 frames
per second, and dissipates for 200ms after the 1600ms burning window. Damage
starts after ignition and ends before the visual fade. The original ground
cone, line-of-sight checks and 350ms damage interval are preserved.

The local attack clock also drives the flame, so menus stop both motion and
damage. Encounter reset, defeat and streamed actor destruction hide or dispose
of both effect sprites without detached timers or lingering fire.

Validation covers timing, nozzle mirroring and ground-cone boundaries, plus
desktop and touch browser checks of real frame artwork, aiming, jaw poses,
pause, fade and cleanup. Screenshots are emitted under `test-results/`.

## Generation prompt

+Use case: stylized-concept. Asset type: transparent animated sprite sheet for a dark fantasy 2D RPG dragon breath effect. Input image is STYLE REFERENCE ONLY: match the detailed painted pixel-art shading and molten orange-red fire of this existing dragon attack, but do not draw any dragon or creature. Create a clean 1536x1024 sprite sheet arranged in exactly 3 columns and 2 rows, six equal 512x512 cells with no lines, borders, labels, text or checkerboard. Each cell contains ONE coherent continuous flame jet pointing horizontally RIGHT, rooted at exactly x32,y256 within its cell, extending to x480 with the same full bounding envelope in every frame. The jet begins narrow at the left mouth nozzle and expands into a broad turbulent billowing flame cone at the right, about 380 pixels tall at its far end, with ragged organic tongues and a soft semitransparent edge. Six successive looping animation phases, subtle but visibly different swirling rolling curls and tongues advecting from left to right; not six differently sized explosions. Strong yellow-white tapered incandescent inner core, rich golden-orange mid flames, deep crimson outer tongues, a small amount of charcoal smoke interwoven at the far tips. Highly crafted medieval fantasy game sprite art with readable painterly pixel clusters and fine flame texture, matching the reference. Fire only, no character, no separate circles or geometric shapes, no thin scribble lines, no scene, no cast shadow, no tiled background, no detached floating sparks crossing cell boundaries. Leave transparent gutters at least 20 pixels around each cell. Genuine transparent alpha background, including semitransparent flame edges. All six flames share the identical root, scale and direction for stable animation.
