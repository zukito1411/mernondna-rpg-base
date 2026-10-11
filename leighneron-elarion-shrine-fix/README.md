# Elarion Wayfarer Shrine — Interaction Fix

Repairs the Elarion elven shrine's special interaction positioning and action order.

## Behavior

- Treats the space directly **in front of the illustrated shrine door** as a valid interaction area (116 world units from its forecourt point).
- Uses the **same target resolver** for the visible interaction hint and the E/touch/click action.
- Prioritizes that shrine when the player stands in its forecourt, avoiding a nearby NPC or object's intercept.
- Opens the travel menu **before** updating optional saved world-state/tint data; if persistence fails, logs an error rather than silently suppressing the menu.
- Preserves existing shrine attunement, quests, save format, combat, and other NPC/encounter changes.

## Install

Extract this zip to the root of `C:\Users\kimwh\mernondna-rpg-base` and run in PowerShell:

```powershell
cd "C:\Users\kimwh\mernondna-rpg-base"
node ".\leighneron-elarion-shrine-fix\apply.mjs"
```

Installer checks five source locations before changing anything; if incompatible, writes `leighneron-elarion-shrine-preflight.txt` and leaves game files untouched. It backs up `WorldScene.ts` before writing.

After applying, start the game in your usual way, stand in front of the shrine and press E or click the prompt. If it still does nothing, inspect the browser console for an exception and provide the exact error. No build or gameplay tests were run to validate the patch.
