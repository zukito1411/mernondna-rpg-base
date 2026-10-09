import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import { seededRandom } from '../../utils/seededRandom';
import { ART_BY_KEY, type ArtTextureKey } from '../../data/art';
import { environmentLightPoints, nightStrength } from '../../data/environmentLights';
import {overlayViewport,fitViewportOverlay} from './renderSizing';

interface LocalLight {
  actor:Phaser.GameObjects.Sprite; x:number; y:number; radius:number; fire:boolean; phase:number;
  glow:Phaser.GameObjects.Image;
}
export class DayNightSystem {
  private day:number;
  private minuteOfDay:number;
  private readonly overlay:Phaser.GameObjects.Image;
  private readonly texture:Phaser.Textures.CanvasTexture;
  private readonly lights=new Set<LocalLight>();
  private readonly emissions=new Set<Phaser.GameObjects.Sprite>();
  private readonly fireflies:Array<{glow:Phaser.GameObjects.Arc; light:Phaser.GameObjects.Arc;dx:number;dy:number;phase:number}>=[];
  private elapsed=0;
  private accumulator=0;
  private renderAccumulator=100;
  private previousNight=0;
  private firefliesEnabled=true;
  setFirefliesEnabled(enabled:boolean){this.firefliesEnabled=enabled;}
  constructor(private readonly scene:Phaser.Scene) {
    const state=useGameStore.getState();this.day=state.day;this.minuteOfDay=state.minuteOfDay;
    const viewport=overlayViewport(scene);
    this.texture=scene.textures.createCanvas('night-overlay',viewport.width,viewport.height)!;
    this.overlay=scene.add.image(0,0,'night-overlay').setOrigin(0).setScrollFactor(0).setDepth(1_000_000).setName('night-darkness');
    if(!scene.textures.exists('warm-light')) {
      const t=scene.textures.createCanvas('warm-light',128,128)!,ctx=t.getContext();
      const gradient=ctx.createRadialGradient(64,64,0,64,64,64);
      gradient.addColorStop(0,'rgba(255,191,93,.8)');gradient.addColorStop(.35,'rgba(255,162,64,.25)');gradient.addColorStop(1,'rgba(255,150,55,0)');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);t.refresh();
    }
    scene.scale.on('resize',this.onResize,this);
    const random=seededRandom('mernondna:fireflies');
    for(let i=0;i<18;i++) this.fireflies.push({
      glow:scene.add.circle(0,0,7,0x9bf5a7,.2).setName('firefly-glow').setDepth(1_000_003).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
      light:scene.add.circle(0,0,1.5,0xe8ffd0,.8).setName('firefly-light').setDepth(1_000_004).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
      dx:(random()-.5)*800,dy:(random()-.5)*700,phase:random()*Math.PI*2,
    });
  }
  register(actor:Phaser.GameObjects.Sprite,key:ArtTextureKey,frame:number,scale:number) {
    const points=environmentLightPoints(key,frame);
    if(!points.length) return;
    const owned:LocalLight[]=[];
    for(const [index,p] of points.entries()) {
      const glow=this.scene.add.image(actor.x,actor.y,'warm-light').setDepth(1_000_001).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(p.radius*2*Math.sqrt(scale),p.radius*2*Math.sqrt(scale)).setAlpha(0).setName('environment-light:'+actor.name+':'+index);
      const node:LocalLight={actor,x:p.x*scale,y:p.y*scale+(1-actor.originY)*ART_BY_KEY[key].frameHeight*scale,
        radius:p.radius*Math.sqrt(scale),fire:p.fire,phase:index*.8+actor.x*.013+actor.y*.019,glow};
      this.lights.add(node);owned.push(node);
    }
    let emission:Phaser.GameObjects.Sprite|undefined;
    if(this.scene.textures.exists(key+':emission')) {
      emission=this.scene.add.sprite(actor.x,actor.y,key+':emission',frame).setOrigin(actor.originX,actor.originY)
        .setScale(actor.scaleX,actor.scaleY).setRotation(actor.rotation).setDepth(actor.depth+.005).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
        .setData('emissionOwner',actor).setName('window-emission:'+actor.name);
      this.emissions.add(emission);
    }
    actor.once('destroy',()=>{
      for(const node of owned){this.lights.delete(node);node.glow.destroy();}
      if(emission){this.emissions.delete(emission);emission.destroy();}
      this.renderAccumulator=100;
    });
    this.renderAccumulator=100;
  }
  isIlluminated(x:number,y:number) {
    if(nightStrength(this.minuteOfDay)<.7)return true;
    return [...this.lights].some(light=>Math.hypot(x-light.actor.x-light.x,y-light.actor.y-light.y)<light.radius*.8);
  }
  update(deltaMs:number,playerX:number,playerY:number) {
    this.elapsed+=deltaMs;this.minuteOfDay+=deltaMs/1000*2.5;
    if(this.minuteOfDay>=1440){this.day+=Math.floor(this.minuteOfDay/1440);this.minuteOfDay%=1440;}
    this.accumulator+=deltaMs;
    if(this.accumulator>700){this.accumulator=0;this.syncState();}
    const night=nightStrength(this.minuteOfDay);
    for(const node of this.lights) {
      const flicker=node.fire ? .92+Math.sin(this.elapsed*.013+node.phase)*.055+Math.sin(this.elapsed*.021+node.phase)*.025 : 1;
      node.glow.setPosition(node.actor.x+node.x,node.actor.y+node.y).setAlpha(night*.15*flicker).setVisible(night>0);
    }
    for(const emission of this.emissions){
      const owner=emission.getData('emissionOwner') as Phaser.GameObjects.Sprite;
      // Lit windows belong to the structure's draw order. Painting their
      // pixels above every actor makes a foreground character merge into it.
      emission.setDepth(owner.depth+.005).setAlpha(night*.8).setVisible(night>0&&owner.visible);
    }
    // Stable world-space pockets. Camera zoom never gets applied twice.
    const cx=Math.floor(playerX/1024)*1024+512,cy=Math.floor(playerY/1024)*1024+512;
    for(const fly of this.fireflies) {
      const drift=this.elapsed*.00035, pulse=(Math.sin(this.elapsed*.003+fly.phase)+1)/2;
      const x=cx+fly.dx+Math.sin(drift+fly.phase)*32,y=cy+fly.dy+Math.cos(drift*.8+fly.phase)*24;
      fly.glow.setPosition(x,y).setAlpha(night*(.03+pulse*.22)).setVisible(this.firefliesEnabled&&night>.02);
      fly.light.setPosition(x,y).setAlpha(night*(.12+pulse*.72)).setVisible(this.firefliesEnabled&&night>.02);
    }
    const camera=this.scene.cameras.main,{zoom:z,width:w,height:h}=overlayViewport(this.scene);
    fitViewportOverlay(this.scene,this.overlay);this.overlay.setVisible(night>0);
    if(night===0) {
      if(this.previousNight>0){this.texture.getContext().clearRect(0,0,w,h);this.texture.refresh();}
      this.previousNight=0;return; // No full-screen texture uploads in daylight.
    }
    this.previousNight=night;
    this.renderAccumulator+=deltaMs;
    if(this.renderAccumulator<75) return;
    this.renderAccumulator=0;
    const ctx=this.texture.getContext();
    ctx.globalCompositeOperation='copy';ctx.fillStyle='rgba(2,6,17,'+night*.84+')';ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='destination-out';
    for(const node of this.lights) {
      const x=(node.actor.x+node.x-camera.worldView.x)*z,y=(node.actor.y+node.y-camera.worldView.y)*z,r=node.radius*z;
      if(x+r<0||y+r<0||x-r>w||y-r>h) continue;
      const flicker=node.fire ? .92+Math.sin(this.elapsed*.013+node.phase)*.06 : 1;
      const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
      gradient.addColorStop(0,'rgba(0,0,0,'+.88*flicker+')');gradient.addColorStop(.3,'rgba(0,0,0,.65)');gradient.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    ctx.globalCompositeOperation='source-over';this.texture.refresh();
  }
  getHour(){return this.minuteOfDay/60;}
  syncState(){useGameStore.getState().setClock(this.day,this.minuteOfDay);}
  destroy(){
    this.scene.scale.off('resize',this.onResize,this);this.overlay.destroy();
    for(const node of this.lights) node.glow.destroy();this.lights.clear();
    for(const emission of this.emissions) emission.destroy();this.emissions.clear();
    for(const fly of this.fireflies){fly.glow.destroy();fly.light.destroy();}
    this.scene.textures.remove('night-overlay');
  }
  private onResize(){const viewport=overlayViewport(this.scene);
    this.texture.setSize(viewport.width,viewport.height);this.renderAccumulator=100;}
}
