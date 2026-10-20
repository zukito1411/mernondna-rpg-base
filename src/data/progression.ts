import {NO_ARMOR_BONUSES,type ArmorBonuses} from './armor';
import {BREAKTHROUGH_COMPLETE,WORLD_ASCENSION} from './breakthrough';
export const XP_PER_LEVEL = 250; // Base requirement, retained for older callers.
export const PLAYER_ACTOR_HEIGHT = 76;
export const BASE_LEVEL_CAP = 50;
export const MAX_PLAYER_LEVEL = 75;
export const playerLevelCap=(flags:Record<string,boolean>)=>flags[BREAKTHROUGH_COMPLETE]?MAX_PLAYER_LEVEL:BASE_LEVEL_CAP;
export const ATTRIBUTE_CAP = 40;
export const ASCENDED_ATTRIBUTE_CAP = 60;
export const attributeCap=(flags:Record<string,boolean>)=>flags[WORLD_ASCENSION]?ASCENDED_ATTRIBUTE_CAP:ATTRIBUTE_CAP;
export const STAT_POINTS_PER_LEVEL = 3;
// Learning points are shared by passive talents and purchased combat arts.
// All 12 talents cost 22 points and the 3 optional combat arts cost 7, so
// award the last two points together at 29. None are earned at levels 30-75.
export const LAST_LEARNING_POINT_LEVEL = 29;
export const attributeBudget = (level:number) => (Math.max(1,Math.min(MAX_PLAYER_LEVEL,Math.floor(level)))-1)*STAT_POINTS_PER_LEVEL;
export const skillBudget = (level:number) => {
  const capped=Math.max(1,Math.min(LAST_LEARNING_POINT_LEVEL,Math.floor(level)));
  return capped-1+(capped===LAST_LEARNING_POINT_LEVEL?1:0);
};
// Older versions awarded 28 points by level 29 and sometimes an additional
// point at 30. Keep the old budget recognizable when restoring saved games.
export const legacySkillBudget = (level:number) => Math.max(1,Math.min(30,Math.floor(level)))-1;
/** Previous level curve, retained exclusively for migrating existing saves. */
export function legacyXpNeededForLevel(level:number) {
  return XP_PER_LEVEL+25*Math.max(0,Math.floor(level)-1);
}
export function legacyXpTotalForLevel(level:number) {
  const completed=Math.max(0,Math.floor(level)-1);
  return completed*XP_PER_LEVEL+25*completed*(completed-1)/2;
}
/** Starting at level 50 (after Edmund's Breakthrough), XP starts at 2x
 * the previous requirement and grows by another 0.1x every level.
 * Examples: 50->51 is 2x, 60->61 is 3x, 74->75 is 4.4x.
 * All thresholds up through reaching level 50 stay unchanged. */
export function xpNeededForLevel(level:number) {
  const current=Math.max(1,Math.floor(level));
  const normal=legacyXpNeededForLevel(current);
  return current<BASE_LEVEL_CAP?normal:
    Math.round(normal*(20+current-BASE_LEVEL_CAP)/10);
}
// Precompute exact cumulative thresholds once. Leveling, the HUD and save
// validation use the same integer totals without repeated summation.
const xpThresholds:number[]=[0,0];
for(let level=2;level<=MAX_PLAYER_LEVEL;level++)
  xpThresholds[level]=xpThresholds[level-1]+xpNeededForLevel(level-1);
export function xpTotalForLevel(level:number) {
  const target=Math.max(1,Math.floor(level));
  if(target<=MAX_PLAYER_LEVEL)return xpThresholds[target];
  let total=xpThresholds[MAX_PLAYER_LEVEL];
  for(let current=MAX_PLAYER_LEVEL;current<target;current++)total+=xpNeededForLevel(current);
  return total;
}
export function experienceWithinLevel(xp:number,cap=MAX_PLAYER_LEVEL) {
  const level=levelForExperience(xp,cap);
  return {level, current:level===cap?1:Math.max(0,xp-xpTotalForLevel(level)), required:level===cap?1:xpNeededForLevel(level)};
}
export function levelForExperience(xp: number,cap=MAX_PLAYER_LEVEL) {
  if(!Number.isFinite(xp)||xp<=0)return 1;
  // Exact thresholds, with no growth beyond the player level cap.
  let level=1;
  while(level<cap&&xp>=xpTotalForLevel(level+1))level++;
  return level;
}
export function playerDamageGrowth(level:number){return 1+Math.min(.35,Math.max(0,level-5)*.018);}
export function npcApparentHeight(texture: string) {
  if(texture==='npc_elven_king'||texture==='npc_elven_king_idle')return 128;
  if(texture==='npc_woman'||texture==='npc_elven_woman_idle')return PLAYER_ACTOR_HEIGHT*1.12;
  return texture==='npc_guard'||texture==='npc_elven_guard'||texture==='npc_elven_guard_idle'||texture==='npc_royal_guard'
    ? PLAYER_ACTOR_HEIGHT*1.27 : PLAYER_ACTOR_HEIGHT;
}
export type AttributeId = 'strength'|'vitality'|'agility'|'evasion'|'luck';
export type SkillId = 'heavy-strike'|'fleet-foot'|'iron-heart'|'deep-reserves'|'steady-edge'|'battle-focus'|
  'second-wind'|'iron-guard'|'windrunner'|'spell-tempo'|'veteran-strike'|'last-stand';
export type PlayerAttributes = Record<AttributeId,number>;
export const BASE_ATTRIBUTES:PlayerAttributes={strength:0,vitality:0,agility:0,evasion:0,luck:0};
export type SkillBranch='Might'|'Survival'|'Mobility';
export interface SkillDefinition {
 id:SkillId;name:string;description:string;branch:SkillBranch;minLevel:number;cost:number;requires?:SkillId;
}
export const SKILLS:SkillDefinition[]=[
 {id:'heavy-strike',name:'Heavy Strike',description:'+12% weapon damage.',branch:'Might',minLevel:2,cost:1},
 {id:'steady-edge',name:'Steady Edge',description:'+6% weapon damage.',branch:'Might',minLevel:6,cost:1,requires:'heavy-strike'},
 {id:'battle-focus',name:'Battle Focus',description:'+5% combat-art damage.',branch:'Might',minLevel:10,cost:2,requires:'steady-edge'},
 {id:'veteran-strike',name:'Veteran Strike',description:'+8% weapon damage.',branch:'Might',minLevel:24,cost:3,requires:'battle-focus'},
 {id:'iron-heart',name:'Iron Heart',description:'+25 maximum health.',branch:'Survival',minLevel:2,cost:1},
 {id:'deep-reserves',name:'Deep Reserves',description:'+30 maximum stamina.',branch:'Survival',minLevel:3,cost:1},
 {id:'iron-guard',name:'Iron Guard',description:'Take 5% less damage.',branch:'Survival',minLevel:10,cost:3,requires:'iron-heart'},
 {id:'last-stand',name:'Last Stand',description:'+20 maximum health.',branch:'Survival',minLevel:26,cost:3,requires:'iron-guard'},
 {id:'fleet-foot',name:'Fleet Foot',description:'+6% movement speed.',branch:'Mobility',minLevel:2,cost:1},
 {id:'windrunner',name:'Windrunner',description:'+4% movement speed.',branch:'Mobility',minLevel:7,cost:1,requires:'fleet-foot'},
 {id:'second-wind',name:'Second Wind',description:'+20 maximum stamina.',branch:'Mobility',minLevel:12,cost:2,requires:'windrunner'},
 {id:'spell-tempo',name:'Battle Rhythm',description:'Reduce art cooldowns by 6%.',branch:'Mobility',minLevel:28,cost:3,requires:'second-wind'},
];
export function progressionStats(attributes:PlayerAttributes,skills:SkillId[],armor:ArmorBonuses=NO_ARMOR_BONUSES){
 const has=(id:SkillId)=>skills.includes(id);
 const points=(id:AttributeId)=>Math.max(0,Math.min(ASCENDED_ATTRIBUTE_CAP,attributes[id]??0))+(armor.allStats??0);
 const str=points('strength'),vit=points('vitality'),agi=points('agility'),eva=points('evasion'),luk=points('luck');
 return {
  // STR grants a little toughness, while VIT is the primary survival stat.
  maxHp:100+str*2+vit*10+(has('iron-heart') ? 25:0)+(has('last-stand') ? 20:0)+armor.maxHp,
  maxStamina:100+agi*2+(has('deep-reserves') ? 30:0)+(has('second-wind') ? 20:0),
  damageMultiplier:1+str*.035+(has('heavy-strike') ? .12:0)+(has('steady-edge') ? .06:0)+(has('veteran-strike') ? .08:0),
  speedMultiplier:1+Math.min(20,agi)*.01+(has('fleet-foot') ? .06:0)+(has('windrunner') ? .04:0),
  // Weapon recovery continues through the ascended cap, independently of movement.
  cooldownMultiplier:1-agi*.006-(has('spell-tempo') ? .06:0),
  evasionChance:Math.min(.6,eva*.01+armor.evasionChance),
  luckChance:Math.min(.6,luk*.00625+armor.critChance),
  rewardMultiplier:1+luk*.01,
  rareDropChance:bossWeaponDropChance(attributes,armor),
  supplyDropChance:supplyDropChance(attributes,armor),
  skillDamageMultiplier:1+(has('battle-focus') ? .05:0),
  incomingDamageMultiplier:(1-vit*.005)*(has('iron-guard') ? .95:1)*(1-Math.min(.35,armor.damageReduction)),
 };
}

/** AGI rewards short, frequent dashes; EVA rewards reliable damage-free dodge timing. */
export function dodgeProfile(attributes:PlayerAttributes,armor:ArmorBonuses=NO_ARMOR_BONUSES) {
 const agi=Math.max(0,Math.min(ASCENDED_ATTRIBUTE_CAP,attributes.agility??0))+(armor.allStats??0);
 const eva=Math.max(0,Math.min(ASCENDED_ATTRIBUTE_CAP,attributes.evasion??0))+(armor.allStats??0);
 return {durationMs:210+Math.round(eva*1.5),invulnerableMs:260+eva*2,
   cooldownMs:850-agi*4,staminaCost:16-Math.floor(agi/8),speedMultiplier:2.65+agi*.0125};
}

/** The only rare weapon loot table is the boss trophy table. Use the same
 * capped attribute math as the stat screen, including World Ascension. */
export function bossWeaponDropChance(attributes:PlayerAttributes,armor:ArmorBonuses=NO_ARMOR_BONUSES):number {
 const luk=Math.max(0,Math.min(ASCENDED_ATTRIBUTE_CAP,attributes.luck??0))+(armor.allStats??0);
 return .25+luk*.005;
}
/** Complete armor sets scale with Luck at the same ratio as individual loot. */
export function bossArmorSetDropChance(attributes:PlayerAttributes,armor:ArmorBonuses=NO_ARMOR_BONUSES):number {
 const luk=Math.max(0,Math.min(ASCENDED_ATTRIBUTE_CAP,attributes.luck??0))+(armor.allStats??0);
 return .1+luk*.002;
}
export function supplyDropChance(attributes:PlayerAttributes,armor:ArmorBonuses=NO_ARMOR_BONUSES):number {
 const luk=Math.max(0,Math.min(ASCENDED_ATTRIBUTE_CAP,attributes.luck??0))+(armor.allStats??0);
 return .06+luk*.0025;
}

/** One roll per outgoing hit; luck is not a second independent damage multiplier. */
export function luckDamage(amount:number,attributes:PlayerAttributes,skills:SkillId[],armor:ArmorBonuses=NO_ARMOR_BONUSES){
 return Math.max(1,Math.round(amount*(Math.random()<progressionStats(attributes,skills,armor).luckChance?1.5:1)));
}
export function earnedRewards(xp:number,gold:number,attributes:PlayerAttributes,skills:SkillId[],armor:ArmorBonuses=NO_ARMOR_BONUSES){
 const multiplier=progressionStats(attributes,skills,armor).rewardMultiplier;
 return {xp:Math.max(0,Math.round(xp*multiplier)),gold:Math.max(0,Math.round(gold*multiplier))};
}
