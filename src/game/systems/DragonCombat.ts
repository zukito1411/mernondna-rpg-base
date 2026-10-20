import Phaser from 'phaser';
import type {Enemy} from '../entities/Enemy';
import type {WorldScene} from '../scenes/WorldScene';
import {DRAGON_LAIR,inDragonArena} from '../../data/dragonLair';
import {artScale,actorArtLayout} from '../../data/art';
import {enemyAppearanceMultiplier} from '../../data/enemies';
import {enemyAnimation} from '../../data/animationPacks';
import {DragonBreathEffect} from './DragonBreathEffect';
import {DRAGON_BREATH,breathPresentation,insideBreathCone,dragonMouth} from './dragonBreath';
import {ATTACK_WARNING_FRAMES,ATTACK_WARNING_TEXTURE} from './attackWarning';
import {AttackTelegraph} from './AttackTelegraph';
import {bossPattern,type BossCombatProfile,type BossMove} from '../../data/bossCombatProfiles';
import {TOWER_ROUND_FLOOR} from '../../data/towerRoom';
import {BossSkillVisual} from './BossSkillVisual';

type Phase='rest'|'stomp-windup'|'breath-windup'|'breath'|'flight'|'landing'|'recover';
const smooth=(value:number)=>{const p=Phaser.Math.Clamp(value,0,1);return p*p*(3-2*p);};
/** Local, delta-driven boss phases. Pause/dialogue stops gameplay updates;
 * no delayed damaging callbacks survive an unload or a defeated encounter. */
export class DragonCombat {
  private phase:Phase='rest';private age=0;private clock=0;private nextAttack=2500;private sequence=0;
  private readonly aim=new Phaser.Math.Vector2(1,0);
  private readonly warningArt:Phaser.GameObjects.Image;
  private readonly warningFill:AttackTelegraph;
  private readonly fire:DragonBreathEffect;
  private readonly flight:Phaser.GameObjects.Sprite;
  private readonly shadow:Phaser.GameObjects.Ellipse;
  private breathTick=0;
  private breathSoundPlayed=false;
  private flightStart={x:0,y:0};private landingPoint={...DRAGON_LAIR};
  private lastFlightX=0;
  private readonly effects:BossSkillVisual;
  private readonly home:{x:number;y:number};
  private readonly tower:boolean;
  private move:BossMove|null=null;
  private breathRange:number=DRAGON_BREATH.range;
  constructor(private readonly enemy:Enemy,private readonly scene:WorldScene,private currentProfile?:BossCombatProfile){
    const profile=currentProfile;
    this.tower=Boolean(profile&&enemy.instanceId.startsWith('dungeon-event:might-'));
    this.home=this.tower?scene.dungeonPoint(TOWER_ROUND_FLOOR):{...DRAGON_LAIR};
    this.nextAttack=this.tower?900:2500;
    this.effects=new BossSkillVisual(scene,'ember');
    this.warningFill=new AttackTelegraph(scene,'dragon-windup-fill:'+enemy.instanceId,false);
    this.warningArt=scene.add.image(enemy.x,enemy.y,ATTACK_WARNING_TEXTURE,ATTACK_WARNING_FRAMES.circle.name)
      .setOrigin(.5).setAlpha(0).setVisible(false).setName('dragon-warning:'+enemy.instanceId);
    this.fire=new DragonBreathEffect(scene,enemy.instanceId);
    this.flight=scene.add.sprite(enemy.x,enemy.y,'enemy_dragon_fly',0)
      .setOrigin(.5,actorArtLayout('enemy_dragon_fly').originY)
      .setScale(artScale('enemy_dragon_fly')*enemyAppearanceMultiplier(enemy.definition))
      .setVisible(false).setName('dragon-flight:'+enemy.instanceId);
    this.shadow=scene.add.ellipse(enemy.x,enemy.y,180,70,0x100909,.4).setVisible(false).setName('dragon-flight-shadow');
  }
  get profile(){return this.currentProfile;}
  // An airborne dragon finishes its existing landing before selecting the new
  // move set. Never replace a live flight controller or strand its collision.
  setProfile(profile:BossCombatProfile){this.currentProfile=profile;}
  get airborne(){return this.phase==='flight'||this.phase==='landing';}
  get attackName(){return this.move&&this.phase!=='rest'&&this.phase!=='recover'?this.move.name:this.phase==='stomp-windup'?'Ember stomp':this.phase==='breath-windup'||this.phase==='breath'?'Ember breath':this.airborne?'Skyfall landing':null;}
  private get stompWindupMs(){return this.move?.dragonAction==='stomp'?this.move.windup:1000;}
  private get breathWindupMs(){return this.move?.dragonAction==='breath'?this.move.windup:DRAGON_BREATH.windupMs;}
  get windupFraction(){return this.phase==='stomp-windup'?Math.min(1,this.age/this.stompWindupMs):this.phase==='breath-windup'?Math.min(1,this.age/this.breathWindupMs):this.phase==='flight'?this.age/4300:this.phase==='landing'?Math.min(1,(3200+this.age)/4300):null;}
  get visual():Phaser.GameObjects.Sprite{return this.airborne?this.flight:this.enemy;}
  pause(paused:boolean){if(!this.flight.active)return;if(paused)this.flight.anims.pause();else this.flight.anims.resume();}
  private enter(phase:Phase){
    if(this.phase==='flight'||this.phase==='landing')this.scene.stopDragonSound(this.enemy.instanceId,'flight');
    if(this.phase==='breath')this.scene.stopDragonSound(this.enemy.instanceId,'breath');
    this.phase=phase;this.age=0;this.warningArt.setVisible(false);this.warningFill.clear();this.fire.hide();if(phase==='breath')this.breathSoundPlayed=false;
  }
  private groundAnimation(state:'idle'|'walk'|'attack'){
    if(state==='attack'){this.enemy.useVisualTexture('enemy_dragon');this.enemy.play(enemyAnimation(this.enemy.definition.spriteFrame,state).key,true);}
    else this.enemy.playLocomotion(state);
    this.enemy.anims.timeScale=1;
  }
  private leaveAir(){
    (this.enemy.body as Phaser.Physics.Arcade.Body).checkCollision.none=false;
    this.flight.setVisible(false);this.shadow.setVisible(false);this.enemy.setAlpha(1);
  }
  private inArena(x:number,y:number,padding=0){
    return this.tower?Math.hypot(x-this.home.x,y-this.home.y)<=TOWER_ROUND_FLOOR.radius-180+padding:inDragonArena(x,y,padding);
  }
  private clampTowerPoint(x:number,y:number){
    const dx=x-this.home.x,dy=y-this.home.y,length=Math.hypot(dx,dy);
    const scale=Math.min(1,(TOWER_ROUND_FLOOR.radius-300)/Math.max(1,length));
    return {x:this.home.x+dx*scale,y:this.home.y+dy*scale};
  }
  update(delta:number){
    const e=this.enemy,body=e.body as Phaser.Physics.Arcade.Body,player=this.scene.player;
    if(e.hp<=0||player.hp<=0||!player.active||!this.scene.combatAllowed){this.leaveAir();this.enter('rest');this.effects.clear();return;}
    const dt=Math.min(Math.max(0,delta),100)*(this.airborne?1:e.attackSpeedMultiplier);this.age+=dt;this.clock+=dt;
    this.effects.update(dt);
    const distance=Math.hypot(player.x-e.x,player.y-e.y);
    const engaged=this.tower?this.scene.canEnemyTargetPlayer(e):inDragonArena(player.x,player.y,80)&&Math.hypot(player.x-DRAGON_LAIR.x,player.y-DRAGON_LAIR.y)<1100;
    if(!engaged&&this.phase!=='rest'){
      this.leaveAir();body.reset(this.home.x,this.home.y);this.enter('rest');this.effects.clear();this.nextAttack=this.clock+2500;
    }
    body.setVelocity(0,0);e.setDepth(this.scene.playerRenderDepth(e.y));
    if(e.isStaggered)return;
    if(this.phase==='rest'){
      const goal=engaged?{x:player.x,y:player.y}:{x:this.home.x+Math.cos(this.clock*.00018)*150,y:this.home.y+Math.sin(this.clock*.00018)*110};
      const dx=goal.x-e.x,dy=goal.y-e.y,length=Math.hypot(dx,dy);
      if(length>(engaged?170:35)){
        const vx=dx/length*e.movementSpeed*(engaged?1:.45),vy=dy/length*e.movementSpeed*(engaged?1:.45);
        const ahead={x:e.x+vx*.7,y:e.y+vy*.7};
        if(this.inArena(ahead.x,ahead.y)&&this.scene.canEnemyOccupy(ahead.x,ahead.y,e)&&this.scene.hasClearPath(e.x,e.y,ahead.x,ahead.y,e)){
          body.setVelocity(vx,vy);e.setFlipX(dx<0);this.groundAnimation('walk');
        }else this.groundAnimation('idle');
      }else this.groundAnimation('idle');
      if(engaged&&distance<650&&this.clock>=this.nextAttack&&this.scene.hasClearPath(e.x,e.y,player.x,player.y)){
        body.setVelocity(0,0);this.aim.set(player.x-e.x,player.y-e.y).normalize();
        if(this.aim.lengthSq()===0)this.aim.set(e.flipX?-1:1,0);
        e.useVisualTexture('enemy_dragon');
        e.setFlipX(this.aim.x<0);
        e.playMonsterVocal('attack');
        e.playMonsterAttackFoley('windup');
        // Wounded Varkhul alternates pressure breath with more aerial attacks,
        // retaining the full stomp, breath and landing dodge windows.
        const choices=e.hp/e.definition.hp<=.5?[1,2,0,1,2,1]:[0,1,2,1];
        this.move=this.profile?bossPattern(this.profile,this.sequence,e.hp/e.definition.hp)[0]:null;
        const action=this.move?.dragonAction;
        const choice=action==='flight'?2:action==='breath'?1:action==='stomp'?0:choices[this.sequence%choices.length];
        this.sequence++;
        if(choice===2)this.startFlight();
        else if(choice===0){this.enter('stomp-windup');this.scene.playDragonSound(e.instanceId,'roar',e.x,e.y,1000);e.anims.stop();e.setFrame(enemyAnimation(5,'attack').frames[1]);this.scene.notify('Varkhul raises his claws — leave the marked stomp circle!');}
        else {this.enter('breath-windup');this.lockBreathRange();e.anims.stop();this.breathPose(0);this.scene.notify('Varkhul draws breath — move out of the fire cone!');}
      }
    }else if(this.phase==='stomp-windup'){
      this.drawCircle(e.x,e.y,240,this.age/this.stompWindupMs);
      if(this.age>=this.stompWindupMs){e.setFrame(enemyAnimation(5,'attack').frames[2]);this.slam(e.x,e.y,240,this.move?.damage??1);this.recover();}
    }else if(this.phase==='breath-windup'){
      this.breathPose(Math.min(2,Math.floor(this.age/360)));
      this.drawCone(false);
      if(this.age>=this.breathWindupMs){this.enter('breath');this.breathTick=DRAGON_BREATH.ignitionMs;this.breathPose(2);e.playMonsterVocal('growl');}
    }else if(this.phase==='breath'){
      this.drawCone(true);
      if(!this.breathSoundPlayed&&this.age>=DRAGON_BREATH.ignitionMs){
        this.breathSoundPlayed=true;
        this.scene.playDragonSound(e.instanceId,'breath',e.x,e.y,DRAGON_BREATH.burningMs+DRAGON_BREATH.fadeMs-DRAGON_BREATH.ignitionMs);
      }
      if(breathPresentation(this.age).damaging&&this.age>=this.breathTick){
        this.breathTick=this.age+350;
        // Match the marked triangle, including its far chord and rear edge.
        if(insideBreathCone(player.x-e.x,player.y-e.y,this.aim.x,this.aim.y,this.breathRange)&&this.scene.hasClearPath(e.x,e.y,player.x,player.y,e))
          this.scene.damagePlayer(Math.round(e.definition.damage*.38*(this.move?.damage??1)));
      }
      if(this.age>=DRAGON_BREATH.burningMs+DRAGON_BREATH.fadeMs)this.recover();
    }else if(this.phase==='flight'){
      const p=Math.min(1,this.age/3200),arc=Math.sin(p*Math.PI),angle=p*Math.PI*2;
      let x=Phaser.Math.Linear(this.flightStart.x,this.landingPoint.x,p)+Math.cos(angle)*arc*(this.tower?90:220);
      let y=Phaser.Math.Linear(this.flightStart.y,this.landingPoint.y,p)+Math.sin(angle)*arc*(this.tower?70:160);
      if(this.tower){
        const dx=x-this.home.x,dy=y-this.home.y;
        const scale=Math.min(1,(TOWER_ROUND_FLOOR.radius-300)/Math.max(1,Math.hypot(dx,dy)));
        // Ease inward during takeoff; never snap an edge-positioned dragon.
        const blend=smooth(p/.12);
        x=Phaser.Math.Linear(x,this.home.x+dx*scale,blend);
        y=Phaser.Math.Linear(y,this.home.y+dy*scale,blend);
      }
      body.reset(x,y);
      this.drawFlight(Math.min(1,p/.12)*60+arc*(this.tower?30:110));
      this.drawCircle(this.landingPoint.x,this.landingPoint.y,240,this.age/(3200+1100));
      if(p>=1){body.reset(this.landingPoint.x,this.landingPoint.y);this.enter('landing');this.drawCircle(e.x,e.y,240,3200/4300);}
    }else if(this.phase==='landing'){
      this.drawCircle(e.x,e.y,240,(3200+this.age)/(3200+1100));this.drawFlight(60*(1-Math.min(1,this.age/1100)));
      if(this.age>=1100){this.leaveAir();this.slam(e.x,e.y,240,this.move?.damage??1.25);this.recover();}
    }else if(this.phase==='recover'){
      this.groundAnimation('idle');if(this.age>=(this.move?.recovery??1100)){
        this.enter('rest');const enraged=e.hp/e.definition.hp<=(this.profile?.enrageAt??.5);
        this.nextAttack=this.clock+(this.profile?this.profile.cooldown*(enraged?(this.profile.enrageCooldownMultiplier??1):1):1500);
      }
    }
  }
  private recover(){this.enter('recover');}
  private breathPose(pose:number){
    this.enemy.useVisualTexture('enemy_dragon');
    this.enemy.anims.stop();this.enemy.anims.timeScale=1;
    this.enemy.setFrame(enemyAnimation(5,'attack').frames[pose]);
  }
  private lockBreathRange(){
    this.breathRange=DRAGON_BREATH.range;
    if(!this.tower)return;
    // Lock both the marked cone and its damage to the same arena-safe extent.
    // Only one bounded geometry check per windup, never a per-frame scan.
    const e=this.enemy,angle=this.aim.angle(),half=DRAGON_BREATH.halfAngle;
    for(let range=DRAGON_BREATH.range;range>=72;range-=18){
      const safe=[-half,0,half].every(offset=>{
        const distance=offset===0?range*Math.cos(half):range;
        const x=e.x+Math.cos(angle+offset)*distance,y=e.y+Math.sin(angle+offset)*distance;
        return Math.hypot(x-this.home.x,y-this.home.y)<=TOWER_ROUND_FLOOR.radius-25
          &&this.scene.hasClearPath(e.x,e.y,x,y,e);
      });
      if(safe){this.breathRange=range;return;}
    }
    this.breathRange=72;
  }
  private drawCircle(x:number,y:number,radius:number,progress:number){
    const fraction=Phaser.Math.Clamp(progress,0,1),pulse=fraction>.72?(1+Math.sin(this.age*.025))*.5:0;
    this.warningArt.setTexture(ATTACK_WARNING_TEXTURE,ATTACK_WARNING_FRAMES.circle.name).setOrigin(.5)
      .setPosition(x,y).setDisplaySize(radius*2,radius*2).setAlpha(.19+pulse*.06).setVisible(true)
      .setDepth(this.scene.playerRenderDepth(y)-2);
    this.warningFill.draw({kind:'circle',x,y,angle:0,radius},progress,this.scene.playerRenderDepth(y)-1,0xffa25c);
  }
  private drawCone(burning:boolean){
    const e=this.enemy,angle=this.aim.angle(),half=DRAGON_BREATH.halfAngle,r=this.breathRange;
    const pulse=!burning&&this.age>this.breathWindupMs*.72?(1+Math.sin(this.age*.025))*.5:0;
    const warningWidth=r*Math.cos(half),warningHeight=2*r*Math.sin(half);
    this.warningArt.setTexture(ATTACK_WARNING_TEXTURE,ATTACK_WARNING_FRAMES.cone.name).setOrigin(0,.5)
      .setPosition(e.x,e.y).setDisplaySize(warningWidth,warningHeight).setRotation(angle)
      .setAlpha(burning?.13:.2+pulse*.05).setVisible(true).setDepth(this.scene.playerRenderDepth(e.y)-2);
    if(burning)this.warningFill.clear();
    else this.warningFill.draw({kind:'cone',x:e.x,y:e.y,angle,radius:r,halfAngle:half,flatEnd:true},this.age/this.breathWindupMs,this.scene.playerRenderDepth(e.y)-1,0xffa25c);
    const pose=burning?2:Math.min(2,Math.floor(this.age/360));
    // Atlas density 2, registered source scale 1.3, actor scale includes boss size.
    const registered=(e.frame.customData as {mouth?:{x:number;y:number}}).mouth;
    const muzzle=registered?{
      x:e.x+(e.flipX?-1:1)*(registered.x-e.frame.cutWidth/4)*2*e.scaleX,
      y:e.y+(registered.y-e.originY*e.frame.cutHeight/2)*2*e.scaleY,
    }:dragonMouth(e.x,e.y,e.flipX,2*1.3*e.scaleX,pose);
    const reach=r*Math.cos(half),tip={x:e.x+this.aim.x*reach,y:e.y+this.aim.y*reach-35};
    const depth=this.scene.playerRenderDepth(e.y)+180,ignition=this.breathWindupMs-220;
    if(burning)this.fire.show(muzzle,tip,this.age,depth);
    else if(this.age>ignition)this.fire.show(muzzle,tip,this.age-ignition,depth,true);
    else this.fire.hide();
  }
  private slam(x:number,y:number,radius:number,multiplier:number){
    const player=this.scene.player;
    if(Math.hypot(player.x-x,player.y-y)<=radius&&this.scene.hasClearPath(x,y,player.x,player.y))
      this.scene.damagePlayer(Math.round(this.enemy.definition.damage*multiplier));
    this.scene.shakeCombatCamera(170,.003);this.scene.playAudio('sfx-heavy-slam',.45);
    this.effects.impact({id:'dragon-impact'},{kind:'circle',x,y,radius,angle:0});
  }
  private startFlight(){
    this.flightStart={x:this.enemy.x,y:this.enemy.y};
    this.lastFlightX=this.enemy.x;this.flight.setFlipX(this.enemy.flipX);
    let dx=this.scene.player.x-this.home.x,dy=this.scene.player.y-this.home.y;
    const radius=Math.hypot(dx/900,dy/700);if(radius>.7){dx*=.7/radius;dy*=.7/radius;}
    let proposed={x:this.home.x+dx,y:this.home.y+dy};
    if(this.tower)proposed=this.clampTowerPoint(this.scene.player.x,this.scene.player.y);
    this.landingPoint=this.scene.canEnemyOccupy(proposed.x,proposed.y,this.enemy)?proposed:{...this.home};
    this.enter('flight');this.enemy.setAlpha(1);
    this.scene.playDragonSound(this.enemy.instanceId,'flight',this.enemy.x,this.enemy.y,2400);
    (this.enemy.body as Phaser.Physics.Arcade.Body).checkCollision.none=true;
    this.flight.setVisible(true).play('dragon-fly');this.shadow.setVisible(true);
    this.drawFlight(0);
    this.scene.notify('Varkhul takes flight. Watch his landing circle!');
  }
  private drawFlight(height:number){
    const dx=this.enemy.x-this.lastFlightX;if(Math.abs(dx)>1)this.flight.setFlipX(dx<0);this.lastFlightX=this.enemy.x;
    const alpha=this.phase==='landing'?smooth((1100-this.age)/220):smooth(this.age/260);
    // Crossfade complete ground/flight poses rather than swapping them abruptly.
    this.enemy.setAlpha(1-alpha);
    this.flight.setPosition(this.enemy.x,this.enemy.y-height).setAlpha(alpha)
      .setDepth(this.scene.playerRenderDepth(this.enemy.y)+height+5);
    this.shadow.setPosition(this.enemy.x,this.enemy.y+2).setDepth(this.scene.playerRenderDepth(this.enemy.y)-1)
      .setScale(1+height/300,1-height/300).setAlpha(.4*alpha);
  }
  createRetreatVisual(){
    const e=this.enemy,visual=this.scene.add.sprite(e.x,e.y-40,'enemy_dragon_fly',0)
      .setOrigin(.5,actorArtLayout('enemy_dragon_fly').originY).setScale(this.flight.scaleX,this.flight.scaleY)
      .setDepth(e.y+600).setName('dragon-retreat').play('dragon-fly');
    const soundId=`${e.instanceId}:retreat`;
    this.scene.playDragonSound(soundId,'flight',e.x,e.y,2800);
    visual.once(Phaser.GameObjects.Events.DESTROY,()=>this.scene.stopDragonSound(soundId,'flight'));
    this.scene.tweens.add({targets:visual,x:e.x+1100,y:e.y-1300,alpha:0,duration:2800,ease:'Sine.easeIn',onComplete:()=>visual.destroy()});
  }
  interruptForStagger(duration:number){
    if(this.airborne)return;
    // Cancel ground windups and live breath together with their warnings,
    // fire sprites and looped sound. Flight/landing remain untargetable.
    this.enter('rest');this.nextAttack=Math.max(this.nextAttack,this.clock+duration+150);
    this.effects.clear();
  }
  destroy(){this.scene.stopDragonSound(this.enemy.instanceId);this.effects.destroy();this.warningArt.destroy();this.warningFill.destroy();this.fire.destroy();this.flight.destroy();this.shadow.destroy();}
}
