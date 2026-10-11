import { TOWNS } from './towns';
import type { EnemyDefinition, RegionId } from '../game/types';

/** Settlement-route danger tiers. There are twelve settlements but eight regions. */
const ROUTE=['oakmere','highmere','willowcross','elarion','moonfall','starhold',
 'redmesa','deepford','tidewatch','skallheim','blackspire','cibar-plains'] as const;
const REGION_FALLBACK:Record<Exclude<RegionId,'dead-sea'>,number>={
 trandum:5,narenthil:10,nardorous:15,rindass:20,druganwoods:20,portquill:25,frostlands:25,darkav:30,
};
export const BOSS_RESPAWN_MS=20*60*1000;
export function areaMonsterLevel(x:number,y:number,regionId:RegionId):number {
 if(regionId==='dead-sea')return 5;
 const nearby=TOWNS.filter(t=>t.regionId===regionId).map(t=>({
  id:t.id,distance:Math.hypot(t.world.x-x,t.world.y-y),
 })).sort((a,b)=>a.distance-b.distance)[0];
 const index=ROUTE.indexOf(nearby?.id as typeof ROUTE[number]);
 // Far from a settlement, use the region's consistent wilderness difficulty.
 return nearby&&nearby.distance<15000&&index>=0?5+Math.floor(index/2)*5:REGION_FALLBACK[regionId];
}
export function scaledEnemy(definition:EnemyDefinition,level:number):EnemyDefinition {
 const steps=Math.max(0,level-5),boss=Boolean(definition.boss);
 // Higher-level enemies have noticeably more health, but damage rises more slowly.
 const hpScale=1+steps*.11,damageScale=1+steps*.035;
 const xpScale=(1+steps*.13)*(boss?1.5:1);
 return {...definition,hp:Math.round(definition.hp*hpScale),damage:Math.max(1,Math.round(definition.damage*damageScale)),
  xp:Math.max(1,Math.round(definition.xp*xpScale))};
}
