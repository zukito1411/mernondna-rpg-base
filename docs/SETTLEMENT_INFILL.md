# Inhabited settlement perimeters — 2026-10-08

The diagonal outer curtains enclosed broad east/west flanks, while the building
fitter only admitted structures inside the old central rectangle. Wilderness
scenery also deliberately avoided settlements. That combination left large,
bare interiors. This continuation gives the flanks deliberate land uses and
connected neighborhoods without rotating walls or moving story locations.

## Layout

Each settlement gains two named working neighborhoods. A main-road extension
connects them to the existing center. A neighborhood spine serves house terraces,
shop/stable forecourts, a gathering green and rear garden/allotment access.
The outer approach leads through planted commons to a wall-side resting outlook.
Highmere has more frontage plots, wider paved connections and guild stores;
villages have fewer/smaller household rows and dirt lanes. Mountain/forge wards
use more stone households; grove and harbor settlements retain their own land-use
themes and the existing region tint/snow/ash terrain.

| Settlement | West neighborhood | East neighborhood |
| --- | --- | --- |
| Oakmere | Orchard Crofts | Wainwright Green |
| Highmere | Weavers Borough | East Guild Commons |
| Willowcross | Drovers Green | Fletchers Reach |
| Elarion | Whitebough Gardens | Livingwood Terrace |
| Moonfall | Moonherb Crofts | Keepers Copse |
| Starhold | Ropemakers Terrace | Winter Provision Ward |
| Red Mesa | Herders Common | Ember Clan Yard |
| Deepford | Stonecutters Close | Boatwright Borough |
| Tidewatch | Netmenders Close | Chandlers Quarter |
| Skallheim | Pine Clan Close | Fishcurers Yard |
| Blackspire | Chainwright Close | Furnace Supply Ward |
| Cibar Plains | Seedkeepers Crofts | Waterturn Common |

The supplied cottage, manor, hall, chapel, workshop, stable and storehouse art
has explicit assignments. Gate/castle frames are not randomly assigned to
households. Wells, stalls, stock, notice boards, benches, fountains and lamps
are fitted near their relevant courts. Rear-garden trees and spaced avenue
planting replace bare approaches. Rural commons contain crop strips with
connected harvest lanes. Existing night lighting automatically owns/registers
the additional lamps, fire sources and building windows.

`settlementWards.ts` declares the neighborhood functions and ordered plot plan;
it does not choose random locations or random building frames. Original civic
centers remain individually authored in `settlements.ts`. Neighborhood geometry
shares a reusable frontage pattern, not twelve completely new unique map scenes.
Highmere reserves 24 additional house/workplace plots; actual admission depends
on the existing routes, artwork and clearances. Its established royal/civic/
military/Lower Ward districts and original building indices are retained.

## People

`wardResidents.ts` adds **48 named residents**, two per neighborhood: a working
household elder and a provisioner/delivery partner. They have occupations,
relationships with the existing cast, trust, Leigneron history, dialogue and
local work/social/home routines. Their complete activity anchors are reserved
against new building/decorative placement, not just their initial standing point.
They use existing NPC artwork, normalization, street routing and chunk streaming.
No anonymous hostile bandits or monsters are added inside settlement protection.
These residents have ambient dialogue, not new quest rewards or animated trade
simulation. Their narrative consequence descriptions are hooks, not implemented
economy/relocation mechanics.

## Placement and preservation

- Original buildings reserve first. New lots append after original indices,
  preserving shrine/building IDs, story sites, quests and save version 4.
- New buildings fit their own small plots and must keep their full silhouettes
  inside the defensive survey with an inset. They cannot occupy streets, NPC
  activity anchors, farmland, existing roofs, river reaches or other buildings.
- Frontages connect admitted buildings to an existing street. A constrained plot
  remains open if it cannot fit; its building is not scattered into another ward,
  and optional infill cannot abort boot merely to meet a building count.
- Trees and furniture use bounded local fitting with the same street/roof/field
  exclusions. Missing space omits an optional ornament rather than clogging roads.
- Farm fence/crop admission now checks full artwork bounds against streets.
  Fence placement also respects the enclosing curtain inset.
- Dirt garden/work lanes and paved main connections have explicit surfaces;
  the regional map distinguishes the street hierarchy.
- Content still uses the existing chunk ledger; the whole population is not
  spawned globally at once. No new image generation/dependency/engine is added.

## Verification and limits

**No tests, type checks, builds, browser/game launches or benchmarks were run.**
Only source and existing artwork were inspected, as requested. Actual admitted
plot counts, visual density, NPC routes, wall/bridge traversal, reload behavior
and device performance remain unverified. Existing medieval illustrations are
reused; this is not a new pack of distinct elven/dwarven/orcan architecture.
Interiors, occupational animations, fully simulated trade and off-screen citizen
schedules remain outside this layout pass.
