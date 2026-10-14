# Quest pointer repair — 2026-10-14

- Settlement guidance caches a remaining path rather than a single waypoint.
  Reaching a waypoint advances guidance inside the same position cell. Corners
  advance only when the next segment passes the player's swept collision and
  ground checks. Failed/blocked paths retry at most once per second within a
  cache cell; objective changes and movement into a new cell invalidate the route.
- Street routes use player movement clearance, not NPC roof-visibility rules.
  Remaining-path endpoints follow moving contacts within the cached goal cell.
- The world pointer stays visible when the destination is close but separated
  by walls, water or lava. Arrival requires interaction-range proximity, clear
  line of sight and walkable intervening terrain, not distance alone. A pointer
  at its exact approach does not invent a north-facing direction.
- HUD/minimap bearings receive the same sampled player position as the resolved
  route. The HUD distinguishes the final destination from the next approach and
  labels approach distance explicitly. Mobile next-step text is bounded to two
  lines; street turns retain boat/bridge guidance instead of replacing it with
  a generic label. Existing full-journal destination details remain unchanged.
- Mobile status/quest panels have bounded rows, shrinkable grid columns and
  ellipsized long names/locations. Gameplay text uses 100% text-size adjustment
  to avoid browser text inflation on rotation. Compact sizing now applies to
  touch portrait and landscape, rather than falling back to desktop proportions
  above the short-landscape breakpoint. The full quest text remains available
  by tapping guidance to open the journal.

No local tests, builds or game launches were performed. The requested push uses
the existing GitHub Android build/release workflow; gameplay appearance and
every authored route still require manual verification.
