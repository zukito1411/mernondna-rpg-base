# Mernodna interior asset library

Generated 2026-10-13 with the built-in imagegen tool. **Asset preparation only; not loaded or implemented in the game yet.** No runtime source, save, NPC, gameplay or scene changes were made in this pass.

Nine transparent source kits provide 24 illustrated slots apiece (216 source slots total). Existing exterior artwork provided the painted, outlined elevated-camera style; regional materials, textile motifs and signature furnishings distinguish these interiors. Existing NPC art will be reused during integration rather than creating unnamed replacement characters.

| Kit | Intended identity | Signature |
| --- | --- | --- |
| [Trandum rustic homes and inns](trandum_rustic/kit.png) | oakmere, willowcross, cibar-plains | provisions cabinet |
| [Highmere noble/castle](highmere_noble/kit.png) | highmere | blue-and-gold royal throne |
| [Narenthil majestic elven](narenthil_elven/kit.png) | elarion, moonfall | moonwell basin |
| [Nardorous alpine citadel](nardorous_alpine/kit.png) | starhold | mountain oath pedestal |
| [Rindass orcan clan halls](rindass_orcan/kit.png) | redmesa | orc chieftain seat |
| [Druganwoods dwarven river halls](druganwoods_dwarven/kit.png) | deepford | rune forge |
| [Portquill maritime taverns](portquill_maritime/kit.png) | tidewatch | fishing-net rack |
| [Frostlands warm longhouses](frostlands_longhouse/kit.png) | skallheim | longhouse high seat |
| [Darkav obsidian citadel](darkav_obsidian/kit.png) | blackspire | obsidian brazier |

## Common inventory

Row 0: primary floor, secondary floor, north wall, side wall, open doorway, window.

Row 1: bed, wardrobe, bookcase, chest, dining table, bench.

Row 2: chair, counter, hearth, rug, planter, barrel.

Row 3: pantry/display shelf, lantern, stairs, open partition arch, occupational workstation, regional signature.

Each sheet is 1536 x 1024 with an approximate six-column/four-row organization. **Do not blindly spritesheet-slice at 256 x 256:** generated illustrations can approach or cross nominal grid divisions. Measure complete visible subject regions before preparing bounded GPU frames; retain alpha gutters and do not clip furniture or neighbouring sprites. `catalog.json` records intended slot roles, not verified source crop rectangles or authoritative collision geometry.

## Next-session integration requirements

- Build authored, walkable floor plans first; furniture and NPC work stations follow those plans. These are modular components, not baked room screenshots or arbitrary clutter.
- Render only the bounded room footprint over solid black. Black outside a floor plan must never be walkable: collision must constrain the player's full foot/body footprint and swept dash motion, not just hide the outside artwork.
- Use actual outdoor building door approaches to enter/exit. Keep the continuous open world and remember a safe outdoor return point; do not create menu-selected regional stages.
- Keep doors, corridors, stairs and counter service sides clear for PC and mobile. Determine footprints separately from tall wall/wardrobe/bookcase art; depth-sort at furniture feet.
- Floors need an interior texture crop excluding the source square's outline. Tiling/edge matching has not been verified; inspect repeating seams before reuse. Decorations and tableware must not be baked into the traversable floor.
- North wall and side-wall source pieces have different appearances. Never rotate a frontal wall sideways. Survey matching end caps/joins before constructing connected walls. These illustration boards are not a completed autotile set.
- Use noble materials selectively in Highmere royal/noble rooms; ordinary homes and poorer districts still use modest kits. Elarion's ivory/teal/gold palette supports majestic halls without copying Highmere's royal fleur motif. Dwarven/orcan/maritime/frost/volcanic interiors retain their own silhouettes and motifs.
- Keep global names, NPC identity, trust, dialogue and quest connections. Place existing named residents according to home/work roles; no simultaneous indoor/outdoor duplicates. Important new residents require full biographies when authored, not disposable filler.
- Scale furniture to the existing Leigneron/NPC body scale from visible dimensions: beds, counters and doors must not be child-sized or oversized just because their PNG cells differ. Source cell size is not a world-size specification.
- Source fire/window/lantern highlights are painted into these static illustrations; no animated lighting states, emission masks or NPC routines are implemented. Inspect emission areas when connecting interior lighting.
- Load only the active interior's prepared assets and release unused source textures. Do not preload all nine boards at boot. Each full source sheet is approximately 6 MiB decoded RGBA before extraction/driver overhead; this is arithmetic, not a performance measurement.
- Decide interior save/resume and safe return behavior before changing persistence. Do not save local room coordinates as outdoor world coordinates. Keep meaningful story/NPC/item state; geometry and Phaser objects are not save data.

## Review and provenance

All nine source sheets were viewed for palette, content, overall perspective and visible completeness. This is **not** rendered atlas, seam, collision, lighting or gameplay verification. No tests, typecheck, build or game/browser launch was performed. Entry/exit, black-void confinement, NPC occupancy, room layout, UI, saving and performance are deliberately left for the user's next implementation session.

Exact prompt set: `docs/art/interior-generation-prompts.json`. Region assignments and slot inventory: `catalog.json`. Original built-in outputs remain in Codex's generated-images directory; selected project files are saved here and do not depend on those originals.

