# NPC patrol detours & Oakmere position repair

Source patch for Tales of Leighneron. Changes ONLY:
- `src/game/entities/Npc.ts`
- `src/game/scenes/WorldScene.ts`

NPCs remember their intended route waypoint. If a person or scenery object blocks the
next step, they try a short side detour on walkable ground, then return to their original
waypoint. If no safe detour is possible, they stop and retry, rather than discarding the
route or walking through buildings. Static shopkeepers are unaffected by patrol motion.

Alice Fen (NPC id `mira-fen`) and Hawise Marlow (NPC id `sena-marrow`) are positioned
separately, near their respective herb garden and inn. Their saved dialogue, quest and
relationship data are preserved. Saved coordinates for *these two civilians* may be
replaced when their actors load, to correct overlap from previous layouts.

## Install (PowerShell)

Extract the ZIP at the project root `C:\Users\kimwh\mernondna-rpg-base`, then run:

```powershell
node ".\leighneron-npc-navigation\apply.mjs"
```

The installer first checks all expected source anchors, including Windows CRLF line
endings. If a file has changed, it reports preflight errors and does not write gameplay
files. Originals are copied into `.leighneron-npc-navigation-backup/<timestamp>/` before
writing. Run the installer only once.

**Not tested in gameplay.** No manual game build or game tests performed. Apply on top of
all the local progression, encounter and combat changes. Back up the saved game before
patching if you are concerned about old persisted NPC coordinates.
