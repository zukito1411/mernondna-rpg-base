# Shrine interaction input fix

This patch makes the on-screen E interaction prompt a clickable button and adds a guarded keyboard fallback to the existing Phaser E input. If a combat art is blocking interaction, the player now sees an explanation.

This is designed for the local Tales of Leighneron React/Phaser repository. It updates only:

- `src/components/GameCanvas.tsx`
- `src/components/HUD.tsx`
- `src/game/entities/Player.ts`
- `src/styles.css`

From the repo root, run `node .\leighneron-shrine-interaction-fix\apply.mjs`. The installer first checks all source anchors and stops before writing if a mismatch occurs. It backs up edited source files to `.leighneron-shrine-interaction-backup/`.

To isolate the underlying problem: try pressing `E` at the shrine, then clicking the interaction prompt. If both fail after installing the patch, examine the browser developer console for an error and provide the current local `WorldScene.ts` and `Player.ts`, as local files may differ from GitHub main. The fix doesn't change shrine unlock requirements or saves.

No gameplay tests or builds have been run.
