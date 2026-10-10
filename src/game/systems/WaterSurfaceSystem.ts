import Phaser from 'phaser';
import type {WorldGenerator} from './WorldGenerator';
import {overlayViewport} from './renderSizing';

interface WaterCell {x:number;y:number;edges:Array<[number,number]>}
const OVERSCAN=96;
/** Small viewport-only animated water. The terrain predicate masks bridges,
 * banks and solid ice. World-anchored swells and bank foam share the mask. */
export class WaterSurfaceSystem {
  private readonly texture:Phaser.Textures.CanvasTexture;
  private readonly overlay:Phaser.GameObjects.Image;
  private readonly ocean:Phaser.GameObjects.TileSprite;
  private readonly mask=document.createElement('canvas');
  private cells:WaterCell[]=[];private elapsed=0;private drawMs=100;
  private base={x:Infinity,y:Infinity,zoom:0};
  private destroyed=false;
  private readonly reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  constructor(private readonly scene:Phaser.Scene,private readonly world:WorldGenerator){
    const viewport=overlayViewport(scene);
    this.texture=scene.textures.createCanvas('moving-water',viewport.width+OVERSCAN*2,viewport.height+OVERSCAN*2)!;
    this.overlay=scene.add.image(0,0,'moving-water').setOrigin(0).setDepth(-990).setName('river-and-sea-surface');
    this.ocean=scene.add.tileSprite(0,0,1,1,'water-foam',0).setOrigin(0).setScrollFactor(0).setDepth(-990).setAlpha(.18).setTileScale(.7,.45).setVisible(false).setName('ocean-foam-surface');
  }
  update(delta:number){
    if(!this.reducedMotion.matches)this.elapsed+=Math.min(delta,100);
    this.drawMs+=delta;
    const camera=this.scene.cameras.main,viewport=overlayViewport(this.scene),z=viewport.zoom,view=camera.worldView;
    const w=viewport.width+OVERSCAN*2,h=viewport.height+OVERSCAN*2;
    const openSea=Boolean(this.scene.registry.get('openSeaView'));
    this.ocean.setVisible(openSea);
    if(openSea){
      this.overlay.setVisible(false);const rawZ=camera.zoom,sw=this.scene.scale.width,sh=this.scene.scale.height;
      if(this.ocean.width!==sw/rawZ||this.ocean.height!==sh/rawZ)this.ocean.setSize(sw/rawZ,sh/rawZ);
      this.ocean.setPosition(sw/2*(1-1/rawZ),sh/2*(1-1/rawZ));
      this.ocean.tilePositionX=view.x/.7-this.elapsed*.008;this.ocean.tilePositionY=view.y/.45-this.elapsed*.003;
      const frame=Math.floor(this.elapsed/220)%4;if(this.ocean.frame.name!==String(frame))this.ocean.setFrame(frame);return;
    }
    const changed=this.base.zoom!==z||this.texture.width!==w||this.texture.height!==h
      ||Math.abs((view.x-this.base.x)*z-OVERSCAN)>OVERSCAN/2||Math.abs((view.y-this.base.y)*z-OVERSCAN)>OVERSCAN/2;
    if(!changed&&this.drawMs<50)return;this.drawMs=0;
    if(this.texture.width!==w||this.texture.height!==h){this.texture.setSize(w,h);this.mask.width=w;this.mask.height=h;}
    if(this.mask.width!==w||this.mask.height!==h){this.mask.width=w;this.mask.height=h;}
    if(changed){
      this.base={x:view.x-OVERSCAN/z,y:view.y-OVERSCAN/z,zoom:z};this.cells=[];
      this.overlay.setPosition(this.base.x,this.base.y).setDisplaySize(w/z,h/z);
      const ox=Math.floor(this.base.x/32)*32,oy=Math.floor(this.base.y/32)*32;
      const water=new Set<string>();
      for(let y=oy-32;y<oy+h/z+64;y+=32)for(let x=ox-32;x<ox+w/z+64;x+=32)
        if(this.world.getTerrainAt(x+16,y+16)==='water')water.add(`${x}:${y}`);
      for(const cell of water){const [x,y]=cell.split(':').map(Number);
        const edges=([[32,0],[-32,0],[0,32],[0,-32]] as Array<[number,number]>).filter(([dx,dy])=>!water.has(`${x+dx}:${y+dy}`)&&this.world.getTerrainAt(x+dx+16,y+dy+16)!=='water');
        this.cells.push({x,y,edges});}
      const mask=this.mask.getContext('2d')!;mask.clearRect(0,0,w,h);mask.fillStyle='#fff';
      for(const cell of this.cells)mask.fillRect((cell.x-this.base.x)*z,(cell.y-this.base.y)*z,32*z+.5,32*z+.5);
    }
    this.overlay.setVisible(this.cells.length>0);if(!this.cells.length)return;
    const ctx=this.texture.getContext();ctx.clearRect(0,0,w,h);
    // Animate painted foam frames rather than drawing geometric wave strokes.
    const paint=(x:number,y:number,width:number,height:number,phase:number,rotation=0,alpha=.18)=>{
      const frame=this.scene.textures.getFrame('water-foam',(Math.floor(this.elapsed/220)+phase)%4)!;
      ctx.save();ctx.globalAlpha=alpha;ctx.translate((x-this.base.x)*z,(y-this.base.y)*z);ctx.rotate(rotation);
      ctx.drawImage(frame.source.image as CanvasImageSource,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,-width*z/2,-height*z/2,width*z,height*z);ctx.restore();
    };
    const flowX=(this.elapsed*.006)%240,flowY=(this.elapsed*.003)%144;
    for(let y=Math.floor(this.base.y/144)*144-144;y<this.base.y+h/z+144;y+=144)
      for(let x=Math.floor(this.base.x/240)*240-240;x<this.base.x+w/z+240;x+=240)
        paint(x+flowX,y+flowY,180,90,Math.abs(Math.round(x/240+y/144))%4);
    for(const cell of this.cells){
      const phase=Math.abs(Math.round(cell.x/32+cell.y/32))%4;
      for(const [dx,dy] of cell.edges){
        paint(cell.x+16+dx*.34,cell.y+16+dy*.34,38,24,phase,Math.atan2(dy,dx)+Math.PI/2,.24);
      }
    }
    ctx.globalCompositeOperation='destination-in';ctx.drawImage(this.mask,0,0);ctx.globalCompositeOperation='source-over';this.texture.refresh();
  }
  destroy(){if(this.destroyed)return;this.destroyed=true;this.overlay.destroy();this.ocean.destroy();this.scene.textures.remove('moving-water');this.mask.width=this.mask.height=1;this.cells=[];}
}
