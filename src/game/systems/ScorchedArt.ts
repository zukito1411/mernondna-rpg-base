import type Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';

/** Derive reusable burnt props at boot; original winter/wood/ruin art is kept.
 * Bare branches retain their shape while snow and green growth are removed. */
export function prepareScorchedArt(scene:Phaser.Scene){
  const texture=scene.textures.get('darkav_props') as Phaser.Textures.CanvasTexture;
  const ctx=texture.getContext(),pixels=ctx.getImageData(0,0,texture.width,texture.height);
  const frameWidth=ART_BY_KEY.darkav_props.frameWidth*ART_BY_KEY.darkav_props.density;
  for(let y=0;y<texture.height;y++)for(let x=0;x<texture.width;x++){
    const i=(y*texture.width+x)*4;if(!pixels.data[i+3])continue;
    const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],frame=Math.floor(x/frameWidth);
    if(frame===0&&b>110&&g>100&&b>=r*.96){pixels.data[i+3]=0;continue;}
    const v=r*.3+g*.59+b*.11;
    pixels.data[i]=20+v*.44;pixels.data[i+1]=8+v*.19;pixels.data[i+2]=7+v*.16;
  }
  ctx.putImageData(pixels,0,0);texture.refresh();
}
