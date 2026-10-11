# Tales of Leighneron — Progression and Enemy Scaling Update (Installer Revision 4)

This source patch is designed for the current `mernondna-rpg-base` structure, including the locally installed parchment/map UI updates. It changes **gameplay balance**, not the map or scroll artwork.

## Apply

Extract the ZIP into the **project root**, `C:\Users\kimwh\mernondna-rpg-base`. From PowerShell in the project root:

```powershell
node ".\leighneron-progression-update\apply.mjs"
```

Revision 4 locates the casting guard and cooldown assignment in `PlayerSkillSystem.ts` by code structure rather than matching exact multi-line text. The installer checks all source changes *before* writing gameplay files, then creates `.leighneron-progression-backup/<timestamp>/` copies of original files. If there are multiple mismatches, it gathers them in one pass and writes `leighneron-progression-preflight.txt` in the project root; no gameplay files are modified in that case. It does not run tests, builds, commit, or push.


### Important compatibility fix in revision 4

The previous preflight marked five valid multiline source anchors as missing on
Windows because local files can use `CRLF` (`\r\n`) instead of the bundle's
`LF` (`\n`) line endings. Revision 4 compares normalized line endings and
restores each source file's original line endings when writing, without
relaxing the requirement that each anchor match exactly once.

This revision also corrects the initial HP assigned to uninjured tier-scaled
enemies when their world-content records still contain original base HP.
It retains all-or-nothing staged edits and the mismatch report.

## Leveling and unlocks

* XP requirement is 250 for level 1→2; then +25 each next level (275, 300, 325...). The HUD shows XP within the current level and its correct requirement.
* Old version-4 saves are migrated to version 5, preserving each character's previous level and fraction of their XP bar, earned attribute points, skill points, completed quests, and items.
* Combat arts automatically unlock by level: Azure Cleave and Crown Rally at Lv5; Skyfall Slam at Lv10; Crescent Flurry at Lv15. Locked arts are dimmed in PC/mobile controls and blocked server-side by the ability system.
* Expanded passive skill tree: Might / Survival / Mobility, 12 nodes with level requirements, prerequisites and skill-point costs. Status attributes stay unchanged.
* Damage increases modestly with player level (capped at +35% level-based, on top of existing attribute and skill bonuses). Battle Focus adds 5% art damage, not general weapon damage.

## Enemies and bosses

The world has 12 named settlements, not 12 distinct regions (there are 8 regions). The update provides **settlement-area tiers** in pairs along the authored travel route, with regional defaults in remote wilderness:

| Settlement area | Normal mob level |
|---|---:|
| Oakmere / Highmere | 5 |
| Willowcross / Elarion | 10 |
| Moonfall / Starhold | 15 |
| Red Mesa / Deepford | 20 |
| Tidewatch / Skallheim | 25 |
| Blackspire / Cibar Plains | 30 |

Enemy HP/damage/XP scale by tier. Boss levels are their local normal enemy tier **+10**, with extra boss XP. Enemy nameplates display level. A floating `+N XP` text rises and fades when an enemy is defeated.

All bosses return after 20 real-world minutes, including after leaving the game. Historical first defeats still count for quest progression; boss repeat kills grant combat XP/gold without replaying completed quests. Existing `defeatedBosses` history and content states are migrated into timers.

## Notes

* **No tests or builds have been run.** Check the updated TypeScript in your local dev environment before installing a new APK.
* This changes the save format from v4 to v5 while keeping the same storage key. Backup your current save data first if possible; don't downgrade your game to an older version after it saves in the new format.
* If the installer reports multiple source mismatches, **no gameplay files have been changed**. Send the generated `leighneron-progression-preflight.txt` report and the corresponding local source files so the patch can be adapted safely. Do not repeatedly use an older installer.
* The icon references use your existing custom PNGs under `public/icons`.
