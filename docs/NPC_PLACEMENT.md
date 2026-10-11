# NPC placement repair

All 141 named residents were surveyed against the current settlement scenery. 85 starting points were moved within their existing work neighborhoods. The archivist returns to the archive court and the shrine acolyte has her own shrine position, fixing the stacked Highmere residents in old saves.

[Rendered Highmere shrine after the repair](images/highmere-shrine-clear.png).

`src/data/npcPositions.json` records reviewed town-local starting, home and guard schedule positions. Keeping these separate from identity definitions avoids moving buildings or decoration when an NPC changes location. Fixed residents stand outside streets, with additional clearance around Highmere's entire western guard circuit. Reservations allow 80 horizontal or 112 vertical pixels between residents, keeping full bodies separate. Houses, trees, furniture, water and fortifications are included in the survey.

Old fixed-resident save coordinates are repaired when loading without changing trust, dialogue or quest progress. Moving guards retain their journeys and still use their existing street routing and crowd sidesteps. Spawning in every town also checks actual loaded collision geometry and neighbors. The escorted dockworker retains his journey and has a reserved kitchen arrival separate from his mother; escort completion and reloading use the same destination.

To regenerate the authored placement survey after scenery changes, use Node 24 and run `node scripts/surveyNpcPositions.mjs`. Review the resulting JSON, run `tests/npcPlacement.test.ts`, and inspect actual browser placements before accepting it. The generator does not run during gameplay.

Browser coverage streams every resident, verifies clear collision/roof bounds and stationary road clearance, simulates the complete western guard circuit, and captures the shrine. The pirate test inspects all locomotion and combat poses on the GPU, checks frame containment, body scale and foot registration. The existing enemy appearance gallery also covers regular bandits and dragon ground/flight registration.

Validation for this change: application and test TypeScript checks passed; 16 focused unit checks and five browser checks passed. The full unit suite has 114 passing checks and the same 25 pre-existing failures as the prior combat-stagger commit (failure names compared). No local production or APK build was run for this task. Pushing main invokes the existing GitHub Android build workflow.
