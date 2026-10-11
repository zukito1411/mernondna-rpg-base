# Performance and day/night ambience

The authored building footprints are computed once and indexed into 512-unit
cells. NPC roof visibility and precipitation shielding query nearby candidates.
Path and foot-collision checks use Arcade's existing static spatial tree, then
the original exact geometry tests. Sprite artwork, sizes, rendering resolution,
particle counts and effect quality settings are unchanged.

Local Chrome measurements, 1,000 calls per sample (best of three warm samples):

| Work | Before | After |
| --- | ---: | ---: |
| NPC building visibility | 37.1 ms | 0.4 ms |
| Clear-path queries | 11.8 ms | 3.5 ms |
| Content update, unchanged camera | 12.7 ms | 15.8 ms |

These are CPU microbenchmarks, not Android FPS measurements. The content update
now also carries explicit health maxima for safe scaled-enemy restoration.
Spatial query results matched the original predicates across 600 samples each
for paths, collision feet and roof visibility. Desktop and touch viewport
checks retained shoreline masks, all registered shadows, and zero repeated
shadow uploads for settled poses. The source changes do not lower visual quality.

Daytime (06:00–18:00) has quiet wind and short recorded bird calls, separated by
7–13 seconds. Nighttime has a streamed cricket bed and recorded owl calls
separated by 18–30 seconds. Animals are omitted on ocean, volcanic and frozen
terrain. Regional music fades out at night and returns after dawn; combat and
interaction sounds remain available. World-sound mute, pause, hidden tabs and
scene teardown stop the appropriate audio. The three nature recordings are
streamed through HTML audio elements to avoid permanent large decoded buffers.
The current recording gains retain the user's adjustments in `NatureAmbience.ts`.
Credits and CC0 source links are in `public/assets/audio/README.txt`.

Enemy saves now carry an optional `hpMax`. Recorded HP retains its damage
fraction when tiers change. Legacy records without a maximum keep their saved
HP; a fresh spawn's default maximum cannot override that record. Ordinary
respawning bosses play their complete death artwork. Only the dragon uses its
flight retreat. The twenty-minute respawn deadline is unchanged.

Validation: no-emit TypeScript, 27 unit tests covering health restoration,
save migration/round-trip, streaming, spatial lookup and sound policy; browser
checks covering audio transitions, audio ownership, collision equivalence,
boss defeat appearance, desktop/mobile render budgets and existing enemy
ground/combat/dragon-flight registration. No production/APK build, commit or
push was performed.

Afternoon/night rendering now uses a GPU dynamic texture for darkness and
cached radial light frames for the original window/torch profile. The global
night strength changes through image alpha. Static masks survive clock changes
and camera movement within the existing 96-pixel overscan; visible fire keeps
the previous flicker cadence. Offscreen glows are hidden, and emissions no longer
request a depth sort when their draw order has not changed. Existing resolution,
light radii, mobile light cap, particle counts and preference settings remain.

Uniform weather tint uses a one-pixel image below the precipitation/mist layer.
Overcast skies therefore fade without uploading a full viewport texture. Fog
skips only stamps wholly outside the canvas; comparison with the original
renderer found zero changed visible pixels and over 50% fewer draw calls.
After sunset the shadow lighting key and conservative culling reach remain
constant: changing the clock/cloud cover does not repaint unchanged contact
shadows. Scenery changes, actor poses and camera recaptures still invalidate them.

Local Chrome/SwiftShader CPU lighting measurements across 240 updates, with all
effects enabled, a stationary camera, and streamed Highmere/Elarion scenery:

| Desktop lighting work | Before | After |
| --- | ---: | ---: |
| Highmere, 19:00 | 230.2 ms | 14.3 ms |
| Highmere, 22:00 | 202.6 ms | 21.9 ms |
| Elarion, 19:00 | 993.4 ms | 21.6 ms |
| Elarion, 22:00 | 1275.2 ms | 21.5 ms |

Night mask canvas uploads fell from 48 to zero across those desktop samples
and from 17 to zero in the touch samples. These timings measure CPU effect work,
not whole-game FPS or Android GPU speed. Browser checks compare GPU mask alpha
against the original radial-gradient implementation at dusk/night and different
flicker phases, cover desktop and touch/DPR 2, exercise quality toggles and
camera overscan, verify cached contact shadows, and sample the rendered weather
tint. Small 8-bit texture-resampling differences remain within the visual test
tolerance (mean alpha error below 0.3 out of 255 in the measured cases).

Final verification: six rendering browser checks passed, as did the enemy GPU
appearance audit, spatial/boss regression and day/night sound regression.
Actual keyboard movement succeeded at 17:30, 19:00 and 22:00 with no browser
errors; opening the world map stopped the night clock. App/test no-emit type
checks and all 27 selected unit tests passed. No build, commit or push was run.

Darkav tremors now play the project-provided `ambience/volcanic.mp3` recording.
The 12-second media timeline replaces the unrelated 420ms shake. A small cached
100ms RMS envelope follows the actual clip's crescendo and fade, capped at the
existing .0018 camera intensity; no per-frame audio decoding or FFT is needed.
The recording streams at .45 volume, loads only in Darkav, and waits for real
playback before moving the camera. Buffering, menus, dialogue, cutscenes, boat
travel, hidden tabs and focus loss stop movement and pause playback together.
Resume continues the same media position; leaving Darkav stops and rewinds it.
World-sound mute silences the recording while preserving the visual quake.
The camera composes a separate quake effect with normal combat shakes.

The existing 24-54 second arrival wait remains. Completed clips have a 35-75
second quiet gap before the next tremor, with no overlapping rumble recordings.
Scene shutdown removes the media and its listeners. Validation: 17 selected
unit tests, app/test no-emit checks, and a browser check with the actual recording
covering synchronization, combat-shake coexistence, pause/resume, hidden tabs,
fade/end, mute, departure and disposal. No build, commit or push was performed.
The existing desktop/touch rendering budgets and day/night wildlife/BGM browser
checks also passed after installing the camera effect.
