import {test,expect} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {Enemy} from '../../src/game/entities/Enemy';
import type {Npc} from '../../src/game/entities/Npc';
for(const viewport of [{width:1280,height:720},{width:844,height:390}])test.describe('Actor direction audit at '+viewport.width+'px',()=>{
 test.use({viewport,hasTouch:viewport.width===844,isMobile:viewport.width===844});
 test('all NPC roles and enemy species have animated side walks and directional rest',async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
  await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
  const results=await page.evaluate(async()=>{
   const enemyPath='/src/game/entities/Enemy.ts',npcPath='/src/game/entities/Npc.ts',defsPath='/src/data/enemies.ts',npcsPath='/src/data/npcs.ts',artPath='/src/data/art.ts',directionsPath='/src/data/directionalEnemyArt.ts',storePath='/src/store/gameStore.ts';
   const [{Enemy:EnemyActor},{Npc:NpcActor},{ENEMIES},{NPCS},{ART_BY_KEY},{DIRECTIONAL_ENEMY_ART,ACTOR_DIRECTIONS},{useGameStore}]=await Promise.all([import(enemyPath),import(npcPath),import(defsPath),import(npcsPath),import(artPath),import(directionsPath),import(storePath)]);
   const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
   useGameStore.getState().openPanel('pause');s.physics.world.pause();
   const velocities={down:{x:0,y:80},left:{x:-80,y:0},right:{x:80,y:0},up:{x:0,y:-80}};
   const hashFrame=(texture:Phaser.Textures.Texture,frame:Phaser.Textures.Frame)=>{
    const canvas=texture.getSourceImage() as HTMLCanvasElement;
    const data=canvas.getContext('2d')!.getImageData(frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight).data;let hash=0;
    for(let i=0;i<data.length;i+=11)hash=(hash*31+data[i])|0;return hash;
   };
   const enemies:DIRECTION_RESULT[]=[];
   type DIRECTION_RESULT={id:string;direction:string;walk:string;idle:string;frames:number;clipSafe:boolean;scaleStable:boolean;flip:boolean};
   for(const family of DIRECTIONAL_ENEMY_ART){
    const def=ENEMIES.find((e:{spriteFrame:number})=>e.spriteFrame===family.species)!;
    const e=new EnemyActor(s,def,s.player.x+220,s.player.y,'audit:'+def.id) as Enemy;
    const body=e.body as Phaser.Physics.Arcade.Body,scale=e.scaleX;
    for(const direction of ACTOR_DIRECTIONS as Array<keyof typeof velocities>){
     const velocity=velocities[direction];body.setVelocity(velocity.x,velocity.y);e.playLocomotion('walk');
     const animation=e.anims.currentAnim!,frames=animation.frames.map(f=>s.textures.get(f.textureKey).get(f.textureFrame));
     const sheet=ART_BY_KEY[e.texture.key];
     const clipSafe=frames.every(f=>{const b=(f.customData as {visibleBounds:{left:number;top:number;width:number;height:number}}).visibleBounds;return b.left>=1&&b.top>=1&&b.left+b.width<=sheet.frameWidth-1&&b.top+b.height<=sheet.frameHeight;});
     const walk=animation.key;body.setVelocity(0,0);e.playLocomotion('idle');
     enemies.push({id:def.id,direction,walk,idle:e.anims.currentAnim!.key,frames:new Set(frames.map(f=>hashFrame(e.texture,f))).size,clipSafe,scaleStable:e.scaleX===scale,flip:e.flipX});
    }
    e.destroy();
   }
   const npcs:Array<{texture:string;direction:string;key:string;frames:number;stoppedFrame:number;idleKey:string;sourcePose:number;idleFrames:number;playing:boolean;scaleStable:boolean;bodyStable:boolean}>=[];
   const textures=[...new Set(NPCS.map((n:{spriteTexture?:string})=>n.spriteTexture))] as string[];
   for(const texture of textures){
    const def=NPCS.find((n:{spriteTexture:string})=>n.spriteTexture===texture)!;
    const npc=new NpcActor(s,def,s.player.x,s.player.y,{x:s.player.x,y:s.player.y}) as Npc;
    const body=npc.body as Phaser.Physics.Arcade.Body;
    const presentation=npc as unknown as {playDirection(x:number,y:number,walking:boolean):void};
    for(const [direction,velocity] of Object.entries(velocities)){
     body.setVelocity(velocity.x,velocity.y);presentation.playDirection(velocity.x,velocity.y,true);
     const animation=npc.anims.currentAnim!,scale=npc.scaleX;
     const frames=animation.frames.map(f=>s.textures.get(f.textureKey).get(f.textureFrame));
     const before={x:body.center.x,y:body.center.y,width:body.width,height:body.height};
     body.setVelocity(0,0);presentation.playDirection(velocity.x,velocity.y,false);
     const idle=npc.anims.currentAnim!,idleFrames=idle.frames.map(f=>s.textures.get(f.textureKey).get(f.textureFrame));
     npcs.push({texture,direction,key:animation.key,frames:new Set(frames.map(f=>hashFrame(s.textures.get(f.texture.key),f))).size,
       stoppedFrame:Number(npc.frame.name),idleKey:idle.key,sourcePose:(npc.frame.customData as {sourcePose:number}).sourcePose,
       idleFrames:new Set(idleFrames.map(f=>hashFrame(s.textures.get(f.texture.key),f))).size,
       playing:npc.anims.isPlaying,scaleStable:npc.scaleX===scale,
       bodyStable:Math.abs(before.x-body.center.x)<1e-6&&Math.abs(before.y-body.center.y)<1e-6&&Math.abs(before.width-body.width)<1e-6&&Math.abs(before.height-body.height)<1e-6});
    }
    npc.destroy();
   }
   return {enemies,npcs};
  });
  await test.info().attach('actor-direction-audit.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  expect(results.enemies).toHaveLength(24);expect(results.npcs).toHaveLength(36);
  for(const r of results.enemies){
   expect(r.walk,r.id+'/'+r.direction).toContain(':walk:'+r.direction);
   expect(r.idle).toContain(':idle:'+r.direction);expect(r.frames).toBeGreaterThanOrEqual(4);
   expect(r.clipSafe,r.id+'/'+r.direction).toBe(true);expect(r.scaleStable).toBe(true);expect(r.flip).toBe(false);
  }
  for(const r of results.npcs){
   expect(r.key).toBe(r.texture+'-'+r.direction);expect(r.frames,r.texture+'/'+r.direction).toBeGreaterThanOrEqual(3);
   // All directions breathe at rest. Side/back reuse complete authored poses
   // with the same canvas density, registration and physics scale as walking.
   if(r.direction!=='down')expect(r.scaleStable,r.texture+'/'+r.direction).toBe(true);
   expect(r.idleKey).toBe(r.texture+'-idle'+(r.direction==='down'?'':'-'+r.direction));
   expect(r.playing).toBe(true);expect(r.idleFrames).toBeGreaterThanOrEqual(3);expect(r.bodyStable).toBe(true);
   if(r.direction==='left')expect(r.sourcePose).toBe(6);
   if(r.direction==='right')expect(r.sourcePose).toBe(12);
   if(r.direction==='up')expect(r.sourcePose).toBe(18);
  }
  expect(errors).toEqual([]);
 });
});
