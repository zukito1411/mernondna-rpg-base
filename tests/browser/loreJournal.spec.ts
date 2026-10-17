import {test,expect} from '@playwright/test';
test.use({launchOptions:{args:['--disable-gpu']}});

test('discovered lore, boss spoils and weapon profiles work on desktop and phones',async({page})=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?e2e');await page.evaluate(async()=>{const path='/tests/browser/loreJournalFixture.tsx';const {openLoreUI}=await import(path);openLoreUI();});
  const dialog=page.getByRole('dialog',{name:'Bestiary and lore journal'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('navigation',{name:'Discovered records'})).not.toContainText('Varkhul');
  await dialog.getByRole('button',{name:'Frost Wolf',exact:true}).click();
  await expect(dialog.getByRole('article')).toContainText('The cold is familiar to this creature');
  await dialog.getByRole('button',{name:/^Bosses/}).click();
  await expect(dialog.getByRole('article')).toContainText('Varr’s Rededge');
  await expect(dialog.getByRole('article')).not.toContainText('drop chance');
  await dialog.getByRole('button',{name:/^Characters/}).click();
  await expect(dialog.getByRole('article')).toContainText('Village Blacksmith');
  await dialog.getByRole('button',{name:/^Regional history/}).click();
  await expect(dialog.getByRole('article')).toContainText('Highmere');
  await dialog.getByRole('button',{name:/^Weapons/}).click();
  for(const [label,width,height] of [['desktop',1280,720],['phone-landscape',844,390],['phone-portrait',390,844]] as const){
    await page.setViewportSize({width,height});
    await dialog.getByRole('searchbox').fill('Rootfather');
    await expect(dialog.getByRole('article')).not.toContainText('18% chance');
    await expect(dialog.getByRole('article')).toContainText('violet sickness');
    const bounds=(await page.locator('.lore-journal').boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height+1);
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    const details=dialog.getByRole('article');
    await details.evaluate(el=>el.scrollTop=el.scrollHeight);
    await expect(details).toContainText('Stories carried by the blade');
    await page.screenshot({path:`test-results/lore-${label}.png`});
    await dialog.getByRole('searchbox').fill('not a discovered sword');
    await expect(dialog).toContainText('No matching records.');
    await dialog.getByRole('searchbox').fill('');
  }
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(()=>window.__loreStore.getState().openPanel('inventory'));
  const inventory=page.getByRole('dialog',{name:'Inventory'});
  await inventory.getByRole('searchbox').fill('Cinder-forged');
  await inventory.getByText('Profile & unique effect',{exact:true}).click();
  await expect(inventory).toContainText('12% chance');await expect(inventory).toContainText('Blackspire');
  await inventory.getByRole('button',{name:'Equip',exact:true}).click();
  expect(await page.evaluate(()=>window.__loreStore.getState().weaponId)).toBe('cinder-forged-sabre');
  expect(errors).toEqual([]);
});
