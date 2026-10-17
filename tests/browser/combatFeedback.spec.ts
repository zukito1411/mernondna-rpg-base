import {expect,test} from '@playwright/test';
import type {Player} from '../../src/game/entities/Player';
import type {WeaponDefinition} from '../../src/game/types';
import type {BasicAttackStep} from '../../src/data/basicAttackCombo';

test('renders warning fill, weapon-picture loot and matching forge upgrades',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/tests/browser/combatFeedback.html?e2e');
  await page.waitForFunction(()=>window.__combatFeedback?.ready);
  await page.evaluate(()=>{
    const random=Math.random;Math.random=()=>0;
    try{window.__combatFeedback!.store.getState().recordEnemyDefeat('bandit-captain',0,0,'captain-varr');}
    finally{Math.random=random;}
  });
  const popup=page.locator('.rare-loot-popup');
  await expect(popup).toContainText('Rare weapon found!');await expect(popup).toContainText('Rededge');
  expect(await popup.locator('.item-icon').evaluate(element=>getComputedStyle(element).backgroundImage)).toContain('equipment-v1.png');
  await page.evaluate(()=>new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(new Error('Weapon icon sheet did not load'));image.src='/assets/items/equipment-v1.png';}));
  await page.screenshot({path:'test-results/combat-feedback-half.png'});
  await page.evaluate(()=>window.__combatFeedback!.setProgress(.95));
  await page.screenshot({path:'test-results/combat-feedback-ready.png'});
  await page.evaluate(()=>{
    const s=window.__combatFeedback!.store.getState();
    s.hydrate({bossMaterials:{'varr-rededge':1},dialogue:{npcId:'joren-pike',lineIndex:0,lines:['Let us work at the forge.']}});
  });
  await page.getByText(/Enhance boss weapons/).click();
  await page.getByRole('button',{name:'Enhance +1',exact:true}).click();
  const forged=await page.evaluate(async()=>{
    const path='/src/game/scenes/WorldScene.ts',weaponsPath='/src/data/weapons.ts';
    const {WorldScene}=await import(path),{WEAPON_BY_ID}=await import(weaponsPath);
    const s=window.__combatFeedback!.store.getState();s.hydrate({weaponId:'varr-rededge'});
    const weapon=WorldScene.prototype.getEquippedWeapon.call({});
    return {rank:s.weaponUpgrades['varr-rededge'],materials:s.bossMaterials['varr-rededge'],damage:weapon.damage,base:WEAPON_BY_ID['varr-rededge'].damage};
  });
  expect(forged).toMatchObject({rank:1,materials:0});expect(forged.damage).toBe(Math.round(forged.base*1.08));
  await page.locator('.dialogue-panel').getByRole('button',{name:'Close',exact:true}).click();
  for(const [width,height] of [[390,844],[844,390]]){
    await page.setViewportSize({width,height});
    await expect(popup).toBeVisible();const bounds=(await popup.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
    await page.screenshot({path:`test-results/rare-loot-${width}.png`});
  }
  expect(errors).toEqual([]);
});

test('touch attack holds through multiple frames and releases on pointer cancellation',async({page})=>{
  await page.goto('/tests/browser/combatFeedback.html?e2e');
  await page.waitForFunction(()=>window.__combatFeedback?.ready);
  await page.addStyleTag({content:'.mobile-controls {display:block!important;}'});
  const attack=page.getByRole('button',{name:'Attack',exact:true}),bounds=(await attack.boundingBox())!;
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
  expect(await page.evaluate(()=>window.__combatFeedback!.input.attackHeld)).toBe(true);
  await page.evaluate(()=>{window.__combatFeedback!.input.consume('attack');});
  expect(await page.evaluate(()=>window.__combatFeedback!.input.attackHeld)).toBe(true);
  await page.mouse.up();expect(await page.evaluate(()=>window.__combatFeedback!.input.attackHeld)).toBe(false);
  await page.mouse.down();
  await attack.dispatchEvent('pointercancel',{pointerId:1});
  expect(await page.evaluate(()=>window.__combatFeedback!.input.attackHeld)).toBe(false);
  await page.mouse.up();
});

test('keyboard and touch holds chain normal, return and heavy attacks with enhanced weapons',async({page})=>{
  await page.goto('/tests/browser/combatFeedback.html?e2e');await page.waitForFunction(()=>window.__combatFeedback?.ready);
  const results=await page.evaluate(async()=>{
    const playerPath='/src/game/entities/Player.ts',scenePath='/src/game/scenes/WorldScene.ts';
    const {Player}=await import(playerPath),{WorldScene}=await import(scenePath),Phaser=window.__combatFeedback!.phaser;
    const store=window.__combatFeedback!.store;
    store.getState().hydrate({weaponId:'varr-rededge',inventory:['roadwarden-sword','varr-rededge'],weaponUpgrades:{'varr-rededge':1}});
    const weapon=WorldScene.prototype.getEquippedWeapon.call({});
    const results=[];
    for(const source of ['keyboard','touch']){
      window.__combatFeedback!.input.reset();window.__combatFeedback!.input.setAttackHeld(source==='touch');
      let hits=0;const damage:number[]=[];
      const slash={scaleX:1,setFlipY:()=>slash,setScale:()=>slash,setTint:()=>slash};
      const velocity=new Phaser.Math.Vector2(0,0);
      const keys=Object.fromEntries(['up','down','left','right','sprint','attack'].map(key=>[key,{isDown:key==='attack'&&source==='keyboard'}]));
      const hero={x:0,y:0,hp:100,maxHp:100,stamina:100,maxStamina:100,unlimitedVitals:false,
        keys,body:{velocity,setVelocity:(x:number,y:number)=>velocity.set(x,y)},
        scene:{combatAllowed:true,playerRenderDepth:(y:number)=>y,getEquippedWeapon:()=>weapon,
          playSwordSwing:()=>{},playEffect:()=>slash,cameras:{main:{shake:()=>{}}},playAudio:()=>{},
          performPlayerAttack:(_player:Player,_direction:unknown,equipped:WeaponDefinition,step:BasicAttackStep)=>{
            hits++;damage.push(Math.round(equipped.damage*step.damageMultiplier));return 1;}},
        skills:{isCasting:false,update:()=>{}},syncInventoryVitals:()=>{},consumeAction:()=>false,
        lastDirection:new Phaser.Math.Vector2(1,0),dashDirection:new Phaser.Math.Vector2(1,0),
        nextAttackAt:0,nextDashAt:0,nextFootstepAt:0,dashUntil:0,sprintExhausted:false,
        comboStep:0,comboExpiresAt:0,comboWeaponId:'',pendingBasicAttack:null,recovery:{interrupt:()=>{}},
        updateAnimation:()=>{},setDepth:()=>{},attackVisual:null,playSwordVisual:()=>{},weaponDrawnRemaining:0,
        resetBasicAttackCombo:Player.prototype['resetBasicAttackCombo'],strikeBasicAttack:Player.prototype['strikeBasicAttack'],
        spendStamina:Player.prototype.spendStamina};
      // Stop holding during the third recovery, after its actual heavy impact.
      const end=1000+weapon.cooldownMs*2.8;
      for(let time=1000;time<end;time+=8)Player.prototype.updatePlayer.call(hero as unknown as Player,time,8);
      const heldHits=hits;hero.keys.attack.isDown=false;window.__combatFeedback!.input.setAttackHeld(false);
      Player.prototype.updatePlayer.call(hero as unknown as Player,end+weapon.cooldownMs*2,16);
      results.push({source,heldHits,afterRelease:hits,stamina:hero.stamina,damage,base:weapon.damage});
    }
    return results;
  });
  for(const result of results){
    expect(result.heldHits,result.source).toBe(3);expect(result.afterRelease).toBe(3);expect(result.stamina).toBeLessThan(100);
    expect(result.damage).toEqual([result.base,Math.round(result.base*1.2),Math.round(result.base*1.7)]);
  }
});
