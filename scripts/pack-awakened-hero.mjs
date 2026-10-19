import {chromium} from '@playwright/test';
import {mkdir,readFile,writeFile,access,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const forms=[['varr','varr-rededge'],['warden','moonlit-oathblade'],['stonejaw','stonejaw-edge'],['iron-tusk','iron-tusk-fang'],['rootfather','rootfather-thornblade'],['salt-king','salt-kings-cutlass'],['frost-wyrm','wyrm-frostedge'],['ashen-seer','seer-obsidian-edge'],['varkhul','varkhul-emberfang']];
const states=['walk-down','walk-side','walk-up','idle-front','idle-side','run-side','attack','azure-cleave','skyfall-slam','crown-rally','crescent-flurry','ember-snare','iron-rush','iron-rush-up','iron-rush-down'];
const selection=prefix=>process.argv.find(a=>a.startsWith(prefix))?.slice(prefix.length).split(',');
const selectedForms=selection('--forms='),selectedStates=selection('--states=');
if(selectedForms?.some(s=>!forms.some(([slug])=>slug===s))||selectedStates?.some(s=>!states.includes(s)))throw Error('Unknown awakening form or animation selection');
// Complete skill masters have authored body pivots and fists, not the base
// outfit's crop envelopes. One native authoring path owns their registration.
const nativeStates=['azure-cleave','skyfall-slam','crown-rally','crescent-flurry','iron-rush-down'];
const requestedNative=nativeStates.filter(s=>!selectedStates||selectedStates.includes(s));
if(requestedNative.length){
 const packed=spawnSync(process.execPath,['scripts/pack-cosmetic-skills.mjs',...(selectedForms??[]),'--states='+requestedNative.join(',')],{stdio:'inherit'});
 if(packed.status!==0)throw Error('Complete skill preparation failed');
}
const uprightRunRequested=!selectedStates||selectedStates.includes('run-side');
if(uprightRunRequested){
 const packed=spawnSync(process.execPath,['scripts/pack-compact-side-run.mjs',...(selectedForms??[])],{stdio:'inherit'});
 if(packed.status!==0)throw Error('Upright running preparation failed');
}
if(selectedStates?.every(s=>nativeStates.includes(s)||s==='run-side'))process.exit(0);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[];
const force=process.argv.includes('--force');
try{
 const page=await browser.newPage();page.on('pageerror',e=>console.error(e.message));
 await page.goto('http://127.0.0.1:5174/tests/browser/awakeningFixture.html');
 await page.waitForFunction(()=>window.__awakeningReview||window.__awakeningError,{},{timeout:60000});
 const error=await page.evaluate(()=>window.__awakeningError);if(error)throw Error(error);
 const exists=async path=>{try{await access(path);return true;}catch{return false;}};
 for(const [slug,weaponId] of forms){
  if(selectedForms&&!selectedForms.includes(slug))continue;
  const root=`public/assets/characters/leigneron/awakened/${slug}`;
  const manifest=JSON.parse(await readFile(root+'/manifest-v1.json','utf8'));
  for(const state of states){
   if(nativeStates.includes(state)||state==='run-side')continue;
   if(selectedStates&&!selectedStates.includes(state))continue;
   const output=root+'/'+state+'-atlas-v1.png';
   const candidates=[4,3,2,1].flatMap(version=>[root+'/'+state+`-v${version}.png`,`docs/art/awakening-source/${slug}/${state}-v${version}.png`]);
   let source;for(const candidate of candidates)if(await exists(candidate)){source=candidate;break;}
   if(!source)continue;
   const previous=root+'/'+state+'-registration-v1.json';
   const layout=source.replace(/\.png$/,'.layout.json');
   const sourceStamp=Math.max((await stat(source)).mtimeMs,await exists(layout)?(await stat(layout)).mtimeMs:0);
   if(!force&&await exists(output)&&await exists(previous)&&(await stat(output)).mtimeMs>=sourceStamp){
    const meta=JSON.parse(await readFile(previous,'utf8'));
    if(meta.bodyRegistrationVersion===1){manifest.states[state]=meta;continue;}
   }
   try{
    const grid=await exists(layout)?JSON.parse(await readFile(layout,'utf8')):undefined;
    const result=await page.evaluate(({weaponId,state,url,grid})=>window.__awakeningReview.pack(weaponId,state,url,grid),{weaponId,state,url:'/'+source.replace(/^public\//,''),grid});
    await writeFile(output,Buffer.from(result.png.split(',')[1],'base64'));
    await writeFile(previous,JSON.stringify(result.spec));manifest.states[state]=result.spec;
    report.push({slug,state,...result.report});console.log('Registered',slug,state,result.report);
   }catch(e){report.push({slug,state,error:String(e)});console.error('Art registration needs correction:',slug,state,String(e));}
  }
  for(const kind of selectedStates?[]:['weapon','heart']){
   const source=await exists(root+'/'+kind+'-source-v1.png')?root+'/'+kind+'-source-v1.png':`docs/art/awakening-source/${slug}/${kind}-source-v1.png`;
   if(!await exists(source))continue;
   if(await exists(root+'/'+kind+'-v1.png')&&(await stat(root+'/'+kind+'-v1.png')).mtimeMs>=(await stat(source)).mtimeMs)continue;
   const result=await page.evaluate(({slug,kind,url})=>window.__awakeningReview.item(slug,kind,url),{slug,kind,url:'/'+source.replace(/^public\//,'')});
   await writeFile(root+'/'+kind+'-v1.png',Buffer.from(result.png.split(',')[1],'base64'));
  }
  if(Object.keys(manifest.states).length===states.length)await writeFile(root+'/manifest-v1.json',JSON.stringify(manifest));
 }
 await mkdir('test-results',{recursive:true});await writeFile('test-results/awakening-registration.json',JSON.stringify(report,null,2));
 if(report.some(r=>r.error))process.exitCode=1;
}finally{await browser.close();}
