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
import {ACTIVE_SKILLS} from '../../src/data/activeSkills';

const sheets=ART_SHEETS.filter(s=>s.key.startsWith('leigneron')||s.key.startsWith('skill_'));
interface ReviewRow {state:string;key:string;frames:number;offset:number;label:string;flip:boolean;stowed?:boolean}
class HeroReview extends BootScene{
 private actor!:Phaser.GameObjects.Sprite;private original!:Phaser.GameObjects.Sprite;
 private cosmetic!:AwakenedHeroVisual;private sword!:EquippedSwordVisual;private originalSword!:EquippedSwordVisual;
 private stowed=false;private facingUp=false;private hideWeapon=false;private probeOnly=false;
 preload(){
  for(const path of new Set(sheets.flatMap(s=>s.sources?.map(p=>p.path)??[s.path])))this.load.image('source:'+path,'/'+heroBodySource(path));
  this.load.image(SWORD_SOURCE,'/assets/items/equipment-v1.png');loadAwakenedSwords(this);
 }
 create(){
  try{
   this.prepareRegisteredSheets(sheets);
   this.cameras.main.setBackgroundColor('#18221f');
   prepareEquippedSwords(this);
   this.actor=this.add.sprite(650,350,'leigneron_idle',0);this.original=this.add.sprite(550,350,'leigneron_idle',0);
   this.sword=new EquippedSwordVisual(this);this.originalSword=new EquippedSwordVisual(this);
   this.cosmetic=new AwakenedHeroVisual(this,()=>this.sword.hide());
   this.cameras.main.setZoom(2).centerOn(600,320);
   this.events.once('shutdown',()=>{this.cosmetic.destroy();this.sword.destroy();this.originalSword.destroy();});
   const rows=AWAKENED_HERO_STATES.flatMap<ReviewRow>(s=>s.state==='attack'?[0,6,12,18].map(offset=>({...s,offset,frames:6,label:'attack-'+offset,flip:false})):
    [{...s,label:s.state+'-'+s.offset,flip:s.key==='leigneron'&&s.offset===6},...(['idle-side','run-side'].includes(s.state)||s.key.startsWith('skill_')&&!s.state.endsWith('-up')&&!s.state.endsWith('-down')?[{...s,label:s.state+'-left',flip:true}]:[])]);
   rows.push(...rows.filter(s=>s.key==='leigneron').map(s=>({...s,label:s.label+' / weapon on back',stowed:true})));
   (window as any).__awakeningReview={scene:this,
    pack:(weaponId:string,state:string,url?:string,grid?:{columns:number;rows:number})=>packAwakeningState(this,weaponId,state,url,grid),item:packAwakeningItem,
    rows,ready:()=>this.cosmetic.readyForm,
    select:(slug:string)=>{const p=AWAKENING_PROFILES.find(p=>p.slug===slug)!;useGameStore.setState({weaponId:p.weaponId,awakenedWeapons:[p.weaponId]});return p;},
    equipment:(stowed:boolean)=>{this.stowed=stowed;},
    probe:(enabled:boolean)=>{this.probeOnly=enabled;this.original.setVisible(!enabled);this.cameras.main.setBackgroundColor(enabled?'rgba(0,0,0,0)':'#18221f');},
    pose:(key:string,frame:number,flip=false)=>{
     this.stowed=false;this.hideWeapon=ACTIVE_SKILLS.some(s=>s.texture===key&&s.hideWeapon);
     this.facingUp=key==='leigneron'&&frame>=18||key==='leigneron_attack'&&frame>=18||key==='skill_iron_rush_up';
     const sheet=ART_BY_KEY[key as ArtTextureKey],origin=key.startsWith('skill_') ? .5 : actorArtLayout(key as ArtTextureKey).originY;
     for(const actor of [this.actor,this.original])actor.setTexture(key,frame).setOrigin(.5,origin).setScale(1/sheet.density).setFlipX(flip).setAlpha(1);
     this.actor.y=this.original.y=key.startsWith('skill_')?330:350;
    },
    // Include the widest registered slash/wing bounds, not only standing bodies.
    capture:()=>new Promise<string>(resolve=>this.game.renderer.snapshotArea(300,20,680,680,(image:unknown)=>resolve((image as HTMLImageElement).src))),
    captureCosmetic:()=>new Promise<string>(resolve=>this.game.renderer.snapshotArea(500,20,560,680,(image:unknown)=>resolve((image as HTMLImageElement).src))),
    captureViewport:()=>new Promise<string>(resolve=>this.game.renderer.snapshot((image:unknown)=>resolve((image as HTMLImageElement).src))),
    textureCount:()=>this.textures.getTextureKeys().filter(k=>k.startsWith('awakened-hero:')).length};
  }catch(e){(window as any).__awakeningError=String(e);throw e;}
 }
 update(){if(this.actor&&this.cosmetic){const actor=this.cosmetic.update(this.actor);if(this.hideWeapon||this.probeOnly){this.sword.hide();this.originalSword.hide();}else{this.sword.update(actor,this.stowed,this.facingUp);this.originalSword.update(this.original,this.stowed,this.facingUp);}}}
}
new Phaser.Game({type:Phaser.WEBGL,width:1280,height:720,transparent:true,scene:[HeroReview],audio:{noAudio:true}});
