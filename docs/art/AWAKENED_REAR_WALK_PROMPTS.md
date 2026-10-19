# Cape-covered cosmetic rear walk replacement

Generated with the built-in image tool. Only rear walking is replaced. Final
full-resolution sources are `awakening-source/<slug>/walk-up-v4.png`, each with
a `walk-up-v4.layout.json` declaring three columns and two rows. Whole subjects
are isolated before packing, so approximate cell spacing never crops a neighbor.
Older v1/v2 sources remain.

## Front-idle cape correction (v5)

Only Warden, Iron-Tusk, Salt King and Varkhul receive `walk-up-v5.png` masters
and matching 3-by-2 layout files. Other outfits retain their approved v4 rear.
These four had the largest rear/front cape-width discrepancies at equal body
height. The built-in image tool redraws the cape rather than squeezing the
whole character or changing runtime body scale.

Edit prompt set: image 1 is the existing v4 rear-walk sheet; image 2 is the
same outfit's actual front-idle atlas. Change only cape tailoring: reduce
widest-hem flare by approximately 18% for Warden, 15% for Iron-Tusk, 18% for
Salt King and 21% for Varkhul. Match the front-idle cloak width at equal
head-to-boot height. Preserve head, hood/hat, shoulders, torso, total height,
ankle-length hem, boots, six alternating foot poses, original palette, piping,
embroidery and rear motif. Arms/hands remain hidden under the cloth. Retain
the detailed outlined pixel-RPG style, restrained walking cloth sway, six
complete rear-facing poses in three columns by two rows, generous clear
gutters and actual transparency. No sword, floor, shadow, labels, glow or
costume redesign. Never shrink the whole body or stretch individual limbs.

Salt King and Varkhul also received a targeted follow-up using the narrowed
rear as target and the base `walk_up.png` as the walking reference: preserve
the narrowed cloth exactly while drawing distinct small left-contact, passing,
right-contact and opposite push-off poses. Both boots must exist in every
complete pose (one may be partly covered); do not repeat one centered boot.
Retain covered arms, proportions, transparency and all costume details.

The rear packer prefers v5 when present and preserves every other manifest
state. Old masters remain for recovery. No game/browser tests or builds are
run for this correction; rendered gameplay still needs manual verification.

The authoritative anatomy/pose reference is
`public/assets/characters/leigneron/walk_up.png`. Its WebP counterpart was also
inspected. Each outfit's existing `walk-down-v1.png` and `walk-side-v1.png` are
the material/profile references, not replacement pose references. An initial
exposed-arm draft was rejected, corrected by the prompt below, and never
installed in the game.

## Final shared edit prompt

Use case: precise-object-edit / identity-preserve. Production six-frame game animation correction.
Image 1 is the edit TARGET: one costume's 3-column 2-row rear-walk animation. Image 2 is the AUTHORITATIVE base rear walk. Images 3 and 4 show the SAME costume's approved front and side materials. Keep Image 1's headwear, palette, rendering detail, six separate fully contained poses, image dimensions and 3x2 layout.
CRITICAL CHANGE: match Image 2's CLOAK-COVERED rear silhouette. His arms, hands, gloves and bracers are COMPLETELY HIDDEN UNDER THE CAPE in ALL SIX frames. NO VISIBLE ARMS, NO VISIBLE HANDS, NO VISIBLE GAUNTLETS, NO elbows pointing outward, NO shoulder plates outside the cape, NO diagonal arm swing. The cape drapes FROM THE NAPE OVER BOTH SHOULDERS AND ARMS as ONE BROAD CONTINUOUS TRAPEZOID, like the base. Closed back with no long center split exposing torso or thighs. Only head/hood above and two small boots beneath the hem are visible. Retain the costume profile by its specific fabric color, lining glimpsed only at hem, piping, embroidery and small consistent rear heraldry. A cape viewed from BACK should show OUTER cloth, not front coat openings. Do NOT paint front-facing badges/diamonds/eyes/skulls on the back of heads.
Keep broad round head and base's short stocky chibi proportions. Rear cloak covers nearly all body. Small alternating grounded boot steps in the BASE frame order with low heels and passing poses, no giant soles, kicking, running or long shins. Walking expressed through small boot changes and restrained cloth ripple only. SAME rear camera and original base body shape in every cell. Do not copy the front or side stance.
Alpha background must be genuinely clear: NO shadow, NO ambient glow, NO colored haze, NO rectangular backing. All six whole figures on transparent background with generous clear gutters. No weapon, lettering, gridlines or extra figures. Crisp detailed painted pixel-RPG style, not vector or 3D. Repaint whole cloaked poses; do not collage limbs or delete arms leaving holes.

## Costume-specific constraints appended to the shared prompt

| Slug | Retained costume profile |
| --- | --- |
| varr | Charcoal cape, restrained silver piping, crimson inner hem and neck scarf, broad brown hair. Hide all arms under one broad cloak. |
| warden | Charcoal cape and rear hood, violet lining and silver edging, discreet violet/silver embroidery. No skull/face on the hood rear. |
| stonejaw | Slate-gray cape, gold hem and rune diamonds, brown hair; all silver shoulder armor and gloves underneath. |
| iron-tusk | Sand-cream outer cape, bronze-gold rim, orange nape/inner hem, rear bronze circlet; all tusked shoulder armor concealed. |
| rootfather | Forest-green cloak, pale-gold rim and root/tree embroidery, brown hair; all emerald pauldrons and armored arms concealed. |
| salt-king | Black/navy cape, rich gold embroidered hem, burgundy inner hem, rear compact black/gold tricorn, small brown boot steps. |
| frost-wyrm | White/icy-blue cloak, silver piping and frost embroidery, brown hair and thin rear silver circlet; all blue/silver armor underneath. |
| ashen-seer | Charcoal/blood-red cape and rear hood, ember-red/gold rim and embroidery; no face, skull or eyes on the hood rear. |
| varkhul | Black cape, gold/ember-red embroidered hem and restrained flame emblem, dark-red lining, small black circlet; dragon pauldrons underneath. |

## Production preparation

`node scripts/pack-awakened-rear.mjs` prepares only the nine rear states, without
a game, development server or browser. It uses existing whole-subject isolation,
a shared 76-unit body reference, stable head registration, and the original
base's six boot-contact offsets. Source alpha is retained; transparent gutters
are added with premultiplied-alpha resampling. The rear gripping point stays
underneath/behind the cape, so equipment cannot add a visible glove patch.
Runtime manifests retain every other pose and existing texture name.

No tests, game launches or builds were run for this replacement. Previous
`test-results/awakening/index.html` captures predate these v4 sprites; they are
not verification of the new artwork.

