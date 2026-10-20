export const ARMOR_SLOTS=['chest','boots','cape'] as const;
export type ArmorSlot=typeof ARMOR_SLOTS[number];
export const ARMOR_SLOT_NAMES:Record<ArmorSlot,string>={chest:'Chest',boots:'Boots',cape:'Cape'};
// Measured alpha bounds, not assumed grid cells: the painted poses vary in size.
// Render inside a padded square without stretching or sampling neighboring art.
export const ARMOR_ART_FRAMES:readonly (readonly [number,number,number,number])[]=[
  [95,33,233,214],[428,51,193,192],[698,33,237,215],
  [93,263,246,221],[438,274,190,205],[697,265,248,227],
  [74,504,263,232],[436,508,202,219],[688,508,268,233],
  [84,754,266,229],[440,756,204,228],[704,753,267,245],
  [77,999,263,231],[432,1014,223,214],[710,1006,263,235],
  [79,1237,269,257],[446,1244,209,253],[688,1241,289,259],
];
export interface ArmorBonuses {maxHp:number;damageReduction:number;critChance:number;evasionChance:number;lifesteal?:number;staminaReduction?:number;allStats?:number}
export const NO_ARMOR_BONUSES:ArmorBonuses=Object.freeze({maxHp:0,damageReduction:0,critChance:0,evasionChance:0,lifesteal:0,staminaReduction:0,allStats:0});
export const SHADOW_MAGUS_SET='shadow-magus';
export const MAGUS_ARMOR_ART={path:'assets/items/shadow-magus-armor-v1.png',width:2172,height:724,
 frames:[[27,42,710,658],[843,109,545,571],[1450,20,703,682]] as const};
export type ArmorLoadout=Record<ArmorSlot,string|null>;
export const emptyArmorLoadout=():ArmorLoadout=>({chest:null,boots:null,cape:null});
interface ArmorSet {id:string;name:string;row:number;origin:string;history:string;appearance:string;bossId?:string;price?:readonly number[];minLevel:number;bonus:Partial<ArmorBonuses>;pieces:readonly Partial<ArmorBonuses>[]}
export interface ArmorDefinition {id:string;name:string;setId:string;slot:ArmorSlot;icon:number;origin:string;appearance:string;history:string;bossId?:string;price?:number;minLevel:number;salvage:number;bonuses:Partial<ArmorBonuses>}
export const ARMOR_SETS:readonly ArmorSet[]=[
  {id:'wayfarer',name:'Wayfarer',row:0,minLevel:3,price:[140,90,110],origin:'The leatherworkers and roadside smiths of Trandum.',appearance:'Weathered brown leather, plain iron buckles and moss-green cloth.',history:'Made for long journeys rather than parades. Repairs are deliberately simple enough for a traveler to make beside a campfire.',bonus:{maxHp:20,evasionChance:.015},pieces:[{maxHp:12,damageReduction:.01},{evasionChance:.015},{critChance:.01}]},
  {id:'crownsteel',name:'Crownsteel',row:1,minLevel:12,price:[680,420,520],origin:'Royal smithies supplying the crown roads.',appearance:'Silver steel, blue cloth, restrained gold edging and sapphire fittings.',history:'The same workshops that temper the royal roadblades stamp these plates. A keeper is expected to protect the wagons behind them before chasing glory ahead.',bonus:{maxHp:25,damageReduction:.03},pieces:[{maxHp:30,damageReduction:.03},{maxHp:10,evasionChance:.01},{maxHp:10,critChance:.015}]},
  {id:'rededge',name:'Rededge',row:2,minLevel:1,bossId:'captain-varr',origin:'Captain Varr and the occupied eastern watchtower.',appearance:'Notched dark iron, crimson leather wraps and angular silver fittings.',history:'Once a guard uniform, rebuilt for a raider who knew exactly where a caravan would hesitate. Its sharp red seams echo the Rededge blade.',bonus:{critChance:.04,evasionChance:.025},pieces:[{maxHp:18,critChance:.02},{evasionChance:.025},{critChance:.025}]},
  {id:'moonlit',name:'Moonlit Oath',row:3,minLevel:1,bossId:'moonlit-warden',origin:'The moon groves of Narenthil.',appearance:'Silver-edged indigo armor, violet jewels and small crescent clasps.',history:'A guardian once wore the moon as a promise of safe passage. The blight dimmed its cloth, but the silver fittings still catch the light beneath the trees.',bonus:{evasionChance:.05,critChance:.02},pieces:[{maxHp:25,evasionChance:.02},{evasionChance:.03},{critChance:.03}]},
  {id:'stonejaw',name:'Stonejaw Bulwark',row:4,minLevel:1,bossId:'stonejaw-troll',origin:'The shattered caravan passes beneath Starhold.',appearance:'Slate-gray plates, rugged brown leather and pale gold mineral seams.',history:'Pass smiths bound recovered stone into wearable plates after studying the troll that broke their wagons. The seams resemble those running through Stonejaw Edge.',bonus:{maxHp:60,damageReduction:.04},pieces:[{maxHp:65,damageReduction:.04},{maxHp:20,damageReduction:.02},{maxHp:15}]},
  {id:'emberfang',name:'Emberfang',row:5,minLevel:1,bossId:'varkhul',origin:'Varkhul and the ember ridges of Darkav.',appearance:'Black dragon scales, restrained orange seams and amber clasps against red-black cloth.',history:'Cinder smiths work the shed plates only after the dragon has withdrawn. The resulting pieces carry the same patient heat as Emberfang, held behind blackened edges.',bonus:{maxHp:45,critChance:.05,damageReduction:.02},pieces:[{maxHp:45,damageReduction:.03},{evasionChance:.02},{critChance:.04}]},
  {id:SHADOW_MAGUS_SET,name:'Shadow Magus Sovereign',row:6,minLevel:1,bossId:'grand-magus',origin:'The Grand Magus of the Shadow Realm, Tower of Might, floor 10-5.',
   appearance:'Legendary blackened silver plate, violet runic silk and a deep hood fastened by a bat-wing clasp.',
   history:'Taken from the Magus’s sealed treasure after his form shattered into bats. No merchant or other creature possesses this regalia.',
   bonus:{maxHp:120,damageReduction:.12,lifesteal:.25,staminaReduction:.45,allStats:15},
   pieces:[{maxHp:100,damageReduction:.12},{maxHp:40,damageReduction:.05},{maxHp:60,damageReduction:.06}]},
];
export const ARMOR_SET_BY_ID=Object.fromEntries(ARMOR_SETS.map(s=>[s.id,s])) as Record<string,ArmorSet>;
export const ARMORS:ArmorDefinition[]=ARMOR_SETS.flatMap(set=>ARMOR_SLOTS.map((slot,index)=>({
  id:`${set.id}-${slot}`,name:`${set.name} ${slot==='chest'?'Cuirass':slot==='boots'?'Boots':'Cape'}`,
  setId:set.id,slot,icon:set.row*3+index,minLevel:set.minLevel,price:set.price?.[index],bossId:set.bossId,
  origin:set.origin,history:set.history,appearance:`${set.appearance} ${slot==='chest'?'A complete torso piece with fitted shoulders and a belted waist.':slot==='boots'?'A matched pair with reinforced soles and secure ankle straps.':'A draped traveling cloak with a distinctive fastening at the throat.'}`,
  salvage:75+set.row*35,bonuses:set.pieces[index],
})));
export const ARMOR_BY_ID=Object.fromEntries(ARMORS.map(a=>[a.id,a])) as Record<string,ArmorDefinition>;
export const SHADOW_MAGUS_ARMOR_IDS=ARMORS.filter(a=>a.setId===SHADOW_MAGUS_SET).map(a=>a.id);
export const BOSS_ARMOR=Object.fromEntries(ARMOR_SETS.filter(s=>s.bossId).map(s=>[s.bossId!,ARMORS.filter(a=>a.setId===s.id)])) as Record<string,ArmorDefinition[]>;
export function armorBonusesFor(loadout:ArmorLoadout):ArmorBonuses{
  const result={...NO_ARMOR_BONUSES};let setId:string|null=null,matched=true;
  for(const slot of ARMOR_SLOTS){
    const item=loadout[slot]?ARMOR_BY_ID[loadout[slot]!]:undefined;
    if(!item){matched=false;continue;}
    if(setId===null)setId=item.setId;else if(setId!==item.setId)matched=false;
    for(const key of Object.keys(result) as (keyof ArmorBonuses)[])result[key]=(result[key]??0)+(item.bonuses[key]??0);
  }
  if(matched&&setId)for(const key of Object.keys(result) as (keyof ArmorBonuses)[])result[key]=(result[key]??0)+(ARMOR_SET_BY_ID[setId].bonus[key]??0);
  return result;
}
export function armorBonusLines(bonus:Partial<ArmorBonuses>){
  const lines:string[]=[];
  if(bonus.maxHp)lines.push(`+${bonus.maxHp} maximum HP`);
  if(bonus.damageReduction)lines.push(`${+(bonus.damageReduction*100).toFixed(1)}% damage reduction`);
  if(bonus.critChance)lines.push(`+${+(bonus.critChance*100).toFixed(1)}% critical chance`);
  if(bonus.evasionChance)lines.push(`+${+(bonus.evasionChance*100).toFixed(1)}% evasion chance`);
  if(bonus.lifesteal)lines.push(`${Math.round(bonus.lifesteal*100)}% lifesteal on actual attack and skill damage`);
  if(bonus.staminaReduction)lines.push(`${Math.round(bonus.staminaReduction*100)}% less stamina consumed`);
  if(bonus.allStats)lines.push(`+${bonus.allStats} STR, VIT, AGI, EVA and LUK (equipment bonus)`);
  return lines;
}
export function parseArmor(inventory:unknown,loadout:unknown):{armorInventory:string[];equippedArmor:ArmorLoadout}|null{
  const ids=inventory===undefined?[]:inventory,gear=loadout===undefined?emptyArmorLoadout():loadout;
  if(!Array.isArray(ids)||ids.length>ARMORS.length||new Set(ids).size!==ids.length||!ids.every(id=>typeof id==='string'&&Object.hasOwn(ARMOR_BY_ID,id))
    ||!gear||typeof gear!=='object'||Array.isArray(gear)||Object.keys(gear).length!==3)return null;
  const result=emptyArmorLoadout();
  for(const slot of ARMOR_SLOTS){
    const id=(gear as Record<string,unknown>)[slot];
    if(id!==null&&(typeof id!=='string'||!ids.includes(id)||ARMOR_BY_ID[id]?.slot!==slot))return null;
    result[slot]=id as string|null;
  }
  return {armorInventory:[...ids],equippedArmor:result};
}
