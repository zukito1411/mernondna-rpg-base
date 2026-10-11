import Phaser from 'phaser';

/** Rumble is an additional camera transform; combat shakes keep their own
 * duration and intensity and cannot be cancelled by pausing the rumble. */
export class VolcanicCameraShake extends Phaser.Cameras.Scene2D.Effects.Shake {
 private readonly rumble:Phaser.Cameras.Scene2D.Effects.Shake;
 private lastMediaTime=0;
 constructor(camera:Phaser.Cameras.Scene2D.Camera){super(camera);this.rumble=new Phaser.Cameras.Scene2D.Effects.Shake(camera);}
 setRumble(seconds:number,intensity:number){
  if(intensity<=0){this.stopRumble();return;}
  let delta=Math.max(0,(seconds-this.lastMediaTime)*1000);
  if(!this.rumble.isRunning||seconds<this.lastMediaTime){
   this.rumble.start(Math.max(1,(12-seconds)*1000),intensity);delta=0;
  }
  this.rumble.intensity.set(intensity);
  this.rumble.update(seconds*1000,delta);this.lastMediaTime=seconds;
 }
 stopRumble(){this.rumble.reset();}
 override preRender(){super.preRender();this.rumble.preRender();}
 override reset(){super.reset();this.stopRumble();}
 override destroy(){this.rumble.destroy();super.destroy();}
}
