import Phaser from 'phaser';
import type {WorldGenerator} from './WorldGenerator';
import {overlayViewport,fitViewportOverlay} from './renderSizing';

interface WaterCell {x:number;y:number;shore:boolean}
/** Small viewport-only animated water. The terrain predicate masks bridges,
 * banks and solid ice; wave art never changes navigation or implies ships. */
export class WaterSurfaceSystem {
  private readonly texture:Phaser.Textures.CanvasTexture;
  private readonly overlay:Phaser.GameObjects.Image;
  private readonly mask=document.createElement('canvas');
  private cells:WaterCell[]=[];private cacheKey='';private elapsed=0;private drawMs=100;
  private destroyed=false;
  private readonly reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  constructor(private readonly scene:Phaser.Scene,private readonly world:WorldGenerator){
    const viewport=overlayViewport(scene);
    this.texture=scene.textures.createCanvas('moving-water',viewport.width,viewport.height)!;
    this.overlay=scene.add.image(0,0,'moving-water').setOrigin(0).setScrollFactor(0).setDepth(-990).setName('river-and-sea-surface');
  }
  update(delta:number){
    if(!this.reducedMotion.matches)this.elapsed+=Math.min(delta,100);
    this.drawMs+=delta;
    const camera=this.scene.cameras.main,{zoom:z,width:w,height:h}=overlayViewport(this.scene),view=camera.worldView;
    const ox=Math.floor(view.x/32)*32,oy=Math.floor(view.y/32)*32;
    const key=`${ox}:${oy}:${w}:${h}:${z}`;
    const changed=key!==this.cacheKey;
    if(!changed&&this.drawMs<80)return;this.drawMs=0;
    if(this.texture.width!==w||this.texture.height!==h){this.texture.setSize(w,h);this.mask.width=w;this.mask.height=h;}
    if(this.mask.width!==w||this.mask.height!==h){this.mask.width=w;this.mask.height=h;}
    fitViewportOverlay(this.scene,this.overlay);
    if(changed){this.cacheKey=key;this.cells=[];
      const water=new Set<string>();
      for(let y=oy-32;y<oy+h/z+64;y+=32)for(let x=ox-32;x<ox+w/z+64;x+=32)
        if(this.world.getTerrainAt(x+16,y+16)==='water')water.add(`${x}:${y}`);
      for(const cell of water){const [x,y]=cell.split(':').map(Number);
        const shore=[[32,0],[-32,0],[0,32],[0,-32]].some(([dx,dy])=>!water.has(`${x+dx}:${y+dy}`)&&this.world.getTerrainAt(x+dx+16,y+dy+16)!=='water');
        this.cells.push({x,y,shore});}
    }
    this.overlay.setVisible(this.cells.length>0);if(!this.cells.length)return;
    const ctx=this.texture.getContext(),mask=this.mask.getContext('2d')!;
    ctx.clearRect(0,0,w,h);mask.clearRect(0,0,w,h);mask.fillStyle='#fff';
    for(const cell of this.cells)mask.fillRect((cell.x-view.x)*z,(cell.y-view.y)*z,32*z+.5,32*z+.5);
    // Larger, sparsely spaced currents remain anchored to world coordinates.
    for(let y=Math.floor(view.y/96)*96;y<view.bottom+96;y+=96)for(let x=Math.floor(view.x/192)*192;x<view.right+192;x+=192){
      const phase=x*.009+y*.007+this.elapsed*.001,px=(x-view.x)*z,py=(y-view.y+Math.sin(phase)*7)*z;
      ctx.strokeStyle=`rgba(168,215,220,${.075+.04*(Math.sin(phase)+1)})`;ctx.lineWidth=1.4*z;
      ctx.beginPath();ctx.moveTo(px,py);ctx.bezierCurveTo(px+38*z,py-8*z,px+65*z,py+7*z,px+105*z,py);ctx.stroke();
    }
    for(const cell of this.cells){if(!cell.shore)continue;
      const phase=cell.x*.019+cell.y*.011+this.elapsed*.0013;
      ctx.strokeStyle=`rgba(218,232,211,${.08+(Math.sin(phase)+1)*.055})`;ctx.lineWidth=1.5*z;
      const px=(cell.x+6-view.x)*z,py=(cell.y+18+Math.sin(phase)*3-view.y)*z;
      ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+10*z,py-3*z,px+20*z,py);ctx.stroke();
    }
    ctx.globalCompositeOperation='destination-in';ctx.drawImage(this.mask,0,0);ctx.globalCompositeOperation='source-over';this.texture.refresh();
  }
  destroy(){if(this.destroyed)return;this.destroyed=true;this.overlay.destroy();this.scene.textures.remove('moving-water');this.mask.width=this.mask.height=1;this.cells=[];}
}
