import Phaser from 'phaser';
import {actorArtLayout,type ArtTextureKey} from '../../src/data/art';
import {VARKHUL_ATLAS_PAGES} from '../../src/data/varkhulArt';

/** Test-only: inspect the actual textures registered by the production boot.
 * No alternate packing or synthetic dragon artwork is used for this review. */
export async function reviewVarkhulFrames(game:Phaser.Game){
 if(!(game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer))throw new Error('Varkhul review requires actual WebGL rendering');
 const reports:Array<{texture:string;frame:number;mirrored:boolean;gutterPixels:number;foreignPixels:number;missingPixels:number;expectedPixels:number;png:string}>=[];
 const key='varkhul-gpu-review',background=[24,32,39],scale=.8;
 const capture={x:140,y:60,width:744,height:820};
 const worldWasSleeping=game.scene.isSleeping('world');
 game.scene.sleep('world');
 let review:Phaser.Scene|undefined;
 try{
  review=await new Promise<Phaser.Scene>(resolve=>{
   class Review extends Phaser.Scene{
    create(){this.cameras.main.setViewport(0,0,1024,1024).setBackgroundColor(0x182027);resolve(this);}
   }
   game.scene.add(key,new Review({key}),true);
  });
  for(const page of VARKHUL_ATLAS_PAGES){
   const texture=game.textures.get(page.texture),source=texture.getSourceImage() as HTMLImageElement;
   const atlas=document.createElement('canvas');atlas.width=source.width;atlas.height=source.height;
   const read=atlas.getContext('2d',{willReadFrequently:true})!;read.drawImage(source,0,0);
   const atlasPixels=read.getImageData(0,0,atlas.width,atlas.height).data;
   for(const [id,entry] of Object.entries(page.frames))for(const mirrored of [false,true]){
    const frame=texture.get(Number(id));let gutterPixels=0;
    for(let y=0;y<frame.cutHeight;y++)for(let x=0;x<frame.cutWidth;x++){
     if((x<2||y<2||x>=frame.cutWidth-2||y>=frame.cutHeight-2)
       &&atlasPixels[((frame.cutY+y)*atlas.width+frame.cutX+x)*4+3]>32)gutterPixels++;
    }
    const sprite=review.add.sprite(512,640,page.texture,Number(id)).setScale(scale)
     .setOrigin(.5,actorArtLayout(page.texture as ArtTextureKey).originY).setFlipX(mirrored);
    try{
     const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
      const timeout=window.setTimeout(()=>reject(new Error('GPU snapshot timed out')),8000);
      game.renderer.snapshotArea(capture.x,capture.y,capture.width,capture.height,result=>{
       window.clearTimeout(timeout);
       if(result instanceof HTMLImageElement)resolve(result);else reject(new Error('GPU snapshot did not return an image'));
      });
     });
     const expected=document.createElement('canvas'),actual=document.createElement('canvas');
     expected.width=actual.width=capture.width;expected.height=actual.height=capture.height;
     const cpu=expected.getContext('2d',{willReadFrequently:true})!,gpu=actual.getContext('2d',{willReadFrequently:true})!;
     cpu.imageSmoothingEnabled=false;
     cpu.translate(sprite.x-capture.x,sprite.y-capture.y);cpu.scale(mirrored?-scale:scale,scale);
     cpu.drawImage(source,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,
      entry.trim[2]-sprite.originX*frame.realWidth,entry.trim[3]-sprite.originY*frame.realHeight,frame.cutWidth,frame.cutHeight);
     gpu.drawImage(image,0,0);
     const mask=cpu.getImageData(0,0,capture.width,capture.height).data;
     const rendered=gpu.getImageData(0,0,capture.width,capture.height).data;
     let foreignPixels=0,missingPixels=0,expectedPixels=0;
     // Allow a 3px rasterization guard, but never a remote neighboring limb.
     // This is test-only pixel inspection, not a per-frame game operation.
     for(let y=4;y<capture.height-4;y+=2)for(let x=4;x<capture.width-4;x+=2){
      const at=(y*capture.width+x)*4;
      const actualContrast=Math.max(...background.map((c,i)=>Math.abs(rendered[at+i]-c)));
      const expectedContrast=Math.max(...background.map((c,i)=>Math.abs(mask[at+i]-c)));
      if(mask[at+3]>224&&expectedContrast>48){
       expectedPixels++;
       if(actualContrast<10){
        // CPU canvas and roundPixels WebGL do not choose identical edge
        // samples at fractional scale. Apply the SAME 3px guard both ways.
        let near=false;
        for(let dy=-3;dy<=3&&!near;dy++)for(let dx=-3;dx<=3;dx++){
         const i=((y+dy)*capture.width+x+dx)*4;
         if(Math.max(...background.map((c,k)=>Math.abs(rendered[i+k]-c)))>=16){near=true;break;}
        }
        if(!near)missingPixels++;
       }
      }
      if(mask[at+3]>4||actualContrast<16)continue;
      let near=false;
      for(let dy=-3;dy<=3&&!near;dy++)for(let dx=-3;dx<=3;dx++)if(mask[((y+dy)*capture.width+x+dx)*4+3]>4){near=true;break;}
      if(!near)foreignPixels++;
     }
     reports.push({texture:page.texture,frame:Number(id),mirrored,gutterPixels,foreignPixels,missingPixels,expectedPixels,png:image.src});
     expected.width=actual.width=1;expected.height=actual.height=1;
    }finally{sprite.destroy();}
   }
   atlas.width=atlas.height=1;
  }
  return reports;
 }finally{
  if(game.scene.getScene(key))game.scene.remove(key);
  if(!worldWasSleeping)game.scene.wake('world');
 }
}
