import {test,expect} from '@playwright/test';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {AmbientWildlifeSystem} from '../../src/game/systems/AmbientWildlifeSystem';
import type {WildlifeCover,WildlifeCoverIndex} from '../../src/game/systems/wildlifeCover';
import type {GroundShadowSystem} from '../../src/game/systems/GroundShadowSystem';
import type Phaser from 'phaser';

test.use({trace:'off'});
test('wildlife pairs, limits, pause, startle, release and prepared art',async({page})=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
  await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
  const result=await page.evaluate(async()=>{
    const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const runtime=scene as unknown as {wildlife:AmbientWildlifeSystem;groundShadows:GroundShadowSystem;contentManager:{snapshot():unknown}};
    const path='/src/game/systems/AmbientWildlifeSystem.ts';
    const {AmbientWildlifeSystem:Wildlife}=await import(path) as typeof import('../../src/game/systems/AmbientWildlifeSystem');
    type Slot={source?:WildlifeCover;destination?:WildlifeCover;phase:string;groupId?:number;sprite:Phaser.GameObjects.Sprite;age:number};
    type Bird={cover?:WildlifeCover;phase:string;groupId?:number;sprite:Phaser.GameObjects.Sprite;age:number;direction:{x:number;y:number};departureDelay?:number};
    type Inspect={animals:Slot[];covers:WildlifeCoverIndex;nextEventAt:number;birds:{birds:Bird[];nextEventAt:number}};
    const inspect=(system:AmbientWildlifeSystem)=>system as unknown as Inspect;
    scene.scene.pause();scene.physics.world.pause();
    const resident=inspect(runtime.wildlife),ledger=JSON.stringify(runtime.contentManager.snapshot());
    const bodyCount=scene.physics.world.bodies.size,displayCount=scene.children.length;
    const p={x:scene.player.x,y:scene.player.y};
    let blocked=false;
    const make=(coast=false)=>new Wildlife(scene,{
      habitat:()=>({region:coast?'portquill':'trandum',biome:coast?'coast':'forest',terrain:coast?'sand':'forest'}),
      clearRoute:()=>!blocked,coastalSite:()=>blocked?null:{x:1,y:0},
    },runtime.groundShadows,()=>0);
    const sys=make(),r=inspect(sys);r.birds.nextEventAt=Infinity;
    const props:Array<Phaser.GameObjects.Image>=[];
    const cover=(system:AmbientWildlifeSystem,x:number,y:number,coast=false)=>{
      const actor=scene.add.image(x,y,'world_assets',0).setOrigin(.5,1).setDepth(y).setVisible(false);
      props.push(actor);system.register(actor,coast?'woodland_props':'world_assets',coast?0:0,{x,y},200,260);return actor;
    };
    // Keep both tree-side meeting positions outside the 110-unit player buffer.
    const source=cover(sys,p.x+200,p.y+80);
    cover(sys,p.x+480,p.y+140);cover(sys,p.x+480,p.y-140);cover(sys,p.x+650,p.y+30);
    sys.update(100,p,12,false);sys.update(100,p,12,false);
    const reserved=r.animals.filter(a=>a.source).length;
    for(let i=0;i<8;i++)sys.update(100,p,12,false);
    const squirrels=r.animals.filter(a=>a.source&&a.phase!=='pending');
    const pair=squirrels.length===2&&squirrels[0].groupId===squirrels[1].groupId&&squirrels[0].groupId!==undefined;
    const distinctTrees=squirrels.length===2&&squirrels[0].destination?.id!==squirrels[1].destination?.id;
    r.nextEventAt=Infinity;
    let squirrelSocial=false,squirrelResumed=false;
    for(let i=0;i<70;i++){
      sys.update(100,p,12,false);
      if(squirrels.length===2&&squirrels.every(a=>a.phase==='social'&&a.sprite.getData('wildlifeSocializing'))){
        const [a,b]=squirrels;
        squirrelSocial=a.sprite.flipX===(b.sprite.x<a.sprite.x)&&b.sprite.flipX===(a.sprite.x<b.sprite.x)
          &&Math.hypot(a.sprite.x-b.sprite.x,a.sprite.y-b.sprite.y)>=40;
      }
      if(squirrelSocial&&squirrels.every(a=>a.phase!=='social'))squirrelResumed=true;
    }
    const pausedBefore=squirrels.map(a=>[a.age,a.sprite.x,a.sprite.y]);sys.update(500,p,12,true);
    const paused=JSON.stringify(pausedBefore)===JSON.stringify(squirrels.map(a=>[a.age,a.sprite.x,a.sprite.y]));
    source.destroy();const unloaded=r.animals.every(a=>!a.source);
    sys.destroy();
    const checks=[];
    for(const coast of [false,true]){
      const birds=make(coast),b=inspect(birds);
      cover(birds,p.x+450,p.y,coast);
      // Ground pairs exercise facing; branch perching remains separate behavior.
      for(const anchor of b.covers.nearby(p,700))anchor.perch=undefined;
      birds.update(100,p,12,false);birds.update(100,p,12,false);
      const flock=b.birds.birds.filter(a=>a.cover);
      const paired=flock.length===2&&flock[0].groupId===flock[1].groupId&&flock[0].groupId!==undefined;
      const arrival=flock.every(a=>a.phase==='arrival');
      const spaced=flock.length===2&&Math.hypot(flock[0].sprite.x-flock[1].sprite.x,flock[0].sprite.y-flock[1].sprite.y)>25;
      let social=false;
      for(let i=0;i<80;i++){
        birds.update(100,p,12,false);
        if(flock.length===2&&flock.every(a=>a.sprite.getData('wildlifeSocializing'))){
          const [a,bird]=flock;
          social=a.sprite.flipX===(bird.sprite.x<a.sprite.x)&&bird.sprite.flipX===(a.sprite.x<bird.sprite.x);
        }
      }
      const landed=flock.every(a=>a.phase==='rest');
      if(flock[0]){
        const target={x:flock[0].sprite.x,y:flock[0].sprite.y};
        for(let i=0;i<7;i++)birds.update(100,target,12,false);
      }
      const departed=flock.every(a=>a.phase==='flight');
      const together=flock.length===2&&Math.hypot(flock[0].direction.x-flock[1].direction.x,flock[0].direction.y-flock[1].direction.y)<.001;
      birds.reset();const reset=b.birds.birds.every(a=>!a.cover&&!a.sprite.visible);
      checks.push({paired,arrival,spaced,landed,social,departed,together,reset});birds.destroy();
    }
    const roofSystem=make(),roofInspect=inspect(roofSystem);
    const roofActor=scene.add.image(p.x+450,p.y,'world_buildings',0).setOrigin(.5,1).setDepth(p.y);
    props.push(roofActor);blocked=true;
    roofSystem.register(roofActor,'world_buildings',0,{x:p.x+450,y:p.y},240,240);
    for(let i=0;i<80;i++)roofSystem.update(100,p,12,false);
    const roofBird=roofInspect.birds.birds.find(a=>a.cover);
    const roofLanding=roofBird?.cover?.kind==='roof'&&roofBird.phase==='rest'
      &&Math.abs(roofBird.sprite.x-(p.x+402))<.01&&Math.abs(roofBird.sprite.y-(p.y-168))<.01;
    roofActor.destroy();const roofUnloaded=roofInspect.birds.birds.every(a=>!a.cover);roofSystem.destroy();
    const streetSystem=new Wildlife(scene,{
      habitat:()=>({region:'trandum',biome:'meadow',terrain:'stone'}),
      clearRoute:()=>false,birdSite:()=>true,
    },runtime.groundShadows,()=>0);
    const street=inspect(streetSystem);
    cover(streetSystem,p.x+450,p.y);
    for(const anchor of street.covers.nearby(p,700))anchor.perch=undefined;
    let streetSocial=false;
    for(let i=0;i<80;i++){
      streetSystem.update(100,p,12,false);
      if(street.birds.birds.every(a=>a.sprite.getData('wildlifeSocializing')))streetSocial=true;
    }
    const streetPair=street.birds.birds.every(a=>a.cover&&a.phase==='rest');
    streetSystem.destroy();
    const rejected=make(),bad=inspect(rejected);blocked=true;
    cover(rejected,p.x+200,p.y);cover(rejected,p.x+480,p.y+120);cover(rejected,p.x+480,p.y-120);
    for(let i=0;i<20;i++)rejected.update(100,p,12,false);
    const safe=bad.animals.every(a=>!a.source)&&bad.birds.birds.every(a=>!a.cover);rejected.destroy();
    for(const actor of props)if(actor.scene)actor.destroy();
    const art=[['wildlife-rabbit',18,96],['wildlife-squirrel',24,128],['wildlife-woodland-bird',18,128],['wildlife-coastal-gull',18,128]] as const;
    const frames=art.every(([key,count,cell])=>Array.from({length:count},(_,i)=>{
      const frame=scene.textures.getFrame(key,i),bounds=(frame.customData as {visibleBounds:{left:number;top:number;width:number;height:number}}).visibleBounds;
      return frame.cutWidth===cell&&frame.cutHeight===cell&&bounds.left>=1&&bounds.top>=1
        &&bounds.left+bounds.width<=cell-1&&bounds.top+bounds.height<=cell-1;
    }).every(Boolean));
    // Render the current atlas frames at physical game scale for inspection.
    const view=scene.cameras.main.worldView;
    const gallery=scene.add.rectangle(view.centerX,view.centerY,620,380,0xc4ccb0).setDepth(1e8);
    gallery.setName('wildlife-acceptance-gallery');
    for(const [row,[key,count,cell]] of art.entries()){
      const height=key==='wildlife-rabbit'?26:key==='wildlife-squirrel'?32:key==='wildlife-coastal-gull'?26:14;
      const registry=key==='wildlife-rabbit'?'rabbitVisibleHeight':key==='wildlife-squirrel'?'squirrelVisibleHeight':key==='wildlife-coastal-gull'?'coastalGullVisibleHeight':'woodlandBirdVisibleHeight';
      for(let i=0;i<count;i++)scene.add.image(view.centerX-270+(i%12)*48,view.centerY-120+row*80+Math.floor(i/12)*35,key,i)
        .setOrigin(.5,(cell===96?86:90)/cell).setScale(height/Number(scene.registry.get(registry))).setDepth(1e8+1);
    }
    return {pool:resident.animals.length+resident.birds.birds.length,reserved,pair,distinctTrees,squirrelSocial,squirrelResumed,
      paused,unloaded,checks,roofLanding,roofUnloaded,streetPair,streetSocial,safe,frames,
      noBodies:scene.physics.world.bodies.size===bodyCount,noSavedRecords:JSON.stringify(runtime.contentManager.snapshot())===ledger,
      releasedDisplays:displayCount===scene.children.length-1-78};
  });
  expect(result).toEqual({pool:6,reserved:2,pair:true,distinctTrees:true,squirrelSocial:true,squirrelResumed:true,paused:true,unloaded:true,
    checks:[false,true].map(()=>({paired:true,arrival:true,spaced:true,landed:true,social:true,departed:true,together:true,reset:true})),
    roofLanding:true,roofUnloaded:true,streetPair:true,streetSocial:true,
    safe:true,frames:true,noBodies:true,noSavedRecords:true,releasedDisplays:true});
  expect(errors).toEqual([]);
  await page.screenshot({path:'test-results/wildlife-acceptance.png'});
});
