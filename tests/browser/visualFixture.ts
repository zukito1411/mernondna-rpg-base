import Phaser from 'phaser';
import {M14_ART,m14Animations} from '../../src/data/m14Art';
import {m14Sources,prepareM14Art} from '../../src/game/systems/M14Art';
import {MOTION_ART,VEHICLE_ART,prepareVehicleArt} from '../../src/game/systems/VehicleArt';
import {WorldTrafficSystem} from '../../src/game/systems/WorldTrafficSystem';

/** Real renderer, atlas preparation and entity classes; only relevant assets
 * are loaded so an art review doesn't wait for the complete world bundle. */
export function openSpriteReview():Promise<void>{
  return new Promise((resolve,reject)=>{
    const spec=M14_ART.find(a=>a.id==='grove-spider')!;
    const parent=document.createElement('div');parent.style.cssText='position:fixed;inset:0;z-index:99999;background:#293a32';document.body.append(parent);
    class ReviewScene extends Phaser.Scene{
      preload(){
        for(const source of m14Sources(spec))this.load.image(source.key,source.path);
        this.load.image('vehicle-source:boat',VEHICLE_ART.boat.path);
        for(const [key,path] of Object.entries(MOTION_ART))this.load.image('motion-source:'+key,path);
        this.load.on('loaderror',(file:any)=>reject(new Error('Could not load '+file.src)));
      }
      create(){
        try{
          prepareM14Art(this,spec);prepareVehicleArt(this);
          for(const a of m14Animations(spec))this.anims.create({key:a.key,frames:a.frames.map(frame=>({key:a.texture,frame})),frameRate:a.frameRate,repeat:a.repeat});
          const scene=this as any;
          scene.player={x:50000,y:50000};scene.getRegionAtPosition=()=> 'narenthil';
          scene.traffic=Object.create(WorldTrafficSystem.prototype);scene.traffic.scene=this;scene.traffic.shadows={register(){}};
          (window as any).__spriteReview=scene;resolve();
        }catch(error){reject(error);}
      }
    }
    new Phaser.Game({type:Phaser.WEBGL,parent,width:1440,height:900,backgroundColor:'#293a32',
      pixelArt:false,antialias:true,physics:{default:'arcade',arcade:{gravity:{x:0,y:0}}},scene:[ReviewScene]});
  });
}
