import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import { seededRandom } from '../../utils/seededRandom';
import { ART_BY_KEY, type ArtTextureKey } from '../../data/art';
import { environmentLightPoints, nightStrength } from '../../data/environmentLights';
import {overlayViewport} from './renderSizing';
import {getEffectsQuality,EFFECTS_QUALITY_EVENT} from './effectsQuality';
import {getGraphicEffects} from './graphicsEffects';
import {ensureNightLightArt,nightLightFrame} from './NightLightArt';

interface LocalLight {
  actor:Phaser.GameObjects.Sprite; x:number; y:number; radius:number; fire:boolean; phase:number;
  glow:Phaser.GameObjects.Image;
  cutout:Phaser.GameObjects.Image;
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
  private readonly texture:Phaser.Textures.DynamicTexture;
  private readonly lights=new Set<LocalLight>();
  private readonly emissions=new Set<Phaser.GameObjects.Sprite>();
  private readonly fireflies:Array<{glow:Phaser.GameObjects.Arc; light:Phaser.GameObjects.Arc;dx:number;dy:number;phase:number}>=[];
  private elapsed=0;
  private accumulator=0;
  private renderAccumulator=100;
  private maskDirty=true;
  private maskGeometry='';
  // This low-cost mask is painted less often than the camera moves.
  // The buffered image lives in world space, exactly like the lamps. Camera
  // follow must never be compensated using the previous render's worldView.
  private maskWorldOrigin: {x:number;y:number} | null = null;
  private maskWorldScale=0;
  private readonly maskPaddingCss = 96;
  private firefliesEnabled=true;
  setFirefliesEnabled(enabled:boolean){this.firefliesEnabled=enabled;}
  constructor(private readonly scene:Phaser.Scene) {
    const state=useGameStore.getState();this.day=state.day;this.minuteOfDay=state.minuteOfDay;
    const viewport=overlayViewport(scene);
    const resolution=this.lightweight ? .65 : 1;
    const padding=Math.round(this.maskPaddingCss*resolution);
    this.texture=scene.textures.addDynamicTexture('night-overlay',
      Math.max(1,Math.round(viewport.width*resolution))+padding*2,
      Math.max(1,Math.round(viewport.height*resolution))+padding*2)!;
    this.texture.setSize(Math.max(1,Math.round(viewport.width*resolution))+padding*2,
      Math.max(1,Math.round(viewport.height*resolution))+padding*2,false);
    this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.overlay=scene.add.image(0,0,'night-overlay').setOrigin(0).setDepth(1_000_000).setName('night-darkness');
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
        radius:p.radius*Math.sqrt(scale),fire:p.fire,phase:index*.8+actor.x*.013+actor.y*.019,glow,
        cutout:this.scene.make.image({key:ensureNightLightArt(this.scene),frame:nightLightFrame(false,0,0),add:false})};
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
      for(const node of owned){this.lights.delete(node);node.glow.destroy();node.cutout.destroy();}
      for(const emission of ownedEmissions){this.emissions.delete(emission);emission.destroy();}
      this.renderAccumulator=100;
      this.maskDirty=true;
    });
    this.renderAccumulator=100;
    this.maskDirty=true;
  }
  isIlluminated(x:number,y:number) {
    if(nightStrength(this.minuteOfDay)<.7)return true;
    for(const light of this.lights){
      if(!light.actor.active||!light.actor.visible)continue;
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
    const camera=this.scene.cameras.main,view=camera.worldView,full=overlayViewport(this.scene);
    for(const node of this.lights) {
      const x=node.actor.x+node.x,y=node.actor.y+node.y,r=node.radius;
      const visible=node.actor.visible&&effects.lightBloom&&night>0&&x+r>=view.left&&x-r<=view.right&&y+r>=view.top&&y-r<=view.bottom;
      node.glow.setVisible(visible);
      if(night===0)node.glow.setAlpha(0);
      if(!visible)continue;
      const flicker=node.fire ? .92+Math.sin(this.elapsed*.013+node.phase)*.055+Math.sin(this.elapsed*.021+node.phase)*.025 : 1;
      const intensity=node.actor.texture.key==='elven_villas'?.28:.15;
      node.glow.setPosition(x,y).setAlpha(night*intensity*flicker);
    }
    for(const emission of this.emissions){
      const owner=emission.getData('emissionOwner') as Phaser.GameObjects.Sprite;
      // Lit windows belong to the structure's draw order. Painting their
      // pixels above every actor makes a foreground character merge into it.
      const type=emission.getData('emissionType');
      if(type==='tree-runes'||type==='tree-rune-glow'){
        const pulse=(Math.sin(this.elapsed*.002+owner.x*.013+owner.y*.019)+1)/2;
        const runeGlow=type==='tree-rune-glow';
        const depth=runeGlow?1_000_002:1_000_003;
        if(emission.depth!==depth)emission.setDepth(depth);
        emission.setPosition(owner.x,owner.y).setAlpha(runeGlow?.48+.42*pulse:.88+.12*pulse)
          .setVisible(effects.lightBloom&&owner.visible);
      }else {
        emission.setPosition(owner.x,owner.y);
        if(emission.depth!==owner.depth+.005)emission.setDepth(owner.depth+.005);
        emission.setAlpha(night*.8).setVisible(effects.lightBloom&&night>0&&owner.visible);
      }
    }
    // Stable world-space pockets. Camera zoom never gets applied twice.
    const cx=Math.floor(playerX/1024)*1024+512,cy=Math.floor(playerY/1024)*1024+512;
    for(const fly of this.fireflies) {
      const drift=this.elapsed*.00035, pulse=(Math.sin(this.elapsed*.003+fly.phase)+1)/2;
      const x=cx+fly.dx+Math.sin(drift+fly.phase)*32,y=cy+fly.dy+Math.cos(drift*.8+fly.phase)*24;
      fly.glow.setPosition(x,y).setAlpha(night*(.03+pulse*.22)).setVisible(effects.fireflies&&this.firefliesEnabled&&!this.lightweight&&night>.02);
      fly.light.setPosition(x,y).setAlpha(night*(.12+pulse*.72)).setVisible(effects.fireflies&&this.firefliesEnabled&&(!this.lightweight||this.fireflies.indexOf(fly)<6)&&night>.02);
    }
    const resolution=this.lightweight ? .65 : 1;
    const z=full.zoom*resolution,pad=Math.round(this.maskPaddingCss*resolution);
    const w=this.texture.width,h=this.texture.height;
    this.overlay.setVisible(effects.nightDarkness&&night>0);
    // Darkness strength is an image uniform, not another full-screen upload.
    this.overlay.setAlpha(night*.84);
    if(night===0||!effects.nightDarkness) {
      this.maskWorldOrigin=null;
      return; // Avoid full-screen texture uploads in daylight.
    }
    this.renderAccumulator+=Math.max(0,deltaMs);
    const movement=this.maskWorldOrigin
      ? Math.max(Math.abs(camera.worldView.x-this.maskWorldOrigin.x),Math.abs(camera.worldView.y-this.maskWorldOrigin.y))*z
      : Infinity;
    // Keep masks reasonably fresh; the buffered image tracks camera motion
    // in the interim, without an expensive canvas redraw on every frame.
    const interval=this.lightweight?220:70;
    // Use the painted origin while the camera crosses the overscan buffer.
    // The same light order and existing mobile cap preserve overlapping holes.
    const origin=this.maskWorldOrigin??view,visible:LocalLight[]=[];
    let geometry='';
    for(const node of this.lights){
      if(!node.actor.active||!node.actor.visible)continue;
      const x=(node.actor.x+node.x-origin.x)*z+pad,y=(node.actor.y+node.y-origin.y)*z+pad,r=node.radius*z;
      if(x+r<0||y+r<0||x-r>w||y-r>h)continue;
      if(this.lightweight&&visible.length>=18)break;
      visible.push(node);geometry+=`${node.actor.x+node.x},${node.actor.y+node.y},${r},${node.phase},${node.fire};`;
    }
    const animated=visible.some(node=>node.fire);
    if(!this.maskWorldOrigin||this.maskDirty||z!==this.maskWorldScale||geometry!==this.maskGeometry||movement>pad*.7
      ||animated&&this.renderAccumulator>=interval) {
      this.renderAccumulator=0;
      this.maskWorldOrigin={x:camera.worldView.x,y:camera.worldView.y};
      this.maskWorldScale=z;
      this.maskDirty=false;
      this.texture.clear().fill(0x020611,1);
      const cutouts:Phaser.GameObjects.Image[]=[];
      this.maskGeometry='';
      for(const node of this.lights) {
        if(!node.actor.active||!node.actor.visible)continue;
        const x=(node.actor.x+node.x-camera.worldView.x)*z+pad;
        const y=(node.actor.y+node.y-camera.worldView.y)*z+pad;
        const r=node.radius*z;
        if(x+r<0||y+r<0||x-r>w||y-r>h) continue;
        if(this.lightweight&&cutouts.length>=18)break;
        node.cutout.setPosition(x,y).setDisplaySize(r*2,r*2).setFrame(nightLightFrame(node.fire,this.elapsed,node.phase));
        cutouts.push(node.cutout);
        this.maskGeometry+=`${node.actor.x+node.x},${node.actor.y+node.y},${r},${node.phase},${node.fire};`;
      }
      // One GPU batch applies destination-out without canvas gradients or
      // CPU-to-GPU uploads. DynamicTexture also supports the canvas renderer.
      if(cutouts.length)this.texture.erase(cutouts);
    }
    const paintedOrigin=this.maskWorldOrigin!;
    this.overlay.setDisplaySize(w/z,h/z).setPosition(paintedOrigin.x-pad/z,paintedOrigin.y-pad/z);
  }
  /** Teleports/respawns must repaint against the destination camera, not reuse
   * a previous town's cached light pockets. Does not advance the clock. */
  invalidateView(){this.maskWorldOrigin=null;this.maskWorldScale=0;this.maskDirty=true;this.renderAccumulator=200;}
  getHour(){return this.minuteOfDay/60;}
  syncState(){useGameStore.getState().setClock(this.day,this.minuteOfDay);}
  destroy(){
    window.removeEventListener(EFFECTS_QUALITY_EVENT,this.onQualityChange);
    this.scene.scale.off('resize',this.onResize,this);this.overlay.destroy();
    for(const node of this.lights){node.glow.destroy();node.cutout.destroy();}this.lights.clear();
    for(const emission of this.emissions) emission.destroy();this.emissions.clear();
    for(const fly of this.fireflies){fly.glow.destroy();fly.light.destroy();}
    this.scene.textures.remove('night-overlay');
  }
  private onResize(){
    const viewport=overlayViewport(this.scene);
    const resolution=this.lightweight ? .65 : 1;
    const pad=Math.round(this.maskPaddingCss*resolution);
    this.texture.setSize(
      Math.max(1,Math.round(viewport.width*resolution))+pad*2,
      Math.max(1,Math.round(viewport.height*resolution))+pad*2,false);
    this.invalidateView();
  }
}

// LEIGHNERON_MOBILE_GRAPHICS_NPC_FIX_V1
