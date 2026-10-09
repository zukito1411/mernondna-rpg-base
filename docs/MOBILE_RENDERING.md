# Mobile rendering and ground markers

Source changes, 2026-10-09. No builds, tests, type checks, game/browser launches,
device checks or Capacitor synchronization were executed.

## Rendering

The installed Phaser 3.90 renderer does not expose the older renderer
`resolution` option. The game now uses a density-sized backing canvas with FIT
display scaling. `renderSizing.ts` computes a bounded DPR multiplier (at most
2x, with a four-million-pixel and 4096px-side growth budget). A display already
exceeding those budgets at 1x is not downsampled below its CSS resolution.

World-camera zoom includes the same multiplier, while responsive zoom
breakpoints still use CSS dimensions. This preserves apparent actor sizes and
field of view instead of making the player tiny or showing twice as much world.
Phaser's scale manager maps pointer positions through the actual canvas bounds;
the React HUD and mobile joystick remain CSS-sized and are not multiplied.

Parent resize, browser resize, visual viewport changes and DPR changes schedule
a backing-size update. Observers, media-query listeners and pending callbacks
are removed on game destruction. Cinematic shots and restored gameplay zoom
also account for density changes. Boot error text retains readable CSS sizing.

Night, weather and moving-water canvases retain CSS-sized working buffers and
are fitted to the physical viewport. Their world-to-screen calculations use
logical zoom, avoiding both doubled glow offsets and DPR-squared texture upload
cost. World sprites, geometry, terrain rendering and marker strokes use the
higher-resolution main buffer. Original pixel-art textures remain pixel art;
this is not an asset upscaling or guaranteed full-native-DPR solution.

## Ground markers

`groundMarkers.ts` centralizes the ground ring at actor world y + 2. NPC quest
rings keep the corrected foot position, and enemy selection rings now use the
same convention instead of their separate +4 offset. Character origin/body
registration remains unchanged; a wolf leap does not lift the ground ring.
The stale +23 quest-ring offset in previously packaged Android JavaScript is
not manually patched into generated/minified files.

## Updating Android when build execution is authorized

The new command is available but has **not** been run:

```powershell
npm run cap:android:refresh
```

It runs the existing production build and then Capacitor's Android sync,
copying the freshly generated `dist` into Android's packaged web assets.
Afterward, build a new APK in Android Studio (or the project's Android Gradle
workflow) and install that APK. Asset synchronization alone does not update an
already installed APK. Do not treat this script as a test-only command: it
executes a TypeScript/Vite build and requires the user's build permission.

For a deployed browser/PWA version, publish the newly built `dist` through the
existing deployment workflow; installed browser copies also need that updated
app shell. No deployment or installed-package replacement occurred here.

## Remaining verification

Review was source-only. Physical phone sharpness, touch selection, portrait /
landscape rotation, browser zoom/DPR changes, cutscene transitions, night-light
alignment and device performance remain unverified. Existing dependencies and
unrelated worktree changes were preserved.
