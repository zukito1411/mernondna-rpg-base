import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {treeLayerKey, type TreeTexture} from '../../data/treeArt';

function prepareRuneEmission(scene:Phaser.Scene,source:Phaser.Textures.CanvasTexture,width:number,height:number){
  const pixels=source.getContext().getImageData(0,0,width,height),runes=source.getContext().createImageData(width,height);
  for(let i=0;i<pixels.data.length;i+=4){
    const [r,g,b,a]=pixels.data.subarray(i,i+4);
    if(a>32&&g>80&&b>110&&g>r*1.12&&b>r*1.2)runes.data.set(pixels.data.subarray(i,i+4),i);
  }
  const emission=scene.textures.createCanvas('elarion_tree:emission',width,height)!;
  emission.getContext().putImageData(runes,0,0);emission.add(0,0,0,0,width,height);emission.refresh();
  const glow=scene.textures.createCanvas('elarion_tree:rune-glow',width,height)!;
  const blurred=document.createElement('canvas');blurred.width=width;blurred.height=height;
  const ctx=blurred.getContext('2d');
  if(!ctx)throw new Error('Unable to create Elarion rune glow canvas.');
  ctx.filter='blur(24px)';ctx.drawImage(emission.getSourceImage() as CanvasImageSource,0,0);
  glow.getContext().drawImage(blurred,0,0);glow.add(0,0,0,0,width,height);glow.refresh();
  emission.setFilter(Phaser.Textures.FilterMode.LINEAR);glow.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

/** Runtime layers, not edited PNGs. Separate green/snowy foliage from wood so
 * trunks and roots stay still. Bare winter branches never sway as a canopy. */
export function prepareTreeArt(scene:Phaser.Scene){
  for(const key of ['world_assets','climate_props','elarion_tree'] as const satisfies readonly TreeTexture[]){
    const sheet=ART_BY_KEY[key],original=scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    const width=sheet.frameWidth*sheet.density,height=sheet.frameHeight*sheet.density;
    const frames=key==='elarion_tree'?[0]:[0,1];
    const wood=scene.textures.createCanvas(treeLayerKey(key,'wood'),width*frames.length,height)!;
    const leaves=scene.textures.createCanvas(treeLayerKey(key,'leaves'),width*frames.length,height)!;
    const columns=sheet.atlasColumns??sheet.columns;
    for(const [index,frame] of frames.entries()){
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
      wood.getContext().putImageData(pixels,index*width,0);
      leaves.getContext().putImageData(foliage,index*width,0);
      const woodFrame=wood.add(frame,0,index*width,0,width,height),leafFrame=leaves.add(frame,0,index*width,0,width,height);
      if(woodFrame)woodFrame.customData={...original.get(frame).customData};
      if(leafFrame)leafFrame.customData={...original.get(frame).customData};
    }
    for(const atlas of [wood,leaves]){atlas.refresh();atlas.setFilter(Phaser.Textures.FilterMode.LINEAR);}
    if(key==='elarion_tree')prepareRuneEmission(scene,original,width,height);
  }
  prepareCanopyArt(scene,'woodland_props',[5]);
}

function prepareCanopyArt(scene:Phaser.Scene,key:'woodland_props',frames:number[]){
  const sheet=ART_BY_KEY[key],original=scene.textures.get(key) as Phaser.Textures.CanvasTexture;
  const width=sheet.frameWidth*sheet.density,height=sheet.frameHeight*sheet.density,columns=sheet.atlasColumns??sheet.columns;
  const wood=scene.textures.createCanvas(treeLayerKey(key,'wood'),width*frames.length,height)!;
  const leaves=scene.textures.createCanvas(treeLayerKey(key,'leaves'),width*frames.length,height)!;
  for(const [index,frame] of frames.entries()){
    const pixels=original.getContext().getImageData(frame%columns*width,Math.floor(frame/columns)*height,width,height);
    const foliage=leaves.getContext().createImageData(width,height);
    const visible=(original.get(frame).customData as {visibleBounds?:{top:number;height:number}}).visibleBounds;
    const top=(visible?.top??0)*sheet.density,span=(visible?.height??sheet.frameHeight)*sheet.density;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
      if(pixels.data[i+3]&&y<top+span*.8&&g>32&&g>r*1.055&&g>b*.87){
        foliage.data.set(pixels.data.subarray(i,i+4),i);pixels.data[i+3]=0;
      }
    }
    wood.getContext().putImageData(pixels,index*width,0);
    leaves.getContext().putImageData(foliage,index*width,0);
    const woodFrame=wood.add(frame,0,index*width,0,width,height),leafFrame=leaves.add(frame,0,index*width,0,width,height);
    if(woodFrame)woodFrame.customData={...original.get(frame).customData};
    if(leafFrame)leafFrame.customData={...original.get(frame).customData};
  }
  for(const atlas of [wood,leaves]){atlas.refresh();atlas.setFilter(Phaser.Textures.FilterMode.LINEAR);}
}
