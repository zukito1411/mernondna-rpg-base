# Tales of Leighneron — Night & Wilderness Encounters

The patch changes only `src/game/scenes/WorldScene.ts`. No art, saves, physics, map files, or previously installed wolf AI are overwritten.

## Installation

1. Extract this folder into your `mernondna-rpg-base` project root.
2. Run `node ".\leighneron-night-wilderness-encounters\apply.mjs"` from the project root.
3. The installer checks source anchors and creates `.leighneron-night-wilderness-backup/<timestamp>/src/game/scenes/WorldScene.ts` before changing the source.
4. If local code differs, no game files are changed; send `leighneron-night-wilderness-preflight.txt` back for adjustment.

## Encounter design

| Location | Day interval | Night interval | Day max | Night max |
| --- | --- | --- | --- | --- |
| Forest, wetlands, mountain, snowfield, volcanic | 8.5 seconds | 5.9 seconds | 9 | 12 |
| Meadows, roads, plains, other open land | 11 seconds | 7.6 seconds | 7 | 10 |

- Each tick is only a **chance** to spawn, not a guaranteed monster. Wilderness has 62% day / 86% night; open land 42% day / 66% night.
- Night is 18:00–06:00 **game time**.
- Forest wolves and swamp wraiths are weighted toward their natural habitat.
- New encounters will not start within 250 world units of an ongoing nearby fight.
- Settlements and restricted/blocked terrain are protected by existing `isEnemyTerritory`/`canEnemyOccupy` checks.
- If wolf-pack spawning is installed, one wolf encounter is still a 4–6-wolf pack, not isolated wolves. Alpha and flank AI are preserved.
- Roadside bandits retain their own event limits/cooldowns. The installer preserves their hook if present.
- Spawn cap includes active enemies, including wolves and bosses; actual number spawned depends on map and capacity.

## Notes

This patch does **not** force new monster types into regions where `regionWeights` excludes them. It increases encounters using the region's existing enemies. No game build or gameplay test has been run.
