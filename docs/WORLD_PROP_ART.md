# Props matched to the existing world

This pass changes overworld props and scenery selection. The tile image,
terrain generation, terrain baking, material patterns, ground relief, baked
ground cover, region ground/fog colors and existing buildings are preserved.
The supplied atlas entries and global rendering settings retain their values.

## Reference analysis

The supplied `others.png`, `world_assets.png`, `fauna_1.png`, `desert_1.png`
and `lava_snow.png` use crisp pixel clusters, stepped dark contours, golden
wood/brass highlights, warm grey stone and olive foliage. They share top-left
lighting and an elevated front view. `docs/images/highmere-shrine-clear.png`
provided the existing grass/paving and character-scale context. New props were
generated using the original sprites as image references, with this pixel
treatment and palette in the prompts.

Existing buildings, shrines, mature trees, snow art, volcanic landmarks,
desert architecture and common furniture already follow that direction. They
remain the primary environment art. The new sheets fill missing object roles
and inappropriate habitat assignments.

## Added sources

All final images are in `public/assets/sprites/native-world-props/`:

| File | Objects |
| --- | --- |
| `story.png` | Dispatch stand, porter satchel, account ledger, icebound lantern, grain cart, practice dummy, bronze pump, clasp, ribbon letter, household seal, royal cargo, moon standing stone |
| `habitats.png` | Complete charred tree, burnt log, burnt stump, coastal saltgrass, dry scrub, snowless lichen rocks |
| `forge-record.png` | Scorched account book on dark timber, suited to Darkav without a green planted base |
| `keepsakes.png` | Wire snares, broken sailor locket, royal waystone, rooted mine seal |
| `civic-bare.png` | The fourteen common furniture roles with complete feet/foundations and no painted grass, dirt, or snow underneath |
| `story-bare.png` | The twelve story roles with terrain-neutral bases, including full cart shafts and dummy arms |
| `quest-landmarks.png` | Shared well, broken unlit pass beacon, empty shelter with cold fire, ribboned pilgrim stone, barred chainworks door, split seed sacks |

The original 23 objects and 32 added variants/location props use measured complete source regions in
`src/data/nativePropArt.ts`. The cart's shafts, dummy's arms and both snares are
included, even where illustrations extend past nominal sheet columns. Source
rectangles have transparent separation from neighboring subjects and fit into
the existing padded atlas cells. Original source sheets remain intact.

Exact generation/refinement prompts, reference paths, output provenance and
the protected terrain checksums are in
[the prompt manifest](art/native-world-props-prompts.json). Generation used
the built-in image tool; original generated outputs were preserved.

## Assignments and placement

`nativePropReplacements.ts` maps stable content IDs to appropriate artwork:
letters use documents, satchels use bags, household evidence uses keepsakes,
the practice target uses a dummy, and the memorial well uses a lever pump.
Rooted discoveries, the royal waystone, poacher snares and sailor locket get
their matching object silhouettes. The forge record uses its charcoal variant.

Substitutions run before final board fitting. Quest hooks, discovery keys and
text remain. Actual role sizes replace the old placeholder-size cap, which
could shrink a complete cart to crate size. New full silhouettes are fitted
against final roofs, actors, boss clearings, roads, streets and water. Static
objects in existing saves already refresh from their authored positions while
retaining progress (`ContentChunkManager`). No terrain is created to fit a prop.

Ordinary civic furniture on incompatible ground uses a complete bare-base
variant inside its existing reserved width/height. New lamp variants register
their own light centers. Authored habitat decorations also check their ground;
they move locally, or optional decoration is omitted if it cannot fit. Quest
objects are retained; any unresolved quest fit is exposed through
`AUTHORED_PROP_PLACEMENT_ISSUES` for development inspection. No quest is silently
removed to obtain a clean scene.

Scenery fitting samples the illustrated lower skirt at intervals of at most
32 world units, rather than checking only one contact point. Snow-covered
objects require snow, coastal banks receive saltgrass, freshwater reeds stay
away from the sea, and burnt deadwood is assigned to Darkav. Nardorous uses
the existing snowless pine away from snowy ground and new lichen rocks in its
bare mountain areas. Existing reservation checks keep full prop bounds away
from roads, roofs, actors and water. Saltgrass requires actual coast/shore
proximity, not merely membership of Portquill. Freshwater reeds require nearby
water. Grass-covered scenery stays off paved stone, ash, sand and snow.
Warm/cold landmark dressing is selected
from the actual existing ground. No settlement lot, road or region boundary
is moved. The old grass-based campfire additions beneath Darkav deadwood were
removed.

## Quest and size audit

Assignments were read through the final application order in `quests.ts`:
base quests, `mainStory`, `campaign`, `storyRevision`, then `adventure`. This
matters because the Cibar pump fittings become murder evidence, and Highmere's
grain documents become testimony and household records. The earlier text alone
would select the wrong props. `questScenes`, wilderness descriptions, the
flagship, town shrines and dragon-lair definitions were also inspected.

| Quest line / location | Overworld presentation |
| --- | --- |
| `first-road` | Complete broken grain cart, messenger letter, dispatch stand, royal cargo; ruined watchtower retained |
| `crown-summons` | Crown-and-road waystone; existing court, archive and NPC locations retained |
| `shadows-highmere` | Transfer warrant and hidden account; watch-signal board remains a real board |
| `kingdom-divided` | Household/adoption ledger instead of a generic noticeboard |
| `royal-guard-trial` | Complete human-sized practice dummy; NPC/interior encounters retained |
| `water-stops` | Bronze memorial pump, broken clasp, ribbon promise, household seal rather than crates of fittings |
| `eight-regions`: Narenthil | Rooted broken iron seals and ribboned moon pilgrim stone |
| `eight-regions`: Nardorous | Broken cold beacon, porter satchel; a separate signal appears through the existing completion flag |
| `eight-regions`: Rindass | Actual open well with ward socket; torn shelter and cold fire rather than a live campfire |
| `eight-regions`: Druganwoods | Rootwater seal and relief account; split seed sacks and a complete road cart |
| `eight-regions`: Portquill | Coastal beacon, actual cargo chest, small paper manifest confined to the existing deck |
| `eight-regions`: Frostlands | Stripped beacon, small recovered lantern and completion-gated signal |
| `eight-regions`: Darkav | Charred complete trees/logs, barred chainworks door, scorched ledger, volcanic ward art |
| `returning-ember`, `the-last-ward` | Existing Cinderwatch rune altar, lava-ringed arena and dragon art retained |
| `hunters-promise` | Wire snares in brush |
| `home-for-two` | Small sealed family deed |
| `soldier-return` | Small ribboned winter letter with no green ground patch |
| `tidewatch-debt` | Small broken locket on cloth |

The berry harvest, which previously displayed a scaled tree, now uses the
existing berry shrub. Sizes use the existing 76-unit hero as context: locket
16, clasp 18, letters/seals 22–26, satchel 36, lantern 32, cargo chests 46–50,
pump 65, shared well 72, dummy 82, cart 100, shelter 125 and chainworks doorway
160 world units high. Complete sprite aspect ratios are preserved. Collision
profiles use feet/foundations, excluding tall handles, arms and crowns.

## Verification boundary

Source appearance, transparent alpha and complete object bounds were inspected.
The 32 new source rectangles remain inside their source images. Two pairs of
padded crop rectangles share small corners; both shared areas are entirely
transparent, so neither crop includes neighboring artwork. Atlas cells retain
the loader's existing padding and registration.
Application TypeScript checking is the only executable code check for this
pass. Protected tile/terrain files are compared with their initial SHA-256
checksums. No unit tests, gameplay/browser checks or production/APK builds are
run, following the user's manual-testing preference.

Source inspection does not validate GPU sampling, camera zoom, live placement
or collision-foot alignment. In-game visual acceptance remains for manual
review; this pass does not claim that every rendered frame has been verified.
