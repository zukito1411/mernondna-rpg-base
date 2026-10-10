import {test,expect} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
test.use({viewport:{width:1280,height:1600}});
test('enemy atlas GPU coordinates and combat appearance audit',async({page})=>{
 test.setTimeout(120000);await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'),null,{timeout:30000});
 const audit=await page.evaluate(async()=>{
  const a='/src/data/animationPacks.ts',d='/src/data/directionalEnemyArt.ts';
  const {enemyAnimation}=await import(a),{DIRECTIONAL_ENEMY_ART}=await import(d);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  const invalid:string[]=[];
  for(const key of ['enemies','enemy_troll','enemy_dragon']){
   const texture=s.textures.get(key);
   for(const frame of Object.values(texture.frames)){
    if(Math.abs(frame.v0-frame.cutY/frame.source.height)>1e-7||Math.abs(frame.v1-(frame.cutY+frame.cutHeight)/frame.source.height)>1e-7)invalid.push(key+'/'+frame.name);
   }
  }
  const sizes=DIRECTIONAL_ENEMY_ART.map((f:{id:string;texture:string;species:number})=>{
   const states=Object.fromEntries(['idle','walk','attack','hurt','death'].map(state=>{
    const clip=enemyAnimation(f.species,state),texture=s.textures.get(clip.texture);
    return [state,clip.frames.map((i:number)=>{const b=(texture.get(i).customData as {visibleBounds:{width:number;height:number;left:number;top:number}}).visibleBounds;return {frame:i,w:b.width,h:b.height,x:b.left,y:b.top};})];
   }));
   const newIdle=s.anims.get('enemy:'+f.species+':idle:right').frames[0];
   const b=(s.textures.get(newIdle.textureKey).get(newIdle.textureFrame).customData as {visibleBounds:{width:number;height:number}}).visibleBounds;
   return {id:f.id,newIdle:b,states};
  });
  return {invalid,sizes};
 });
 console.log('Idle/profile size audit',audit.sizes.map((s:{id:string;newIdle:{height:number};states:{idle:Array<{h:number}>}})=>({id:s.id,legacy:s.states.idle[0].h,directional:s.newIdle.height})));
 await test.info().attach('enemy-appearance-audit.json',{body:JSON.stringify(audit,null,2),contentType:'application/json'});
 expect(audit.invalid).toEqual([]);
 const transitions=await page.evaluate(async()=>{
  const ep='/src/game/entities/Enemy.ts',dp='/src/data/enemies.ts',sp='/src/store/gameStore.ts';
  const {Enemy}=await import(ep),{ENEMIES}=await import(dp),{useGameStore}=await import(sp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;useGameStore.getState().openPanel('pause');
  return ENEMIES.flatMap((def:{id:string})=>[ {x:0,y:80,name:'down'},{x:-80,y:0,name:'left'},{x:80,y:0,name:'right'},{x:0,y:-80,name:'up'} ].map(direction=>{
   const e=new Enemy(s,def,s.player.x+160,s.player.y,'audit:'+def.id);
   const body=e.body as Phaser.Physics.Arcade.Body;body.setVelocity(direction.x,direction.y);e.playLocomotion('walk');
   const before={x:body.center.x,y:body.center.y,w:body.width,h:body.height};
   (e as unknown as {playAction(state:string):void}).playAction('attack');
   const after={x:body.center.x,y:body.center.y,w:body.width,h:body.height};
   const texture=e.texture.key;
   e.playLocomotion('idle');const restored={x:body.center.x,y:body.center.y,w:body.width,h:body.height};e.destroy();
   return {id:def.id+'/'+direction.name,before,after,restored,texture};
  }));
 });
 for(const t of transitions)for(const key of ['x','y','w','h'] as const){expect(t.after[key],t.id+'/'+key).toBeCloseTo(t.before[key],7);expect(t.restored[key]).toBeCloseTo(t.before[key],7);}
 await page.evaluate(async()=>{
  const ap='/src/data/animationPacks.ts',dp='/src/data/directionalEnemyArt.ts',artp='/src/data/art.ts';
  const {enemyAnimation}=await import(ap),{DIRECTIONAL_ENEMY_ART}=await import(dp),{ART_BY_KEY}=await import(artp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;s.cameras.main.stopFollow();
  s.children.list.forEach(o=>(o as Phaser.GameObjects.Sprite).setVisible?.(false));
  s.cameras.main.setZoom(1);s.cameras.main.centerOn(s.player.x,s.player.y);
  const cx=s.player.x,cy=s.player.y;
  s.add.rectangle(cx,cy,1600,2000,0x182029).setDepth(2000000);
  DIRECTIONAL_ENEMY_ART.forEach((a:{id:string;species:number},row:number)=>{
   const y=cy-620+row*220+(row===5?120:0);
   const clips=[s.anims.get('enemy:'+a.species+':idle:right'),s.anims.get('enemy:'+a.species+':walk:right'),s.anims.get(enemyAnimation(a.species,'attack').key)];
   clips.forEach((clip:Phaser.Animations.Animation,col:number)=>{
    const f=clip.frames[col===2?2:0],sheet=ART_BY_KEY[f.textureKey],x=cx-350+col*350;
    s.add.sprite(x,y,f.textureKey,f.textureFrame).setScale(.5*(a.species===5?1.6:a.species===4?1.3:a.species===1?1.16:1))
      .setOrigin(.5,1-(sheet.groundPadding??2)/sheet.frameHeight).setDepth(2000001);
    s.add.text(x,y+10,a.id+' · '+['stand','walk','attack'][col],{fontSize:'13px',color:'#ffffff'}).setOrigin(.5,0).setDepth(2000002);
   });
  });
  const gameCanvas=window.__mernondnaGame!.canvas;
  for(const element of [...document.querySelectorAll('body *')])if(element instanceof HTMLElement&&element!==gameCanvas&&!element.contains(gameCanvas))element.style.visibility='hidden';
 });
 await page.waitForTimeout(100);await page.screenshot({path:'test-results/enemy-combat-rendered.png'});
 await page.evaluate(async()=>{
  const a='/src/data/art.ts',p='/src/data/animationPacks.ts';const {ART_BY_KEY}=await import(a),{enemyAnimation}=await import(p);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  s.children.list.forEach(o=>(o as Phaser.GameObjects.Sprite).setVisible?.(false));
  const cx=s.player.x,cy=s.player.y;s.add.rectangle(cx,cy,1600,2000,0x182029).setDepth(2000000);
  const walk=s.anims.get('enemy:5:idle:right').frames[0],attack=enemyAnimation(5,'attack');
  const frames=[{texture:walk.textureKey,frame:walk.textureFrame},{texture:attack.texture,frame:attack.frames[2]},{texture:'enemy_dragon_fly',frame:1}];
  frames.forEach((f,i)=>{const sheet=ART_BY_KEY[f.texture],x=i===2?cx:cx-280+i*560,y=i===2?cy+520:cy-240;
   s.add.sprite(x,y,f.texture,f.frame).setScale(.8)
   .setOrigin(.5,1-(sheet.groundPadding??2)/sheet.frameHeight).setDepth(2000001);
   s.add.text(x,y+30,['ground','breath pose','flying'][i],{fontSize:'18px',color:'#ffffff'}).setOrigin(.5).setDepth(2000002);});
 });
 await page.waitForTimeout(100);await page.screenshot({path:'test-results/dragon-body-rendered.png'});
 for(const s of audit.sizes)expect(s.newIdle.height,s.id).toBeCloseTo(s.states.idle[0].h,6);
});
