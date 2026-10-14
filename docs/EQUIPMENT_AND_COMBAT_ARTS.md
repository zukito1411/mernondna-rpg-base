# Equipment, provisions and combat arts

## Player flow

- Talk to Joren Pike in Oakmere, Osric Flint in Highmere, or a regional smith.
  Finish the conversation to see goods. Smiths sell swords and draughts;
  traders/innkeepers sell draughts. Story choices remain separate from trading.
- Buy with gold, then open Bag to compare weapon damage and equip a blade.
  New swords use existing sword attacks and affect basic and skill damage.
- Healing Draught: 28 gold, restores 50 health. Wayfarer Tonic: 22 gold,
  restores 60 stamina. Carry up to 99 each; full vitals do not consume a bottle.
  Two healing draughts and one tonic start a new game. Older saves start with
  no free bottles, keeping migration repeatable.
  Mobile healing/stamina shortcuts occupy the free lower lane left of combat
  buttons, with Interact shifted left above them. Desktop slots 1–4 remain
  combat arts (including visible empty slots); fixed slots 5/6 use health/stamina
  potions through the same player input path.
  Potion inputs are consumed by the live Player, synchronizing real vitals
  before use rather than healing a stale HUD snapshot. Blocked UI resets input.
  Portrait controls use a separate raised potion lane to avoid the joystick.
- Local development (localhost or private-LAN Vite) grants every weapon in the
  bag, including on loading existing saves, and a replenished test gold balance
  displayed as infinity. Merchant purchases do not spend local test gold.
  Release builds do not grant these cheats. `?localCheats=0` disables them;
  automated `?e2e` sessions keep normal behavior unless explicitly opted in.
- Smith progression: Oakguard 110 gold / level 3 / 24 damage; Tempered
  Roadblade 290 / level 8 / 30; Deepforge 620 / level 16 / 39; Royal Guard
  1050 / level 24 / 47. Oakmere stocks the first two, smaller Trandum forges the
  first three, Highmere and regional forges the complete progression.
- Each accepted boss defeat rolls its own themed weapon at 10% probability.
  Repeat notification protection remains in the original boss reward ledger.
  Repeat encounters can drop weapons; duplicate trophies become salvage gold.
  No guarantee/pity counter is added. Existing boss IDs and respawns are unchanged.
- Stats supports four assignable slots. Selecting an already slotted art moves
  it, not duplicates it. Empty clears a slot. Slots drive both touch controls and
  keys 1–4; cooldowns belong to art IDs, so slot changes do not reset them.
  Usable skills and slot controls appear first; passive talents are labelled
  separately below. The original four icon paths/files are unchanged, and new
  arts use a separate icon mapping rather than aliasing those original portraits.
- Original arts retain their level unlocks. New point purchases: Ember Cleave
  ID now displays Ember Snare (Lv18, 2 points, planted trap with three delayed
  1.1x eruptions). Renewing Light (Lv20, 2 points) restores 6% health each second
  for six seconds, interrupted on damage. Iron Tempest ID now displays Iron
  Rush (Lv22, 3 points): collision-checked ground rush and one 3x frontal strike.
  Save IDs stay stable. Passive talents remain separate.

## Art and limitations

Built-in image generation created `public/assets/items/equipment-v1.png`
and `public/assets/effects/combat-arts-v1.png`. Source images were visually
inspected. Icons use a shared four-by-four sheet; effects use inset GPU frame
rectangles to exclude guide seams. Effects clean up on animation completion,
cast cancellation or destruction. Projectiles keep swept wall/hit checks.

Original skills retain their approved hero poses. Ember Snare and Iron Rush now
use dedicated complete casting/thrust strips; Renewing Light reuses Crown Rally
as requested. Original skill icons are unchanged.
The modular hero integration now loads sword-free locomotion/attack/skill
variants from `public/assets/characters/leigneron/modular`, preserving the
original files. A shared sword atlas uses Bag's weapon designs; per-frame grips,
mirroring and glove occlusion drive carried/attack/skill presentation. This
applies to swords/greatswords, not new bow/axe/staff animation models. Runtime
appearance, GPU frame registration and grip alignment are NOT verified yet.

Sword registration now uses artwork-specific handle centers and blade-tip axes
(including curved cutlasses and asymmetric boss swords), rather than generic
alpha-box percentages. Movement grips follow the visible foreground glove per
frame, with corrected neutral/skill poses. The layer inherits parent rotation,
mirroring and density-aware scale; the original glove covers the handle. These
are source-image/code corrections, not a completed rendered/GPU review.

Final source audit: cancelled casts immediately publish their cleared UI state;
skill cooldowns, persistent fields, healing and projectiles share the same capped
active-play delta. Projectiles reject untargetable enemies and only perform
line-of-sight checks after a geometric hit candidate, reusing the enemy list
across swept steps. Purchases require the actual merchant's completed dialogue
with no unresolved choices; equipment changes reject casting/dialogue/cinematics.
Shop classification uses occupation titles rather than incidental lore text.
Opening a menu synchronizes actual player vitals before Bag potion use, avoiding
healing from an outdated throttled HUD snapshot.
The five-second back-rest timer also uses active-play time, so menus don't
silently expire it. No tests, builds or rendered checks were run for this audit.

Movement attachment correction: sword/glove positioning now runs after Arcade
Physics POST_UPDATE has applied the final player displacement. The attack body
also follows that final position. The listener is removed with the player; the
combat-rest timer advances only in active gameplay, not this rendering callback.
Two side-walk grip anchors were corrected to the visible glove. Source inspection
only; this change has not been runtime/GPU verified.

New-skill effects now respect authored sprite orientation: Iron Rush gust/impact
rows face right and mirror with the side-thrust pose rather than rotating ground
debris upside down. They follow the current frame's weapon-grip registration
after physics, with impact offset toward the blade tip. Ember Snare's contact
flare occurs at 600 ms; the marked fire field/pulses stay planted at their ground
base. Renewing Light's upright healing pulses follow the player's feet beneath
the Crown Rally pose. Ground effects use rectangular proportions and ground-base
pivots, without additive blending of their opaque stones/plants. Attachments
and event listeners are cleaned up on cancellation/destruction. No runtime
verification was performed for these effect changes.

Iron Rush targets an eligible selected enemy without the former 240-pixel skill
range limit, falling back to the nearest eligible enemy within 240 pixels or
facing direction. A fixed cast-start travel budget reaches the target's captured
position, stopping short (38 pixels, or 52 for bosses). Only untargeted travel is
capped at 160 pixels. Target selection/visibility and walls still apply; this is
not free teleportation or chasing an ever-moving endpoint. Swept 8-pixel steps
retain terrain/object/wall checks. Pre-cast physics
displacement is discarded and held movement/dash/sprint stay locked through the
completion frame. This replaces the unsigned-distance loop that could grant
extra forward movement after overshoot. Source changes only, no runtime tests.

Iron Rush now chooses complete upward/rear, downward/front or mirrored side
thrust art at cast start according to the target/facing direction's dominant
axis. Vertical poses have separate frame grips and scale/feet registration;
their gust/impact pivots and blade-tip offsets follow the same vertical axis.
Animation keys are unique per direction. Cast times, damage, stamina, cooldown,
targeting and fixed-endpoint travel are preserved. No tests/builds/game launches ran.

Bag now has Weapons/Potions categories, search, strongest-first ordering,
equipped summary and explicit damage differences. Stats has Usable Skills,
Attributes and Passive Talents tabs, four slot cards and derived attack damage.
Short-screen scrolling stays inside the content area beneath the fixed tabs.

Player progression is capped at level 50, including reward XP and save loading.
Local development grants level 50 and its unspent progression-point difference;
normal release progression is unaffected. Max-level HUD/Stats show the cap rather
than a nonexistent next level. New combat arts retain level gates: Ember Snare
18, Renewing Light 20, Iron Rush 22, with learning-point costs and four equipped
arts maximum. Merchant stock includes potion suppliers such as quartermasters,
bowyers and fletchers; smiths/armorers/runesmiths also sell swords.

Boss-drop swords have explicit effect palettes shown in Bag: crimson, violet,
ice blue, root green, amber, gold or ember red. All seven skills' independent
effects use shared neutral-shaded atlases with the captured cast palette;
projectiles, trap pulses and renewal pulses retain that palette for their
lifetime. The four older skill strips' isolated baked energy colors are also
recolored in their existing prepared atlas, with sparse original RGB backups
for exact restoration. Body guards deliberately leave energy overlapping the
protected hero silhouette untouched; perfect recoloring there would require
separately authored body/FX layers. This is an outstanding visual limitation,
not verified complete tint coverage. Original icons/files are preserved.

Palette masks are prepared during loading; no per-frame canvas readback and no
atlas per weapon. The back mount uses a stable foot-relative torso anchor rather
than changing cape bounds. Obsolete no-pose/stance fallback was removed now that
every skill has animation art. Source/audit only: GPU frame containment, palette
boundaries, hand registration and mobile performance remain runtime-unverified.

Earlier verification, BEFORE the distinct-skill redesign: type checks passed.
Two focused browser tests passed
for real React components/store actions at desktop and phone landscape/portrait
sizes, including touch input and DPR 2. Buying, gold deduction, potion use,
equipping and skill learning/assignment were exercised. Screenshot review fixed
shop scrolling, dialogue text contrast, skill-name overflow and portrait
dash/joystick overlap. The touch-layout test passed again after that final fix.

Full-world browser attempts stalled during startup (one recorded loading
progress 0.5686, no reported asset error or page exception). They were stopped;
directional combat and GPU skill effects remain UNVERIFIED. The isolated UI
fixture is partial coverage, not evidence that the complete game works.
The full-world diagnostic is opt-in with `FULL_EQUIPMENT_REVIEW=1` so an
unfinished startup investigation does not slow the default browser suite.
No production/APK builds were run. Prior spider/cart fixes were
committed and pushed first as `1adb5ad`; these equipment changes remain local.
The subsequent trap/rush/interrupted-regeneration changes and staged sword-free
body sheets have NOT been runtime tested. No tests or builds ran in that pass.

Release-readiness follow-up: production TypeScript/web build and Android asset
sync passed after adding shared typed hero-frame metadata. A new painted basic
attack icon replaces only the normal Attack button artwork; all skill icons are
preserved. Crescent Flurry restores the approved four simultaneous original
slash animations on each of its ten pulses, rather than one substituted cleave.
Original spacing, six-frame slash phases/cadence and all-direction damage remain;
a shared neutral slash atlas preserves boss-weapon tinting. This is build/source
coverage only, not a runtime rendering or gameplay verification.

## Generation prompts

### Equipment atlas

Game inventory icon sprite atlas, transparent background, painted pixel-art medieval fantasy RPG matching chunky gold-outlined detailed sprites, not modern flat icons. Square 1024x1024 canvas, EXACT 4 columns x4 rows equal256px cells, one fully contained upright item centered in each cell with 24px transparent padding, no labels/no frames/no shadows/no characters. Row1: simple iron straight sword brown grip; better steel sword green leather/gold guard; noble tempered sword blue grip silver fuller; dwarven forged sword dark steel gold runes. Row2: bandit captain's chipped steel sword crimson wrap; moonlit spectral sword violet crescent guard; mountain troll-inspired stone-edged sword iron grip; armored orc chieftain tusked jagged iron sword red cloth. Row3: root guardian vine-wrapped stone sword green gem; pirate king ornate curved gold cutlass blue grip; ice wyrm crystalline frosted sword blue scales; ash oracle obsidian sword purple ember runes. Row4: ember dragon sword black scale hilt glowing orange-red blade; corked crimson healing potion; corked green stamina potion; simple leather pouch with gold coins. Same scale, crisp readable silhouettes and consistent art across all16 items. Genuine transparent gutters, no clipping/bleeding.

### Combat effect atlas

Transparent game VFX sprite sheet for a detailed painted pixel-art medieval fantasy RPG. EXACT 4 columns by4 rows on1024x1024 square, each256x256 cell. Each row one effect animated across4 frames: forming, expanding, peak, fading; SAME CENTER and equal full containment24px padding. Row1 bright cyan-white curved sword energy crescent, sharp core and layered painted wisps trailing to left; row2 amber/gold elliptical ground shockwave with floating rock chips; row3 emerald/gold healing wreath, leaves and radiant motes around empty center; row4 orange-red ember sword crescent with fiery painted wisps. Effects ONLY no people no weapons no text no UI no opaque background. Consistent style, richly textured luminous sprites not simple geometric lines, transparent background and gutters. No overlap between cells, all4 animation frames in each row align coherently.
