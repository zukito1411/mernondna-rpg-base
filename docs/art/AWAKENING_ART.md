# Awakened boss weapons and cosmetic armor

All artwork uses the built-in image generator, with the original Leigneron
modular sprite sheets as pose/identity references. No original hero, skill,
NPC, boss or item artwork is replaced. A rejected dense all-animation prototype
is not referenced by the game. Production authoring uses **one original-sized
animation sheet per state**, not a sheet containing every animation.

## Forms

| Boss | Final weapon | Cosmetic |
| --- | --- | --- |
| Captain Varr | Nightfall Rededge | Crimson Shadow: charcoal ninja armor and crimson scarf |
| Moonlit Warden | Moonreaper Oathblade | Violet-hooded reaper with an ivory skull mask |
| Stonejaw | Worldbreaker Edge | Slate-and-gold mountain sentinel |
| Krag the Iron-Tusk | Dunebreaker Fang | Bronze/obsidian desert war knight |
| Rootfather | Ironwood Thornblade | Emerald-rooted ironwood plate armor |
| Salt King | Dreadwake Cutlass | Gold-trimmed pirate captain and compact tricorn |
| Frost Wyrm | Wintercrown Frostedge | Silver-blue frost knight |
| Ashen Seer | Crimson Requiem | Dark crimson, skull-masked reaper |
| Varkhul | Sovereign Emberfang | Prestigious black dragon-scale plate with molten gold/red trim |

## Prompt set and references

The full per-form theme specifications are the `description` fields in
`src/data/awakening.ts`. Every form first uses the existing
`public/assets/characters/leigneron/modular/walk-side-body-v1.png` as its edit
target. Its approved six-frame walking output becomes the outfit reference for
that form's remaining sheets. The original corresponding modular animation is
always the pose reference. Rear walking uses `characters/leigneron/walk_up.png`.

Shared prompt specification: **identity-preserve, production animation edit**.
Change only clothing, armor and themed headwear to match the approved outfit.
Preserve the original detailed painted pixel-game style, chibi anatomy, body
scale, exact pose order, alternating steps, gripping fists, facing and floor
registration. Six full bodies per horizontal movement/skill strip; attack uses
the original six-column/four-row layout. Retain the original resolution/aspect
and generous transparent gutters. No held swords (equipment is composited),
no body-part stitching, repeated idle substitutes, opaque backgrounds, labels,
shadows, clipped extremities or neighboring fragments. Keep existing skill
effects outside the body unchanged. Varkhul is the most ornate form; reapers
are clothed humanoids wearing skull masks, not altered skeleton proportions.

Each final weapon and each heart is generated as its own isolated transparent
image, matching `public/assets/items/equipment-v1.png` and its outfit reference.
Weapon prompts require a complete upright sword, readable silhouette, centered
ergonomic hilt, top blade tip, no character/ground/shadow/text. Salt King's is
a curved cutlass; reapers retain swords, not scythes. Heart prompts request one
non-gory heart-shaped magical relic in the matching theme, not a character.

## Files and runtime preparation

- Full-resolution authored sources: `docs/art/awakening-source/<form>/`.
- Runtime images, registration and complete outfit manifest:
  `public/assets/characters/leigneron/awakened/<form>/`.
- Each form has separate front/side idles, front/side/back walking, side running,
  four-direction attacks, and individual original/new skill sheets. Renewing
  Light reuses Crown Rally; Barrage reuses the existing attack/thrust poses.
- `scripts/pack-awakened-hero.mjs` uses production hero registration and isolated
  complete source subjects to prepare one compact GPU atlas **per animation**.
  Three texture pixels per world pixel preserve high-density-screen detail;
  gutters and frame bounds are checked, and atlases stay within 2048 pixels.
  Source illustrations are retained at full resolution, outside the APK assets.
- Connected spell artwork uses the original authored pose regions, not a
  guessed connected-component split or rectangular body-over-effect patch.
  Foreign clothing outside the registered body envelope is excluded. Cosmetic
  spell energy is prepared in the weapon palette; ordinary hero art is unchanged.
- `AwakenedHeroVisual` loads only the selected complete outfit, two prepared
  images at a time, yielding between uploads. It releases superseded textures,
  cancels stale loads and retains normal appearance on load failure. It performs
  no pixel scanning, atlas rebuilding or recoloring during gameplay.
- Original actors keep animation timing, physics and hitboxes. The cosmetic
  follows their current full pose and copies visibility, orientation and tint.
  The equipped sword and glove patch use the cosmetic frame's registered grip.

## Rewards and save compatibility

At any player level, each eligible world-boss victory has a fixed 25% chance
to drop one matching heart, up to 99 stored per boss. Neither breakthrough nor
World Ascension is required; ascended players use the same 25% chance. Luck
does not modify this roll. Cave leaders and summons do not award hearts.
Blacksmiths consume three matching hearts to awaken an owned boss weapon once.
Weapon IDs and enhancement ranks are retained; duplicates still enhance it.
Final forms gain 20% weapon damage, +5 percentage points to proc chance (35%
overall cap), and their named stronger status technique. Existing boss status
resistance, frost limits and six-second proc cooldowns remain.

Equipping the awakened weapon selects its cosmetic automatically. Armor item
stats and set bonuses never change. New optional save ledgers preserve old
saves; development-only local ownership includes every final form.

## Focused verification

- `npm run test:types`
- `npx vitest run tests/awakening.test.ts`
- With a development server on port 5174, the packer checks source isolation,
  frame gutters, grip registration and texture limits.
- `scripts/review-awakened-hero.mjs` renders production cosmetics and equipped
  weapons through WebGL across every pose and mirrored locomotion direction.
  Diagnostic contact sheets/reports go to `test-results/awakening/`.
- `scripts/review-awakening-ui.mjs` checks desktop/mobile bag layout and the
  three-heart blacksmith transaction. These are scoped checks, not a full-world
  campaign or Android performance benchmark. No release build is requested.

Completed checks: TypeScript passed; all four focused logic/save tests passed;
desktop, portrait-phone and landscape-phone bag/forge interaction passed;
all nine outfits rendered 132 pose comparisons each (1,188 total), retaining
15 outfit textures after every switch. A further Frost Wyrm/Varkhul render
checked the final spell-edge palette preparation. Registration checks reported
no opaque GPU gutters or missing gripping fists. At density three, each complete
outfit uses approximately 33–34 MiB of GPU texture storage; only the selected
outfit is retained, with a bounded overlap while its replacement uploads.
Real Android frame pacing and visual acceptance remain device checks, not
claims established by these focused desktop WebGL checks.
