import {expect,test,type Page} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';

async function towerState(page:Page){return page.evaluate(async()=>{
 const path='/src/store/gameStore.ts';const {useGameStore}=await import(/* @vite-ignore */ path) as typeof import('../../src/store/gameStore');
 const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,s=useGameStore.getState();
 const door=scene['dungeons']['northDoor'],frame=door?.frame;
 return {floor:s.activeDungeonId,inside:scene.inInterior,enemies:scene['dungeons'].enemies.length,
  cleared:s.activeDungeonId?s.dungeons[s.activeDungeonId]?.defeated:0,portal:Boolean(scene.children.getByName('tower-return-portal')),
  armor:s.armorInventory,bonuses:s.armorBonuses,panel:s.panel,toast:s.toast,
  doorFrame:frame?.name,doorContained:Boolean(frame&&frame.cutX>=0&&frame.cutY>=0
    &&frame.cutX+frame.cutWidth<=frame.source.width&&frame.cutY+frame.cutHeight<=frame.source.height)};
});}
async function view(page:Page,local:{x:number;y:number},zoom:number){await page.evaluate(({local,zoom})=>{
 const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,p=scene.dungeonPoint(local);
 const camera=scene.cameras.main;camera.stopFollow();camera.removeBounds();camera.setZoom(zoom);camera.centerOn(p.x,p.y);
},{local,zoom});}
async function clearDefenders(page:Page){
 for(let wave=0;wave<4;wave++){
  await expect.poll(async()=>(await towerState(page)).enemies,{timeout:30000}).toBeGreaterThan(0);
  await page.evaluate(()=>{
   const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
   for(const e of s['dungeons'].enemies)e.takeDamage(e.hp*10,s.player.lastDirection.clone().set(0,0));
  });
  if((await towerState(page)).portal)return;
 }
}
for(const device of ['desktop','mobile'] as const)test(`Tower arena, doors, portal and Magus treasure — ${device}`,async({browser})=>{
 const context=await browser.newContext(device==='mobile'?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1}:
  {viewport:{width:1440,height:1000}});
 const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
  await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'),null,{timeout:120000});
  const skip=page.getByRole('button',{name:/Skip scene/});await expect(skip).toBeVisible({timeout:30000});await skip.click();
  await page.waitForFunction(()=>!(window.__mernondnaGame!.scene.getScene('world') as WorldScene)['cinematicDirector'].active,null,{timeout:30000});
  await page.evaluate(async()=>{
   const storePath='/src/store/gameStore.ts',towerPath='/src/data/towerOfMight.ts',bossPath='/src/data/enemies.ts';
   const {useGameStore}=await import(/* @vite-ignore */ storePath) as typeof import('../../src/store/gameStore');
   const {TOWER_ENTRY_ID,TOWER_DOOR,TOWER_UNLOCKED}=await import(/* @vite-ignore */ towerPath) as typeof import('../../src/data/towerOfMight');
   const {BOSSES}=await import(/* @vite-ignore */ bossPath) as typeof import('../../src/data/enemies');
   const s=useGameStore.getState();s.hydrate({pendingCinematic:null,cinematicQueue:[],defeatedBosses:BOSSES.map(b=>b.id),
    quests:{...s.quests,'the-last-ward':{status:'completed',objectiveProgress:{}}},
    storyFlags:{...s.storyFlags,[TOWER_UNLOCKED]:true},dungeons:{},armorInventory:[]});
   const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
   scene.prepareStoryArena();scene.restoreOutsidePosition({...TOWER_DOOR,y:TOWER_DOOR.y+15});
   scene['interiors'].enter({id:TOWER_ENTRY_ID,townId:'oakmere',name:'Tower of Might',kit:'tower_of_might',door:TOWER_DOOR,hall:false,profile:'cave'});
  });
  await expect.poll(async()=>(await towerState(page)).floor,{timeout:45000}).toBe('might-1-1');
  await expect.poll(async()=>(await towerState(page)).enemies,{timeout:30000}).toBe(5);
  expect((await towerState(page)).portal).toBe(false);
  expect((await towerState(page)).doorFrame).toBe('tower-door-closed');expect((await towerState(page)).doorContained).toBe(true);
  await view(page,{x:900,y:900},device==='mobile'?.19:.43);
  await page.screenshot({path:`test-results/tower-of-might/${device}-sealed-floor.png`});
  await clearDefenders(page);
  await expect.poll(async()=>(await towerState(page)).portal).toBe(true);
  expect((await towerState(page)).doorFrame).toBe('tower-door-open');expect((await towerState(page)).doorContained).toBe(true);
  await page.waitForTimeout(1200);
  await page.screenshot({path:`test-results/tower-of-might/${device}-cleared-floor.png`});
  await view(page,{x:900,y:330},device==='mobile'?.75:1.4);
  await page.screenshot({path:`test-results/tower-of-might/${device}-north-door.png`});
  await view(page,{x:900,y:1650},device==='mobile'?.75:1.4);
  await page.screenshot({path:`test-results/tower-of-might/${device}-south-door.png`});
  await page.evaluate(()=>{
   const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,p=scene.dungeonPoint({x:900,y:900});
   (scene.player.body as Phaser.Physics.Arcade.Body).reset(p.x,p.y);scene['dungeons'].interact();
  });
  await expect(page.getByRole('alertdialog',{name:'Return to Oakmere?'})).toBeVisible();
  await page.screenshot({path:`test-results/tower-of-might/${device}-portal-confirmation.png`});
  await page.getByRole('button',{name:'Stay in the tower',exact:true}).click();
  await page.waitForTimeout(450);
  await page.evaluate(()=>{
   const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,p=scene.dungeonPoint({x:900,y:330});
   (scene.player.body as Phaser.Physics.Arcade.Body).reset(p.x,p.y);scene['dungeons'].interact();
  });
  await expect.poll(async()=>(await towerState(page)).floor).toBe('might-1-2');
  await page.evaluate(async()=>{
   const path='/src/store/gameStore.ts',dungeonPath='/src/data/dungeons.ts';
   const {useGameStore}=await import(/* @vite-ignore */ path) as typeof import('../../src/store/gameStore');
   const {newDungeonProgress}=await import(/* @vite-ignore */ dungeonPath) as typeof import('../../src/data/dungeons');
   const ledger={...useGameStore.getState().dungeons};
   for(let c=1;c<=9;c++)ledger[`might-${c}-5`]={...newDungeonProgress(),defeated:1,claimed:true};
   useGameStore.setState({dungeons:ledger});
   const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
   scene['dungeons'].begin('cave:might-10-5');
  });
  await expect.poll(async()=>(await towerState(page)).enemies,{timeout:45000}).toBe(1);
  await view(page,{x:900,y:750},device==='mobile'?.65:1.5);
  await page.screenshot({path:`test-results/tower-of-might/${device}-grand-magus.png`});
  // Capture the real authored casting poses, then the actual encounter defeat.
  await page.evaluate(()=>{
   const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,e=scene['dungeons'].enemies[0];
   e.playBossWindup(1200,800,Math.PI/2,true);
  });
  await page.screenshot({path:`test-results/tower-of-might/${device}-magus-cast.png`});
  await page.evaluate(()=>{
   const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,e=scene['dungeons'].enemies[0];
   e.takeDamage(e.hp*10,scene.player.lastDirection.clone().set(0,0));
  });
  await page.waitForTimeout(650);
  await page.screenshot({path:`test-results/tower-of-might/${device}-escaping-bats.png`});
  await expect.poll(async()=>(await towerState(page)).portal,{timeout:10000}).toBe(true);
  await page.evaluate(()=>{
   const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,p=scene.dungeonPoint({x:1160,y:550});
   (scene.player.body as Phaser.Physics.Arcade.Body).reset(p.x,p.y);scene['dungeons'].interact();
  });
  expect((await towerState(page)).armor.filter(id=>id.startsWith('shadow-magus'))).toHaveLength(3);
  await page.evaluate(async()=>{
   const path='/src/store/gameStore.ts';const {useGameStore}=await import(/* @vite-ignore */ path) as typeof import('../../src/store/gameStore');
   useGameStore.getState().openPanel('inventory');
  });
  for(const slot of ['Chest','Boots','Cape']){
   await page.getByRole('button',{name:new RegExp(`^${slot} slot:`)}).click();
   await page.getByRole('button',{name:'Equip selected',exact:true}).click();
  }
  const result=await towerState(page);
  expect(result.bonuses.lifesteal).toBe(.25);expect(result.bonuses.staminaReduction).toBe(.45);expect(result.bonuses.allStats).toBe(15);
  await page.screenshot({path:`test-results/tower-of-might/${device}-legendary-armor.png`});
  const mechanics=await page.evaluate(()=>{
   const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,p=scene.player;
   p.restoreRestVitals();p.hp=p.maxHp-50;
   const before=p.hp;p.absorbLifeFromHit(100);
   return {healed:p.hp-before,cost:p.staminaCost(20)};
  });
  expect(mechanics.healed).toBe(25);expect(mechanics.cost).toBe(11);
  expect(errors).toEqual([]);
 }finally{await context.close();}
});
