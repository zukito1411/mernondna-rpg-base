import Phaser from 'phaser';
import { CHUNK_SIZE } from '../../data/world';
import { artScale } from '../../data/art';
import { WORLD_CONTENT } from '../../data/content';
import { WorldGenerator } from './WorldGenerator';
import { chunkNeighborhood } from './chunkNeighborhood';
import { TerrainBaker } from './TerrainBaker';
import { planWildernessTrees,planWildernessDetails } from './sceneryPlan';
import {spriteBounds} from '../../data/settlementGeometry';
import type {TreeSwaySystem} from './TreeSwaySystem';
import type {DayNightSystem} from './DayNightSystem';
import {planLandmarkScenery} from './LandmarkScenery';
import type {WorldSpriteSystem} from './WorldSpriteSystem';
import {StaticBoundsIndex} from './StaticBoundsIndex';

interface ChunkRuntime {
  image: Phaser.GameObjects.Image;
  textureKey: string;
  shared?:boolean;
  scenery: Array<Phaser.GameObjects.Image|Phaser.GameObjects.Sprite>;
}
const authoredReservations=new StaticBoundsIndex(WORLD_CONTENT.map(d=>({definition:d,
  bounds:{left:d.world.x,right:d.world.x,top:d.world.y,bottom:d.world.y}})),CHUNK_SIZE);

export class ChunkManager {
  private readonly scene: Phaser.Scene;
  private readonly world: WorldGenerator;
  private readonly active = new Map<string, ChunkRuntime>();
  private lastCenter = '';
  private readonly baker: TerrainBaker;
  // LEIGHNERON_STAGGER_CHUNKS_V1: don't bake three huge neighbor chunks in one frame.
  private readonly pendingChunks = new Map<string,{x:number;y:number}>();
  private lastChunkBakedAt=-Infinity;

  constructor(scene: Phaser.Scene, world: WorldGenerator,
    private readonly treeSway:TreeSwaySystem,private readonly lighting:DayNightSystem,private readonly ground:WorldSpriteSystem) {
    this.scene = scene;
    this.world = world;
    this.baker = new TerrainBaker(scene);
  }

  update(worldX: number, worldY: number,viewportOnly=false) {
    const centerX = Math.floor(worldX / CHUNK_SIZE);
    const centerY = Math.floor(worldY / CHUNK_SIZE);
    const camera=this.scene.cameras.main,halfW=camera.width/camera.zoom/2+128,halfH=camera.height/camera.zoom/2+128;
    const bounds={left:Math.floor((worldX-halfW)/CHUNK_SIZE),right:Math.floor((worldX+halfW)/CHUNK_SIZE),top:Math.floor((worldY-halfH)/CHUNK_SIZE),bottom:Math.floor((worldY+halfH)/CHUNK_SIZE)};
    const centerKey = viewportOnly?`view:${bounds.left}:${bounds.right}:${bounds.top}:${bounds.bottom}`:`${centerX}:${centerY}`;
    if (centerKey === this.lastCenter) { this.loadPendingChunk(); return; }
    this.lastCenter = centerKey;

    const wanted = chunkNeighborhood(worldX, worldY);
    if(viewportOnly)for(const key of wanted){const [x,y]=key.split(':').map(Number);if(x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom)wanted.delete(key);}
    for (const [key, chunk] of this.active) {
      if (wanted.has(key)) continue;
      chunk.image.destroy();
      for (const image of chunk.scenery) image.destroy();
      if(!chunk.shared)this.scene.textures.remove(chunk.textureKey);
      this.active.delete(key);
    }
    for (const key of [...this.pendingChunks.keys()]) if(!wanted.has(key))this.pendingChunks.delete(key);
    // On initial entry and cinematic cuts, the complete visible area is needed
    // immediately. Normal movement only queues new, offscreen neighbor chunks.
    if(viewportOnly||this.active.size===0){
      this.pendingChunks.clear();
      for (const key of wanted) {
        if (!this.active.has(key)) {const [x,y]=key.split(':').map(Number);this.load(x,y);}
      }
    }else{
      // The player's current chunk is safety-critical. Never leave its props
      // pending behind offscreen bakes after a teleport or a fast boundary step.
      const currentKey=centerX+':'+centerY;
      if(wanted.has(currentKey)&&!this.active.has(currentKey)){
        this.pendingChunks.delete(currentKey);this.load(centerX,centerY);this.lastChunkBakedAt=this.scene.time.now;
      }
      for(const key of wanted)if(!this.active.has(key)&&!this.pendingChunks.has(key)){
        const [x,y]=key.split(':').map(Number);this.pendingChunks.set(key,{x,y});
      }
      this.loadPendingChunk();
    }
    this.updateOpenSeaStatus();
  }

  /** Each expensive canvas bake stays on the main thread, but never multiple
   * fresh 1536px terrain textures in a single frame during normal travel. */
  private loadPendingChunk(){
    if(!this.pendingChunks.size)return;
    const now=this.scene.time.now;
    if(now-this.lastChunkBakedAt<95)return;
    const next=this.pendingChunks.entries().next().value as [string,{x:number;y:number}]|undefined;
    if(!next)return;
    const [key,point]=next;
    this.pendingChunks.delete(key);
    if(!this.active.has(key))this.load(point.x,point.y);
    this.lastChunkBakedAt=now;
    this.updateOpenSeaStatus();
  }

  private updateOpenSeaStatus(){
    this.scene.registry.set('openSeaView',this.pendingChunks.size===0&&
      [...this.active.values()].every(chunk=>chunk.shared));
  }

  destroy() {
    for (const chunk of this.active.values()) {
      chunk.image.destroy();
      for (const image of chunk.scenery) image.destroy();
      if(!chunk.shared)this.scene.textures.remove(chunk.textureKey);
    }
    this.active.clear();
    this.pendingChunks.clear();
    this.lastCenter = '';
    this.baker.destroy();
    this.scene.textures.remove('shared-ocean-chunk');
  }

  getActiveKeys() { return [...this.active.keys()]; }

  private load(chunkX: number, chunkY: number) {
    // Fully open sea shares a single texture. Voyages no longer allocate and
    // repaint nine identical 1536-square ocean canvases at every chunk change.
    const ocean=Array.from({length:25},(_,i)=>({x:(chunkX+i%5/4)*CHUNK_SIZE,y:(chunkY+Math.floor(i/5)/4)*CHUNK_SIZE}))
      .every(p=>this.world.getRegionAt(p.x,p.y)==='dead-sea');
    if(ocean){
      const key='shared-ocean-chunk';if(!this.scene.textures.exists(key)){const texture=this.scene.textures.createCanvas(key,CHUNK_SIZE,CHUNK_SIZE)!;this.baker.drawOcean(texture.getContext());texture.refresh();}
      const image=this.scene.add.image(chunkX*CHUNK_SIZE,chunkY*CHUNK_SIZE,key).setOrigin(0).setDepth(-1000);
      this.active.set(chunkX+':'+chunkY,{image,textureKey:key,shared:true,scenery:[]});return;
    }
    const textureKey = `chunk:${chunkX}:${chunkY}`;
    const canvasTexture = this.scene.textures.createCanvas(textureKey, CHUNK_SIZE, CHUNK_SIZE);
    if (!canvasTexture) return;

    const ctx = canvasTexture.getContext();
    this.baker.draw(ctx, this.world, chunkX, chunkY);
    const scenery: Array<Phaser.GameObjects.Image|Phaser.GameObjects.Sprite> = [];
    const cx=(chunkX+.5)*CHUNK_SIZE,cy=(chunkY+.5)*CHUNK_SIZE;
    const sites=authoredReservations.query({left:cx-CHUNK_SIZE,right:cx+CHUNK_SIZE,top:cy-CHUNK_SIZE,bottom:cy+CHUNK_SIZE})
      .map(item=>item.definition).filter(d=>Math.abs(d.world.x-cx)<CHUNK_SIZE&&Math.abs(d.world.y-cy)<CHUNK_SIZE);
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
      const image=this.scene.add.image(wx,wy,texture,frame).setOrigin(.5,1)
        .setScale(artScale(texture)*scale).setDepth(wy).setName(tree.id);
      scenery.push(image);this.ground.register(image,texture,frame,scale,true);
      this.treeSway.register(image,texture,frame);
    }
    const treeReservations=trees.map(t=>({...t,bounds:spriteBounds(t.texture,t.frame,t.scale,t.x,t.y)}));
    for(const detail of [...landmarkDetails,...planWildernessDetails(chunkX,chunkY,this.world,[...reservations,...landmarks,...treeReservations])]){
      const sprite=this.scene.add.sprite(detail.x,detail.y,detail.texture,detail.frame).setOrigin(.5,1)
        .setScale(artScale(detail.texture)*detail.scale).setDepth(detail.y).setName(detail.id);
      scenery.push(sprite);
      this.ground.register(sprite,detail.texture,detail.frame,detail.scale,detail.solid,detail.footprint);
      this.lighting.register(sprite,detail.texture,detail.frame,detail.scale);
    }
    canvasTexture.refresh();
    canvasTexture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    const image = this.scene.add.image(chunkX * CHUNK_SIZE, chunkY * CHUNK_SIZE, textureKey).setOrigin(0, 0).setDepth(-1000);
    this.active.set(`${chunkX}:${chunkY}`, { image, textureKey, scenery });
  }
}
