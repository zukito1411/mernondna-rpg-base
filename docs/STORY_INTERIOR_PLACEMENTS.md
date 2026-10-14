# Story interior preparation

This continues interiors in preparation for `Solid_Story_Line.md`; it does not
claim to implement that document's entire campaign overhaul.

## Story/workplace assignments

| Settlement | Interior residents and locations |
| --- | --- |
| Oakmere | Sena: Marrow Inn; Joren: Pike Smithy; Torren: West Cottages |
| Highmere | Renna: Royal Archive; Adria: Crown Hall; Barric: West Barracks; Maela: Market Hall; Osric: Guild Forge; Tamsin: Westgate Inn; Davin: River Customs; Sevrin: Counting House; Mairin: Morrow Kitchen; Nella Harrow: Weavers Row; Iven: Relief Warehouse |
| Willowcross | Bela: Caravan Inn |
| Elarion | King and two existing hall guards: Whitebough Hall; lorekeeper: Lore Archive; bowyer: Bowyer Hall |
| Moonfall | herbalist: Herbalist Cottage; Dael: Grove House |
| Starhold | quartermaster: Quartermaster Stores |
| Red Mesa | forgewright: Clan Forge |
| Deepford | runesmith: Hall Archive; boatwright: Boatwright Hall |
| Tidewatch | harbor master: Harbor Guild; sailmaker: Sailmaker House |
| Skallheim | trader: Fish Traders Hall |
| Blackspire | forgemaster: Forge Hall |

IDs are authoritative in `src/data/interiors.ts`. Display names may have been
localized by the existing NPC presentation layer. Bindings are only created for
existing NPCs and non-omitted exterior buildings. Each NPC has exactly one
interior assignment; other rooms do not borrow random residents.

`src/data/castleResidents.ts` adds two dedicated named household sentries to each
of Crown Hall, Citadel Hall, Clan Assembly Hall, Great River Hall, Clan Longhouse
and Obsidian Citadel. They have family/faction ties, watch partners, contacts,
trust, schedules, equipment, local dialogue and emergency consequences. Their
authored identities do not consume the legacy display-name palette. All use
approved existing models or the same regional variants as their portraits.

Aldren and Mira remain outdoors for the opening adventure. Yselle, Caldus and
marching guards retain accessible outdoor training/patrol roles. Tovin stays on
his existing hiding/escort route. Beastmasters, hunters, sentries, road warders
and other field workers remain outdoors rather than being put in arbitrary halls.

## Implemented integration

- Homes, kitchens, inns, archives, counting/customs rooms, workshops and stores
  now have purpose-specific furniture arrangements across connected sections.
  Inns/villas have four rooms; castle complexes have eight sections with wide
  galleries and side passages. Ordinary buildings have three connected sections.
  Royal audiences are staged
  in front of their hall's throne rather than at a generic side work station.
- Eligible existing buildings are no longer limited to the first three/five
  buildings in a settlement. Military towers, gates, stables and attunement
  shrines remain exterior features.
- Chunk admission suppresses exterior actors for assigned indoor NPCs. Their
  logical records, trust, dialogue, quests, names and save IDs remain intact.
  Opening the assigned room creates the presentation actor, not a second logical
  character. Closing it disposes that actor without saving room coordinates.
- Outside guidance/map markers identify the correct building entrance. Inside,
  the current objective points at the actual resident; objectives elsewhere
  point to the exit. Dependency-quest givers use the same residency map.
- Resident interaction requires a nearby clear service approach, preventing
  talking through furniture or across the room. Dash/black-void confinement and
  safe exterior saving continue to use the existing controller.
- Camera/texture cleanup also runs if opening a partially created room fails.
- Successful entry records `visited:interior:<existing building ID>` in the
  existing story flags and can credit an active visit objective explicitly
  targeting that building ID. No unrelated settlement visits are credited.

## Remaining story work

No new quest stages, rewards, clues or campaign cinematics were authored in this
pass. Household sentry profiles/dialogue were added, and existing cinematic shots
now show the focused NPC's portrait through the shared world-model resolver.
Future interior cutscenes should stage their camera
and participants using the loaded room actors; outdoor cinematic lookups resolve
indoor speakers to their building approach. Multi-floor stairs, room-specific
quest clue relocation, daily indoor/outdoor schedules and interior minimap
floor rendering remain separate work.

Source inspection only for this continuation: no tests, type checks, builds,
APK creation, browser/game launches, commits or publishing were run.

## Campaign continuation — October 14, 2026

The story overhaul is now integrated in `src/data/campaign.ts`; see
`CAMPAIGN_OVERHAUL.md` for its chapters, progression, save migration and
verification boundary. Interior assignments also accept localized building
names, so Marrow/Marlow Inn and Pike/Fletcher Smithy cannot lose their residents
because the presentation layer renamed a sign. Indoor cutscenes use loaded room
actors, and hallway guidance/minimap floor positions use the local player while
saves continue to record the safe exterior position.
