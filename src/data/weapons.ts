import type { WeaponDefinition } from '../game/types';

export const WEAPONS: WeaponDefinition[] = [
  { id: 'roadwarden-sword', name: 'Roadwarden Sword', kind: 'sword', tier: 1, damage: 18, reach: 58, cooldownMs: 330, staminaCost: 8, description: 'Leigneron’s dependable iron sword. Balanced and easy to maintain.', regionAffinity: 'trandum' },
  { id: 'oak-shield-blade', name: 'Oakguard Blade', kind: 'sword', tier: 2, damage: 24, reach: 60, cooldownMs: 340, staminaCost: 9, description: 'A Trandum guard blade with a reinforced spine.', regionAffinity: 'trandum' },
  { id: 'narenthil-longbow', name: 'Narenthil Longbow', kind: 'bow', tier: 2, damage: 28, reach: 280, cooldownMs: 520, staminaCost: 10, description: 'A smooth-limbed forest bow built for patient, accurate shots.', regionAffinity: 'narenthil' },
  { id: 'nardorous-spear', name: 'Nardorous Spear', kind: 'spear', tier: 2, damage: 30, reach: 86, cooldownMs: 510, staminaCost: 11, description: 'A long mountain spear made for narrow passes and mounted patrols.', regionAffinity: 'nardorous' },
  { id: 'rindass-cleaver', name: 'Rindass Cleaver', kind: 'axe', tier: 2, damage: 36, reach: 62, cooldownMs: 610, staminaCost: 14, description: 'A heavy orcan field axe that rewards committed swings.', regionAffinity: 'rindass' },
  { id: 'deepford-crossbow', name: 'Deepford Crossbow', kind: 'crossbow', tier: 3, damage: 44, reach: 320, cooldownMs: 820, staminaCost: 12, description: 'A compact dwarven crossbow with a geared draw mechanism.', regionAffinity: 'druganwoods' },
  { id: 'portquill-cutlass', name: 'Portquill Cutlass', kind: 'sword', tier: 2, damage: 27, reach: 54, cooldownMs: 285, staminaCost: 7, description: 'A fast naval blade suited to decks, alleys, and close quarters.', regionAffinity: 'portquill' },
  { id: 'darkav-emberstaff', name: 'Darkav Emberstaff', kind: 'staff', tier: 4, damage: 56, reach: 250, cooldownMs: 720, staminaCost: 18, description: 'A dangerous volcanic focus banded in black iron.', regionAffinity: 'darkav' },
];

export const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map((weapon) => [weapon.id, weapon])) as Record<string, WeaponDefinition>;
