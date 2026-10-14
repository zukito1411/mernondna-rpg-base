# Collision and rendering cleanup — 2026-10-14

This source-only follow-up preserves the existing world layout, character art,
quest IDs, saved progression and PC/mobile controls.

## Changes

- Walking/dashing and Skyfall's displacement check the travelled ground segment,
  rather than only a walkable endpoint. Object contours and defensive seams are
  swept against the player's feet; terrain sampling catches intervening water
  and lava without treating projectile line of sight as ground navigation.
- Stationary feet also check streamed object overlaps. If newly loaded scenery
  covers the saved safe position, bounded local recovery searches for clear
  ground instead of disabling the collider. Interior exits update the outdoor
  safe-position bookkeeping as well as the physics body.
- Elven buildings, their open gate/palace arches, the life tree's roots and
  garden fences have explicit ground contours and sorting points. Capital and
  royal gate posts remain solid even when the arch is marked as open. Port docks
  are ground artwork, not solid foreground buildings. Existing bridge deck and
  parapet registration remains intact.
- NPC route checks sweep object contours between their sampled waypoints.
  Interior conversation paths check furniture, walls and their final endpoint,
  ignoring only the person being addressed, not other residents.
- The player's current scenery chunk loads before queued offscreen chunks.
  Authored scenery reservations use a static spatial index instead of scanning
  all world content for each terrain bake. Defensive point checks reject distant
  bounds before examining wall segments. Registration reuses trigonometric
  values and rejects duplicate object registration.
- Leaf layers inherit the trunk's rotation and mirroring. Scene shutdown removes
  its lifecycle listeners and runs cleanup once, avoiding repeated disposal.

## Verification boundary

Only source review and existing asset-image inspection were performed. No tests,
type checks, builds, game/browser launches, performance benchmarks, commits or
pushes were run for this cleanup. Earlier release checks predate these changes.

Manual follow-up should cover movement and dashes along foundations/gate posts,
elven arches and fences, both directions across bridges, streamed chunk borders,
NPC conversations around furniture, interior exits and scene restart. Source
inspection is not a guarantee that every rendered contour or route is correct;
performance improvements have not been benchmarked.
