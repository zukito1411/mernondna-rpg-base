import Phaser from 'phaser';
import {chunkNeighborhood} from './chunkNeighborhood';
import {cartRoutes,seaRoute,routePosition,type TrafficRoute} from './travelRoutes';
import {trafficDirection,trafficDistance,horseWalkFrame,wheelTurnFrame} from './trafficMotion';
import {BOAT_SCALE,boatHelm,CART_ART_POSES} from './VehicleArt';
import {ART_BY_KEY,actorScaleForHeight,type ArtTextureKey} from '../../data/art';
import type {WorldGenerator} from './WorldGenerator';
import type {GroundShadowSystem} from './GroundShadowSystem';
import {PORTS} from '../../data/ports';
import {useGameStore} from '../../store/gameStore';

export interface Vehicle {
  route:TrafficRoute;sprite:Phaser.GameObjects.Sprite;
  horse?:Phaser.GameObjects.Sprite;wheels?:Phaser.GameObjects.Sprite[];
  helmsman?:Phaser.GameObjects.Sprite;rail?:Phaser.GameObjects.Sprite;wake?:Phaser.GameObjects.Sprite[];
  scale?:number;passenger?:Phaser.GameObjects.Sprite;
}
/** Real artwork layers follow traveled distance. All attached actors unload together. */
export class WorldTrafficSystem {
  private readonly roads:TrafficRoute[];
  private readonly sea=new Map<string,TrafficRoute|null>();
  private readonly active=new Map<string,Vehicle>();
  private elapsed=0;
  private readonly reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  constructor(private readonly scene:Phaser.Scene,private readonly world:WorldGenerator,private readonly shadows:GroundShadowSystem){this.roads=cartRoutes(world);}
  update(delta:number){
    this.elapsed+=Math.min(delta,100);
    const view=this.scene.cameras.main.worldView,nearby=chunkNeighborhood(view.centerX,view.centerY);
    for(const [key] of this.sea)if(!nearby.has(key))this.sea.delete(key);
    for(const key of nearby)if(!this.sea.has(key)){const [x,y]=key.split(':').map(Number);this.sea.set(key,seaRoute(this.world,x,y));}
    const routes=[...this.roads,...[...this.sea.values()].filter((r):r is TrafficRoute=>Boolean(r))],wanted=new Set<string>();
    for(const port of PORTS){
      if(useGameStore.getState().passage?.from===port.id)continue;
      if(Math.abs(port.boat.x-view.centerX)>view.width/2+400||Math.abs(port.boat.y-view.centerY)>view.height/2+500)continue;
      const id='docked:'+port.id;wanted.add(id);let boat=this.active.get(id);
      if(!boat){boat=this.createVessel(id,port.boat.x,port.boat.y,port.river?.8:BOAT_SCALE);this.active.set(id,boat);}
      this.presentBoat(boat,port.boat.x,port.boat.y,0,-1,3,false);
    }
    for(const route of routes){
      const point=routePosition(route,this.elapsed);
      if(point.x<view.x-320||point.x>view.right+320||point.y<view.y-240||point.y>view.bottom+420)continue;
      wanted.add(route.id);
      let vehicle=this.active.get(route.id);
      if(!vehicle){vehicle=this.create(route,point.x,point.y);this.active.set(route.id,vehicle);}
      const direction=trafficDirection(point.dx,point.dy),distance=trafficDistance(route,this.elapsed);
      if(route.kind==='cart')this.presentCart(vehicle,point.x,point.y,direction,distance,point.moving);
      else this.presentBoat(vehicle,point.x,point.y,point.dx,point.dy,direction,point.moving);
    }
    for(const [id,vehicle] of this.active)if(!wanted.has(id)){this.release(vehicle);this.active.delete(id);}
  }
  private create(route:TrafficRoute,x:number,y:number):Vehicle{
    const sprite=this.scene.add.sprite(x,y,'traffic-'+route.kind,0).setName(route.id),vehicle:Vehicle={route,sprite};
    if(route.kind==='cart'){
      sprite.setScale(.5);this.shadows.register(sprite);
      vehicle.horse=this.scene.add.sprite(x,y,'horse-east',0).setScale(.5).setOrigin(.5,252/256).setName('horse:'+route.id);
      this.shadows.register(vehicle.horse);
      vehicle.wheels=[0,1].map(i=>this.scene.add.sprite(x,y,'cart-wheel-turns',0).setName('wheel:'+route.id+':'+i));
    }else{
      sprite.setScale(BOAT_SCALE).setOrigin(.5,364/384);
      vehicle.helmsman=this.scene.add.sprite(x,y,'npc_adventurer_idle',0).setName('helmsman:'+route.id);
      vehicle.rail=this.scene.add.sprite(x,y,'traffic-boat-rail',0).setScale(BOAT_SCALE).setOrigin(.5,364/384).setName('boat-rail:'+route.id);
      vehicle.wake=[0,1].map(i=>this.scene.add.sprite(x,y,'water-foam',0).setDepth(-970).setAlpha(.28-i*.08).setName('wake:'+route.id+':'+i));
    }
    return vehicle;
  }
  createVessel(id:string,x:number,y:number,scale=BOAT_SCALE){
    const vehicle=this.create({id,kind:'boat',points:[{x,y},{x,y:y+1}],length:1,speed:1,phase:0},x,y);
    vehicle.scale=scale;return vehicle;
  }
  showPassenger(vehicle:Vehicle){vehicle.passenger=this.scene.add.sprite(0,0,'leigneron_idle',0).setName('passenger:'+vehicle.route.id);}
  positionVessel(vehicle:Vehicle,x:number,y:number,dx:number,dy:number,moving=true){this.presentBoat(vehicle,x,y,dx,dy,trafficDirection(dx,dy),moving);}
  releaseVessel(vehicle:Vehicle){this.release(vehicle);}
  private presentCart(vehicle:Vehicle,x:number,y:number,direction:number,distance:number,moving:boolean){
    const pose=CART_ART_POSES[direction],horse=vehicle.horse!,side=direction===1||direction===2;
    vehicle.sprite.setFrame(direction).setOrigin(pose.originX,pose.originY).setPosition(x,y).setDepth(y);
    const horseTexture=side?'horse-east':direction===0?'horse-south':'horse-north';
    horse.setTexture(horseTexture,moving?horseWalkFrame(distance):0).setFlipX(direction===1)
      .setPosition(x+pose.horse.x,y+pose.horse.y).setDepth(direction===3?y-.02:y+.02);
    vehicle.wheels!.forEach((wheel,i)=>{
      const axle=pose.wheels[i];
      wheel.setFrame(wheelTurnFrame(distance,direction)).setScale(side?.5:.14,.5)
        .setPosition(x+axle.x,y+axle.y).setDepth(y+.01);
    });
  }
  private presentBoat(vehicle:Vehicle,x:number,y:number,dx:number,dy:number,direction:number,moving:boolean){
    const bob=this.reducedMotion.matches?0:Math.sin(this.elapsed*.0025+vehicle.route.phase)*1.6,helm=boatHelm(direction);
    const scale=vehicle.scale??BOAT_SCALE,ratio=scale/BOAT_SCALE;
    vehicle.sprite.setScale(scale).setFrame(direction).setPosition(x,y+bob).setDepth(y);
    const crew=vehicle.helmsman!,texture:ArtTextureKey=direction===0?'npc_adventurer_idle':'npc_adventurer';
    const frame=direction===0?Math.floor(this.elapsed/400)%6:direction===1?6:direction===2?12:18;
    crew.setTexture(texture,frame).setScale(actorScaleForHeight(texture,frame,80))
      .setOrigin(.5,1-2/ART_BY_KEY[texture].frameHeight).setPosition(x+helm.x*ratio,y+bob+helm.y*ratio).setDepth(y+.02);
    vehicle.passenger?.setScale(actorScaleForHeight('leigneron_idle',0,80)).setOrigin(.5,1-2/ART_BY_KEY.leigneron_idle.frameHeight)
      .setPosition(x+helm.x*ratio+(direction===1?45:direction===2?-45:35),y+bob+helm.y*ratio+12).setDepth(y+.021);
    vehicle.rail!.setScale(scale).setFrame(direction).setPosition(x,y+bob).setDepth(y+.03);
    const length=Math.hypot(dx,dy),vx=dx/length,vy=dy/length;
    vehicle.wake!.forEach((wake,i)=>{
      const trail=130+i*60;
      wake.setVisible(moving).setFrame((Math.floor(this.elapsed/180)+i)%4).setScale(.65+i*.12)
        .setRotation(Math.atan2(dy,dx)+Math.PI/2).setPosition(x-vx*trail,y-vy*trail-12);
    });
  }
  private release(vehicle:Vehicle){
    vehicle.sprite.destroy();vehicle.horse?.destroy();vehicle.helmsman?.destroy();vehicle.rail?.destroy();
    vehicle.wheels?.forEach(wheel=>wheel.destroy());vehicle.wake?.forEach(wake=>wake.destroy());
    vehicle.passenger?.destroy();
  }
  destroy(){for(const vehicle of this.active.values())this.release(vehicle);this.active.clear();this.sea.clear();}
}
