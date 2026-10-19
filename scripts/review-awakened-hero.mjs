import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const allSlugs=['varr','warden','stonejaw','iron-tusk','rootfather','salt-king','frost-wyrm','ashen-seer','varkhul'];
const requested=process.argv.slice(2).filter(a=>!a.startsWith('--')),slugs=requested.length?allSlugs.filter(s=>requested.includes(s)):allSlugs;
const rearOnly=process.argv.includes('--rear-only');
if(!slugs.length)throw Error('No matching awakened outfits selected');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5174/tests/browser/awakeningFixture.html?e2e=1');
 await page.waitForFunction(()=>window.__awakeningReview||window.__awakeningError,{},{timeout:60000});
 await mkdir('test-results/awakening',{recursive:true});const report=[];
 for(const slug of slugs){
  await page.evaluate(slug=>window.__awakeningReview.select(slug),slug);
  await page.waitForFunction(slug=>window.__awakeningReview.ready()===slug,slug,{timeout:25000});
  const result=await page.evaluate(async ({slug,rearOnly})=>{
   const r=window.__awakeningReview,rows=rearOnly?r.rows.filter(s=>s.key==='leigneron'&&(s.offset===12||s.offset===18)||s.key==='leigneron_idle'||s.key==='leigneron_attack'&&s.offset===18):r.rows;
   const canvas=document.createElement('canvas');canvas.width=1320;canvas.height=rows.length*240;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#18221f';ctx.fillRect(0,0,canvas.width,canvas.height);
   for(let row=0;row<rows.length;row++){
    const s=rows[row];ctx.fillStyle='#f5dfb2';ctx.font='12px sans-serif';ctx.fillText(slug+' / '+s.label,8,row*240+14);
    for(let i=0;i<6;i++){
     r.pose(s.key,s.offset+i,s.flip);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     const src=await r.capture(),image=new Image();image.src=src;await image.decode();ctx.drawImage(image,i*220,row*240+18,220,220);
    }
   }
   return {png:canvas.toDataURL(),poses:rows.length*6,textures:r.textureCount()};
  },{slug,rearOnly});
  if(result.textures>15)throw Error('Outfits accumulate instead of releasing textures: '+result.textures);
  await writeFile(`test-results/awakening/${slug}-${rearOnly?'rear-':''}rendered.png`,Buffer.from(result.png.split(',')[1],'base64'));
  report.push({slug,poses:result.poses,textures:result.textures});console.log('Rendered',slug,result.poses,'poses; retained outfit textures:',result.textures);
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(`test-results/awakening/${rearOnly?'rear-':requested.length?'targeted-':''}render-report.json`,JSON.stringify(report,null,2));
}finally{await browser.close();}
