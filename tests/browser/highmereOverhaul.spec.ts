import {test,expect,type Page} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {Npc} from '../../src/game/entities/Npc';
import type {ContentDefinition,QuestDefinition} from '../../src/game/types';
const city={x:31*1536+768,y:22*1536+768};

async function ready(page:Page){await page.goto('/?e2e');await page.waitForFunction(()=>(window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);}
async function skipScene(page:Page){
  await page.waitForFunction(async()=>{const path='/src/store/gameStore.ts';const s=(await import(path)).useGameStore.getState();return !s.pendingCinematic||Boolean(s.cinematic);});
  if(await page.getByRole('button',{name:'Skip scene · Esc'}).isVisible()){
    await page.getByRole('button',{name:'Skip scene · Esc'}).click();await expect(page.getByRole('region',{name:'Story scene'})).toBeHidden();
  }
}
async function position(page:Page,x:number,y:number){await skipScene(page);await page.evaluate(({x,y})=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  s.streamCinematicView(x,y);(s.player.body as Phaser.Physics.Arcade.Body).reset(x,y);
  (s as unknown as {lastSafe:{x:number;y:number}}).lastSafe={x,y};
  s.cameras.main.setZoom(1).startFollow(s.player,true,1,1);
}, {x,y});}
async function target(page:Page,id:string){await skipScene(page);await page.evaluate(async(id)=>{
  const path='/src/data/content.ts',data=await import(path);
  const definition=(data.WORLD_CONTENT as ContentDefinition[]).find(d=>d.id===id)!;
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  s.streamCinematicView(definition.world.x,definition.world.y);
  const internals=s as unknown as {contentManager:{getActor(id:string):Phaser.GameObjects.Sprite};lastSafe:{x:number;y:number};isBlockedByBuilding(x:number,y:number):boolean};
  const actor=internals.contentManager.getActor(id)!;
  const candidates=[40,52,64].flatMap(radius=>Array.from({length:16},(_,i)=>({x:actor.x+Math.cos(i*Math.PI/8)*radius,y:actor.y+Math.sin(i*Math.PI/8)*radius})));
  const point=candidates.find(p=>s.isWalkable(p.x,p.y)&&!internals.isBlockedByBuilding(p.x,p.y)&&s.hasClearPath(p.x,p.y,actor.x,actor.y,actor));
  if(!point)throw new Error('No clear interaction approach for '+id);
  (s.player.body as Phaser.Physics.Arcade.Body).reset(point.x,point.y);internals.lastSafe=point;
  s.player.lastDirection.set(actor.x-point.x,actor.y-point.y).normalize();
  s.cameras.main.setZoom(1).startFollow(s.player,true,1,1);
  actor.emit('pointerdown');
},id);}
async function finishDialogue(page:Page,choice?:string){
  for(let i=0;i<6&&await page.getByRole('button',{name:'Continue',exact:true}).isVisible();i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
  if(choice)await page.getByRole('button',{name:choice,exact:true}).click();
  else if(await page.getByRole('button',{name:'Close',exact:true}).isVisible())await page.getByRole('button',{name:'Close',exact:true}).click();
  await skipScene(page);
}

test('capital introduction skips safely; audience arch, bridge decks and marching file work',async({page})=>{
  test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
  await page.keyboard.press('j',{delay:100});await expect(page.getByRole('region',{name:'Quest journal'})).toBeVisible();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.keyboard.press('m');await page.getByRole('button',{name:'Select Highmere for teleport',exact:true}).click();await page.getByRole('button',{name:'Teleport',exact:true}).click();
  await expect(page.getByRole('region',{name:'Story scene'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Attack',exact:true})).toBeHidden();
  await page.waitForTimeout(3100);await page.screenshot({path:'test-results/highmere-royal-precinct.png'});
  await page.keyboard.press('Escape');await expect(page.getByRole('region',{name:'Story scene'})).toBeHidden();
  await position(page,city.x-1000,city.y-1180);const start=city.y-1180;
  await page.keyboard.down('w');await expect.poll(()=>page.evaluate(()=>(window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.y),{timeout:10000}).toBeLessThan(start-210);await page.keyboard.up('w');
  await page.keyboard.down('s');await expect.poll(()=>page.evaluate(()=>(window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.y),{timeout:10000}).toBeGreaterThan(start-10);await page.keyboard.up('s');
  await position(page,city.x-1150,city.y-1180);await page.keyboard.down('w');await page.waitForTimeout(1400);await page.keyboard.up('w');
  expect(await page.evaluate(()=>(window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.y)).toBeGreaterThan(city.y-1300+16);
  for(const direction of ['d','a'] as const){const x=city.x+420+(direction==='d'?-125:125);await position(page,x,city.y);
    await page.keyboard.down(direction);await expect.poll(()=>page.evaluate(()=>(window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.x),{timeout:10000})[direction==='d'?'toBeGreaterThan':'toBeLessThan'](city.x+420+(direction==='d'?125:-125));await page.keyboard.up(direction);}
  await position(page,city.x+420,city.y);await page.screenshot({path:'test-results/highmere-deck-layering.png'});
  await position(page,city.x-1900,city.y);
  const before=await page.evaluate(()=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return s.children.list.filter(c=>(c as Npc).definition?.formation).map(c=>({id:(c as Npc).definition.id,x:(c as Npc).x,y:(c as Npc).y}));
  });expect(before.length).toBeGreaterThanOrEqual(4);
  await page.waitForTimeout(2000);
  const after=await page.evaluate(()=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return s.children.list.filter(c=>(c as Npc).definition?.formation).map(c=>({id:(c as Npc).definition.id,x:(c as Npc).x,y:(c as Npc).y}));
  });expect(Math.hypot(after[0].x-before[0].x,after[0].y-before[0].y)).toBeGreaterThan(25);
  for(let i=0;i<after.length;i++)for(let j=i+1;j<after.length;j++)expect(Math.hypot(after[i].x-after[j].x,after[i].y-after[j].y)).toBeGreaterThan(65);
  await page.evaluate((points)=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const x=points.reduce((sum,p)=>sum+p.x,0)/points.length,y=points.reduce((sum,p)=>sum+p.y,0)/points.length;
    s.cameras.main.stopFollow().setZoom(.85).centerOn(x,y);
  },after);
  await page.screenshot({path:'test-results/highmere-marching-watch.png'});expect(errors).toEqual([]);
});

test('complete capital stories: evidence, witness escort, drills, puzzle, delivery, watch, decision and reload',async({page})=>{
  test.setTimeout(360000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
  await page.evaluate(async()=>{const path='/src/store/gameStore.ts';(await import(path)).useGameStore.getState().setStoryFlag('scene:highmere-arrival');});
  for(const questId of ['shadows-highmere','royal-guard-trial','kingdom-divided']){
    const giver=questId==='shadows-highmere'?'mairin-reed':questId==='royal-guard-trial'?'captain-yselle-ward':'renna-vale';
    await target(page,'npc:'+giver);await finishDialogue(page);
    for(let stage=0;stage<16;stage++){
      const objective=await page.evaluate(async(id)=>{
        const storePath='/src/store/gameStore.ts',questPath='/src/data/quests.ts';
        const state=(await import(storePath)).useGameStore.getState(),quest=(await import(questPath)).QUEST_BY_ID[id] as QuestDefinition;
        return state.quests[id].status==='completed'?null:quest.objectives.find(o=>(state.quests[id].objectiveProgress[o.id]??0)<o.amount);
      },questId);if(!objective)break;
      if(['talk','deliver','choice','puzzle'].includes(objective.type)){
        await target(page,'npc:'+objective.targetId);
        await finishDialogue(page,objective.choices?.find(c=>c.correct!==false)?.text);
      }else if(objective.type==='investigate')await target(page,objective.contentId!);
      else if(objective.type==='escort'){
        await page.evaluate((city)=>{
          const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
          const timer=s.time.addEvent({delay:100,loop:true,callback:()=>{
            const actor=s.children.list.find(c=>(c as Npc).definition?.id==='tovin-reed') as Npc|undefined;
            if(!actor?.escorting){if(actor&&Math.hypot(actor.x-city.x+1360,actor.y-city.y-1585)<40)timer.remove();return;}
            (s.player.body as Phaser.Physics.Arcade.Body).reset(actor.x+42,actor.y+8);
            (s as unknown as {lastSafe:{x:number;y:number}}).lastSafe={x:s.player.x,y:s.player.y};
          }});
        },city);
        await expect.poll(()=>page.evaluate(async()=>{const path='/src/store/gameStore.ts';return (await import(path)).useGameStore.getState().quests['shadows-highmere'].objectiveProgress.escort??0;}),{timeout:70000}).toBe(1);
      }else if(objective.targetId==='relief-watch'){
        await target(page,'watch:relief-yard');await expect.poll(()=>page.evaluate(async()=>{const path='/src/store/gameStore.ts';return (await import(path)).useGameStore.getState().quests['royal-guard-trial'].objectiveProgress.watch??0;}),{timeout:20000}).toBe(1);
      }else if(objective.type==='train'){
        await target(page,'training:highmere-target');
        for(let count=0;count<objective.amount;count++){await page.keyboard.press(objective.targetId==='drill-sword'?'Space':objective.targetId==='drill-dash'?'q':'1');await page.waitForTimeout(1000);}
      }else throw new Error('Unsupported test objective '+objective.type);
    }
    expect(await page.evaluate(async(id)=>{const path='/src/store/gameStore.ts';return (await import(path)).useGameStore.getState().quests[id].status;},questId)).toBe('completed');
  }
  await page.getByRole('button',{name:'Journal · J',exact:true}).click();await expect(page.getByRole('region',{name:'Quest journal'})).toBeVisible();
  await page.screenshot({path:'test-results/highmere-story-journal.png'});await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(async()=>{const path='/src/utils/save.ts';(await import(path)).saveGame();});await page.reload();
  await page.waitForFunction(()=>(window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  const saved=await page.evaluate(async()=>{const path='/src/store/gameStore.ts';const s=(await import(path)).useGameStore.getState();return {statuses:['shadows-highmere','royal-guard-trial','kingdom-divided'].map(id=>s.quests[id].status),charter:s.storyFlags['relief-household-charter'],choices:Object.keys(s.storyChoices).length};});
  expect(saved.statuses).toEqual(['completed','completed','completed']);expect(saved.charter).toBe(true);expect(saved.choices).toBe(4);expect(errors).toEqual([]);
});
