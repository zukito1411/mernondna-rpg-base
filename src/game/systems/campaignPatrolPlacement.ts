import type {Vec2} from '../types';
import type {CreatureActivation} from './ContentChunkManager';

/** Emergency placement only: bounded local clearings, complete surviving
 * patrols, no enemy creation and no changes to objectives or defeat ledgers. */
export function findCampaignPatrolPlacement(members:readonly CreatureActivation[],formationSize:number,
  fits:(enemyId:string,point:Vec2)=>boolean,connected:(from:Vec2,to:Vec2)=>boolean,
  canDeploy:(point:Vec2)=>boolean){
  if(!members.length)return null;
  const first=members[0],origin=first.definition.encounterBehavior?.home??first.definition.world;
  const preferred=first.state.encounterPlacement?.home??origin;
  const candidates:Vec2[]=[preferred,origin];
  for(const radius of [64,128,256,384,512,768,1024,1536,2048,2400])for(let i=0;i<16;i++)
    candidates.push({x:origin.x+Math.cos(i*Math.PI/8)*radius,y:origin.y+Math.sin(i*Math.PI/8)*radius});
  for(const home of candidates)for(const spacing of [90,64]){
    const positions=members.map(({definition},index)=>{
      const angle=(definition.encounterBehavior?.slot??index)*Math.PI*2/Math.max(1,formationSize);
      return {x:home.x+Math.cos(angle)*spacing,y:home.y+Math.sin(angle)*spacing};
    });
    if(positions.every((p,index)=>fits(members[index].definition.enemyId,p)&&connected(home,p)&&canDeploy(p)
      &&positions.slice(index+1).every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=64)))return {home,positions};
  }
  return null;
}
