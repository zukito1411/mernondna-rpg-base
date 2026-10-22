// Focused, explicitly requested browser review. All owned processes are closed
// in finally; the user's browser profile and running development server are not used.
import {chromium} from 'playwright';
import {spawn,execFile} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {readRgbaPng} from './lib/png-rgba.mjs';
import {setTimeout as delay} from 'node:timers/promises';
import {promisify} from 'node:util';
const exec=promisify(execFile),directory='test-results/varkhul-model',port=5187;
// Re-evaluate already captured WebGL frames without booting the game again.
// Preserve raw samples so a rasterization tolerance never hides its evidence.
if(process.argv.includes('--pixels-only')){
 const report=JSON.parse(await readFile(directory+'/report.json','utf8'));
 if(!report.rasterizationGuardPixels)await writeFile(directory+'/raw-raster-report.json',JSON.stringify(report,null,2));
 const registration=JSON.parse(await readFile('src/data/varkhulAtlas.json','utf8'));
 const atlases=new Map();
 for(const page of Object.values(registration.pages))atlases.set(page.texture,{page,image:readRgbaPng(await readFile('public/'+page.path))});
 const background=[24,32,39],contrast=(pixels,i)=>Math.max(...background.map((c,k)=>Math.abs(pixels[i+k]-c)));
 for(const frame of report.frames){
  const {page,image}=atlases.get(frame.texture),entry=page.frames[frame.frame];
  const actual=readRgbaPng(await readFile(directory+'/'+frame.file));
  const [rx,ry,w,h]=entry.rect,[fw,fh,tx,ty]=entry.trim;
  const scale=.8,originY=1-page.groundPadding/(fh/registration.density);
  const sourceAt=(x,y)=>{
   const sx=Math.floor((x+.5-372)/(frame.mirrored?-scale:scale)+fw/2-tx);
   const sy=Math.floor((y+.5-580)/scale+fh*originY-ty);
   return sx<0||sy<0||sx>=w||sy>=h?-1:((ry+sy)*image.width+rx+sx)*4;
  };
  let missingPixels=0,foreignPixels=0,expectedPixels=0;
  for(let y=4;y<actual.height-4;y+=2)for(let x=4;x<actual.width-4;x+=2){
   const s=sourceAt(x,y),a=(y*actual.width+x)*4,alpha=s<0?0:image.pixels[s+3];
   if(alpha>224&&contrast(image.pixels,s)>48){
    expectedPixels++;
    if(contrast(actual.pixels,a)<10){
     let near=false;
     for(let dy=-3;dy<=3&&!near;dy++)for(let dx=-3;dx<=3;dx++)
      if(contrast(actual.pixels,((y+dy)*actual.width+x+dx)*4)>=16){near=true;break;}
     if(!near)missingPixels++;
    }
   }
   if(alpha<=4&&contrast(actual.pixels,a)>=16){
    let near=false;
    for(let dy=-3;dy<=3&&!near;dy++)for(let dx=-3;dx<=3;dx++){
     const n=sourceAt(x+dx,y+dy);if(n>=0&&image.pixels[n+3]>4){near=true;break;}
    }
    if(!near)foreignPixels++;
   }
  }
  frame.rawMissingPixels??=frame.missingPixels;Object.assign(frame,{missingPixels,foreignPixels,expectedPixels});
 }
 report.rasterizationGuardPixels=3;
 report.verification='Existing WebGL captures compared with their source atlas; symmetric 3px rasterization guard. No new game launch.';
 const failures=report.frames.filter(f=>f.gutterPixels||f.foreignPixels||f.missingPixels||f.expectedPixels<500);
 await writeFile(directory+'/report.json',JSON.stringify(report,null,2));
 const summary=`${report.frames.length} registered/mirrored WebGL poses; ${failures.length} bleed/clipping issues; ${report.errors.length} browser errors; ${report.missing.length} missing assets. CPU/WebGL edge sampling is compared with a symmetric 3px guard; the original raw report is retained. Desktop and mobile-sized live fire-breath views below. This is Chrome, not Android-device certification.`;
 const html=await readFile(directory+'/index.html','utf8');
 await writeFile(directory+'/index.html',html.replace(/<p>[^<]*<\/p>/,'<p>'+summary+'</p>'));
 console.log(JSON.stringify({frames:report.frames.length,failures,rawEdgeDifferences:report.frames.reduce((n,f)=>n+f.rawMissingPixels,0),
  missingPixels:report.frames.reduce((n,f)=>n+f.missingPixels,0),foreignPixels:report.frames.reduce((n,f)=>n+f.foreignPixels,0)}));
 if(failures.length)process.exitCode=1;
 process.exit(process.exitCode??0);
}
let server,browserServer,browser,context;
let serverLog='',browserPid,serverPid;
const errors=[],missing=[];
const exists=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
await mkdir(directory,{recursive:true});
try{
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 serverPid=server.pid;
 for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{serverLog=(serverLog+chunk.toString()).slice(-12000);});
 await new Promise((resolve,reject)=>{server.once('spawn',resolve);server.once('error',reject);});
 let ready=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error('Review server stopped: '+serverLog);
  try{if((await fetch(`http://127.0.0.1:${port}`)).ok){ready=true;break;}}catch{}
  await delay(250);
 }
 if(!ready)throw Error('Review server did not become ready: '+serverLog);
 browserServer=await chromium.launchServer({channel:'chrome',headless:true,args:['--use-angle=default']});
 browserPid=browserServer.process().pid;
 browser=await chromium.connect(browserServer.wsEndpoint());
 context=await browser.newContext({viewport:{width:1280,height:1024},deviceScaleFactor:1});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400&&new URL(response.url()).pathname.startsWith('/assets/'))missing.push(response.status()+' '+response.url());});
 page.on('console',message=>{if(message.type()==='error')console.log('BROWSER:',message.text());});
 console.log('Opening isolated New Game for Varkhul review.');
 await page.goto(`http://127.0.0.1:${port}/?e2e`);
 await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'),null,{timeout:180000});
 const skip=page.getByRole('button',{name:/Skip scene/});if(await skip.isVisible())await skip.click();
 await page.waitForFunction(()=>!window.__mernondnaGame.scene.getScene('world')['cinematicDirector'].active,null,{timeout:30000});
 // Pause actual gameplay; inspection does not allow the player to die or save.
 await page.evaluate(async()=>{const path='/src/store/gameStore.ts';const {useGameStore}=await import(path);useGameStore.getState().openPanel('pause');});
 console.log('Production boot ready. Inspecting every actual GPU frame and mirrored combat/flight pose.');
 const frames=await page.evaluate(async()=>{
  const path='/tests/browser/varkhulModelFixture.ts';const {reviewVarkhulFrames}=await import(path);
  return reviewVarkhulFrames(window.__mernondnaGame);
 });
 for(const frame of frames){
  frame.file=`${frame.texture}-${frame.frame}${frame.mirrored?'-mirrored':''}.png`;
  await writeFile(directory+'/'+frame.file,Buffer.from(frame.png.split(',')[1],'base64'));delete frame.png;
 }
 console.log('GPU frame capture complete:',frames.length,'poses.');
 const live=[];
 await page.addStyleTag({content:'.hud-layer,.mobile-controls,.toast,[role="dialog"]{visibility:hidden!important}'});
 // Use the actual world dragon controller and fire effect, not a mock effect.
 await page.evaluate(async()=>{
  const path='/src/data/dragonLair.ts';const {DRAGON_LAIR}=await import(path);
  const s=window.__mernondnaGame.scene.getScene('world');
  s.player.restoreAt(DRAGON_LAIR.x+360,DRAGON_LAIR.y);s.streamCinematicView(DRAGON_LAIR.x,DRAGON_LAIR.y);
  s.cameras.main.stopFollow();s.cameras.main.centerOn(DRAGON_LAIR.x+120,DRAGON_LAIR.y-70);
  s['lastSafe']={x:s.player.x,y:s.player.y};
 });
 await page.waitForFunction(()=>window.__mernondnaGame.scene.getScene('world').getCombatEnemies().some(e=>e.instanceId==='boss:varkhul'));
 for(const viewport of [{width:1280,height:720},{width:844,height:390}]){
  await page.setViewportSize(viewport);await delay(150);
  for(const direction of [{name:'east',x:1,y:0},{name:'west',x:-1,y:0},{name:'north',x:0,y:-1},{name:'south',x:0,y:1}]){
   const result=await page.evaluate(async direction=>{
    const path='/src/data/dragonLair.ts';const {DRAGON_LAIR}=await import(path);
    const s=window.__mernondnaGame.scene.getScene('world'),e=s.getCombatEnemies().find(e=>e.instanceId==='boss:varkhul');
    e.body.reset(DRAGON_LAIR.x,DRAGON_LAIR.y);e.setFlipX(direction.x<0);
    s.player.restoreAt(e.x+direction.x*360-direction.y*240,e.y+direction.y*360+direction.x*240);
    s.cameras.main.setZoom(viewportScale()).centerOn(e.x+direction.x*150,e.y+direction.y*120-75);
    function viewportScale(){return window.innerWidth<900?.62:.8;}
    const controller=e['dragonCombat'];controller.aim.set(direction.x,direction.y);
    controller.startBreath();
    for(let i=0;i<3&&(controller.phase==='flight'||controller.phase==='landing');i++){controller.age=10000;controller.update(0);}
    if(controller.phase!=='breath-windup')throw Error('No valid breath firing lane for '+direction.name);
    controller.enter('breath');controller.breathPose(2);controller.age=500;controller.update(0);
    const fire=s.children.getByName('dragon-fire:boss:varkhul'),mouth=e.frame.customData.mouth;
    const expected={x:e.x+(e.flipX?-1:1)*(mouth.x*2-e.originX*e.frame.realWidth)*e.scaleX,
     y:e.y+(mouth.y*2-e.originY*e.frame.realHeight)*e.scaleY};
    const expectedAngle=e.flipX?Math.PI:0;
    return {direction:direction.name,visible:fire.visible,flipped:e.flipX,mouth,actual:{x:fire.x,y:fire.y},expected,
     angleError:Math.abs(fire.rotation-expectedAngle),
     attachmentError:Math.hypot(fire.x-expected.x,fire.y-expected.y)};
   },direction);
   const file=`breath-${direction.name}-${viewport.width}.png`;await page.screenshot({path:directory+'/'+file});
   live.push({...result,viewport:viewport.width,file});
  }
 }
 const report={frames,live,errors,missing};
 await writeFile(directory+'/report.json',JSON.stringify(report,null,2));
 const failures=frames.filter(f=>f.gutterPixels||f.foreignPixels||f.missingPixels||f.expectedPixels<500);
 const pictures=[...live,...frames];
 await writeFile(directory+'/index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Varkhul GPU review</title><style>body{margin:24px;background:#13191f;color:#eee;font:15px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}figure{margin:0;padding:8px;background:#202b34}img{width:100%;height:auto}a{color:#edbd77}figcaption{padding:8px}</style><h1>Varkhul — actual renderer review</h1><p>${frames.length} registered/mirrored GPU poses; ${failures.length} frame issues; ${errors.length} browser errors; ${missing.length} missing assets. Desktop and mobile-sized live fire-breath views below. This is Chrome, not Android-device certification.</p><main>${pictures.map(p=>`<figure><a href="${p.file}"><img loading="lazy" src="${p.file}"></a><figcaption>${p.file}${'gutterPixels'in p?` · gutter ${p.gutterPixels}, foreign ${p.foreignPixels}`:` · attachment error ${p.attachmentError}`}</figcaption></figure>`).join('')}</main></html>`);
 console.log(JSON.stringify({frames:frames.length,failures,missingPixels:frames.reduce((n,f)=>n+f.missingPixels,0),
  minVisibleSamplePixels:Math.min(...frames.map(f=>f.expectedPixels)),live:live.map(v=>({direction:v.direction,viewport:v.viewport,visible:v.visible,error:v.attachmentError})),errors,missing}));
 if(failures.length||live.some(v=>!v.visible||v.attachmentError>.01||v.angleError>.001)||errors.length||missing.length)throw Error('Varkhul review found issues; see '+directory+'/report.json');
}finally{
 await context?.close().catch(()=>{});
 await browser?.close().catch(()=>{});
 await browserServer?.close().catch(()=>{});
 if(serverPid&&exists(serverPid)){
  if(process.platform==='win32')await exec('taskkill.exe',['/PID',String(serverPid),'/T','/F'],{windowsHide:true}).catch(()=>{});
  else server.kill('SIGTERM');
 }
 for(let i=0;i<30&&[serverPid,browserPid].some(pid=>pid&&exists(pid));i++)await delay(100);
 const remaining=[serverPid,browserPid].filter(pid=>pid&&exists(pid));
 await writeFile(directory+'/cleanup.json',JSON.stringify({serverPid,browserPid,remaining,closed:remaining.length===0},null,2));
 console.log('Owned server/browser cleanup:',remaining.length?'remaining PIDs '+remaining.join(','):'complete');
 if(remaining.length)process.exitCode=1;
}
