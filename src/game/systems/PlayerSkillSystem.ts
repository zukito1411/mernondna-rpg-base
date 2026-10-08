import Phaser from 'phaser';
import { ACTIVE_SKILLS, ACTIVE_SKILL_BY_ID, initialActiveSkillStatus, type ActiveSkillDefinition, type ActiveSkillId, type ActiveSkillStatus } from '../../data/activeSkills';
import { artScale } from '../../data/art';
import { useGameStore } from '../../store/gameStore';
import type { Player } from '../entities/Player';
import type { WorldScene } from '../scenes/WorldScene';

interface Cast {
  skill:ActiveSkillDefinition; elapsed:number; nextHit:number;
  direction:Phaser.Math.Vector2; visual:Phaser.GameObjects.Sprite;
}

export class PlayerSkillSystem {
  private readonly cooldowns = initialActiveSkillStatus().cooldowns;
  private cast:Cast | null = null;
  private rallyRemaining = 0;

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
    const direction = this.player.lastDirection.clone().normalize();
    const visual = this.scene.add.sprite(this.player.x,this.player.y,skill.texture,0)
      .setOrigin(.5).setScale(artScale(skill.texture)).setFlipX(direction.x < 0)
      .setDepth(this.player.y + 2).setName(`player-skill:${id}`);
    visual.play(`player-skill:${id}`);
    this.cast = { skill,elapsed:0,nextHit:0,direction,visual };
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
    const cast = this.cast;
    if (!cast) return;
    cast.elapsed += deltaMs;
    cast.visual.setPosition(this.player.x,this.player.y).setDepth(this.player.y + 2);
    while (cast.nextHit < cast.skill.hitTimes.length && cast.elapsed >= cast.skill.hitTimes[cast.nextHit]) {
      if (cast.skill.kind === 'rally') {
        this.player.hp = Math.min(this.player.maxHp,this.player.hp + Math.round(this.player.maxHp * .2));
        this.rallyRemaining = 5000;
        useGameStore.getState().setVitals(this.player.hp,this.player.stamina);
      } else {
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
    if (cast.elapsed >= cast.skill.durationMs) this.cancelCast();
  }

  snapshot():ActiveSkillStatus {
    return { cooldowns:{ ...this.cooldowns },casting:this.cast?.skill.id ?? null,rallyRemaining:this.rallyRemaining };
  }
  cancelCast() {
    this.cast?.visual.destroy();
    this.cast = null;
    if (this.player.active) this.player.setAlpha(1);
  }
  clearRally() { this.rallyRemaining = 0; }
  destroy() { this.cancelCast(); this.clearRally(); }
}
