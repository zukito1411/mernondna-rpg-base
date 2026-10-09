import Phaser from 'phaser';
import type {Enemy} from '../entities/Enemy';
import type {WorldScene} from '../scenes/WorldScene';
import {DRAGON_LAIR,inDragonArena} from '../../data/dragonLair';
import {artScale,actorArtLayout} from '../../data/art';
import {enemyAppearanceMultiplier} from '../../data/enemies';
import {enemyAnimation,animationDuration} from '../../data/animationPacks';
import {DragonBreathEffect} from './DragonBreathEffect';
import {DRAGON_BREATH,breathPresentation,insideBreathCone,dragonMouth} from './dragonBreath';

type Phase='rest'|'stomp-windup'|'breath-windup'|'breath'|'flight'|'landing'|'recover';
/** Local, delta-driven boss phases. Pause/dialogue stops gameplay updates;
 * no delayed damaging callbacks survive an unload or a defeated encounter. */
export class DragonCombat {
  private phase:Phase='rest';private age=0;private clock=0;private nextAttack=2500;private sequence=0;
  private readonly aim=new Phaser.Math.Vector2(1,0);
  private readonly warning:Phaser.GameObjects.Graphics;
  private readonly fire:DragonBreathEffect;
  private readonly flight:Phaser.GameObjects.Sprite;
  private readonly shadow:Phaser.GameObjects.Ellipse;
  private breathTick=0;
  private hurtUntil=0;
  private flightStart={x:0,y:0};private landingPoint={...DRAGON_LAIR};
  private lastFlightX=0;
  constructor(private readonly enemy:Enemy,private readonly scene:WorldScene){
    this.warning=scene.add.graphics().setName('dragon-warning:'+enemy.instanceId);
    this.fire=new DragonBreathEffect(scene,enemy.instanceId);
    this.flight=scene.add.sprite(enemy.x,enemy.y,'enemy_dragon_fly',0)
      .setOrigin(.5,actorArtLayout('enemy_dragon_fly').originY)
      .setScale(artScale('enemy_dragon_fly')*enemyAppearanceMultiplier(enemy.definition))
      .setVisible(false).setName('dragon-flight:'+enemy.instanceId);
    this.shadow=scene.add.ellipse(enemy.x,enemy.y,180,70,0x100909,.4).setVisible(false).setName('dragon-flight-shadow');
  }
  get airborne(){return this.phase==='flight'||this.phase==='landing';}
  get visual(){return this.airborne?this.flight:this.enemy;}
  pause(paused:boolean){if(paused)this.flight.anims.pause();else this.flight.anims.resume();}
  private enter(phase:Phase){this.phase=phase;this.age=0;this.warning.clear();this.fire.hide();}
  private groundAnimation(state:'idle'|'walk'|'attack'){
    if(state!=='attack'&&this.clock<this.hurtUntil)return;
    if(state==='attack')this.enemy.play(enemyAnimation(this.enemy.definition.spriteFrame,state).key,true);
    else this.enemy.playLocomotion(state);
    this.enemy.anims.timeScale=1;
  }
  private leaveAir(){
    (this.enemy.body as Phaser.Physics.Arcade.Body).checkCollision.none=false;
    this.flight.setVisible(false);this.shadow.setVisible(false);this.enemy.setAlpha(1);
  }
  update(delta:number){
    const e=this.enemy,body=e.body as Phaser.Physics.Arcade.Body,player=this.scene.player;
    if(e.hp<=0){this.warning.clear();this.fire.hide();return;}
    const dt=Math.min(Math.max(0,delta),100);this.age+=dt;this.clock+=dt;
    const distance=Math.hypot(player.x-e.x,player.y-e.y);
    const engaged=inDragonArena(player.x,player.y,80)&&Math.hypot(player.x-DRAGON_LAIR.x,player.y-DRAGON_LAIR.y)<1100;
    if(!engaged&&this.phase!=='rest'){
      this.leaveAir();body.reset(DRAGON_LAIR.x,DRAGON_LAIR.y);this.enter('rest');this.nextAttack=this.clock+2500;
    }
    body.setVelocity(0,0);e.setDepth(e.y);
    this.warning.setDepth(e.y-2);
    if(this.phase==='rest'){
      const goal=engaged?{x:player.x,y:player.y}:{x:DRAGON_LAIR.x+Math.cos(this.clock*.00018)*150,y:DRAGON_LAIR.y+Math.sin(this.clock*.00018)*110};
      const dx=goal.x-e.x,dy=goal.y-e.y,length=Math.hypot(dx,dy);
      if(length>(engaged?170:35)){
        const vx=dx/length*e.definition.moveSpeed*(engaged?1:.45),vy=dy/length*e.definition.moveSpeed*(engaged?1:.45);
        const ahead={x:e.x+vx*.7,y:e.y+vy*.7};
        if(inDragonArena(ahead.x,ahead.y)&&this.scene.canEnemyOccupy(ahead.x,ahead.y)&&this.scene.hasClearPath(e.x,e.y,ahead.x,ahead.y)){
          body.setVelocity(vx,vy);e.setFlipX(dx<0);this.groundAnimation('walk');
        }else this.groundAnimation('idle');
      }else this.groundAnimation('idle');
      if(engaged&&distance<650&&this.clock>=this.nextAttack&&this.scene.hasClearPath(e.x,e.y,player.x,player.y)){
        body.setVelocity(0,0);this.aim.set(player.x-e.x,player.y-e.y).normalize();
        this.hurtUntil=0;
        if(this.aim.lengthSq()===0)this.aim.set(e.flipX?-1:1,0);
        e.setFlipX(this.aim.x<0);
        const choice=this.sequence++%4;
        if(choice===2)this.startFlight();
        else if(choice===0){this.enter('stomp-windup');e.anims.stop();e.setFrame(enemyAnimation(5,'attack').frames[1]);this.scene.notify('Varkhul raises his claws — leave the marked stomp circle!');}
        else {this.enter('breath-windup');e.anims.stop();this.breathPose(0);this.scene.notify('Varkhul draws breath — move out of the fire cone!');}
      }
    }else if(this.phase==='stomp-windup'){
      this.drawCircle(e.x,e.y,240,this.age/1000);
      if(this.age>=1000){e.setFrame(enemyAnimation(5,'attack').frames[2]);this.slam(e.x,e.y,240,1);this.recover();}
    }else if(this.phase==='breath-windup'){
      this.breathPose(Math.min(2,Math.floor(this.age/360)));
      this.drawCone(false);
      if(this.age>=DRAGON_BREATH.windupMs){this.enter('breath');this.breathTick=DRAGON_BREATH.ignitionMs;this.breathPose(2);}
    }else if(this.phase==='breath'){
      this.drawCone(true);
      if(breathPresentation(this.age).damaging&&this.age>=this.breathTick){
        this.breathTick=this.age+350;
        // Match the marked triangle, including its far chord and rear edge.
        if(insideBreathCone(player.x-e.x,player.y-e.y,this.aim.x,this.aim.y)&&this.scene.hasClearPath(e.x,e.y,player.x,player.y))
          this.scene.damagePlayer(Math.round(e.definition.damage*.38));
      }
      if(this.age>=DRAGON_BREATH.burningMs+DRAGON_BREATH.fadeMs)this.recover();
    }else if(this.phase==='flight'){
      const p=Math.min(1,this.age/3200),arc=Math.sin(p*Math.PI),angle=p*Math.PI*2;
      body.reset(Phaser.Math.Linear(this.flightStart.x,this.landingPoint.x,p)+Math.cos(angle)*arc*220,
        Phaser.Math.Linear(this.flightStart.y,this.landingPoint.y,p)+Math.sin(angle)*arc*160);
      this.drawFlight(Math.min(1,p/.12)*60+arc*110);
      if(p>=1){body.reset(this.landingPoint.x,this.landingPoint.y);this.enter('landing');}
    }else if(this.phase==='landing'){
      this.drawCircle(e.x,e.y,240,this.age/1100);this.drawFlight(60*(1-Math.min(1,this.age/1100)));
      if(this.age>=1100){this.leaveAir();this.slam(e.x,e.y,240,1.25);this.recover();}
    }else if(this.phase==='recover'){
      this.groundAnimation('idle');if(this.age>=1100){this.enter('rest');this.nextAttack=this.clock+1500;}
    }
  }
  private recover(){this.enter('recover');}
  private breathPose(pose:number){
    this.enemy.anims.stop();this.enemy.anims.timeScale=1;
    this.enemy.setFrame(enemyAnimation(5,'attack').frames[pose]);
  }
  private drawCircle(x:number,y:number,radius:number,progress:number){
    this.warning.clear().fillStyle(0xb8321e,.13).fillCircle(x,y,radius)
      .lineStyle(3,0xffb25b,.85).strokeCircle(x,y,radius)
      .lineStyle(2,0xff7243,.6).strokeCircle(x,y,radius*Math.min(1,progress));
  }
  private drawCone(burning:boolean){
    const e=this.enemy,angle=this.aim.angle(),half=DRAGON_BREATH.halfAngle,r=DRAGON_BREATH.range;
    const left={x:e.x+Math.cos(angle-half)*r,y:e.y+Math.sin(angle-half)*r};
    const right={x:e.x+Math.cos(angle+half)*r,y:e.y+Math.sin(angle+half)*r};
    this.warning.clear().fillStyle(0xd4551c,burning?.045:.12).fillTriangle(e.x,e.y,left.x,left.y,right.x,right.y)
      .lineStyle(2,0xffa052,burning?.25:.85).strokeTriangle(e.x,e.y,left.x,left.y,right.x,right.y);
    const pose=burning?2:Math.min(2,Math.floor(this.age/360));
    // Atlas density 2, registered source scale 1.3, actor scale includes boss size.
    const muzzle=dragonMouth(e.x,e.y,e.flipX,2*1.3*e.scaleX,pose);
    const reach=r*Math.cos(half),tip={x:e.x+this.aim.x*reach,y:e.y+this.aim.y*reach-35};
    if(burning)this.fire.show(muzzle,tip,this.age,e.y+180);
    else if(this.age>780)this.fire.show(muzzle,tip,this.age-780,e.y+180,true);
    else this.fire.hide();
  }
  private slam(x:number,y:number,radius:number,multiplier:number){
    const player=this.scene.player;
    if(Math.hypot(player.x-x,player.y-y)<=radius&&this.scene.hasClearPath(x,y,player.x,player.y))
      this.scene.damagePlayer(Math.round(this.enemy.definition.damage*multiplier));
    this.scene.cameras.main.shake(170,.003);this.scene.playAudio('sfx-heavy-slam',.45);
    const ring=this.scene.add.circle(x,y,30).setStrokeStyle(5,0xffae65,.8).setDepth(y+1);
    this.scene.tweens.add({targets:ring,radius,duration:450,alpha:0,onComplete:()=>ring.destroy()});
  }
  private startFlight(){
    this.flightStart={x:this.enemy.x,y:this.enemy.y};
    this.lastFlightX=this.enemy.x;this.flight.setFlipX(this.enemy.flipX);
    let dx=this.scene.player.x-DRAGON_LAIR.x,dy=this.scene.player.y-DRAGON_LAIR.y;
    const radius=Math.hypot(dx/900,dy/700);if(radius>.7){dx*=.7/radius;dy*=.7/radius;}
    const proposed={x:DRAGON_LAIR.x+dx,y:DRAGON_LAIR.y+dy};
    this.landingPoint=this.scene.canEnemyOccupy(proposed.x,proposed.y)?proposed:{...DRAGON_LAIR};
    this.enter('flight');this.enemy.setAlpha(0);
    (this.enemy.body as Phaser.Physics.Arcade.Body).checkCollision.none=true;
    this.flight.setVisible(true).play('dragon-fly');this.shadow.setVisible(true);
    this.drawFlight(0);
    this.scene.notify('Varkhul takes flight. Watch his landing circle!');
  }
  private drawFlight(height:number){
    const dx=this.enemy.x-this.lastFlightX;if(Math.abs(dx)>1)this.flight.setFlipX(dx<0);this.lastFlightX=this.enemy.x;
    this.flight.setPosition(this.enemy.x,this.enemy.y-height).setDepth(this.enemy.y+height+300);
    this.shadow.setPosition(this.enemy.x,this.enemy.y+2).setDepth(this.enemy.y-1).setScale(1+height/300,1-height/300);
  }
  createRetreatVisual(){
    const e=this.enemy,visual=this.scene.add.sprite(e.x,e.y-40,'enemy_dragon_fly',0)
      .setOrigin(.5,actorArtLayout('enemy_dragon_fly').originY).setScale(this.flight.scaleX,this.flight.scaleY)
      .setDepth(e.y+600).setName('dragon-retreat').play('dragon-fly');
    this.scene.tweens.add({targets:visual,x:e.x+1100,y:e.y-1300,alpha:0,duration:2800,ease:'Sine.easeIn',onComplete:()=>visual.destroy()});
  }
  reactToHit(){
    if(this.phase!=='rest'&&this.phase!=='recover')return;
    const animation=enemyAnimation(5,'hurt');
    this.hurtUntil=this.clock+animationDuration(animation);this.enemy.play(animation.key);this.enemy.anims.timeScale=1;
  }
  destroy(){this.warning.destroy();this.fire.destroy();this.flight.destroy();this.shadow.destroy();}
}
