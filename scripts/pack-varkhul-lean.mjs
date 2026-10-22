// Offline packing of complete generated poses. No artwork is stitched,
// recolored or stretched. Runtime consumes these registered, padded images.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {readRgbaPng,writeRgbaPng} from './lib/png-rgba.mjs';
import {drawPackedPose} from './lib/hero-sprite-packing.mjs';
registerHooks({resolve(s,c,next){try{return next(s,c);}catch(error){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw error;}}});
const {actorSpriteSubjects}=await import('../src/game/systems/spriteComponents.ts');
const folder='docs/art/varkhul-lean-v1',output='public/assets/enemies/varkhul-lean-v1';
const sideWalkRegistration=JSON.parse(await readFile(`${folder}/side-walk-registration-v3.json`,'utf8'));
await mkdir(output,{recursive:true});
const sheets={};
for(const [kind,columns,rows] of [['walk',5,4],['attack',3,2],['hurt',3,2],['death',3,2],['fly',3,2],
 ['side-walk-approved',4,2]]){
 const source=readRgbaPng(await readFile(kind==='side-walk-approved'?sideWalkRegistration.sourcePath:`${folder}/${kind}.png`));
 sheets[kind]={...source,poses:actorSpriteSubjects(source.pixels,source.width,source.height,columns,rows)};
 console.log(kind,source.width,source.height,JSON.stringify(sheets[kind].poses.map(p=>p.region)));
}
// Mechanical complete-pose reference extraction: no rescaling, recoloring or
// limb edits. Keep approved action anatomy unambiguous for walking redraws.
for(const [kind,index,name] of [['attack',5,'reference-attack-neutral'],['fly',1,'reference-flight-level']]){
 const pose=sheets[kind].poses[index];
 await writeFile(`${folder}/${name}.png`,writeRgbaPng(pose.region[2],pose.region[3],pose.pixels));
}
if(process.argv.includes('--references-only'))process.exit(0);
const density=2,gutter=6;
const walkRegistration=JSON.parse(await readFile(`${folder}/walk-registration-v1.json`,'utf8'));
// Authored source units: wings and a rearing neck must not shrink the torso.
// These are clip scales, not per-frame silhouette-height fitting.
const scales={walk:.8,attack:.45,hurt:.48,death:.5,fly:.65};
function footX(pose){
 const [x,,w,h]=pose.region;let sum=0,weight=0;
 for(let y=Math.floor(h*.85);y<h;y++)for(let px=0;px<w;px++){
  const a=pose.pixels[(y*w+px)*4+3];if(a>128){sum+=(x+px)*a;weight+=a;}
 }
 return weight?sum/weight:x+w/2;
}
const jobs={ground:[],walk:[],fly:[]};
const reflectedPoses=new Map();
function reflectWholePose(pose){
 let reflected=reflectedPoses.get(pose);
 if(!reflected){
  const [,,w,h]=pose.region,pixels=new Uint8ClampedArray(pose.pixels.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const src=(y*w+x)*4,dest=(y*w+w-1-x)*4;
   pixels.set(pose.pixels.subarray(src,src+4),dest);
  }
  reflected={...pose,pixels};reflectedPoses.set(pose,reflected);
 }
 return reflected;
}
function put(page,frame,kind,index,rootX,rootY,mouth,scale=scales[kind]){
 const pose=sheets[kind].poses[index];
 jobs[page].push({frame,kind,index,pose,scale,rootX,rootY,mouth});
}
// Generated poses do not sit at exact equal-cell intervals. Register each
// COMPLETE pose to the same torso landmark and planted-claw baseline instead;
// tail curl and reaching feet must not drag the body sideways between steps.
for(let row=0;row<4;row++){
 if(row===1||row===2)continue;
 const neutral=sheets.walk.poses[row*5],clip=walkRegistration.directions[row];
 const rootX=footX(neutral);
 for(let i=0;i<5;i++)put('walk',row*5+i,'walk',row*5+i,
   rootX+clip.torsoX[i]-clip.torsoX[0],clip.groundY[i],undefined,clip.scale);
}
function putSide(page,frame,index){
 put(page,frame,'side-walk-approved',index,sideWalkRegistration.rootX[index],
  sideWalkRegistration.groundY[index],undefined,sideWalkRegistration.scale);
}
// Preserve legacy neutral/four-step IDs; append the remaining four steps.
// Left-facing aliases share the same pixels/trim as the right-facing ones.
// Enemy.playLocomotion mirrors the whole actor, including its origin.
for(const frame of [5,10])putSide('walk',frame,0);
sideWalkRegistration.frameIds.forEach((frame,index)=>putSide('walk',frame,index));
for(let i=0;i<4;i++)putSide('walk',6+i,i);
// Legacy frame IDs are retained for all existing animation/combat consumers.
// Idle and generic walk aliases reuse complete right-facing authored poses.
for(let i=0;i<6;i++)putSide('ground',i,0);
for(let i=0;i<6;i++)putSide('ground',6+i,i);
// Jaw anchors are authored in the full source image, not guessed from frame
// width. Attack 0/1/2 are windup, roar and sustained breath/slam respectively.
const mouths=[[534,382],[945,111],[1509,383]];
for(const [kind,start,count] of [['attack',12,5],['hurt',17,6],['death',23,6]]){
 const source=sheets[kind],cw=source.width/3;
 const rootLocal=footX(source.poses[0]);
 for(let i=0;i<count;i++){
  const p=source.poses[i],row=Math.floor(i/3),column=i%3;
  put('ground',start+i,kind,i,rootLocal+column*cw,p.region[1]+p.region[3],kind==='attack'?mouths[i]:undefined);
 }
}
// Airborne roots follow the tucked feet below the torso, not the wing tips.
const flightRoots=[[260,535],[680,530],[1100,535],[260,1080],[680,1100],[1100,1125]];
for(let i=0;i<6;i++)put('fly',i,'fly',i,...flightRoots[i]);
const definitions={ground:{texture:'enemy_dragon',cell:[320,256],ground:232},
 walk:{texture:'enemy_walk_dragon',cell:[384,288],ground:232},
 fly:{texture:'enemy_dragon_fly',cell:[416,416],ground:320}};
// One common safety factor for every complete pose, never frame-by-frame
// scaling. This preserves source anatomy even when a tail reaches farther.
let common=1;
for(const [page,entries] of Object.entries(jobs)){
 const {cell:[fw,fh],ground}=definitions[page];
 for(const j of entries){
  const [x,y,w,h]=j.pose.region,left=(x-j.rootX)*j.scale,right=(x+w-j.rootX)*j.scale;
  const top=(y-j.rootY)*j.scale,bottom=(y+h-j.rootY)*j.scale;
  if(left<0)common=Math.min(common,(fw/2-4)/-left);
  if(right>0)common=Math.min(common,(fw/2-4)/right);
  if(top<0)common=Math.min(common,(ground-4)/-top);
  if(bottom>0)common=Math.min(common,(fh-ground-4)/bottom);
 }
}
if(common<=0)throw Error('Invalid Varkhul ground registration');
common*=.999;
const registration={version:1,density,commonScale:common,sideWalkFrames:sideWalkRegistration.frameIds,pages:{}};
for(const [page,entries] of Object.entries(jobs)){
 const {texture,cell:[fw,fh],ground}=definitions[page],unique=new Map(),frames={};
 for(const j of entries){
  j.scale*=common;
  const [sx,sy,w,h]=j.pose.region;
  const left=fw/2+(sx-j.rootX)*j.scale,top=ground+(sy-j.rootY)*j.scale;
  const tx=Math.floor(left*density)-2,ty=Math.floor(top*density)-2;
  const width=Math.ceil((left+w*j.scale)*density)-tx+2,height=Math.ceil((top+h*j.scale)*density)-ty+2;
  if(tx<0||ty<0||tx+width>fw*density||ty+height>fh*density)throw Error(`Varkhul pose exceeds virtual cell: ${page}/${j.frame}`);
  const identity=`${j.kind}/${j.index}/${j.rootX}/${j.rootY}/${j.scale}`;
  let packed=unique.get(identity);
  if(!packed){packed={...j,left,top,tx,ty,width,height};unique.set(identity,packed);}
  frames[j.frame]={job:packed,trim:[fw*density,fh*density,tx,ty,width,height],
   visibleBounds:{left,top,width:w*j.scale,height:h*j.scale},
   ...(j.mouth?{mouth:{x:fw/2+(j.mouth[0]-j.rootX)*j.scale,y:ground+(j.mouth[1]-j.rootY)*j.scale}}:{})};
 }
 const width=2048;let x=gutter,y=gutter,rowHeight=0;
 for(const j of [...unique.values()].sort((a,b)=>b.height-a.height)){
  if(x+j.width+gutter>width){x=gutter;y+=rowHeight+gutter*2;rowHeight=0;}
  j.x=x;j.y=y;x+=j.width+gutter*2;rowHeight=Math.max(rowHeight,j.height);
 }
 const height=Math.ceil((y+rowHeight+gutter)/4)*4;
 if(height>2048)throw Error(`Varkhul ${page} atlas exceeds 2048px page`);
 const pixels=Buffer.alloc(width*height*4);
 for(const j of unique.values()){
  const local=Buffer.alloc(j.width*j.height*4);
  drawPackedPose(local,j.width,j.pose,j.left*density-j.tx,j.top*density-j.ty,j.scale*density);
  for(let py=0;py<j.height;py++)local.copy(pixels,((j.y+py)*width+j.x)*4,py*j.width*4,(py+1)*j.width*4);
 }
 for(const entry of Object.values(frames)){
  const j=entry.job;entry.rect=[j.x,j.y,j.width,j.height];delete entry.job;
 }
 const path=`assets/enemies/varkhul-lean-v1/${page}.png`;
 await writeFile('public/'+path,writeRgbaPng(width,height,pixels));
 registration.pages[page]={texture,path,width,height,groundPadding:fh-ground,frames};
 console.log(`Packed ${texture}: ${width}x${height}, ${unique.size} unique poses, ${(width*height*4/1048576).toFixed(2)} MiB RGBA`);
}
await writeFile('src/data/varkhulAtlas.json',JSON.stringify(registration,null,2)+'\n');
// Static authoring contact sheet, not a browser/gameplay test. Each slot shows
// the registered COMPLETE pose against the same horizontal ground line.
const previewWidth=1600,previewHeight=960,preview=Buffer.alloc(previewWidth*previewHeight*4);
for(let i=0;i<preview.length;i+=4){preview[i]=24;preview[i+1]=27;preview[i+2]=31;preview[i+3]=255;}
const review=[...([0,5,10,15].map(i=>['walk',i])),...([12,13,14,17].map(i=>['ground',i])),['fly',0],['fly',3],['fly',5],['ground',28]];
for(const [slot,[page,frame]] of review.entries()){
 const j=jobs[page].find(j=>j.frame===frame),{cell:[fw],ground}=definitions[page];
 const cx=slot%4*400+200,baseline=Math.floor(slot/4)*320+270;
 for(let x=cx-180;x<cx+180;x++){const at=(baseline*previewWidth+x)*4;preview[at]=115;preview[at+1]=103;preview[at+2]=73;}
 const [sx,sy,w]=j.pose.region,mirrored=page==='walk'&&frame===5;
 const rootX=mirrored?sx*2+w-j.rootX:j.rootX,pose=mirrored?reflectWholePose(j.pose):j.pose;
 drawPackedPose(preview,previewWidth,pose,cx+(sx-rootX)*j.scale,baseline+(sy-j.rootY)*j.scale,j.scale);
}
await writeFile(`${folder}/registered-preview.png`,writeRgbaPng(previewWidth,previewHeight,preview));
// Full static walking contact sheet for authoring inspection. This does not
// launch the game, evaluate animation timing or replace a rendered review.
const strideWidth=2880,strideHeight=1200,stride=Buffer.alloc(strideWidth*strideHeight*4);
for(let i=0;i<stride.length;i+=4){stride[i]=24;stride[i+1]=27;stride[i+2]=31;stride[i+3]=255;}
const strideRows=[[0,1,2,3,4],[5,...sideWalkRegistration.frameIds],[10,...sideWalkRegistration.frameIds],[15,16,17,18,19]];
for(const [row,frames] of strideRows.entries())for(const [column,frame] of frames.entries()){
 const j=jobs.walk.find(job=>job.frame===frame),cx=column*320+160,baseline=row*300+240;
 for(let x=cx-150;x<cx+150;x++){
  const at=(baseline*strideWidth+x)*4;stride[at]=115;stride[at+1]=103;stride[at+2]=73;
 }
 const [sx,sy,w]=j.pose.region,rootX=row===1?sx*2+w-j.rootX:j.rootX,pose=row===1?reflectWholePose(j.pose):j.pose;
 drawPackedPose(stride,strideWidth,pose,cx+(sx-rootX)*j.scale,baseline+(sy-j.rootY)*j.scale,j.scale);
}
await writeFile(`${folder}/walking-preview.png`,writeRgbaPng(strideWidth,strideHeight,stride));
// Standalone authoring playback, not a game launch or a browser test. Draw
// the SAME packed rectangles/trim offsets as runtime at one constant scale.
await writeFile(`${folder}/walking-preview.html`, `<!doctype html><html lang="en"><meta charset="utf-8">
<title>Varkhul walking art preview</title><style>body{background:#181b1f;color:#eee;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:12px}figure{margin:0}canvas{width:100%;max-width:640px;background:#181b1f;image-rendering:pixelated}button{padding:8px 16px}figcaption{padding:8px}</style>
<h1>Varkhul: registered walking artwork</h1><p>User-selected eight-frame side gait from walk-varkhul.png. Source pixels preserved without recoloring or stretching. Original down/up walks, side idle, attack and flight references are included for comparison. This is authoring playback of the packed artwork, not gameplay or Android verification.</p><button id="pause">Pause</button><main id="views"></main>
<script>
const registration=${JSON.stringify(registration)},views=[['Down','walk',[1,2,3,4]],['Left','walk',registration.sideWalkFrames,true],['Right','walk',registration.sideWalkFrames],['Up','walk',[16,17,18,19]],['Side idle','walk',[10]],['Existing attack reference','ground',[16]],['Existing flight reference','fly',[1]]];
let paused=false;document.getElementById('pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'Play':'Pause';};
Promise.all(Object.entries(registration.pages).map(([key,page])=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve([key,image]);image.onerror=()=>reject(new Error('Cannot load '+page.path));image.src='../../../public/'+page.path;}))).then(entries=>{
 const images=Object.fromEntries(entries),outputs=views.map(([label,key,frames,mirrored=false])=>{
  const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');
  canvas.width=640;canvas.height=400;caption.textContent=label;figure.append(canvas,caption);document.getElementById('views').append(figure);return {ctx:canvas.getContext('2d'),key,frames,mirrored};
 });
 let elapsed=0,previous=performance.now();function draw(now){if(!paused)elapsed+=Math.min(100,now-previous);previous=now;
  for(const {ctx,key,frames,mirrored} of outputs){const page=registration.pages[key],entry=page.frames[frames[Math.floor(elapsed/(frames.length===8?62.5:125))%frames.length]], [x,y,w,h]=entry.rect,[fw,fh,tx,ty]=entry.trim,scale=.65;
   ctx.clearRect(0,0,640,400);ctx.strokeStyle='#736749';ctx.beginPath();ctx.moveTo(0,310);ctx.lineTo(640,310);ctx.stroke();ctx.imageSmoothingEnabled=false;
   ctx.save();if(mirrored){ctx.translate(640,0);ctx.scale(-1,1);}ctx.drawImage(images[key],x,y,w,h,320+(tx-fw/2)*scale,310+(ty-(fh-page.groundPadding*registration.density))*scale,w*scale,h*scale);ctx.restore();
  }requestAnimationFrame(draw);
 }requestAnimationFrame(draw);
}).catch(error=>{document.getElementById('views').textContent=error.message;});
</script></html>`);
