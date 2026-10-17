# Bestiary, lore journal and weapon effects

Open with B, HUD Lore, the pause menu, the quest journal or the bag's lore link.
J retains the existing quest journal. The new panel pauses gameplay through the
existing modal/input guard and supports search and independent list/detail
scrolling on desktop, portrait phones and short landscape screens.

The journal contains descriptive world lore: creature habits, qualitative
observations, characters, settlement descriptions, regional history, and weapon
appearance/provenance/legends. It does not display weapon stats, effect chances,
shop prices, kill totals, or loot probabilities. Exact equipment information
remains in the bag and merchants.

## Discovery and persistence

- Creatures are recorded when visible and eligible for targeting, or when hit.
- Bosses retain their named boss identity alongside their creature family.
- Normal, boss and finite story battles record defeats, including lethal status ticks.
- Conversations unlock character records; entering a region unlocks its history.
- Owned and acquired weapons unlock profiles. Unknown catalog entries are hidden.
- Optional validated `journal` data extends version 6 without changing storage keys.
  Old saves start with owned weapons, defeated bosses, their current region and
  shrine regions. Historic ordinary kills and conversations are not invented.
- Status timers are transient and clear when actors unload. Damage already dealt
  remains in the existing content ledger. Menus and lost focus pause status time.

## Artwork and equipment

Profiles were authored against `public/assets/items/equipment-v1.png` and existing
weapon/boss origins. No character or enemy artwork was edited. New regional
crafted variants reuse the complete vine, ice-crystal and flame sword cells with
the existing equipped-sword handle registration. They are sold by existing
eligible local traders and smiths, with level and gold requirements:

| Sword | Region | Level | Gold | Effect |
| --- | --- | --- | --- | --- |
| Verdant Adderblade | Narenthil | 12 | 480 | 12% poison chance |
| Skallheim Rimeblade | Frostlands | 18 | 850 | 12% frost chance |
| Cinder-forged Sabre | Darkav | 22 | 980 | 12% burn chance |

All 23 existing/new weapon definitions have provenance and technique profiles.
Ordinary iron stays mundane. Reinforced/precision blades can expose a guard;
ragged blades bleed; living thorns poison; ice/moon blades chill; obsidian and
dragon-forged blades burn. Existing boss skill palettes remain cosmetic and
separate from these mechanics. Merchants show the effect name/chance before purchase.

## Balance and combat integration

Only player normal weapon hits pass `weaponId` into `Enemy.takeDamage`.
`WeaponStatusSystem` applies one non-stacking effect per victim, with 12–18%
trigger chances and a six-second shared cooldown. Neither arts, ally support
nor status damage can recursively trigger an effect. Switching weapons cannot
bypass an active victim's effect or cooldown.

Burn/poison/bleed damage uses the triggering weapon's base damage, never victim
maximum HP. Effects deal at most 48% of that base damage over 3–4 seconds before
resistances; bosses take half. Ticks do not roll luck, stagger, or apply armor
again. A lethal tick follows the existing scene defeat/reward/save path once.

Frost reduces ordinary creatures’ movement and attack speed by 35%. Bosses slow
by 15%, for at most 1400ms. It does not hard-freeze or interrupt them. Attack
windups, recovery, animation playback and cooldowns use the same rate; an
in-flight windup timer and its warning adjust when frost starts or ends. Dragon
ground attack phases slow without interrupting ground/flight transitions.
Expose increases direct player damage by 12%, or 6% on bosses, without removing armor.

`creatureLore.ts` supplies both combat susceptibility and displayed weaknesses.
Examples: fire harms wooden growth and frozen creatures more; wraiths cannot
bleed or be poisoned; frost creatures resist freezing; Varkhul and the Ashen Seer
are immune to burning. Burning applies a subtle red sprite tint, frost blue,
and poison violet. Tints preserve the species’ original tint, apply to attached
leap/flight visuals, and restore on expiration. Burning and poison damage pulse
once a second for a short duration. A hit flash briefly takes priority over the
status wash. Status labels and a colored health-bar dot also identify the effect.

## Validation status

Automated tests were stopped at the user’s request. The narrative journal,
status tints and attack-slowing revision receive TypeScript checking only;
runtime and rendered verification are left to the user’s manual testing.
