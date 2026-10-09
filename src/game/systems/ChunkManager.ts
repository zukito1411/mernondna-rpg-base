import Phaser from 'phaser';
import { CHUNK_SIZE } from '../../data/world';
import { artScale } from '../../data/art';
import { WORLD_CONTENT } from '../../data/content';
import { WorldGenerator } from './WorldGenerator';
import { chunkNeighborhood } from './chunkNeighborhood';
import { TerrainBaker } from './TerrainBaker';
import { planWildernessTrees,planWildernessDetails } from './sceneryPlan';
import {spriteBounds,propFoundation} from '../../data/settlementGeometry';
import {treeFootprint,isTreeArt} from '../../data/treeArt';
import type {TreeSwaySystem} from './TreeSwaySystem';
import type {DayNightSystem} from './DayNightSystem';
import {planLandmarkScenery} from './LandmarkScenery';

interface ChunkRuntime {
  image: Phaser.GameObjects.Image;
  textureKey: string;
  scenery: Array<Phaser.GameObjects.Image|Phaser.GameObjects.Sprite>;
  treeBodies: Phaser.GameObjects.Rectangle[];
}

export class ChunkManager {
  private readonly scene: Phaser.Scene;
  private readonly world: WorldGenerator;
  private readonly active = new Map<string, ChunkRuntime>();
  private lastCenter = '';
  private readonly baker: TerrainBaker;

  constructor(scene: Phaser.Scene, world: WorldGenerator, private readonly treeBodyGroup: Phaser.Physics.Arcade.StaticGroup,
    private readonly treeSway:TreeSwaySystem,private readonly lighting:DayNightSystem) {
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
    const scenery: Array<Phaser.GameObjects.Image|Phaser.GameObjects.Sprite> = [];
    const treeBodies: Phaser.GameObjects.Rectangle[] = [];
    const sites = WORLD_CONTENT.filter(d => Math.abs(d.world.x - (chunkX + .5) * CHUNK_SIZE) < CHUNK_SIZE
      && Math.abs(d.world.y - (chunkY + .5) * CHUNK_SIZE) < CHUNK_SIZE);
    // Up to 36 mature trees, 40 habitat pieces and nearby bounded landmark
    // groups, all released with the chunk (including their leaf/light layers).
    // Authored/interactive settlement trees keep the persistent content ledger.
    const reservations=sites.map(d=>({...d.world,...('frame' in d?{bounds:spriteBounds(d.texture??'world_objects',d.frame,d.scale??1,d.world.x,d.world.y)}:{})}));
    const nearbyLandmarks=planLandmarkScenery(chunkX,chunkY,this.world,true);
    const landmarkDetails=nearbyLandmarks.filter(d=>Math.floor(d.x/CHUNK_SIZE)===chunkX&&Math.floor(d.y/CHUNK_SIZE)===chunkY);
    const landmarks=nearbyLandmarks.map(d=>({...d,bounds:spriteBounds(d.texture,d.frame,d.scale,d.x,d.y)}));
    const trees=planWildernessTrees(chunkX,chunkY,this.world,[...reservations,...landmarks]);
    for (const tree of trees) {
      const { x:wx,y:wy,texture,frame,scale } = tree;
      ctx.fillStyle = 'rgba(20,30,15,.18)'; ctx.beginPath();
      ctx.ellipse(wx - chunkX * CHUNK_SIZE, wy - chunkY * CHUNK_SIZE - 6, 34 * scale, 10 * scale, 0, 0, Math.PI * 2); ctx.fill();
      const image=this.scene.add.image(wx,wy,texture,frame).setOrigin(.5,1)
        .setScale(artScale(texture)*scale).setDepth(wy).setName(tree.id);
      scenery.push(image);this.treeSway.register(image,texture,frame);
      const footprint=treeFootprint(texture,frame,scale);
      const trunk = this.scene.add.rectangle(wx,wy-footprint.height/2-2*scale,footprint.width,footprint.height,0xffffff,0)
        .setVisible(false).setName(`trunk:${tree.id}`);
      this.scene.physics.add.existing(trunk, true);
      this.treeBodyGroup.add(trunk);
      treeBodies.push(trunk);
    }
    const treeReservations=trees.map(t=>({...t,bounds:spriteBounds(t.texture,t.frame,t.scale,t.x,t.y)}));
    for(const detail of [...landmarkDetails,...planWildernessDetails(chunkX,chunkY,this.world,[...reservations,...landmarks,...treeReservations])]){
      const sprite=this.scene.add.sprite(detail.x,detail.y,detail.texture,detail.frame).setOrigin(.5,1)
        .setScale(artScale(detail.texture)*detail.scale).setDepth(detail.y).setName(detail.id);
      scenery.push(sprite);
      this.lighting.register(sprite,detail.texture,detail.frame,detail.scale);
      if(detail.solid){const {width,height}=isTreeArt(detail.texture,detail.frame)?treeFootprint(detail.texture,detail.frame,detail.scale):
        detail.texture==='woodland_props'&&detail.frame===5?propFoundation(detail.texture,detail.frame,detail.scale):detail.footprint;
        const rock=this.scene.add.rectangle(detail.x,detail.y-height/2-2*detail.scale,width,height,0xffffff,0).setVisible(false).setName('rock:'+detail.id);
        this.scene.physics.add.existing(rock,true);this.treeBodyGroup.add(rock);treeBodies.push(rock);}
    }
    canvasTexture.refresh();
    canvasTexture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    const image = this.scene.add.image(chunkX * CHUNK_SIZE, chunkY * CHUNK_SIZE, textureKey).setOrigin(0, 0).setDepth(-1000);
    this.active.set(`${chunkX}:${chunkY}`, { image, textureKey, scenery, treeBodies });
  }
}
