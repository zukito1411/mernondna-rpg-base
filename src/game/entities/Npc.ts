import Phaser from 'phaser';
import type { NpcDefinition, Vec2 } from '../types';
import { actorArtLayout, ART_BY_KEY, actorScaleForHeight } from '../../data/art';
import { directionFrame } from '../../data/animationPacks';
import { PLAYER_ACTOR_HEIGHT, npcApparentHeight } from '../../data/progression';
import { patrolDestination } from '../systems/npcPatrol';
import { seededRandom } from '../../utils/seededRandom';
import type { WorldScene } from '../scenes/WorldScene';

export class Npc extends Phaser.Physics.Arcade.Sprite {
  readonly definition: NpcDefinition;
  readonly nameLabel: Phaser.GameObjects.Text;
  readonly home: Vec2;
  private readonly titleLabel: Phaser.GameObjects.Text;
  private readonly labelY: number;
  private readonly rng: () => number;
  private target: Vec2 | null = null;
  private returningHome = false;
  private nextPatrolAt = 0;
  private facing = new Phaser.Math.Vector2(0, 1);

  constructor(scene: WorldScene, definition: NpcDefinition, x: number, y: number, home: Vec2) {
    const texture = definition.spriteTexture ?? 'npcs';
    const apparentHeight = npcApparentHeight(texture);
    super(scene, x, y, texture, definition.spriteFrame);
    this.definition = definition;
    this.home = { ...home };
    this.rng = seededRandom(`npc-patrol:${definition.id}`);
    this.nextPatrolAt = scene.time.now + 1200 + this.rng() * 1800;
    const layout = actorArtLayout(texture);
    this.labelY = -(apparentHeight + 12);
    scene.add.existing(this);
    this.setScale(actorScaleForHeight(texture, definition.spriteFrame, apparentHeight)).setOrigin(.5, layout.originY);
    scene.physics.add.existing(this);
    const scaleX = this.scaleX, scaleY = this.scaleY, density = ART_BY_KEY[texture].density;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const sheet = ART_BY_KEY[texture];
    body.setSize(18 / scaleX, 22 / scaleY)
      .setOffset(sheet.frameWidth * density / 2 - 9 / scaleX, density * (sheet.frameHeight - 22) - 2 / scaleY)
      .setCollideWorldBounds(true).setImmovable(true);
    body.pushable = false;
    this.setDepth(y);
    this.setInteractive({ useHandCursor: true });
    this.setName(definition.name);
    this.nameLabel = scene.add.text(x, y + this.labelY, definition.name, {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: '#f6edd7', stroke: '#17130e', strokeThickness: 3,
      backgroundColor: '#201c16bb', padding: { x: 4, y: 2 },
    }).setResolution(2).setOrigin(.5,1).setDepth(y + 80).setName(`npc-name:${definition.id}`);
    this.titleLabel = scene.add.text(x, y + this.labelY + 2, definition.title, {
      fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#d2c3a5', stroke: '#17130e', strokeThickness: 2,
    }).setResolution(2).setOrigin(.5,0).setDepth(y + 80).setName(`npc-title:${definition.id}`);
    this.once('destroy', () => { this.nameLabel.destroy(); this.titleLabel.destroy(); });
  }

  updatePatrol(time: number, _delta: number) {
    const scene = this.scene as WorldScene;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!this.target && time >= this.nextPatrolAt) {
      if (this.returningHome) {
        if (Phaser.Math.Distance.Between(this.x, this.y, this.home.x, this.home.y) <= 14) {
          this.returningHome = false;
          this.nextPatrolAt = time + 1400 + this.rng() * 2400;
        } else if (scene.canNpcVisit({ x: this.x, y: this.y }, this.home)) {
          this.target = this.home;
        } else {
          this.returningHome = false;
          this.nextPatrolAt = time + 1400;
        }
      } else {
        const destination = patrolDestination(this.home, { x: this.x, y: this.y }, 110, this.rng,
          (from, to) => scene.canNpcVisit(from, to));
        if (destination) this.target = destination;
        else this.nextPatrolAt = time + 1600;
      }
    }

    if (!this.target) {
      body.setVelocity(0, 0);
      this.playDirection(this.facing.x, this.facing.y, false);
      this.setDepth(this.y);
      return;
    }

    const dx = this.target.x - this.x, dy = this.target.y - this.y;
    if (Math.hypot(dx, dy) <= 10) {
      body.setVelocity(0, 0);
      this.target = null;
      if (!this.returningHome) this.returningHome = true;
      this.nextPatrolAt = time + 1000 + this.rng() * 1800;
      this.playDirection(this.facing.x, this.facing.y, false);
      return;
    }
    this.facing.set(dx, dy).normalize();
    body.setVelocity(this.facing.x * 34, this.facing.y * 34);
    this.playDirection(this.facing.x, this.facing.y, true);
    this.setDepth(this.y);
  }

  updatePresentation(playerX: number, playerY: number, questTarget: boolean, paused = false) {
    const distance = Phaser.Math.Distance.Between(playerX,playerY,this.x,this.y);
    const moving = (this.body as Phaser.Physics.Arcade.Body).velocity.lengthSq() > 4;
    if (distance > 1 && distance <= 72) {
      this.target = null;
      this.returningHome = true;
      this.nextPatrolAt = Math.max(this.nextPatrolAt, this.scene.time.now + 1500);
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.facing.set(playerX - this.x, playerY - this.y).normalize();
      this.playDirection(this.facing.x, this.facing.y, false);
    } else if (!moving && distance < 200) {
      this.facing.set(playerX - this.x, playerY - this.y).normalize();
      this.playDirection(this.facing.x, this.facing.y, false);
    }
    if (paused) this.anims.pause(); else if (this.anims.isPaused) this.anims.resume();
    this.nameLabel.setPosition(this.x, this.y + this.labelY).setDepth(this.y + 80).setColor(questTarget ? '#ffe193' : '#f6edd7');
    this.titleLabel.setPosition(this.x, this.y + this.labelY + 2).setDepth(this.y + 80)
      .setVisible(distance < 260);
  }

  private playDirection(x: number, y: number, walking: boolean) {
    const direction = Math.abs(x) > Math.abs(y) ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
    const animation = `${this.texture.key}-${direction}`;
    if (walking && this.scene.anims.exists(animation)) this.anims.play(animation, true);
    else {
      this.anims.stop();
      this.setFrame(directionFrame(x, y)).setFlipX(false);
    }
  }
}
