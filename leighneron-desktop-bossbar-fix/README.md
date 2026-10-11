# Tales of Leighneron — Desktop boss HP top-center fix

This is a small CSS-only patch grounded in the GitHub `main` versions of:

- `src/styles.css`: `.boss-encounter-card` currently uses `bottom: max(22px, env(safe-area-inset-bottom))`.
- `src/styles.css`: `.desktop-skillbar` is bottom-centered on pointer-fine desktop devices.
- `src/components/HUD.tsx`: boss bar and skill bar are already separate components.

The installer adds a **desktop-only CSS override** to move the existing boss HP bar to the top-center and above the ground UI. Mobile/touch styles are not changed. No JS/TS gameplay code is modified.

## Install

Extract the ZIP into the project root: `C:\Users\kimwh\mernondna-rpg-base`.

In PowerShell from that directory:

```powershell
node ".\leighneron-desktop-bossbar-fix\apply.mjs"
```

The installer checks the key boss/skill HUD CSS anchors before writing. If the source differs, it stops without editing your stylesheet. It backs up the original `src/styles.css` under `.leighneron-boss-hud-backup/<timestamp>/src/styles.css`, preserves Windows CRLF, and is safe to rerun.

This patch does not run builds, gameplay tests, make commits, or push to GitHub.
