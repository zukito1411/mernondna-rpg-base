import type Phaser from 'phaser';

// Measured source rectangles: generated views are intentionally not assumed to
// occupy exact grid cells (the side-view horse extends across the nominal seam).
export const VEHICLE_ART={
  boat:{path:'assets/vehicles/coastal-boat.png',regions:[[155,8,337,615],[646,42,595,542],[18,642,590,556],[817,617,334,617]]},
} as const;

export const MOTION_ART={
  'horse-east': 'assets/vehicles/horse-east-walk.png',
  'horse-south': 'assets/vehicles/horse-south-walk.png',
  'horse-north': 'assets/vehicles/horse-north-walk.png',
  'cart-parts': 'assets/vehicles/cart-parts.png',
  'water-foam': 'assets/vehicles/water-foam.png',
} as const;
export const BOAT_SCALE=1.25;
export const BOAT_HULL_CLEARANCE=190;
const boatHelms=[[260,460],[1150,482],[125,1100],[955,1100]];
export function boatHelm(frame:number){
  const [x,y,w,h]=VEHICLE_ART.boat.regions[frame],fit=280/617;
  return {x:(boatHelms[frame][0]-x-w/2)*fit*BOAT_SCALE,y:(boatHelms[frame][1]-y-h)*fit*BOAT_SCALE};
}
export interface CartArtPose {originX:number;originY:number;wheels:Array<{x:number;y:number}>;horse:{x:number;y:number}}
export const CART_ART_POSES:CartArtPose[]=[];

function cellBounds(pixels:ImageData,x:number,y:number,w:number,h:number){
  let left=x+w,top=y+h,right=x,bottom=y;
  for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)if(pixels.data[(py*pixels.width+px)*4+3]>64){
    left=Math.min(left,px);top=Math.min(top,py);right=Math.max(right,px);bottom=Math.max(bottom,py);
  }
  if(left>right)throw new Error('An animation cell has no visible artwork.');
  return {x:left,y:top,w:right-left+1,h:bottom-top+1};
}

/** Register all strides using one scale and one head-top baseline per direction.
 * Individual hoof poses never stretch the body to fill their cell. */
function prepareMotionSheet(scene:Phaser.Scene,key:string,targetHeight:number){
  const source=scene.textures.get('motion-source:'+key).getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const sourceCtx=canvas.getContext('2d')!;sourceCtx.drawImage(source,0,0);
  const pixels=sourceCtx.getImageData(0,0,canvas.width,canvas.height);
  const cellW=Math.floor(source.width/2),cellH=Math.floor(source.height/2);
  const bounds=Array.from({length:4},(_,i)=>cellBounds(pixels,(i%2)*cellW,Math.floor(i/2)*cellH,cellW,cellH));
  const cell=256,fit=Math.min(236/Math.max(...bounds.map(b=>b.w)),targetHeight/Math.max(...bounds.map(b=>b.h)));
  const texture=scene.textures.createCanvas(key,cell*2,cell*2)!,ctx=texture.getContext();
  const top=252-Math.max(...bounds.map(b=>b.h))*fit;
  bounds.forEach((b,i)=>{
    const x=i%2*cell,y=Math.floor(i/2)*cell;
    ctx.drawImage(source,b.x,b.y,b.w,b.h,x+(cell-b.w*fit)/2,y+top,b.w*fit,b.h*fit);
    texture.add(i,0,x,y,cell,cell);
  });
  texture.refresh();scene.textures.remove('motion-source:'+key);
}

function prepareCartParts(scene:Phaser.Scene){
  const source=scene.textures.get('motion-source:cart-parts').getSourceImage() as HTMLImageElement;
  const regions=[[252,13,330,337],[843,56,620,232],[71,408,622,248],[1000,363,336,317]];
  const axles=[[[259,192],[569,192]],[[1208,264],[1385,264]],[[141,626],[314,626]],[[1005,588],[1320,588]]];
  const roots=[[414,192],[1296.5,264],[227.5,626],[1162.5,588]];
  const texture=scene.textures.createCanvas('traffic-cart',768,768)!,ctx=texture.getContext(),fit=320/622;
  const sx=source.width/1536,sy=source.height/1024;
  CART_ART_POSES.length=0;
  regions.forEach(([x,y,w,h],i)=>{
    const left=192-w*fit/2,top=364-h*fit,baseX=i%2*384,baseY=Math.floor(i/2)*384;
    ctx.drawImage(source,x*sx,y*sy,w*sx,h*sy,baseX+left,baseY+top,w*fit,h*fit);
    texture.add(i,0,baseX,baseY,384,384);
    const rootX=left+(roots[i][0]-x)*fit,rootY=top+(roots[i][1]-y)*fit+36;
    CART_ART_POSES.push({originX:rootX/384,originY:rootY/384,
      wheels:axles[i].map(([ax,ay])=>({x:(left+(ax-x)*fit-rootX)/2,y:(top+(ay-y)*fit-rootY)/2})),
      horse:[{x:0,y:100},{x:-163,y:6},{x:163,y:6},{x:0,y:-65}][i]});
  });
  texture.refresh();
  const wheel=scene.textures.createCanvas('cart-wheel',96,96)!,wheelCtx=wheel.getContext();
  wheelCtx.drawImage(source,254*sx,722*sy,263*sx,267*sy,12,12,72,72);wheel.refresh();
  // Rotation precedes the perspective squash. Prebaked wheel frames preserve
  // the axle position and wheel ellipse instead of rotating an entire ellipse.
  const turns=scene.textures.createCanvas('cart-wheel-turns',768,192)!,turnCtx=turns.getContext();
  for(let i=0;i<16;i++){
    turnCtx.save();turnCtx.translate(i%8*96+48,Math.floor(i/8)*96+48);
    turnCtx.scale(1,.82);turnCtx.rotate(i/16*Math.PI*2);turnCtx.drawImage(wheel.getSourceImage() as HTMLCanvasElement,-48,-48);turnCtx.restore();
    turns.add(i,0,i%8*96,Math.floor(i/8)*96,96,96);
  }
  turns.refresh();scene.textures.remove('cart-wheel');scene.textures.remove('motion-source:cart-parts');
}

export function prepareVehicleArt(scene:Phaser.Scene){
  for(const [kind,definition] of Object.entries(VEHICLE_ART)){
    const source=scene.textures.get('vehicle-source:'+kind).getSourceImage() as HTMLImageElement;
    const texture=scene.textures.createCanvas('traffic-'+kind,768,768)!;
    const ctx=texture.getContext(),sourceScale=source.width/1254;
    const fit=280/Math.max(...definition.regions.flatMap(r=>[r[2],r[3]]));
    definition.regions.forEach(([x,y,w,h],i)=>{
      const left=(i%2)*384+(384-w*fit)/2,top=Math.floor(i/2)*384+364-h*fit;
      ctx.drawImage(source,x*sourceScale,y*sourceScale,w*sourceScale,h*sourceScale,left,top,w*fit,h*fit);
      texture.add(i,0,(i%2)*384,Math.floor(i/2)*384,384,384);
    });
    texture.refresh();scene.textures.remove('vehicle-source:'+kind);
    const rail=scene.textures.createCanvas('traffic-boat-rail',768,768)!,railCtx=rail.getContext();
    // Lower hull/rail pixels hide the helmsman's boots at the deck edge.
    definition.regions.forEach(([, , ,h],i)=>{
      const row=Math.floor(i/2)*384,column=i%2*384,band=h*fit*.22;
      railCtx.drawImage(texture.getSourceImage() as HTMLCanvasElement,column,row+364-band,384,band,column,row+364-band,384,band);
      rail.add(i,0,column,row,384,384);
    });rail.refresh();
  }
  prepareCartParts(scene);
  prepareMotionSheet(scene,'horse-east',160);
  prepareMotionSheet(scene,'horse-south',224);
  prepareMotionSheet(scene,'horse-north',200);
  prepareMotionSheet(scene,'water-foam',176);
}
