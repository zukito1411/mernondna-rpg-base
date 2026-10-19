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
 const setupError=await page.evaluate(()=>window.__awakeningError);if(setupError)throw Error(setupError);
 await mkdir('test-results/awakening',{recursive:true});const report=[],overview=[];
 for(const slug of slugs){
  const profile=await page.evaluate(slug=>window.__awakeningReview.select(slug),slug);
  await page.waitForFunction(slug=>window.__awakeningReview.ready()===slug,slug,{timeout:25000});
  const result=await page.evaluate(async ({slug,rearOnly})=>{
   const r=window.__awakeningReview,rows=rearOnly?r.rows.filter(s=>s.key==='leigneron'&&(s.offset===12||s.offset===18)||s.key==='leigneron_idle'||s.key==='leigneron_attack'&&s.offset===18):r.rows;
   const canvas=document.createElement('canvas');canvas.width=1320;canvas.height=rows.length*240;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#18221f';ctx.fillRect(0,0,canvas.width,canvas.height);const directions=[];
   for(let row=0;row<rows.length;row++){
    const s=rows[row];ctx.fillStyle='#f5dfb2';ctx.font='12px sans-serif';ctx.fillText(slug+' / '+s.label,8,row*240+14);
    for(let i=0;i<6;i++){
     r.pose(s.key,s.offset+i,s.flip);r.equipment(Boolean(s.stowed));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     const src=await r.capture(),image=new Image();image.src=src;await image.decode();ctx.drawImage(image,i*220,row*240+18,220,220);
     if(s.key==='leigneron'&&!s.stowed&&i===0)directions.push({label:s.label,png:await r.captureCosmetic()});
    }
   }
   return {png:canvas.toDataURL(),poses:rows.length*6,textures:r.textureCount(),directions};
  },{slug,rearOnly});
  if(result.textures>15)throw Error('Outfits accumulate instead of releasing textures: '+result.textures);
  await writeFile(`test-results/awakening/${slug}-${rearOnly?'rear-':''}rendered.png`,Buffer.from(result.png.split(',')[1],'base64'));
  report.push({slug,form:profile.form,weapon:profile.name,poses:result.poses,textures:result.textures});overview.push({slug,form:profile.form,weapon:profile.name,directions:result.directions});console.log('Rendered',slug,result.poses,'poses; retained outfit textures:',result.textures);
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(`test-results/awakening/${rearOnly?'rear-':requested.length?'targeted-':''}render-report.json`,JSON.stringify(report,null,2));
 if(!rearOnly){
  const png=await page.evaluate(async rows=>{
   const c=document.createElement('canvas');c.width=1100;c.height=80+rows.length*230;const x=c.getContext('2d');x.fillStyle='#18221f';x.fillRect(0,0,c.width,c.height);
   x.fillStyle='#f5dfb2';x.font='bold 24px sans-serif';x.fillText('Awakened Leigneron — all nine outfits and equipped weapons',20,32);
   x.font='16px sans-serif';['Down','Left','Right','Up'].forEach((s,i)=>x.fillText(s,300+i*200,65));
   for(let row=0;row<rows.length;row++){
    const r=rows[row],y=80+row*230;x.fillStyle='#f5dfb2';x.font='bold 17px sans-serif';x.fillText(r.form,15,y+85);x.font='14px sans-serif';x.fillText(r.weapon,15,y+110);
    for(let i=0;i<r.directions.length;i++){const image=new Image();image.src=r.directions[i].png;await image.decode();x.drawImage(image,280+i*200,y,125,220);}
   }
   return c.toDataURL();
  },overview);
  await writeFile('test-results/awakening/all-sides-overview.png',Buffer.from(png.split(',')[1],'base64'));
  const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Awakened Leigneron — rendered review</title><style>body{margin:24px;background:#18221f;color:#f5dfb2;font:16px system-ui}a{color:#bce3ff}img{display:block;max-width:100%;height:auto}details{margin:20px 0;padding:14px;border:1px solid #74674d}summary{cursor:pointer;font-weight:bold}.sheet{overflow:auto}.sheet img{max-width:none;width:1320px}small{display:block;margin:10px 0}</style><h1>Awakened Leigneron — all sides</h1><p>Real WebGL captures using the production cosmetic and weapon renderer. Each full-sheet cell shows the original body on the left and the awakened outfit on the right, both carrying the selected weapon. Six animation frames per row.</p><p>Includes all walking directions, mirrored side idles/sprinting and skill poses, four-direction attacks, vertical thrusts, and weapons resting on the back. Ember Snare correctly hides the weapon. Renewing Light shares Crown Rally poses; Barrage uses the directional thrust poses. This is a visual registration review, not a full combat/Android performance test.</p><a href="all-sides-overview.png">Open full-size all-sides overview</a><img src="all-sides-overview.png" alt="All awakened outfits and weapons in four directions">${report.map(r=>`<details><summary>${escape(r.form)} — ${escape(r.weapon)} (${r.poses} poses)</summary><small>Open <a href="${r.slug}-rendered.png">complete full-resolution sheet</a>. Pan horizontally below; images are not reduced.</small><div class="sheet"><img loading="lazy" src="${r.slug}-rendered.png" alt="${escape(r.form)} full rendered pose sheet"></div></details>`).join('')}`;
  await writeFile('test-results/awakening/index.html',html);
 }
}finally{await browser.close();}
