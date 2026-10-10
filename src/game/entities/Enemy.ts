import Phaser from 'phaser';
import type { BossDefinition, EnemyDefinition } from '../types';
import { BOSS_BY_ID, enemyAppearanceMultiplier } from '../../data/enemies';
import type { WorldScene } from '../scenes/WorldScene';
import { seededRandom } from '../../utils/seededRandom';
import { artScale, ART_BY_KEY, actorArtLayout, artFrameSize,type ArtTextureKey } from '../../data/art';
import { enemyAnimation, animationDuration, type EnemyAnimationState } from '../../data/animationPacks';
import { useGameStore } from '../../store/gameStore';
import { approachVelocity, strideRate } from '../systems/locomotion';
import {groundMarkerPosition} from '../systems/groundMarkers';
import {DragonCombat} from '../systems/DragonCombat';
import {actorTravelDirection,enemyLocomotionKey,type ActorDirection} from '../../data/directionalEnemyArt';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly definition: EnemyDefinition;
  hp: number;
  readonly eventSpawn: boolean;
  readonly instanceId: string;
  private nextAttackAt = 0;
  private lockedUntil = 0;
  private nextSpecialAt = 0;
  private nextWanderAt = 0;
  private wander = new Phaser.Math.Vector2();
  private readonly facing = new Phaser.Math.Vector2(0, 1);
  private readonly rng: () => number;
  private lastSafe: { x: number; y: number };
  private readonly healthBar: Phaser.GameObjects.Graphics;
  private readonly nameLabel: Phaser.GameObjects.Text;
  private visualUntil = 0;
  private nextGrowlAt=0;
  private leapVisual: Phaser.GameObjects.Sprite | null = null;
  private leapShadow: Phaser.GameObjects.Ellipse | null = null;
  private leapTween: Phaser.Tweens.Tween | null = null;
  private attackTelegraph: Phaser.GameObjects.Graphics | null = null;
  private readonly boss: BossDefinition | undefined;
  private attackEpoch=0;
  private hitStunUntil=0;
  private readonly targetIndicator:Phaser.GameObjects.Graphics;
  private readonly dragonCombat:DragonCombat|undefined;
  private visualDirection:ActorDirection='right';
  get canBeTargeted(){return !this.dragonCombat?.airborne;}
  get facingLeft(){return this.visualDirection==='left';}
  playMonsterVocal(cue:'attack'|'growl'|'hurt'|'death'){
    (this.scene as WorldScene).playEnemyVocal(this.definition,this.instanceId,cue,this.x,this.y);
  }
  playMonsterAttackFoley(phase:'windup'|'impact'){
    (this.scene as WorldScene).playEnemyAttackFoley(this.definition,this.x,this.y,phase);
  }

  constructor(scene: WorldScene, definition: EnemyDefinition, x: number, y: number, instanceId: string, eventSpawn = false) {
    const idle=scene.anims.get(enemyLocomotionKey(definition.spriteFrame,'idle','right'));
    const initial=idle.frames[0];
    super(scene, x, y, initial.textureKey, initial.textureFrame);
    this.definition = definition;
    this.boss = instanceId.startsWith('boss:') ? BOSS_BY_ID[instanceId.slice(5)] : undefined;
    this.hp = definition.hp;
    this.eventSpawn = eventSpawn;
    this.instanceId = instanceId;
    this.rng = seededRandom(instanceId);
    this.lastSafe = { x, y };
    scene.add.existing(this);
    const texture=initial.textureKey as ArtTextureKey,sheet=ART_BY_KEY[texture];
    this.setScale(artScale(texture) * enemyAppearanceMultiplier(definition)).setOrigin(.5, actorArtLayout(texture).originY);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const radius = definition.bodyRadius??(definition.boss ? 24 : 11);
    const density = sheet.density;
    body.setCircle(radius / this.scaleX, sheet.frameWidth * density / 2 - radius / this.scaleX,
      this.originY * sheet.frameHeight * density - 2 * radius / this.scaleY);
    body.updateFromGameObject();
    body.setCollideWorldBounds(true);
    this.setDepth(y);
    this.anims.play(idle.key);
    this.healthBar = scene.add.graphics().setName(`enemy-health:${instanceId}`);
    this.nameLabel = scene.add.text(x, y - 40, this.boss?.name ?? definition.name, {
      fontFamily: 'Georgia, serif', fontSize: definition.boss ? '12px' : '9px',
      color: definition.boss ? '#f3c69c' : '#edddcb', stroke: '#17120e', strokeThickness: 3,
    }).setResolution(2).setOrigin(.5,1).setName(`enemy-name:${instanceId}`);
    this.targetIndicator=scene.add.graphics().setName('enemy-target:'+instanceId);
    if(definition.combatStyle==='dragon')this.dragonCombat=new DragonCombat(this,scene);
    this.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
      const state=useGameStore.getState();if(!state.panel&&!state.dialogue&&!state.cinematic)scene.targeting.select(this);
    });
    this.once('destroy', () => {
      this.targetIndicator.destroy();this.healthBar.destroy(); this.nameLabel.destroy(); this.clearWolfLeap(); this.attackTelegraph?.destroy();
      (this.scene as WorldScene).forgetEnemySound(this.instanceId);
      this.dragonCombat?.destroy();
    });
  }

  updateEnemy(time: number,delta=16) {
    const scene = this.scene as WorldScene;
    const player = scene.player;
    if (!player?.active) return;
    if(this.dragonCombat){this.dragonCombat.update(delta);return;}

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.hp <= 0) {
      body.setVelocity(0, 0);
      this.updateVisual(time);
      return;
    }

    if (!scene.canEnemyOccupy(this.x,this.y)) {
      body.reset(this.lastSafe.x,this.lastSafe.y);
      body.setVelocity(0,0); this.nextWanderAt = 0;
      this.updateVisual(time);
      return;
    }

    if (time < this.lockedUntil) {
      body.setVelocity(0, 0);
      this.setDepth(this.y);
      this.updateVisual(time);
      return;
    }
    if(time<this.hitStunUntil){body.velocity.scale(.85);this.updateVisual(time);return;}

    if (distance <= this.definition.aggroRange && scene.isEnemyTerritory(player.x,player.y)) {
      if(time>=this.nextGrowlAt&&distance>Math.max(100,this.definition.attackRange)){
        scene.playEnemyVocal(this.definition,this.instanceId,'growl',this.x,this.y);
        this.nextGrowlAt=time+3600+this.rng()*2800;
      }
      const approachRange = Math.max(30, this.definition.attackRange - 16);
      this.facing.set(player.x - this.x, player.y - this.y).normalize();
      if (distance > approachRange) {
        const ahead={x:this.x+this.facing.x*24,y:this.y+this.facing.y*24};
        if(scene.canEnemyOccupy(ahead.x,ahead.y)&&scene.hasClearPath(this.x,this.y,ahead.x,ahead.y))
          body.setVelocity(approachVelocity(body.velocity.x,this.facing.x*this.definition.moveSpeed,delta,90),approachVelocity(body.velocity.y,this.facing.y*this.definition.moveSpeed,delta,90));
        else {body.setVelocity(0,0);this.nextWanderAt=0;}
      }
      else body.setVelocity(0, 0);
      if(Math.abs(this.facing.x)>.2)this.setFlipX(this.facing.x<0);
      this.updateBossSkill(scene, time);
      if (distance <= Math.max(this.definition.attackRange, this.definition.attackRadius ?? 0) && time >= this.nextAttackAt
        && scene.hasClearPath(this.x, this.y, player.x, player.y)) {
        this.beginAttack(scene, player, time);
      }
    } else {
      if (time >= this.nextWanderAt) {
        this.nextWanderAt = time + 1600 + this.rng() * 2400;
        const angle = this.rng() * Math.PI * 2;
        // Rest between some roaming legs so idle art is an actual behavior,
        // not a walk cycle played while the creature stands still.
        const speed = this.rng() < .25 ? 0 : this.definition.moveSpeed * (0.25 + this.rng() * 0.3);
        this.wander.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
      const speed=this.wander.length(),ahead={x:this.x+this.wander.x/Math.max(1,speed)*24,y:this.y+this.wander.y/Math.max(1,speed)*24};
      if(scene.canEnemyOccupy(ahead.x,ahead.y)&&scene.hasClearPath(this.x,this.y,ahead.x,ahead.y))
        body.setVelocity(approachVelocity(body.velocity.x,this.wander.x,delta,120),approachVelocity(body.velocity.y,this.wander.y,delta,120));
      else {body.setVelocity(0,0);this.nextWanderAt=time+1000;this.wander.set(0,0);}
    }
    if (Math.abs(body.velocity.x)>Math.max(2,Math.abs(body.velocity.y)*.3)) this.setFlipX(body.velocity.x<0);
    this.setDepth(this.y);
    this.lastSafe = { x:this.x,y:this.y };
    this.updateVisual(time);
  }

  private beginAttack(scene: WorldScene, player: WorldScene['player'], time: number) {
    const windup = this.definition.attackWindupMs ?? 220;
    const recovery = this.definition.attackRecoveryMs ?? 320;
    const radius = this.definition.attackRadius ?? this.definition.attackRange;
    const attackStyle = this.definition.combatStyle==='troll'?'slam':this.boss?.attackStyle ?? (this.definition.id === 'gray-wolf' ? 'pounce' : 'melee');
    this.lockedUntil = time + windup + recovery;
    this.nextAttackAt = this.lockedUntil + this.definition.attackCooldownMs;
    this.attackTelegraph?.destroy();
    this.attackTelegraph = scene.add.graphics().setDepth(player.y - 2)
      .setName(`attack-telegraph:${this.instanceId}`);
    const center=attackStyle==='slam'?this:player;
    this.attackTelegraph.fillStyle(0x9c271d, .22).fillEllipse(center.x, center.y + 2, radius * 2, radius * 2);
    this.attackTelegraph.lineStyle(this.definition.boss ? 3 : 2, 0xf06c4c, .9)
      .strokeEllipse(center.x, center.y + 2, radius * 2, radius * 2);
    const attackAnimation = enemyAnimation(this.definition.spriteFrame, 'attack');
    const epoch=++this.attackEpoch;
    this.playMonsterVocal('attack');
    this.playMonsterAttackFoley('windup');
    this.nextGrowlAt=time+2800;
    this.playAction('attack');
    this.anims.timeScale=animationDuration(attackAnimation)/(windup+recovery);
    if(this.definition.combatStyle==='troll')this.anims.timeScale=(attackAnimation.frames.length-1)*1000/(attackAnimation.frameRate*windup);
    this.visualUntil=time+windup+recovery;
    if (attackStyle === 'pounce' && this.definition.spriteFrame === 0) this.playWolfLeap(attackAnimation);
    scene.time.delayedCall(windup, () => {
      if(epoch!==this.attackEpoch)return;
      this.attackTelegraph?.destroy();
      this.attackTelegraph = null;
      if (epoch!==this.attackEpoch || !this.active || !player.active || useGameStore.getState().panel || useGameStore.getState().dialogue || useGameStore.getState().cinematic) return;
      if(this.definition.combatStyle==='troll'){
        const impact=scene.add.sprite(this.x,this.y,'effect_troll_impact',0).setOrigin(.5,actorArtLayout('effect_troll_impact').originY)
          .setScale(artScale('effect_troll_impact')*radius/40).setDepth(this.y+1).play('effect-troll-impact');
        impact.once(Phaser.Animations.Events.ANIMATION_COMPLETE,()=>impact.destroy());scene.playAudio('sfx-heavy-slam',.3);
      }
      const strikeDistance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
      const facingThreshold = attackStyle === 'slam' ? -1 : attackStyle === 'pounce' ? .35 : .6;
      if (strikeDistance > radius || this.facing.dot(toPlayer) < facingThreshold
        || !scene.hasClearPath(this.x, this.y, player.x, player.y)) return;
      this.playMonsterAttackFoley('impact');
      scene.playEffect('hit', player.x, player.y, toPlayer);
      scene.damagePlayer(this.definition.damage);
    });
  }

  private updateBossSkill(scene: WorldScene, time: number) {
    const summon = this.definition.summonEnemyId;
    if (!summon) return;
    if (this.nextSpecialAt === 0) {
      this.nextSpecialAt = time + 3500;
      return;
    }
    if (time < this.nextSpecialAt) return;
    this.nextSpecialAt = time + (this.definition.summonCooldownMs ?? 20000);
    let spawned = 0;
    for (let i = 0; i < (this.definition.summonCount ?? 1); i++) {
      const angle = Math.PI * 2 * i / (this.definition.summonCount ?? 1) + this.rng() * .3;
      if (scene.spawnEnemy(summon, this.x + Math.cos(angle) * 110, this.y + Math.sin(angle) * 110, true)) {
        spawned++;
        scene.playEffect('teleport', this.x + Math.cos(angle) * 110, this.y + Math.sin(angle) * 110);
      }
    }
    if (spawned) scene.notify(`${this.boss?.name ?? this.definition.name} calls reinforcements!`);
  }

  private updateVisual(time:number) {
    if (time < this.visualUntil) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.playLocomotion(body.velocity.lengthSq()>9?'walk':'idle');
    this.anims.timeScale=body.velocity.lengthSq()>9?strideRate(body.velocity.length(),this.definition.moveSpeed):1;
  }

  playLocomotion(state:'idle'|'walk'){
    const body=this.body as Phaser.Physics.Arcade.Body;
    if(state==='walk')this.visualDirection=actorTravelDirection(body.velocity.x,body.velocity.y,this.visualDirection);
    const key=enemyLocomotionKey(this.definition.spriteFrame,state,this.visualDirection);
    const progress=this.anims.currentAnim?.key.includes(':walk:')?this.anims.getProgress():0;
    const changed=this.anims.currentAnim?.key!==key;
    this.useVisualTexture(this.scene.anims.get(key).frames[0].textureKey as ArtTextureKey);
    this.setFlipX(this.texture.key===(this.definition.spriteTexture??'enemies')&&this.visualDirection==='left').anims.play(key,true);
    if(changed&&state==='walk'&&progress>0)this.anims.setProgress(progress);
  }

  /** Different canvas padding must not move the collision feet or hit circle. */
  useVisualTexture(texture:ArtTextureKey){
    if(this.texture.key===texture)return;
    this.anims.stop();const sheet=ART_BY_KEY[texture];
    this.setTexture(texture,0).setOrigin(.5,actorArtLayout(texture).originY);
    const body=this.body as Phaser.Physics.Arcade.Body;
    const radius=this.definition.bodyRadius??(this.definition.boss?24:11);
    body.setCircle(radius/this.scaleX,sheet.frameWidth*sheet.density/2-radius/this.scaleX,
      this.originY*sheet.frameHeight*sheet.density-2*radius/this.scaleY);
    body.updateFromGameObject();
  }

  private playAction(state:EnemyAnimationState) {
    const animation = enemyAnimation(this.definition.spriteFrame,state);
    this.useVisualTexture(animation.texture as ArtTextureKey);
    this.setFlipX(state==='attack'?this.facing.x<0:this.facingLeft);
    this.visualUntil = this.scene.time.now + animationDuration(animation);
    this.anims.play(animation.key);
    this.anims.timeScale=1;
  }

  private playWolfLeap(animation: ReturnType<typeof enemyAnimation>) {
    this.clearWolfLeap();
    const scene = this.scene;
    const arc = { height: 0 };
    this.leapShadow = scene.add.ellipse(this.x, this.y - 3, 34, 13, 0x090b0b, 0.34)
      .setDepth(this.y - 1).setName(`wolf-leap-shadow:${this.instanceId}`);
    this.leapVisual = scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name)
      .setOrigin(this.originX, this.originY).setScale(this.scaleX, this.scaleY)
      .setFlipX(this.flipX).setDepth(this.y + 1).setName(`wolf-leap:${this.instanceId}`);
    this.setAlpha(0);
    this.leapVisual.play(animation.key);
    this.leapVisual.anims.timeScale=this.anims.timeScale;
    this.leapTween = scene.tweens.add({
      targets: arc, height: 26, duration: 190, ease: 'Sine.easeOut', yoyo: true,
      onUpdate: () => {
        if (!this.leapVisual?.active) return;
        this.leapVisual.setPosition(this.x, this.y - arc.height).setDepth(this.y + arc.height);
        this.leapShadow?.setPosition(this.x, this.y - 3).setScale(1 + arc.height / 50, 1 - arc.height / 70);
      },
      onComplete: () => this.clearWolfLeap(),
    });
  }

  private clearWolfLeap() {
    this.leapTween?.stop();
    this.leapTween = null;
    this.leapVisual?.destroy();
    this.leapVisual = null;
    this.leapShadow?.destroy();
    this.leapShadow = null;
    if (this.active) this.setAlpha(1);
  }

  createDeathVisual() {
    const animation = enemyAnimation(this.definition.spriteFrame,'death');
    const effect = this.scene.add.sprite(this.x,this.y,animation.texture,animation.frames[0]).setScale(this.scaleX,this.scaleY)
      .setOrigin(.5,actorArtLayout(animation.texture as ArtTextureKey).originY).setFlipX(this.visualDirection==='left'||this.flipX).setDepth(this.depth).setName(`enemy-death:${this.instanceId}`);
    effect.play(animation.key);
    effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE,() => effect.destroy());
    this.scene.time.delayedCall(animationDuration(animation) + 200,() => { if (effect.active) effect.destroy(); });
  }

  takeDamage(amount: number, knockback: Phaser.Math.Vector2) {
    if (!this.active || this.hp <= 0 || !this.canBeTargeted) return;
    this.hp -= amount;
    const scene=this.scene as WorldScene;
    scene.playEnemyVocal(this.definition,this.instanceId,this.hp<=0?'death':'hurt',this.x,this.y);
    this.attackEpoch++;this.attackTelegraph?.destroy();this.attackTelegraph=null;this.clearWolfLeap();
    this.hitStunUntil=this.scene.time.now+120;
    scene.playEffect('hit', this.x, this.y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.dragonCombat?0:knockback.x * 150,this.dragonCombat?0:knockback.y * 150);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) (this.scene as WorldScene).handleEnemyDefeated(this);
    else if(this.dragonCombat)this.dragonCombat.reactToHit();else this.playAction('hurt');
  }
  createRetreatVisual(){this.dragonCombat?.createRetreatVisual();}

  updatePresentation(playerX: number, playerY: number, paused = false) {
    if(!this.active)return;
    this.dragonCombat?.pause(paused);
    if(paused)this.leapTween?.pause();else if(this.leapTween?.isPaused())this.leapTween.resume();
    if (paused) this.anims.pause(); else if (this.anims.isPaused) this.anims.resume();
    const distance = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const visible = this.hp > 0 && distance < 700 && (Boolean(this.definition.boss) || this.hp < this.definition.hp || distance < this.definition.aggroRange);
    const width = this.definition.boss ? 48 : this.definition.id === 'road-bandit' ? 35 : 30;
    const scene=this.scene as WorldScene;
    const eligible=!paused&&scene.targeting.eligible(this)&&scene.cameras.main.worldView.contains(this.x,this.y);
    const selected=eligible&&scene.targeting.selected===this;
    const model=this.dragonCombat?.visual??(this.leapVisual?.active?this.leapVisual:this);
    const bounds=(model.frame.customData as {visibleBounds?:{top:number;height:number}}).visibleBounds;
    const texture=this.texture.key as ArtTextureKey,sheet=ART_BY_KEY[texture];
    const visualHeight=artFrameSize(texture,Number(this.frame.name)).height*this.scaleY*sheet.density;
    const modelSheet=ART_BY_KEY[model.texture.key as keyof typeof ART_BY_KEY];
    const top=bounds?model.y+(bounds.top-model.originY*modelSheet.frameHeight)*model.scaleY*modelSheet.density-16
      :this.y-visualHeight-16;
    this.targetIndicator.clear().setDepth(this.y+90).setVisible(eligible);
    if(eligible){const size=selected?7:this.definition.boss?5:3,color=selected?0xffdf75:0xc18770;
      this.targetIndicator.lineStyle(selected?2:1,0x26180e,.9).fillStyle(color,selected?1:.7);
      this.targetIndicator.fillTriangle(this.x-size,top-36,this.x+size,top-36,this.x,top-26);
      if(selected){const ground=groundMarkerPosition(this);
        this.targetIndicator.lineStyle(2,color,.9).strokeEllipse(ground.x,ground.y,
          Math.max(this.definition.boss?56:34,(this.definition.bodyRadius??0)*2.2),Math.max(10,(this.definition.bodyRadius??0)*.45));}
    }
    this.healthBar.clear().setDepth(this.y + 85).setVisible(visible&&eligible);
    this.nameLabel.setPosition(this.x, top - 4).setDepth(this.y + 85).setVisible(visible&&eligible);
    if (visible&&eligible) {
      this.healthBar.fillStyle(0x16110c,.85).fillRoundedRect(this.x - width / 2 - 2, top - 1, width + 4, 6, 2);
      this.healthBar.fillStyle(this.definition.boss ? 0xd89557 : 0xbb6550,1)
        .fillRect(this.x - width / 2, top + 1, width * Math.max(0,this.hp / this.definition.hp), 3);
    }
  }
}
