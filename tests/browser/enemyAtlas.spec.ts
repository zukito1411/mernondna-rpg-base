import {test,expect} from '@playwright/test';
import type {WorldScene} from '../../src/game/scenes/WorldScene';

test('every enemy frame has safe UVs, full source crops and transparent gutters',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 try{await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'),null,{timeout:30000});}
 catch{throw new Error('Enemy art boot failed: '+errors.join('\n'));}
 const audit=await page.evaluate(async()=>{
  const p='/src/data/directionalEnemyArt.ts',{DIRECTIONAL_ENEMY_ART}=await import(p);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  const keys=[...new Set([...DIRECTIONAL_ENEMY_ART.flatMap((a:{texture:string;walkTexture:string})=>[a.texture,a.walkTexture]),'enemy_dragon_fly','enemy_bandit'])] as string[];
  const faults:string[]=[],regions:Array<{path:string;region:number[];size:number[];frame:string;isolated:boolean}>=[];let checked=0,foreignProbes=0;
  for(const key of keys){
   const texture=s.textures.get(key),canvas=texture.getSourceImage() as HTMLCanvasElement,ctx=canvas.getContext('2d')!;
   for(const frame of Object.values(texture.frames)){
    if(frame.name==='__BASE')continue;checked++;const label=key+'/'+frame.name;
    const metadata=frame.customData as {fullSprite:boolean;isolatedSubject?:boolean;foreignProbes?:number[][];sourceFit:number;gaitSeam?:number;visibleBounds:{left:number;top:number;width:number;height:number};sourcePath:string;sourceRegion:number[];sourceImageSize:number[]};
    if(!metadata.fullSprite||metadata.gaitSeam!==undefined)faults.push(label+' is not a whole sprite');
    const b=metadata.visibleBounds,density=2;
    if(b.left<1||b.top<1||b.left+b.width>frame.cutWidth/density-1||b.top+b.height>frame.cutHeight/density-1)faults.push(label+' clips its source');
    if(Math.abs(frame.u0-frame.cutX/frame.source.width)>1e-7||Math.abs(frame.u1-(frame.cutX+frame.cutWidth)/frame.source.width)>1e-7||Math.abs(frame.v0-frame.cutY/frame.source.height)>1e-7||Math.abs(frame.v1-(frame.cutY+frame.cutHeight)/frame.source.height)>1e-7)faults.push(label+' has stale GPU coordinates');
    const pixels=ctx.getImageData(frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight).data;let opaque=0,border=0;
    for(let y=0;y<frame.cutHeight;y++)for(let x=0;x<frame.cutWidth;x++)if(pixels[(y*frame.cutWidth+x)*4+3]>32){
     opaque++;if(x<2||y<2||x>=frame.cutWidth-2||y>=frame.cutHeight-2)border++;
    }
    if(!opaque)faults.push(label+' is empty');if(border)faults.push(label+' paints into its sampling gutter');
    for(const [px,py] of metadata.foreignProbes??[]){
     const x=Math.floor((b.left+(px+.5)*metadata.sourceFit)*density),y=Math.floor((b.top+(py+.5)*metadata.sourceFit)*density);
     foreignProbes++;if(pixels[(y*frame.cutWidth+x)*4+3]>32)faults.push(label+' borrowed a neighboring subject pixel');
    }
    if(metadata.sourcePath&&metadata.sourceRegion)regions.push({path:metadata.sourcePath,region:metadata.sourceRegion,size:metadata.sourceImageSize,frame:label,isolated:metadata.isolatedSubject===true});
   }
  }
  // Distinct crops in one PNG must not borrow another pose's pixels.
  const overlaps:string[]=[],sourceEdges:string[]=[];
  for(let i=0;i<regions.length;i++){
   const a=regions[i],[x,y,w,h]=a.region;
   if(x<0||y<0||x+w>a.size[0]||y+h>a.size[1])faults.push(a.frame+' reads outside its PNG');
   if(x===0||y===0||x+w===a.size[0]||y+h===a.size[1])sourceEdges.push(a.frame);
   for(let j=i+1;j<regions.length;j++){
    const b=regions[j];if(a.path!==b.path)continue;const [bx,by,bw,bh]=b.region;
    if(x===bx&&y===by&&w===bw&&h===bh)continue;
    if(x<bx+bw&&bx<x+w&&y<by+bh&&by<y+h&&(!a.isolated||!b.isolated))overlaps.push(a.frame+' / '+b.frame);
   }
  }
  return {checked,foreignProbes,faults,overlaps,sourceEdges,regions};
 });
 await test.info().attach('all-enemy-atlas-audit.json',{body:JSON.stringify(audit,null,2),contentType:'application/json'});
 console.log('Enemy frame audit',audit.checked,'frames;',audit.foreignProbes,'neighbor-pixel probes; source-edge crops:',audit.sourceEdges);
 expect(audit.checked).toBeGreaterThan(250);expect(audit.faults).toEqual([]);expect(audit.overlaps).toEqual([]);expect(audit.sourceEdges).toEqual([]);expect(errors).toEqual([]);
});
