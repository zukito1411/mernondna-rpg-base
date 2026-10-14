import Phaser from 'phaser';
import {heroFrameData} from './heroFrameData';

type Rect=readonly [number,number,number,number];
// Authored source-space body guards for the four original skill strips.
// Never recolor the hero's armor/skin to match a spell. New thrust/casting
// strips have no baked energy, so their separate effect layers handle color.
const guards:Record<string,readonly Rect[]>={
  skill_azure_cleave:[[50,228,230,295],[380,235,260,290],[720,250,240,275],[1034,250,295,275],[1485,245,270,280],[1910,230,220,294]],
  skill_skyfall_slam:[[55,347,220,282],[380,390,290,240],[740,190,260,325],[1080,265,230,240],[1510,400,240,230],[1900,345,245,290]],
  skill_crown_rally:[[65,270,210,324],[400,295,230,300],[725,265,250,328],[1040,260,400,333],[1540,268,220,326],[1910,269,220,324]],
  skill_crescent_flurry:[[60,262,250,289],[385,260,280,294],[720,277,260,272],[1090,270,280,280],[1465,285,250,270],[60,262,250,289]],
};
interface Palette {indices:Uint32Array;rgb:Uint8Array;color:number|undefined}
const palettes=new WeakMap<Phaser.Textures.CanvasTexture,Palette>();

/** Reuse the prepared atlas in place; no texture per weapon, frame or cast.
 * Sparse original RGB values allow exact default restoration. Only isolated
 * energy colors outside registered body guards are eligible for recoloring. */
export function applySkillWeaponPalette(scene:Phaser.Scene,key:string,color?:number,prepareOnly=false){
  if(!guards[key])return;
  const texture=scene.textures.get(key) as Phaser.Textures.CanvasTexture;
  let palette=palettes.get(texture);
  if(!palette&&color===undefined&&!prepareOnly)return;
  if(palette&&(prepareOnly||palette.color===color))return;
  const ctx=texture.getContext(),pixels=ctx.getImageData(0,0,texture.width,texture.height),data=pixels.data;
  if(!palette){
    const indices:number[]=[],rgb:number[]=[];
    for(let frameIndex=0;frameIndex<6;frameIndex++){
      const frame=texture.get(frameIndex),meta=heroFrameData(frame);
      const region=meta.sourceRegion,bounds=meta.visibleBounds,density=meta.heroDensity??2;
      if(!region||!bounds||!meta.sourceFit)continue;
      const rect=guards[key][frameIndex],fit=meta.sourceFit*density;
      for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++){
        const sx=region[0]+(x-bounds.left*density)/fit,sy=region[1]+(y-bounds.top*density)/fit;
        if(sx>=rect[0]&&sx<=rect[0]+rect[2]&&sy>=rect[1]&&sy<=rect[1]+rect[3])continue;
        const i=((frame.cutY+y)*texture.width+frame.cutX+x)*4;
        if(!data[i+3])continue;
        const r=data[i],g=data[i+1],b=data[i+2];
        const blue=b>60&&b>r*1.4&&g>r*1.2;
        const gold=key==='skill_crown_rally'&&r>120&&g>90&&r>b*1.25&&g>b*1.15;
        if(!blue&&!gold)continue;
        indices.push(i);rgb.push(r,g,b);
      }
    }
    palette={indices:Uint32Array.from(indices),rgb:Uint8Array.from(rgb),color:undefined};
    palettes.set(texture,palette);
  }
  if(prepareOnly)return;
  const channels=color===undefined?null:[color>>16&255,color>>8&255,color&255];
  for(let j=0;j<palette.indices.length;j++){
    const i=palette.indices[j],r=palette.rgb[j*3],g=palette.rgb[j*3+1],b=palette.rgb[j*3+2];
    if(!channels){data[i]=r;data[i+1]=g;data[i+2]=b;continue;}
    const peak=Math.max(r,g,b),white=Math.min(r,g,b)/Math.max(1,peak);
    for(let c=0;c<3;c++)data[i+c]=Math.round(peak*(white+(1-white)*channels[c]/255));
  }
  ctx.putImageData(pixels,0,0);texture.refresh();palette.color=color;
}
