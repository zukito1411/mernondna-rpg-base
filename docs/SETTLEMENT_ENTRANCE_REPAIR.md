# Settlement entrances and caravan clearance — 2026-10-14

## Entrances

- The shared defense generator no longer creates a solid corner tower where a
  surveyed road/water entrance cuts through that vertex. The clearance accounts
  for the visible tower width rather than checking only identical coordinates.
  This applies to every settlement using the shared generator, including the
  Highmere, Oakmere and Starhold entrances shown by the user.
- Removed the extra round entrance posts: on a corner one was positioned beyond
  its actual wall edge, and front-facing gates already contain their own posts.
  Towers at uninterrupted corners remain. Curtain collisions remain intact;
  this does not turn off walls or grant walkability over water.
- Highmere's existing open north/south gate artwork has a larger aperture, shared
  by its collision survey. No side-facing gates are invented or rotated.

## Horse/cart traffic

The existing horses are attached caravan sprites, not controllable player mounts.
Their rendering now samples the horse's hoof position along the same path as the
cart instead of using a flat offset across a curved bridge. Horse depth follows
its own ground point. Directions/approved stepping artwork are retained.

Road admission samples more closely and uses the rendered side-view ground
clearance instead of an 88px square for every direction. Walls are checked along
the travelled segment. Route stops reserve 180px for the horse at either end;
motion and gait clocks use the resulting travel length consistently. Tiny
isolated runs no longer spawn a train without enough parking room.

Caravans still turn at safe road approaches rather than being routed through
authored town interiors/buildings. This does not implement player riding or
promise cart access through every small pedestrian bridge.

## Straight crossings and boards follow-up

Road bridges now use the existing simple timber crossing, not the arched stone
sprite. Its flat centerline, scaled bank clearance, terrain deck and extracted
post/rope layers share the same source survey. Highmere, settlement tributaries
and wilderness crossings use that frame and matching scale. Source helper names
remain compatible with existing callers. Roads meet the bridge at its actual
straight deck entrances rather than bending over a stone arch.

Noticeboards/signs receive a final placement pass after campaign/discovery content
is added, keeping them clear of streets, bridge artwork, water and neighboring
objects. Existing IDs and interaction/quest state remain unchanged; authored
static positions also apply when restoring old saves.

## Verification boundary

Source review and bridge asset inspection only during implementation. No local
tests, type checks, builds or game/browser launches ran. The user subsequently
requested committing/pushing these repairs and waiting for the existing GitHub
APK build/release workflow. Prior published APKs do not include these repairs.
Manual
checks are still needed at both directions of the pictured openings, Highmere's
front gates, bridge curves and caravan loading stops.
