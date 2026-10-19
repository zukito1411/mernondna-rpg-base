import type {WeaponDefinition} from '../game/types';
import {WEAPON_BY_ID} from './weapons';
import {BOSS_WEAPONS} from './economy';
import {ASCENDED_ATTRIBUTE_CAP} from './progression';
import {awakenedProfile} from './awakening';

export const MAX_WEAPON_UPGRADE=5;
export const MAX_BOSS_MATERIALS=99;
export const BOSS_WEAPON_IDS=new Set(Object.values(BOSS_WEAPONS).map(trophy=>trophy.id));
export type WeaponUpgradeLedger=Record<string,number>;

export function weaponUpgradeRank(id:string,ledger:WeaponUpgradeLedger):number {
 return BOSS_WEAPON_IDS.has(id)?Math.max(0,Math.min(MAX_WEAPON_UPGRADE,ledger[id]??0)):0;
}
/** Duplicate boss trophies enhance a single owned relic; immutable templates remain unchanged. */
export function enhancedWeapon(id:string,ledger:WeaponUpgradeLedger,awakened:readonly string[]=[]):WeaponDefinition {
 const base=WEAPON_BY_ID[id]??WEAPON_BY_ID['roadwarden-sword'];
 const rank=weaponUpgradeRank(base.id,ledger);
 const final=awakenedProfile(base.id,awakened);
 return rank===0&&!final?base:{...base,name:final?.name??base.name,damage:Math.round(base.damage*(1+rank*.08)*(final?1.2:1)),
   cooldownMs:Math.round(base.cooldownMs*(1-rank*.02))};
}
export function enhancedProcChance(id:string,baseChance:number,ledger:WeaponUpgradeLedger,luck:number,awakened:readonly string[]=[]):number {
 return Math.min(.35,baseChance+weaponUpgradeRank(id,ledger)*.01+Math.max(0,Math.min(ASCENDED_ATTRIBUTE_CAP,luck))*.001+(awakenedProfile(id,awakened) ? .05 : 0));
}
