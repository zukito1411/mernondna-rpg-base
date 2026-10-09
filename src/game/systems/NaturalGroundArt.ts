import {seededRandom} from '../../utils/seededRandom';
import {seamlessTerrainPixels} from './terrainArt';

/** Blend rotated natural swatch islands into a larger seamless pattern. Roads,
 * crops, sea currents and structures keep their original orientation. */
export function naturalGroundPattern(tile:HTMLCanvasElement,frame:number){
  if(![0,4,5,6,8,9].includes(frame))return tile;
  const size=tile.width,result=document.createElement('canvas'),stamp=document.createElement('canvas');
  result.width=result.height=size*2;stamp.width=stamp.height=size;
  const ctx=result.getContext('2d')!,s=stamp.getContext('2d')!,rng=seededRandom('ground-swatch:'+frame);
  ctx.fillStyle=ctx.createPattern(tile,'repeat')!;ctx.fillRect(0,0,result.width,result.height);
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    s.clearRect(0,0,size,size);s.save();s.translate(size/2,size/2);s.rotate(Math.floor(rng()*4)*Math.PI/2);
    s.drawImage(tile,-size/2,-size/2);s.restore();
    const mask=s.createRadialGradient(size/2,size/2,size*.18,size/2,size/2,size*.5);
    mask.addColorStop(0,'rgba(255,255,255,.95)');mask.addColorStop(1,'rgba(255,255,255,0)');
    s.globalCompositeOperation='destination-in';s.fillStyle=mask;s.fillRect(0,0,size,size);s.globalCompositeOperation='source-over';
    const x=col*size+(rng()-.5)*size*.5,y=row*size+(rng()-.5)*size*.5;
    // Wrap the islands too, not just the repeated base swatch.
    for(const dx of [-result.width,0,result.width])for(const dy of [-result.height,0,result.height])ctx.drawImage(stamp,x+dx,y+dy);
  }
  const pixels=ctx.getImageData(0,0,result.width,result.height);
  pixels.data.set(seamlessTerrainPixels(pixels.data,result.width));ctx.putImageData(pixels,0,0);
  stamp.width=stamp.height=1;return result;
}
