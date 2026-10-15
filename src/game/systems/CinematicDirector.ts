import Phaser from 'phaser';
import { CINEMATICS, type StoryScene, type StoryShot } from '../../data/cinematics';
import { useGameStore } from '../../store/gameStore';
import type { WorldScene } from '../scenes/WorldScene';
import {renderDensity} from './renderSizing';

type Phase='preparing'|'preloading'|'revealing'|'playing'|'return-preparing'|'return-loading'|'return-revealing';
const CINEMATIC_PREPARE_GRACE_MS=3000;

/** Camera beats share gameplay streaming/interiors. A cut cannot reveal its
 * destination until coverage and its named subject are available. */
export class CinematicDirector {
  private sceneData:StoryScene|null=null;
  private index=0;
  private elapsed=0;
  private waiting=0;
  private origin={zoom:1};
  private phase:Phase='preparing';
  private sequence=0;
  private disposed=false;
  private readonly cover:Phaser.GameObjects.Rectangle;
  private coverTween:Phaser.Tweens.Tween|null=null;
  constructor(private readonly scene:WorldScene){
    this.cover=scene.add.rectangle(0,0,1,1,0x000000).setOrigin(0).setScrollFactor(0)
      .setDepth(20_000_000).setName('cinematic-transition-cover').setVisible(false);
  }
  get active(){return this.sceneData!==null;}
  get playing(){return this.active&&this.phase==='playing';}
  start(id:string){
    const state=useGameStore.getState(),data=CINEMATICS[id];
    if(this.disposed||this.active||!data?.shots.length||state.dialogue||state.panel||state.storyFlags['scene:'+id])return false;
    this.sceneData={...data,shots:data.shots.map(shot=>{
      const lines=[shot.line,...(shot.variants?.map(v=>v.line)??[])];
      const readingTime=1500+Math.max(...lines.map(line=>line.split(/\s+/).length))*220;
      return {...shot,duration:Math.max(shot.duration,Math.min(9000,readingTime))};
    })};
    this.index=0;this.elapsed=0;
    this.origin={zoom:this.scene.cameras.main.zoom/renderDensity(this.scene)};
    this.scene.player.resetInput();this.scene.beginCinematicView();
    this.scene.physics.world.pause();this.scene.cameras.main.stopFollow();this.frame(true);return true;
  }
  update(delta:number,paused=false){
    if(!this.sceneData||this.disposed)return;
    if(useGameStore.getState().skipCinematicRequested){
      useGameStore.getState().hydrate({skipCinematicRequested:false});
      if(!this.phase.startsWith('return-')){this.finish();return;}
    }
    this.fitCover();
    if(this.phase==='preparing'){
      this.waiting+=Math.min(delta,250);
      if(this.waiting>=CINEMATIC_PREPARE_GRACE_MS)this.continueUnpreparedShot();
      return;
    }
    if(this.phase==='return-preparing')return;
    if(this.phase==='return-loading'){
      this.position(this.scene.player,this.origin.zoom*renderDensity(this.scene));
      this.waiting+=Math.min(delta,250);
      // A failed optional creature atlas must not trap the player in a black
      // return screen. Terrain/scenery coverage remains mandatory.
      const checkSubjects=this.waiting<15000;
      if(this.scene.streamCinematicView(true,undefined,checkSubjects)){
        if(!checkSubjects)this.scene.notify('Some creature artwork could not load. You can continue your journey.');
        const sequence=this.sequence;this.phase='return-revealing';
        this.reveal(sequence,()=>this.complete());
      }else if(this.waiting>=30000){
        this.scene.recoverCinematicLocation();
        this.scene.notify('The world could not finish streaming. Your journey has been restored; please move or reopen the scene.');
        const sequence=this.sequence;this.phase='return-revealing';
        this.reveal(sequence,()=>this.complete());
      }
      return;
    }
    if(this.phase==='return-revealing'){this.scene.streamCinematicView();return;}
    const shot=this.sceneData.shots[this.index];
    if(this.phase==='preloading'){
      this.position(this.scene.cinematicTarget(shot),shot.zoom*renderDensity(this.scene));
      if(this.scene.streamCinematicView(true,shot.focusNpcId)){
        this.waiting=0;this.phase='revealing';
        this.reveal(this.sequence,()=>{this.phase='playing';this.elapsed=0;});
      }else{
        this.waiting+=Math.min(delta,250);
        if(this.waiting>=CINEMATIC_PREPARE_GRACE_MS)this.continueUnpreparedShot();
      }
      return;
    }
    if(this.phase==='revealing'){this.scene.streamCinematicView(false,shot.focusNpcId);return;}
    const camera=this.scene.cameras.main,target=this.scene.cinematicTarget(shot);
    const blend=1-Math.exp(-Math.min(delta,100)/240);
    this.position({x:Phaser.Math.Linear(camera.midPoint.x,target.x,blend),y:Phaser.Math.Linear(camera.midPoint.y,target.y,blend)},
      Phaser.Math.Linear(camera.zoom,shot.zoom*renderDensity(this.scene),blend));
    // AFTER moving/zooming, every frame, including pans inside one chunk.
    this.scene.streamCinematicView(false,shot.focusNpcId);
    if(!paused)this.elapsed+=Math.min(delta,250);
    if(this.elapsed>=shot.duration){
      this.index++;this.elapsed=0;
      if(this.index>=this.sceneData.shots.length)this.finish();else this.frame();
    }
  }
  private frame(initial=false){
    const data=this.sceneData!,shot=data.shots[this.index],sequence=++this.sequence;
    const state=useGameStore.getState(),line=shot.variants?.find(v=>state.storyFlags[v.flag])?.line??shot.line;
    state.hydrate({cinematic:{id:data.id,title:data.title,line,ready:false,focusNpcId:shot.focusNpcId},skipCinematicRequested:false});
    const target=this.scene.cinematicTarget(shot),zoom=shot.zoom*renderDensity(this.scene);
    const sameLocation=this.scene.cinematicLocationId===(this.scene.cinematicLocation(shot)?.id??'world');
    if(!initial&&sameLocation&&Math.hypot(this.scene.cameras.main.midPoint.x-target.x,
      this.scene.cameras.main.midPoint.y-target.y)<=800&&this.scene.cinematicTransitionReady(target,zoom,shot.focusNpcId)){
      this.phase='playing';this.elapsed=0;
      const cinematic=useGameStore.getState().cinematic;
      if(cinematic)useGameStore.getState().hydrate({cinematic:{...cinematic,ready:true}});
      return;
    }
    this.phase='preparing';this.waiting=0;
    this.conceal(sequence,()=>{void this.prepare(shot,sequence);},initial);
  }
  private async prepare(shot:StoryShot,sequence:number){
    try{
      const ready=await this.scene.prepareCinematicShot(shot);
      if(!this.current(sequence))return;
      if(!ready)throw new Error('Interior or cinematic subject unavailable');
      this.position(this.scene.cinematicTarget(shot),shot.zoom*renderDensity(this.scene));
      this.phase='preloading';
    }catch(error){
      if(!this.current(sequence))return;
      console.error('Cinematic destination could not load:',error);
      this.continueUnpreparedShot();
    }
  }
  private continueUnpreparedShot(){
    const shot=this.sceneData?.shots[this.index];
    if(!shot||this.phase==='revealing'||this.phase==='playing')return;
    const sequence=++this.sequence;
    this.position(this.scene.cinematicTarget(shot),shot.zoom*renderDensity(this.scene));
    this.scene.streamCinematicView(true,shot.focusNpcId,false);
    this.phase='revealing';
    this.reveal(sequence,()=>{this.phase='playing';this.elapsed=0;});
  }
  private position(point:{x:number;y:number},zoom:number){
    const framed=this.scene.constrainCinematicCamera(point.x,point.y,zoom),camera=this.scene.cameras.main;
    camera.setZoom(framed.zoom).centerOn(framed.x,framed.y);
    // worldView/midPoint otherwise describe the previous render, not this pan.
    camera.preRender();this.fitCover();
  }
  private fitCover(){
    const camera=this.scene.cameras.main,z=camera.zoom;
    this.cover.setPosition(camera.width/2*(1-1/z)-2,camera.height/2*(1-1/z)-2)
      .setDisplaySize(camera.width/z+4,camera.height/z+4);
  }
  private current(sequence:number){return !this.disposed&&this.active&&sequence===this.sequence;}
  private conceal(sequence:number,ready:()=>void,immediate=false){
    this.coverTween?.stop();this.cover.setVisible(true);this.fitCover();
    if(immediate){this.cover.setAlpha(1);ready();return;}
    this.coverTween=this.scene.tweens.add({targets:this.cover,alpha:1,duration:140,
      onComplete:()=>{if(this.current(sequence))ready();}});
  }
  private reveal(sequence:number,ready:()=>void){
    this.coverTween?.stop();this.cover.setVisible(true).setAlpha(1);this.fitCover();
    this.coverTween=this.scene.tweens.add({targets:this.cover,alpha:0,duration:220,
      onComplete:()=>{if(this.current(sequence)){
        this.cover.setVisible(false);
        const cinematic=useGameStore.getState().cinematic;
        if(cinematic&&cinematic.id===this.sceneData?.id)useGameStore.getState().hydrate({cinematic:{...cinematic,ready:true}});
        ready();
      }}});
  }
  refreshZoom(){
    if(!this.sceneData)return;
    // A resize during concealment must not jump to an unprepared destination.
    this.fitCover();
    if(this.phase==='preparing'||this.phase==='return-preparing')return;
    const returning=this.phase.startsWith('return-');
    const shot=this.sceneData.shots[Math.min(this.index,this.sceneData.shots.length-1)];
    this.position(returning?this.scene.player:this.scene.cinematicTarget(shot),
      (returning?this.origin.zoom:shot.zoom)*renderDensity(this.scene));
    if(this.phase==='playing'){
      const focus=shot.focusNpcId;
      if(!this.scene.streamCinematicView(true,focus)){
        this.phase='preloading';this.waiting=0;
        this.cover.setVisible(true).setAlpha(1);
        const cinematic=useGameStore.getState().cinematic;
        if(cinematic)useGameStore.getState().hydrate({cinematic:{...cinematic,ready:false}});
      }
    }else if(this.phase==='revealing'||this.phase==='return-revealing')this.scene.streamCinematicView();
  }
  finish(){
    if(!this.sceneData||this.phase.startsWith('return-'))return;
    const sequence=++this.sequence;this.phase='return-preparing';
    const cinematic=useGameStore.getState().cinematic;
    useGameStore.getState().hydrate({skipCinematicRequested:false,
      ...(cinematic?{cinematic:{...cinematic,ready:false}}:{})});
    this.conceal(sequence,()=>{void this.prepareReturn(sequence);});
  }
  private async prepareReturn(sequence:number){
    try{await this.scene.restoreCinematicLocation();}
    catch(error){
      if(!this.current(sequence))return;
      console.error('Cinematic room restoration failed:',error);
      this.scene.recoverCinematicLocation();
    }
    if(!this.current(sequence))return;
    this.position(this.scene.player,this.origin.zoom*renderDensity(this.scene));
    this.waiting=0;this.phase='return-loading';
  }
  private complete(){
    if(!this.sceneData)return;
    const id=this.sceneData.id;this.sceneData=null;
    this.scene.cameras.main.startFollow(this.scene.player,false,.12,.12);
    const state=useGameStore.getState(),queue=state.cinematicQueue.filter(next=>next!==id&&!state.storyFlags['scene:'+next]);
    state.hydrate({cinematic:null,pendingCinematic:queue[0]??null,cinematicQueue:queue.slice(1),skipCinematicRequested:false,
      storyFlags:{...state.storyFlags,['scene:'+id]:true}});
    this.scene.resumeAfterCinematic();
  }
  destroy(){
    this.disposed=true;this.sequence++;this.coverTween?.stop();this.cover.destroy();this.sceneData=null;
    useGameStore.getState().hydrate({cinematic:null,pendingCinematic:null,skipCinematicRequested:false});
  }
}
