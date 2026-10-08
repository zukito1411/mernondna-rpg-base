import Phaser from 'phaser';
import { ART_BY_KEY, type ArtTextureKey } from '../../data/art';
import { environmentLightPoints } from '../../data/environmentLights';

/** Extract only warm emissive pixels. Original PNG files remain unchanged. */
export function prepareEnvironmentLightArt(scene:Phaser.Scene,key:ArtTextureKey) {
  const sheet=ART_BY_KEY[key];if(!sheet.regions) return;
  const original=scene.textures.get(key) as Phaser.Textures.CanvasTexture;
  const ctx=original.getContext(),base=ctx.getImageData(0,0,original.width,original.height);
  const emission=ctx.createImageData(original.width,original.height);
  const columns=sheet.atlasColumns??sheet.columns,w=sheet.frameWidth*sheet.density,h=sheet.frameHeight*sheet.density;
  let found=false;
  for(let frame=0;frame<sheet.columns;frame++) for(const light of environmentLightPoints(key,frame)) {
    found=true;
    const cx=(frame%columns)*w+w/2+light.x*sheet.density;
    const cy=Math.floor(frame/columns)*h+h+light.y*sheet.density,r=light.mask*sheet.density;
    for(let y=Math.max(Math.floor(frame/columns)*h,Math.floor(cy-r));y<Math.min(Math.floor(frame/columns)*h+h,cy+r);y++)
      for(let x=Math.max((frame%columns)*w,Math.floor(cx-r));x<Math.min((frame%columns)*w+w,cx+r);x++) {
        if(Math.hypot(x-cx,y-cy)>r) continue;
        const i=(y*original.width+x)*4;
        if(base.data[i]<160||base.data[i+1]<65||base.data[i+2]>base.data[i+1]*.72||base.data[i+3]<32) continue;
        emission.data.set(base.data.slice(i,i+4),i);
        if(!light.fire) {base.data[i]*=.42;base.data[i+1]*=.34;base.data[i+2]*=.45;}
      }
  }
  if(!found) return;
  ctx.putImageData(base,0,0);original.refresh();
  const texture=scene.textures.createCanvas(key+':emission',original.width,original.height)!;
  texture.getContext().putImageData(emission,0,0);
  for(let frame=0;frame<sheet.columns;frame++) texture.add(frame,0,(frame%columns)*w,Math.floor(frame/columns)*h,w,h);
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
}
