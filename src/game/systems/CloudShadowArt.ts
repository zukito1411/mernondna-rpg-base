import {createNoise2D} from 'simplex-noise';
import {seededRandom} from '../../utils/seededRandom';
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
/** Cached soft density fields: cumulus clusters, broken clouds, and long banks.
 * Several noise scales break up the edge and interior without hard outlines. */
export function cloudShadowStamps(){
 return Array.from({length:8},(_,shape)=>{
  const rng=seededRandom('cloud-shadow:'+shape),noise=createNoise2D(rng),canvas=document.createElement('canvas');
  canvas.width=256;canvas.height=160;const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(256,160);
  const elongated=shape%3===1,broken=shape%3===2;
  const lobes=Array.from({length:broken?7:elongated?9:5},()=>({
   x:(rng()-.5)*(elongated?1.15:.75),y:(rng()-.5)*(elongated?.27:.65),
   rx:.22+rng()*.18,ry:(elongated?.14:.21)+rng()*.14,weight:.65+rng()*.35,
  }));
  for(let y=0;y<160;y++)for(let x=0;x<256;x++){
   const nx=(x-128)/128,ny=(y-80)/80;let density=0;
   for(const l of lobes)density=Math.max(density,l.weight*Math.exp(-(((nx-l.x)/l.rx)**2+((ny-l.y)/l.ry)**2)));
   const detail=noise(nx*3,ny*3)*.21+noise(nx*7+19,ny*7-5)*.09+noise(nx*15,ny*15)*.025;
   const edge=smooth(.07,.32,density+detail),soft=smooth(0,.45,1-Math.max(Math.abs(nx),Math.abs(ny)));
   const alpha=edge*soft*(.12+density*.6)*(broken?.72:1),i=(y*256+x)*4;
   pixels.data[i]=27;pixels.data[i+1]=36;pixels.data[i+2]=42;pixels.data[i+3]=Math.round(alpha*255);
  }
  ctx.putImageData(pixels,0,0);
  const blurred=document.createElement('canvas');blurred.width=256;blurred.height=160;
  const out=blurred.getContext('2d')!;out.filter='blur(5px)';out.drawImage(canvas,0,0);
  return blurred;
 });
}
