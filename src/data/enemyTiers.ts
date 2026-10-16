import { TOWNS } from './towns';
import {MAX_PLAYER_LEVEL} from './progression';
import type { EnemyDefinition, RegionId } from '../game/types';

/** Settlement-route danger tiers. There are twelve settlements but eight regions. */
const ROUTE=['oakmere','highmere','willowcross','elarion','moonfall','starhold',
 'redmesa','deepford','tidewatch','skallheim','blackspire','cibar-plains'] as const;
const REGION_FALLBACK:Record<Exclude<RegionId,'dead-sea'>,number>={
 trandum:5,narenthil:10,nardorous:15,rindass:20,druganwoods:25,portquill:30,frostlands:35,darkav:50,
};
// The maximum authored regional/route danger is also used to validate
// persisted monster HP after player-level scaling.
export const MAX_AREA_MONSTER_LEVEL=Math.max(...Object.values(REGION_FALLBACK),
  5+Math.floor((ROUTE.length-1)/2)*5);
export const BOSS_RESPAWN_MS=20*60*1000;
export function areaMonsterLevel(x:number,y:number,regionId:RegionId):number {
 if(regionId==='dead-sea')return 5;
 const nearby=TOWNS.filter(t=>t.regionId===regionId).map(t=>({
  id:t.id,distance:Math.hypot(t.world.x-x,t.world.y-y),
 })).sort((a,b)=>a.distance-b.distance)[0];
 const index=ROUTE.indexOf(nearby?.id as typeof ROUTE[number]);
 // Far from a settlement, use the region's consistent wilderness difficulty.
 const routeLevel=nearby&&nearby.distance<15000&&index>=0?5+Math.floor(index/2)*5:REGION_FALLBACK[regionId];
 return Math.max(routeLevel,REGION_FALLBACK[regionId]);
}
/** Raise encounter danger in +5-level steps every five player levels from 20
 * through 50. Clamp invalid or out-of-range values to the playable cap. */
export function globalMonsterBonus(playerLevel:number){
 const level=Math.max(1,Math.min(MAX_PLAYER_LEVEL,Number.isFinite(playerLevel)?Math.floor(playerLevel):1));
 return level<20?0:5*(Math.floor((level-20)/5)+1);
}
/** One shared level rule for live actors and saved crew upgrades. Elite roles
 * are always five levels above regular members from the same encounter home. */
export function enemyLevelAt(definition:EnemyDefinition,x:number,y:number,regionId:RegionId,wolfAlpha=false,playerLevel=1):number {
 const elite=definition.id==='pirate-boatswain'||definition.id==='rindass-orc-spearman'
   ||['gray-wolf','frost-wolf'].includes(definition.id)&&wolfAlpha;
 return areaMonsterLevel(x,y,regionId)+(definition.boss?10:elite?5:0)+globalMonsterBonus(playerLevel);
}
export function scaledEnemy(definition:EnemyDefinition,level:number):EnemyDefinition {
 const steps=Math.max(0,level-5),boss=Boolean(definition.boss);
 // Durability and threat rise faster than XP rewards: high-tier targets are
 // not merely larger XP bags with nearly starter-tier attacks. Even the
 // starting tier is tougher; species/elite differences remain intact.
 const hpScale=1.2+steps*.19,damageScale=1.15+steps*.10;
 const xpScale=(1+steps*.065)*(boss?1.25:1),goldScale=1+steps*.025;
 return {...definition,hp:Math.round(definition.hp*hpScale),damage:Math.max(1,Math.round(definition.damage*damageScale)),
  defense:Math.min(.45,.04+steps*.006),
  moveSpeed:definition.moveSpeed*(1+Math.min(.12,steps*.003)),
  xp:Math.max(1,Math.round(definition.xp*xpScale)),
  goldMin:Math.floor(definition.goldMin*goldScale),goldMax:Math.ceil(definition.goldMax*goldScale)};
}
/** Low-tier farming and endlessly summoned helpers are not a fast leveling route. */
export function encounterRewardFactor(enemyLevel:number,playerLevel:number,summoned=false){
 return Math.max(.15,1-Math.max(0,playerLevel-enemyLevel-5)*.08)*(summoned ? .2 : 1);
}
