import Phaser from 'phaser';
import {M14_ART,m14Animations,type M14ArtSpec} from '../../data/m14Art';
import type {RegionId} from '../types';
import {m14Sources,prepareM14Art} from './M14Art';

/** New families load on demand. Never evict a texture referenced by an actor;
 * short grace also covers temporary corpse sprites after the actor unloads. */
export class M14ArtResidency {
  private readonly resident=new Map<string,{spec:M14ArtSpec;lastUsed:number}>();
  private readonly pending=new Set<string>();
  private readonly failed=new Set<string>();
  private readonly abandoned=new Set<string>();
  private loading:M14ArtSpec|null=null;
  private disposed=false;
  private elapsed=0;
  private region:RegionId|null=null;
  constructor(private readonly scene:Phaser.Scene,private readonly referenced:(id:string)=>boolean,
    private readonly report:(message:string)=>void){}

  ensure(id:string):boolean {
    const spec=M14_ART.find(s=>s.id===id);if(!spec)return true;
    if(this.disposed||this.failed.has(id))return false;
    this.abandoned.delete(id);
    if(this.resident.has(id))return true;
    this.pending.add(id);this.pump();return false;
  }
  update(delta:number,region:RegionId){
    if(this.disposed)return;
    if(this.region!==region){
      this.region=region;
      for(const spec of M14_ART)if(!spec.boss&&spec.region===region)this.ensure(spec.id);
    }
    this.elapsed+=delta;if(this.elapsed<500)return;this.elapsed=0;
    for(const entry of this.resident.values())if(this.referenced(entry.spec.id))entry.lastUsed=this.scene.time.now;
    this.pump();
  }
  private pump(){
    if(this.disposed||this.loading||this.scene.load.isLoading())return;
    const requests=[...this.pending].map(id=>M14_ART.find(s=>s.id===id)!)
      .filter(s=>!this.resident.has(s.id)&&!this.failed.has(s.id)).sort((a,b)=>Number(Boolean(b.boss))-Number(Boolean(a.boss)));
    // Two ambient families plus one boss; a full ambient cache cannot starve
    // an authored boss. No active actor's texture is ever evicted.
    const spec=requests.find(s=>[...this.resident.values()].filter(e=>Boolean(e.spec.boss)===Boolean(s.boss)).length<(s.boss?1:2)
      ||[...this.resident.values()].some(e=>Boolean(e.spec.boss)===Boolean(s.boss)&&!this.referenced(e.spec.id)&&this.scene.time.now-e.lastUsed>=5000));
    if(!spec)return;
    if([...this.resident.values()].filter(e=>Boolean(e.spec.boss)===Boolean(spec.boss)).length>=(spec.boss?1:2)){
      const disposable=[...this.resident.values()].filter(e=>Boolean(e.spec.boss)===Boolean(spec.boss)&&!this.referenced(e.spec.id)&&this.scene.time.now-e.lastUsed>=5000)
        .sort((a,b)=>a.lastUsed-b.lastUsed)[0];
      if(!disposable)return;
      this.release(disposable.spec);
    }
    this.loading=spec;this.pending.delete(spec.id);
    for(const source of m14Sources(spec))if(!this.scene.textures.exists(source.key))
      this.scene.load.image({key:source.key,url:source.path,xhrSettings:{responseType:'blob',timeout:15000}});
    this.scene.load.once(Phaser.Loader.Events.COMPLETE,this.complete,this);this.scene.load.start();
  }
  private complete(){
    const spec=this.loading;this.loading=null;if(!spec||this.disposed)return;
    try{
      // Do not decode/prepare a tower-only atlas after its room has closed.
      // Let shared loader requests settle normally; never reset other owners.
      if(this.abandoned.delete(spec.id))return;
      if(m14Sources(spec).some(s=>!this.scene.textures.exists(s.key)))throw new Error(`Missing ${spec.id} source image`);
      prepareM14Art(this.scene,spec);
      for(const clip of m14Animations(spec))this.scene.anims.create({key:clip.key,
        frames:clip.frames.map((frame,i)=>({key:clip.texture,frame,duration:clip.frameDurations?.[i]??0})),frameRate:clip.frameRate,repeat:clip.repeat});
      this.resident.set(spec.id,{spec,lastUsed:this.scene.time.now});
    }catch(error){
      this.failed.add(spec.id);this.release(spec);
      this.report(`Could not load ${spec.id} artwork: ${error instanceof Error?error.message:String(error)}`);
    }finally{for(const source of m14Sources(spec))if(this.scene.textures.exists(source.key))this.scene.textures.remove(source.key);}
    // Next update allows the content manager to activate this family before
    // any subsequent request can consider it for eviction.
  }
  private release(spec:M14ArtSpec){
    for(const clip of m14Animations(spec))if(this.scene.anims.exists(clip.key))this.scene.anims.remove(clip.key);
    if(this.scene.textures.exists(spec.texture))this.scene.textures.remove(spec.texture);
    for(const key of spec.auxiliaryTextures??[])if(this.scene.textures.exists(key))this.scene.textures.remove(key);
    this.resident.delete(spec.id);
  }
  forget(id:string){
    if(this.referenced(id))return;
    this.pending.delete(id);
    if(this.loading?.id===id)this.abandoned.add(id);
    const entry=this.resident.get(id);if(entry)this.release(entry.spec);
  }
  destroy(){
    if(this.disposed)return;this.disposed=true;
    this.scene.load.off(Phaser.Loader.Events.COMPLETE,this.complete,this);
    if(this.loading)this.scene.load.reset();
    for(const spec of M14_ART){this.release(spec);for(const s of m14Sources(spec))if(this.scene.textures.exists(s.key))this.scene.textures.remove(s.key);}
    if(this.scene.textures.exists('enemy_goblin_stone'))this.scene.textures.remove('enemy_goblin_stone');
    this.pending.clear();this.failed.clear();this.abandoned.clear();this.loading=null;
  }
}
