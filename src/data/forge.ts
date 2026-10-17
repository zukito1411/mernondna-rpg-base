import type {WeaponDefinition} from '../game/types';
import {NPC_BY_ID} from './npcs';
import {BOSS_WEAPONS} from './economy';

export const ATTRIBUTE_RESET_COST=1500;
export const MAX_WEAPON_ENHANCEMENT=5;
export const MAX_FORGE_MATERIALS=999;

/** A boss's repeated rare weapon drop becomes a forging material, not a second
 * equippable copy. Any of these materials can improve an owned weapon. */
export const BOSS_FORGE_MATERIAL_IDS=Object.values(BOSS_WEAPONS).map(b=>b.id);
export const isBossForgeMaterial=(id:string)=>BOSS_FORGE_MATERIAL_IDS.includes(id);

export function isBlacksmith(npcId:string):boolean {
 const title=NPC_BY_ID[npcId]?.title??'';
 return /blacksmith|weaponsmith|runesmith|armorer|forgewright|forgemaster|master smith|guild smith/i.test(title);
}
export function weaponEnhancementCost(currentLevel:number):number {
 return 200+Math.max(0,Math.min(MAX_WEAPON_ENHANCEMENT,currentLevel))*150;
}
export function enhancedWeapon(weapon:WeaponDefinition,level:number):WeaponDefinition {
 const n=Math.max(0,Math.min(MAX_WEAPON_ENHANCEMENT,Number.isInteger(level)?level:0));
 if(!n)return weapon;
 return {...weapon,damage:Math.round(weapon.damage*(1+n*.08)),
   reach:weapon.reach+n,staminaCost:Math.max(4,weapon.staminaCost-Math.floor(n/2))};
}
