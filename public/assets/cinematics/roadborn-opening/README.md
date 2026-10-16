# The Child Who Waited — approved opening artwork

`prologue-waiting-v1.png` is the unchanged approved 1672×941 anime/manga page,
generated with the built-in image-generation tool from the game's original
Leigneron/innkeeper references. Exact prompt, original output path and source
references: `docs/art/cutscene-samples/README.md`.

Used by the first three beats of `roadborn-opening`, before the existing
present-day introduction. `src/data/storyPanelArt.ts` records crop windows and
accessible descriptions. One shared file is loaded and decoded on demand;
the UI reveals panels, gently moves the active panel, and keeps captions
separate. Portrait phones show the active panel without stretching it.

The existing cinematic director owns timing, skip, physics and restoration.
The world camera does not travel to illustrated memories. Optional-art load
failure/timeout falls back to the same narration over the ordinary world
presentation. Pending image loads are cancelled on skip/shutdown. Old save
flags and scene IDs are unchanged: an already-seen opening is not replayed
automatically, and saved in-progress scenes retain their normal replay behavior.

Integration was source-reviewed only. No tests, type checks, game launch or
builds were run. Remaining manual verification: panel crops at PC and phone
sizes, portrait/landscape rotation, caption scrolling, reduced-motion, focus
pause/resume, missing artwork, skip during loading, and transition into the
normal mentor shot and back to gameplay.
