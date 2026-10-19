// Offline mechanical packing only; complete generated poses are never edited.
export function spriteHeadCenter(pose){
 const [,,w,h]=pose.region;let sum=0,weight=0;
 for(let y=0;y<Math.ceil(h*.26);y++)for(let x=0;x<w;x++){
  const alpha=pose.pixels[(y*w+x)*4+3];if(alpha>128){sum+=x*alpha;weight+=alpha;}
 }
 if(!weight)throw Error('Missing hero head');return sum/weight;
}
export function spriteHeadWidth(pose){
 const [,,w,h]=pose.region;let width=0;
 for(let y=0;y<Math.ceil(h*.30);y++){
  let left=w,right=-1;for(let x=0;x<w;x++)if(pose.pixels[(y*w+x)*4+3]>64){left=Math.min(left,x);right=Math.max(right,x);}
  width=Math.max(width,right-left+1);
 }
 if(!width)throw Error('Missing hero head width');return width;
}
/** Premultiplied-alpha atlas resampling, not body-part editing or stitching. */
export function drawPackedPose(target,atlasWidth,pose,dx,dy,scale){
 const [,,w,h]=pose.region,outWidth=w*scale,outHeight=h*scale;
 for(let y=Math.floor(dy);y<Math.ceil(dy+outHeight);y++)for(let x=Math.floor(dx);x<Math.ceil(dx+outWidth);x++){
  const sx=(x+.5-dx)/scale-.5,sy=(y+.5-dy)/scale-.5,x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
  let alpha=0;const rgb=[0,0,0];
  for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++){
   const px=x0+ox,py=y0+oy;if(px<0||py<0||px>=w||py>=h)continue;
   const index=(py*w+px)*4,weight=(ox?fx:1-fx)*(oy?fy:1-fy),a=pose.pixels[index+3]*weight;
   alpha+=a;for(let c=0;c<3;c++)rgb[c]+=pose.pixels[index+c]*a;
  }
  if(alpha>0){const at=(y*atlasWidth+x)*4;for(let c=0;c<3;c++)target[at+c]=Math.round(rgb[c]/alpha);target[at+3]=Math.round(alpha);}
 }
}
