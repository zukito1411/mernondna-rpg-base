# Leighneron — Moving Cloud Shadow Optimization

Your game already has a cloud-shadow layer. This patch makes it easier to see in daytime and less costly on the GPU/CPU while preserving the other shadow, lighting and weather systems.

## What changes

- Soft cloud shadows glide across the ground, following prevailing weather wind strength.
- Each cloud-shadow canvas is redrawn much less often (normally about every 850 ms on PC, 1400 ms on low-quality mode), while the cached image moves smoothly every frame using an inexpensive world-space transform.
- Low-resolution cloud texture, 66% of the CSS viewport on normal quality and 42% on low, displayed with linear filtering. Clouds are intentionally soft, so they don't need full-resolution texture uploads.
- Keeps overscan checks so the cached image is refreshed before its margins become visible.
- Cloud contrast increases modestly during daytime, particularly when cloud cover is high; shadows disappear at night.
- Generated cloud stamp canvases are reduced from 256×160 to 192×120, and count drops from eight to five on normal quality or three on low (cached for subsequent scenes).
- Existing reduced-motion preference continues to disable cloud drift.
- Existing scenery, character contact shadows, night lighting, weather and saved games are untouched.

## Install

Unzip this folder into the **project root** (next to `package.json`). Run:

```
node ".\\leighneron-cloud-shadows\\apply.mjs"
```

The installer modifies only:

- `src/game/systems/GroundShadowSystem.ts`
- `src/game/systems/CloudShadowArt.ts`

It checks all expected source anchors before changing anything, respects Windows CRLF line endings, and saves the originals under `.leighneron-cloud-shadows-backup/<timestamp>/`.

If a local file differs, it fails safely and writes `leighneron-cloud-shadows-preflight.txt` with the mismatches. Please provide that report for a compatibility update. Running the installer a second time will fail safely as already applied.

No build, tests, commit, or push is performed by the installer.
