import {test,expect} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {TrafficRoute} from '../../src/game/systems/travelRoutes';

for(const viewport of [{width:1280,height:720},{width:844,height:390}])test.describe(`World atmosphere at ${viewport.width}px`,()=>{
test.use({viewport,hasTouch:viewport.width===844,isMobile:viewport.width===844});
test('shadows, moving water and streamed road/sea traffic',async({page})=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?e2e');
  await page.getByRole('button',{name:'Start New Game',exact:true}).click();
  await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
  expect(await page.evaluate(()=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const image=s.children.getByName('world-ground-shadows') as Phaser.GameObjects.Image;
    const canvas=image.texture.getSourceImage() as HTMLCanvasElement;
    return canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0);
  })).toBe(true);
  // Use a real existing trade route; avoid relying on stale town coordinates.
  const cartId=await page.evaluate(()=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const traffic=(s as unknown as {traffic:{roads:TrafficRoute[];elapsed:number}}).traffic;
    const route=traffic.roads.find(r=>r.id.startsWith('cart:oakmere:highmere'))!;
    const p=route.points[Math.floor(route.points.length*.4)];s.player.restoreAt(p.x,p.y);
    (s as unknown as {lastSafe:{x:number;y:number}}).lastSafe={...p};
    s.streamCinematicView(p.x,p.y);s.cameras.main.centerOn(p.x,p.y);
    // Put this caravan near the fixture through its normal route phase.
    route.phase=Math.floor(route.points.length*.4)*48/route.speed*1000-traffic.elapsed;
    return route.id;
  });
  await expect.poll(()=>page.evaluate(id=>Boolean(window.__mernondnaGame!.scene.getScene('world').children.getByName(id)),cartId)).toBe(true);
  const cartBefore=await page.evaluate(id=>{const sprite=window.__mernondnaGame!.scene.getScene('world').children.getByName(id) as Phaser.GameObjects.Sprite;return {x:sprite.x,y:sprite.y};},cartId);
  const readCartMotion=()=>page.evaluate(id=>{
    const scene=window.__mernondnaGame!.scene.getScene('world');
    const horse=scene.children.getByName('horse:'+id) as Phaser.GameObjects.Sprite;
    const wheels=[0,1].map(i=>scene.children.getByName('wheel:'+id+':'+i) as Phaser.GameObjects.Sprite);
    return {horseFrame:horse.frame.name,wheelFrames:wheels.map(w=>w.frame.name)};
  },cartId);
  const initialMotion=await readCartMotion();
  await expect.poll(async()=>(await readCartMotion()).horseFrame).not.toBe(initialMotion.horseFrame);
  await expect.poll(async()=>(await readCartMotion()).wheelFrames).not.toEqual(initialMotion.wheelFrames);
  await expect.poll(()=>page.evaluate(({id,before})=>{const sprite=window.__mernondnaGame!.scene.getScene('world').children.getByName(id) as Phaser.GameObjects.Sprite;return Math.hypot(sprite.x-before.x,sprite.y-before.y);},{id:cartId,before:cartBefore})).toBeGreaterThan(8);
  await page.screenshot({path:`test-results/road-traffic-${viewport.width}.png`});
  const artHashes=await page.evaluate(()=>{
    const scene=window.__mernondnaGame!.scene.getScene('world');
    return ['horse-east','horse-south','horse-north'].map(key=>Array.from({length:4},(_,i)=>{
      const f=scene.textures.getFrame(key,i)!,canvas=f.source.image as HTMLCanvasElement;
      const pixels=canvas.getContext('2d')!.getImageData(f.cutX,f.cutY,f.cutWidth,f.cutHeight).data;
      let hash=2166136261;for(const value of pixels)hash=Math.imul(hash^value,16777619);return hash;
    }));
  });
  artHashes.forEach(hashes=>expect(new Set(hashes).size).toBe(4));
  // Inspect front and rear harness registration as well as real road motion.
  for(const direction of [0,3]){
    await page.evaluate(({id,direction})=>{
      const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      scene.scene.pause();scene.player.setVisible(false);
      const traffic=(scene as unknown as {traffic:{active:Map<string,{sprite:Phaser.GameObjects.Sprite}>;presentCart(v:unknown,x:number,y:number,d:number,distance:number,moving:boolean):void}}).traffic;
      const vehicle=traffic.active.get(id)!;traffic.presentCart(vehicle,vehicle.sprite.x,vehicle.sprite.y,direction,0,false);
    },{id:cartId,direction});
    await page.screenshot({path:`test-results/cart-heading-${direction}-${viewport.width}.png`});
  }
  await page.evaluate(()=>{const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;scene.player.setVisible(true);scene.scene.resume();});
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  const pausedCartMotion=await readCartMotion();await page.waitForTimeout(250);
  expect(await readCartMotion()).toEqual(pausedCartMotion);
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  // Frame harbor traffic while retaining a safe logical player on nearby land.
  await page.evaluate(async()=>{
    const townsPath='/src/data/towns.ts',routesPath='/src/game/systems/travelRoutes.ts';
    const {TOWN_BY_ID}=await import(townsPath),{seaRoute,routePosition}=await import(routesPath);
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const town=TOWN_BY_ID.tidewatch.world;
    const world=(s as unknown as {worldGenerator:unknown}).worldGenerator;
    const cx=Math.floor(town.x/1536),cy=Math.floor((town.y+1800)/1536);
    const route=seaRoute(world,cx,cy)??seaRoute(world,cx,cy+1);
    if(!route)throw Error('No navigable harbor traffic lane');
    s.player.restoreAt(town.x,town.y+750);
    (s as unknown as {lastSafe:{x:number;y:number}}).lastSafe={x:town.x,y:town.y+750};
    const traffic=(s as unknown as {traffic:{elapsed:number}}).traffic,p=routePosition(route,traffic.elapsed);
    s.cameras.main.stopFollow().centerOn(p.x,p.y);s.streamCinematicView(p.x,p.y);
  });
  await expect.poll(()=>page.evaluate(()=>window.__mernondnaGame!.scene.getScene('world').children.list.filter(o=>o.name.startsWith('boat:')).length)).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(id=>Boolean(window.__mernondnaGame!.scene.getScene('world').children.getByName('horse:'+id)),cartId)).toBe(false);
  const waterSample=()=>page.evaluate(()=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    if(s.registry.get('openSeaView')){const ocean=s.children.getByName('ocean-foam-surface') as Phaser.GameObjects.TileSprite;return ocean.tilePositionX+ocean.tilePositionY;}
    const canvas=s.textures.get('moving-water').getSourceImage() as HTMLCanvasElement;
    const pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
    let sum=0;for(let i=3;i<pixels.length;i+=4)sum+=pixels[i];return sum;
  });
  const firstWater=await waterSample();expect(firstWater).toBeGreaterThan(0);
  await expect.poll(waterSample).not.toBe(firstWater);
  const before=await page.evaluate(()=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const boat=s.children.list.find(o=>o.name.startsWith('boat:')) as Phaser.GameObjects.Sprite;
    return {id:boat.name,x:boat.x,y:boat.y};
  });
  const crewDetails=await page.evaluate(id=>{
    const scene=window.__mernondnaGame!.scene.getScene('world');
    const boat=scene.children.getByName(id) as Phaser.GameObjects.Sprite;
    const crew=scene.children.getByName('helmsman:'+id) as Phaser.GameObjects.Sprite;
    const rail=scene.children.getByName('boat-rail:'+id) as Phaser.GameObjects.Sprite;
    return {boatWidth:boat.displayWidth,crewVisible:crew.visible,crewScale:crew.scaleY,crewDepth:crew.depth,boatDepth:boat.depth,railDepth:rail.depth,
      wakeTextures:scene.children.list.filter(o=>o.name.startsWith('wake:'+id)).map(o=>(o as Phaser.GameObjects.Sprite).texture.key)};
  },before.id);
  expect(crewDetails.boatWidth).toBeGreaterThan(350);
  expect(crewDetails.crewVisible).toBe(true);expect(crewDetails.crewScale).toBeGreaterThan(0);
  expect(crewDetails.crewDepth).toBeGreaterThan(crewDetails.boatDepth);expect(crewDetails.railDepth).toBeGreaterThan(crewDetails.crewDepth);
  expect(crewDetails.wakeTextures).toEqual(['water-foam','water-foam']);
  await expect.poll(()=>page.evaluate(before=>{const boat=window.__mernondnaGame!.scene.getScene('world').children.getByName(before.id) as Phaser.GameObjects.Sprite;return boat?Math.hypot(boat.x-before.x,boat.y-before.y):0;},before)).toBeGreaterThan(6);
  await page.screenshot({path:`test-results/harbor-traffic-${viewport.width}.png`});
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  const paused=await page.evaluate(before=>{const boat=window.__mernondnaGame!.scene.getScene('world').children.getByName(before.id) as Phaser.GameObjects.Sprite;return {x:boat.x,y:boat.y};},before);
  await page.waitForTimeout(250);
  expect(await page.evaluate(before=>{const boat=window.__mernondnaGame!.scene.getScene('world').children.getByName(before.id) as Phaser.GameObjects.Sprite;return {x:boat.x,y:boat.y};},before)).toEqual(paused);
  expect(errors).toEqual([]);
});
});
