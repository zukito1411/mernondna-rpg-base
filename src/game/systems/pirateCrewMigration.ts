import type {ContentWorldState,CreatureContentDefinition,Vec2} from '../types';
import {ENEMY_BY_ID} from '../../data/enemies';
import {enemyLevelAt,scaledEnemy} from '../../data/enemyTiers';
import {onFlagshipBoarding} from '../../data/pirateFlagship';
import {creatureFitsHabitat,MAX_PERSISTENT_SPAWNS} from './encounterAdmission';
import {restoredEnemyHealth} from './enemyHealth';
import type {WorldGenerator} from './WorldGenerator';

/** Upgrade coastal patrols once on scene creation; no per-frame world scans.
 * Never replenish a casualty or change the flagship's authored crew/summons. */
export function normalizePirateCrews(world:ContentWorldState,geography:WorldGenerator,
  canOccupy:(x:number,y:number)=>boolean):ContentWorldState {
  const result={...world,spawns:{...world.spawns},states:{...world.states}};
  const groups=new Map<string,CreatureContentDefinition[]>();
  for(const member of Object.values(result.spawns)){
    if(!['cutlass-pirate','pirate-boatswain','road-bandit'].includes(member.enemyId)
      ||onFlagshipBoarding(member.world.x,member.world.y)
      ||member.encounterBehavior&&onFlagshipBoarding(member.encounterBehavior.home.x,member.encounterBehavior.home.y))continue;
    // Old single coastal bandits/deckhands have no encounter identity. They
    // must enter the same migration as pairs, not bypass it forever.
    const key=member.encounterId??`pirate-legacy:${member.id}`;
    const members=groups.get(key)??[];members.push(member);groups.set(key,members);
  }
  for(const members of groups.values()){
    if(members.length>3)continue;
    members.sort((a,b)=>(a.encounterBehavior?.slot??0)-(b.encounterBehavior?.slot??0)||a.id.localeCompare(b.id));
    const anchor=members[0],home=anchor.encounterBehavior?.home??anchor.world;
    if(geography.getRegionAt(home.x,home.y)!=='portquill')continue;
    // A grouped singleton can be a surviving member after corpse pruning.
    // Only genuinely ungrouped legacy actors may acquire two new companions.
    if(members.length===1&&anchor.encounterId)continue;
    const encounterId=anchor.encounterId??`pirate-legacy:${anchor.id}`;
    if(members.length<3){
      // Plan the entire upgrade before touching records/sequence numbers.
      // No partial crew if geometry or persistent-record capacity is short.
      const missing=3-members.length;
      if(members.every(m=>result.states[m.id]?.defeated)
        ||Object.keys(result.spawns).length+missing>MAX_PERSISTENT_SPAWNS)continue;
      const additions:Vec2[]=[];
      const occupied=members.map(m=>result.states[m.id]??m.world);
      const origin=occupied.find((_,i)=>!result.states[members[i].id]?.defeated)!;
      for(const radius of [70,110,150]){
        for(let i=0;i<8;i++){
          const p={x:origin.x+Math.cos(i*Math.PI/4)*radius,y:origin.y+Math.sin(i*Math.PI/4)*radius};
          const habitat={region:geography.getRegionAt(p.x,p.y),biome:geography.getBiomeAt(p.x,p.y),terrain:geography.getTerrainAt(p.x,p.y)};
          if(!onFlagshipBoarding(p.x,p.y)&&canOccupy(p.x,p.y)
            &&creatureFitsHabitat(ENEMY_BY_ID['pirate-boatswain'],habitat)
            &&Math.hypot(p.x-home.x,p.y-home.y)<=(anchor.encounterBehavior?.leashRadius??900)*.4
            &&occupied.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=46)
            &&additions.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=46))additions.push(p);
          if(additions.length===missing)break;
        }
        if(additions.length===missing)break;
      }
      if(additions.length!==missing)continue; // Unsafe legacy locations remain untouched.
      for(const position of additions){
        const id=`spawn:${result.nextSpawnSequence++}`;
        const member:CreatureContentDefinition={id,kind:'creature',enemyId:'cutlass-pirate',world:position,
          eventSpawn:anchor.eventSpawn,encounterId};
        members.push(member);result.spawns[id]=member;
      }
    }
    const heavy=members.find(m=>m.enemyId==='pirate-boatswain')??members[2];
    members.forEach((member,slot)=>{
      const enemyId=member===heavy?'pirate-boatswain':'cutlass-pirate';
      const saved=result.states[member.id];
      if(saved&&member.enemyId!==enemyId){
        const region=geography.getRegionAt(home.x,home.y);
        const oldDefinition=ENEMY_BY_ID[member.enemyId],newDefinition=ENEMY_BY_ID[enemyId];
        const oldMax=scaledEnemy(oldDefinition,enemyLevelAt(oldDefinition,home.x,home.y,region)).hp;
        const newMax=scaledEnemy(newDefinition,enemyLevelAt(newDefinition,home.x,home.y,region)).hp;
        result.states[member.id]={...saved,hp:saved.defeated?0:Math.max(1,Math.round(restoredEnemyHealth(saved,oldMax)/oldMax*newMax)),hpMax:newMax};
      }
      const leashRadius=anchor.encounterBehavior?.leashRadius??900;
      const preferred=member.encounterBehavior?.station??member.world;
      const station=Math.hypot(preferred.x-home.x,preferred.y-home.y)<=leashRadius*.4?preferred:home;
      result.spawns[member.id]={...member,enemyId,encounterId,encounterBehavior:{
        home:{...home},station:{...station},
        leashRadius,slot,
        role:member===heavy?'heavy':slot===0?'leader':'melee'}};
    });
  }
  return result;
}
