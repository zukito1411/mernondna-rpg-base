# Illustrated story scenes

The approved anime/manga opening style now extends through the campaign's major
confrontations, discoveries and homecoming. These are presentation illustrations,
not replacement gameplay sprites or combat simulations.

- `roadborn-opening/prologue-waiting-v1.png`: the approved childhood memory.
- `story/*-v1.png`: sixteen additional three-panel pages, generated with the
  built-in image-generation tool using the opening and the original actor models
  as appearance references. Exact prompts and reference inputs are recorded in
  `docs/art/cutscene-samples/story-rollout-prompts.json`.
  Final source selections and the targeted Thomas age/proportion correction are
  recorded in `docs/art/cutscene-samples/story-rollout-selection.json`.
- `src/data/storyPanelArt.ts`: native image dimensions, crop registration, titles
  and accessible descriptions. Panels share their page bitmap; no cropped copies
  are needed.
- `src/data/cinematics.ts`: explicit assignments to existing story beats. Battles,
  quest triggers, persistent scene IDs and choice-dependent narration are retained.

## Coverage

| Page | Existing story scenes |
| --- | --- |
| varr-survey | Varr's introduction and recovered survey |
| highmere-arrival | Quay, Royal Archive and the missing witness's mother |
| witness-protected | Thomas in hiding, reunion and safeguarded testimony |
| crown-audience | Crown audience, ward research and household hearing |
| mourning-grove | Narenthil's injured ward, Moonlit Warden and recovered iron |
| last-beacon | Stranded porters, Stonejaw and the reopened mountain pass |
| broken-clan | Red Mesa's shared well, Krag and the clans' recovery |
| wounded-root | Damaged spring, Rootfather and dwarven repairs |
| river-account | The definitive account of Leigneron's parents and his grief |
| stolen-sea | Tidewatch cargo, Salt King aboard the flagship and freight evidence |
| frozen-light | Coastal beacon, grounded Frost Wyrm and recovered shard |
| ashen-truth | Burned chainworks, distinct Ashen Seer and surviving workers |
| crown-betrayal | Archive attack, Walter's confrontation and arrest |
| returning-ember | Sheltered crews, Varkhul's reveal and living retreat |
| wards-rewoven | Cinder binding, witnessed covenant and shared water |
| place-at-table | Hawise's welcome, Edmund's reassurance and Alice's farewell |

Routine conversations and smaller event warnings still use the existing in-world
camera. The artwork does not imply that every conversation is now illustrated.
Branch-sensitive illustrations deliberately avoid declaring either player choice
the canonical outcome. Aftermath imagery is not attached to pre-battle scenes.

## Presentation and resource lifetime

- Pages load on demand with an eight-second timeout and cancellation on skip or
  scene destruction. A failed illustration falls back to the original world shot
  and narration rather than blocking the story.
- The desktop/landscape layout reveals panels progressively; narrow portrait
  phones show only the current panel. Captions remain separate selectable HTML
  text. SVG viewports preserve proportions and clip neighboring panels.
- Motion respects reduced-motion preferences and pauses when the app loses focus.
- Every shot uses a shared 360 ms fade-out and fade-in across the canvas and HTML
  illustration layers. Existing art and narration remain mounted until the
  curtain is opaque. The next reading timer begins after the reveal; scene exits
  and skips conceal camera/interior restoration before fading back to gameplay.
- The opaque illustrated overlay suspends unnecessary world presentation work;
  it never loads all regions or inserts illustrations into the world texture cache.
- Returning to gameplay or a world shot uses the existing concealed streaming,
  interior restoration and camera-follow logic.
- Existing seen-scene flags are respected. This update does not force completed
  saves to replay cinematics or reset quests.

## Verification status

Artwork was visually inspected and source integration reviewed. After the user
authorized testing, the TypeScript check and 95 focused tests across eight files
passed: cinematic presentation and fade/skip lifecycle, artwork registration,
startup cleanup, quest progression, save compatibility, passages, streaming and
PWA identity. The checks caught and fixed a non-browser render failure and NPC
display-name rewriting of internal cinematic/artwork identifiers.

No game launch, browser automation, production/APK build or push was performed.

When runtime verification is authorized, check: the opening and homecoming;
portrait/landscape rotation and captions; before/after boss timing; both narration
variants at the household hearing; skipping during image load and from an interior;
and restored controls/camera after the last illustrated panel. Actual browser and
Android rendering have not been verified for this change.
