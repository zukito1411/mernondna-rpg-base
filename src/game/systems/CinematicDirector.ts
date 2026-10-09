import Phaser from 'phaser';
import { CINEMATICS, type StoryScene } from '../../data/cinematics';
import { useGameStore } from '../../store/gameStore';
import type { WorldScene } from '../scenes/WorldScene';
import {renderDensity} from './renderSizing';

/** Finite camera beats. No quest rewards depend on watching rather than skipping. */
export class CinematicDirector {
  private sceneData:StoryScene|null=null;
  private index=0;
  private elapsed=0;
  private origin={x:0,y:0,zoom:1};
  constructor(private readonly scene:WorldScene){}
  get active(){return this.sceneData!==null;}
  start(id:string){
    const state=useGameStore.getState(),data=CINEMATICS[id];
    if(this.active||!data||state.dialogue||state.panel||state.storyFlags['scene:'+id])return false;
    this.sceneData={...data,shots:data.shots.map(shot=>{
      const lines=[shot.line,...(shot.variants?.map(v=>v.line)??[])];
      const readingTime=1500+Math.max(...lines.map(line=>line.split(/\s+/).length))*220;
      return {...shot,duration:Math.max(shot.duration,Math.min(9000,readingTime))};
    })};this.index=0;this.elapsed=0;
    this.origin={x:this.scene.player.x,y:this.scene.player.y,zoom:this.scene.cameras.main.zoom/renderDensity(this.scene)};
    this.scene.player.resetInput();this.scene.prepareStoryActors();this.scene.physics.world.pause();this.scene.cameras.main.stopFollow();this.frame();return true;
  }
  update(delta:number){
    if(!this.sceneData)return;
    if(useGameStore.getState().skipCinematicRequested){this.finish();return;}
    this.elapsed+=Math.min(delta,250);
    const shot=this.sceneData.shots[this.index],camera=this.scene.cameras.main;
    const target=this.target(shot),blend=1-Math.exp(-Math.min(delta,100)/240);
    camera.centerOn(Phaser.Math.Linear(camera.midPoint.x,target.x,blend),Phaser.Math.Linear(camera.midPoint.y,target.y,blend));
    camera.setZoom(Phaser.Math.Linear(camera.zoom,shot.zoom*renderDensity(this.scene),blend));
    if(this.elapsed>=shot.duration){this.index++;this.elapsed=0;if(this.index>=this.sceneData.shots.length)this.finish();else this.frame();}
  }
  private frame(){
    const data=this.sceneData!,shot=data.shots[this.index];
    // Stream the framed location without moving/healing the logical player.
    const target=this.target(shot);this.scene.streamCinematicView(target.x,target.y);
    const camera=this.scene.cameras.main;
    if(Math.hypot(camera.midPoint.x-target.x,camera.midPoint.y-target.y)>800){camera.centerOn(target.x,target.y);camera.fadeIn(220);}
    const state=useGameStore.getState(),line=shot.variants?.find(v=>state.storyFlags[v.flag])?.line??shot.line;
    useGameStore.getState().hydrate({cinematic:{id:data.id,title:data.title,line},skipCinematicRequested:false});
  }
  private target(shot:StoryScene['shots'][number]){return shot.focusNpcId?this.scene.storyActorPosition(shot.focusNpcId)??shot:shot;}
  refreshZoom(){
    if(this.sceneData)this.scene.cameras.main.setZoom(this.sceneData.shots[this.index].zoom*renderDensity(this.scene));
  }
  finish(){
    if(!this.sceneData)return;
    const id=this.sceneData.id;this.sceneData=null;
    this.scene.streamCinematicView(this.origin.x,this.origin.y);
    this.scene.cameras.main.setZoom(this.origin.zoom*renderDensity(this.scene)).centerOn(this.origin.x,this.origin.y).startFollow(this.scene.player,false,.12,.12);
    this.scene.player.resetInput();const state=useGameStore.getState(),queue=state.cinematicQueue.filter(next=>next!==id&&!state.storyFlags['scene:'+next]);
    state.hydrate({cinematic:null,pendingCinematic:queue[0]??null,cinematicQueue:queue.slice(1),skipCinematicRequested:false,storyFlags:{...state.storyFlags,['scene:'+id]:true}});
  }
  destroy(){this.sceneData=null;useGameStore.getState().hydrate({cinematic:null,pendingCinematic:null,skipCinematicRequested:false});}
}
