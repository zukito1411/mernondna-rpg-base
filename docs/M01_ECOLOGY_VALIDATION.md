# M01 ecology foundation — validation record

Date: 12 October 2026. Unchanged comparison revision: `27e8807` (`cleaning`), checked out in a separate temporary worktree. The implementation remains uncommitted. Approved art, renderer quality, lighting, water and fog were not replaced or reduced.

Status: **M01 complete within its foundation scope**, with the pre-existing repository failures below kept separate. This does not declare the entire game bug-free, M02 complete, or physical-phone performance validated.

## Scope and checks

M01 covers actual-candidate habitat selection and shared hostile admission with boss/reinforcement reservations, plus day/afternoon/night and memory baselines. It does not activate new creature families. Previously prepared M02 group/save/batch code is retained and included in regression checks, but M02 alerts/leashes and its milestone completion remain separate.

- Native region weights and actual candidate biomes/surfaces govern new spawning, including every wolf-pack member. Protected settlements, geometry and the dragon arena remain excluded.
- Every settlement center and authored land parcel rejects hostile occupancy. All authored creature/boss identities survive placement repair into valid wilderness territory.
- A survey of 1,200 actual world points covers all nine region IDs. Explicit narrow lava-channel samples supplement the coarse survey; ordinary creatures receive no weight on lava/water/farmland or in non-native regions.
- Browser fixture: Captain Varr plus 13 ordinary enemies fills 14 slots, reserving two reinforcements. Two live-boss summons reach 16; a third fails. Another authored boss cannot exceed 16, then activates when one ordinary enemy is removed. Rejected town/water/non-native spawns consume no records. Saving retains version 5 and defeat state.
- Wolf placement/group restoration, generic identity compatibility, batch registration, duplicate prevention, saved health/alpha/deaths, initializer failures and persistent-record reclamation have focused unit coverage.

## Execution and existing failures

- `npm run test:types`: passed after correcting the new `WorldScene.habitatAt` return annotation.
- Focused ecology/streaming/save tests: 40 passed; actual-world checks: another 3 passed.
- Full baseline suite: 117 passed, 25 failed (142 total). Final implementation suite: 141 passed, the same 25 failed (166 total). The 24 additional assertions all pass; the complete suite is **not green** because of those existing failures.
- Failed test names matched exactly between baseline and implementation. No failure was removed, skipped or relaxed to make the full suite green.
- Existing lighting/fog/shadow/water browser checks: 6 passed, including desktop/touch night gradients, afternoon tint, fog pixel equivalence and cached scenery/water work.
- Final ecology browser checks: 3 passed, covering runtime admission/save state and both desktop/touch baseline comparisons. Total relevant browser checks: **9 passed**. Final application/test typecheck passed.

The 25 pre-existing failures span animation/art metadata expectations, raw authored placements, settlement layout/roads/fields/canopies, progression/quest expectations, PWA icon expectations and atlas sizing. Some expectations are stale; others are diagnostics requiring their own investigation. They are **not** all declared harmless or fixed by M01. In particular, the existing mobile-safe atlas-size check reports a 4,800-pixel atlas against a 4,096-pixel expectation.

## Performance methodology

Windows desktop host, Headless Chrome 155, software WebGL/SwiftShader. Desktop: 1280×720, DPR 1. Touch emulation: 844×390, DPR 2. This is not a physical Android measurement.

For each revision and layout, capture 120 frame intervals after 24 warmup frames at a quiet Oakmere woodland edge, afternoon Oakmere and nighttime Highmere. Capture median/p95/p99/max intervals, draw calls, texture-upload calls, initially resident enemy AI-update calls, bodies, hostile records, texture counts/size estimates and reported JavaScript heap. All original rendering effects remain enabled at their defaults. Software-renderer frame rates are slow in both revisions and do not represent hardware-GPU phone frame rates.

Profiling disables Playwright tracing/screencast overhead. Comparison gates are median ≤ baseline×1.25+2 ms and p95 ≤ baseline×1.25+4 ms, with identical texture-size estimates for equivalent phases. p99/max values are retained, not presented as guaranteed stable tails. This single-sample gate is a bounded regression screen, not a statistical performance guarantee.

Six paused capital/home round trips verify settled body, texture-count and texture-size plateaus. The fixture explicitly runs Arcade `postUpdate` after each stream operation: real frames do this normally, but a synchronous paused-scene loop otherwise leaves destroyed bodies queued. The initial traced attempt exposed that fixture issue and was not used as final evidence. Reported JS heap is GC-dependent, not a driver/GPU-memory measurement.

Desktop baseline/current median (ms): day 130/129.9, afternoon 140/149.9, night 210/219.9. Corresponding p95: 140.1/140.1, 150.1/160.1, 270/280. Afternoon p99 was 170.1/250; nighttime maximum was approximately 2050/2280. These outliers are disclosed rather than hidden by the median/p95 pass. Repeat/physical-device profiling remains necessary before making smoothness claims.

Desktop texture-size estimate stayed at 755,272,352 bytes in the day case and 755,272,388 bytes in the other phases in both revisions (~720 MiB). This is already a substantial existing asset footprint, not a new M01 allocation or a claim of mobile safety. Both revisions settled to 185 texture sources and 626 bodies on the repeated desktop route. Current reported JS heap fluctuated with collection instead of growing monotonically; stable actor/texture counts are the stronger bounded-lifecycle evidence here.

Touch baseline/current median (ms): day 170/169.9, afternoon 179.9/179.9, night 239.9/230. Corresponding p95: 269.9/180, 210/190.1, 350/340; p99: 350/180.1, 330/259.9, 809.9/790. Both revisions settled to 184 texture sources, 625 bodies and 737,001,328 estimated texture bytes (~703 MiB) on the repeated touch route. All comparison gates passed. Broad GL upload/draw totals and initially resident AI update counts are in the JSON; upload counts include existing dynamic effects, not just art atlases, and AI calls are not a count of individual internal planning decisions.

Both viewport layouts passed actual runtime/render checks without reducing graphics quality. The large existing texture footprint, long software-renderer spikes and the old atlas-size failure remain reasons to profile physical hardware and implement measured regional residency before expanding art indiscriminately. M22 owns Android-device validation; this milestone makes no new phone-performance guarantee.

No production/APK build, commit, push or release was performed. Do not advance new creature families until M02's remaining behavior and checks are complete.

## Reproduction and artifacts

Start an unchanged base-revision Vite server on port 5175 in a separate worktree. In PowerShell:

```powershell
$env:M01_BASELINE_URL = 'http://127.0.0.1:5175'
npx playwright test ecologyFoundation.spec.ts --reporter=line --output=test-results/m01-ecology-final
npx playwright test renderPerformance.spec.ts nightPerformance.spec.ts --reporter=line --output=test-results/m01-render
npm run test:types
npm test
```

Playwright manages the current-revision development server on port 5174. Without `M01_BASELINE_URL`, comparison tests explicitly skip rather than fabricate a baseline; the runtime cap/exclusion/save check still runs.

Ignored local evidence lives under `test-results/m01-ecology-final/` (baseline/current desktop/touch JSON and nighttime endpoint screenshots), `test-results/m01-render/`, `test-results/m01-units-current.json` and `test-results/m01-units-baseline.json`. Preserve the accompanying measurements before deleting test output directories. The temporary baseline worktree/server is disposable; the retained JSON reports do not require it to remain running. The first traced profiling attempt was superseded, not counted as a passing comparison.
