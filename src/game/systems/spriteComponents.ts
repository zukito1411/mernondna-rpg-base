import type {SpriteRegion} from '../../data/art';
import {alphaFrameBounds} from './spriteArt';
/** Generated sheets have approximate spacing. Segment whole subjects before
 * assigning rows, so a toe crossing a grid seam cannot enter the next pose. */
export interface ActorSpriteSubject {region:SpriteRegion;pixels:Uint8ClampedArray;foreignProbes:Array<readonly [number,number]>}
export function actorSpriteGridSubjects(pixels:Uint8ClampedArray,width:number,height:number,columns:number,rows:number):ActorSpriteSubject[]{
 if(width%columns||height%rows)throw new Error('Actor sprite sheet does not match its declared frame grid.');
 const cellWidth=width/columns,cellHeight=height/rows,subjects:ActorSpriteSubject[]=[];
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const cellX=column*cellWidth,cellY=row*cellHeight,labels=new Uint32Array(cellWidth*cellHeight);
  const queue=new Int32Array(cellWidth*cellHeight),components:Array<{label:number;count:number;left:number;right:number;top:number;bottom:number}>=[];
  for(let start=0;start<labels.length;start++){
   const source=(cellY+Math.floor(start/cellWidth))*width+cellX+start%cellWidth;
   if(labels[start]||pixels[source*4+3]<=64)continue;
   const label=components.length+1;let head=0,tail=1,left=cellWidth,right=0,top=cellHeight,bottom=0;
   queue[0]=start;labels[start]=label;
   while(head<tail){
    const index=queue[head++],x=index%cellWidth,y=Math.floor(index/cellWidth);
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const nx=x+dx,ny=y+dy;if(nx<0||nx>=cellWidth||ny<0||ny>=cellHeight)continue;
     const next=ny*cellWidth+nx,nextSource=(cellY+ny)*width+cellX+nx;
     if(!labels[next]&&pixels[nextSource*4+3]>64){labels[next]=label;queue[tail++]=next;}
    }
   }
   components.push({label,count:tail,left,right,top,bottom});
  }
  if(!components.length)throw new Error(`Empty actor sprite frame ${row*columns+column}.`);
  const main=components.reduce((largest,part)=>part.count>largest.count?part:largest);
  const kept=components.filter(part=>{
   const dx=Math.max(main.left-part.right-1,part.left-main.right-1,0);
   const dy=Math.max(main.top-part.bottom-1,part.top-main.bottom-1,0);
   return part===main||Math.hypot(dx,dy)<=8;
  });
  const left=Math.max(0,Math.min(...kept.map(part=>part.left))-2);
  const top=Math.max(0,Math.min(...kept.map(part=>part.top))-2);
  const right=Math.min(cellWidth,Math.max(...kept.map(part=>part.right))+3);
  const bottom=Math.min(cellHeight,Math.max(...kept.map(part=>part.bottom))+3);
  const cropWidth=right-left,cropHeight=bottom-top,region:SpriteRegion=[cellX+left,cellY+top,cropWidth,cropHeight];
  const crop=new Uint8ClampedArray(cropWidth*cropHeight*4),keptLabels=new Set(kept.map(part=>part.label));
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
   const label=labels[y*cellWidth+x];
   let belongs=keptLabels.has(label);
   if(!belongs&&pixels[((cellY+y)*width+cellX+x)*4+3]){
    for(let dy=-2;dy<=2&&!belongs;dy++)for(let dx=-2;dx<=2;dx++){
     const nx=x+dx,ny=y+dy;
     if(nx>=0&&nx<cellWidth&&ny>=0&&ny<cellHeight&&keptLabels.has(labels[ny*cellWidth+nx])){belongs=true;break;}
    }
   }
   if(belongs){
    const source=((cellY+y)*width+cellX+x)*4,target=((y-top)*cropWidth+x-left)*4;
    crop.set(pixels.subarray(source,source+4),target);
   }
  }
  subjects.push({region,pixels:crop,foreignProbes:[]});
 }
 return subjects;
}
export function actorSpriteSubjects(pixels:Uint8ClampedArray,width:number,height:number,columns:number,rows:number):ActorSpriteSubject[]{
 const labels=new Uint32Array(width*height),queue=new Int32Array(width*height);
 const components:Array<{region:SpriteRegion;count:number;label:number}>=[];
 for(let start=0;start<labels.length;start++){
  if(labels[start]||pixels[start*4+3]<=64)continue;
  const label=components.length+1;
  let head=0,tail=1,left=width,right=0,top=height,bottom=0;queue[0]=start;labels[start]=label;
  while(head<tail){
   const index=queue[head++],x=index%width,y=Math.floor(index/width);
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy;if(nx<0||nx>=width||ny<0||ny>=height)continue;
    const next=ny*width+nx;if(!labels[next]&&pixels[next*4+3]>64){labels[next]=label;queue[tail++]=next;}
   }
  }
  components.push({region:[left,top,right-left+1,bottom-top+1],count:tail,label});
 }
 components.sort((a,b)=>b.count-a.count);
 const main=components.slice(0,columns*rows);
 if(main.length!==columns*rows||main.some(c=>c.count<100))throw new Error('Directional sheet does not contain the expected complete actors.');
 const owners=new Map<number,number>(main.map(c=>[c.label,c.label]));
 // Keep nearby disconnected details (a claw or weapon tip) with their subject.
 for(const extra of components.slice(columns*rows)){
  const [x,y,w,h]=extra.region;let nearest=-1,distance=Infinity;
  main.forEach((c,i)=>{const [cx,cy,cw,ch]=c.region;
   const dx=Math.max(cx-x-w,x-cx-cw,0),dy=Math.max(cy-y-h,y-cy-ch,0),d=Math.hypot(dx,dy);
   if(d<distance){distance=d;nearest=i;}
  });
  if(distance<=12){const c=main[nearest],[cx,cy,cw,ch]=c.region;owners.set(extra.label,c.label);
   const left=Math.min(x,cx),top=Math.min(y,cy);c.region=[left,top,Math.max(x+w,cx+cw)-left,Math.max(y+h,cy+ch)-top];
  }
 }
 main.sort((a,b)=>(a.region[1]+a.region[3]/2)-(b.region[1]+b.region[3]/2));
 const ordered=Array.from({length:rows},(_,row)=>main.slice(row*columns,(row+1)*columns).sort((a,b)=>a.region[0]+a.region[2]/2-b.region[0]-b.region[2]/2)).flat();
 return ordered.map(actor=>{
  const [left,top,w,h]=actor.region,crop=new Uint8ClampedArray(w*h*4),foreign:number[]=[];
  for(let py=0;py<h;py++)for(let px=0;px<w;px++){
   const sx=left+px,sy=top+py,source=sy*width+sx,target=py*w+px;
   if(!pixels[source*4+3])continue;
   let owner=owners.get(labels[source]);
   // Preserve anti-aliased contours with their nearest connected subject.
   if(!labels[source]){
    let distance=Infinity;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
     const nx=sx+dx,ny=sy+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
     const candidate=owners.get(labels[ny*width+nx]),d=dx*dx+dy*dy;
     if(candidate!==undefined&&d<distance){distance=d;owner=candidate;}
    }
   }
   if(owner===actor.label)crop.set(pixels.subarray(source*4,source*4+4),target*4);
   else if(pixels[source*4+3]>200)foreign.push(target);
  }
  // Whole bounding rectangles can overlap even when figures do not. Retain
  // only this subject's pixels, and expose clear probe points for GPU audits.
  const foreignProbes:Array<readonly [number,number]>=[];
  for(const index of foreign){
   const px=index%w,py=Math.floor(index/w);if(px<3||py<3||px>=w-3||py>=h-3)continue;
   let clear=true;
   for(let dy=-3;dy<=3&&clear;dy++)for(let dx=-3;dx<=3;dx++)if(crop[((py+dy)*w+px+dx)*4+3]){clear=false;break;}
   if(clear){foreignProbes.push([px,py]);if(foreignProbes.length===3)break;}
  }
  return {region:actor.region,pixels:crop,foreignProbes};
 });
}

export function actorSpriteRegions(pixels:Uint8ClampedArray,width:number,height:number,columns:number,rows:number):SpriteRegion[]{
 return actorSpriteSubjects(pixels,width,height,columns,rows).map(s=>s.region);
}
