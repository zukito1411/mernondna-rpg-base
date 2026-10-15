import {test,expect} from '@playwright/test';

test.use({viewport:{width:1920,height:1040}});
test('all NPC combat sheets prepare and render with contained GPU frames',async({page})=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/tests/browser/npcSpriteReview.html');
  await page.waitForFunction(()=>(window as any).__npcReview,{},{timeout:60000});
  const report=await page.evaluate(()=>(window as any).__npcReview.report) as Array<{id:string;error?:string;frames:number;border:number;uv:number}>;
  expect(report).toHaveLength(21); // Seven new walks, two guard walks, twelve combat profiles.
  for(const result of report){
    expect.soft(result.error,result.id).toBeUndefined();
    expect.soft(result.frames,result.id).toBeGreaterThan(0);
    expect.soft(result.border,result.id+' border').toBe(0);
    expect.soft(result.uv,result.id+' GPU registration').toBe(0);
    if(result.error)continue;
    await page.evaluate(id=>(window as any).__npcReview.render(id),result.id);
    await page.waitForTimeout(40);
    await page.screenshot({path:'test-results/npc-'+result.id+'-poses.png'});
  }
  const actors=await page.evaluate(()=>(window as any).__npcReview.actors());
  expect(actors.issues).toEqual([]);expect(actors.fighters).toBe(43);
  expect(actors.walks).toBeGreaterThan(600);expect(actors.attacks).toBe(43*4);
  expect(errors).toEqual([]);
});

test('touch-density renderer and real combatants use the same isolated frames',async({browser})=>{
  test.setTimeout(90000);
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  try{
    const page=await context.newPage(),errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/tests/browser/npcSpriteReview.html');
    await page.waitForFunction(()=>(window as any).__npcReview,{},{timeout:60000});
    const report=await page.evaluate(()=>(window as any).__npcReview.report);
    expect(report).toHaveLength(21);
    for(const result of report){expect(result.error,result.id).toBeUndefined();expect(result.border,result.id).toBe(0);expect(result.uv,result.id).toBe(0);}
    const actors=await page.evaluate(()=>(window as any).__npcReview.actors());
    expect(actors.issues).toEqual([]);expect(actors.attacks).toBe(172);
    for(const id of ['elven-guard','darkav-officer']){
      await page.evaluate(id=>{
        const review=(window as any).__npcReview;
        review.scene.scale.resize(844,390);review.render(id);
        review.scene.cameras.main.setZoom(.38).centerOn(960,520);
      },id);
      await page.waitForTimeout(40);
      await page.screenshot({path:'test-results/npc-mobile-'+id+'.png'});
    }
    expect(errors).toEqual([]);
  }finally{await context.close();}
});
