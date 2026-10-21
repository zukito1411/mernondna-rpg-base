# Tower of Might

## Finding and unlocking it

The tower stands 2,400 world units north of Oakmere's centre in Trandum.
The tower, its map badges and its side quest appear only after completing
the final main quest **The Roads We Keep** (`the-last-ward`), including the
return to Marrow Inn, not simply defeating Varkhul.
Then speak with Etheldreda Bell (stable NPC ID
`orin-bell`) at Oakmere shrine. Her side adventure introduces the tower;
entering unlocks it permanently, then return to her with the news.

All authored side-quest givers are registered with the existing NPC dialogue
and overhead exclamation-mark system. Available side quests and relevant
active conversations/hand-ins display a cue; unavailable prerequisites and
finished conversations do not.

## Floors and combat

The tower uses its own dark orchestral score, "Oppressive Gloom" by Kevin
MacLeod (CC BY 3.0; source and license in `public/assets/audio/README.txt`). It streams
locally on entry through the existing two-track crossfade player, continues
through all floors and at night, and restores regional music on exit/death.
Nature/weather ambience is suppressed in the tower. App backgrounding and
the existing audio toggle are respected. Audio never gates startup or entry.

Ten chambers, 50 floors: Varr, Moonlit Warden, Stonejaw, Iron-Tusk,
Rootfather, Salt King, Frost Wyrm, Ashen Seer, Varkhul, then the
Grand Magus of the Shadow Realm. Chambers 1–9 require their original world
boss to have been defeated. Chamber 10 requires Varkhul; the Magus is exclusive
to the tower and never enters overworld boss progression or loot tables.

| Boss floor | Boss |
| --- | --- |
| 1-5 | Captain Varr |
| 2-5 | Moonlit Warden |
| 3-5 | Stonejaw |
| 4-5 | Krag the Iron-Tusk |
| 5-5 | Rootfather |
| 6-5 | Salt King |
| 7-5 | Frost Wyrm |
| 8-5 | Ashen Seer |
| 9-5 | Varkhul |
| 10-5 | Grand Magus of the Shadow Realm |

- Floors X-1 through X-4 contain 10, 12, 14 and 15 enemies respectively,
  with a different enemy species on each floor.
- Enemies arrive in groups of at most five, inside one circular arena with
  a 1,420-unit walkable diameter. Square camera bounds do not define collision.
- Enter each arena from the bottom. The entry door seals behind the player.
  The north door is visibly closed until all defenders are defeated, then
  switches to its matching open sprite. Interact there to ascend.
  Floor X-5 contains the boss echo instead of another mob group.
- Clearing any floor also reveals an animated return portal at the arena
  centre. Interacting opens a desktop/touch confirmation. Cancel stays inside;
  confirm returns to Oakmere and resets the unfinished chamber.
- Boss echoes use distinct, fully telegraphed patterns with the existing
  collision-aware combat controller. Varkhul's tower encounter is a grounded
  ember/wing/charge trial; his world flight encounter is unchanged.
- Echoes do not count as new world boss kills, summon world crews, drop boss
  weapons/hearts, or advance unrelated kill quests. Rewards come from chests.
- A boss chest gives 7,500 gold and 6,000 XP times the chamber number, before
  the existing reward bonuses and level cap. Open it beside the arena; use the
  separate northern door to ascend. Rewards are one-time per chamber per week.
- Tower enemies have **no displayed level and no level-based scaling**.
  They use fixed authored combat stats, unaffected by World Ascension or
  current player gear. Ordinary caves remain fixed-level encounters.
- Boss HP by chamber: 14,000 / 18,000 / 21,500 / 25,500 / 29,000 /
  33,000 / 37,000 / 41,000 / 47,000 / 55,000.
  Base damage is `110 + 11*i`, defense `.14 + .009*i`, with `i = chapter - 1`.
  Move damage multipliers, player armor, VIT and defensive skills still apply.
- Normal HP is `(900 + 110*i + 70*(floor-1)) * clamp(speciesHP/80,.75,1.35)`;
  damage `(42 + 4*i) * clamp(speciesDamage/12,.8,1.4)`; defense `.08+.008*i`.
  Those species templates are unscaled, not level-120 or ascended actors.
- Bosses move 15% faster than their species template. Distinct tower
  combinations keep the original complete warnings (750–1,700ms), with
  between-pattern cooldowns at 70% of their previous tower values. After the
  first bar reaches zero, a protected roar refills it fully; stronger second-form
  combos then start, with cooldowns at 72% of the first form's value.
- Tower boss poise prevents a permanent Crescent Flurry hold. Damage still
  lands; one brief stagger is possible per five-second recovery window.
  Interrupting advances the pattern instead of restarting pattern zero.
  Normal enemies and ordinary world-boss Flurry behavior are unchanged.
- Boss warning/impact depths and wolf leap presentation use interior-aware
  depth offsets, so they are not painted under the tower floor.

These are tuning targets for level-75 awakened/enhanced weapons, armor,
attributes and active dodging—not a measured guarantee of clear time or
difficulty for every build. No automatic enemy scaling punishes better gear.

## Final chamber and legendary treasure

10-1: 10 wraiths; 10-2: 12 thornlings; 10-3: 14 grove spiders;
10-4: 15 goblin stone-slingers; 10-5: Grand Magus of the Shadow Realm.
His violet ground seals, glacial staff lance, fire orb, thunder strike and
hollow eclipse receive full, element-colored warnings. Fire/ice/shadow have
visible travelling casts; thunder descends on its locked ground mark. Nearby
enemies provoke a separate physical staff strike. After his first bar reaches
zero and the roar refills it, he combines spells, retaining each warning. The complete front,
side and rear poses are drawn at one shared scale, with separate casting
and striking frames, never stitched body parts.

Defeat plays six shattering poses and twelve animated escaping bats. After
1.9 seconds the portal and final treasure appear; leaving cancels all owned
timers/tweens/sprites. The final chest awards 100,000G and 90,000 XP before
Luck and the existing level cap, plus all three **Shadow Magus Sovereign**
pieces, guaranteed once. The same idempotent award is banked if the player
leaves before opening the earned chest.

- Three pieces together give 25% lifesteal on actual direct attack/skill
  HP removed, capped by missing player HP. Overkill and NPC damage do not heal.
- Stamina costs (attacks, skills, dashes and sprinting) are multiplied by .55.
- +15 STR/VIT/AGI/EVA/LUK are equipment bonuses, not allocated points; existing
  allocation caps, budgets and saved allocations remain unchanged.
- Pieces plus set total +320 maximum HP and 35% armor damage reduction.
- Partial or mixed sets do not activate lifesteal, stamina savings or +15 stats.
- Armor remains equipment, independent of awakened-weapon cosmetic outfits.

The Magus art joins the existing bounded M14 residency cache, with one lazily
prepared 62-frame body atlas, a small four-frame spell atlas and a short
death-effect lifetime. Neither is boot art. Spell flights and impacts advance
on the active-play clock, not independent damaging timers. The arriving
projectile crossfades into its impact over 180ms; fire/ice/thunder/shadow
afterglows ease to transparent over 1000/900/800/1150ms respectively. Their
visual tails can finish during the next windup without slowing attacks or
causing extra damage. Current patterns peak at nine spell sprites (a projectile
plus eight impact pieces), with a defensive overlap cap of nineteen including
the active projectile. Cancel/death/room exit destroys them. Companion textures share
the boss pack's cleanup. Closing the tower discards pending Magus preparation
without resetting unrelated shared-loader work; enemy image requests have
explicit 15-second XHR timeouts. The body now uses a prepacked 2048x904 HD
atlas: 62 virtual frame IDs share 34 unique whole poses, at density 2. Trimming
transparent space preserves the virtual canvas, boot line, palm registrations,
world height and collision circle. It retains twice the physical body detail
instead of enlarging the old 112px downsample. The body page occupies about
7.06 MiB RGBA before GPU overhead, versus roughly 13 MiB for the old isolated
page. Packing and silhouette scans happen offline, not on entering the arena.
The four-spell preparation remains lazy. Source poses are unchanged and retained.
See `docs/art/BOSS_MOTION_AND_MAGUS_HD.md` for source paths and limitations.

Source review confirmed Continue clears transient dungeon state and restores
the saved exterior position; tower artwork is not part of the startup pack.
These are code-level safeguards, not measured Android performance or a
guarantee against all loading failures. Cold-start/Continue, spell direction,
pause/death/exit cleanup and device frame pacing still require runtime testing.
His model uses an appearance multiplier of 1.8 (25% smaller than the
previous 2.4 version), with a proportional base foot collision radius of 35.
Idle, glide, casting, striking and shattering use the same uniform actor scale.
The close staff strike still warns a 245-unit reach; spells, HP and rewards
are unchanged. HP, damage, rewards and spell
radii have not been doubled. Escaping bat sprites use tight GPU frame cuts.

## Persistence, loading and limits

The tower extends DungeonSystem and InteriorSession, not a second renderer.
Each floor uses the existing bounded dungeon kill mask (15 bits maximum),
claimed flag and version-2 ledger. Existing caves keep their definitions,
20-minute resets, contracts and legacy migration. Missing tower records in
old saves mean an untouched tower. Only boss defeats create weekly
checkpoints: defeating 1-5 means the next entry starts at 2-1; defeating 2-5
means 3-1, and so forth. A mid-chamber portal exit, death or a fresh entry
after quitting restarts that chamber at X-1, not the last cleared floor.
Normal-floor masks support the live climb but never establish checkpoints.
Completed boss records and chest claims last until the weekly renewal. Earned but unopened
boss chests are banked once when ending the run or entering again, so a
checkpoint never strands its reward. Cinematic restoration preserves the
current live floor; it is not treated as a new expedition.

Every **Monday at 06:00 device-local real time**, all tower floor progress,
boss checkpoints and chest claims reset. Equipment, earned gold/XP, story
progress and non-tower caves are retained. Unlocking the tower and Bell's
quest never reset. Calendar dates preserve 06:00 across DST, not a rolling
seven-day duration after entry. `nextTowerResetAt` persists with saves; old
saves without it get the next local Monday without losing existing progress.
Malformed optional reset metadata is repaired without rejecting the save.

Offline expiry is applied on Continue. During a live climb the scene checks
at most once per second of active play; an expired run returns safely to
Oakmere, releases actors/effects and settles earned boss chests before
clearing masks. Menus/cinematics defer that transition until play resumes.
The exit confirmation shows the next renewal date. This offline game trusts
the device clock; there is no server-backed clock-tampering protection.

The tower exterior is requested only within 2,200 units. Arena furniture,
floors and the opened chest load on entry, never in BootScene. Only one arena
is retained across floor transitions. Failed artwork requests have bounded
timeouts; shared interior failure handling returns the player outside.

The tower no longer loads the Highmere noble kit. Its dark circular stone
chamber is `public/assets/interiors/tower_of_might/arena-v1.png`, generated
with the exterior and live stone doors as style references. The radius-710
collision circle, player/AI navigation and minimap agree. Black surrounds
the authored round masonry; no royal wall strips or cream floor rectangles
remain. The centre portal is at (900,900). Southern spawn (900,1400) is
separate from the foreground doorway, so the entering hero is not hidden
under its painting. Other houses, caves and castles retain their layouts.
Source master, prompt and registration notes: `docs/art/tower-interior/`.

## Artwork

Boss phase-two follow-up: see `docs/BOSS_PHASE_TWO.md`. Every echo now has a
latched fury phase, a full HP refill during its protected roar, phase-exclusive
sequences and two red resolve dots beneath the health bar (one dims on the roar).
There is no phase-name/number HUD label. Level-75 World Ascension shares the same tower phase profiles.
Varkhul executes full multi-action rage combos with warned hollow aftershocks.

Built-in image generation was used with the original
`public/assets/sprites/buildings.png` as a supporting style reference.
Runtime asset: `public/assets/world/tower-of-might-v2.png`.
Versioned source master: `docs/art/tower-of-might-source-v2.png`.
The first design remains recoverable in `docs/art/tower-of-might-source-v1.png`.
Matched closed/open doors: `public/assets/world/tower-doors-v1.png`, with the
source master in `docs/art/tower-doors-source-v1.png`. Doors share uniform
packing scale, foot baseline and transparent gutters; only load on tower entry.
Source size: 1,024 by 1,536 with transparent background; runtime size 380 by
570 (uniform scaling). No changes to existing character or boss artwork.

Generation prompt:

> Use case: stylized-concept. Asset type: single transparent game building sprite for Tales of Leigneron. Supporting style reference: the provided existing buildings sheet; match its detailed warm pixel-RPG medieval material rendering, dark crisp outlines, chunky perspective and top-left lighting. Generate ONE mysterious ancient Tower of Might, not a sheet: tall broad cylindrical weathered stone tower, five stacked readable tiers, fortified crown, restrained blue rune seams and gold architectural trim, single south-facing open arched entrance at ground level with short straight steps. Three-quarter elevated RPG building view, south-facing facade, vertical walls matching the existing tower reference perspective, NOT an isometric diamond foundation. Complete tower silhouette and tiny attached stone footings, all edges fully contained with generous transparent padding. No landscape, no sky, no text, no characters, no detached shadow, no UI, no watermark. Tower must look usable as an overworld sprite beside the reference game's Oakmere buildings; stone rather than sci-fi. Centered full building, transparent background.

## Verification

Before the post-story gate, weekly reset and combat rebalance, focused
Playwright desktop and mobile-viewport cases passed: real game boot,
tower entry, five-actor spawn bound, clearing 1-1, sealed/open door frame
containment, central portal confirmation/cancel, north-door transition to
1-2, loading the Magus, bat defeat, final treasure, equipping all three pieces,
25% healing and 45% stamina savings. Screenshots are in
`test-results/tower-of-might/index.html`. The overview camera is test-only;
normal gameplay keeps its usual follow camera and interior bounds. These
screenshots predate the latest balance, title placement and reset UI changes.

Current follow-up: compiler checks only, per the permission-only test policy.
Regression cases were added for the story gate, Monday boundary, fixed stats,
boss patterns, interior warning depth and weekly chest/gear preservation;
they have not been executed. Updated browser setup includes the ending gate.

The fixture seeds previous world victories and tower checkpoints to reach
the final chamber, and clears defenders with test damage. This is not a
complete 50-floor balance playthrough. Real Android performance, all nine
echo fights, full death/resume cycles and sustained combat remain unverified.
Both existing TypeScript compiler commands passed. No APK/production build
was run. Browser contexts close in finally; the runner owns its server and
browser. The test output directory does not erase the existing housing gallery.

## Mysterious revision prompts (built-in image generation)

Tower edit, using version 1 as the edit target:

> Use case: precise-object-edit. Edit target: supplied Tower of Might RPG building sprite. Redesign this same complete tower to be mysterious and ancient rather than a cheerful royal castle. Preserve exact canvas proportions 1024x1536, centered full silhouette, base and south entrance placement, top-down three-quarter RPG perspective, detailed warm pixel-RPG stone rendering, and transparent padding. Replace all royal blue cloth banners, fleur-de-lis and bright golden crowns with worn charcoal-grey stone, tarnished bronze details, narrow unlit windows, unreadable ancient carved glyphs and faint restrained violet-blue light seeping from stone seams. Dark recessed south doorway has a subtle uncanny pale glow inside, visible straight steps. Keep readable stone edges and top-left lighting so tower works in daylight beside the original game buildings. Slight age and cracked masonry, not destroyed, no skulls. Mysterious architectural identity, not a simple recolor. No landscape, fog background, floating pieces, characters, text, UI, watermark or detached ground shadow. Genuine transparent background; entire tower and attached footing fully contained.

Door board generation:

> Use case: stylized-concept. Asset: two-state tall stone doorway sprite board for a detailed medieval pixel-RPG, matching Tales of Leigneron buildings. Transparent 1024x1024 canvas split into EXACTLY TWO equal 512x1024 vertical cells, one complete door centered in each half, with at least 32 transparent pixels on all edges and the shared bottom boot/ground line at y=960. LEFT: CLOSED sealed ancient stone door, heavy fitted charcoal-grey slabs, bronze bands, faint violet carved rune seal across the shut leaves. RIGHT: EXACT SAME doorway structure, scale, perspective, attached steps and stone frame, but door leaves swung open inwards, revealing a dark descending passage with restrained violet light. Front-facing with slight top-down RPG view. Match dimensions and stone-frame silhouette between both states; same top-left lighting. No cloth banners, no royal emblems, no text or labels, no other items, no characters, no background plane, no ground shadow beyond attached footing. Do not cut the arch or steps at cell edges. These must be clean complete matched closed/open door assets, not a scene.

Door containment refinement:

> Precise sprite containment edit only. Keep BOTH complete closed/open stone door designs, details, purple runes, perspective and matching relative scales EXACTLY as shown. Fit both complete silhouettes including top finials and bottom stairs wholly inside their equal left/right half-cells. Reduce each door uniformly to provide a generous fully transparent border of at least 70 pixels on TOP, BOTTOM, LEFT AND RIGHT of each cell, with a clear transparent vertical gap between doors. Do not crop any finial, step or stone edge. No new artwork, no changes to door state, no text, no background. Genuine alpha transparency.
