# Leighneron — Visible Moving Cloud Shadows (V2)

A focused visibility correction for the previously installed `leighneron-cloud-shadows` optimization update.

## Why clouds were invisible

The prior system had multiple opacity multipliers: cloud template alpha, `daylight`, a weather multiplier, and a softened blur. At sunrise and early morning they produced nearly transparent shadow patterns. The cells were widely spaced, so some camera views had no visible shadow cores.

## Changes

- More visible dark cloud cores with feathered edges and a subtle olive-neutral tint.
- Cloud strength uses a gentle day-lighting curve, not an extra linear alpha reduction in the morning.
- More continuous natural cloud coverage: grid intervals 760×540 world units instead of 1050×760.
- Draw order `-945`: above terrain/floor groundwork, but beneath the ordinary object/NPC shadow layers.
- Keeps cached soft cloud templates, world-anchored wind drift, reduced-motion support, 66% normal/42% low overlay resolution, and refresh intervals of ~850 ms desktop / ~1400 ms low-quality.
- Nighttime shadows still disappear.

## Install

1. Install the **original `leighneron-cloud-shadows` patch** first, if not already installed.
2. Extract this ZIP into `C:\Users\kimwh\mernondna-rpg-base` (next to `package.json`).
3. From PowerShell in the project root run:

```powershell
node ".\leighneron-cloud-shadow-visibility\apply.mjs"
```

Restart your Vite dev server and refresh the game. The strongest shadows appear in daylight, especially mid-morning to afternoon. In-game night will hide them.

The installer modifies only `src/game/systems/GroundShadowSystem.ts` and `src/game/systems/CloudShadowArt.ts`, checks all source anchors before writing anything, preserves CRLF and BOM, and backs up originals under `.leighneron-cloud-shadow-visibility-backup/<timestamp>`.

If it reports a mismatch, it leaves the game untouched and writes `leighneron-cloud-shadow-visibility-preflight.txt` in the project root. Send that report instead of repeatedly retrying installers.

This patch has not been gameplay-tested. No builds, automated tests, commits or pushes are made by the installer.
