# Ground shadows, water and traveling scenery

GroundShadowSystem projects the prepared sprite alpha onto one viewport-sized
canvas. Player, NPC and creature shadows follow their feet. Props and wilderness
trees retain their full source silhouette even when trees split into wood/leaf
layers. Shadows shorten at noon, change direction smoothly through the day,
fade at night and release registrations with each actor. Floor props, bridge
decks and the volcano keep their existing shading. The former prop ellipses and
baked wilderness-tree shadows are replaced to avoid double shadows.

WaterSurfaceSystem animates painted foam sprite cells across the surface and
along actual bank edges. Canvas wave strokes and geometric wake marks have been
removed. Terrain masks keep the artwork out of roads,
bridges and frozen water. Reduced-motion settings stop cosmetic water motion.
The screen canvas follows camera movement and resize, including cinematic views.

WorldTrafficSystem streams cosmetic horse-drawn carts and sailing boats. Carts
use surveyed mainland road centerlines and turn outside authored town interiors;
walkability samples include cart-width clearance. Boats use deterministic local
sea/harbor lanes sampled for hull clearance; inland rivers and bridge decks are
excluded. Both wait briefly at route ends and return physically. Their route
phase survives renderer unloading within the play session. Menus, dialogue,
cinematics and loss of focus pause travel. Boat wakes and bobbing are cosmetic.

Carts now have separate wagon, horse and wheel artwork. Four distinct hoof
poses per front/rear/side view follow distance traveled. West-facing horses
mirror the east-view strip. Wheels use sixteen rotated artwork frames, prepared
with perspective applied after rotation so their hubs and ellipses stay fixed.
Loading waits stop the wheels and settle horses into a planted pose. Streaming
retains animation phase; pause freezes the current pose and wheel phase.

Boats are 2.5 times their earlier scale (approximately 350 world units across
the widest hull view). Each carries a helmsman using the existing 80-unit NPC
artwork. Source-measured deck positions and a foreground hull layer keep crew
aboard rather than floating beside the boat. Hull route clearance has increased
from 72 to 190 units. Wakes use two animated painted foam sprites per vessel.

These vehicles are ambient scenery: boarding, steering, trading, collision and
quest transport are future gameplay. They do not enter the persistent content
ledger or change the save format. Boats can be seen near Tidewatch and Skallheim
harbor bays and other sea coastlines; caravans travel mainland road approaches.

## Artwork

Generated with the built-in imagegen tool using the imagegen skill. Original
transparent PNGs are saved in the project:

- public/assets/vehicles/coastal-boat.png
- public/assets/vehicles/merchant-cart.png
- public/assets/vehicles/cart-parts.png
- public/assets/vehicles/horse-east-walk.png
- public/assets/vehicles/horse-south-walk.png
- public/assets/vehicles/horse-north-walk.png
- public/assets/vehicles/water-foam.png

VehicleArt.ts records measured source rectangles rather than blindly slicing
equal grid cells. The original integrated merchant-cart sheet is retained as a
reference; the game renders the separate parts and walking horses. Boot prepares
compact atlases, preserving the
illustrated wood, muted cloth and warm outlines of the existing world art.

### Boat generation prompt

Use case: stylized-concept. Asset: transparent game sprite sheet for an illustrated medieval top-down RPG. Make exactly FOUR views of the SAME small wooden coastal sailing boat, in a strict equal 2 by 2 grid: upper left bow pointing down/south toward viewer; upper right bow pointing left/west; lower left bow pointing right/east; lower right bow pointing up/north away from viewer. Fixed elevated three-quarter orthographic game camera, shows deck and sides; do NOT rotate the whole image or camera. Brown oak clinker hull, modest single mast, cream triangular canvas sail, ropes and two small cargo barrels. Painterly pixel-like detailed shading, dark warm outlines, hand-painted highlights, muted natural medieval palette matching rustic illustrated cottages and oak barrels. Each boat fits within its own cell with wide transparent margins, same scale, mast/sail fully contained. No sea, ground, wake, shadows, text, labels, grid lines or scenery. Real transparent background. Deliver a square 1024x1024 sprite sheet.

### Cart generation prompt

Use case: stylized-concept. Asset: transparent game sprite sheet for an illustrated medieval top-down RPG. Exactly FOUR directional views of the SAME small horse-drawn wooden merchant cart, strict equal 2 by 2 grid: upper left horse leading down/south toward viewer; upper right horse leading left/west; lower left horse leading right/east; lower right horse leading up/north away from viewer. Fixed elevated three-quarter orthographic game camera showing cart cargo from above, matching hand-painted medieval RPG buildings and oak barrels with crisp warm dark outlines and detailed muted painterly pixel-like shading. One chestnut draft horse in leather harness pulling a short rustic oak two-wheel cart with cream grain sacks, barrel and rolled green cloth; complete horse, harness and cart in EVERY cell. Same scale and consistent warm light in all views. Objects fully contained in their cells with broad transparent margins. No ground, road, grass, shadows, text, labels, grid lines or scenery. Real transparent background. Square 1024x1024 sprite sheet.

## Verification

travelRoutes.test.ts checks endpoint continuity, turnaround pauses, road
walkability and reproducible sea lanes with hull clearance.
worldAtmosphere.spec.ts starts through the home menu and checks visible shadows,
water animation, cart/boat motion, hoof and wheel frame changes, helmsman/deck
layering, pause behavior and console errors. It also verifies that each horse
direction has four distinct pixel frames and saves front/rear harness views.
Road and harbor screenshots are saved under test-results.

Validation on 2026-10-09: production build and application/test TypeScript
passed. The selected route, content-streaming and world-generator suites passed
15 tests. Chrome desktop (1280x720) and mobile/touch (844x390) regressions passed.
An additional existing terrainArt.test.ts assertion fails because it expects a
body offset of -2 while the unchanged actorArtLayout returns -22. That unrelated
assertion was left unchanged. Screenshots are named road-traffic-1280.png,
harbor-traffic-1280.png, road-traffic-844.png and harbor-traffic-844.png.

The final motion asset prompts and file inventory are in
[TRAFFIC_ANIMATION_ASSETS.md](TRAFFIC_ANIMATION_ASSETS.md).
