import Phaser from 'phaser';
import {heroFrameData} from './heroFrameData';
import {HERO_SKILL_BODY_GUARDS} from '../../data/heroSkillBodyGuards';

// Authored source-space body guards for the four original skill strips.
// Never recolor the hero's armor/skin to match a spell. New thrust/casting
// strips have no baked energy, so their separate effect layers handle color.
const guards=HERO_SKILL_BODY_GUARDS;
export const skillBodyGuard=(key:string,frame:number)=>guards[key]?.[frame];
interface Palette {indices:Uint32Array;rgb:Uint8Array;color:number|undefined}
const palettes=new WeakMap<Phaser.Textures.CanvasTexture,Palette>();

/** Reuse the prepared atlas in place; no texture per weapon, frame or cast.
 * Sparse original RGB values allow exact default restoration. Only isolated
 * energy colors outside registered body guards are eligible for recoloring. */
export function applySkillWeaponPalette(scene:Phaser.Scene,key:string,color?:number,prepareOnly=false,bodyGuardKey=key,includeGuardedEnergy=false){
  if(!guards[bodyGuardKey])return;
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
        const rect=guards[bodyGuardKey][frameIndex],fit=meta.sourceFit*density;
      for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++){
        const sx=region[0]+(x-bounds.left*density)/fit,sy=region[1]+(y-bounds.top*density)/fit;
        if(!includeGuardedEnergy&&sx>=rect[0]&&sx<=rect[0]+rect[2]&&sy>=rect[1]&&sy<=rect[1]+rect[3])continue;
        const i=((frame.cutY+y)*texture.width+frame.cutX+x)*4;
        if(!data[i+3])continue;
        const r=data[i],g=data[i+1],b=data[i+2];
        // Generated cosmetic effects also contain saturated pure-blue edge
        // pixels. Tint those without turning the pirate's dark navy cloth gold.
        const blue=includeGuardedEnergy?b>120&&b>r*1.25&&b>g*.95:b>60&&b>r*1.4&&g>r*1.2;
        const gold=bodyGuardKey==='skill_crown_rally'&&r>120&&g>90&&r>b*1.25&&g>b*1.15;
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
