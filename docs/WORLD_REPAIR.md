# World repair — 2026-10-08

This repairs the existing continuous React/TypeScript/Vite/Phaser/Zustand game.
It does not replace scenes, content streaming, save storage, or Capacitor.

## Spatial authoring

Every settlement now has its own named avenues, districts and service lots.
The authored preferred positions are resolved deterministically within their
wards. Large landmarks reserve space first; existing building indices remain
the persistent IDs. Placement checks full visible roofs/canopies against street
widths, other objects, named residents, water, crops and shrine forecourts.
Frontage paths must connect to existing streets without crossing another roof.

| Settlement | Layout identity |
| --- | --- |
| Oakmere | Farm village, service lane, shrine forecourt, residential lane, orchard and open field entrance |
| Highmere | Crown, market, craft and residential wards; grand avenues; castle; three river crossings |
| Willowcross | Bridge market, stable yard, east-bank stores, farm access and a river reach |
| Elarion | Whitebough ceremonial avenue, lore ward, bowyard and retained grove |
| Moonfall | Smaller grove trails, ritual clearing, herbalist cottages and moon garden |
| Starhold | Pass avenue, citadel and caravan terraces, temple and snow shelter belts |
| Red Mesa | Clan assembly court, forge quarter, rider lodge and separated beast yard |
| Deepford | River-hall, mine guild, forge/boatwright quays and river crossings |
| Tidewatch | Merchant ward, cargo way, shipyard, quay, harbor basin and accessible pier |
| Skallheim | Longhouse court, hunter yard, winter stores, fish quay and frost basin |
| Blackspire | Citadel ward, forge processional, chainworks and lower worker homes |

Non-village streets use stone; villages retain dirt paths with paved courts.
Starhold retains snow between its paved districts and avenues; Darkav ash uses
a charcoal-tinted variant of the supplied stone illustration rather than the
same bright stone pattern. Original terrain images remain unchanged.
Mainland route bends are preserved inside settlements, rather than replaced by
diagonal shortcuts or artificial cardinal gate roads. The surveyed Willowcross
and Deepford river reaches continue beyond local bounds into provisional pools.
Highmere retains its curved river. Bridges and pier walkability are explicit.
Crossings use source-measured deck pivots, not the center of padded atlas frames.
Highmere's stable, offices, barracks and warehouses use matching supplied art;
the old detached gatehouse-as-barracks assignment was removed.

## Walls and collision

Removed the perimeter wall/gate generator and its independent hidden rectangles.
The supplied wall PNG and corrected crop metadata remain available, but this
unused atlas is not loaded/packed at boot (saving roughly 39 MiB of RGBA atlas
memory). No rotated perspective wall runs are instantiated.

Collision remains on visible building foundations, tree trunks, boulders, cargo
and field rails. Art padding and roof/canopy extents are not movement barriers.
Wilderness trunks now share the authored trees' ground baseline. Wilderness
canopies also avoid the regional roads. People no longer form immovable player
barriers; their local patrols avoid foundations and foreground roofs. Water and
world bounds remain legitimate traversal limits.

## Artwork and lighting

Corrected capital, bridge, civic-prop and wall crop rectangles using source alpha
measurements. Preserved flags, chimneys, lamps and flames. Alpha trimming uses a
uniform scale instead of stretching trimmed silhouettes into their former boxes.
Original image files are preserved. NPC idle/walk and Leigneron's sword/skill
art stay in the existing atlas pipeline. Enemy visual enlargement no longer
silently enlarges physics bodies.

Boot extracts warm window/lantern pixels into emissive atlases and dims those
pixels in daytime textures; active fire art can remain visible by day. Nearby
streamed props register their source-measured light positions. Night rendering
uses one darkness canvas with localized radial cutouts, warm glows and emissive
pixels. Mask refresh is throttled to about 13 Hz; flame intensity subtly flickers.
Light nodes/emissions unload with their props. Fireflies use world coordinates,
not a second camera-zoom transformation. No light is attached to Leigneron.

## Existing saves

Save version remains 4 and the storage key is unchanged. Parsing retires only
obsolete `settlement:wall:`, `settlement:gate:` and `settlement:gate-tower:` records.
The content ledger restores static props to their corrected authored coordinates
and ignores obsolete decorative farm-rail/wheat IDs removed by street clearance
while preserving used flags. NPC/creature positions remain persistent; obscured
NPC positions are repaired without resetting trust. Quests, defeated bosses,
rewards and shrine unlocks are not reset. Highmere's existing shrine ID now uses
the clear court at local (-300,320). Local-development map travel still supports
all eleven destinations; production shrine discovery rules are unchanged.
If an old player position falls inside a repaired foundation, loading moves the
player to nearby clear ground without healing or resetting their progress.

## Validation and scope

The task attachment explicitly requested testing, superseding the earlier pause
on automatic test runs. New unit coverage checks all settlements' full-sprite
clearance, walkable residents/shrine arrivals/bridges, static reload repair,
obsolete-wall save compatibility, measured crops and night-only light sources.
Browser coverage surveys every settlement through actual map pins, walks its
main street, and captures overview/day/night images. Existing PC/touch, combat,
quest, boss, save and streaming checks remain in the regression suite.

Final results: `npm test` passes 69 tests across 14 files; `npm run test:types`
and `npm run build` pass. All 20 browser scenarios have passing results across
the full run and subsequent focused reruns, not a single final 20-test run.
Focused reruns cover the corrected idle assertions, PC/touch controls, combat,
quest/boss persistence, capital bridges, all eleven settlement surveys, lighting
and the new saved-player foundation repair. Final survey screenshots were
inspected, including Highmere's bridge pivots, snowy Starhold, charcoal Darkav
and nighttime Oakmere. Build retains the existing Phaser-heavy bundle warning
(approximately 1.64 MB minified / 471 KB gzip).

This is an environmental repair, not completed town simulation or finished
regional art production. Shops/interiors, full NPC daily schedules, abstract
ecology, coast-aligned harbors, hydrological watersheds and playable ships remain
later milestones. Regional layouts/ground/tints differ, but several buildings
still share the supplied Trandum-style artwork. Native device performance needs
physical Android/iOS validation; a browser survey cannot establish that.
