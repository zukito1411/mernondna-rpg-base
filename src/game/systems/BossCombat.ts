import Phaser from 'phaser';
import type {Enemy} from '../entities/Enemy';
import type {WorldScene} from '../scenes/WorldScene';
import {bossPattern,type BossCombatProfile,type BossMove} from '../../data/bossCombatProfiles';
import {AttackTelegraph} from './AttackTelegraph';
import {attackAreaContains,windupProgress,type AttackArea} from './attackWarning';
import {MagusSpellVisual,magusSpellColor} from './MagusSpellVisual';

/** Bounded active-play state machine: no damaging timers survive cancellation,
 * death, a menu, loss of sight/territory, staggering or chunk unloading. */
export class BossCombat {
  private phase:'ready'|'windup'|'charge'|'recovery'='ready';
  private clock=0;private age=0;private nextReady=900;private sequence=0;
  private combo:readonly BossMove[]=[];private step=0;
  private area:AttackArea|null=null;
  private readonly warning:AttackTelegraph;
  private chargeStart={x:0,y:0};private chargeTravel=0;private hit=false;
  private spellVisual:Phaser.GameObjects.Sprite|null=null;
  private spellTimer:Phaser.Time.TimerEvent|null=null;
  private magusVisual:MagusSpellVisual|null=null;
  private released=false;
  constructor(private readonly enemy:Enemy,private readonly scene:WorldScene,readonly profile:BossCombatProfile){
    this.warning=new AttackTelegraph(scene,'boss-attack-fill:'+enemy.instanceId);
  }
  get attackName(){return this.phase==='ready'?null:this.combo[this.step]?.name??null;}
  get isAttacking(){return this.phase!=='ready';}
  get windupFraction(){return this.phase==='windup'?this.warning.progress:null;}
  update(delta:number,engaged:boolean){
    const e=this.enemy,body=e.body as Phaser.Physics.Arcade.Body,player=this.scene.player;
    const dt=Math.max(0,Math.min(100,delta))*e.attackSpeedMultiplier;
    this.magusVisual?.update(delta);
    this.clock+=dt;
    if(!engaged||e.hp<=0||!player.active||!this.scene.combatAllowed){this.cancel();return;}
    if(e.isStaggered){body.setVelocity(0,0);return;}
    this.age+=dt;
    if(!this.combo.length){this.combo=bossPattern(this.profile,this.sequence,e.hp/e.definition.hp);this.step=0;}
    // Choose a close defence only before committing to a telegraphed spell.
    if(this.phase==='ready'&&this.profile.closeMove){
      if(Math.hypot(player.x-e.x,player.y-e.y)<=(this.profile.closeRange??0)){
        this.combo=[this.profile.closeMove];this.step=0;
      }else if(this.combo[0]===this.profile.closeMove){this.combo=bossPattern(this.profile,this.sequence,e.hp/e.definition.hp);this.step=0;}
    }
    const move=this.combo[this.step];
    if(this.phase==='ready'){
      this.approach(move,dt);
      const distance=Math.hypot(player.x-e.x,player.y-e.y);
      if(this.clock>=this.nextReady&&distance<=move.range&&this.scene.hasClearPath(e.x,e.y,player.x,player.y))this.begin(move);
      return;
    }
    body.setVelocity(0,0);
    if(this.phase==='windup'){
      const progress=windupProgress(this.age,move.windup);
      this.warning.draw(this.area!,progress,this.warningDepth,magusSpellColor(move,this.profile.color));
      if(move.spell&&progress>=.7&&!this.released){this.released=true;e.finishBossWindup(move.recovery);}
      this.magusVisual?.windup(e,move,progress);
      if(this.age<move.windup)return;
      e.finishBossWindup(move.recovery);
      if(move.chargeMs){this.phase='charge';this.age=0;this.chargeTravel=0;return;}
      this.impact(move);this.phase='recovery';this.age=0;
    }else if(this.phase==='charge'){
      const range=this.area!.range??0;
      const travel=range*windupProgress(this.age,move.chargeMs!);
      // Short swept steps constrain both collision and damage during a charge.
      // A blocked wall/ship edge stops the charge; no body.reset teleport through it.
      while(this.chargeTravel<travel){
        const next=Math.min(travel,this.chargeTravel+12),a=this.area!.angle;
        const x=this.chargeStart.x+Math.cos(a)*next,y=this.chargeStart.y+Math.sin(a)*next;
        if(!this.scene.canEnemyOccupy(x,y,e)||!this.scene.hasClearPath(e.x,e.y,x,y,e)){
          this.phase='recovery';this.age=0;break;
        }
        body.reset(x,y);this.chargeTravel=next;
        if(!this.hit&&Math.hypot(player.x-e.x,player.y-e.y)<=move.radius
          &&this.scene.hasClearPath(e.x,e.y,player.x,player.y))this.hurtPlayer(move);
      }
      this.warning.draw(this.area!,1,this.warningDepth,this.profile.color);
      if(this.phase==='charge'&&this.age>=move.chargeMs!){this.phase='recovery';this.age=0;}
    }else{
      if(this.age<150)this.warning.draw(this.area!,1,this.warningDepth,magusSpellColor(move,this.profile.color));
      else this.warning.clear();
      if(this.age<move.recovery)return;
      this.step++;
      if(this.step<this.combo.length){
        const followup=this.combo[this.step];
        if(Math.hypot(player.x-e.x,player.y-e.y)<=followup.range&&this.scene.hasClearPath(e.x,e.y,player.x,player.y)){
          this.begin(followup);return;
        }
      }
      this.sequence++;this.combo=[];this.phase='ready';this.age=0;
      const enraged=e.hp/e.definition.hp<=(this.profile.enrageAt??.5);
      this.nextReady=this.clock+this.profile.cooldown*(enraged?(this.profile.enrageCooldownMultiplier??1):1);this.warning.clear();
    }
  }
  private begin(move:BossMove){
    this.clearSpell(false);this.released=false;
    const e=this.enemy,player=this.scene.player,body=e.body as Phaser.Physics.Arcade.Body;
    const angle=Math.atan2(player.y-e.y,player.x-e.x);
    this.area={kind:move.kind,x:move.target?player.x:e.x,y:move.target?player.y:e.y,angle,
      radius:move.radius,range:move.range,innerRadius:move.innerRadius,halfAngle:move.halfAngle};
    if(move.kind==='line'){
      // Validate the advertised lane before drawing it, then validate it again
      // while travelling in case an actor or collision has changed. Spell
      // lanes also stop at walls instead of sending artwork into the void.
      let length=0;
      for(let distance=12;distance<=move.range;distance+=12){
        const x=e.x+Math.cos(angle)*distance,y=e.y+Math.sin(angle)*distance;
        if(!this.scene.canEnemyOccupy(x,y,e)||!this.scene.hasClearPath(e.x,e.y,x,y,e))break;
        length=distance;
      }
      this.area.range=length;
    }
    this.chargeStart={x:e.x,y:e.y};this.hit=false;this.phase='windup';this.age=0;
    body.setVelocity(0,0);
    e.playBossWindup(move.windup,move.recovery+(move.chargeMs??0),angle,move.presentation==='cast');
    e.playMonsterVocal('attack');e.playMonsterAttackFoley('windup');
    if(move.spell){this.magusVisual??=new MagusSpellVisual(this.scene);this.magusVisual.begin(e,move,this.area);}
    this.warning.draw(this.area,0,this.warningDepth,magusSpellColor(move,this.profile.color));
  }
  private impact(move:BossMove){
    const e=this.enemy,player=this.scene.player,area=this.area!;
    e.playMonsterAttackFoley('impact');
    e.playBossImpact(area.radius);
    if(move.spell)this.magusVisual?.impact(move,area);
    else if(move.presentation==='cast'){
      // Reuse the finished rune artwork, not a new procedural spell renderer.
      // Visuals do not own damage: the warned area below remains authoritative.
      this.clearSpell();
      const rune=this.spellVisual=this.scene.add.sprite(area.x,area.y,'effect_teleport',0).setTint(this.profile.color)
        .setDisplaySize(area.radius*2,area.radius*2).setDepth(this.scene.playerRenderDepth(area.y)+1).play('effect-teleport');
      rune.once(Phaser.Animations.Events.ANIMATION_COMPLETE,()=>{if(this.spellVisual===rune)this.clearSpell();});
      this.spellTimer=this.scene.time.delayedCall(500,()=>{if(this.spellVisual===rune)this.clearSpell();});
    }
    if(!move.spell){const ring=this.scene.add.circle(area.x,area.y,Math.max(10,area.innerRadius??12))
      .setStrokeStyle(3,this.profile.color,.8).setDepth(this.scene.playerRenderDepth(area.y)+1);
    this.scene.tweens.add({targets:ring,radius:area.radius,alpha:0,duration:250,onComplete:()=>ring.destroy()});}
    if(attackAreaContains(area,player.x,player.y)
      &&this.scene.hasClearPath(e.x,e.y,area.x,area.y,e)
      &&this.scene.hasClearPath(area.x,area.y,player.x,player.y,e))this.hurtPlayer(move);
  }
  private hurtPlayer(move:BossMove){
    if(this.hit)return;this.hit=true;
    const player=this.scene.player;
    this.scene.damagePlayer(Math.round(this.enemy.definition.damage*move.damage));
    this.scene.playEffect('hit',player.x,player.y,new Phaser.Math.Vector2(Math.cos(this.area!.angle),Math.sin(this.area!.angle)));
  }
  private approach(move:BossMove,delta:number){
    const e=this.enemy,body=e.body as Phaser.Physics.Arcade.Body,player=this.scene.player;
    const dx=player.x-e.x,dy=player.y-e.y,distance=Math.max(1,Math.hypot(dx,dy));
    const desired=Math.min(this.profile.preferredRange,move.range*.76);
    const radial=Phaser.Math.Clamp((distance-desired)/65,-.65,1);
    const strafe=distance<desired+100?this.profile.strafe*(this.sequence%2===0?1:-1):0;
    const vx=dx/distance*radial-dy/distance*strafe,vy=dy/distance*radial+dx/distance*strafe;
    const length=Math.hypot(vx,vy);
    if(length<.06){body.setVelocity(0,0);return;}
    const heading=Math.atan2(vy,vx),speed=e.movementSpeed*Math.min(1,length);
    for(const offset of [0,.5,-.5,1,-1]){
      const x=Math.cos(heading+offset),y=Math.sin(heading+offset);
      if(this.scene.canEnemyOccupy(e.x+x*28,e.y+y*28,e)&&this.scene.hasClearPath(e.x,e.y,e.x+x*28,e.y+y*28,e)){
        body.setVelocity(x*speed,y*speed);return;
      }
    }
    // Keep the existing navigation path around scenery when direct steering fails.
    const waypoint=this.scene.enemyNavigationPoint(e,player),angle=Math.atan2(waypoint.y-e.y,waypoint.x-e.x);
    const x=e.x+Math.cos(angle)*Math.min(24,e.movementSpeed*delta/1000),y=e.y+Math.sin(angle)*Math.min(24,e.movementSpeed*delta/1000);
    if(this.scene.canEnemyOccupy(x,y,e)&&this.scene.hasClearPath(e.x,e.y,x,y,e))body.setVelocity(Math.cos(angle)*speed,Math.sin(angle)*speed);
    else body.setVelocity(0,0);
  }
  cancel(delay=700){
    this.clearSpell();
    if(this.isAttacking){
      this.enemy.cancelBossWindup();
      // Repeated interrupts must not pin a tower boss to pattern zero forever.
      if(this.profile.resistFlurry)this.sequence++;
    }
    this.phase='ready';this.combo=[];this.area=null;this.age=0;this.warning.clear();
    this.nextReady=this.clock+delay;
  }
  private clearSpell(clearAfterglow=true){if(clearAfterglow)this.magusVisual?.clear();this.spellTimer?.remove(false);this.spellTimer=null;this.spellVisual?.destroy();this.spellVisual=null;}
  private get warningDepth(){return this.scene.playerRenderDepth(Math.min(this.enemy.y,this.scene.player.y))-2;}
  destroy(){this.clearSpell();this.warning.destroy();}
}
