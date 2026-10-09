import type Phaser from 'phaser';
export const DRAGON_BREATH_ART='assets/effects/dragon-breath.png';
export const BREATH_ROOT=16;
export const BREATH_LENGTH=460;
/** Prepare once. Keep a shared scale and register the narrow root, rather than
 * re-centering every turbulent silhouette and making the nozzle wobble. */
export function prepareDragonBreathArt(scene:Phaser.Scene){
  const source=scene.textures.get('dragon-breath-source').getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,source.width,source.height).data;
  const w=source.width/3,h=source.height/2;
  const roots=Array.from({length:6},(_,frame)=>{
    const x=frame%3*w,y=Math.floor(frame/3)*h;let left=w,right=0;
    for(let py=0;py<h;py++)for(let px=0;px<w;px++)if(pixels[((y+py)*source.width+x+px)*4+3]>128){left=Math.min(left,px);right=Math.max(right,px);}
    if(right<=left)throw new Error('Empty dragon breath frame '+frame);
    let sum=0,weight=0;
    for(let py=0;py<h;py++)for(let px=left;px<Math.min(w,left+8);px++){
      const alpha=pixels[((y+py)*source.width+x+px)*4+3];if(alpha>64){sum+=py*alpha;weight+=alpha;}
    }
    return {x,y,left,right,rootY:sum/weight};
  });
  const fit=BREATH_LENGTH/Math.max(...roots.map(r=>r.right-r.left));
  const texture=scene.textures.createCanvas('dragon-breath',1536,1024)!;
  const target=texture.getContext();target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';
  roots.forEach((r,i)=>{
    const x=i%3*512,y=Math.floor(i/3)*512;
    target.save();target.beginPath();target.rect(x,y,512,512);target.clip();
    target.drawImage(source,r.x,r.y,w,h,x+BREATH_ROOT-r.left*fit,y+256-r.rootY*fit,w*fit,h*fit);
    target.restore();texture.add(i,0,x,y,512,512);
  });
  texture.refresh();scene.textures.remove('dragon-breath-source');
}
