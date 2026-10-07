import Phaser from 'phaser';
import type { EnemyDefinition } from '../types';
import { enemyAppearanceMultiplier } from '../../data/enemies';
import type { WorldScene } from '../scenes/WorldScene';
import { seededRandom } from '../../utils/seededRandom';
import { artScale, ART_BY_KEY, actorArtLayout } from '../../data/art';
import { enemyAnimation, animationDuration, type EnemyAnimationState } from '../../data/animationPacks';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly definition: EnemyDefinition;
  hp: number;
  readonly eventSpawn: boolean;
  readonly instanceId: string;
  private nextAttackAt = 0;
  private nextWanderAt = 0;
  private wander = new Phaser.Math.Vector2();
  private readonly facing = new Phaser.Math.Vector2(0, 1);
  private readonly rng: () => number;
  private lastSafe: { x: number; y: number };
  private readonly healthBar: Phaser.GameObjects.Graphics;
  private readonly nameLabel: Phaser.GameObjects.Text;
  private visualUntil = 0;
  private leapVisual: Phaser.GameObjects.Sprite | null = null;
  private leapShadow: Phaser.GameObjects.Ellipse | null = null;
  private leapTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: WorldScene, definition: EnemyDefinition, x: number, y: number, instanceId: string, eventSpawn = false) {
    super(scene, x, y, 'enemies', definition.spriteFrame);
    this.definition = definition;
    this.hp = definition.hp;
    this.eventSpawn = eventSpawn;
    this.instanceId = instanceId;
    this.rng = seededRandom(instanceId);
    this.lastSafe = { x, y };
    scene.add.existing(this);
    this.setScale(artScale('enemies') * enemyAppearanceMultiplier(definition)).setOrigin(.5, actorArtLayout('enemies').originY);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const radius = definition.boss ? 14 : 11;
    const density = ART_BY_KEY.enemies.density;
    body.setCircle(radius * density, (ART_BY_KEY.enemies.frameWidth / 2 - radius) * density,
      (ART_BY_KEY.enemies.frameHeight - 21 - radius) * density);
    body.setCollideWorldBounds(true);
    this.setDepth(y);
    this.anims.play(enemyAnimation(definition.spriteFrame,'idle').key);
    this.healthBar = scene.add.graphics().setName(`enemy-health:${instanceId}`);
    this.nameLabel = scene.add.text(x, y - 40, definition.name, {
      fontFamily: 'Georgia, serif', fontSize: definition.boss ? '12px' : '9px',
      color: definition.boss ? '#f3c69c' : '#edddcb', stroke: '#17120e', strokeThickness: 3,
    }).setResolution(2).setOrigin(.5,1).setName(`enemy-name:${instanceId}`);
    this.once('destroy', () => {
      this.healthBar.destroy(); this.nameLabel.destroy(); this.clearWolfLeap();
    });
  }

  updateEnemy(time: number) {
    const scene = this.scene as WorldScene;
    const player = scene.player;
    if (!player?.active) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!scene.canEnemyOccupy(this.x,this.y)) {
      body.reset(this.lastSafe.x,this.lastSafe.y);
      body.setVelocity(0,0); this.nextWanderAt = 0;
      this.updateVisual(time);
      return;
    }

    if (distance <= this.definition.aggroRange && scene.isEnemyTerritory(player.x,player.y)) {
      const approachRange = Math.max(24, this.definition.attackRange - 12);
      this.facing.set(player.x - this.x, player.y - this.y).normalize();
      if (distance > approachRange) scene.physics.moveToObject(this, player, this.definition.moveSpeed);
      else if (distance < approachRange - 4) {
        body.setVelocity(-this.facing.x * this.definition.moveSpeed * 0.65,
          -this.facing.y * this.definition.moveSpeed * 0.65);
      } else body.setVelocity(0, 0);
      this.setFlipX(player.x < this.x);
      if (distance <= this.definition.attackRange && time >= this.nextAttackAt && scene.hasClearPath(this.x, this.y, player.x, player.y)) {
        this.nextAttackAt = time + this.definition.attackCooldownMs;
        const animation = enemyAnimation(this.definition.spriteFrame, 'attack');
        this.playAction('attack');
        if (this.definition.id === 'gray-wolf') this.playWolfLeap(animation);
        scene.time.delayedCall(180, () => {
          if (!this.active || !player.active) return;
          const strikeDistance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
          const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
          if (strikeDistance > this.definition.attackRange || this.facing.dot(toPlayer) < 0.6
            || !scene.hasClearPath(this.x, this.y, player.x, player.y)) return;
          scene.playEffect('hit', player.x, player.y);
          scene.damagePlayer(this.definition.damage);
        });
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
      body.setVelocity(this.wander.x, this.wander.y);
    }
    this.setFlipX(body.velocity.x < -2);
    this.setDepth(this.y);
    this.lastSafe = { x:this.x,y:this.y };
    this.updateVisual(time);
  }

  private updateVisual(time:number) {
    if (time < this.visualUntil) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.anims.play(enemyAnimation(this.definition.spriteFrame,body.velocity.lengthSq() > 4 ? 'walk' : 'idle').key,true);
  }

  private playAction(state:EnemyAnimationState) {
    const animation = enemyAnimation(this.definition.spriteFrame,state);
    this.visualUntil = this.scene.time.now + animationDuration(animation);
    this.anims.play(animation.key);
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
    const effect = this.scene.add.sprite(this.x,this.y,'enemies',animation.frames[0]).setScale(this.scaleX,this.scaleY)
      .setOrigin(this.originX,this.originY).setFlipX(this.flipX).setDepth(this.depth).setName(`enemy-death:${this.instanceId}`);
    effect.play(animation.key);
    effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE,() => effect.destroy());
    this.scene.time.delayedCall(animationDuration(animation) + 200,() => { if (effect.active) effect.destroy(); });
  }

  takeDamage(amount: number, knockback: Phaser.Math.Vector2) {
    if (!this.active || this.hp <= 0) return;
    this.hp -= amount;
    (this.scene as WorldScene).playEffect('hit', this.x, this.y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(knockback.x * 150, knockback.y * 150);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) (this.scene as WorldScene).handleEnemyDefeated(this);
    else this.playAction('hurt');
  }

  updatePresentation(playerX: number, playerY: number, paused = false) {
    if (paused) this.anims.pause(); else if (this.anims.isPaused) this.anims.resume();
    const distance = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const visible = distance < 700 && (Boolean(this.definition.boss) || this.hp < this.definition.hp || distance < this.definition.aggroRange);
    const width = this.definition.boss ? 48 : this.definition.id === 'road-bandit' ? 35 : 30;
    const top = this.y + actorArtLayout('enemies').labelY * (this.definition.boss ? 1.45 : 1);
    this.healthBar.clear().setDepth(this.y + 85).setVisible(visible);
    this.nameLabel.setPosition(this.x, top - 4).setDepth(this.y + 85).setVisible(visible);
    if (visible) {
      this.healthBar.fillStyle(0x16110c,.85).fillRoundedRect(this.x - width / 2 - 2, top - 1, width + 4, 6, 2);
      this.healthBar.fillStyle(this.definition.boss ? 0xd89557 : 0xbb6550,1)
        .fillRect(this.x - width / 2, top + 1, width * Math.max(0,this.hp / this.definition.hp), 3);
    }
  }
}
