import Phaser from 'phaser';
import {TOWN_BY_ID} from '../../data/towns';
import {seededRandom} from '../../utils/seededRandom';
import {useGameStore} from '../../store/gameStore';
import type {NpcDefinition,Vec2} from '../types';
import type {Npc} from '../entities/Npc';
import type {Enemy} from '../entities/Enemy';
import type {WorldScene} from '../scenes/WorldScene';
import type {WorldGenerator} from './WorldGenerator';
import {NpcCombatResidency} from './NpcCombatResidency';
import {AmbientNpcArrowSystem} from './AmbientNpcArrowSystem';
import {roadLifeRoutes,rememberRoadJourney,type RoadLifeRoute} from './RoadLifeRoutes';
import {routePosition,routePointAtDistance} from './travelRoutes';

interface Walker {npc:Npc;hp:number;maxHp:number;rest:number;cooldown:number;target:Enemy|null;engageFrom:Vec2|null;hit:boolean;attacking:boolean;rank:number;aim:Phaser.Math.Vector2|null}
interface Party {id:string;walkers:Walker[];anchor:Vec2;patrol:boolean;route:RoadLifeRoute}
interface PendingParty {party:Party;positions:Vec2[];roster:readonly AdventurerRole[];forward:boolean;next:number}
type AdventurerRole='swordhand'|'huntress'|'archer';
const ADVENTURER_PARTIES:readonly (readonly AdventurerRole[])[]=[
  ['swordhand'],['huntress'],['archer'],['swordhand','huntress'],
  ['swordhand','huntress'],['swordhand','archer'],['swordhand','huntress','archer'],
];

/** Streamed journeys use physical feet while visible and continue along the
 * same road offscreen. Story encounters and bosses remain independent. */
export class AmbientRoadLifeSystem{
  private readonly parties=new Map<string,Party>();
  private opponents=new Map<Enemy,Npc>();
  private previousOpponents=new Map<Enemy,Npc>();
  private readonly art:NpcCombatResidency;
  private readonly arrows:AmbientNpcArrowSystem;
  private readonly rng=seededRandom('road-life-v1');
  private readonly routes=roadLifeRoutes();
  private scan=0;
  private think=0;
  private routeClockPending=0;
  private pendingParty:PendingParty|null=null;
  private spawnCandidates:Array<{route:RoadLifeRoute;point:ReturnType<typeof routePosition>}>=[];
  private active=false;
  constructor(private readonly scene:WorldScene,private readonly world:WorldGenerator){
    this.arrows=new AmbientNpcArrowSystem(scene,(_source,enemy,direction)=>{
      enemy.takeDamage(8+enemy.level*1.4,direction,{source:'ambient-ally'});
    });
    this.art=new NpcCombatResidency(scene,spec=>[...this.parties.values()].some(p=>p.walkers.some(w=>w.npc.active&&w.npc.combatProfile?.id===spec.id))
      ||scene.children.list.some(o=>o instanceof Phaser.GameObjects.Sprite&&o.texture.key===spec.texture),console.warn);
  }
  opponent(enemy:Enemy){
    const npc=this.active?this.opponents.get(enemy):undefined;
    if(!npc?.active)return null;
    return npc;
  }
  damage(npc:Npc,amount:number){
    for(const party of this.parties.values()){
      const walker=party.walkers.find(w=>w.npc===npc);if(!walker)continue;if(walker.rest>0)return;
      walker.hp=Math.max(0,walker.hp-Math.max(1,amount));
      if(walker.hp<=walker.maxHp*.22){
        walker.rest=18000;walker.target=null;walker.attacking=false;
        npc.endStoryAttack();npc.endStoryGuard();npc.setStoryAlert('Wounded · falling back');
        for(const [enemy,target] of this.opponents)if(target===npc)this.opponents.delete(enemy);
      }
      return;
    }
  }
  update(delta:number,blocked:boolean){
    this.art.update();
    if(blocked){
      if(this.active)for(const party of this.parties.values())for(const walker of party.walkers){
        walker.target=null;walker.attacking=false;walker.npc.endStoryAttack();walker.npc.endStoryGuard();walker.npc.endStoryMovement();
      }
      this.active=false;this.opponents.clear();this.previousOpponents.clear();this.spawnCandidates.length=0;this.arrows.clear();return;
    }
    this.active=true;const step=Math.min(100,Math.max(0,delta));
    // Advance virtual journeys in small batches instead of visiting hundreds
    // of offscreen routes on every animation frame. Maximum clock drift is 250 ms.
    this.routeClockPending+=step;
    if(this.routeClockPending>=250){
      const elapsed=this.routeClockPending;this.routeClockPending=0;
      for(const route of this.routes)if(!this.parties.has(route.id))route.clock+=elapsed;
    }
    this.scan-=step;this.think-=step;
    const view=this.scene.cameras.main.worldView;
    for(const [id,party] of this.parties)if(party.walkers.every(w=>!w.npc.active||
      w.npc.x<view.x-950||w.npc.x>view.right+950||w.npc.y<view.y-850||w.npc.y>view.bottom+1050))this.release(id,party);
    if(this.scan<=0){this.scan=2500;this.populate();}
    this.processSpawnCandidates();
    // Introduce one actor per frame, not three animated bodies, labels and
    // shadow registrations on the same frame when a new guard party appears.
    this.spawnNextWalker();
    // No travelers means no enemies to scan, arrow targets to evaluate or
    // opponent tables to rebuild. Virtual journeys still progress above.
    if(this.parties.size===0){this.opponents.clear();this.previousOpponents.clear();return;}
    const decide=this.think<=0;if(decide)this.think=150;
    const enemies=this.scene.getCombatEnemies().filter(e=>e.active&&e.hp>0&&e.canBeTargeted&&this.scene.canRoadNpcFight(e));
    this.arrows.update(step,enemies);
    // Double-buffer opponent maps: preserve windups without cloning a map
    // and then clearing/repopulating it on every frame.
    const previousOpponents=this.opponents;
    this.opponents=this.previousOpponents;this.opponents.clear();
    this.previousOpponents=previousOpponents;
    for(const party of this.parties.values()){
      const leader=party.walkers[0]?.npc;
      if(leader&&!party.walkers.some(w=>w.target))party.anchor={x:leader.x,y:leader.y};
      for(const walker of party.walkers){
        const {npc}=walker;if(!npc.active)continue;
        const spec=npc.combatProfile;if(spec)this.art.ensure(spec);
        walker.cooldown=Math.max(0,walker.cooldown-step);
        if(walker.rest>0){walker.rest=Math.max(0,walker.rest-step);walker.hp=Math.min(walker.maxHp,walker.hp+step*.012);}
        const target=walker.target;
        if(target&&(!enemies.includes(target)||walker.rest>0||walker.engageFrom&&Math.hypot(target.x-walker.engageFrom.x,target.y-walker.engageFrom.y)>760)){
          walker.target=null;walker.attacking=false;npc.endStoryAttack();npc.endStoryGuard();npc.setStoryAlert();
        }
        if(!walker.target&&walker.rest===0&&decide&&npc.canStoryFight){
          // Sort by cheap squared distance BEFORE invoking the expensive
          // terrain and line-of-sight checks. Keep nearest reachable targeting.
          const range=party.patrol?400:320;
          const nearby=enemies.map(e=>({enemy:e,d2:(e.x-npc.x)**2+(e.y-npc.y)**2}))
            .filter(candidate=>candidate.d2<range*range).sort((a,b)=>a.d2-b.d2);
          walker.target=nearby.find(({enemy})=>this.scene.canNpcVisit(npc,enemy)
            &&this.scene.hasClearPath(npc.x,npc.y,enemy.x,enemy.y))?.enemy??null;
          if(walker.target){walker.engageFrom={x:npc.x,y:npc.y};npc.beginStoryGuard();npc.setStoryAlert(party.patrol?'Defending the road':'Engaging a roaming threat');}
        }
        const foe=walker.target;
        if(foe){
          const previous=this.opponents.get(foe);
          // Keep a fighter's opponent through its windup instead of cancelling
          // impacts whenever another party member becomes a pixel nearer.
          if(!previous||previousOpponents.get(foe)===npc||previousOpponents.get(foe)!==previous
            &&Math.hypot(npc.x-foe.x,npc.y-foe.y)<Math.hypot(previous.x-foe.x,previous.y-foe.y))this.opponents.set(foe,npc);
          if(walker.attacking){
            if(!walker.hit&&npc.storyStrikeReady){
              walker.hit=true;
              const toward=new Phaser.Math.Vector2(foe.x-npc.x,foe.y-npc.y),distance=toward.length();
              if(distance<=npc.storyAttackReach+8&&walker.aim&&walker.aim.dot(toward.normalize())>=.45
                &&this.scene.hasClearPath(npc.x,npc.y,foe.x,foe.y)){
                if(spec?.mode==='bow')this.arrows.fire(npc,foe);
                else foe.takeDamage(8+foe.level*1.4+(party.patrol&&walker.rank===0?7:0),
                  new Phaser.Math.Vector2(foe.x-npc.x,foe.y-npc.y).normalize(),{source:'ambient-ally'});
              }
            }
            if(npc.storyAttackFinished){walker.attacking=false;npc.endStoryAttack();}
          }else if(decide){
            const distance=Math.hypot(foe.x-npc.x,foe.y-npc.y);
            if(distance<=npc.storyAttackReach){
              npc.endStoryMovement();npc.holdStoryGuard(foe);
              if(walker.cooldown===0&&npc.beginStoryAttack(foe)){
                walker.attacking=true;walker.hit=false;walker.cooldown=1900+this.rng()*500;
                walker.aim=new Phaser.Math.Vector2(foe.x-npc.x,foe.y-npc.y).normalize();
              }
            }else{
              const angle=Math.atan2(npc.y-foe.y,npc.x-foe.x)+walker.rank*.5;
              const goal={x:foe.x+Math.cos(angle)*npc.storyAttackReach*.8,y:foe.y+Math.sin(angle)*npc.storyAttackReach*.8};
              if(this.routeClear(npc,goal))npc.beginStoryMovement(goal);else npc.endStoryMovement();
            }
          }
        }else if(decide){
          if(walker.rest===0)npc.setStoryAlert();
        }
      }
    }
  }
  private routeClear(npc:Npc,goal:Vec2){
    return this.scene.canNpcVisit(npc,goal)&&this.scene.canTraverseGround(npc,goal)
      &&!this.scene.npcPathBlocker(npc,goal,npc)
      &&[-12,12].every(dx=>[0,-20].every(dy=>this.world.isWalkable(goal.x+dx,goal.y+dy)));
  }
  private populate(){
    if(this.parties.size>=2||this.pendingParty)return;
    const player=this.scene.player,view=this.scene.cameras.main.worldView;
    const candidates=this.routes.filter(r=>!this.parties.has(r.id)).map(route=>({route,point:routePosition(route,route.clock)}))
      .filter(({point})=>Math.hypot(point.x-player.x,point.y-player.y)<1900
        &&!(point.x>view.x-150&&point.x<view.right+150&&point.y>view.y-150&&point.y<view.bottom+150));
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    this.spawnCandidates=candidates;
  }
  private processSpawnCandidates(){
    if(this.pendingParty||this.parties.size>=2){this.spawnCandidates.length=0;return;}
    // Keep the full randomized candidate pool, but check only six costly spawn
    // positions per frame. Dense areas can continue on the next frame rather
    // than dropping prospective parties or causing a single-frame hitch.
    let placementChecks=0;
    while(this.spawnCandidates.length>0&&placementChecks<6){
      const {route,point}=this.spawnCandidates.pop()!;
      if(this.parties.has(route.id))continue;
      if([...this.parties.values()].some(p=>p.patrol===route.patrol||Math.hypot(p.anchor.x-point.x,p.anchor.y-point.y)<700))continue;
      const patrol=route.patrol;
      const roster=ADVENTURER_PARTIES[Math.floor(seededRandom('roster:'+route.id)()*ADVENTURER_PARTIES.length)],number=patrol?3:roster.length;
      if([...this.parties.values()].reduce((n,p)=>n+p.walkers.length,0)+number>6)continue;
      placementChecks++;
      const positions=Array.from({length:number},(_,rank)=>routePointAtDistance(route,
        point.distance+(point.forward?-1:1)*rank*78));
      if(positions.some((p,i)=>!this.scene.npcCanStandAt(p.x,p.y)
        ||i>0&&Math.hypot(p.x-positions[i-1].x,p.y-positions[i-1].y)<60
        ||this.scene.getCombatEnemies().some(e=>e.active&&Math.hypot(e.x-p.x,e.y-p.y)<180)))continue;
      const party:Party={id:route.id,walkers:[],anchor:point,patrol,route};
      this.parties.set(route.id,party);
      this.pendingParty={party,positions,roster,forward:point.forward,next:0};
      this.spawnCandidates.length=0;
      return;
    }
  }
  private spawnNextWalker(){
    const pending=this.pendingParty;if(!pending)return;
    const {party,positions,roster,forward}=pending,rank=pending.next;
    if(!this.parties.has(party.id)||rank>=positions.length){this.pendingParty=null;return;}
    const {route,patrol}=party,p=positions[rank];
    const town=TOWN_BY_ID[route.townId],destination=TOWN_BY_ID[forward?route.destinationId:route.townId];
    const elven=town.regionId==='narenthil';
    const role=roster[rank],bow=!patrol&&role!=='swordhand';
    const definition:NpcDefinition={id:`road-life:${route.id}:${rank}`,
      name:patrol?(rank===0?'Patrol Commander':'Road Guard'):role==='huntress'?'Traveling Huntress':role==='archer'?'Traveling Archer':'Traveling Adventurer',
      title:patrol?`${town.name} outer watch`:`${positions.length>1?'Adventuring party':'Independent traveler'} to ${destination.name}`,
      townId:town.id,visualRegion:patrol?town.regionId:'trandum',
      role:patrol?'road guard':'adventurer',spriteFrame:0,
      spriteTexture:patrol?(elven?'npc_elven_guard_idle':rank===0?'npc_general':'npc_guard'):role==='huntress'?'npc_huntress':'npc_adventurer',
      worldOffset:{x:p.x-town.world.x,y:p.y-town.world.y},combatant:true,stationary:true,
      weaponId:bow?'narenthil-longbow':'roadwarden-sword',schedule:[],questIds:[],dialogue:[],relationshipToLeigneron:{kind:'acquaintance',trust:0,summary:'A fellow traveler on the road.'}};
    const npc=this.scene.createRoadNpc(definition,p),maxHp=(patrol?180:110)+useGameStore.getState().level*9;
    let nearest=Infinity,next=1;
    for(let i=1;i<route.points.length;i++){
      const a=route.points[i-1],b=route.points[i],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
      const t=len2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2)):0;
      const gap=Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);
      if(gap<nearest){nearest=gap;next=forward?i:i-1;}
    }
    npc.followRoadRoute(route.points,route.speed,{next,direction:forward?1:-1});
    party.walkers.push({npc,maxHp,hp:maxHp,rest:0,cooldown:rank*200,target:null,engageFrom:null,hit:false,attacking:false,rank,aim:null});
    if(++pending.next>=positions.length)this.pendingParty=null;
  }
  private release(id:string,party:Party){
    if(this.pendingParty?.party===party)this.pendingParty=null;
    const leader=party.walkers.find(w=>w.npc.active)?.npc;
    if(leader)rememberRoadJourney(party.route,leader,leader.roadTravelDirection);
    for(const walker of party.walkers){this.arrows.forget(walker.npc);if(walker.npc.active)this.scene.releaseRoadNpc(walker.npc);}
    this.parties.delete(id);
    for(const [enemy,npc] of this.opponents)if(party.walkers.some(w=>w.npc===npc))this.opponents.delete(enemy);
  }
  clear(){this.arrows.clear();for(const [id,party] of this.parties)this.release(id,party);this.pendingParty=null;this.spawnCandidates.length=0;this.opponents.clear();this.previousOpponents.clear();this.active=false;}
  destroy(){this.clear();this.arrows.destroy();this.art.destroy();}
}
