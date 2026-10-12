import {test,expect} from '@playwright/test';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {Enemy} from '../../src/game/entities/Enemy';
import type {ContentChunkManager} from '../../src/game/systems/ContentChunkManager';
import type Phaser from 'phaser';

test('M02 pack sharing, attack cancellation, leash return and reload identity',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
  await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
  const result=await page.evaluate(async()=>{
    const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const r=scene as unknown as {contentManager:ContentChunkManager<Enemy>;enemies:Set<Enemy>};
    scene.scene.pause();scene.physics.world.pause();
    const cp='/src/data/content.ts',{WORLD_CONTENT}=await import(cp);
    const anchor=r.contentManager.getState('creature:oakmere-wolf-east')!;
    for(const d of WORLD_CONTENT as import('../../src/game/types').ContentDefinition[])
      if(d.kind==='creature')r.contentManager.patchState(d.id,{hp:0,defeated:true,respawnAt:undefined});
    scene.player.restoreAt(anchor.x,anchor.y);scene.streamCinematicView(anchor.x,anchor.y);
    const offsets=[[0,0],[-180,-80],[-160,80],[60,80]];
    let home:{x:number;y:number}|undefined;
    for(let dx=-640;dx<=640&&!home;dx+=80)for(let dy=-640;dy<=640&&!home;dy+=80){
      const x=anchor.x+dx,y=anchor.y+dy;
      if([...offsets,[150,0],[30,0],[-280,-80]].every(([ox,oy])=>scene.canEnemyOccupy(x+ox,y+oy))
        && scene.hasClearPath(x-180,y-80,x+150,y)&&scene.hasClearPath(x-280,y-80,x-180,y-80))home={x,y};
    }
    if(!home)throw new Error('No clear pack fixture found');
    const ids=r.contentManager.addEncounter(offsets.map(([dx,dy])=>({enemyId:'gray-wolf',world:{x:home!.x+dx,y:home!.y+dy}})),false,4,{wolfPack:true})!;
    r.contentManager.update(home.x,home.y);
    const alpha=r.contentManager.getActor(ids[0])!,sibling=r.contentManager.getActor(ids[1])!;
    const now=scene.time.now;
    scene.player.restoreAt(home.x+150,home.y);alpha.updateEnemy(now,16);sibling.updateEnemy(now,16);
    const shared=(sibling.body as Phaser.Physics.Arcade.Body).velocity.length()>0;
    scene.player.restoreAt(home.x+30,home.y);alpha.updateEnemy(now+1,16);
    const a=alpha as unknown as {attackEpoch:number;attackTelegraph:unknown};
    const queued=Boolean(a.attackTelegraph),epoch=a.attackEpoch;
    (sibling.body as Phaser.Physics.Arcade.Body).reset(home.x-280,home.y-80);
    scene.player.restoreAt(home.x+1200,home.y);alpha.updateEnemy(now+2,16);sibling.updateEnemy(now+2,16);
    const cancelled=a.attackEpoch>epoch&&!a.attackTelegraph;
    const returning=(sibling.body as Phaser.Physics.Arcade.Body).velocity.x>0;
    const rejected=scene.spawnEnemy('road-bandit',scene.player.x,scene.player.y);
    const saved=r.contentManager.snapshot(),profile=saved.spawns[ids[1]].encounterBehavior;
    r.contentManager.patchState(ids[2],{hp:0,defeated:true});
    scene.player.restoreAt(0,0);r.contentManager.update(0,0);
    scene.player.restoreAt(home.x+600,home.y);r.contentManager.update(home.x,home.y);
    const reloaded=r.contentManager.getActor(ids[1])!;
    return {shared,queued,cancelled,returning,rejected,profileStable:JSON.stringify(reloaded.encounterBehavior)===JSON.stringify(profile),
      deadStayedDead:!r.contentManager.getActor(ids[2]),alphaCount:scene.wolfPackMembers(alpha.wolfPackId!).filter(e=>e.wolfAlpha).length};
  });
  expect(result).toEqual({shared:true,queued:true,cancelled:true,returning:true,rejected:false,profileStable:true,deadStayedDead:true,alphaCount:1});
});
