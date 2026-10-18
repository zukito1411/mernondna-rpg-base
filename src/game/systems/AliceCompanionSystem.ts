import Phaser from 'phaser';
import {ALICE_NPC_ID,aliceIsFollowing} from '../../data/aliceCompanion';
import {NPC_BY_ID} from '../../data/npcs';
import {npcCombatArt} from '../../data/npcCombatArt';
import {progressionStats,playerDamageGrowth} from '../../data/progression';
import {enhancedWeapon} from '../../data/weaponUpgrades';
import {useGameStore} from '../../store/gameStore';
import type {Npc} from '../entities/Npc';
import type {Enemy} from '../entities/Enemy';
import type {Vec2} from '../types';
import type {WorldScene} from '../scenes/WorldScene';
import {NpcCombatResidency} from './NpcCombatResidency';
import {AmbientNpcArrowSystem} from './AmbientNpcArrowSystem';
import {companionPath} from './companionNavigation';
import {approachVelocity} from './locomotion';
import {aliceTravelRemark} from '../../data/aliceTravelRemarks';
import {AliceSpeechBubble} from './AliceSpeechBubble';

const FOLLOW_SIDES=[46,-46,24,-24,0] as const;
const COMBAT_TURNS=[0,.6,-.6,1.2,-1.2] as const;

/** One persistent named NPC, with independent following and ranged support.
 * The recruitment flag lives in the existing validated/saved story ledger. */
export class AliceCompanionSystem {
  private npc:Npc|null=null;
  private target:Enemy|null=null;
  private readonly art:NpcCombatResidency;
  private readonly arrows:AmbientNpcArrowSystem;
  private trail:Vec2[]=[];
  private previousPlayer:Vec2|null=null;
  private heading={x:0,y:1};
  private location:string|null=null;
  private moving=false;
  private followSpeed=0;
  private combatWalking=false;
  private combatIntent:'retreat'|'approach'|null=null;
  private attacking=false;
  private released=false;
  private aim=new Phaser.Math.Vector2();
  private cooldown=0;
  private think=0;
  private route:Vec2[]=[];
  private routeGoal:Vec2|null=null;
  private replanAt=0;
  private hp=240;
  private rest=0;
  private dismissal=0;
  private contact:Phaser.GameObjects.Image|null=null;
  private wasBlocked=false;
  private previousAlice:Vec2|null=null;
  private movementSampleMs=0;
  private stationaryMs=0;
  private behindMs=0;
  private catchupRetryAt=0;
  private combatEnemies:Enemy[]=[];
  private remarkCheckAt=0;
  private remarkCooldownUntil=0;
  private remarkFlags:Record<string,boolean>|null=null;
  private remarkQuests:unknown=null;
  private remarkLocation='';
  private readonly speech:AliceSpeechBubble;
  constructor(private readonly scene:WorldScene){
    this.speech=new AliceSpeechBubble(scene,()=>this.actor);
    this.art=new NpcCombatResidency(scene,spec=>spec.id==='huntress'
      &&(aliceIsFollowing(useGameStore.getState().storyFlags)||Boolean(this.npc?.active)),console.warn);
    this.arrows=new AmbientNpcArrowSystem(scene,(_npc,enemy,direction)=>{
      const state=useGameStore.getState(),stats=progressionStats(state.attributes,state.learnedSkills);
      const weapon=enhancedWeapon(state.weaponId,state.weaponUpgrades);
      const damage=Math.max(18+state.level*2.8,weapon.damage*stats.damageMultiplier*playerDamageGrowth(state.level)*.65);
      enemy.takeDamage(damage,direction,{source:'companion'});
    });
  }
  get actor(){return this.npc?.active&&this.dismissal===0?this.npc:null;}
  get roomActor(){return this.scene.activeInteriorId!==null&&this.location===this.scene.activeInteriorId?this.actor:null;}
  pauseForStory(){
    this.speech.hide();
    this.stopCombat();this.npc?.setCompanionGoal(null);this.wasBlocked=true;this.route=[];this.moving=false;this.followSpeed=0;
  }
  opponent(enemy:Enemy){
    const npc=this.npc,player=this.scene.player;
    if(this.wasBlocked||this.rest>0||enemy.definition.boss||this.target!==enemy||!npc?.active)return null;
    // Shooting is support, not a taunt. Only defend herself at close range
    // when the player is outside the enemy's engagement area.
    const playerDistance=Math.hypot(enemy.x-player.x,enemy.y-player.y);
    if(enemy.playerContributed||playerDistance<=Math.max(420,enemy.definition.aggroRange*1.2))return null;
    return Math.hypot(enemy.x-npc.x,enemy.y-npc.y)<=150?npc:null;
  }
  damage(npc:Npc,amount:number){
    if(npc!==this.npc)return false;
    if(this.rest===0){
      this.hp=Math.max(0,this.hp-Math.max(1,amount));
      if(this.hp<this.maxHp*.2){this.rest=10000;this.stopCombat();npc.setStoryAlert('Catching her breath');}
    }
    return true;
  }
  private get maxHp(){return 180+useGameStore.getState().level*12;}
  update(time:number,delta:number,blocked:boolean){
    const step=Math.min(100,Math.max(0,delta)),following=aliceIsFollowing(useGameStore.getState().storyFlags);
    this.art.update();
    if(!following){
      this.speech.hide();
      if(this.npc?.active){
        this.stopCombat();this.npc.setCompanionGoal(null);
        if(blocked)return;
        this.dismissal+=step;this.npc.setCompanionAlpha(Math.max(0,1-this.dismissal/300));
        if(this.dismissal>=300){this.scene.returnAliceHome();this.reset();}
      }else this.reset();
      return;
    }
    const profile=npcCombatArt(NPC_BY_ID[ALICE_NPC_ID]);if(profile)this.art.ensure(profile);
    if(blocked||!this.scene.companionLocationReady){
      this.speech.hide();
      if(!this.wasBlocked){this.stopCombat();this.npc?.setCompanionGoal(null);}
      this.wasBlocked=true;this.followSpeed=0;return;
    }
    this.wasBlocked=false;
    if(!this.npc?.active){
      this.stopCombat();
      this.npc=this.scene.adventureAlice();if(!this.npc)return;
      this.npc.setAdventureCompanion(true);this.hp=this.maxHp;this.location=null;
      this.remarkCooldownUntil=time+9000;
      this.previousAlice=null;this.movementSampleMs=0;this.stationaryMs=0;this.behindMs=0;this.think=0;this.combatEnemies=[];
    }
    const npc=this.npc,player=this.scene.player,location=this.scene.activeInteriorId??'world';
    if(this.dismissal){npc.setCompanionAlpha(1);this.dismissal=0;}
    const transition=location!==this.location;
    const jump=this.previousPlayer&&Math.hypot(player.x-this.previousPlayer.x,player.y-this.previousPlayer.y)>1200;
    if(transition||jump){
      this.stopCombat();this.trail=[];this.route=[];this.moving=false;this.followSpeed=0;
      this.routeGoal=null;this.replanAt=0;this.previousAlice=null;this.movementSampleMs=0;this.stationaryMs=0;this.behindMs=0;
      this.think=0;this.combatEnemies=[];
      this.heading={x:player.lastDirection.x,y:player.lastDirection.y};
      if(Math.hypot(npc.x-player.x,npc.y-player.y)>550||this.location!==null){
        const point=this.arrivalPoint(npc);if(!point)return;
        (npc.body as Phaser.Physics.Arcade.Body).reset(point.x,point.y);
        npc.setPosition(point.x,point.y).setDepth(this.scene.playerRenderDepth(point.y));
      }
      this.previousPlayer={x:player.x,y:player.y};
      this.location=location;this.contact?.destroy();this.contact=null;
      if(this.scene.inInterior)this.contact=this.scene.addInteriorContact(npc);
    }
    npc.setCompanionCamera(player.cameraFilter);npc.setVisible(true);
    const previous=this.previousPlayer??player;
    const distanceMoved=Math.hypot(player.x-previous.x,player.y-previous.y);
    const playerSpeed=Math.min(310,distanceMoved/Math.max(.001,step/1000));
    this.previousPlayer={x:player.x,y:player.y};
    const last=this.trail.at(-1);
    if(!last||Math.hypot(player.x-last.x,player.y-last.y)>=18){
      if(last){const direction=new Phaser.Math.Vector2(player.x-last.x,player.y-last.y).normalize();this.heading={x:direction.x,y:direction.y};}
      this.trail.push({x:player.x,y:player.y});if(this.trail.length>300)this.trail.shift();
    }
    // When ordinary movement leaves Alice stuck behind a rock, fence, house
    // or failed navigation route, recover her near the player. The same
    // collision and path validation used on transitions prevents unsafe warps.
    this.catchUp(time,step,npc,player);
    this.cooldown=Math.max(0,this.cooldown-step);this.think-=step;
    if(this.rest>0){this.rest=Math.max(0,this.rest-step);this.hp=Math.min(this.maxHp,this.hp+this.maxHp*step/10000);}
    else this.hp=Math.min(this.maxHp,this.hp+step*.003);
    // Projectile collision still updates every frame, but enemy admission
    // and story filtering need only be rebuilt on the existing 120ms AI tick.
    const decide=this.think<=0;
    if(decide){
      this.think=120;
      this.combatEnemies=this.scene.getCombatEnemies()
        .filter(e=>e.active&&e.hp>0&&e.canBeTargeted&&(!this.scene.storyActor(e)||this.scene.isDungeonEnemy(e)));
    }
    const enemies=this.combatEnemies;
    this.arrows.update(step,enemies);
    if(this.target&&(!this.target.active||this.target.hp<=0||!enemies.includes(this.target)
      ||Math.hypot(this.target.x-player.x,this.target.y-player.y)>620
      ||Math.hypot(npc.x-player.x,npc.y-player.y)>520||this.rest>0))this.stopCombat();
    if(decide){
      if(!this.target&&this.rest===0&&npc.canStoryFight){
        // Same player-hit preference and nearest reachable target, without
        // temporary filtered/sorted arrays or LOS checks for worse scores.
        let best=Infinity;
        for(const enemy of enemies){
          const distance=Math.hypot(enemy.x-player.x,enemy.y-player.y);
          if(distance>=420||Math.hypot(enemy.x-npc.x,enemy.y-npc.y)>=500)continue;
          const score=distance-(enemy.playerContributed?1000:0);
          if(score<best&&this.scene.hasClearPath(npc.x,npc.y,enemy.x,enemy.y)){
            best=score;this.target=enemy;
          }
        }
      }
    }
    if(this.target){
      this.speech.hide();
      this.followSpeed=0;this.fight(time,this.target);
    }else{
      this.follow(time,playerSpeed,step);
      if(decide)this.updateTravelRemark(time);
    }
    // Outdoor movement uses normal Arcade physics; rooms advance swept feet
    // manually while the exterior physics world is paused.
    if(this.scene.inInterior){
      npc.updatePatrol(time,step);npc.advanceCinematic(step);
      npc.updatePresentation(player.x,player.y,false);npc.setDepth(this.scene.playerRenderDepth(npc.y));
      npc.setInteriorLabelDepth(this.scene.playerRenderDepth(0));
    }
  }
  /** Avoid permanently abandoning the player when a path is impossible.
   * Nothing is spawned/destroyed; the same persistent Alice NPC is relocated.
   * Walk normally unless the gap is extreme or progress has stopped. */
  private catchUp(time:number,step:number,npc:Npc,player:Vec2){
    const gap=Math.hypot(player.x-npc.x,player.y-npc.y);
    // Sample movement over ~250 ms, not individual frames: at high refresh
    // rates a normally walking companion may move <1 pixel each frame.
    this.movementSampleMs+=step;
    if(this.movementSampleMs>=240){
      const progress=this.previousAlice
        ?Math.hypot(npc.x-this.previousAlice.x,npc.y-this.previousAlice.y):Infinity;
      this.previousAlice={x:npc.x,y:npc.y};
      this.stationaryMs=gap>220&&progress<3
        ?this.stationaryMs+this.movementSampleMs:0;
      this.movementSampleMs=0;
    }
    // Holding position while covering the player is intentional, not stuck.
    if(this.target&&gap<520){
      this.stationaryMs=0;this.behindMs=0;return;
    }
    this.behindMs=gap>360?this.behindMs+step:0;
    if(gap<520&&!(gap>250&&this.stationaryMs>=1600)
      &&!(gap>360&&this.behindMs>=2700))return;
    if(time<this.catchupRetryAt)return;
    this.catchupRetryAt=time+850;
    const point=this.arrivalPoint(npc);
    if(!point)return; // Retry only when the nearby terrain is truly safe.
    this.stopCombat();
    npc.setCompanionGoal(null);
    (npc.body as Phaser.Physics.Arcade.Body).reset(point.x,point.y);
    npc.setPosition(point.x,point.y).setDepth(this.scene.playerRenderDepth(point.y));
    this.previousAlice={...point};this.movementSampleMs=0;this.stationaryMs=0;this.behindMs=0;
    this.trail=[];this.route=[];this.routeGoal=null;this.replanAt=0;
    this.moving=false;this.followSpeed=0;this.think=0;this.combatEnemies=[];
  }
  private stopCombat(){
    const npc=this.npc?.active?this.npc:null;
    if(this.target||this.attacking||this.combatWalking){npc?.endStoryAttack();npc?.endStoryGuard();}
    this.target=null;this.attacking=false;this.combatWalking=false;this.combatIntent=null;
    this.route=[];this.routeGoal=null;this.arrows.clear();
  }
  private updateTravelRemark(time:number){
    if(time<this.remarkCheckAt||time<this.remarkCooldownUntil||this.rest>0)return;
    this.remarkCheckAt=time+1500;
    const state=useGameStore.getState(),player=this.scene.player;
    if(state.aliceRemark||state.toast||state.hp<=0||this.combatEnemies.some(e=>e.active&&e.hp>0
      &&Math.hypot(e.x-player.x,e.y-player.y)<400))return;
    const location=state.regionId+':'+state.townId;
    if(this.remarkFlags===state.storyFlags&&this.remarkQuests===state.quests&&this.remarkLocation===location)return;
    this.remarkFlags=state.storyFlags;this.remarkQuests=state.quests;this.remarkLocation=location;
    const remark=aliceTravelRemark(state.storyFlags,state.quests,state.regionId,state.townId);
    if(!remark)return;
    this.remarkCooldownUntil=time+60000;
    // One store update and one saved flag per remark, not a dialogue or pause.
    useGameStore.setState({aliceRemark:{id:remark.id,text:remark.text},
      storyFlags:{...state.storyFlags,['alice:remark:'+remark.id]:true}});
    this.speech.show(remark.id,remark.text);
  }
  private arrivalPoint(npc:Npc){
    const p=this.scene.player,h=this.heading;
    const preferred={x:p.x-h.x*92-h.y*48,y:p.y-h.y*92+h.x*48};
    const candidates=[preferred];
    for(const radius of [84,116,156])for(let i=0;i<12;i++)candidates.push({x:p.x+Math.cos(i*Math.PI/6)*radius,y:p.y+Math.sin(i*Math.PI/6)*radius});
    return candidates.find(point=>this.scene.companionCanStand(point,npc)&&this.scene.companionPathClear(p,point,npc));
  }
  private clear=(a:Vec2,b:Vec2)=>this.scene.companionPathClear(a,b,this.npc!);
  private navigate(time:number,goal:Vec2):Vec2|null{
    const npc=this.npc!;
    if(this.clear(npc,goal)){this.route=[];return goal;}
    // If a turn put the latest destination beyond a wall, first return to a
    // nearby point on the player's actual trail, then continue around it.
    if(Math.hypot(goal.x-npc.x,goal.y-npc.y)>500){
      let nearest=-1,best=Infinity;
      this.trail.forEach((p,i)=>{const distance=Math.hypot(p.x-npc.x,p.y-npc.y);if(distance<best){best=distance;nearest=i;}});
      if(nearest>=0){
        const ahead=this.trail[Math.min(this.trail.length-1,nearest+2)];
        if(Math.hypot(ahead.x-npc.x,ahead.y-npc.y)>24)goal=ahead;
      }
    }
    if(time>=this.replanAt&&(!this.route.length||!this.routeGoal||Math.hypot(goal.x-this.routeGoal.x,goal.y-this.routeGoal.y)>48)){
      this.replanAt=time+450;this.routeGoal={...goal};this.route=companionPath(npc,goal,this.clear);
    }
    while(this.route.length&&Math.hypot(npc.x-this.route[0].x,npc.y-this.route[0].y)<12)this.route.shift();
    const next=this.route[0];
    if(next&&!this.clear(npc,next)){this.route=[];this.replanAt=Math.min(this.replanAt,time+120);return null;}
    return next??null;
  }
  private follow(time:number,playerSpeed:number,delta:number){
    const npc=this.npc!,player=this.scene.player;
    // Follow the exact same trail without copying up to 300 points each frame.
    let remaining=108,point={x:player.x,y:player.y},h=this.heading;
    let tail:Vec2=point;
    for(let i=this.trail.length-1;i>=0;i--){
      const a=this.trail[i],b=tail,length=Math.hypot(b.x-a.x,b.y-a.y);
      tail=a;if(length<.01)continue;
      h={x:(b.x-a.x)/length,y:(b.y-a.y)/length};
      if(length>=remaining){point={x:b.x-h.x*remaining,y:b.y-h.y*remaining};remaining=0;break;}
      remaining-=length;point=a;
    }
    if(remaining>0)point={x:point.x-h.x*remaining,y:point.y-h.y*remaining};
    // Retain the same side through a turn; fall back to the actual trail on
    // narrow bridges instead of stepping onto water or clipping scenery.
    let goal:Vec2|undefined;
    for(const side of FOLLOW_SIDES){
      const candidate={x:point.x-h.y*side,y:point.y+h.x*side};
      if(this.scene.companionCanStand(candidate,npc)){goal=candidate;break;}
    }
    if(!goal){npc.setCompanionGoal(null);this.followSpeed=0;return;}
    const distance=Math.hypot(goal.x-npc.x,goal.y-npc.y),gap=Math.hypot(player.x-npc.x,player.y-npc.y);
    if(!this.moving&&(distance>32||gap<54))this.moving=true;
    if(this.moving&&distance<9&&playerSpeed<20)this.moving=false;
    npc.setStoryAlert(this.rest>0?'Catching her breath':'Adventuring with you');
    const next=this.moving?this.navigate(time,goal):null;
    // Match the player's pace with a small catch-up allowance instead of
    // sprinting toward every new trail point. Ease acceleration and arrival.
    const pace=Math.max(110,playerSpeed);
    const correction=Phaser.Math.Clamp((distance-36)*.22,-pace*.55,28);
    const desired=Math.min(275,pace+correction);
    this.followSpeed=next?approachVelocity(this.followSpeed,desired,delta,140):0;
    npc.setCompanionGoal(next,this.followSpeed);
  }
  private fight(time:number,enemy:Enemy){
    const npc=this.npc!,distance=Math.hypot(enemy.x-npc.x,enemy.y-npc.y);
    npc.setStoryAlert('Covering you');
    if(this.attacking){
      if(!this.released&&npc.storyStrikeReady){
        this.released=true;
        const direction=new Phaser.Math.Vector2(enemy.x-npc.x,enemy.y-npc.y);
        if(distance<=npc.storyAttackReach+8&&this.aim.dot(direction.normalize())>.45
          &&this.scene.hasClearPath(npc.x,npc.y,enemy.x,enemy.y))this.arrows.fire(npc,enemy);
      }
      if(npc.storyAttackFinished){this.attacking=false;npc.endStoryAttack();}
      return;
    }
    const retreat=distance<110||this.combatIntent==='retreat'&&distance<185;
    const approach=distance>290||this.combatIntent==='approach'&&distance>250;
    if(retreat||approach||!this.scene.hasClearPath(npc.x,npc.y,enemy.x,enemy.y)){
      if(!this.combatWalking){npc.endStoryGuard();this.combatWalking=true;this.route=[];}
      this.combatIntent=retreat?'retreat':'approach';
      const direction=new Phaser.Math.Vector2(npc.x-enemy.x,npc.y-enemy.y).normalize();
      let goal:Vec2|undefined;
      for(const turn of COMBAT_TURNS){
        const cos=Math.cos(turn),sin=Math.sin(turn);
        const p={x:enemy.x+(direction.x*cos-direction.y*sin)*210,
          y:enemy.y+(direction.x*sin+direction.y*cos)*210};
        if(Math.hypot(p.x-this.scene.player.x,p.y-this.scene.player.y)<440&&this.scene.companionCanStand(p,npc)){goal=p;break;}
      }
      npc.setCompanionGoal(goal?this.navigate(time,goal):null,retreat?165:145);return;
    }
    npc.setCompanionGoal(null);
    if(this.combatWalking||!npc.storyMoving){npc.beginStoryGuard();this.combatWalking=false;this.combatIntent=null;}
    npc.holdStoryGuard(enemy);
    if(this.cooldown===0&&npc.beginStoryAttack(enemy)){
      this.attacking=true;this.released=false;this.cooldown=1250;
      this.aim.set(enemy.x-npc.x,enemy.y-npc.y).normalize();
    }
  }
  private reset(){
    this.speech.hide();
    this.stopCombat();
    this.contact?.destroy();this.contact=null;this.npc=null;this.target=null;this.location=null;this.previousPlayer=null;
    this.trail=[];this.route=[];this.dismissal=0;this.moving=false;this.followSpeed=0;this.wasBlocked=false;
    this.rest=0;this.cooldown=0;this.think=0;this.replanAt=0;
    this.combatEnemies=[];this.previousAlice=null;this.movementSampleMs=0;this.stationaryMs=0;this.behindMs=0;this.catchupRetryAt=0;
  }
  destroy(){this.speech.destroy();this.stopCombat();this.contact?.destroy();this.art.destroy();this.arrows.destroy();this.npc=null;}
}
