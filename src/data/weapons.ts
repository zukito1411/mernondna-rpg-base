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

// All new equipment uses the existing complete sword combat presentation.
const sword=(id:string,name:string,damage:number,description:string,regionAffinity:WeaponDefinition['regionAffinity'],tier:number):WeaponDefinition=>
  ({id,name,kind:'sword',tier,damage,reach:62,cooldownMs:350,staminaCost:9,description,regionAffinity});
WEAPONS.push(
  sword('steel-roadblade','Tempered Roadblade',30,'A well-balanced steel blade, forged for long journeys.','trandum',2),
  sword('dwarven-forged-sword','Deepforge Sword',39,'Dwarven steel holds a keen edge through the hardest stone.','druganwoods',3),
  sword('royal-tempered-sword','Royal Guard Sword',47,'A Highmere masterwork with a hardened fuller and a sure grip.','trandum',4),
  sword('varr-rededge',"Varr’s Rededge",32,'A chipped raider blade with the captain’s crimson binding. Rare spoil of Captain Varr.','trandum',3),
  sword('moonlit-oathblade','Moonlit Oathblade',42,'Pale moonlight sleeps along the Warden’s crescent edge.','narenthil',4),
  sword('stonejaw-edge','Stonejaw Edge',45,'An iron-bound stone blade, heavy with the mountain guardian’s strength.','nardorous',4),
  sword('iron-tusk-fang','Iron-Tusk Fang',49,'A jagged clan blade crowned with iron tusks.','rindass',4),
  sword('rootfather-thornblade','Rootfather Thornblade',52,'Living roots bind an ancient stone edge.','druganwoods',4),
  sword('salt-kings-cutlass',"Salt King’s Cutlass",55,'An ornate captain’s blade, gilded and scarred by saltwater.','portquill',4),
  sword('wyrm-frostedge','Wyrm Frostedge',59,'Blue scales encase a shard of everlasting frost.','frostlands',5),
  sword('seer-obsidian-edge','Seer Obsidian Edge',63,'Purple embers whisper beneath the oracle’s black glass blade.','darkav',5),
  sword('varkhul-emberfang','Varkhul Emberfang',72,'A shed dragon fang forged into black steel; its edge remembers fire.','darkav',5),
);

export const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map((weapon) => [weapon.id, weapon])) as Record<string, WeaponDefinition>;
