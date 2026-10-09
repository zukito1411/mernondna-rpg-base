import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {treeLayerKey, type TreeTexture} from '../../data/treeArt';

/** Runtime layers, not edited PNGs. Separate green/snowy foliage from wood so
 * trunks and roots stay still. Bare winter branches never sway as a canopy. */
export function prepareTreeArt(scene:Phaser.Scene){
  for(const key of ['world_assets','climate_props'] as const satisfies readonly TreeTexture[]){
    const sheet=ART_BY_KEY[key],original=scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    const width=sheet.frameWidth*sheet.density,height=sheet.frameHeight*sheet.density;
    const wood=scene.textures.createCanvas(treeLayerKey(key,'wood'),width*2,height)!;
    const leaves=scene.textures.createCanvas(treeLayerKey(key,'leaves'),width*2,height)!;
    const columns=sheet.atlasColumns??sheet.columns;
    for(let frame=0;frame<2;frame++){
      const pixels=original.getContext().getImageData(frame%columns*width,Math.floor(frame/columns)*height,width,height);
      const foliage=leaves.getContext().createImageData(width,height);
      const visible=(original.get(frame).customData as {visibleBounds?:{top:number;height:number}}).visibleBounds;
      const top=(visible?.top??0)*sheet.density,span=(visible?.height??sheet.frameHeight)*sheet.density;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const i=(y*width+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
        const green=g>32&&g>r*1.055&&g>b*.87;
        const snow=key==='climate_props'&&frame===0&&r>100&&g>110&&b>115&&Math.max(r,g,b)-Math.min(r,g,b)<80;
        if(pixels.data[i+3]&&y<top+span*.8&&(green||snow)&&!(key==='climate_props'&&frame===1)){
          foliage.data.set(pixels.data.subarray(i,i+4),i);pixels.data[i+3]=0;
        }
      }
      wood.getContext().putImageData(pixels,frame*width,0);
      leaves.getContext().putImageData(foliage,frame*width,0);
      const woodFrame=wood.add(frame,0,frame*width,0,width,height),leafFrame=leaves.add(frame,0,frame*width,0,width,height);
      if(woodFrame)woodFrame.customData={...original.get(frame).customData};
      if(leafFrame)leafFrame.customData={...original.get(frame).customData};
    }
    for(const atlas of [wood,leaves]){atlas.refresh();atlas.setFilter(Phaser.Textures.FilterMode.LINEAR);}
  }
}
