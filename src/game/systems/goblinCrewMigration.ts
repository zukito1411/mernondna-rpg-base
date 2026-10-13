import type {ContentWorldState,CreatureContentDefinition,Vec2} from '../types';
import type {WorldGenerator} from './WorldGenerator';
import {MAX_PERSISTENT_SPAWNS} from './encounterAdmission';

/** Upgrade saved M14a groups without resetting health, deaths or identities. */
export function normalizeGoblinCrews(world:ContentWorldState,geography:WorldGenerator,
  safe:(x:number,y:number)=>boolean):ContentWorldState {
  const result={...world,spawns:{...world.spawns},states:{...world.states}};
  const groups=new Map<string,CreatureContentDefinition[]>();
  for(const member of Object.values(result.spawns)){
    if(!member.encounterId||!['hedge-goblin','goblin-stone-slinger'].includes(member.enemyId))continue;
    const group=groups.get(member.encounterId)??[];group.push(member);groups.set(member.encounterId,group);
  }
  let count=Object.keys(result.spawns).length;
  for(const members of groups.values()){
    if(members.length<2||members.length>3)continue;
    members.sort((a,b)=>(a.encounterBehavior?.slot??0)-(b.encounterBehavior?.slot??0)||a.id.localeCompare(b.id));
    const anchor=members[0],home=anchor.encounterBehavior?.home??anchor.world;
    if(geography.getRegionAt(home.x,home.y)==='dead-sea')continue;
    if(members.length===2){
      // Do not refill an identifiable survivor pair of an existing ranged crew.
      if(members.some(m=>m.enemyId==='goblin-stone-slinger'||(m.encounterBehavior?.slot??0)>=2)
        ||members.every(m=>result.states[m.id]?.defeated)||count>=MAX_PERSISTENT_SPAWNS)continue;
      const occupied=members.map(m=>result.states[m.id]??m.world);
      const origin=occupied.find((_,i)=>!result.states[members[i].id]?.defeated)!;
      let position:Vec2|undefined;
      for(const radius of [70,110,150]){
        for(let i=0;i<8;i++){
          const p={x:origin.x+Math.cos(i*Math.PI/4)*radius,y:origin.y+Math.sin(i*Math.PI/4)*radius};
          if(safe(p.x,p.y)&&Math.hypot(p.x-home.x,p.y-home.y)<=(anchor.encounterBehavior?.leashRadius??700)*.4
            &&occupied.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=40)){position=p;break;}
        }
        if(position)break;
      }
      if(!position)continue;
      const id=`spawn:${result.nextSpawnSequence++}`;
      members.push({id,kind:'creature',enemyId:'goblin-stone-slinger',world:position,eventSpawn:anchor.eventSpawn,
        encounterId:anchor.encounterId});count++;
    }
    const ranged=members.find(m=>m.enemyId==='goblin-stone-slinger')??members[2];
    members.forEach((member,slot)=>{
      const leashRadius=anchor.encounterBehavior?.leashRadius??700;
      const station=member.encounterBehavior?.station??member.world;
      result.spawns[member.id]={...member,enemyId:member===ranged?'goblin-stone-slinger':'hedge-goblin',
        encounterBehavior:{home:{...home},station:Math.hypot(station.x-home.x,station.y-home.y)<=leashRadius*.4?{...station}:{...home},
          leashRadius,slot,role:member===ranged?'ranged':slot===0?'leader':'melee'}};
      // Existing hpMax already preserves the damage fraction across model
      // changes via restoredEnemyHealth; never initialize over a saved wound.
    });
  }
  return result;
}
