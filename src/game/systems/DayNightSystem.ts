import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import { seededRandom } from '../../utils/seededRandom';
import { ART_BY_KEY, type ArtTextureKey } from '../../data/art';
import { environmentLightPoints, nightStrength } from '../../data/environmentLights';
import {overlayViewport} from './renderSizing';
import {getEffectsQuality,EFFECTS_QUALITY_EVENT} from './effectsQuality';
import {getGraphicEffects} from './graphicsEffects';

interface LocalLight {
  actor:Phaser.GameObjects.Sprite; x:number; y:number; radius:number; fire:boolean; phase:number;
  glow:Phaser.GameObjects.Image;
}
export class DayNightSystem {
  private lightweight = getEffectsQuality() === 'low';
  private readonly onQualityChange = () => {
    const next = getEffectsQuality() === 'low';
    if (this.lightweight !== next) { this.lightweight = next; this.onResize(); }
  };
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
  // This low-cost mask is painted less often than the camera moves.
  // Keep its painted world origin and shift the buffered texture every frame,
  // so light pockets stay attached to lamps instead of vibrating on movement.
  private maskWorldOrigin: {x:number;y:number} | null = null;
  private readonly maskPaddingCss = 96;
  private firefliesEnabled=true;
  setFirefliesEnabled(enabled:boolean){this.firefliesEnabled=enabled;}
  constructor(private readonly scene:Phaser.Scene) {
    const state=useGameStore.getState();this.day=state.day;this.minuteOfDay=state.minuteOfDay;
    const viewport=overlayViewport(scene);
    const resolution=this.lightweight ? .65 : 1;
    const padding=Math.round(this.maskPaddingCss*resolution);
    this.texture=scene.textures.createCanvas('night-overlay',
      Math.max(1,Math.round(viewport.width*resolution))+padding*2,
      Math.max(1,Math.round(viewport.height*resolution))+padding*2)!;
    this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.overlay=scene.add.image(0,0,'night-overlay').setOrigin(0).setScrollFactor(0).setDepth(1_000_000).setName('night-darkness');
    if(!scene.textures.exists('warm-light')) {
      const t=scene.textures.createCanvas('warm-light',128,128)!,ctx=t.getContext();
      const gradient=ctx.createRadialGradient(64,64,0,64,64,64);
      gradient.addColorStop(0,'rgba(255,191,93,.8)');gradient.addColorStop(.35,'rgba(255,162,64,.25)');gradient.addColorStop(1,'rgba(255,150,55,0)');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);t.refresh();
    }
    scene.scale.on('resize',this.onResize,this);
    window.addEventListener(EFFECTS_QUALITY_EVENT,this.onQualityChange);
    const random=seededRandom('mernondna:fireflies');
    for(let i=0;i<18;i++) this.fireflies.push({
      glow:scene.add.circle(0,0,7,0x9bf5a7,.2).setName('firefly-glow').setDepth(1_000_003).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
      light:scene.add.circle(0,0,1.5,0xe8ffd0,.8).setName('firefly-light').setDepth(1_000_004).setBlendMode(Phaser.BlendModes.ADD).setVisible(false),
      dx:(random()-.5)*800,dy:(random()-.5)*700,phase:random()*Math.PI*2,
    });
  }
  register(actor:Phaser.GameObjects.Sprite,key:ArtTextureKey,frame:number,scale:number) {
    const points=environmentLightPoints(key,frame);
    const owned:LocalLight[]=[];
    for(const [index,p] of points.entries()) {
      const glow=this.scene.add.image(actor.x,actor.y,'warm-light').setDepth(1_000_001).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(p.radius*2*Math.sqrt(scale),p.radius*2*Math.sqrt(scale))
        .setTint(key==='elarion_tree'?0x52dfff:0xffffff).setAlpha(0).setName('environment-light:'+actor.name+':'+index);
      const node:LocalLight={actor,x:p.x*scale,y:p.y*scale+(1-actor.originY)*ART_BY_KEY[key].frameHeight*scale,
        radius:p.radius*Math.sqrt(scale),fire:p.fire,phase:index*.8+actor.x*.013+actor.y*.019,glow};
      this.lights.add(node);owned.push(node);
    }
    const ownedEmissions:Phaser.GameObjects.Sprite[]=[];
    if(this.scene.textures.exists(key+':emission')) {
      if(this.scene.textures.exists(key+':rune-glow')){
        const runeGlow=this.scene.add.sprite(actor.x,actor.y,key+':rune-glow',frame).setOrigin(actor.originX,actor.originY)
          .setScale(actor.scaleX,actor.scaleY).setRotation(actor.rotation).setDepth(actor.depth+.004)
          .setBlendMode(Phaser.BlendModes.ADD).setData('emissionOwner',actor).setData('emissionType','tree-rune-glow')
          .setName('tree-rune-glow:'+actor.name);
        this.emissions.add(runeGlow);ownedEmissions.push(runeGlow);
      }
      const emission=this.scene.add.sprite(actor.x,actor.y,key+':emission',frame).setOrigin(actor.originX,actor.originY)
        .setScale(actor.scaleX,actor.scaleY).setRotation(actor.rotation).setDepth(actor.depth+.006).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
        .setData('emissionOwner',actor).setName('window-emission:'+actor.name);
      if(this.scene.textures.exists(key+':rune-glow'))emission.setData('emissionType','tree-runes').setName('tree-rune-emission:'+actor.name);
      this.emissions.add(emission);ownedEmissions.push(emission);
    }
    actor.once('destroy',()=>{
      for(const node of owned){this.lights.delete(node);node.glow.destroy();}
      for(const emission of ownedEmissions){this.emissions.delete(emission);emission.destroy();}
      this.renderAccumulator=100;
    });
    this.renderAccumulator=100;
  }
  isIlluminated(x:number,y:number) {
    if(nightStrength(this.minuteOfDay)<.7)return true;
    for(const light of this.lights){
      if(Math.hypot(x-light.actor.x-light.x,y-light.actor.y-light.y)<light.radius*.8)return true;
    }
    return false;
  }
  update(deltaMs:number,playerX:number,playerY:number) {
    this.elapsed+=deltaMs;this.minuteOfDay+=deltaMs/1000*2.5;
    if(this.minuteOfDay>=1440){this.day+=Math.floor(this.minuteOfDay/1440);this.minuteOfDay%=1440;}
    this.accumulator+=deltaMs;
    if(this.accumulator>700){this.accumulator=0;this.syncState();}
    const night=nightStrength(this.minuteOfDay);
    const effects=getGraphicEffects();
    for(const node of this.lights) {
      const flicker=node.fire ? .92+Math.sin(this.elapsed*.013+node.phase)*.055+Math.sin(this.elapsed*.021+node.phase)*.025 : 1;
      const intensity=node.actor.texture.key==='elven_villas'?.28:.15;
      node.glow.setPosition(node.actor.x+node.x,node.actor.y+node.y).setAlpha(night*intensity*flicker).setVisible(effects.lightBloom&&night>0);
    }
    for(const emission of this.emissions){
      const owner=emission.getData('emissionOwner') as Phaser.GameObjects.Sprite;
      // Lit windows belong to the structure's draw order. Painting their
      // pixels above every actor makes a foreground character merge into it.
      const type=emission.getData('emissionType');
      if(type==='tree-runes'||type==='tree-rune-glow'){
        const pulse=(Math.sin(this.elapsed*.002+owner.x*.013+owner.y*.019)+1)/2;
        const runeGlow=type==='tree-rune-glow';
        emission.setDepth(runeGlow?1_000_002:1_000_003)
          .setPosition(owner.x,owner.y).setAlpha(runeGlow?.48+.42*pulse:.88+.12*pulse)
          .setVisible(effects.lightBloom&&owner.visible);
      }else emission.setDepth(owner.depth+.005).setAlpha(night*.8).setVisible(effects.lightBloom&&night>0&&owner.visible);
    }
    // Stable world-space pockets. Camera zoom never gets applied twice.
    const cx=Math.floor(playerX/1024)*1024+512,cy=Math.floor(playerY/1024)*1024+512;
    for(const fly of this.fireflies) {
      const drift=this.elapsed*.00035, pulse=(Math.sin(this.elapsed*.003+fly.phase)+1)/2;
      const x=cx+fly.dx+Math.sin(drift+fly.phase)*32,y=cy+fly.dy+Math.cos(drift*.8+fly.phase)*24;
      fly.glow.setPosition(x,y).setAlpha(night*(.03+pulse*.22)).setVisible(effects.fireflies&&this.firefliesEnabled&&!this.lightweight&&night>.02);
      fly.light.setPosition(x,y).setAlpha(night*(.12+pulse*.72)).setVisible(effects.fireflies&&this.firefliesEnabled&&(!this.lightweight||this.fireflies.indexOf(fly)<6)&&night>.02);
    }
    const camera=this.scene.cameras.main,full=overlayViewport(this.scene);
    const resolution=this.lightweight ? .65 : 1;
    const z=full.zoom*resolution,pad=Math.round(this.maskPaddingCss*resolution);
    const w=this.texture.width,h=this.texture.height;
    this.overlay.setVisible(effects.nightDarkness&&night>0);
    if(night===0||!effects.nightDarkness) {
      this.previousNight=0;
      this.maskWorldOrigin=null;
      return; // Avoid full-screen texture uploads in daylight.
    }
    const changedLight=Math.abs(night-this.previousNight)>(this.lightweight?.055:.018);
    this.previousNight=night;
    this.renderAccumulator+=Math.max(0,deltaMs);
    const movement=this.maskWorldOrigin
      ? Math.max(Math.abs(camera.worldView.x-this.maskWorldOrigin.x),Math.abs(camera.worldView.y-this.maskWorldOrigin.y))*z
      : Infinity;
    // Keep masks reasonably fresh; the buffered image tracks camera motion
    // in the interim, without an expensive canvas redraw on every frame.
    const interval=this.lightweight?220:70;
    if(this.renderAccumulator>=interval || (changedLight&&this.renderAccumulator>=90) || (movement>pad*.7&&this.renderAccumulator>=140)) {
      this.renderAccumulator=0;
      this.maskWorldOrigin={x:camera.worldView.x,y:camera.worldView.y};
      const ctx=this.texture.getContext();
      ctx.globalCompositeOperation='copy';
      ctx.fillStyle='rgba(2,6,17,'+night*.84+')';
      ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation='destination-out';
      let visibleLightCount=0;
      for(const node of this.lights) {
        const x=(node.actor.x+node.x-camera.worldView.x)*z+pad;
        const y=(node.actor.y+node.y-camera.worldView.y)*z+pad;
        const r=node.radius*z;
        if(x+r<0||y+r<0||x-r>w||y-r>h) continue;
        if(this.lightweight&&visibleLightCount>=18)continue;
        visibleLightCount++;
        const flicker=node.fire ? .92+Math.sin(this.elapsed*.013+node.phase)*.06 : 1;
        const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
        gradient.addColorStop(0,'rgba(0,0,0,'+.88*flicker+')');
        gradient.addColorStop(.3,'rgba(0,0,0,.65)');
        gradient.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
      }
      ctx.globalCompositeOperation='source-over';
      this.texture.refresh();
    }
    this.alignMaskToCamera(camera,full,resolution,pad);
  }
  getHour(){return this.minuteOfDay/60;}
  syncState(){useGameStore.getState().setClock(this.day,this.minuteOfDay);}
  destroy(){
    window.removeEventListener(EFFECTS_QUALITY_EVENT,this.onQualityChange);
    this.scene.scale.off('resize',this.onResize,this);this.overlay.destroy();
    for(const node of this.lights) node.glow.destroy();this.lights.clear();
    for(const emission of this.emissions) emission.destroy();this.emissions.clear();
    for(const fly of this.fireflies){fly.glow.destroy();fly.light.destroy();}
    this.scene.textures.remove('night-overlay');
  }
  private alignMaskToCamera(camera:Phaser.Cameras.Scene2D.Camera,
    full:ReturnType<typeof overlayViewport>,resolution:number,pad:number) {
    const z=full.zoom*resolution;
    const innerWidth=Math.max(1,Math.round(full.width*resolution));
    const innerHeight=Math.max(1,Math.round(full.height*resolution));
    const scale=this.scene.scale;
    this.overlay.setDisplaySize(
      scale.width/camera.zoom*(this.texture.width/innerWidth),
      scale.height/camera.zoom*(this.texture.height/innerHeight));
    const origin=this.maskWorldOrigin??camera.worldView;
    this.overlay.setPosition(
      scale.width/2*(1-1/camera.zoom)-pad/z+origin.x-camera.worldView.x,
      scale.height/2*(1-1/camera.zoom)-pad/z+origin.y-camera.worldView.y);
  }
  private onResize(){
    const viewport=overlayViewport(this.scene);
    const resolution=this.lightweight ? .65 : 1;
    const pad=Math.round(this.maskPaddingCss*resolution);
    this.texture.setSize(
      Math.max(1,Math.round(viewport.width*resolution))+pad*2,
      Math.max(1,Math.round(viewport.height*resolution))+pad*2);
    this.maskWorldOrigin=null;
    this.renderAccumulator=200;
  }
}

// LEIGHNERON_MOBILE_GRAPHICS_NPC_FIX_V1
