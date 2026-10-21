// Offline packing of approved complete poses; no game launch or art editing.
// Share runtime silhouette isolation, retain all frame IDs/feet/palm anchors.
import {readFile,writeFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {readRgbaPng,writeRgbaPng} from './lib/png-rgba.mjs';
import {drawPackedPose} from './lib/hero-sprite-packing.mjs';
registerHooks({resolve(s,c,next){try{return next(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}});
const {actorSpriteGridSubjects}=await import('../src/game/systems/spriteComponents.ts');
const folder='public/assets/enemies/grand_magus',density=2,logicalCell=224,fw=logicalCell*density;
const poses={};
for(const kind of ['down','side','up','dissolve','bat']){
 const source=readRgbaPng(await readFile(`${folder}/${kind}-v1.png`));
 const dispersing=kind==='bat'||kind==='dissolve';
 poses[kind]=actorSpriteGridSubjects(source.pixels,source.width,source.height,kind==='bat'?4:3,kind==='bat'?1:2,
  {keepDetachedDetails:dispersing,rejectEdgeFragments:!dispersing});
}
const bodies=[...poses.down,...poses.side,...poses.up];
const natural=112/((poses.down[0].region[3]+poses.side[0].region[3]+poses.up[0].region[3])/3);
const fit=Math.min(natural,...bodies.map(p=>Math.min(200/p.region[2],196/p.region[3])));
const jobs=[],frames={},identities=new Map();let poseId=0;
function put(pose,frame,scale=fit,mirror=false,bat=false,hand=null){
 if(!identities.has(pose))identities.set(pose,poseId++);
 const [,,w,h]=pose.region,cell=bat?64:fw;
 const left=bat?(cell-w*scale*density)/2:(logicalCell-w*scale)/2*density;
 const top=bat?(cell-h*scale*density)/2:(210-h*scale)*density;
 const tx=Math.floor(left)-2,ty=Math.floor(top)-2;
 const width=Math.ceil(left+w*scale*density)-tx+2,height=Math.ceil(top+h*scale*density)-ty+2;
 if(tx<0||ty<0||tx+width>cell||ty+height>cell)throw Error('Pose outside virtual cell '+frame);
 const key=identities.get(pose)+':'+scale+':'+mirror+':'+bat;
 let job=jobs.find(j=>j.key===key);
 if(!job){job={key,pose,scale,mirror,tx,ty,width,height,left,top,cell};jobs.push(job);}
 const handX=hand?left+(hand[0]-pose.region[0])*scale*density:0;
 frames[frame]={job,trim:[cell,cell,mirror?cell-tx-width:tx,ty,width,height],
  visibleBounds:{left:left/density,top:top/density,width:w*scale,height:h*scale},
  castOrigin:hand?{x:mirror?cell-handX:handX,y:top+(hand[1]-pose.region[1])*scale*density}:null};
}
for(const [row,kind] of ['down','side','side','up'].entries()){
 const source=poses[kind],mirror=row===1;
 [0,1,0,1,0].forEach((p,i)=>put(source[p],row*5+i,fit,mirror));
 [4,5,0,0,0,0].forEach((p,i)=>put(source[p],20+row*6+i,fit,mirror));
 const hands=kind==='up'?[[1166,120],[111,627]]:kind==='side'?[[1394,150],[448,647]]:[[1365,98],[433,625]];
 put(source[2],44+row*2,fit,mirror,false,hands[0]);put(source[3],45+row*2,fit,mirror,false,hands[1]);
}
const dissolveFit=Math.min(fit,...poses.dissolve.map(p=>Math.min(200/p.region[2],196/p.region[3])));
poses.dissolve.forEach((p,i)=>put(p,52+i,dissolveFit));
const batFit=22/Math.max(...poses.bat.map(p=>Math.max(p.region[2],p.region[3])));
poses.bat.forEach((p,i)=>put(p,58+i,batFit,false,true));
// Deduplicate repeated idle/hold poses BEFORE packing. Trim transparent canvas,
// not artwork; each alias retains the original virtual dimensions and origin.
const width=2048,gutter=4;let x=gutter,y=gutter,rowHeight=0;
for(const job of [...jobs].sort((a,b)=>b.height-a.height)){
 if(x+job.width+gutter>width){x=gutter;y+=rowHeight+gutter*2;rowHeight=0;}
 job.x=x;job.y=y;x+=job.width+gutter*2;rowHeight=Math.max(rowHeight,job.height);
}
const height=Math.ceil((y+rowHeight+gutter)/4)*4;
if(height>2048)throw Error('HD Magus atlas exceeds bounded GPU page');
const pixels=Buffer.alloc(width*height*4);
for(const j of jobs){
 const local=Buffer.alloc(j.width*j.height*4);
 drawPackedPose(local,j.width,j.pose,j.left-j.tx,j.top-j.ty,j.scale*density);
 for(let py=0;py<j.height;py++)for(let px=0;px<j.width;px++){
  const source=(py*j.width+(j.mirror?j.width-1-px:px))*4;
  local.copy(pixels,((j.y+py)*width+j.x+px)*4,source,source+4);
 }
}
for(const entry of Object.values(frames)){
 const j=entry.job;entry.rect=[j.x,j.y,j.width,j.height];delete entry.job;
}
await writeFile(`${folder}/atlas-hd-v2.png`,writeRgbaPng(width,height,pixels));
await writeFile('src/data/grandMagusAtlas.json',JSON.stringify({version:2,density,width,height,frames},null,2)+'\n');
console.log(`Prepared ${jobs.length} unique complete poses / 62 frame IDs, ${width}x${height}, ${(width*height*4/1048576).toFixed(2)} MiB RGBA; same logical body/feet.`);
