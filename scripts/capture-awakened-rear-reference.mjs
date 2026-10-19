import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const slugs=['varr','warden','stonejaw','iron-tusk','rootfather','salt-king','frost-wyrm','ashen-seer','varkhul'];
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.goto('http://127.0.0.1:5174/tests/browser/awakeningFixture.html?e2e=1');
 await page.waitForFunction(()=>window.__awakeningReview);
 await mkdir('test-results/awakening/rear-reference',{recursive:true});
 for(const slug of slugs){
  await page.evaluate(slug=>window.__awakeningReview.select(slug),slug);
  await page.waitForFunction(slug=>window.__awakeningReview.ready()===slug,slug,{timeout:25000});
  const png=await page.evaluate(async()=>{
   const r=window.__awakeningReview,s=r.scene;r.pose('leigneron_attack',18);
   s.cameras.main.setZoom(6).centerOn(650,315);s.cameras.main.ignore(s.original);
   for(const child of s.children.list)if(child.name==='equipped-sword'||child.name==='equipped-sword-hand')s.cameras.main.ignore(child);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   return await new Promise(resolve=>s.game.renderer.snapshotArea(384,104,512,512,image=>resolve(image.src)));
  });
  await writeFile(`test-results/awakening/rear-reference/${slug}.png`,Buffer.from(png.split(',')[1],'base64'));
 }
}finally{await browser.close();}
