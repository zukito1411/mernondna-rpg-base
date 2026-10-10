import Phaser from 'phaser';
import {ART_BY_KEY,type ArtTextureKey} from '../../data/art';
import {overlayViewport} from './renderSizing';

type Actor=Phaser.GameObjects.Sprite|Phaser.GameObjects.Image;
export interface ShadowOptions {projection?:number;contactScale?:number;contactHeight?:number;contactOffset?:number;groundOffsetY?:number}
interface Caster extends ShadowOptions {actor:Actor;texture?:string;frame?:string|number}
interface Layer {texture:Phaser.Textures.CanvasTexture;image:Phaser.GameObjects.Image}
const OVERSCAN=96;

/** Cached scenery and changing actors share sunlight and ground registration.
 * Camera overscan avoids repainting/uploading shadows on every scroll frame. */
export class GroundShadowSystem {
 private readonly casters=new Map<Actor,Caster>();
 private readonly scenery=new Set<Caster>();
 private readonly moving=new Set<Caster>();
 private readonly silhouettes=new Map<string,HTMLCanvasElement>();
 private readonly staticLayer:Layer;
 private readonly actorLayer:Layer;
 private readonly cloudLayer:Layer;
 private readonly contact=document.createElement('canvas');
 private base={x:Infinity,y:Infinity,zoom:0};
 private drawMs=100;private staticScanMs=250;private cloudDrawMs=125;private cloudElapsed=0;private staticDirty=true;
 private lightingKey='';private sceneryStamp:string|null=null;private actorStamp:string|null=null;
 constructor(private readonly scene:Phaser.Scene){
  const viewport=overlayViewport(scene);
  const makeLayer=(key:string,name:string,depth:number):Layer=>{
   const texture=scene.textures.createCanvas(key,viewport.width+OVERSCAN*2,viewport.height+OVERSCAN*2)!;
   return {texture,image:scene.add.image(0,0,key).setOrigin(0).setDepth(depth).setName(name)};
  };
  this.staticLayer=makeLayer('ground-shadows','world-ground-shadows',-940);
  this.actorLayer=makeLayer('ground-shadows-dynamic','actor-ground-shadows',-939);
  this.cloudLayer=makeLayer('passing-cloud-shadows','world-cloud-shadows',-985);
  this.contact.width=192;this.contact.height=64;const ctx=this.contact.getContext('2d')!;
  ctx.translate(96,32);ctx.scale(1,.32);
  const stamp=ctx.createRadialGradient(0,0,0,0,0,96);
  stamp.addColorStop(0,'rgba(14,19,18,.78)');stamp.addColorStop(.28,'rgba(14,19,18,.56)');
  stamp.addColorStop(.65,'rgba(14,19,18,.2)');stamp.addColorStop(1,'rgba(14,19,18,0)');
  ctx.fillStyle=stamp;ctx.fillRect(-96,-96,192,192);
 }
 register(actor:Actor,retainArtwork=false,options:ShadowOptions={}){
  if(this.casters.has(actor))return;
  const caster:Caster={actor,...options,...(retainArtwork?{texture:actor.texture.key,frame:actor.frame.name}:{})};
  this.casters.set(actor,caster);(retainArtwork?this.scenery:this.moving).add(caster);this.staticDirty=true;
  actor.once('destroy',()=>{
   this.casters.delete(actor);this.scenery.delete(caster);this.moving.delete(caster);this.staticDirty=true;
  });
 }
 update(delta:number,hour:number,cloudCover=0){
  this.drawMs+=delta;this.staticScanMs+=delta;
  this.cloudDrawMs+=delta;this.cloudElapsed+=Math.max(0,delta)*.04;
  const viewport=overlayViewport(this.scene),view=this.scene.cameras.main.worldView,zoom=viewport.zoom;
  const width=viewport.width+OVERSCAN*2,height=viewport.height+OVERSCAN*2;
  const shifted=this.base.zoom!==zoom||this.staticLayer.texture.width!==width||this.staticLayer.texture.height!==height
   ||Math.abs((view.x-this.base.x)*zoom-OVERSCAN)>OVERSCAN/2
   ||Math.abs((view.y-this.base.y)*zoom-OVERSCAN)>OVERSCAN/2;
  if(shifted){
   this.base={x:view.x-OVERSCAN/zoom,y:view.y-OVERSCAN/zoom,zoom};this.staticDirty=true;this.actorStamp=null;
   for(const layer of [this.cloudLayer,this.staticLayer,this.actorLayer]){
    if(layer.texture.width!==width||layer.texture.height!==height)layer.texture.setSize(width,height);
    layer.image.setPosition(this.base.x,this.base.y).setDisplaySize(width/zoom,height/zoom);
   }
  }
  // Static scenery needs no redraw for subpixel clock changes. Actor shadows
  // follow at up to 30 Hz, and unchanged poses do not upload another texture.
  const cloud=Math.round(Math.min(1,Math.max(0,cloudCover))*8)/8,sunHour=Math.floor(hour*10)/10;
  const lightKey=sunHour+':'+cloud;
  if(lightKey!==this.lightingKey){this.lightingKey=lightKey;this.staticDirty=true;this.actorStamp=null;}
  const daylight=sunHour>=6&&sunHour<=18?Math.max(0,Math.sin((sunHour-6)/12*Math.PI)):0;
  const castX=Math.cos((sunHour-6)/12*Math.PI)*(.22+(1-daylight)*.4),castY=.16+(1-daylight)*.24;
  if(this.cloudDrawMs>=125||shifted){
   this.cloudDrawMs=0;this.paintClouds(daylight,cloud);
  }
  if(this.staticDirty||this.staticScanMs>=250){
   this.staticScanMs=0;const visible=this.visible(this.scenery,width,height,castX,castY),stamp=this.stamp(visible);
   if(this.staticDirty||stamp!==this.sceneryStamp){this.paint(this.staticLayer,visible,daylight,castX,castY,cloud);this.sceneryStamp=stamp;}
   this.staticDirty=false;
  }
  if(this.drawMs<33&&!shifted)return;
  this.drawMs=0;const visible=this.visible(this.moving,width,height,castX,castY),stamp=this.stamp(visible);
  if(stamp===this.actorStamp)return;
  this.paint(this.actorLayer,visible,daylight,castX,castY,cloud);this.actorStamp=stamp;
 }
 private visible(casters:Set<Caster>,width:number,height:number,castX:number,castY:number){
  const result:Array<{caster:Caster;frame:Phaser.Textures.Frame}>=[];
  for(const caster of casters){
   const {actor,texture,frame:fixedFrame}=caster;if(!actor.active||!actor.visible||actor.alpha<.05)continue;
   const frame=texture?this.scene.textures.getFrame(texture,fixedFrame):actor.frame;if(!frame)continue;
   const w=frame.cutWidth*Math.abs(actor.scaleX),h=frame.cutHeight*Math.abs(actor.scaleY);
   const reach=w+h*Math.abs(castX)*(caster.projection??1),down=h*castY*(caster.projection??1)+w;
   if(actor.x+reach<this.base.x||actor.x-reach>this.base.x+width/this.base.zoom
    ||actor.y+down<this.base.y||actor.y-w>this.base.y+height/this.base.zoom)continue;
   result.push({caster,frame});
  }
  return result;
 }
 private stamp(visible:Array<{caster:Caster;frame:Phaser.Textures.Frame}>){
  return visible.map(({caster:{actor},frame})=>[frame.texture.key,frame.name,
   Math.round(actor.x*this.base.zoom*4),Math.round(actor.y*this.base.zoom*4),actor.scaleX,actor.scaleY,
   actor.rotation,actor.alpha,actor.originX,actor.originY,actor.flipX,actor.flipY].join(',')).join(';');
 }
 private paint(layer:Layer,visible:Array<{caster:Caster;frame:Phaser.Textures.Frame}>,daylight:number,castX:number,castY:number,cloud:number){
  const ctx=layer.texture.getContext(),zoom=this.base.zoom;ctx.clearRect(0,0,layer.texture.width,layer.texture.height);
  for(const {caster,frame} of visible){
   const {actor}=caster,x=(actor.x-this.base.x)*zoom,y=(actor.y-this.base.y+(caster.groundOffsetY??0))*zoom;
   const bounds=(frame.customData as {visibleBounds?:{width:number}}).visibleBounds;
   const density=ART_BY_KEY[frame.texture.key as ArtTextureKey]?.density??1;
   const visibleWidth=(bounds?bounds.width*density:frame.cutWidth)*Math.abs(actor.scaleX);
   const radius=Math.max(5,Math.min(220,visibleWidth*.34))*(caster.contactScale??1)*zoom;
   const contactHeight=caster.contactHeight??(2/3),contactY=y+radius*(caster.contactOffset??0);
   ctx.save();ctx.globalAlpha=actor.alpha;ctx.drawImage(this.contact,x-radius,contactY-radius*contactHeight/2,radius*2,radius*contactHeight);ctx.restore();
   const projection=caster.projection??1;if(daylight<=.02||projection===0)continue;
   const silhouette=this.silhouette(frame),sx=Math.abs(actor.scaleX)*zoom*(actor.flipX?-1:1),sy=Math.abs(actor.scaleY)*zoom*(actor.flipY?-1:1);
   const cos=Math.cos(actor.rotation),sin=Math.sin(actor.rotation),a=sx*cos,b=sx*sin,c=-sy*sin,d=sy*cos;
   const px=castX*projection,py=castY*projection;
   const m0=a-px*b,m1=-py*b,m2=c-px*d,m3=-py*d,ox=actor.originX*frame.cutWidth,oy=actor.originY*frame.cutHeight;
   ctx.save();ctx.globalAlpha=(.34+daylight*.3)*(1-cloud*.35)*actor.alpha;
   ctx.setTransform(m0,m1,m2,m3,x-m0*ox-m2*oy,y-m1*ox-m3*oy);
   ctx.drawImage(silhouette,0,0,frame.cutWidth,frame.cutHeight);ctx.restore();
  }
  layer.texture.refresh();
 }
 private paintClouds(daylight:number,cloudCover:number){
  const layer=this.cloudLayer,ctx=layer.texture.getContext(),zoom=this.base.zoom;
  ctx.clearRect(0,0,layer.texture.width,layer.texture.height);
  if(daylight<=.02){layer.texture.refresh();return;}
  const cover=Math.min(1,Math.max(0,cloudCover)),strength=daylight*(.24+cover*.24);
  const driftX=this.cloudElapsed,driftY=-this.cloudElapsed*.24;
  const left=this.base.x,right=left+layer.texture.width/zoom,top=this.base.y,bottom=top+layer.texture.height/zoom;
  const firstX=Math.floor((left-driftX-360)/780),lastX=Math.ceil((right-driftX+360)/780);
  const firstY=Math.floor((top-driftY-280)/560),lastY=Math.ceil((bottom-driftY+280)/560);
  const random=(x:number,y:number,salt:number)=>{
   const value=Math.sin(x*127.1+y*311.7+salt*74.7)*43758.5453;
   return value-Math.floor(value);
  };
  for(let gy=firstY;gy<=lastY;gy++)for(let gx=firstX;gx<=lastX;gx++){
   const seed=random(gx,gy,1),x=(gx+.5+random(gx,gy,2)*.5)*780+driftX;
   const y=(gy+.5+random(gx,gy,3)*.5)*560+driftY;
   const px=(x-left)*zoom,py=(y-top)*zoom,rotation=(seed-.5)*.7;
   const lobes=[
    {x:0,y:0,rx:250+seed*100,ry:125+seed*55,weight:.48},
    {x:(random(gx,gy,4)-.5)*210,y:(random(gx,gy,5)-.5)*75,rx:185,ry:105,weight:.3},
    {x:(random(gx,gy,6)-.5)*240,y:(random(gx,gy,7)-.5)*85,rx:155,ry:90,weight:.25},
   ];
   for(const lobe of lobes){
    ctx.save();ctx.translate(px+lobe.x*zoom,py+lobe.y*zoom);ctx.rotate(rotation);ctx.scale(lobe.rx*zoom,lobe.ry*zoom);
    const alpha=strength*lobe.weight*(.82+random(gx,gy,8)*.3);
    const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
    gradient.addColorStop(0,`rgba(31,42,49,${alpha})`);gradient.addColorStop(.52,`rgba(31,42,49,${alpha*.72})`);
    gradient.addColorStop(1,'rgba(31,42,49,0)');ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();
   }
  }
  layer.texture.refresh();
 }
 private silhouette(frame:Phaser.Textures.Frame){
  const key=`${frame.texture.key}:${frame.name}`,cached=this.silhouettes.get(key);
  if(cached){this.silhouettes.delete(key);this.silhouettes.set(key,cached);return cached;}
  const canvas=document.createElement('canvas'),ratio=Math.min(1,192/Math.max(frame.cutWidth,frame.cutHeight));
  canvas.width=Math.max(1,Math.round(frame.cutWidth*ratio));canvas.height=Math.max(1,Math.round(frame.cutHeight*ratio));
  const ctx=canvas.getContext('2d')!;
  ctx.drawImage(frame.source.image as CanvasImageSource,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation='source-in';ctx.fillStyle='#111916';ctx.fillRect(0,0,canvas.width,canvas.height);
  const soft=document.createElement('canvas');soft.width=canvas.width;soft.height=canvas.height;
  const softCtx=soft.getContext('2d')!;softCtx.filter='blur(1px)';softCtx.drawImage(canvas,0,0);
  if(this.silhouettes.size>=192)this.silhouettes.delete(this.silhouettes.keys().next().value!);
  this.silhouettes.set(key,soft);return soft;
 }
 destroy(){
  this.casters.clear();this.scenery.clear();this.moving.clear();this.silhouettes.clear();
  for(const layer of [this.cloudLayer,this.staticLayer,this.actorLayer]){layer.image.destroy();this.scene.textures.remove(layer.texture.key);}
  this.contact.width=this.contact.height=1;
 }
}
