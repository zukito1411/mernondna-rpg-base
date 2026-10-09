# Settlement scale and environmental detail

Source implementation, 2026-10-09. The supplied reference guides the world
presentation only; its GUI has not been copied or changed.

## Implemented

- Buildings request a 12% presentation increase, including the capital's
  existing architecture. The layout fitter uses enlarged visible roof bounds
  and retains roads, water, lots and named resident reservations. Constrained
  buildings can fall back to 8%, 4% or their previous size. If a core settlement
  cannot fit, its original architectural scale is retried rather than deleting
  important lots. Shrines receive the same 12% scale increase and retain IDs.
- Existing district furniture reserves space before new core dressing.
  Commercial entrances get proposed awnings, barrels and seating; workshops
  get supplies; military posts get banners; quiet civic buildings get benches.
  Public courts get planting pockets and, where appropriate, fountains and
  noticeboards. These are nearby planned compositions, not arbitrary world
  scatter. The fitter omits optional pieces that cannot clear streets, roofs,
  water, trees and resident anchors. New court dressing also yields to existing
  story/stock/civic objects before the loose-object relocation pass.
- Low flowers, ferns, mushrooms, dry plants and stones are baked into streamed
  ground textures from existing measured atlas frames. Warm, dry, winter and
  volcanic areas retain their respective palettes. Settlement margins receive
  denser clusters; working courts, road centers, water and cultivated rows stay
  clear. Roof bounds are excluded, including enlarged shrines. These small
  ground details add no physics bodies or per-frame actor updates.
- Stone paving uses a 320px repeat instead of 256px, producing 25% larger
  cobbles. All terrain patterns use world-coordinate phase alignment, so a
  pattern need not divide the chunk size. Cover is seeded by world cells and
  draws through neighboring chunk gutters to avoid clipping edge clusters.

## Relevant source

- `src/data/environmentPresentation.ts`: shared scale and detail limits.
- `src/data/settlements.ts`: lot sizing, clearance and decoration admission.
- `src/data/settlementDressing.ts`: workplace and public-court compositions.
- `src/data/content.ts`: existing-object priority and furniture reservations.
- `src/game/systems/GroundCoverBaker.ts`: atlas-based ground clusters.
- `src/game/systems/TerrainBaker.ts`: larger paving and chunk integration.

Existing source PNGs, characters, quests, UI, camera zoom, save version and
continuous traversal are not replaced. Larger structures use the existing
shared world-sprite contour and depth system, not a second collision model.
This pass does not fix mobile render density or rebuild the packaged APK.

## Verification limits

Source inspection only, following the user's no-testing instruction. No tests,
type checks, builds, game/browser launches, simulations or device checks were
run. Actual fit fallbacks, admitted decoration counts, visual density, street
traversal and mobile chunk-baking performance remain unverified. This is an
environment presentation pass, not a claim that the whole world matches the
reference or that all living-world systems are complete.
