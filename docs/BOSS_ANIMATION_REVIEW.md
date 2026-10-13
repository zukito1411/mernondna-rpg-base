# Boss animation source review — 2026-10-13

## Scope and acceptance

Reviewed the consumed locomotion, attack, hurt and death sources for all nine boss identities, plus Varkhul's flight poses. Source review is not GPU/rendered acceptance. No game launch, tests, typecheck or build ran. **Perfect stepping anatomy and frame consistency are not certified.** The remaining acceptance checks are alternating supports in motion, proportions across states, frame UVs/containment, foot/collision registration, facing transitions and dragon ground/flight size. The latest generated sheets still need this manual review; brief instructions or named animation clips alone do not prove correct anatomy.

## Decisions and source changes

| Boss | Source treatment |
| --- | --- |
| Captain Varr | Retain accepted full bandit art, neutral side-transition sequence, and approved up/down gait. Inspected complete refined attack/hurt/death poses. |
| Moonlit Warden | Retain spectral art and animated glide; no artificial legs or stepping added. |
| Stonejaw | Retain approved complete troll silhouette, four directional strides and refined club/hurt/collapse poses. |
| Krag | New single-board walking source instead of mixing differently proportioned side boards. Entire rear windup reflects to keep the axe on its canonical side. Complete pose reflection only, no arm/leg stitching. |
| Rootfather | New single-board walking source, removing opposite-step whole-body reflection that swapped stone plates and moss details. |
| Salt King | Retain the user's accepted gait sheet/order/durations, hat, scarf, sword and shield; inspected full attack/hurt/death sources. |
| Frost Wyrm | New complete four-legged walking board; remains wingless and grounded. Source sequence is not claimed anatomically perfect in motion. |
| Ashen Seer | Subsequent user-requested distinction: dedicated masked ember-oracle art replaces the shared blue wraith. See `ASHEN_SEER_ART.md`; glides with no invented feet. |
| Varkhul | Retain approved four-legged dragon art, refined breath/hurt/death and full wingbeats; no change to flight geometry or combat. |

Bosses now share the existing pirate locomotion stop/start hysteresis: tiny collision-speed dips no longer instantly alternate idle/walk. Real attack/recovery pauses remain intact. Existing walk phase preservation on facing changes is retained.

New boss walking registration uses the upper silhouette so the swinging boot does not pull the entire body sideways. Scale is fixed per source-facing, not recalculated for each stretched weapon or lifted knee. Combat keeps its existing planted-silhouette registration and standing recovery calibration. Added source path, image dimensions and foreign-pixel probes to prepared frame metadata for a future authorized rendered audit. No additional atlas cells, live actors, per-frame segmentation or persistent state changes.

## Selected assets and tool

Built-in imagegen, not CLI/API fallback. New versioned project assets:

- `public/assets/enemies/krag_chieftain/walk-v2.png`
- `public/assets/enemies/rootfather/walk-v2.png`
- `public/assets/enemies/frost_wyrm/walk-v2.png`

Each is a 4-column x 3-row transparent source with down/right/up facings. Left uses the full right-facing model mirrored consistently. Prepared atlas slots and attack indices remain unchanged: walking columns fill the four walking slots; standing idle still uses combat recovery. Original PNGs are retained. These sources supersede the old M18-M20 walking-source/mirroring notes in `BOSS_REPLACEMENT_ART.md`.

Two additional guide-based side variants were examined but not integrated: their pose variety did not justify replacing a single coherent directional board, and repeatedly regenerating sheets is not a substitute for rendered acceptance.

## Exact selected generation prompts

### Krag

Use case: identity-preserve. EDIT the walking animation while preserving the exact existing boss identity. Image1 is walking edit target; Image2 is canonical combat identity reference. Deliver transparent PNG, exactly FOUR columns by THREE rows, twelve COMPLETE whole actors at consistent body/head size. Rows DOWN / RIGHT profile / UP. Keep original elevated top-down Mernodna painted outline, palette, material detail, camera and lighting; DO NOT redesign the body, head, equipment or proportions. Clearly animated weight transfer, no idle in the loop, no duplicated lead-leg silhouettes. Whole feet, hands, weapon/tail inside every cell with generous transparent gutters. NO ground, shadow, labels, guides, effects, lines, detached limbs or body-part stitching. 1536x1024. Adult green tusked armored orc Krag, tied dark hair, red sash, bronze/brown armor and short broad axe consistently RIGHT hand. Four columns are CONTACT left-leg-forward/right-leg-back; PASSING left support/right knee swinging forward clear of ground; CONTACT right-leg-forward/left-leg-back; PASSING right support/left knee swinging forward. In RIGHT row the NEAR leg is stretched FORWARD in col0 and unmistakably BACKWARD behind hip in col2, FAR leg is vice versa. Col1 FAR knee bends/lifts; col3 NEAR knee bends/lifts. In DOWN and UP rows visibly alternate BOTH legs, opposite boot soles and bent knees, not same stepping silhouette every cell. Hair, shoulder plates, sash, axe and head identical throughout; back-facing axe ALWAYS screen RIGHT. Natural adult stride, modest knee lift, steady pelvis, not high-knee marching. Draw all full body poses from consistent character model.

### Rootfather

Use case: identity-preserve. EDIT the walking animation while preserving the exact existing boss identity. Image1 is walking edit target; Image2 is canonical combat identity reference. Deliver transparent PNG, exactly FOUR columns by THREE rows, twelve COMPLETE whole actors at consistent body/head size. Rows DOWN / RIGHT profile / UP. Keep original elevated top-down Mernodna painted outline, palette, material detail, camera and lighting; DO NOT redesign the body, head, equipment or proportions. Clearly animated weight transfer, no idle in the loop, no duplicated lead-leg silhouettes. Whole feet, hands, weapon/tail inside every cell with generous transparent gutters. NO ground, shadow, labels, guides, effects, lines, detached limbs or body-part stitching. 1536x1024. Exact Rootfather ancient ROOT-AND-STONE guardian, gray stone plates bound by thick brown roots, moss seams, same amber rune chest and eyes, same root crown. Two legs and two branch hands only. Columns0 left root-foot contact forward/right foot behind;1 left root support/right knee bent and foot lifting forward;2 right root-foot contact forward/left behind;3 right support/left knee bent and foot lifting forward. RIGHT row near leg clearly FORWARD in col0 and BACK behind hip in col2, rear far leg viceversa. Down/up visibly alternate which rooted foot supports weight and which sole is lifted. ROOTS ARE FEET WITH JOINTS, NOT STATIONARY TREE STUMPS. Keep stone plate arrangement, rune/crown size and number identical across frames. No mirroring a half cycle changing plate geometry. Slow weighty, modest step, grounded alternating supports; no stomping airborne hop.

### Frost Wyrm

Use case: identity-preserve. EDIT the walking animation while preserving the exact existing boss identity. Image1 is walking edit target; Image2 is canonical combat identity reference. Deliver transparent PNG, exactly FOUR columns by THREE rows, twelve COMPLETE whole actors at consistent body/head size. Rows DOWN / RIGHT profile / UP. Keep original elevated top-down Mernodna painted outline, palette, material detail, camera and lighting; DO NOT redesign the body, head, equipment or proportions. Clearly animated weight transfer, no idle in the loop, no duplicated lead-leg silhouettes. Whole feet, hands, weapon/tail inside every cell with generous transparent gutters. NO ground, shadow, labels, guides, effects, lines, detached limbs or body-part stitching. 1536x1024. Exact wingless four-legged pale ice-scaled Frost Wyrm, blue crest and horns, amber eyes, thick curled tail. Anatomical four-beat low reptile WALK: columns0 LEFT HIND leg swings forward off ground while both forefeet and right hind support;1 LEFT FORE leg swings forward while right fore and both hind support;2 RIGHT HIND swings while both fore and left hind support;3 RIGHT FORE swings while left fore and both hind support. THREE feet grounded and ONE swinging in each frame, hips and shoulders transfer weight. Side row show correct elbow bends and backward hinging hocks, near/far forelegs AND hindlegs really alternate, not four copies of lifted same forepaw. Front/back show visible opposite supporting paws too. Keep identical head size, scale pattern, crest/horns, body length, tail curl and four claws/limbs throughout; do not add wings, fur, fins or extra legs. Tail moves subtly but never changes length; head level; no flight or jumping.

