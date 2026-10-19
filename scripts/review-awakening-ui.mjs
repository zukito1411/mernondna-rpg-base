import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5174/tests/browser/awakeningUiFixture.html?e2e=1');
 await page.waitForFunction(()=>window.__awakeningUi);await mkdir('test-results/awakening',{recursive:true});
 for(const [name,width,height] of [['desktop',1280,720],['phone',390,844],['phone-landscape',844,390]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>window.__awakeningUi.showBag());
  const bag=page.getByRole('dialog',{name:'Bag and equipment',exact:true});await bag.waitFor();
  const bounds=await bag.locator('.inventory-panel').boundingBox();if(!bounds||bounds.x< -1||bounds.x+bounds.width>width+1)throw Error('Bag overflows '+name);
  if(await page.locator('.awakening-materials').getAttribute('open')===null)await page.getByText('Boss hearts & weapon awakening',{exact:true}).click();
  await page.screenshot({path:`test-results/awakening/${name}-bag.png`});
 }
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>window.__awakeningUi.showForge());
 await page.getByText(/Boss weapon forge/).click();
 const action=page.getByRole('button',{name:'Awaken · 3 hearts',exact:true});await action.scrollIntoViewIfNeeded();
 await page.screenshot({path:'test-results/awakening/phone-forge.png'});page.once('dialog',d=>d.accept());await action.click();
 const state=await page.evaluate(()=>{const s=window.__awakeningUi.store.getState();return {awake:s.awakenedWeapons.includes('varkhul-emberfang'),hearts:s.bossHearts.varkhul,rank:s.weaponUpgrades['varkhul-emberfang'],armor:s.equippedArmor};});
 if(!state.awake||state.hearts!==0||state.rank!==3)throw Error('Awakening recipe changed the wrong progression: '+JSON.stringify(state));
 await page.evaluate(()=>window.__awakeningUi.showBag());await page.getByRole('heading',{name:/Sovereign Emberfang/}).first().waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('.awakened-item-icon img')].every(i=>i.complete&&i.naturalWidth>0));
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Desktop/phone bag and three-heart forge interaction passed.');
}finally{await browser.close();}
