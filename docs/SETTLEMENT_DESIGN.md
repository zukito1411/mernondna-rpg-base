# Settlement layout and field design

This is a continuation of the existing continuous world, not a replacement map or a set of disconnected levels. Oakmere is the first fully authored local layout. Other existing settlements now use a connected street/frontage template rather than random building rings; they remain prototypes awaiting individual regional architecture and districts.

## Reading the reference atlas

The supplied atlas establishes the cultivated Trandum belt, major trade directions, neighboring forests/mountains, and sea-separated island realms. It is a lore-scale illustration, not a survey of Oakmere's individual plots. Oakmere's existing position and NPC identities are preserved. The village is interpreted as a compact road-and-farm community: trade beside the through-road, services near the junction, quieter ritual space to the north, food production outside the residential core, and retained woodland at the edge.

The underlying continent/island geometry is still the existing generator. This slice does not claim to finish the continent polygon/watershed milestone, implement rivers from the atlas, or make the islands reachable by sailing yet.

## One source for ground and placement

`src/data/settlements.ts` defines local-coordinate parcels, street polylines, south-facing building lots and tree plantings. `WorldGenerator`, `content.ts` and `landmarks.ts` consume the same definitions. Changing a field or a lane updates the ground and its prop-placement rules together. Coordinates are gameplay units, not a claim of literal meters.

| Area | Spatial purpose | Visible treatment |
| --- | --- | --- |
| Junction/square | Public meeting and connected crown/east/west routes | Stone plaza and clear through-road |
| Guard post | Watch the western entry; keep Elara on the frontage | North-west cottage and connected approach |
| Pike Smithy | Accessible repairs/loading; avoid a forge in planted soil | Named cottage, stone work apron, Joren nearby |
| Marrow Inn | Travelers arrive from the east; enter the south-facing door | Larger inn, dirt court, garden pine behind the roof |
| Caravan yard | Unload near Torren without blocking the through-road | Cargo beside a widened dirt apron |
| Training ground | Meet Aldren and move around him | Open dirt patch, railings, shade tree on its southern edge |
| Shrine court | Quieter setting and a readable approach to Orin | Paved court, retained grove north/west |
| Herb garden | Tended beds near Mira's side of the lane | Small cultivated parcel, accessible edge |
| Ranger lodge | Transition toward the eastern woodland route | South-facing cottage, exterior access lane, boundary pine |
| Orchard | Food production beside homes and the crop fringe | Regular tree spacing and room to walk between trunks |
| Crop field | Workable rows, perimeter boundaries, service access | Two cultivated sides separated by an open central dirt lane, wheat rows and fence gaps |

## Constraints, not arbitrary scattering

- Every street/frontage joins the same local circulation network and regional road approaches.
- Road centerlines are checked against structure footprints enlarged for the player's unchanged body. Door approaches terminate outside the foundation rather than crossing a roof/body rectangle.
- NPCs retain their existing coordinates and saved identities. Buildings do not occupy their bodies; foreground tree canopies must not hide the named cast.
- Paved work/ritual courts override road dirt. Streets override cultivated ground to create actual field entrances and service lanes. Remaining cleared land is meadow rather than randomly alternating grass/forest/dirt inside the village.
- Crop and fence placement derives from field dimensions. Wheat stays inside cultivated parcels and outside street clearance. Fences skip entrances, retain horizontal perspective and do not obstruct the central lane.
- Orchard spacing differs from retained woodland. Wilderness stands use habitat/noise bands and guaranteed trunk separation, with road/coast/site exclusions. Cold snowy stands prefer pines; trees do not spawn in crop beds.
- Character silhouettes, buildings and props use a common visual scale. Art size is decoupled from gameplay body size; enlarged characters do not silently gain wider attacks or bigger collision bodies.

These are land-use, access and readability rules—not a completed soil, hydrology, seasonal yield or ecology simulation. Those systems remain their planned milestones. No new generic important NPCs, working shops, interior scenes or town-economy claims are introduced by labeling buildings.

## Persistence and performance

Existing NPC/boss/loot IDs and old building/decoration/farm IDs are retained. No save format changes are required. Existing trust, wounded/dead creatures, used rewards and explicit logical relocations remain in the content ledger. Only disposable render actors unload. The extra local trees and field props do not increase the creature/AI budget; wilderness scenery remains capped at 36 per chunk and the terrain streamer still keeps nine chunks.

## Village creature safety

Settlement bounds, including crop/orchard parcels, now exclude every hostile creature with a 96-unit outer buffer. `WorldGenerator.canCreatureOccupy` is shared by authored-content activation, normal spawns, random events and enemy movement. Player traversal remains unchanged. Ambient encounters and attack-event announcements do not run while the player is protected; rejected event candidates do not produce misleading wave announcements. Enemies do not chase protected players or wander across the boundary.

Oakmere's authored wolf/boar were moved outside its expanded layout; Stonejaw was moved outside Starhold's prototype bounds. Captain Varr remains at the existing wilderness watchtower. IDs, rewards, quest links and death persistence are unchanged. On scene load, `repairCreaturePlacements` moves old alive in-town creature records to valid wilderness while preserving health and spawn IDs. Dead creatures, NPC trust and used loot are not reset. An unplaceable record stays dormant instead of being deleted or awarded as a kill. This is position repair within the existing v2 ledger, not a new save schema or a reason to start a new game.

These are current safe-settlement rules. Deliberate story raids would need an explicitly authored system later; ordinary event spawns are not a raid bypass.

## Verification

`tests/settlements.test.ts` checks street connectivity, retained IDs, open centerlines/door access, field/lane consistency, crop spacing, NPC footprint clearance, tree-canopy visibility and deterministic cross-chunk trunk spacing. Browser coverage checks the new visible character size while confirming old body dimensions, authored tree presence, and actual keyboard travel down the open crop-field lane. Survey screenshots use a test-only overview camera, not a gameplay teleport/region selector.

Next: author further settlements and continent geography using these definitions. Do not treat the prototype capital house rows as finished cities or bypass physical travel.
