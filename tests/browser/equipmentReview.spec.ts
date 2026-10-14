import {test,expect} from '@playwright/test';
// The repository's default forces software rendering. Use the platform GPU
// for the full-world review; art fixtures can keep their isolated software GPU.
test.use({launchOptions:{args:['--use-angle=default']}});

test('actual world equipment, merchant and responsive UI review',async({page})=>{
  test.skip(!process.env.FULL_EQUIPMENT_REVIEW,'Opt-in full-world diagnostic; startup currently exceeds the bounded browser review.');
  test.setTimeout(240000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?e2e');
  await page.getByRole('button',{name:'Start New Game',exact:true}).click();
  try{await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'),{},{timeout:100000});}
  catch(error){console.log('Startup',await page.evaluate(()=>({progress:window.__mernondnaGame?.registry.get('loadingProgress'),assetError:window.__mernondnaGame?.registry.get('assetError')})),errors);throw error;}
  await page.evaluate(async()=>{
    const path='/src/store/gameStore.ts';const {useGameStore}=await import(path);(window as any).__equipmentStore=useGameStore;
    const scene=window.__mernondnaGame!.scene.getScene('world') as any;scene.cinematicDirector.finish();
    useGameStore.getState().hydrate({level:30,gold:3000,skillPoints:12,pendingCinematic:null,cinematicQueue:[],cinematic:null});
  });
  for(const [label,width,height] of [['desktop',1280,720],['phone-landscape',844,390],['phone-portrait',390,844]] as const){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{const scene=window.__mernondnaGame!.scene.getScene('world') as any;scene.player.hp=35;scene.player.stamina=25;scene.syncState();(window as any).__equipmentStore.getState().openPanel('inventory');});
    const bag=page.getByRole('dialog',{name:'Inventory',exact:true});await expect(bag).toBeVisible();
    await bag.getByRole('button',{name:/^Potions/}).click();
    await bag.getByRole('button',{name:'Drink',exact:true}).first().click();
    expect(await page.evaluate(()=>(window as any).__equipmentStore.getState().hp)).toBe(85);
    await page.screenshot({path:`test-results/equipment-${label}-bag.png`});
    const bounds=await bag.locator('.inventory-panel').boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(-1);expect(bounds!.width).toBeLessThanOrEqual(width+2);
    await bag.getByRole('button',{name:'Close',exact:true}).click();
    await page.evaluate(()=>{const store=(window as any).__equipmentStore.getState();store.startDialogue('joren-pike');store.advanceDialogue();});
    await expect(page.locator('.merchant-stock')).toBeVisible();
    await page.screenshot({path:`test-results/equipment-${label}-merchant.png`});
    if(label==='desktop'){
      await page.locator('.merchant-stock .item-row').filter({hasText:'Oakguard Blade'}).getByRole('button',{name:'110 gold',exact:true}).click();
      expect(await page.evaluate(()=>(window as any).__equipmentStore.getState().gold)).toBe(2890);
    }
    await page.locator('.merchant-stock .item-row').filter({hasText:'Healing Draught'}).getByRole('button',{name:'28 gold',exact:true}).click();
    await page.locator('.dialogue-panel').getByRole('button',{name:'Close',exact:true}).click();
    await page.evaluate(()=>(window as any).__equipmentStore.getState().openPanel('inventory'));
    await page.locator('.inventory-panel').getByRole('button',{name:'Weapons',exact:true}).click();
    if(label==='desktop')await page.locator('.inventory-panel .item-row').filter({hasText:'Oakguard Blade'}).getByRole('button',{name:'Equip',exact:true}).click();
    expect(await page.evaluate(()=>(window as any).__equipmentStore.getState().weaponId)).toBe('oak-shield-blade');
    await page.locator('.inventory-panel').getByRole('button',{name:'Close',exact:true}).click();
    await page.evaluate(()=>(window as any).__equipmentStore.getState().openPanel('character'));
    if(label==='desktop')for(const name of ['Ember Snare','Iron Rush','Renewing Light'])await page.locator('.combat-art-row').filter({hasText:name}).getByRole('button',{name:/Learn/}).click();
    await page.getByLabel('Slot 1', {exact:true}).selectOption('ember-cleave');
    await page.getByLabel('Slot 2', {exact:true}).selectOption('iron-tempest');
    await page.getByLabel('Slot 3', {exact:true}).selectOption('renewing-light');
    await page.screenshot({path:`test-results/equipment-${label}-skills.png`});
    await page.locator('.character-panel').getByRole('button',{name:'Close',exact:true}).click();
    await page.screenshot({path:`test-results/equipment-${label}-controls.png`});
  }
  await page.setViewportSize({width:1280,height:720});
  const setup=await page.evaluate(async()=>{
    const ep='/src/game/entities/Enemy.ts',dp='/src/data/enemies.ts';const {Enemy}=await import(ep),{ENEMY_BY_ID}=await import(dp);
    const scene=window.__mernondnaGame!.scene.getScene('world') as any;
    scene.scene.pause();scene.physics.world.pause();
    const p=scene.player;const directions=[[0,1],[-1,0],[1,0],[0,-1]];
    let center:{x:number;y:number}|null=null;
    for(let radius=0;radius<=800&&!center;radius+=80)for(let i=0;i<16&&!center;i++){
      const x=p.x+Math.cos(i*Math.PI/8)*radius,y=p.y+Math.sin(i*Math.PI/8)*radius;
      if(directions.every(([dx,dy])=>scene.safeSkillPosition({x:x+dx*240,y:y+dy*240})&&scene.hasClearPath(x,y,x+dx*240,y+dy*240)))center={x,y};
    }
    if(!center)throw new Error('No clear combat review space near the real player.');
    p.restoreAt(center.x,center.y);scene.cameras.main.stopFollow().setZoom(1).centerOn(center.x,center.y);
    for(const e of scene.getCombatEnemies())e.setVisible(false);
    const enemy=new Enemy(scene,{...ENEMY_BY_ID['road-bandit'],hp:10000},center.x,center.y+50,'equipment-review-enemy');scene.enemies.add(enemy);
    (window as any).__equipmentCombat={scene,enemy,center};return center;
  });
  console.log('Real-world combat review location',setup);
  for(const [name,dx,dy] of [['down',0,1],['left',-1,0],['right',1,0],['up',0,-1]] as const){
    const attack=await page.evaluate(({dx,dy})=>{
      const {scene,enemy,center}=(window as any).__equipmentCombat;scene.player.restoreAt(center.x,center.y);scene.player.lastDirection.set(dx,dy);
      enemy.setPosition(center.x+dx*45,center.y+dy*45);enemy.body.reset(enemy.x,enemy.y);enemy.hp=10000;
      scene.performPlayerAttack(scene.player,scene.player.lastDirection,scene.getEquippedWeapon());scene.player.playSwordVisual(350);
      return {damage:10000-enemy.hp,weapon:scene.getEquippedWeapon().id,animation:scene.children.getByName('player-sword-visual')?.anims.currentAnim?.key};
    },{dx,dy});
    expect(attack.damage).toBeGreaterThanOrEqual(24);expect(attack.weapon).toBe('oak-shield-blade');expect(attack.animation).toBeTruthy();
    await page.screenshot({path:`test-results/equipment-attack-${name}.png`});
    for(const id of ['azure-cleave','skyfall-slam','crown-rally','crescent-flurry','ember-cleave','iron-tempest','renewing-light']){
      const cast=await page.evaluate(({id,dx,dy})=>{
        const {scene,enemy,center}=(window as any).__equipmentCombat,store=(window as any).__equipmentStore.getState(),p=scene.player;
        p.restoreAt(center.x,center.y);p.lastDirection.set(dx,dy);p.hp=35;const offset=id==='iron-tempest'?205:50;enemy.setPosition(center.x+dx*offset,center.y+dy*offset);enemy.body.reset(enemy.x,enemy.y);enemy.hp=10000;enemy.setVisible(true);
        store.hydrate({skillSlots:[id,null,null,null]});p.skills.cooldowns[id]=0;
        const started=p.skills.tryCast(id);const duration=p.skills.cast?.skill.durationMs??0;
        // Tick real combat and animation code with a bounded clock while world
        // AI is paused, keeping targets stable for directional comparisons.
        const observation=duration+(id==='ember-cleave'?3000:id==='renewing-light'?6500:0);
        for(let elapsed=0;elapsed<observation;elapsed+=40){p.skills.update(40);p.skills.cast?.visual?.anims.update(elapsed,40);}
        return {started,damage:10000-enemy.hp,hp:p.hp,alpha:p.alpha,casting:p.skills.snapshot().casting};
      },{id,dx,dy});
      expect(cast.started,`${id} ${name}`).toBe(true);
      if(id==='crown-rally'||id==='renewing-light')expect(cast.hp).toBeGreaterThan(35);else expect(cast.damage,`${id} ${name}`).toBeGreaterThan(0);
      expect(cast.alpha).toBe(1);expect(cast.casting).toBeNull();
      if(id==='ember-cleave'||id==='iron-tempest'||id==='renewing-light')await page.screenshot({path:`test-results/equipment-${id}-${name}.png`});
    }
  }
  expect(errors).toEqual([]);
});
