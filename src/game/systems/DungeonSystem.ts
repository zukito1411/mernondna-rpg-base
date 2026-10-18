import Phaser from 'phaser';
import {DUNGEONS,DUNGEON_BY_ID,dungeonCleared,dungeonResetReady,type DungeonDefinition} from '../../data/dungeons';
import {CAVE_ART_PATH,CAVE_ART_FRAMES} from '../../data/caveArt';
import type {InteriorEntry} from '../../data/interiors';
import {useGameStore} from '../../store/gameStore';
import {saveGame} from '../../utils/save';
import type {WorldScene} from '../scenes/WorldScene';
import type {Enemy} from '../entities/Enemy';
import type {NavigationMarker,Vec2} from '../types';

const EXTERIOR='cave-entrances-v1';
/** Four authored sites, one active room, at most three live defenders. Outdoor
 * work runs with the existing navigation snapshot, not a new update timer. */
export class DungeonSystem {
  private readonly sites=new Map<string,{entry:InteriorEntry;image:Phaser.GameObjects.Image}>();
  private readonly positions=new Map<string,Vec2>();
  private readonly retries=new Map<string,number>();
  private loading=false;
  private artRetryAt=0;
  private disposed=false;
  private session:DungeonDefinition|null=null;
  private readonly actors=new Map<Enemy,number>();
  private chest:Phaser.GameObjects.Image|null=null;
  private caption:Phaser.GameObjects.Text|null=null;
  private chestPoint:Vec2|null=null;
  private retryAt=0;
  private warned=false;
  private onLoaded=()=>{this.loading=false;if(this.disposed)return;
    const texture=this.scene.textures.get(EXTERIOR);const [x,y,w,h]=CAVE_ART_FRAMES.entrance;
    texture.add('entrance',0,x,y,w,h);this.scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR,this.onError);};
  private onError=(file:Phaser.Loader.File)=>{if(file.key===EXTERIOR){this.loading=false;this.artRetryAt=this.scene.time.now+10000;
    this.scene.load.off('filecomplete-image-'+EXTERIOR,this.onLoaded);this.scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR,this.onError);}};
  constructor(private readonly scene:WorldScene){}
  get entries(){return [...this.sites.values()].map(s=>s.entry);}
  get active(){return this.session!==null;}
  get fighting(){return Boolean(this.session&&!dungeonCleared(this.session,useGameStore.getState().dungeons[this.session.id]));}
  get enemies(){return [...this.actors.keys()];}
  owns(enemy:Enemy){return this.actors.has(enemy);}
  allows(point:Vec2){return this.active&&this.scene.inInterior&&this.scene.isWalkable(point.x,point.y);}
  private ensureArt(){
    if(this.scene.textures.exists(EXTERIOR)||this.loading||this.scene.load.isLoading()||this.scene.time.now<this.artRetryAt)return;
    this.loading=true;this.scene.load.once('filecomplete-image-'+EXTERIOR,this.onLoaded);
    this.scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR,this.onError);
    this.scene.load.image({key:EXTERIOR,url:CAVE_ART_PATH,xhrSettings:{responseType:'blob',timeout:15000}});this.scene.load.start();
  }
  exteriorMarkers():NavigationMarker[]{
    if(this.scene.inInterior)return [];
    const player=this.scene.player,markers:NavigationMarker[]=[];
    const now=Date.now();
    for(const d of DUNGEONS){
      if(dungeonResetReady(useGameStore.getState().dungeons[d.id],now))useGameStore.getState().refreshDungeon(d.id);
      const point=this.positions.get(d.id)??d.door,distance=Math.hypot(point.x-player.x,point.y-player.y);
      if(distance>1800){const site=this.sites.get(d.id);if(site){site.image.destroy();this.sites.delete(d.id);}continue;}
      this.ensureArt();
      let door=this.positions.get(d.id);
      if(!door&&distance<=1000&&this.scene.time.now>=(this.retries.get(d.id)??0)){
        this.retries.set(d.id,this.scene.time.now+5000);
        // One bounded placement pass, avoiding roads, water, settlement props
        // and scenery across the complete entrance footprint and approach.
        const offsets=[{x:0,y:0},...Array.from({length:48},(_,i)=>({x:Math.cos(i*Math.PI/6)*(120+Math.floor(i/12)*120),y:Math.sin(i*Math.PI/6)*(120+Math.floor(i/12)*120)}))];
        door=offsets.map(p=>({x:d.door.x+p.x,y:d.door.y+p.y})).find(p=>{
          if(!this.scene.dungeonEntranceSuitable(p,d.regionId))return false;
          return [[0,0],[-105,-50],[105,-50],[-90,-145],[0,-145],[90,-145],[0,55]].every(([dx,dy])=>{
            const q={x:p.x+dx,y:p.y+dy};return this.scene.interiorDoorClear(q.x,q.y)&&this.scene.canTraverseGround(q,q);
          });
        });
        if(door)this.positions.set(d.id,door);
      }
      if(!door)continue;
      if(!this.sites.has(d.id)&&this.scene.textures.exists(EXTERIOR)&&this.scene.textures.get(EXTERIOR).has('entrance')){
        const image=this.scene.add.image(door.x,door.y-24,EXTERIOR,'entrance').setOrigin(.5,1).setDisplaySize(230,214).setTint(d.tint).setDepth(door.y-24);
        this.scene.registerDungeonEntrance(image);
        image.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
          const s=useGameStore.getState();if(s.panel||s.dialogue||s.cinematic)return;
          if(Math.hypot(this.scene.player.x-door!.x,this.scene.player.y-door!.y)<95)this.scene.tryInteract(this.scene.player.x,this.scene.player.y);
          else this.scene.notify(`Approach the entrance to ${d.name}.`);
        });
        this.sites.set(d.id,{image,entry:{id:'cave:'+d.id,townId:d.townId,name:d.name,kit:'cave_stone',door:{...door},hall:false,profile:'cave'}});
      }
      if(Math.hypot(door.x-player.x,door.y-player.y)<=900)useGameStore.getState().discoverDungeon(d.id);
      const p=useGameStore.getState().dungeons[d.id];
      if(p&&distance<=1200)markers.push({id:'cave:'+d.id,kind:'landmark',service:'cave',label:`${d.name}${p.claimed?' · Cleared':''} · Lv ${d.minLevel}+`,...door});
    }
    return markers;
  }
  begin(entryId:string){
    this.close();const id=entryId.replace(/^cave:/,''),d=DUNGEON_BY_ID[id];if(!d)return;
    useGameStore.getState().refreshDungeon(id);
    this.session=d;useGameStore.getState().discoverDungeon(id);useGameStore.setState({activeDungeonId:id});
    this.retryAt=this.scene.time.now+1400;
    for(const enemyId of new Set(d.enemies))this.scene.ensureStoryEnemy(enemyId);
    if(dungeonCleared(d,useGameStore.getState().dungeons[id]))this.showChest();
    else this.scene.notify(`${d.name} · hardened defenders, then ${d.captain}. Clear the cave to reveal its chest.`);
  }
  update(time:number,blocked:boolean){
    const d=this.session;if(!d||blocked)return;
    const p=useGameStore.getState().dungeons[d.id];
    if(dungeonCleared(d,p)){if(!this.chest)this.showChest();return;}
    if(this.actors.size||time<this.retryAt)return;
    this.retryAt=time+500;
    const slots=[0,1,2,3,4,5,6].filter(slot=>!(p.defeated&(1<<slot)));
    const wave=Math.floor(slots[0]/3),pending=slots.filter(slot=>Math.floor(slot/3)===wave);
    const ready=pending.map(slot=>this.scene.ensureStoryEnemy(d.enemies[slot])).every(Boolean);if(!ready)return;
    const placed:Vec2[]=[];
    for(const slot of pending){
      const preferred=this.scene.dungeonPoint({x:[360,840,600][slot%3],y:wave===0?850:wave===1?530:350});
      const candidates=[preferred,...Array.from({length:36},(_,i)=>({x:this.scene.player.x+Math.cos(i*Math.PI/6)*(210+Math.floor(i/12)*70),y:this.scene.player.y+Math.sin(i*Math.PI/6)*(210+Math.floor(i/12)*70)}))];
      const position=candidates.find(q=>Math.hypot(q.x-this.scene.player.x,q.y-this.scene.player.y)>=150
        &&placed.every(other=>Math.hypot(q.x-other.x,q.y-other.y)>85)&&this.scene.storySpawnClear(q,d.enemies[slot]));
      if(!position){if(!this.warned){this.warned=true;this.scene.notify('Move farther into the cavern to give the defenders a clear approach.');}return;}
      placed.push(position);
    }
    try{pending.forEach((slot,i)=>{const enemy=this.scene.createDungeonEnemy(d,slot,placed[i]);this.actors.set(enemy,slot);});
      this.warned=false;this.scene.notify(wave===2?`${d.captain} approaches!`:`${d.name} · defender group ${wave+1} of 2`);
    }catch(error){for(const enemy of this.actors.keys())this.scene.releaseStoryEnemy(enemy);this.actors.clear();this.retryAt=time+1500;console.error('Cave defenders:',error);}
  }
  defeated(enemy:Enemy){
    const slot=this.actors.get(enemy),d=this.session;if(slot===undefined||!d)return false;
    this.actors.delete(enemy);useGameStore.getState().recordDungeonDefeat(d.id,slot);
    enemy.createDeathVisual();this.scene.releaseStoryEnemy(enemy);this.retryAt=this.scene.time.now+1600;
    if(dungeonCleared(d,useGameStore.getState().dungeons[d.id])){this.showChest();this.scene.notify(`${d.name} cleared! A war chest has appeared in the inner chamber.`);}
    this.scene.syncState();saveGame();return true;
  }
  private showChest(){
    const d=this.session;if(!d||this.chest)return;
    const p=this.scene.dungeonPoint({x:600,y:350});this.chestPoint=p;
    const claimed=useGameStore.getState().dungeons[d.id]?.claimed;
    this.chest=this.scene.add.image(p.x,p.y,'interior-furniture',claimed?'openChest':'chest').setOrigin(.5,1).setDisplaySize(72,70).setDepth(this.scene.playerRenderDepth(p.y));
    this.chest.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.interact());
    this.caption=this.scene.add.text(p.x,p.y-82,claimed?'Claimed':'War chest',{fontFamily:'Georgia, serif',fontSize:'12px',color:'#ffe3a2',stroke:'#1b140e',strokeThickness:3})
      .setOrigin(.5).setDepth(this.scene.playerRenderDepth(p.y)+1);
  }
  get prompt(){
    if(!this.session||!this.chestPoint||Math.hypot(this.scene.player.x-this.chestPoint.x,this.scene.player.y-this.chestPoint.y)>95)return null;
    const progress=useGameStore.getState().dungeons[this.session.id];
    if(progress?.claimed){const minutes=Math.max(0,Math.ceil(((progress.respawnAt??0)-Date.now())/60000));
      return minutes?`War chest · resets in ${minutes}m`:'War chest · leave to reset the cave';}
    return 'Open cave war chest';
  }
  get markers():NavigationMarker[]{return this.chestPoint?[{id:'cave:chest',kind:'landmark',label:'War chest',...this.chestPoint}]:[];}
  interact(){
    if(!this.session||!this.prompt)return false;
    const s=useGameStore.getState(),id=this.session.id;if(s.dungeons[id]?.claimed){this.scene.notify(this.prompt!);return true;}
    if(s.panel||s.dialogue||s.cinematic||!this.scene.hasClearPath(this.scene.player.x,this.scene.player.y,this.chestPoint!.x,this.chestPoint!.y))return true;
    s.claimDungeonChest(id);if(!useGameStore.getState().dungeons[id]?.claimed)return true;
    this.chest?.setFrame('openChest');this.caption?.setText('Claimed · 20m reset');this.scene.playAudio('sfx-heal-bell',.4);
    this.scene.syncState();saveGame();return true;
  }
  close(){
    for(const enemy of this.actors.keys())this.scene.releaseStoryEnemy(enemy);this.actors.clear();
    this.chest?.destroy();this.caption?.destroy();this.chest=null;this.caption=null;this.chestPoint=null;this.session=null;
    if(useGameStore.getState().activeDungeonId)useGameStore.setState({activeDungeonId:null});
  }
  destroy(){this.disposed=true;this.close();this.scene.load.off('filecomplete-image-'+EXTERIOR,this.onLoaded);this.scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR,this.onError);
    for(const site of this.sites.values())site.image.destroy();this.sites.clear();if(this.scene.textures.exists(EXTERIOR))this.scene.textures.remove(EXTERIOR);}
}
