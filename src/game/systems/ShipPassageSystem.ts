import {PORT_BY_ID,type Port} from '../../data/ports';
import {SeaPassagePlanner,passageDuration,passagePoint} from './seaPassage';
import {useGameStore} from '../../store/gameStore';
import type {WorldScene} from '../scenes/WorldScene';
import type {WorldGenerator} from './WorldGenerator';
import type {WorldTrafficSystem,Vehicle} from './WorldTrafficSystem';
import type {Vec2} from '../types';
export class ShipPassageSystem {
 private readonly planner:SeaPassagePlanner;
 private voyage:{from:Port;to:Port;points:Vec2[];elapsed:number;duration:number;vessel:Vehicle}|null=null;
 private hudMs=0;
 constructor(private readonly scene:WorldScene,world:WorldGenerator,private readonly fleet:WorldTrafficSystem){this.planner=new SeaPassagePlanner(world);}
 get active(){return this.voyage!==null;}
 get safePosition(){return this.voyage?.from.landing;}
 begin(fromId:string,toId:string){
  const from=PORT_BY_ID[fromId],to=PORT_BY_ID[toId];if(this.active||!from||!to||Math.hypot(this.scene.player.x-from.landing.x,this.scene.player.y-from.landing.y)>140)return false;
  const points=this.planner.route(fromId,toId);if(points.length<2){this.scene.notify('This crew cannot find a safe passage today.');return false;}
  const vessel=this.fleet.createVessel('passage-vessel',from.boat.x,from.boat.y,from.river?.8:1.25);
  this.fleet.showPassenger(vessel);this.voyage={from,to,points,elapsed:0,duration:passageDuration(points),vessel};
  const first=passagePoint(points,0);
  this.fleet.positionVessel(vessel,first.x,first.y,first.dx,first.dy,false);
  this.scene.streamCinematicView(first.x,first.y);
  this.scene.cameras.main.centerOn(first.x,first.y-90);
  this.scene.player.resetInput();this.scene.player.setVisible(false);this.scene.physics.world.pause();this.scene.cameras.main.stopFollow();
  useGameStore.getState().hydrate({passage:{from:fromId,to:toId,progress:0},panel:null,harborPortId:null,passageRequest:null});return true;
 }
 update(delta:number){
  const v=this.voyage;if(!v||delta<=0)return;v.elapsed+=Math.min(delta,100);const progress=Math.min(1,v.elapsed/v.duration),p=passagePoint(v.points,progress);
  v.vessel.scale=v.from.river&&Math.hypot(p.x-v.from.boat.x,p.y-v.from.boat.y)<60000||v.to.river&&Math.hypot(p.x-v.to.boat.x,p.y-v.to.boat.y)<60000?.8:1.25;
  this.fleet.positionVessel(v.vessel,p.x,p.y,p.dx,p.dy,delta>0);
  this.scene.streamCinematicView(p.x,p.y);this.scene.cameras.main.centerOn(p.x,p.y-90);
  this.hudMs+=delta;if(this.hudMs>200){this.hudMs=0;useGameStore.getState().hydrate({passage:{from:v.from.id,to:v.to.id,progress}});}
  if(progress>=1){
   this.fleet.releaseVessel(v.vessel);this.voyage=null;this.scene.landFromPassage(v.to.landing);
   const store=useGameStore.getState();store.hydrate({passage:null});store.setStoryFlag('landed:'+v.to.id);
   this.scene.notify('Arrived at '+v.to.name+'. '+v.to.description);
  }
 }
 destroy(){if(this.voyage)this.fleet.releaseVessel(this.voyage.vessel);this.voyage=null;useGameStore.getState().hydrate({passage:null});}
}
