import {test,expect} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {Enemy} from '../../src/game/entities/Enemy';

test.use({viewport:{width:1280,height:1000}});
test('side footwork advances without restarting and preserves combat registration',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
 const audit=await page.evaluate(async()=>{
  const ep='/src/game/entities/Enemy.ts',dp='/src/data/enemies.ts',sp='/src/store/gameStore.ts',gp='/src/data/directionalEnemyArt.ts';
  const {Enemy:Actor}=await import(ep),{ENEMIES}=await import(dp),{useGameStore}=await import(sp),{DIRECTIONAL_ENEMY_ART}=await import(gp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;useGameStore.getState().openPanel('pause');s.physics.world.pause();
  const playback=ENEMIES.flatMap((def:{id:string;moveSpeed:number})=>[-1,1].map(direction=>{
   const e=new Actor(s,def,s.player.x+100,s.player.y,'gait:'+def.id) as Enemy;
   const b=e.body as Phaser.Physics.Arcade.Body;b.setVelocity(direction*def.moveSpeed,0);
   const frames:number[]=[];
   for(let tick=0;tick<24;tick++){
    (e as unknown as {updateVisual(time:number):void}).updateVisual(s.time.now+tick*100);
    (e as unknown as {preUpdate(time:number,delta:number):void}).preUpdate(s.time.now+tick*100,100);frames.push(e.anims.currentFrame!.index);
   }
   const before={x:b.center.x,y:b.center.y,w:b.width,h:b.height};
   (e as unknown as {playAction(state:string):void}).playAction('attack');
   const after={x:b.center.x,y:b.center.y,w:b.width,h:b.height};
   b.setVelocity(0,0);e.playLocomotion('idle');const idle=e.anims.currentAnim!.key;
   e.destroy();return {id:def.id,direction,frames,before,after,idle};
  }));
  const legs=DIRECTIONAL_ENEMY_ART.filter((a:{species:number})=>a.species!==3).map((art:{species:number;id:string})=>{
   const clip=s.anims.get('enemy:'+art.species+':walk:right');
   const masks=clip.frames.map((f:Phaser.Animations.AnimationFrame)=>{
    const frame=s.textures.get(f.textureKey).get(f.textureFrame),data=frame.customData as {visibleBounds:{top:number;height:number}};
    const canvas=s.textures.get(f.textureKey).getSourceImage() as HTMLCanvasElement;
    const pixels=canvas.getContext('2d')!.getImageData(frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight).data;
    const start=Math.floor((data.visibleBounds.top+data.visibleBounds.height*.82)*2);
    let mask='',left=frame.cutWidth,right=0;
    for(let y=start;y<frame.cutHeight;y++)for(let x=0;x<frame.cutWidth;x++){
     const occupied=pixels[(y*frame.cutWidth+x)*4+3]>128;mask+=occupied?'1':'0';
     if(occupied){left=Math.min(left,x);right=Math.max(right,x);}
    }
    return {mask,width:right-left};
   });return {id:art.id,unique:new Set(masks.map(m=>m.mask)).size,widthRange:Math.max(...masks.map(m=>m.width))-Math.min(...masks.map(m=>m.width))};
  });
  const bandit=['down','left','right','up'].map(direction=>{
   const idle=s.anims.get('enemy:1:idle:'+direction).frames[0],walk=s.anims.get('enemy:1:walk:'+direction);
   const hoodXs=walk.frames.map(f=>{
    const frame=s.textures.get(f.textureKey).get(f.textureFrame),bounds=(frame.customData as {visibleBounds:{top:number;height:number}}).visibleBounds;
    const canvas=s.textures.get(f.textureKey).getSourceImage() as HTMLCanvasElement;
    const pixels=canvas.getContext('2d')!.getImageData(frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight).data;
    let sum=0,weight=0;
    for(let y=Math.ceil(bounds.top*2);y<(bounds.top+bounds.height*.2)*2;y++)for(let x=0;x<frame.cutWidth;x++){
     const alpha=pixels[(y*frame.cutWidth+x)*4+3];if(alpha>128){sum+=x*alpha;weight+=alpha;}
    }
    return sum/weight;
   });
   return {direction,neutral:idle.textureFrame,frameRate:walk.frameRate,frames:walk.frames.map(f=>f.textureFrame),
    hoodDrift:Math.max(...hoodXs)-Math.min(...hoodXs),whole:walk.frames.every(f=>(s.textures.get(f.textureKey).get(f.textureFrame).customData as {fullSprite:boolean}).fullSprite)};
  });
  const sidePlayback=[-1,1].map(direction=>{
   const def=ENEMIES.find((e:{id:string})=>e.id==='road-bandit');
   const e=new Actor(s,def,s.player.x+100,s.player.y,'smooth-bandit:'+direction) as Enemy;
   (e.body as Phaser.Physics.Arcade.Body).setVelocity(direction*def.moveSpeed,0);e.playLocomotion('walk');
   const changes:Array<{frame:number;time:number}>=[{frame:Number(e.frame.name),time:0}];
   for(let tick=1;tick<=132;tick++){
    (e as unknown as {updateVisual(time:number):void}).updateVisual(s.time.now+tick*10);
    (e as unknown as {preUpdate(time:number,delta:number):void}).preUpdate(s.time.now+tick*10,10);
    const frame=Number(e.frame.name);if(frame!==changes.at(-1)!.frame)changes.push({frame,time:tick*10});
   }
   e.destroy();return {direction,changes};
  });
  const verticalPlayback=[-1,1].map(direction=>{
   const def=ENEMIES.find((e:{id:string})=>e.id==='road-bandit');
   const e=new Actor(s,def,s.player.x+100,s.player.y,'vertical-bandit:'+direction) as Enemy;
   const body=e.body as Phaser.Physics.Arcade.Body;body.setVelocity(0,direction*def.moveSpeed);
   const frames:number[]=[];
   for(let tick=0;tick<24;tick++){
    (e as unknown as {updateVisual(time:number):void}).updateVisual(s.time.now+tick*100);
    (e as unknown as {preUpdate(time:number,delta:number):void}).preUpdate(s.time.now+tick*100,100);frames.push(Number(e.frame.name));
   }
   body.setVelocity(0,0);e.playLocomotion('idle');const stopped=Number(e.frame.name);e.destroy();
   return {direction,frames,stopped};
  });return {playback,legs,bandit,verticalPlayback,sidePlayback};
 });
 await test.info().attach('enemy-footwork-audit.json',{body:JSON.stringify(audit,null,2),contentType:'application/json'});
 for(const p of audit.playback){
  expect(new Set(p.frames).size,p.id+'/'+p.direction).toBeGreaterThanOrEqual(4);
  expect(p.frames.slice(10).some((f:number,i:number)=>f<p.frames[i+9]),p.id+' loops').toBe(true);
  expect(p.idle).toContain(':idle:');
  for(const key of ['x','y','w','h'] as const)expect(p.after[key]).toBeCloseTo(p.before[key],7);
 }
 for(const l of audit.legs){expect(l.unique,l.id+' boot silhouettes').toBeGreaterThanOrEqual(4);expect(l.widthRange,l.id+' stride width').toBeGreaterThan(4);}
 for(const b of audit.bandit){
  expect(b.whole).toBe(true);
  if(b.direction==='left'||b.direction==='right'){
   const base=Number(b.neutral);
   expect(b.frameRate).toBe(9);expect(b.frames).toEqual([base,base+1,base+2,base,base+3,base+4]);
   expect(b.hoodDrift,b.direction+' torso registration').toBeLessThan(2);
  }else{
   expect(b.frameRate).toBe(8);expect(b.frames).toEqual(b.direction==='down'?[1,2,3,4]:[16,17,18,19]);
  }
 }
 for(const p of audit.sidePlayback){
  const base=p.direction<0?5:10;
  expect(p.changes.slice(0,7).map(c=>c.frame)).toEqual([base,base+1,base+2,base,base+3,base+4,base]);
  [70,130,130,70,130,130].forEach((duration,i)=>expect(Math.abs(p.changes[i+1].time-p.changes[i].time-duration)).toBeLessThanOrEqual(10));
 }
 for(const p of audit.verticalPlayback){
  expect([...new Set(p.frames)].sort((a:number,b:number)=>a-b)).toEqual(p.direction>0?[1,2,3,4]:[16,17,18,19]);
  expect(p.stopped).toBe(p.direction>0?0:15);
 }
 await page.evaluate(async()=>{
  const gp='/src/data/directionalEnemyArt.ts',ap='/src/data/art.ts';
  const {DIRECTIONAL_ENEMY_ART}=await import(gp),{ART_BY_KEY}=await import(ap);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  s.children.list.forEach(o=>(o as Phaser.GameObjects.Sprite).setVisible?.(false));
  const cx=s.player.x,cy=s.player.y;s.cameras.main.stopFollow();s.cameras.main.setZoom(1);s.cameras.main.centerOn(cx,cy);
  s.add.rectangle(cx,cy,1500,1000,0x202b25).setDepth(2000000);
  DIRECTIONAL_ENEMY_ART.filter((a:{species:number})=>[1,2,4,5].includes(a.species)).forEach((a:{species:number;id:string},row:number)=>{
   const clip=s.anims.get('enemy:'+a.species+':walk:right');
   clip.frames.forEach((f:Phaser.Animations.AnimationFrame,col:number)=>{
    const x=cx-(a.species===5?420:520)+col*(a.species===1?208:a.species===5?270:290),y=cy+[-260,-100,70,340][row],sheet=ART_BY_KEY[f.textureKey];
    s.add.sprite(x,y,f.textureKey,f.textureFrame).setScale(.5*(a.species===5?1:a.species===4?1.3:a.species===1?1.16:1))
     .setOrigin(.5,1-(sheet.groundPadding??2)/sheet.frameHeight).setDepth(2000001).setName('gait-preview').setData({species:a.species,pose:col});
    s.add.text(x,y+8,a.id+' '+(col+1),{fontSize:'12px',color:'#ffffff'}).setOrigin(.5,0).setDepth(2000002);
   });
  });
  const gameCanvas=window.__mernondnaGame!.canvas;
  for(const element of [...document.querySelectorAll('body *')])if(element instanceof HTMLElement&&element!==gameCanvas&&!element.contains(gameCanvas))element.style.visibility='hidden';
 });
 await page.waitForTimeout(100);await page.screenshot({path:'test-results/enemy-footwork-rendered.png'});
 await page.evaluate(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  s.children.list.filter(o=>o.name==='gait-preview').forEach(o=>{
   const sprite=o as Phaser.GameObjects.Sprite,clip=s.anims.get('enemy:'+sprite.getData('species')+':walk:left'),frame=clip.frames[sprite.getData('pose')];
   sprite.setTexture(frame.textureKey,frame.textureFrame);
  });
 });
 await page.waitForTimeout(100);await page.screenshot({path:'test-results/enemy-footwork-left-rendered.png'});
 await page.evaluate(async()=>{
  const path='/src/data/art.ts',{ART_BY_KEY}=await import(path);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  s.children.list.forEach(o=>(o as Phaser.GameObjects.Sprite).setVisible?.(false));
  const cx=s.player.x,cy=s.player.y;s.add.rectangle(cx,cy,1500,1000,0x202b25).setDepth(2000000);
  ['down','up','left','right'].forEach((direction,row)=>{
   s.anims.get('enemy:1:walk:'+direction).frames.forEach((f,col)=>{
    const x=cx-520+col*(row<2?290:208),y=cy-260+row*160,sheet=ART_BY_KEY[f.textureKey];
    s.add.sprite(x,y,f.textureKey,f.textureFrame).setScale(.58)
     .setOrigin(.5,1-(sheet.groundPadding??2)/sheet.frameHeight).setDepth(2000001);
    s.add.text(x,y+8,direction+' '+(col+1),{fontSize:'12px',color:'#ffffff'}).setOrigin(.5,0).setDepth(2000002);
   });
  });
 });
 await page.waitForTimeout(100);await page.screenshot({path:'test-results/bandit-directions-rendered.png'});
 expect(errors).toEqual([]);
});
