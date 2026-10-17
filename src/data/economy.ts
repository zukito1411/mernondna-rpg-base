import {NPC_BY_ID} from './npcs';
import {TOWN_BY_ID} from './towns';
import {WEAPON_BY_ID} from './weapons';
import {REGIONAL_SWORDS,WEAPON_PROFILES} from './weaponProfiles';

export const POTIONS={
  'healing-potion':{name:'Healing Draught',price:28,hp:50,stamina:0,icon:13,description:'Restores 50 health. No use at full health.'},
  'stamina-potion':{name:'Wayfarer Tonic',price:22,hp:0,stamina:60,icon:14,description:'Restores 60 stamina. No use at full stamina.'},
} as const;
export type PotionId=keyof typeof POTIONS;

/** Only enemies that carry bags or provisions can drop a potion.
 * Wildlife, spirits, bosses and temporary summons cannot spawn supplies. */
const SUPPLY_CARRYING_ENEMIES=new Set([
  'road-bandit','cutlass-pirate','pirate-boatswain',
  'rindass-orc-raider','rindass-orc-spearman',
  'hedge-goblin','goblin-stone-slinger',
]);
export const canDropPotion=(enemyId:string)=>SUPPLY_CARRYING_ENEMIES.has(enemyId);

export const SWORD_OFFERS=[
  {id:'oak-shield-blade',price:110,minLevel:3,icon:1},
  {id:'steel-roadblade',price:290,minLevel:8,icon:2},
  {id:'dwarven-forged-sword',price:620,minLevel:16,icon:3},
  {id:'royal-tempered-sword',price:1050,minLevel:24,icon:2},
] as const;
export const BOSS_WEAPONS:Record<string,{id:string;icon:number;salvage:number;effectColor:number;effectName:string}>={
  'captain-varr':{id:'varr-rededge',icon:4,salvage:90,effectColor:0xff6262,effectName:'Crimson'},
  'moonlit-warden':{id:'moonlit-oathblade',icon:5,salvage:180,effectColor:0xbe9aff,effectName:'Moon violet'},
  'stonejaw-troll':{id:'stonejaw-edge',icon:6,salvage:200,effectColor:0xe6d4af,effectName:'Stone gold'},
  'iron-tusk':{id:'iron-tusk-fang',icon:7,salvage:220,effectColor:0xff9368,effectName:'Tusk amber'},
  rootfather:{id:'rootfather-thornblade',icon:8,salvage:240,effectColor:0x95ec77,effectName:'Root green'},
  'salt-king':{id:'salt-kings-cutlass',icon:9,salvage:260,effectColor:0xffd676,effectName:'Captain gold'},
  'frost-wyrm':{id:'wyrm-frostedge',icon:10,salvage:300,effectColor:0x83ddff,effectName:'Ice blue'},
  'ashen-seer':{id:'seer-obsidian-edge',icon:11,salvage:340,effectColor:0xc58aff,effectName:'Seer violet'},
  varkhul:{id:'varkhul-emberfang',icon:12,salvage:450,effectColor:0xff774a,effectName:'Ember red'},
};
const weaponEffects=new Map(Object.values(BOSS_WEAPONS).map(w=>[w.id,w]));
export function weaponEffect(id:string){return weaponEffects.get(id);}
export function itemIcon(id:string){
  if(WEAPON_PROFILES[id])return WEAPON_PROFILES[id].icon;
  if(id==='portquill-cutlass')return 9;
  if(Object.hasOwn(POTIONS,id))return POTIONS[id as PotionId].icon;
  return SWORD_OFFERS.find(o=>o.id===id)?.icon??Object.values(BOSS_WEAPONS).find(o=>o.id===id)?.icon??0;
}
export function isBlacksmith(npcId:string):boolean {
 const npc=NPC_BY_ID[npcId];
 return Boolean(npc&&/blacksmith|weaponsmith|runesmith|armorer|forgewright|forgemaster|master smith|guild smith/i.test(npc.title));
}
export function merchantStock(npcId:string):Array<{id:string;price:number;minLevel:number}>{
  const npc=NPC_BY_ID[npcId];if(!npc)return [];
  // A story mentioning merchants or a forge doesn't make its speaker a shop.
  const job=npc.title;
  const smith=isBlacksmith(npcId);
  const trader=/merchant|trader|shopkeeper|innkeeper|apothecary|herbalist|quartermaster|bowyer|fletcher|caravan master|caravan broker/i.test(job);
  if(!smith&&!trader)return [];
  const region=TOWN_BY_ID[npc.townId]?.regionId;
  const tier=npc.townId==='oakmere'?2:npc.townId==='highmere'?4:region==='trandum'?3:4;
  return [...(smith?SWORD_OFFERS.slice(0,tier).map(o=>({id:o.id,price:o.price,minLevel:o.minLevel})):[]),
    ...REGIONAL_SWORDS.filter(o=>o.region===region).map(({id,price,minLevel})=>({id,price,minLevel})),
    ...Object.entries(POTIONS).map(([id,p])=>({id,price:p.price,minLevel:1}))];
}
export function itemName(id:string){return WEAPON_BY_ID[id]?.name??POTIONS[id as PotionId]?.name??id;}
