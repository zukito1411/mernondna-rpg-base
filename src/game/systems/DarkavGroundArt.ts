import type Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {naturalGroundPattern} from './NaturalGroundArt';
import {seamlessTerrainPixels} from './terrainArt';
import {PAVING_PATTERN_SIZE} from '../../data/environmentPresentation';

export const DARKAV_GROUND_FRAMES=[12,13,14,15,16,17] as const;
/** Presentation-only IDs; the underlying terrain kinds retain their rules. */
export function darkavGroundFrame(frame:number,insideBlackspire=false,onDarkavRoad=false){
  if(onDarkavRoad&&![3,7,10,11].includes(frame))return 17;
  if(insideBlackspire&&[1,2,8].includes(frame))return 16;
  if(frame===2)return 14;if(frame===1)return 13;if(frame===10)return 15;
  return [0,4,5,8,9].includes(frame)?12:frame;
}

/** Sample illustrated surface interiors, not whole raised rock silhouettes.
 * Source coordinates refer to lava_snow.png; prepared atlas registration maps
 * them to the exact loaded crop. Source PNGs remain untouched. */
function volcanicSurface(scene:Phaser.Scene,frameIndex:number,region:readonly [number,number,number,number],base:string){
  const texture=scene.textures.get('climate_props'),frame=texture.get(frameIndex);
  const metadata=frame.customData as {sourceRegion?:readonly number[];sourceFit?:number;
    visibleBounds?:{left:number;top:number}};
  if(!metadata.sourceRegion||!metadata.sourceFit||!metadata.visibleBounds)
    throw new Error('Volcanic ground needs the prepared lava_snow.png atlas metadata.');
  const [x,y,w,h]=region,density=ART_BY_KEY.climate_props.density,fit=metadata.sourceFit;
  const tile=document.createElement('canvas');tile.width=tile.height=256;
  const ctx=tile.getContext('2d')!;ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
  ctx.drawImage(texture.getSourceImage() as CanvasImageSource,
    frame.cutX+(metadata.visibleBounds.left+(x-metadata.sourceRegion[0])*fit)*density,
    frame.cutY+(metadata.visibleBounds.top+(y-metadata.sourceRegion[1])*fit)*density,
    w*fit*density,h*fit*density,0,0,256,256);
  const pixels=ctx.getImageData(0,0,256,256);
  pixels.data.set(seamlessTerrainPixels(pixels.data,256,18));ctx.putImageData(pixels,0,0);
  return tile;
}

function redGround(source:HTMLCanvasElement,kind:'paving'|'ash'|'trail'){
  const tile=document.createElement('canvas');tile.width=tile.height=source.width;
  const ctx=tile.getContext('2d')!;ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,tile.width,tile.height);
  for(let i=0;i<pixels.data.length;i+=4){
    const v=pixels.data[i]*.3+pixels.data[i+1]*.59+pixels.data[i+2]*.11;
    // Ember-red basalt, not neutral purple/gray or pale mossy limestone.
    const color=kind==='paving'?[31+v*.4,10+v*.17,9+v*.14]:
      kind==='ash'?[39+v*.4,12+v*.16,9+v*.13]:[46+v*.4,15+v*.18,10+v*.13];
    pixels.data[i]=color[0];pixels.data[i+1]=color[1];pixels.data[i+2]=color[2];
  }
  ctx.putImageData(pixels,0,0);return tile;
}

function charcoalGround(source:HTMLCanvasElement){
  const tile=document.createElement('canvas');tile.width=tile.height=source.width;
  const ctx=tile.getContext('2d')!;ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,tile.width,tile.height);
  for(let i=0;i<pixels.data.length;i+=4){
    const value=22+(pixels.data[i]*.3+pixels.data[i+1]*.59+pixels.data[i+2]*.11)*.29;
    pixels.data[i]=value*.94;pixels.data[i+1]=value*.97;pixels.data[i+2]=value;
  }
  ctx.putImageData(pixels,0,0);return tile;
}

export function darkavGroundPatterns(scene:Phaser.Scene,dirt:HTMLCanvasElement,stone:HTMLCanvasElement):HTMLCanvasElement[]{
  // Real cracks and molten colors from the red lava boulder and lava pool.
  // No drawn polylines, polygon rafts, orange outlines or synthetic veins.
  const rock=volcanicSurface(scene,8,[985,820,112,92],'#421b15');
  const pool=volcanicSurface(scene,11,[973,1080,145,83],'#dd4610');
  const ashBase=redGround(dirt,'ash'),ashCtx=ashBase.getContext('2d')!;
  ashCtx.globalAlpha=.48;ashCtx.drawImage(rock,0,0,ashBase.width,ashBase.height);ashCtx.globalAlpha=1;
  const ash=naturalGroundPattern(ashBase,8),trail=redGround(dirt,'trail');
  const basalt=redGround(stone,'paving'),basaltCtx=basalt.getContext('2d')!;
  // Preserve deliberate paving joints; fine rock texture belongs within them.
  basaltCtx.globalCompositeOperation='soft-light';basaltCtx.globalAlpha=.35;
  basaltCtx.drawImage(rock,0,0,basalt.width,basalt.height);basaltCtx.globalAlpha=1;basaltCtx.globalCompositeOperation='source-over';
  const paving=document.createElement('canvas');paving.width=paving.height=PAVING_PATTERN_SIZE;
  paving.getContext('2d')!.drawImage(basalt,0,0,paving.width,paving.height);
  const charcoal=charcoalGround(stone),charcoalPaving=document.createElement('canvas');
  charcoalPaving.width=charcoalPaving.height=PAVING_PATTERN_SIZE;
  charcoalPaving.getContext('2d')!.drawImage(charcoal,0,0,charcoalPaving.width,charcoalPaving.height);
  const path=charcoalGround(stone),pathPixels=path.getContext('2d')!.getImageData(0,0,path.width,path.height);
  for(let i=0;i<pathPixels.data.length;i+=4){
    const value=9+(pathPixels.data[i]*.3+pathPixels.data[i+1]*.59+pathPixels.data[i+2]*.11)*.34;
    pathPixels.data[i]=value*.91;pathPixels.data[i+1]=value*.95;pathPixels.data[i+2]=value;
  }
  path.getContext('2d')!.putImageData(pathPixels,0,0);
  const darkPath=document.createElement('canvas');darkPath.width=darkPath.height=PAVING_PATTERN_SIZE;
  darkPath.getContext('2d')!.drawImage(path,0,0,darkPath.width,darkPath.height);
  const lava=naturalGroundPattern(pool,8);
  ashBase.width=ashBase.height=basalt.width=basalt.height=charcoal.width=charcoal.height=path.width=path.height=rock.width=rock.height=pool.width=pool.height=1;
  return [ash,trail,paving,lava,charcoalPaving,darkPath];
}
