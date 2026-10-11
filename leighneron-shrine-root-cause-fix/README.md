# Elarion Shrine — Root Cause Fix

The NPC renaming system aliases **Elarion** (the first name of `Elarion King`) to **Llywarch**. Because it rewrites `WORLD_CONTENT` recursively and excludes some, but not all, identifier fields, the value of `townShrineId: "elarion"` is rewritten to `"Llywarch"`. `openShrineTravel("Llywarch")` then refuses to open since this is not a town ID. That is why the shrine is shown as "Llywarch Wayfarer Shrine" and does nothing while other shrines work.

This patch:
- Reserves settlement IDs/names against *first-name* substitution, while keeping full NPC name replacement (including `Elarion King`).
- Protects `townShrineId` and related game IDs from all future name substitutions.
- Touches only `src/data/npcPresentation.ts`; existing shrine interaction patches can stay as they are.
- Does not modify save files, gameplay logic, or UI.

## Install

Extract into the repo root, replacing the similarly named folder if present. Run in PowerShell:

```powershell
cd "C:\Users\kimwh\mernondna-rpg-base"
node ".\leighneron-shrine-root-cause-fix\apply.mjs"
```

Restart Vite and reload (or relaunch the APK after building a new version). The title should again read **Elarion Wayfarer Shrine**, and interacting should open the travel panel. Preflight checks run before writes, and the prior source file is backed up under `.leighneron-shrine-alias-backup`.

**Note:** This patch is source-reviewed and syntax-checked, but not verified in-game. No tests or builds were run.
