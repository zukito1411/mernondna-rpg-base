import {test,expect} from '@playwright/test';
test('partial coverage: actual UI components without the world renderer',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?e2e');await page.evaluate(async()=>{const path='/tests/browser/equipmentUiFixture.tsx';const {openEquipmentUI}=await import(path);openEquipmentUI();});
  for(const [label,width,height] of [['desktop',1280,720],['phone-landscape',844,390],['phone-portrait',390,844]] as const){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{const s=(window as any).__equipmentStore.getState();s.hydrate({hp:35,stamina:25});s.openPanel('inventory');});
    const bag=page.locator('.inventory-panel');await expect(bag).toBeVisible();
    await bag.getByRole('button',{name:/^Potions/}).click();
    await bag.getByRole('button',{name:'Drink',exact:true}).first().click();
    expect(await page.evaluate(()=>(window as any).__equipmentStore.getState().hp)).toBe(85);
    await page.screenshot({path:`test-results/ui-${label}-bag.png`});
    const bounds=await bag.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(-1);expect(bounds!.width).toBeLessThanOrEqual(width+2);
    await bag.getByRole('button',{name:'Close',exact:true}).click();
    await page.evaluate(()=>{const s=(window as any).__equipmentStore.getState();s.startDialogue('joren-pike');s.advanceDialogue();});
    await expect(page.locator('.merchant-stock')).toBeVisible();
    await page.screenshot({path:`test-results/ui-${label}-merchant.png`});
    if(label==='desktop')await page.locator('.merchant-stock .item-row').filter({hasText:'Oakguard Blade'}).getByRole('button',{name:'110 gold',exact:true}).click();
    await page.locator('.merchant-stock .item-row').filter({hasText:'Healing Draught'}).getByRole('button',{name:'28 gold',exact:true}).click();
    await page.locator('.dialogue-panel').getByRole('button',{name:'Close',exact:true}).click();
    await page.evaluate(()=>(window as any).__equipmentStore.getState().openPanel('inventory'));
    await page.locator('.inventory-panel').getByRole('button',{name:'Weapons',exact:true}).click();
    if(label==='desktop')await page.locator('.inventory-panel .item-row').filter({hasText:'Oakguard Blade'}).getByRole('button',{name:'Equip',exact:true}).click();
    expect(await page.evaluate(()=>(window as any).__equipmentStore.getState().weaponId)).toBe('oak-shield-blade');
    await page.locator('.inventory-panel').getByRole('button',{name:'Close',exact:true}).click();
    await page.evaluate(()=>(window as any).__equipmentStore.getState().openPanel('character'));
    if(label==='desktop')for(const name of ['Ember Snare','Iron Rush','Renewing Light'])await page.locator('.combat-art-row').filter({hasText:name}).getByRole('button',{name:/Learn/}).click();
    for(const [i,id] of ['ember-cleave','iron-tempest','renewing-light'].entries())await page.locator('.skill-loadout select').nth(i).selectOption(id);
    await page.screenshot({path:`test-results/ui-${label}-skills.png`});
    await page.locator('.character-panel').getByRole('button',{name:'Close',exact:true}).click();
    await page.screenshot({path:`test-results/ui-${label}-controls.png`});
  }
  expect(await page.evaluate(()=>(window as any).__equipmentStore.getState().gold)).toBe(2806);
  expect(errors).toEqual([]);
});

test.describe('touch-phone UI',()=>{
  test.use({hasTouch:true,deviceScaleFactor:2,viewport:{width:844,height:390}});
  test('partial coverage: touch layouts and merchant scrolling',async({page})=>{
    await page.goto('/?e2e');await page.evaluate(async()=>{const path='/tests/browser/equipmentUiFixture.tsx';const {openEquipmentUI}=await import(path);openEquipmentUI();});
    for(const [label,width,height] of [['landscape',844,390],['portrait',390,844]] as const){
      await page.setViewportSize({width,height});
      await expect(page.locator('.mobile-controls')).toBeVisible();
      if(label==='portrait'){
        const stick=(await page.locator('.joystick').boundingBox())!,dash=(await page.locator('.touch-button.sprint').boundingBox())!;
        expect(dash.y+dash.height).toBeLessThanOrEqual(stick.y);
      }
      await page.screenshot({path:`test-results/touch-${label}-controls.png`});
      await page.evaluate(()=>(window as any).__equipmentStore.getState().openPanel('inventory'));
      await page.locator('.inventory-panel').getByRole('button',{name:/^Potions/}).tap();
      await expect(page.locator('.mobile-controls')).not.toBeVisible();
      await page.locator('.inventory-panel').getByRole('button',{name:'Drink',exact:true}).last().tap();
      await page.screenshot({path:`test-results/touch-${label}-bag.png`});
      await page.locator('.inventory-panel').getByRole('button',{name:'Close',exact:true}).tap();
      await page.evaluate(()=>{const s=(window as any).__equipmentStore.getState();s.startDialogue('joren-pike');s.advanceDialogue();});
      await page.screenshot({path:`test-results/touch-${label}-merchant.png`});
      await page.locator('.merchant-stock .item-row').filter({hasText:'Wayfarer Tonic'}).getByRole('button',{name:'22 gold',exact:true}).tap();
      await page.locator('.dialogue-panel').getByRole('button',{name:'Close',exact:true}).tap();
      await page.evaluate(()=>(window as any).__equipmentStore.getState().hydrate({stamina:25}));
    }
  });
});
