import Phaser from 'phaser';
import { CHUNK_SIZE } from '../../data/world';
import { artScale } from '../../data/art';
import { WORLD_CONTENT } from '../../data/content';
import { WorldGenerator } from './WorldGenerator';
import { chunkNeighborhood } from './chunkNeighborhood';
import { TerrainBaker } from './TerrainBaker';
import { planWildernessTrees,planWildernessDetails } from './sceneryPlan';

interface ChunkRuntime {
  image: Phaser.GameObjects.Image;
  textureKey: string;
  scenery: Phaser.GameObjects.Image[];
  treeBodies: Phaser.GameObjects.Rectangle[];
}

export class ChunkManager {
  private readonly scene: Phaser.Scene;
  private readonly world: WorldGenerator;
  private readonly active = new Map<string, ChunkRuntime>();
  private lastCenter = '';
  private readonly baker: TerrainBaker;

  constructor(scene: Phaser.Scene, world: WorldGenerator, private readonly treeBodyGroup: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene;
    this.world = world;
    this.baker = new TerrainBaker(scene);
  }

  update(worldX: number, worldY: number) {
    const centerX = Math.floor(worldX / CHUNK_SIZE);
    const centerY = Math.floor(worldY / CHUNK_SIZE);
    const centerKey = `${centerX}:${centerY}`;
    if (centerKey === this.lastCenter) return;
    this.lastCenter = centerKey;

    const wanted = chunkNeighborhood(worldX, worldY);
    for (const [key, chunk] of this.active) {
      if (wanted.has(key)) continue;
      chunk.image.destroy();
      for (const image of chunk.scenery) image.destroy();
      for (const body of chunk.treeBodies) this.treeBodyGroup.remove(body, true, true);
      this.scene.textures.remove(chunk.textureKey);
      this.active.delete(key);
    }
    // Release distant GPU/canvas allocations before baking replacements.
    for (const key of wanted) {
      if (!this.active.has(key)) { const [x, y] = key.split(':').map(Number); this.load(x, y); }
    }
  }

  destroy() {
    for (const chunk of this.active.values()) {
      chunk.image.destroy();
      for (const image of chunk.scenery) image.destroy();
      for (const body of chunk.treeBodies) this.treeBodyGroup.remove(body, true, true);
      this.scene.textures.remove(chunk.textureKey);
    }
    this.active.clear();
    this.lastCenter = '';
    this.baker.destroy();
  }

  getActiveKeys() { return [...this.active.keys()]; }

  private load(chunkX: number, chunkY: number) {
    const textureKey = `chunk:${chunkX}:${chunkY}`;
    const canvasTexture = this.scene.textures.createCanvas(textureKey, CHUNK_SIZE, CHUNK_SIZE);
    if (!canvasTexture) return;

    const ctx = canvasTexture.getContext();
    this.baker.draw(ctx, this.world, chunkX, chunkY);
    const scenery: Phaser.GameObjects.Image[] = [];
    const treeBodies: Phaser.GameObjects.Rectangle[] = [];
    const sites = WORLD_CONTENT.filter(d => Math.abs(d.world.x - (chunkX + .5) * CHUNK_SIZE) < CHUNK_SIZE
      && Math.abs(d.world.y - (chunkY + .5) * CHUNK_SIZE) < CHUNK_SIZE);
    // At most 36 non-interactive scenery sprites per chunk, owned and released
    // with it. Authored/interactive trees still use the persistent content ledger.
    const trees=planWildernessTrees(chunkX,chunkY,this.world,sites.map(d=>d.world));
    for (const tree of trees) {
      const { x:wx,y:wy,frame,scale } = tree;
      ctx.fillStyle = 'rgba(20,30,15,.18)'; ctx.beginPath();
      ctx.ellipse(wx - chunkX * CHUNK_SIZE, wy - chunkY * CHUNK_SIZE - 6, 34 * scale, 10 * scale, 0, 0, Math.PI * 2); ctx.fill();
      scenery.push(this.scene.add.image(wx, wy, 'world_assets', frame).setOrigin(.5, 1)
        .setScale(artScale('world_assets') * scale).setDepth(wy).setName(tree.id));
      const trunk = this.scene.add.rectangle(wx, wy - 15 * scale, 24 * scale, 26 * scale, 0xffffff, 0)
        .setVisible(false).setName(`trunk:${tree.id}`);
      this.scene.physics.add.existing(trunk, true);
      this.treeBodyGroup.add(trunk);
      treeBodies.push(trunk);
    }
    for(const detail of planWildernessDetails(chunkX,chunkY,this.world,[...sites.map(d=>d.world),...trees])){
      const sprite=this.scene.add.image(detail.x,detail.y,detail.texture,detail.frame).setOrigin(.5,1)
        .setScale(artScale(detail.texture)*detail.scale).setDepth(detail.y).setName(detail.id);
      if(detail.tint!==undefined)sprite.setTint(detail.tint);scenery.push(sprite);
      if(detail.solid){const rock=this.scene.add.rectangle(detail.x,detail.y-12,38,24,0xffffff,0).setVisible(false).setName('rock:'+detail.id);
        this.scene.physics.add.existing(rock,true);this.treeBodyGroup.add(rock);treeBodies.push(rock);}
    }
    canvasTexture.refresh();
    canvasTexture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    const image = this.scene.add.image(chunkX * CHUNK_SIZE, chunkY * CHUNK_SIZE, textureKey).setOrigin(0, 0).setDepth(-1000);
    this.active.set(`${chunkX}:${chunkY}`, { image, textureKey, scenery, treeBodies });
  }
}
