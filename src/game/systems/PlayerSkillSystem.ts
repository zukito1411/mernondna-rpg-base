import Phaser from 'phaser';
import { ACTIVE_SKILLS, ACTIVE_SKILL_BY_ID, initialActiveSkillStatus, type ActiveSkillDefinition, type ActiveSkillId, type ActiveSkillStatus } from '../../data/activeSkills';
import { artScale } from '../../data/art';
import { useGameStore } from '../../store/gameStore';
import type { Player } from '../entities/Player';
import type { WorldScene } from '../scenes/WorldScene';
import type {Vec2} from '../types';

interface Cast {
  skill:ActiveSkillDefinition; elapsed:number; nextHit:number;
  direction:Phaser.Math.Vector2; visual:Phaser.GameObjects.Sprite;
  start:Vec2; landing?:Vec2; shadow?:Phaser.GameObjects.Ellipse;
}
interface SlashWave {sprite:Phaser.GameObjects.Sprite;direction:Phaser.Math.Vector2;remaining:number;skill:ActiveSkillDefinition;multiplier:number}

export class PlayerSkillSystem {
  private readonly cooldowns = initialActiveSkillStatus().cooldowns;
  private cast:Cast | null = null;
  private rallyRemaining = 0;
  private readonly waves=new Set<SlashWave>();

  constructor(private readonly scene:WorldScene,private readonly player:Player) {
    useGameStore.getState().setActiveSkillStatus(this.snapshot());
  }
  get isCasting() { return this.cast !== null; }
  get incomingDamageMultiplier() { return this.rallyRemaining > 0 ? .5 : 1; }

  tryCast(id:ActiveSkillId):boolean {
    const skill = ACTIVE_SKILL_BY_ID[id];
    if (this.cast) return false;
    if (this.cooldowns[id] > 0) {
      this.scene.notify(`${skill.name} is recovering (${Math.ceil(this.cooldowns[id] / 1000)}s).`);
      return false;
    }
    if (this.player.stamina < skill.staminaCost) {
      this.scene.notify(`${skill.name} needs ${skill.staminaCost} stamina.`);
      return false;
    }
    this.player.stamina -= skill.staminaCost;
    this.cooldowns[id] = skill.cooldownMs;
    const target=skill.targetingRange?this.scene.targeting.nearest(skill.targetingRange):null;
    const direction = target?new Phaser.Math.Vector2(target.x-this.player.x,target.y-this.player.y).normalize():this.player.lastDirection.clone().normalize();
    if(target){this.scene.targeting.selected=target;this.player.lastDirection.copy(direction);}
    const visual = this.scene.add.sprite(this.player.x,this.player.y,skill.texture,0)
      .setOrigin(.5).setScale(artScale(skill.texture)).setFlipX(direction.x < 0)
      .setDepth(this.player.y + 2).setName(`player-skill:${id}`);
    visual.play(`player-skill:${id}`);
    const start={x:this.player.x,y:this.player.y};
    const landing=id==='skyfall-slam'?this.scene.skillLanding(target??{x:start.x+direction.x*90,y:start.y+direction.y*90},skill.targetingRange??90):undefined;
    const shadow=id==='skyfall-slam'?this.scene.add.ellipse(start.x,start.y+12,34,12,0x101512,.3).setDepth(start.y-1).setName('player-slam-shadow'):undefined;
    this.cast = { skill,elapsed:0,nextHit:0,direction,visual,start,landing,shadow };
    this.player.setAlpha(0);
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);
    useGameStore.getState().setVitals(this.player.hp,this.player.stamina);
    useGameStore.getState().setActiveSkillStatus(this.snapshot());
    return true;
  }

  // Tick only during active play. Paused menus cannot advance cooldowns,
  // buffs or delayed damage, and cancelled casts have no pending callbacks.
  update(deltaMs:number) {
    for (const skill of ACTIVE_SKILLS) this.cooldowns[skill.id] = Math.max(0,this.cooldowns[skill.id] - deltaMs);
    this.rallyRemaining = Math.max(0,this.rallyRemaining - deltaMs);
    this.updateWaves(Math.min(deltaMs,80));
    const cast = this.cast;
    if (!cast) return;
    cast.elapsed += deltaMs;
    let height=0;
    if(cast.landing) {
      const fraction=Phaser.Math.Clamp((cast.elapsed-140)/430,0,1),eased=Phaser.Math.Easing.Sine.InOut(fraction);
      const point={x:Phaser.Math.Linear(cast.start.x,cast.landing.x,eased),y:Phaser.Math.Linear(cast.start.y,cast.landing.y,eased)};
      if(this.scene.safeSkillPosition(point)&&this.scene.hasClearPath(this.player.x,this.player.y,point.x,point.y))
        (this.player.body as Phaser.Physics.Arcade.Body).reset(point.x,point.y);
      else {cast.start={x:this.player.x,y:this.player.y};cast.landing={...cast.start};}
      height=Math.sin(fraction*Math.PI)*64;
      cast.shadow?.setPosition(this.player.x,this.player.y+12).setScale(1-height/140).setAlpha(.3-height/400);
    }
    cast.visual.setPosition(this.player.x,this.player.y-height).setDepth(this.player.y+2);
    while (cast.nextHit < cast.skill.hitTimes.length && cast.elapsed >= cast.skill.hitTimes[cast.nextHit]) {
      if (cast.skill.kind === 'rally') {
        this.player.hp = Math.min(this.player.maxHp,this.player.hp + Math.round(this.player.maxHp * .2));
        this.rallyRemaining = 5000;
        useGameStore.getState().setVitals(this.player.hp,this.player.stamina);
      } else if(cast.skill.id==='azure-cleave') {
        // Reacquire at release, then freeze flight direction: never home or
        // apply melee damage before the traveling wave actually connects.
        const target=this.scene.targeting.nearest(cast.skill.targetingRange??620);
        if(target){cast.direction.set(target.x-this.player.x,target.y-this.player.y).normalize();this.scene.targeting.selected=target;}
        this.player.lastDirection.copy(cast.direction);cast.visual.setFlipX(cast.direction.x<0);
        const sprite=this.scene.add.sprite(this.player.x+cast.direction.x*16,this.player.y+cast.direction.y*16,'effect_slash',0)
          .setScale(artScale('effect_slash')*1.15).setTint(0x81dcff).setBlendMode(Phaser.BlendModes.ADD)
          .setRotation(Math.atan2(cast.direction.y,cast.direction.x)-Math.PI/4).setDepth(this.player.y+4).setName('azure-cleave-wave');
        sprite.play({key:'effect-slash',repeat:-1});
        this.waves.add({sprite,direction:cast.direction.clone(),remaining:cast.skill.targetingRange??620,skill:cast.skill,multiplier:cast.skill.damageMultipliers[cast.nextHit]});
        this.scene.recordTraining(cast.skill.id);
      } else {
        if(cast.skill.id==='skyfall-slam') {
          this.scene.playEffect('fortification',this.player.x,this.player.y);
          for(let side=0;side<4;side++){const angle=side*Math.PI/2,ray=new Phaser.Math.Vector2(Math.cos(angle),Math.sin(angle));this.scene.playEffect('slash',this.player.x+ray.x*30,this.player.y+ray.y*30,ray);}
          this.scene.cameras.main.shake(140,.003);
        }
        if (cast.skill.id === 'crescent-flurry') {
          // Surround the standing skill sprite with arcs; only the effects
          // rotate, never Leigneron's model. Each damage pulse hits all sides.
          for (let side = 0; side < 4; side++) {
            const angle = cast.nextHit * Math.PI / 4 + side * Math.PI / 2;
            const sweep = new Phaser.Math.Vector2(Math.cos(angle),Math.sin(angle));
            this.scene.playEffect('slash',this.player.x + sweep.x * 26,this.player.y + sweep.y * 26,sweep);
          }
        }
        this.scene.performSkillHit(this.player,cast.direction,cast.skill,cast.skill.damageMultipliers[cast.nextHit]);
      }
      cast.nextHit++;
    }
    if (cast.elapsed >= cast.skill.durationMs) this.finishCast();
  }

  private updateWaves(delta:number) {
    for(const wave of this.waves) {
      let travel=Math.min(wave.remaining,620*delta/1000),terminated=false;
      while(travel>0&&!terminated){const step=Math.min(12,travel),from={x:wave.sprite.x,y:wave.sprite.y},to={x:from.x+wave.direction.x*step,y:from.y+wave.direction.y*step};
        if(!this.scene.hasClearPath(from.x,from.y,to.x,to.y)){terminated=true;break;}
        const hits=this.scene.getCombatEnemies().filter(e=>e.active&&e.visible&&e.hp>0&&this.scene.hasClearPath(from.x,from.y,e.x,e.y)).map(enemy=>{
          const dx=to.x-from.x,dy=to.y-from.y,len=dx*dx+dy*dy,t=len?Phaser.Math.Clamp(((enemy.x-from.x)*dx+(enemy.y-from.y)*dy)/len,0,1):0;
          return {enemy,t,distance:Math.hypot(enemy.x-from.x-t*dx,enemy.y-from.y-t*dy)};
        }).filter(hit=>hit.distance<=(hit.enemy.definition.boss?24:11)+14).sort((a,b)=>a.t-b.t);
        if(hits.length){const hit=hits[0];this.scene.applySkillDamage(hit.enemy,wave.skill,wave.multiplier,wave.direction);this.scene.playEffect('slash',hit.enemy.x,hit.enemy.y,wave.direction);terminated=true;break;}
        wave.sprite.setPosition(to.x,to.y).setDepth(to.y+4);wave.remaining-=step;travel-=step;
      }
      if(terminated||wave.remaining<=0){wave.sprite.destroy();this.waves.delete(wave);}
    }
  }

  snapshot():ActiveSkillStatus {
    return { cooldowns:{ ...this.cooldowns },casting:this.cast?.skill.id ?? null,rallyRemaining:this.rallyRemaining };
  }
  private finishCast() {
    this.cast?.visual.destroy();
    this.cast?.shadow?.destroy();
    this.cast = null;
    if (this.player.active) this.player.setAlpha(1);
  }
  cancelCast() {this.finishCast();for(const wave of this.waves)wave.sprite.destroy();this.waves.clear();}
  clearRally() { this.rallyRemaining = 0; }
  destroy() { this.cancelCast(); this.clearRally(); }
}
