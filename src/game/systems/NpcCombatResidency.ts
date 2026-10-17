import Phaser from 'phaser';
import {NPC_COMBAT_DIRECTIONS,npcCombatKey,NPC_ARROW_TEXTURE,NPC_ARROW_PATH,type NpcCombatSpec} from '../../data/npcCombatArt';
import {npcCombatSourceKey,prepareNpcCombatSheet,prepareNpcArrow} from './NpcCombatArt';
const artOwners=new WeakMap<Phaser.Scene,Set<NpcCombatResidency>>();

/** Shared loader, bounded cache. Never evict a sheet still used by a fighter
 * or a regional sentry walking back to its post. No world-wide NPC preload. */
export class NpcCombatResidency {
  private readonly resident=new Map<string,NpcCombatSpec>();
  private readonly pending=new Map<string,NpcCombatSpec>();
  private readonly failures=new Map<string,number>();
  private loading:NpcCombatSpec|null=null;
  private disposed=false;
  private nextTrim=0;
  constructor(private readonly scene:Phaser.Scene,private readonly referenced:(spec:NpcCombatSpec)=>boolean,
    private readonly report:(message:string)=>void){
    const owners=artOwners.get(scene)??new Set<NpcCombatResidency>();owners.add(this);artOwners.set(scene,owners);
  }
  ensure(spec:NpcCombatSpec){
    if(this.disposed)return false;
    if(this.scene.anims.exists(npcCombatKey(spec,'attack','down'))
      &&(spec.mode!=='bow'||this.scene.textures.exists(NPC_ARROW_TEXTURE))){
      if(!spec.eager)this.resident.set(spec.id,spec);return true;
    }
    if(this.scene.time.now<(this.failures.get(spec.id)??0))return false;
    if(this.loading?.id===spec.id)return false;
    this.pending.set(spec.id,spec);return false;
  }
  update(){
    if(this.disposed)return;
    if(this.scene.time.now>=this.nextTrim){
      this.nextTrim=this.scene.time.now+500;
      for(const spec of this.resident.values())if(!this.referenced(spec))this.release(spec);
    }
    if(this.loading||this.scene.load.isLoading())return;
    const spec=this.pending.values().next().value as NpcCombatSpec|undefined;if(!spec)return;
    if(this.scene.anims.exists(npcCombatKey(spec,'attack','down'))
      &&(spec.mode!=='bow'||this.scene.textures.exists(NPC_ARROW_TEXTURE))){
      this.pending.delete(spec.id);this.resident.set(spec.id,spec);return;
    }
    if(this.resident.size>=6){
      const unused=[...this.resident.values()].find(s=>!this.referenced(s));
      if(!unused)return;this.release(unused);
    }
    this.pending.delete(spec.id);this.loading=spec;
    spec.sources.forEach((source,i)=>{
      const key=npcCombatSourceKey(spec,i);
      if(!this.scene.textures.exists(key))this.scene.load.image({key,url:source.path,xhrSettings:{responseType:'blob',timeout:15000}});
    });
    if(spec.mode==='bow'&&!this.scene.textures.exists(NPC_ARROW_TEXTURE))
      this.scene.load.image({key:'npc-arrow-source',url:NPC_ARROW_PATH,xhrSettings:{responseType:'blob',timeout:15000}});
    this.scene.load.once(Phaser.Loader.Events.COMPLETE,this.complete,this);this.scene.load.start();
  }
  private complete(){
    const spec=this.loading;this.loading=null;if(!spec||this.disposed)return;
    this.pending.delete(spec.id);
    try{
      if(spec.sources.some((_,i)=>!this.scene.textures.exists(npcCombatSourceKey(spec,i))))throw new Error('Missing source image');
      if(spec.mode==='bow'&&!this.scene.textures.exists(NPC_ARROW_TEXTURE))prepareNpcArrow(this.scene,'npc-arrow-source');
      if(!this.scene.anims.exists(npcCombatKey(spec,'attack','down'))){
        const clips=prepareNpcCombatSheet(this.scene,spec);
        for(const clip of clips)this.scene.anims.create({key:clip.key,
          frames:clip.frames.map(frame=>({key:clip.texture,frame})),frameRate:clip.frameRate,repeat:clip.repeat});
      }
      this.resident.delete(spec.id);this.resident.set(spec.id,spec);this.failures.delete(spec.id);
    }catch(error){
      const firstFailure=!this.failures.has(spec.id);
      this.release(spec);this.failures.set(spec.id,this.scene.time.now+15000);
      if(firstFailure)this.report(`Could not prepare ${spec.id} assistance art: ${error instanceof Error?error.message:String(error)}`);
    }finally{
      spec.sources.forEach((_,i)=>{const key=npcCombatSourceKey(spec,i);if(this.scene.textures.exists(key))this.scene.textures.remove(key);});
      if(this.scene.textures.exists('npc-arrow-source'))this.scene.textures.remove('npc-arrow-source');
    }
  }
  private release(spec:NpcCombatSpec){
    this.resident.delete(spec.id);
    // A road party and Alice can use the same huntress sheet. One loader must
    // not remove its frames while another system still needs them.
    if([...artOwners.get(this.scene)??[]].some(owner=>owner!==this&&owner.referenced(spec)))return;
    for(const direction of NPC_COMBAT_DIRECTIONS)for(const state of ['attack','walk'] as const){
      const key=npcCombatKey(spec,state,direction);if(this.scene.anims.exists(key))this.scene.anims.remove(key);
    }
    if(this.scene.textures.exists(spec.texture))this.scene.textures.remove(spec.texture);
  }
  cancelPending(){this.pending.clear();}
  destroy(){
    if(this.disposed)return;this.disposed=true;artOwners.get(this.scene)?.delete(this);
    this.scene.load.off(Phaser.Loader.Events.COMPLETE,this.complete,this);
    if(this.loading)for(const [i] of this.loading.sources.entries()){
      const key=npcCombatSourceKey(this.loading,i);if(this.scene.textures.exists(key))this.scene.textures.remove(key);
    }
    this.loading=null;
    if(this.scene.textures.exists('npc-arrow-source'))this.scene.textures.remove('npc-arrow-source');
    for(const spec of this.resident.values())this.release(spec);
    this.pending.clear();this.failures.clear();
    if(!artOwners.get(this.scene)?.size&&this.scene.textures.exists(NPC_ARROW_TEXTURE))this.scene.textures.remove(NPC_ARROW_TEXTURE);
  }
}
