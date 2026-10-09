import Phaser from 'phaser';
import { overlayViewport } from './renderSizing';

type Actor = Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
interface Caster { actor:Actor; texture?:string; frame?:string|number }

/** One viewport-sized layer; silhouettes reuse the actual prepared artwork.
 * Feet remain fixed while sunlight projects roofs, foliage and people onto ground. */
export class GroundShadowSystem {
  private readonly casters=new Set<Caster>();
  private readonly silhouettes=new Map<string,HTMLCanvasElement>();
  private readonly texture:Phaser.Textures.CanvasTexture;
  private readonly overlay:Phaser.GameObjects.Image;
  private drawMs=100;
  private readonly contact=document.createElement('canvas');
  private base={x:Infinity,y:Infinity,zoom:0};
  constructor(private readonly scene:Phaser.Scene){
    const size=overlayViewport(scene);
    this.texture=scene.textures.createCanvas('ground-shadows',size.width,size.height)!;
    this.overlay=scene.add.image(0,0,'ground-shadows').setOrigin(0)
      .setDepth(-940).setName('world-ground-shadows');
    this.contact.width=192;this.contact.height=64;const ctx=this.contact.getContext('2d')!;
    ctx.translate(96,32);ctx.scale(1,.32);const stamp=ctx.createRadialGradient(0,0,0,0,0,96);
    stamp.addColorStop(0,'rgba(17,22,20,.3)');stamp.addColorStop(1,'rgba(17,22,20,0)');ctx.fillStyle=stamp;ctx.fillRect(-96,-96,192,192);
  }
  register(actor:Actor,retainArtwork=false){
    const caster:Caster={actor,...(retainArtwork?{texture:actor.texture.key,frame:actor.frame.name}:{})};
    this.casters.add(caster);
    actor.once('destroy',()=>this.casters.delete(caster));
  }
  update(delta:number,hour:number,cloudCover=0){
    this.drawMs+=delta;
    // Always follow a moving camera, including paused/cinematic camera frames.
    const viewport=overlayViewport(this.scene),view=this.scene.cameras.main.worldView,zoom=viewport.zoom,width=viewport.width+192,height=viewport.height+192;
    // A world-space overscan buffer follows camera motion without uploading a
    // new full-screen texture every frame. Repaint actors at a bounded 30 Hz.
    if(this.drawMs<33&&this.base.zoom===zoom&&this.texture.width===width&&this.texture.height===height
      &&Math.abs(view.x-this.base.x-96/zoom)<48/zoom&&Math.abs(view.y-this.base.y-96/zoom)<48/zoom)return;
    this.drawMs=0;this.base={x:view.x-96/zoom,y:view.y-96/zoom,zoom};
    if(this.texture.width!==width||this.texture.height!==height)this.texture.setSize(width,height);
    this.overlay.setPosition(this.base.x,this.base.y).setDisplaySize(width/zoom,height/zoom);
    const ctx=this.texture.getContext();ctx.clearRect(0,0,width,height);
    const daylight=Math.max(0,Math.sin((hour-6)/12*Math.PI));
    const castX=Math.cos((hour-6)/12*Math.PI)*(.18+(1-daylight)*.38),castY=.12+(1-daylight)*.22;
    for(const {actor,texture,frame:fixedFrame} of this.casters){
      if(!actor.active||!actor.visible||actor.alpha<.05)continue;
      const frame=texture?this.scene.textures.getFrame(texture,fixedFrame):actor.frame;
      if(!frame)continue;
      const w=frame.cutWidth*Math.abs(actor.scaleX),h=frame.cutHeight*Math.abs(actor.scaleY);
      if(actor.x+w<view.x||actor.x-w>view.right||actor.y+h*.6<view.y||actor.y-h*.6>view.bottom)continue;
      const x=(actor.x-this.base.x)*zoom,y=(actor.y-this.base.y)*zoom;
      // Soft contact is present at night too, without a daytime cast silhouette.
      ctx.save();ctx.globalAlpha=actor.alpha;
      const radius=Math.max(10,Math.min(95,w*.3))*zoom;
      ctx.drawImage(this.contact,x-radius,y-radius/3,radius*2,radius*2/3);ctx.restore();
      if(daylight<=.02||actor.rotation!==0)continue;
      const silhouette=this.silhouette(frame);
      const sx=Math.abs(actor.scaleX)*zoom,sy=Math.abs(actor.scaleY)*zoom;
      ctx.save();ctx.globalAlpha=(.11+daylight*.16)*(1-Math.min(1,cloudCover)*.4)*actor.alpha;
      const flipped=actor.flipX?-1:1;
      ctx.setTransform(flipped*sx,0,-castX*sy,-castY*sy,
        x+(actor.flipX?1-actor.originX:-actor.originX)*frame.cutWidth*sx+castX*actor.originY*frame.cutHeight*sy,
        y+castY*actor.originY*frame.cutHeight*sy);
      ctx.drawImage(silhouette,0,0,frame.cutWidth,frame.cutHeight);ctx.restore();
    }
    this.texture.refresh();
  }
  private silhouette(frame:Phaser.Textures.Frame){
    const key=`${frame.texture.key}:${frame.name}`;
    const cached=this.silhouettes.get(key);if(cached)return cached;
    const canvas=document.createElement('canvas'),ratio=Math.min(1,192/Math.max(frame.cutWidth,frame.cutHeight));
    canvas.width=Math.max(1,Math.round(frame.cutWidth*ratio));canvas.height=Math.max(1,Math.round(frame.cutHeight*ratio));
    const ctx=canvas.getContext('2d')!;
    ctx.drawImage(frame.source.image as CanvasImageSource,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,canvas.width,canvas.height);
    ctx.globalCompositeOperation='source-in';ctx.fillStyle='#151c19';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(this.silhouettes.size>=192)this.silhouettes.delete(this.silhouettes.keys().next().value!);
    const soft=document.createElement('canvas');soft.width=canvas.width;soft.height=canvas.height;
    const softCtx=soft.getContext('2d')!;softCtx.filter='blur(1px)';softCtx.drawImage(canvas,0,0);
    this.silhouettes.set(key,soft);return soft;
  }
  destroy(){this.casters.clear();this.silhouettes.clear();this.overlay.destroy();this.scene.textures.remove('ground-shadows');}
}
