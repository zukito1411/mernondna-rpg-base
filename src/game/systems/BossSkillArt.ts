import Phaser from 'phaser';
import {BOSS_SKILL_ART,BOSS_SKILL_CELL,BOSS_SKILL_ROWS,BOSS_SKILL_TEXTURE} from '../../data/bossSkillEffects';

interface Residency {pending:boolean;disposed:boolean;retryAt:number;abort:AbortController|null;}
const residents=new WeakMap<Phaser.Scene,Residency>();
/** One optional, bounded shared sheet. It never joins the boot loader or owns
 * damage. Abort and lifetime checks prevent stale uploads into a later scene. */
export function ensureBossSkillArt(scene:Phaser.Scene):boolean{
 if(scene.textures.exists(BOSS_SKILL_TEXTURE))return true;
 let state=residents.get(scene);
 if(!state){
  state={pending:false,disposed:false,retryAt:0,abort:null};residents.set(scene,state);
  const owned=state;
  const cleanup=()=>{
   owned.disposed=true;owned.abort?.abort();
   scene.events.off(Phaser.Scenes.Events.SHUTDOWN,cleanup);
   scene.events.off(Phaser.Scenes.Events.DESTROY,cleanup);
   if(scene.textures.exists(BOSS_SKILL_TEXTURE))scene.textures.remove(BOSS_SKILL_TEXTURE);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY,cleanup);
 }
 if(!state.disposed&&!state.pending&&scene.time.now>=state.retryAt)void load(scene,state);
 return false;
}
async function load(scene:Phaser.Scene,state:Residency){
 state.pending=true;const abort=new AbortController();state.abort=abort;
 const timer=window.setTimeout(()=>abort.abort(),15000);
 let url:string|null=null;
 try{
  const response=await fetch(import.meta.env.BASE_URL+BOSS_SKILL_ART,{signal:abort.signal});
  if(!response.ok)throw new Error('Boss effect sheet could not load');
  const blob=await response.blob();if(state.disposed||abort.signal.aborted)return;
  url=URL.createObjectURL(blob);const image=new Image();image.src=url;await image.decode();
  if(state.disposed||abort.signal.aborted)return;
  if(image.width!==BOSS_SKILL_CELL*3||image.height!==BOSS_SKILL_CELL*BOSS_SKILL_ROWS)throw new Error('Invalid boss effect sheet dimensions');
  if(!scene.textures.exists(BOSS_SKILL_TEXTURE))scene.textures.addSpriteSheet(BOSS_SKILL_TEXTURE,image,
   {frameWidth:BOSS_SKILL_CELL,frameHeight:BOSS_SKILL_CELL});
 }catch(error){
  if(!state.disposed){state.retryAt=scene.time.now+10000;console.warn('Boss skill artwork:',error);}
 }finally{
  window.clearTimeout(timer);if(url)URL.revokeObjectURL(url);
  state.pending=false;if(state.abort===abort)state.abort=null;
 }
}
