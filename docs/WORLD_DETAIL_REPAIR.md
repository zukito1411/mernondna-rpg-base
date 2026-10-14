# Roads, countryside and grounding repair

Implemented in the existing continuous world; no framework or save-schema changes.

- Regional roads follow settlement cross streets and surveyed exit approaches
  before joining distant waypoints. Nearby waypoints that would double back
  through the enclosure are excluded. Deepford's southern trade route follows
  the boatwright quay; Highmere's southern approach follows its existing causeway.
- Moonfall now connects directly toward Starhold's existing pass road.
- Orchard Brook, Greenward Run and Cibar Rill join existing drainage. Their
  north/south reaches allow east/west bridges without rotating the illustration.
  Tributaries are not erased by broad settlement terrain reservations.
- Added small countryside pools in Trandum, Narenthil, Druganwoods and Rindass.
  The existing road/settlement clearance filter can reject an unsafe pool.
- Stone-bridge traversal follows the illustrated arch rather than an 80-unit
  horizontal strip. Wilderness bridge scale accounts for the river's angle and
  bank clearance; artwork and terrain use the same scale/ground registration.
- Highmere's city and royal gates use the genuinely open gate in the existing
  wall sheet. Its aperture and adjoining curtain shoulders use matching source
  measurements. Existing frame IDs are retained; the open gate is appended.
- Scenery projections fade out painted ground pads. Soft contacts use physical
  foundation footprints, including separate ruin/gate supports. Existing source
  ground points override generic bottom anchors. Water/deck art is not projected
  as a solid object; extracted stone parapets retain their own shadows.
- Temperate wilderness camps use cargo, barrels and woodland pieces instead of
  the desert-clan tent. Oasis dressing uses Rindass assets. Landmark placements
  cannot cross into another region while looking for a clear slot.
- Roads and drainage use immutable spatial buckets. Landmark reservations use a
  shared bounds index and per-composition reuse. Fortification path checks reject
  distant settlements before examining curtains. Scenery fitting reuses admitted
  bounds instead of rebuilding them for each candidate. Existing streaming,
  scenery caps, shadow caches and mobile quality settings are preserved.

## Verification status

### Bridge registration and quest directions follow-up

- Center-anchored scenery now registers its source ground point against the
  prepared atlas bounds, including alpha trimming. Bridge parapet extraction
  reads the actual frame coordinates rather than assuming its atlas position.
- Wilderness road waypoints follow the shared arched deck centerline, with
  bank approaches outside the artwork. Guidance uses closer waypoint steps at
  bridges and advances along path segments rather than returning to past vertices.
- Highmere and wilderness deck lookups use spatial buckets and override broad
  water/settlement terrain reservations on the actual walkable surface. Painted
  water and parapets are not granted blanket rectangular walkability.
- Journal objectives and HUD directions derive settlement/region names from
  existing NPC and world records. Indoor contacts include their actual building;
  road discoveries name both connected settlements. Spoken dialogue, objective
  IDs and saved progression are unchanged.
- Island directions explicitly name a departure pier and boat destination:
  Tidewatch Harbor (Portquill), Skallheim Harbor (Frostlands), or Ashen Landing
  (Darkav), followed by the ash road to Blackspire. Return journeys name Highmere.
  The quest guide opens the full journal with a tap, click, Enter or Space.

The initial implementation used source/image inspection only, following the
user's standing instruction. On 2026-10-14 the user requested focused release
verification; the following completed successfully:

- `npm run build` (application TypeScript and production web bundle).
- `npm run test:types` (existing test/source TypeScript configuration).
- `npx vitest run tests/releaseSmoke.test.ts`: four focused checks, 3.55 seconds,
  covering campaign references/encounter counts, sampled bridge centerlines,
  destination text/boat directions and new interior/citizen source files.
- `npx cap sync android` and Java 21 `:app:assembleDebug --offline`: APK assembly
  succeeded in 22 seconds using the same APK variant as the GitHub workflow.

No browser/gameplay tests, broad suites or performance benchmarks were run.
This is not a rendered certification of every route or gate. GitHub publishing
still requires the existing permanent signing secret and repository permissions;
the local APK does not verify the remote secret. Include new/untracked source
files and regional citizen artwork in the commit, then push to `main` to trigger
the existing workflow. No commit, push or release publication was performed.
