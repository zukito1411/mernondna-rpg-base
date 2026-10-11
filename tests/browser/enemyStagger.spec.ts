import {test,expect} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {Enemy} from '../../src/game/entities/Enemy';

async function ready(page:import('@playwright/test').Page){
 await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
}
test('first-hit stagger cancels windups, cooldown hits allow retaliation, and hurt poses retain feet',async({page})=>{
 test.setTimeout(120000);await ready(page);
 const results=await page.evaluate(async()=>{
  const ep='/src/game/entities/Enemy.ts',dp='/src/data/enemies.ts';const {Enemy}=await import(ep),{ENEMIES,BOSSES}=await import(dp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;s.scene.pause();s.physics.world.pause();
  const clock=s.time as unknown as {now:number},oldTime=clock.now,damage=s.damagePlayer;let landed=0;s.damagePlayer=()=>landed++;
  const delayed=s.time.delayedCall,pending:Phaser.Time.TimerEvent[]=[];
  s.time.delayedCall=function(...args:Parameters<typeof delayed>){const event=delayed.apply(this,args);pending.push(event);return event;};
  const results=[];
  for(const def of ENEMIES.filter((d:typeof ENEMIES[number])=>d.combatStyle!=='dragon')){
   clock.now=1000;landed=0;
   const boss=BOSSES.find((b:typeof BOSSES[number])=>b.enemyId===def.id);
   const e=new Enemy(s,def,s.player.x+35,s.player.y,boss?'boss:'+boss.id:'stagger-audit:'+def.id);e.hp=100000;
   const r=e as unknown as {facing:Phaser.Math.Vector2;beginAttack(scene:WorldScene,player:WorldScene['player'],time:number):void;
    attackEpoch:number;hitStunUntil:number;staggerImmuneUntil:number;attackTelegraph:Phaser.GameObjects.Image|null;leapVisual:Phaser.GameObjects.Sprite|null};
   const body=e.body as Phaser.Physics.Arcade.Body;r.facing.set(-1,0);body.setVelocity(-70,0);e.playLocomotion('walk');
   const before={x:body.center.x,y:body.center.y,w:body.width,h:body.height};
   const attack=()=>{const start=pending.length;r.beginAttack(s,s.player,clock.now);return pending.slice(start).find(event=>event.delay===(def.attackWindupMs??220))!;};
   const fire=(event:Phaser.Time.TimerEvent)=>event.callback!.apply(event.callbackScope,event.args);
   const first=attack();e.takeDamage(1,s.player.lastDirection);const firstEpoch=r.attackEpoch;
   const hurt={x:body.center.x,y:body.center.y,w:body.width,h:body.height};const animation=e.anims.currentAnim?.key;
   fire(first);const cancelledHits=landed,until=r.hitStunUntil,cooldown=r.staggerImmuneUntil-until;
   clock.now=until+1;const second=attack(),secondEpoch=r.attackEpoch;
   e.takeDamage(1,s.player.lastDirection);const immuneEpoch=r.attackEpoch;fire(second);const retaliation=landed;
   clock.now=r.staggerImmuneUntil;const third=attack();e.takeDamage(1,s.player.lastDirection);fire(third);
   results.push({id:def.id,animation,before,hurt,cancelledHits,retaliation,finalHits:landed,
    firstEpoch,secondEpoch,immuneEpoch,restoredEpoch:r.attackEpoch,hurtMs:until-1000,cooldown,wolfLeapCleared:r.leapVisual===null,telegraphCleared:r.attackTelegraph===null});
   e.destroy();
  }
  pending.forEach(event=>event.remove(false));s.time.delayedCall=delayed;s.damagePlayer=damage;clock.now=oldTime;return results;
 });
 for(const r of results){
  expect(r.animation).toContain(':hurt');expect(r.hurtMs).toBeGreaterThanOrEqual(500);expect(r.cooldown).toBeGreaterThanOrEqual(1000);
  expect(r.cancelledHits,r.id).toBe(0);expect(r.retaliation,r.id).toBe(1);expect(r.finalHits,r.id).toBe(1);
  expect(r.immuneEpoch).toBe(r.secondEpoch);expect(r.restoredEpoch).toBeGreaterThan(r.immuneEpoch);
  expect(r.wolfLeapCleared).toBe(true);expect(r.telegraphCleared).toBe(true);
  for(const key of ['x','y','w','h'] as const)expect(r.hurt[key],r.id+'/'+key).toBeCloseTo(r.before[key],7);
 }
 await test.info().attach('normal-stagger.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
});

test('Crescent Flurry interrupts all reachable sides for its full cast and releases targets on exit/cancel',async({page})=>{
 test.setTimeout(120000);await ready(page);
 const result=await page.evaluate(async()=>{
  const ep='/src/game/entities/Enemy.ts',dp='/src/data/enemies.ts',sp='/src/store/gameStore.ts';
  const {Enemy}=await import(ep),{ENEMY_BY_ID}=await import(dp),{useGameStore}=await import(sp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;s.scene.pause();s.physics.world.pause();
  useGameStore.getState().hydrate({level:15});s.player.stamina=100;s.player.hp=s.player.maxHp=100000;
  const x=s.player.x,y=s.player.y,clock=s.time as unknown as {now:number},start=clock.now;
  const originalOccupy=s.canEnemyOccupy,originalTerritory=s.isEnemyTerritory;
  s.canEnemyOccupy=()=>true;s.isEnemyTerritory=()=>true;
  const enemies=(s as unknown as {enemies:Set<Enemy>}).enemies,fixtures:Enemy[]=[];
  const add=(id:string,dx:number,dy:number)=>{const e=new Enemy(s,ENEMY_BY_ID[id],x+dx,y+dy,'flurry-audit:'+fixtures.length);
   e.hp=1000000;(e as unknown as {staggerImmuneUntil:number}).staggerImmuneUntil=start+100000;enemies.add(e);fixtures.push(e);return e;};
  const bandit=add('road-bandit',45,0),wolf=add('gray-wolf',-45,0),troll=add('cave-troll',0,65),behindWall=add('road-bandit',100,0);
  const wall=s.add.rectangle(x+75,y,16,140,0x77523b);s.physics.add.existing(wall,true);
  const delayed=s.time.delayedCall,callbacks:Array<{at:number;event:Phaser.Time.TimerEvent;fired:boolean}>=[];
  s.time.delayedCall=function(...args:Parameters<typeof delayed>){const event=delayed.apply(this,args);callbacks.push({at:clock.now+args[0],event,fired:false});return event;};
  const attack=(e:Enemy)=>{(e as unknown as {facing:Phaser.Math.Vector2}).facing.set(x-e.x,y-e.y).normalize();
   (e as unknown as {beginAttack(scene:WorldScene,player:WorldScene['player'],time:number):void}).beginAttack(s,s.player,clock.now);};
  fixtures.slice(0,3).forEach(attack);
  const hp=s.player.hp,cast=s.player.skills.tryCast('crescent-flurry');
  const immediate=fixtures.slice(0,3).every(e=>e.isStaggered),initialHP=fixtures.slice(0,3).map(e=>e.hp);
  let windowViolations=0,exited=false,returnSuppressed=false,entrant:Enemy|undefined;
  for(let frame=1;frame<=250;frame++){
   clock.now=start+frame*16;
   if(frame===90)entrant=add('marsh-wraith',0,-55);
   if(frame===130)bandit.setPosition(x+400,y);
   if(frame===150)bandit.setPosition(x+45,y);
   s.player.skills.update(16);
   if(frame===130)exited=!(bandit as unknown as {flurrySuppressed:boolean}).flurrySuppressed;
   if(frame===150)returnSuppressed=(bandit as unknown as {flurrySuppressed:boolean}).flurrySuppressed;
   for(const e of fixtures.slice(0,3).concat(entrant?[entrant]:[])){
    if(frame<250&&Math.hypot(e.x-x,e.y-y)<110&&!e.isStaggered)windowViolations++;
    e.updateEnemy(clock.now,16);e.anims.update(clock.now,16);
   }
   for(const c of callbacks)if(!c.fired&&c.at<=clock.now){c.fired=true;c.event.callback!.apply(c.event.callbackScope,c.event.args);}
  }
  const duringHP=s.player.hp,finished=!s.player.skills.isCasting,damage=fixtures.slice(0,3).map((e,i)=>initialHP[i]-e.hp);
  const wallProtected=behindWall.hp===1000000&&!(behindWall as unknown as {flurrySuppressed:boolean}).flurrySuppressed;
  const allReleased=fixtures.every(e=>!(e as unknown as {flurrySuppressed:boolean}).flurrySuppressed);
  clock.now=start+6000;wolf.updateEnemy(clock.now,16);
  clock.now+=1000;for(const c of callbacks)if(!c.fired&&c.at<=clock.now){c.fired=true;c.event.callback!.apply(c.event.callbackScope,c.event.args);}
  const retaliated=s.player.hp<duringHP;
  // Cancellation before the first slash releases the channel, too.
  const skillRuntime=s.player.skills as unknown as {cooldowns:Record<string,number>};skillRuntime.cooldowns['crescent-flurry']=0;
  s.player.stamina=100;s.player.skills.tryCast('crescent-flurry');s.player.skills.cancelCast();
  const cancelledRelease=fixtures.every(e=>!(e as unknown as {flurrySuppressed:boolean}).flurrySuppressed);
  callbacks.forEach(c=>c.event.remove(false));s.time.delayedCall=delayed;s.canEnemyOccupy=originalOccupy;s.isEnemyTerritory=originalTerritory;
  fixtures.forEach(e=>{enemies.delete(e);e.destroy();});wall.destroy();clock.now=start;
  return{cast,immediate,hp,duringHP,windowViolations,finished,damage,wallProtected,allReleased,exited,returnSuppressed,retaliated,cancelledRelease,playerPosition:{x:s.player.x,y:s.player.y},startPosition:{x,y},alpha:s.player.alpha};
 });
 console.log('Flurry protection',JSON.stringify(result));
 expect(result.cast).toBe(true);expect(result.immediate).toBe(true);expect(result.windowViolations).toBe(0);expect(result.duringHP).toBe(result.hp);
 expect(result.finished).toBe(true);expect(result.wallProtected).toBe(true);expect(result.allReleased).toBe(true);
 expect(result.exited).toBe(true);expect(result.returnSuppressed).toBe(true);expect(result.retaliated).toBe(true);expect(result.cancelledRelease).toBe(true);
 expect(result.playerPosition).toEqual(result.startPosition);expect(result.alpha).toBe(1);result.damage.forEach(d=>expect(d).toBeGreaterThan(0));
});

test('grounded dragon stagger cancels breath and stomp, while flight and landing retain their models',async({page})=>{
 test.setTimeout(120000);await ready(page);
 const result=await page.evaluate(async()=>{
  const ep='/src/game/entities/Enemy.ts',dp='/src/data/enemies.ts',lp='/src/data/dragonLair.ts';
  const {Enemy}=await import(ep),{ENEMIES}=await import(dp),{DRAGON_LAIR}=await import(lp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;s.scene.pause();s.physics.world.pause();
  s.landFromPassage({...DRAGON_LAIR,x:DRAGON_LAIR.x+60});s.scene.pause();
  const def=ENEMIES.find((d:typeof ENEMIES[number])=>d.combatStyle==='dragon')!,e=new Enemy(s,def,DRAGON_LAIR.x,DRAGON_LAIR.y,'stagger-dragon');e.hp=1000000;
  const dc=(e as unknown as {dragonCombat:{phase:string;age:number;clock:number;breathTick:number;warningArt:Phaser.GameObjects.Image;fire:{hide():void};flight:Phaser.GameObjects.Sprite;
   nextAttack:number;update(delta:number):void;startFlight():void;drawCone(burning:boolean):void}}).dragonCombat;
  const clock=s.time as unknown as {now:number},initialTime=clock.now,damage=s.damagePlayer;let hits=0;s.damagePlayer=()=>hits++;
  dc.phase='breath';dc.age=500;dc.drawCone(true);e.takeDamage(1,s.player.lastDirection);dc.update(100);
  const breathCancelled=dc.phase==='rest'&&!dc.warningArt.visible&&e.isStaggered&&hits===0;
  dc.phase='stomp-windup';dc.age=999;e.takeDamage(1,s.player.lastDirection,{forceStagger:true});dc.update(100);
  const stompCancelled=dc.phase==='rest'&&hits===0;
  e.setFlurrySuppressed(true);clock.now+=2000;dc.nextAttack=0;dc.update(100);
  const channelHeld=dc.phase==='rest'&&e.isStaggered&&hits===0;e.setFlurrySuppressed(false);
  const groundScale=e.scaleX;dc.startFlight();
  const hp=e.hp;e.takeDamage(1,s.player.lastDirection,{forceStagger:true});
  const flightProtected=dc.phase==='flight'&&!e.canBeTargeted&&e.hp===hp&&dc.flight.visible&&e.alpha===0;
  for(let i=0;i<32;i++)dc.update(100);
  const landingProtected=dc.phase==='landing'&&!e.canBeTargeted&&dc.flight.visible;
  for(let i=0;i<11;i++)dc.update(100);
  const grounded=e.canBeTargeted&&e.alpha===1&&!dc.flight.visible&&e.scaleX===groundScale;
  s.damagePlayer=damage;clock.now=initialTime;e.destroy();return{breathCancelled,stompCancelled,channelHeld,flightProtected,landingProtected,grounded};
 });
 expect(result).toEqual({breathCancelled:true,stompCancelled:true,channelHeld:true,flightProtected:true,landingProtected:true,grounded:true});
});

test('keyboard Flurry keeps the player stationary and unharmed against a committed melee windup',async({page})=>{
 test.setTimeout(120000);await ready(page);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.evaluate(async()=>{
  const ep='/src/game/entities/Enemy.ts',dp='/src/data/enemies.ts',sp='/src/store/gameStore.ts';
  const {Enemy}=await import(ep),{ENEMY_BY_ID}=await import(dp),{useGameStore}=await import(sp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;useGameStore.getState().hydrate({level:15});
  const x=s.player.x,y=s.player.y,occupy=s.canEnemyOccupy;s.canEnemyOccupy=(px:number,py:number)=>Math.hypot(px-x,py-y)<150||occupy.call(s,px,py);
  s.isEnemyTerritory=()=>true;s.player.hp=s.player.maxHp;s.player.stamina=s.player.maxStamina;
  const e=new Enemy(s,{...ENEMY_BY_ID['road-bandit'],attackWindupMs:1000},x+35,y,'keyboard-flurry');e.hp=e.definition.hp=1000000;
  (s as unknown as {enemies:Set<Enemy>}).enemies.add(e);
  const r=e as unknown as {facing:Phaser.Math.Vector2;beginAttack(scene:WorldScene,player:WorldScene['player'],time:number):void};
  r.facing.set(-1,0);r.beginAttack(s,s.player,s.time.now);
 });
 await page.keyboard.press('4');
 await page.waitForFunction(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;return s.player.skills.snapshot().casting==='crescent-flurry';
 });
 const read=()=>page.evaluate(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene,e=s.getCombatEnemies().find(e=>e.instanceId==='keyboard-flurry')!;
  const body=s.player.body as Phaser.Physics.Arcade.Body;
  return{x:s.player.x,y:s.player.y,hp:s.player.hp,casting:s.player.skills.snapshot().casting,velocity:body.velocity.length(),
   staggered:e.isStaggered,enemyHP:e.hp,alpha:s.player.alpha};
 });
 const start=await read();await page.keyboard.down('w');await page.waitForTimeout(1500);
 const middle=await read();await page.keyboard.up('w');
 expect(middle.casting).toBe('crescent-flurry');expect(middle.staggered).toBe(true);expect(middle.velocity).toBe(0);
 expect(middle.x).toBe(start.x);expect(middle.y).toBe(start.y);expect(middle.hp).toBe(start.hp);expect(middle.enemyHP).toBeLessThan(start.enemyHP);
 await page.screenshot({path:'test-results/crescent-flurry-live.png'});
 await expect.poll(async()=>(await read()).casting,{timeout:10000}).toBeNull();
 const end=await read();expect(end.hp).toBe(start.hp);expect(end.alpha).toBe(1);expect(errors).toEqual([]);
});
