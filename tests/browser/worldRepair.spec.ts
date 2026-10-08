import { test,expect } from '@playwright/test';
import type Phaser from 'phaser';
import type { WorldScene } from '../../src/game/scenes/WorldScene';
import { TOWNS } from '../../src/data/towns';

test('saved players inside repaired foundations load on clear ground without healing',async({page})=>{
  await page.goto('/?e2e');
  await page.waitForFunction(()=>(window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  const saved=await page.evaluate(async()=>{
    const path='/src/utils/save.ts';const {saveGame}=await import(path);
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const building=s.children.getByName('town:oakmere:building:0') as Phaser.Physics.Arcade.Sprite;
    const body=building.body as Phaser.Physics.Arcade.StaticBody;
    s.player.hp=73;s.player.stamina=61;
    (s.player.body as Phaser.Physics.Arcade.Body).reset((body.left+body.right)/2,(body.top+body.bottom)/2-9);
    saveGame();return {x:s.player.x,y:s.player.y};
  });
  await page.reload();
  await page.waitForFunction(()=>(window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  const repaired=await page.evaluate(()=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const details=s as unknown as {isBlockedByBuilding(x:number,y:number):boolean};
    return {x:s.player.x,y:s.player.y,hp:s.player.hp,stamina:s.player.stamina,blocked:details.isBlockedByBuilding(s.player.x,s.player.y)};
  });
  expect(repaired.blocked).toBe(false);expect(repaired.hp).toBe(73);expect(repaired.stamina).toBeLessThan(70);
  expect(Math.hypot(repaired.x-saved.x,repaired.y-saved.y)).toBeGreaterThan(20);
});

test('survey all eleven settlements: map travel, clear main roads, lighting and streamed cleanup',async({page})=>{
  test.setTimeout(240000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1120,height:960});
  await page.goto('/?e2e');
  await page.waitForFunction(()=>(window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  for(const town of TOWNS) {
    await page.keyboard.press('m');
    await page.getByRole('button',{name:`Select ${town.name} for teleport`,exact:true}).click();
    await page.getByRole('button',{name:'Teleport',exact:true}).click();
    if(town.id==='highmere')await page.getByRole('button',{name:'Skip scene · Esc'}).click();
    await expect(page.locator('.status-meta')).toContainText(town.name);
    const start=await page.evaluate(({x,y})=>{
      const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      s.player.restoreAt(x-220,y);s.cameras.main.setZoom(1.3).startFollow(s.player,true,1,1);return s.player.x;
    },town.world);
    await page.keyboard.down('d');
    await expect.poll(()=>page.evaluate(()=>(window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.x)).toBeGreaterThan(start+85);
    await page.keyboard.up('d');
    const survey=await page.evaluate(({x,y})=>{
      const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      s.cameras.main.stopFollow().setZoom(.28).centerOn(x,y);
      return {walls:s.children.list.filter(c=>c.name.startsWith('settlement:wall:')||c.name.startsWith('collider:')).length,
        lamps:s.children.list.filter(c=>c.name.startsWith('environment-light:')).length};
    },town.world);
    expect(survey.walls).toBe(0);expect(survey.lamps).toBeGreaterThan(0);
    await page.screenshot({path:`test-results/world-repair-${town.id}.png`,style:'.hud-layer,.toast{visibility:hidden}'});
  }
  await page.keyboard.press('m');await page.getByRole('button',{name:'Select Oakmere for teleport',exact:true}).click();
  await page.getByRole('button',{name:'Teleport',exact:true}).click();
  for(const [label,hour] of [['day',12],['night',22]] as const) {
    const lighting=await page.evaluate(hour=>{
      const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      s.cameras.main.setZoom(1.3).startFollow(s.player,true,1,1);
      const dayNight=(s as unknown as {dayNight:{minuteOfDay:number;update(delta:number,x:number,y:number):void}}).dayNight;
      dayNight.minuteOfDay=hour*60;dayNight.update(100,s.player.x,s.player.y);
      const lights=s.children.list.filter(c=>c.name.startsWith('environment-light:')) as Phaser.GameObjects.Image[];
      return {count:lights.length,alpha:Math.max(...lights.map(l=>l.alpha)),
        playerLight:s.children.list.some(c=>c.name==='player-glow'),
        overlayAlpha:(s.textures.get('night-overlay') as Phaser.Textures.CanvasTexture).getContext().getImageData(0,0,1,1).data[3]};
    },hour);
    expect(lighting.count).toBeGreaterThan(0);expect(lighting.playerLight).toBe(false);
    if(label==='day'){expect(lighting.alpha).toBe(0);expect(lighting.overlayAlpha).toBe(0);}
    else {expect(lighting.alpha).toBeGreaterThan(.1);expect(lighting.overlayAlpha).toBeGreaterThan(180);}
    await page.screenshot({path:`test-results/world-repair-oakmere-${label}.png`});
  }
  expect(errors).toEqual([]);
});
