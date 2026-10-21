# Boss skill effects

Latest HD/motion revision: [BOSS_MOTION_AND_MAGUS_HD.md](BOSS_MOTION_AND_MAGUS_HD.md).
The original sheet below now accompanies a forty-frame animated motion sheet;
its ground, projectile and seal roles remain, while impact sequences animate.

## Runtime integration

| Boss | Presentation |
| --- | --- |
| Captain Varr | Crimson cross-cuts and a following blade charge |
| Moonlit Warden | Lunar bursts, crescent pursuit, hollow moon impacts |
| Stonejaw | Stone eruptions, crushing dust and outer rock impacts |
| Krag / Iron-Tusk | Amber axe sweeps and a following warpath trail |
| Rootfather | Seeking roots and a hollow crown of thorn eruptions |
| Salt King | Briny cannon impacts and spectral boarding trails |
| Frost Wyrm | Ice eruptions, glacial pursuit and a hollow ice crown |
| Ashen Seer | Orange-cored ash omens and outer smoky eruptions |
| Varkhul | Sustained mouth-registered fire, flight, skyfall and ember impacts |
| Grand Magus | Existing authored elemental spells, plus shadow staff contact |

`BossCombat` owns non-dragon hit areas, warnings, staged zones, projectile travel
and charge collision. `BossSkillVisual` follows phase transitions without owning damage.
Effects ease from transparent over 100 ms, bloom, then smoothly decay. Gathering
glows and moving charge effects retire from their current appearance over
160/240 ms. Magus interruptions also retire from the current appearance rather
than cutting off afterglows. Scene/actor destruction releases owned objects.

Ring impacts use eight smaller sprites around the annulus and preserve its
visible safe centre. Each boss pool contains at most 24 reusable sprites, allowing
successive eight-part rings to overlap their fade tails without replacing live art.
There are no particle emitters, new damage timers, per-frame texture uploads,
canvas readbacks or additional rendering loops.

Eighteen frames share `public/assets/effects/boss-skills-v2.png`: 768x1536 pixels,
3x6 cells of 256 pixels, complete artwork fitted uniformly into a 208-pixel
extent with transparent gutters. `BossSkillArt` fetches and decodes the optional
sheet once per scene, outside the cold boot path. Cave/tower entry prefetches it.
Loads have a deadline, bounded retries, abort and disposed-scene guards. If the
image cannot load, warnings and damage still function. No save schema changes.

The v2 sheet retains the original nine impacts and adds nine separately authored
attack assets: a single sword crescent, lunar comet, ground rubble ridge, axe
charge wake, low thorn bed, spectral cannonball, low forked frost, cursed eye and
molten ground wave. Slashes and charges use the appropriate silhouettes; root,
ice, stone and ember eruptions settle over different ground art. Ring waves use
ground fragments rather than eight repeated upright explosions. Ash impacts
retain a rising omen. All layers use the existing bounded pool and combat clock.
The one shared GPU sheet occupies approximately 4.5 MiB of RGBA texture storage
before renderer overhead. It is optional and decoded once; no boot-time asset
expansion, pixel processing in combat, emitter systems or new update loops.

Completed warning geometry retains its graphics command buffer while positions,
depth and fades can update independently. Hidden warnings avoid repeated clears.
Expired zones are skipped, and already-cancelled controllers avoid repeating
cleanup. These are source-level workload reductions, not measured FPS results.

## Level-75 World Ascension

The saved `breakthrough:world-ascension` flag selects the exact tower profile for
each of the nine world bosses, including Varkhul's dedicated dragon controller.
It is the optional challenge Edmund offers at level 75, separate from the first
breakthrough that unlocks leveling from 50 to 75. Normal-world encounters and the
initial Varkhul breakthrough trial retain their earlier progression.

Profiles resolve on spawn or when the existing scaling refresh detects a flag
change. Already-loaded bosses switch without respawning or recreating their
controllers. HP fractions, scaling, rewards, boss IDs and saves retain existing
rules. Airborne Varkhul finishes his committed landing before the next move set.
Tower fixed encounter stats and room coordinates never move into the overworld.

Ascended bosses keep an alerted fight within a 900px leash instead of cancelling
long-range tower attacks as soon as the player exits their smaller detection
radius. World offsets use a bounded set of local placement probes at commitment;
lanes still clip to collision, including the Salt King's deck. His cannon salvos
now traverse their warned lanes, with swept collision advancing with each ball
and a contact splash at the endpoint. No per-frame navigation or placement scans.

## Tower mechanics and Magus registration

| Boss | Distinct mechanics |
| --- | --- |
| Varr | Locked left/right sword sectors; a rear return cut at low health; pursuing thrusts |
| Warden | Paired flank seals, a delayed central moonfall, and four-way moon traps |
| Stonejaw | Outward earthquake bands; staggered falling summits; a delayed inner collapse |
| Krag | Long committed charges followed by left/right axe executions; narrow heavy cleaves |
| Rootfather | Thorn prisons and labyrinths with persistent, individually warned patches |
| Salt King | Staggered parallel cannon lanes, crossing batteries, and boarding lunges |
| Frost Wyrm | Forked advancing ice fangs that linger; inward-closing ice bands; glacial charges |
| Ashen Seer | Predicted trails and delayed echoes of the original marked position; receding ash bands |
| Varkhul | Dedicated grounded breath, circling flight, fixed skyfall landing and stomp controller |
| Magus | Shadow seals, fireball arrivals, grounded thunder, a travelling ice lance and hollow eclipse |

Staged attacks lock at commitment and use at most six reusable warnings. Each
zone fills toward its own impact, remains filled while dangerous, and stops
damaging when it expires. Each zone can hit the player once. Circle offsets are
contained inside the tower floor; lanes stop at collision. Cancellation removes
pending and lingering damage synchronously; visuals retire through their fade.
No new damaging timers, world scans, save fields or per-frame asset processing.

The Magus's authored fire head, ice tip and lightning ground contact are registered
in the small spell atlas. Preparation/release palm positions respect the actor
transform. Lightning's base now meets the marked ground instead of using an
arbitrary vertical offset. The ice lance traverses the warned lane in 700 ms;
its swept hit checks advance with it, and its contact bloom appears at the player
or lane endpoint. Close staff defence alternates with spell selection, preventing
melee range from replacing the entire spell rotation with repeated staff strikes.

Additional v2 masters: `docs/art/boss-skills-companion-v2.png` and
`docs/art/boss-skills-companion-padded-v2.png`. Built-in image generation created
these assets. `node scripts/pack-boss-skills-v2.mjs` combines the padded v1/v2
masters, checks that source silhouettes do not touch cell seams, and writes the
runtime sheet. Masters and the packed sheet were visually inspected; rendered
combat, collision timing, mobile GPU appearance and FPS remain unverified.

## Varkhul controller repair

Previously an explicit tower combat profile routed the dragon into generic
`BossCombat` instead of `DragonCombat`, bypassing flight and fire breath.
Dragons now retain their dedicated controller, including tower profile poise,
boss status resistance and full warning times. The tower move data selects
breath, flight and stomp; its normal and low-health sequences remain distinct.

Tower coordinates come from the existing circular room, never Darkav's lair.
Takeoff eases inward, flight is contained, landing points and their circles stay
inside the arena, and the breath's warned and damaging cones share a fixed,
arena-clipped range. Complete existing ground and flight poses crossfade during
takeoff/landing. Mouth registration, artwork scale and body proportions remain.
Indoor warnings, fire, flight and shadows use the existing interior depth space.
The overworld keeps its original arena and attack sequence.

## Authoring and verification

Built-in image generation used the approved Magus spell sheet and Ashen Seer
action board as style references. Recoverable masters:
`docs/art/boss-skills-v1.png` and `docs/art/boss-skills-padded-v1.png`.
`node scripts/pack-boss-skills.mjs` performs mechanical extraction, uniform
resampling and padding; it does not launch or simulate the game.

Source artwork and the packed sheet were visually inspected. Runtime/GPU frame
registration, takeoff/landing proportions, warning alignment, fade appearance
and device FPS have not been validated in gameplay. No game, browser tests,
unit tests, development server or production/APK build was launched for this task.

Generation prompt:

> Create a production SPRITE VFX ATLAS for this detailed top-down fantasy RPG, matching reference 1's spell rendering and reference 2's warm hand-painted enemy style. References only, do not edit existing files. ONE SQUARE transparent PNG with EXACTLY 3 equal columns and 3 equal rows, NINE isolated combat effect sprites. Each sprite centered inside its own cell, equal cells, generous 12% transparent padding on ALL edges of every cell, no art crossing grid seams. No drawn grid, no labels. These are real in-world attack effects, NOT skill-button icons, NOT emblems or cards. No characters, no complete held weapons, no backgrounds or terrain slabs. Rich painted shapes with clear silhouettes, sharp detailed edges, subtle glow and genuine alpha around each sprite. Row 1 left: a sharp crimson-gold intersecting TWO-STROKE sword energy slash, X shaped, dark red trailing wisps (Varr). Row 1 middle: silvery violet crescent-moon burst with a distinct open crescent and three pale lunar wisps (Moonlit Warden). Row 1 right: jagged tan basalt rock eruption with outward brown stone shards and pale dust, isolated transparent ground impact (Stonejaw). Row 2 left: a broad copper-orange axe swing energy crescent with serrated glowing amber edge and iron sparks, no axe weapon (Krag). Row 2 middle: twisting thick brown roots and sharp green thorn shoots erupting upward/outward, small emerald spores, no ground slab (Rootfather). Row 2 right: turquoise briny cannon-impact splash with a dark iron cannonball fragment, sharp seafoam spray, tiny golden sparks, spectral pirate broadside impact (Salt King). Row 3 left: sharp tall cyan-white ice spear cluster erupting from a compact frost burst, crystalline chips, no terrain slab (Frost Wyrm). Row 3 middle: ominous orange-cored black ash eruption surrounded by smoky violet curls and small cinders, distinct from bright fire (Ashen Seer). Row 3 right: dragonfire detonation, white-hot amber centre, curling red-orange fire tongues and small dark molten fragments, distinct broad explosive flame bloom (Varkhul). Keep each complete sprite centered and fully contained with transparent separation. Flat square atlas, slight top-down three-quarter perspective for upright eruptions, crisp fantasy game VFX. No interface frames, no circles of opaque background, no text, no watermark.

Containment edit prompt:

> Precise atlas containment edit. Preserve all NINE existing finished fantasy combat VFX designs and their exact 3x3 order, colors, materials, detail, separate identities and square canvas. ONLY uniformly shrink each COMPLETE effect sprite WITHIN ITS OWN equal grid cell to roughly 65% of that cell's width and height, recentering it so there is a broad genuinely transparent gutter on all four sides of every sprite. Keep every flame tongue, crescent tip, root tip, ice point and floating stone completely contained. No clipping, no glow crossing a cell boundary, no mixing adjacent designs, no new objects or text. Exact equal 3 columns and 3 rows; NO drawn grid lines. Background remains genuinely transparent. These are in-world effect sprites, not framed icons. The crucial change is generous consistent transparent margins and complete silhouette containment for GPU sprite-sheet sampling.


## V2 generation prompt

> Use case: stylized-concept. Production in-world fantasy RPG VFX atlas, a NEW companion sheet to reference 1. Reference 1 defines nine boss materials and detailed painted pixel-RPG style; reference 2 defines directional projectile quality. Generate ONE square genuinely transparent PNG with EXACTLY 3 equal columns and 3 equal rows, nine isolated effects centered in cells, every silhouette and glow contained inside central 65% of its cell with broad transparent gutters. No grid lines, text, frames, cards, icons, terrain squares or characters. These are different functional attack assets, NOT recolors or repetitions of the impact sprites in reference 1. Row 1 left: Varr's SINGLE elegant thin crimson and gold curved sword energy crescent, tapered ends, long trailing wisps, cut sweeps toward RIGHT, not an X. Row 1 middle: Warden's silvery violet lunar COMET, bright crescent tip toward RIGHT, narrow streaming starlight tail extending LEFT. Row 1 right: Stonejaw's LOW spreading jagged shattered basalt ground ridge, short upright stones and lateral dusty fractures, wide ground-level shockwave fragment, not a tall explosion. Row 2 left: Krag's narrow forward amber molten AXE CHARGE wake, bright pointed splitting front toward RIGHT, long copper sparks trailing LEFT, no held axe. Row 2 middle: Rootfather's LOW circular bed of tangled thorn vines, visibly curling woody roots across ground with several short sharp green thorns, open transparent gaps, NO dirt/sand/grass base slab, not a tall tree. Row 2 right: Salt King's spectral CANNONBALL projectile, dark iron ball at RIGHT with turquoise seafoam spiral and tiny golden sparks, long wispy tail extending LEFT, no impact splash. Row 3 left: Frost Wyrm's LOW ground ice formation, branching cyan frost cracks and short crystalline fangs in a forked ground-level spread, transparent holes, not a tall single ice spike. Row 3 middle: Ashen Seer's violet-and-orange cursed eye OMEN, central orange vertical slit with asymmetric curling violet-black smoke and a few tiny ember specks, not a generic spherical fireball or explosion. Row 3 right: Varkhul's LOW crescent of molten ground fissures with a shallow outward wave of red amber flame, dark volcanic chips, transparent gaps, not an upright explosion. Keep exact 3x3 order, crisp detailed fantasy materials, restrained alpha glow, wide margins. Directional projectiles face RIGHT. Ground formations have subtle overhead perspective and no opaque ground tile. Preserve transparent background.

Reference 1: docs/art/boss-skills-padded-v1.png. Reference 2: public/assets/enemies/grand_magus/spells-v1.png.

V2 containment edit prompt:

> Precise atlas padding edit. Keep these EXACT nine finished effects and exact 3 by 3 cell order, colors, brushwork and transparent background. ONLY uniformly shrink EACH COMPLETE effect to 60 percent of its equal square grid cell, CENTER each in its own cell. Need very wide TRANSPARENT gutters on EVERY side including BETWEEN cells. No effect, spark, tail or glow may approach or cross a grid seam. Preserve each whole silhouette without clipping tips. The lower-left ice formation must fit completely inside its cell too. All nine designs remain unchanged, no text, no grid lines, no new artwork, no tile backgrounds. Result ONE square PNG with 3 equal columns and 3 equal rows and broad fully transparent separation.
