# Player housing

## Where and how

One home is offered per settlement, including Cibar Plains. The first is the
vacant **Ranger Lodge**, on Oakmere's eastern side. Approach a for-sale doorway
to learn the local deed holder's name and location. Speak with that NPC, finish
the conversation, then choose **Discuss the deed** and confirm the 7,500G
purchase. Existing local NPCs handle deeds; no story resident is evicted.
All previously purchased houses remain yours, with independent furnishings,
storage, beds and racks. Each owned property receives its own map marker.
After buying, interact again to enter. Ownership is marked on the world atlas,
regional map and outdoor minimap. No new teleport shortcut is added.

The owned interior has connected living, bedroom and kitchen areas with a
protected foyer. Its exterior save position follows the existing interior
system: Continue returns outside, retaining ownership and furnishings.
The original Oakmere save fields remain intact; additional homes are stored
in an optional bounded ledger keyed by existing exterior building IDs. Spare
weapon-copy limits include displays across every house, not just the active one.

## Furnishing

- Expand the top-right HUD menu to find the compact **Furnish** button.
  Interact with the south doorway to leave. There is no separate bottom action
  bar, remote exit button or remote sleep button.
- **Furnish home** replaces the combat HUD with an editor. Select a collection
  and furniture, tap/click a grid square, rotate with the button or R, then Place.
- Select a placed piece to move, rotate, assign a spare weapon or store it.
  Moving or placing stored furniture is free. New pieces cost 50–200G.
- Finish editing validates the layout and charges only new pieces, together
  with reserving/returning displayed weapon copies in one store transaction.
  Cancel asks before discarding a changed draft; committed gold/layout survive.
- The grid snaps to 32 world units. Zoom increases to 4x for touch accuracy;
  the plan can be scrolled, and Fit room restores the complete overview.
- All 19 existing furniture/decor roles across nine regional kits are available.
  Doors and structural walls remain fixed; arches/steps are decoration, not
  new rooms or stair-based travel. Quarter-turn rotation transforms the existing
  sprite, not a newly drawn perspective for every orientation.
- The additional empty weapon rack uses a dedicated raster asset, not pantry
  artwork. Each rack holds one spare boss-weapon copy from the existing forge
  materials ledger, never the equipped/only owned weapon. Clearing/storing a
  rack returns the copy. Displayed copies count toward the 99-copy loot limit.
- Walk beside an installed bed and interact, or click/tap the bed, for free
  sleep until 06:00 and full health/stamina restoration. Like inns, home beds
  allow sleep only from 18:00 until 06:00; daytime attempts do not heal or
  advance the clock. A clear approach is
  required, just like an inn bed; furniture and walls cannot be bypassed.
  Home and inn rests both restore the player's full current equipment-derived
  maximum health and stamina, after synchronizing pending inventory vitals.
  Home actions include furnishing, sleeping and leaving through the existing
  room lifecycle. Editing pauses gameplay; ordinary movement resumes afterward.

## Safety and performance

The authored floor union and protected hallways are shared by
validation and rendering. Layout edits check complete visible furniture bounds,
solid-footprint overlap, routes into all rooms, and bed/rack accessibility.
Furniture may sit flush against side walls; no empty border grid column is
required. Placing near any wall/corner precisely snaps the complete artwork
and its collision base inside the floor outline together. Tall artwork never
projects into the black surround. Ordinary placement remains grid-snapped;
wall contact can use fractional coordinates to avoid a grid-sized gap. Lower
corners are available; only the actual doorway approach and connecting hall
are reserved. Wall-adjacent shelves render in front of the wall.
Walls still block movement. Player homes omit the vertical side decoration while
retaining horizontal timber and their existing collision boundary.
Old wall-overlap layouts are fitted inward on save restoration. Pieces that
cannot fit safely remain owned in storage, with displayed weapon copies
returned to the spare-copy ledger. House ownership and other progress remain.
Limits: 60 placed pieces and 100 total owned pieces. The player is placed in
the protected foyer after a committed layout, never inside a new obstruction.
Indoor movement and skill paths collide with static geometry only: Alice,
residents and enemies cannot block the player's passage. Enemy-to-enemy
steering/separation remains active, and attacks still deal damage normally.

`housing` is an additive, validated save-v7 field. Missing fields migrate to an
unowned empty home; malformed layouts do not silently overwrite recoverable
saves. UI context, draft layouts and pending home requests are not serialized.

Existing `InteriorSession`, swept-feet collision, room depth, walls, regional
floors and cleanup are reused. The offline packer extracts approved art into
three 1920x1152 atlases (192-pixel cells with clear gutters). No source-kit
pixel scans occur during editing or per frame. Home atlases load only for home
entry/editor use and are removed from Phaser on room exit. Editor painting
occurs on state changes, not an independent animation loop.

## Artwork source

Generated with the built-in image-generation tool, using
`public/assets/interiors/trandum_rustic/kit.png` as the style reference.
Master: `docs/art/housing-weapon-rack-v1.png`. Runtime extraction:
`scripts/pack-housing-furniture.mjs`, `src/data/housingArt.json` and
`public/assets/interiors/housing-furniture-{0,1,2}-v1.png`.

Prompt: one empty freestanding medieval dark-oak weapon display rack matching
the reference's detailed outlined pixel-RPG shading and elevated straight-on
camera. Two thick posts, iron brackets, stable feet, top crossbeam with three
empty sword hooks and a lower notched rail. Transparent open middle for actual
sword overlays. Slightly wider than tall, generous transparent margins. No
baked weapons, food, bottles, books, floor slab, cast shadow, text or glow.
The shared rack is listed in each collection; it is not nine new regional designs.

## Verification

Focused checks: TypeScript application/test configuration and Vite/Capacitor
configuration; `tests/housing.test.ts` and existing save-recovery checks.
The Playwright housing spec runs the actual game with the platform GPU and
checks purchase, charges, entry, bed/table/rack placement, rotation, completion,
sleep, draft cancellation, saved data and the owned-home map marker. Mobile
uses touch, Android user-agent and 2x density, with portrait/landscape captures.
Only setup gold/spare weapon and approach position are seeded for the test.

Screenshots are local artifacts under `test-results/housing/` (gitignored).
Review gallery: `test-results/housing/index.html`. Latest desktop and
Android-style touch flows passed; 11 focused housing/save-recovery checks and
both compiler configurations passed. Run the focused browser spec with
`npm exec --no -- playwright test tests/browser/housing.spec.ts --output=test-results/housing-run`
to keep unrelated root-level review artifacts from being cleared by Playwright.
Browser emulation is not real Android device testing. No APK/production build,
commit, push or release is authorized by this implementation request.
