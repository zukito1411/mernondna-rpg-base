import Phaser from 'phaser';
import { CINEMATICS, type StoryScene } from '../../data/cinematics';
import { useGameStore } from '../../store/gameStore';
import type { WorldScene } from '../scenes/WorldScene';

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
    this.sceneData=data;this.index=0;this.elapsed=0;
    this.origin={x:this.scene.player.x,y:this.scene.player.y,zoom:this.scene.cameras.main.zoom};
    this.scene.player.resetInput();this.scene.physics.world.pause();this.scene.cameras.main.stopFollow();this.frame();return true;
  }
  update(delta:number){
    if(!this.sceneData)return;
    if(useGameStore.getState().skipCinematicRequested){this.finish();return;}
    this.elapsed+=Math.min(delta,250);
    const shot=this.sceneData.shots[this.index],camera=this.scene.cameras.main;
    camera.centerOn(Phaser.Math.Linear(camera.midPoint.x,shot.x,.06),Phaser.Math.Linear(camera.midPoint.y,shot.y,.06));
    if(this.elapsed>=shot.duration){this.index++;this.elapsed=0;if(this.index>=this.sceneData.shots.length)this.finish();else this.frame();}
  }
  private frame(){
    const data=this.sceneData!,shot=data.shots[this.index];
    // Stream the framed location without moving/healing the logical player.
    this.scene.streamCinematicView(shot.x,shot.y);
    this.scene.cameras.main.setZoom(shot.zoom).centerOn(shot.x,shot.y);
    useGameStore.getState().hydrate({cinematic:{id:data.id,title:data.title,line:shot.line},skipCinematicRequested:false});
  }
  finish(){
    if(!this.sceneData)return;
    const id=this.sceneData.id;this.sceneData=null;
    this.scene.streamCinematicView(this.origin.x,this.origin.y);
    this.scene.cameras.main.setZoom(this.origin.zoom).centerOn(this.origin.x,this.origin.y).startFollow(this.scene.player,false,.12,.12);
    this.scene.player.resetInput();useGameStore.getState().hydrate({cinematic:null,pendingCinematic:null,skipCinematicRequested:false});
    useGameStore.getState().setStoryFlag('scene:'+id);
  }
  destroy(){this.sceneData=null;useGameStore.getState().hydrate({cinematic:null,pendingCinematic:null,skipCinematicRequested:false});}
}
