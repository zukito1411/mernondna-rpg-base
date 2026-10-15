# Cinematic camera streaming

## Source-level fixes

- The director previously requested chunks only when a shot began, before its
  final zoom was applied. It now updates the camera matrices and streams the
  actual `worldView` throughout movement, zoom changes, reveals and restoration.
- Terrain coverage is calculated from the complete viewport, not an intersection
  with a fixed player neighborhood. Cinematic terrain/content use a 768-unit
  preload margin, covering tree overhangs. Authored scenery also uses a spatial
  drawn-bounds index, including rotated objects whose bases are outside coverage.
- Distant destinations and interior changes are concealed until terrain coverage,
  the named NPC and visible undefeated authored bosses are ready. Terrain bakes
  are staggered (one per 95 ms) under the cover; nearby pans retain continuous
  streaming. No intervening regions are generated for distant cuts.
- Weather, light/shadow masks, water, tree sway and traffic use the current
  cinematic camera rather than the stationary player. Harbor-route coverage also
  follows viewport size. Boss slot reservations use cinematic coverage.
- Indoor speakers open their actual existing `InteriorSession`, retaining room
  floors, furniture, foreground draw order and residents. Camera bounds/zoom
  stay within the room footprint's padded bounds; a fitted black backdrop covers
  non-floor space. Viewing a room does not teleport the player or award a visit.
- Finish/skip conceals the return, restores the original room or outdoor view,
  preloads player coverage, restores zoom/follow, clears held input and resumes
  physics only when gameplay permits. Sequence guards reject stale asynchronous
  shot callbacks. Failed room restoration has an outdoor recovery path.
  A failed creature atlas cannot indefinitely block return to gameplay; terrain
  remains mandatory and an unavailable creature is reported after 15 seconds.
- Existing chunk disposal releases owned textures and scenery; room changes
  destroy residents, furniture, masks, tweens and kit textures. Streaming never
  loads an entire region. Save snapshots retain the player's safe position.

## Runtime verification still required

No tests, type checks, builds or game launches were run for this change.
Verify PC and Android distant multi-shot scenes, a pan across chunk boundaries,
zoom-out/rotation, indoor-to-outdoor and room-to-room scenes, and finish/skip
during loading and reveal. Check intended subjects, foreground occlusion,
lighting, restored controls/collision and repeated-play memory/frame pacing.
Include a distant boss/dragon arena to check the existing ground/flight visual
layers. Asset-load failure handling should also be exercised. Source inspection
does not establish rendered appearance or device performance.
