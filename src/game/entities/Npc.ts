import Phaser from 'phaser';
import type { NpcDefinition } from '../types';
import { artScale, actorArtLayout, ART_BY_KEY } from '../../data/art';
import { directionFrame } from '../../data/animationPacks';

export class Npc extends Phaser.Physics.Arcade.Sprite {
  readonly definition: NpcDefinition;
  readonly nameLabel: Phaser.GameObjects.Text;
  private readonly titleLabel: Phaser.GameObjects.Text;
  private readonly labelY: number;

  constructor(scene: Phaser.Scene, definition: NpcDefinition, x: number, y: number) {
    const texture = definition.spriteTexture ?? 'npcs';
    super(scene, x, y, texture, definition.spriteFrame);
    this.definition = definition;
    const layout = actorArtLayout(texture);
    this.labelY = layout.labelY;
    scene.add.existing(this);
    this.setScale(artScale(texture)).setOrigin(.5, layout.originY);
    scene.physics.add.existing(this, true);
    (this.body as Phaser.Physics.Arcade.StaticBody).setSize(18, 22)
      .setOffset(layout.bodyX, ART_BY_KEY[texture].frameHeight - 22);
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

  updatePresentation(playerX: number, playerY: number, questTarget: boolean) {
    const distance = Phaser.Math.Distance.Between(playerX,playerY,this.x,this.y);
    if (this.definition.spriteTexture && distance > 1 && distance < 200) {
      // Use directional standing poses; stationary NPCs must not walk in place.
      this.setFrame(directionFrame(playerX - this.x,playerY - this.y));
    }
    this.nameLabel.setPosition(this.x, this.y + this.labelY).setDepth(this.y + 80).setColor(questTarget ? '#ffe193' : '#f6edd7');
    this.titleLabel.setPosition(this.x, this.y + this.labelY + 2).setDepth(this.y + 80)
      .setVisible(distance < 260);
  }
}
