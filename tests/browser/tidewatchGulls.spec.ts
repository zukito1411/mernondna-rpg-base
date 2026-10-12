import {test,expect} from '@playwright/test';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {AmbientWildlifeSystem} from '../../src/game/systems/AmbientWildlifeSystem';
import type {WildlifeCoverIndex} from '../../src/game/systems/wildlifeCover';
import type Phaser from 'phaser';
import {TOWN_BY_ID} from '../../src/data/towns';

test.use({trace:'off'});
test('production Tidewatch houses, bay and sea have recurring visible gulls',async({page})=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
  await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
  await page.keyboard.press('m');
  await page.getByRole('button',{name:'Select Tidewatch for teleport',exact:true}).click();
  await page.getByRole('button',{name:'Teleport',exact:true}).click();
  await expect(page.locator('.status-meta')).toContainText('Tidewatch');
  const result=await page.evaluate(town=>{
    const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const runtime=scene as unknown as {wildlife:AmbientWildlifeSystem;tidewatchGullFlyby(p:{x:number;y:number}):unknown};
    type Bird={cover?:{id:number};species:string;phase:string;groupId?:number;sprite:Phaser.GameObjects.Sprite};
    const wildlife=runtime.wildlife as unknown as {covers:WildlifeCoverIndex;birds:{birds:Bird[]}};
    scene.scene.pause();scene.physics.world.pause();
    const camera=scene.cameras.main,old={x:camera.worldView.x,y:camera.worldView.y,width:camera.worldView.width,height:camera.worldView.height};
    const roofAnchors=wildlife.covers.nearby(town,1800).filter(c=>c.kind==='roof').length;
    const checks=[];
    for(const [name,dx,dy] of [['houses',0,0],['bay',700,1000],['sea',0,2200]] as const){
      const p={x:town.x+dx,y:town.y+dy};
      camera.worldView.setTo(p.x-320,p.y-180,640,360);
      runtime.wildlife.reset();
      const corridor=Boolean(runtime.tidewatchGullFlyby(p));
      let visibleFrames=0;const waves=new Set<number>();
      for(let i=0;i<150;i++){
        runtime.wildlife.update(100,p,12,false);
        for(const b of wildlife.birds.birds)if(b.cover&&b.species==='gull'&&b.phase==='flight'
          &&camera.worldView.contains(b.sprite.x,b.sprite.y)){
          visibleFrames++;if(b.groupId!==undefined)waves.add(b.groupId);
        }
      }
      checks.push({name,corridor,visible:visibleFrames>0,recurring:waves.size>=2});
    }
    runtime.wildlife.reset();
    camera.worldView.setTo(old.x,old.y,old.width,old.height);
    return {roofAnchors,checks,pool:wildlife.birds.birds.length,
      outside:runtime.tidewatchGullFlyby({x:town.x+10000,y:town.y})===null,
      cleaned:wildlife.birds.birds.every(b=>!b.cover&&!b.sprite.visible)};
  },TOWN_BY_ID.tidewatch.world);
  expect(result.roofAnchors).toBeGreaterThan(0);
  expect(result.checks).toEqual(['houses','bay','sea'].map(name=>({name,corridor:true,visible:true,recurring:true})));
  expect(result.pool).toBe(2);expect(result.outside).toBe(true);expect(result.cleaned).toBe(true);
  expect(errors).toEqual([]);
});
