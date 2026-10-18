import Phaser from 'phaser';
import { CHUNK_SIZE } from '../../data/world';
import { artScale } from '../../data/art';
import { WORLD_CONTENT } from '../../data/content';
import { WorldGenerator } from './WorldGenerator';
import { chunkNeighborhood,viewportChunks,streamViewKey,type StreamView } from './chunkNeighborhood';
import { TerrainBaker } from './TerrainBaker';
import { planWildernessTrees,planWildernessDetails } from './sceneryPlan';
import {spriteBounds} from '../../data/settlementGeometry';
import type {TreeSwaySystem} from './TreeSwaySystem';
import type {DayNightSystem} from './DayNightSystem';
import {planLandmarkScenery} from './LandmarkScenery';
import type {WorldSpriteSystem} from './WorldSpriteSystem';
import {StaticBoundsIndex} from './StaticBoundsIndex';
import {bossArenaBounds} from './bossArenas';

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
  // Keep just two recently visited full-resolution ground textures. This
  // prevents expensive rebakes on backtracking without accumulating an
  // unbounded GPU texture cache on Android.
  private readonly recentTerrain=new Map<string,string>();
  private readonly recentTerrainLimit=2;
  private retireTerrain(key:string,chunk:ChunkRuntime){
    if(chunk.shared)return;
    this.recentTerrain.delete(key);this.recentTerrain.set(key,chunk.textureKey);
    while(this.recentTerrain.size>this.recentTerrainLimit){
      const oldest=this.recentTerrain.entries().next().value as [string,string]|undefined;
      if(!oldest)break;
      this.recentTerrain.delete(oldest[0]);this.scene.textures.remove(oldest[1]);
    }
  }
  private lastCenter = '';
  private lastTravelViewKey='';
  private lastOpenSeaStatus:boolean|null=null;
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
    if(viewportOnly){
      const camera=this.scene.cameras.main;
      this.updateView({left:worldX-camera.width/camera.zoom/2,right:worldX+camera.width/camera.zoom/2,
        top:worldY-camera.height/camera.zoom/2,bottom:worldY+camera.height/camera.zoom/2});return;
    }
    const centerX = Math.floor(worldX / CHUNK_SIZE);
    const centerY = Math.floor(worldY / CHUNK_SIZE);
    const camera=this.scene.cameras.main,halfW=camera.width/camera.zoom/2+128,halfH=camera.height/camera.zoom/2+128;
    // Screen and player are still within exactly the same streamed cells:
    // avoid constructing two sets of chunk keys on every animation frame.
    const viewKey=centerX+':'+centerY+':'
      +Math.floor((worldX-halfW)/CHUNK_SIZE)+':'+Math.floor((worldX+halfW)/CHUNK_SIZE)+':'
      +Math.floor((worldY-halfH)/CHUNK_SIZE)+':'+Math.floor((worldY+halfH)/CHUNK_SIZE);
    if(viewKey===this.lastTravelViewKey){this.loadPendingChunk();return;}
    this.lastTravelViewKey=viewKey;
    const visible=viewportChunks({left:worldX-halfW,right:worldX+halfW,top:worldY-halfH,bottom:worldY+halfH});
    const wanted=chunkNeighborhood(worldX,worldY);
    for(const key of visible)wanted.add(key);
    const centerKey = `${centerX}:${centerY}:`+streamViewKey(visible);
    if (centerKey === this.lastCenter) { this.loadPendingChunk(); return; }
    this.lastCenter = centerKey;

    for (const [key, chunk] of this.active) {
      if (wanted.has(key)) continue;
      chunk.image.destroy();
      for (const image of chunk.scenery) image.destroy();
      this.retireTerrain(key,chunk);
      this.active.delete(key);
    }
    for (const key of [...this.pendingChunks.keys()]) if(!wanted.has(key))this.pendingChunks.delete(key);
    // Initial entry requires complete coverage. Subsequent movement staggers
    // offscreen neighbors, but never drops visible chunks after a zoom/resize.
    if(this.active.size===0){
      this.pendingChunks.clear();
      for (const key of wanted) {
        if (!this.active.has(key)) {const [x,y]=key.split(':').map(Number);this.load(x,y);}
      }
    }else{
      // The player's current chunk is safety-critical. Never leave its props
      // pending behind offscreen bakes after a teleport or a fast boundary step.
      for(const key of visible)if(!this.active.has(key)){
        const [x,y]=key.split(':').map(Number);this.pendingChunks.delete(key);this.load(x,y);this.lastChunkBakedAt=this.scene.time.now;
      }
      for(const key of wanted)if(!this.active.has(key)&&!this.pendingChunks.has(key)){
        const [x,y]=key.split(':').map(Number);this.pendingChunks.set(key,{x,y});
      }
      this.loadPendingChunk();
    }
    this.updateOpenSeaStatus();
  }

  /** Hidden cuts bake one texture per frame in visibility order; normal travel
   * keeps the existing staggered budget for offscreen margin chunks. */
  updateView(view:StreamView,staged=false):boolean {
    // Covers complete mature trees beyond the edge, not just their ground anchors.
    const wanted=viewportChunks(view,768),visible=viewportChunks(view);
    this.lastCenter='view:'+streamViewKey(wanted);
    this.lastTravelViewKey=''; // Explicit transition views supersede walking cache.
    for(const [key,chunk] of this.active)if(!wanted.has(key)){
      chunk.image.destroy();for(const image of chunk.scenery)image.destroy();
      this.retireTerrain(key,chunk);this.active.delete(key);
    }
    for(const key of this.pendingChunks.keys())if(!wanted.has(key))this.pendingChunks.delete(key);
    const ordered=[...wanted].sort((a,b)=>Number(visible.has(b))-Number(visible.has(a)));
    const previousPending=new Map(this.pendingChunks);
    this.pendingChunks.clear();
    for(const key of ordered)if(!this.active.has(key)){
      const [x,y]=key.split(':').map(Number);
      if(!staged&&visible.has(key)){this.pendingChunks.delete(key);this.load(x,y);}
      else this.pendingChunks.set(key,previousPending.get(key)??{x,y});
    }
    this.loadPendingChunk(staged);this.updateOpenSeaStatus();
    // Margin chunks are speculative canopy coverage. They continue loading
    // after the shot is drawable, but must not hold the transition cover up.
    return [...visible].every(key=>this.active.has(key));
  }

  hasView(view:StreamView):boolean {
    return [...viewportChunks(view)].every(key=>this.active.has(key));
  }

  /** Each expensive canvas bake stays on the main thread, but never multiple
   * fresh 1536px terrain textures in a single frame during normal travel. */
  private loadPendingChunk(staged=false){
    if(!this.pendingChunks.size)return;
    const now=this.scene.time.now;
    if(!staged&&now-this.lastChunkBakedAt<95)return;
    const next=this.pendingChunks.entries().next().value as [string,{x:number;y:number}]|undefined;
    if(!next)return;
    const [key,point]=next;
    this.pendingChunks.delete(key);
    if(!this.active.has(key))this.load(point.x,point.y);
    this.lastChunkBakedAt=now;
    this.updateOpenSeaStatus();
  }

  private updateOpenSeaStatus(){
    if(this.pendingChunks.size!==0){
      if(this.lastOpenSeaStatus!==false){this.lastOpenSeaStatus=false;this.scene.registry.set('openSeaView',false);}
      return;
    }
    let openSea=true;
    for(const chunk of this.active.values())if(!chunk.shared){openSea=false;break;}
    if(this.lastOpenSeaStatus!==openSea){
      this.lastOpenSeaStatus=openSea;this.scene.registry.set('openSeaView',openSea);
    }
  }

  destroy() {
    for (const chunk of this.active.values()) {
      chunk.image.destroy();
      for (const image of chunk.scenery) image.destroy();
      if(!chunk.shared)this.scene.textures.remove(chunk.textureKey);
    }
    this.active.clear();
    this.pendingChunks.clear();
    for(const textureKey of this.recentTerrain.values())this.scene.textures.remove(textureKey);
    this.recentTerrain.clear();
    this.lastCenter = '';
    this.lastTravelViewKey='';this.lastOpenSeaStatus=null;
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
    const cacheKey=`${chunkX}:${chunkY}`;
    const cached=this.recentTerrain.delete(cacheKey);
    const canvasTexture = cached
      ? this.scene.textures.get(textureKey) as Phaser.Textures.CanvasTexture
      : this.scene.textures.createCanvas(textureKey, CHUNK_SIZE, CHUNK_SIZE);
    if (!canvasTexture) return;
    if(!cached){
      const ctx = canvasTexture.getContext();
      this.baker.draw(ctx, this.world, chunkX, chunkY);
    }
    const scenery: Array<Phaser.GameObjects.Image|Phaser.GameObjects.Sprite> = [];
    const cx=(chunkX+.5)*CHUNK_SIZE,cy=(chunkY+.5)*CHUNK_SIZE;
    const sites=authoredReservations.query({left:cx-CHUNK_SIZE,right:cx+CHUNK_SIZE,top:cy-CHUNK_SIZE,bottom:cy+CHUNK_SIZE})
      .map(item=>item.definition).filter(d=>Math.abs(d.world.x-cx)<CHUNK_SIZE&&Math.abs(d.world.y-cy)<CHUNK_SIZE);
    // Up to 36 mature trees, 40 habitat pieces and nearby bounded landmark
    // groups, all released with the chunk (including their leaf/light layers).
    // Authored/interactive settlement trees keep the persistent content ledger.
    const reservations=sites.map(d=>{
      const arena=bossArenaBounds(d);
      return {...d.world,...('frame' in d?{bounds:spriteBounds(d.texture??'world_objects',d.frame,d.scale??1,d.world.x,d.world.y)}:{}),
        ...(arena?{bounds:arena}:{})};
    });
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
    if(!cached)canvasTexture.refresh();
    canvasTexture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    const image = this.scene.add.image(chunkX * CHUNK_SIZE, chunkY * CHUNK_SIZE, textureKey).setOrigin(0, 0).setDepth(-1000);
    this.active.set(`${chunkX}:${chunkY}`, { image, textureKey, scenery });
  }
}
