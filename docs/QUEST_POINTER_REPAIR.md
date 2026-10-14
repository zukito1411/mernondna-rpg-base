# Quest pointer repair — 2026-10-14

## Current requested behavior: direct destination bearing

The later user request supersedes street-by-street guidance. World, HUD and
minimap arrows now point directly at the quest destination/NPC. Outdoor targets
for indoor residents remain their actual building entrance; once inside,
guidance points directly at the resident, or the exit if the objective is outside.
No street/bridge/gangplank/room waypoint redirects the arrow. Island and flagship
travel instructions remain informational text (`travelHint`), with full details
in the journal. Destination distance is straight-line distance, not route length.
NPC patrol and collision/navigation systems are unchanged. The now-unused world
street cache and interior guide routing were removed from their scene/session.

## Earlier route guidance implementation (superseded)

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

## Mobile resizing follow-up

The first mobile layout fix still switched HUD dimensions at 520px viewport
height. The follow-up removes that switch for the status and quest panels:
compact mode is selected once per gameplay mount (always enabled in Capacitor),
and uses one 188px-wide layout with 64px status and 78px quest cards. The width
shrinks only if needed to fit a very narrow screen alongside the minimap.
HUD-only browser text inflation is disabled, HP/stamina/XP fills are positioned
inside fixed tracks, and destination/next-step/distance each have reserved rows.
Showing a new waypoint or receiving new resource values cannot change those
panel dimensions. Desktop gameplay retains its normal layout. No local tests,
builds, game launches, commits or pushes were performed for this follow-up.
