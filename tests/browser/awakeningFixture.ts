import Phaser from 'phaser';
import {BootScene} from '../../src/game/scenes/BootScene';
import {ART_SHEETS,ART_BY_KEY,actorArtLayout,type ArtTextureKey} from '../../src/data/art';
import {heroBodySource} from '../../src/data/modularHero';
import {packAwakeningState,packAwakeningItem} from './awakeningPacking';
import {AwakenedHeroVisual} from '../../src/game/systems/AwakenedHeroVisual';
import {EquippedSwordVisual,SWORD_SOURCE,loadAwakenedSwords,prepareEquippedSwords} from '../../src/game/systems/EquippedSwordVisual';
import {AWAKENING_PROFILES} from '../../src/data/awakening';
import {AWAKENED_HERO_STATES} from '../../src/data/awakenedHero';
import {useGameStore} from '../../src/store/gameStore';

const sheets=ART_SHEETS.filter(s=>s.key.startsWith('leigneron')||s.key.startsWith('skill_'));
interface ReviewRow {state:string;key:string;frames:number;offset:number;label:string;flip:boolean}
class HeroReview extends BootScene{
 private actor!:Phaser.GameObjects.Sprite;private original!:Phaser.GameObjects.Sprite;
 private cosmetic!:AwakenedHeroVisual;private sword!:EquippedSwordVisual;private originalSword!:EquippedSwordVisual;
 preload(){
  for(const path of new Set(sheets.flatMap(s=>s.sources?.map(p=>p.path)??[s.path])))this.load.image('source:'+path,'/'+heroBodySource(path));
  this.load.image(SWORD_SOURCE,'/assets/items/equipment-v1.png');loadAwakenedSwords(this);
 }
 create(){
  try{
   this.prepareRegisteredSheets(sheets);
   prepareEquippedSwords(this);
   this.actor=this.add.sprite(650,350,'leigneron_idle',0);this.original=this.add.sprite(550,350,'leigneron_idle',0);
   this.sword=new EquippedSwordVisual(this);this.originalSword=new EquippedSwordVisual(this);
   this.cosmetic=new AwakenedHeroVisual(this,()=>this.sword.hide());
   this.cameras.main.setZoom(2).centerOn(600,320);
   this.events.once('shutdown',()=>{this.cosmetic.destroy();this.sword.destroy();this.originalSword.destroy();});
   const rows=AWAKENED_HERO_STATES.flatMap<ReviewRow>(s=>s.state==='attack'?[0,6,12,18].map(offset=>({...s,offset,frames:6,label:'attack-'+offset,flip:false})):
    [{...s,label:s.state+'-'+s.offset,flip:s.key==='leigneron'&&s.offset===6},...(['idle-side','run-side','iron-rush'].includes(s.state)?[{...s,label:s.state+'-left',flip:true}]:[])]);
   (window as any).__awakeningReview={scene:this,
    pack:(weaponId:string,state:string,url?:string,grid?:{columns:number;rows:number})=>packAwakeningState(this,weaponId,state,url,grid),item:packAwakeningItem,
    rows,ready:()=>this.cosmetic.readyForm,
    select:(slug:string)=>{const p=AWAKENING_PROFILES.find(p=>p.slug===slug)!;useGameStore.setState({weaponId:p.weaponId,awakenedWeapons:[p.weaponId]});},
    pose:(key:string,frame:number,flip=false)=>{
     const sheet=ART_BY_KEY[key as ArtTextureKey],origin=key.startsWith('skill_') ? .5 : actorArtLayout(key as ArtTextureKey).originY;
     for(const actor of [this.actor,this.original])actor.setTexture(key,frame).setOrigin(.5,origin).setScale(1/sheet.density).setFlipX(flip).setAlpha(1);
     this.actor.y=this.original.y=key.startsWith('skill_')?330:350;
    },
    capture:()=>new Promise<string>(resolve=>this.game.renderer.snapshotArea(420,100,440,440,(image:unknown)=>resolve((image as HTMLImageElement).src))),
    textureCount:()=>this.textures.getTextureKeys().filter(k=>k.startsWith('awakened-hero:')).length};
  }catch(e){(window as any).__awakeningError=String(e);throw e;}
 }
 update(){if(this.actor&&this.cosmetic){const actor=this.cosmetic.update(this.actor);this.sword.update(actor,false);this.originalSword.update(this.original,false);}}
}
new Phaser.Game({type:Phaser.WEBGL,width:1280,height:720,backgroundColor:'#18221f',scene:[HeroReview],audio:{noAudio:true}});
