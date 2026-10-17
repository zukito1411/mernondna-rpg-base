import {test,expect} from '@playwright/test';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {Enemy} from '../../src/game/entities/Enemy';
import type {ContentChunkManager} from '../../src/game/systems/ContentChunkManager';

test('real enemies receive weapon effects, pause damage, award a DOT defeat once and save discoveries',async({page})=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
  await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'),null,{timeout:120000});
  await page.evaluate(async()=>{const path='/src/store/gameStore.ts';const {useGameStore}=await import(path);
    useGameStore.getState().hydrate({pendingCinematic:null,cinematicQueue:[]});useGameStore.getState().requestCinematicSkip();});
  await page.waitForFunction(()=>!(window.__mernondnaGame!.scene.getScene('world') as unknown as {cinematicDirector:{active:boolean}}).cinematicDirector.active,null,{timeout:45000});
  await page.keyboard.press('b');
  const journal=page.getByRole('dialog',{name:'Bestiary and lore journal'});
  await expect(journal).toBeVisible();await journal.getByRole('searchbox').focus();await page.keyboard.type('bestiary');await expect(journal).toBeVisible();
  await page.keyboard.press('Escape');await expect(journal).not.toBeVisible();
  const result=await page.evaluate(async()=>{
    const storePath='/src/store/gameStore.ts',weaponPath='/src/data/weaponProfiles.ts',savePath='/src/utils/save.ts';
    const {useGameStore}=await import(storePath),{WEAPON_PROFILES}=await import(weaponPath),{saveGame,parseSave,SAVE_KEY}=await import(savePath);
    const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    scene.scene.pause();scene.physics.world.pause();scene.cancelStoryEncounter();
    useGameStore.getState().hydrate({pendingCinematic:null,cinematic:null,panel:null});
    const manager=(scene as unknown as {contentManager:ContentChunkManager<Enemy>}).contentManager;
    const definition=manager.getDefinition('creature:oakmere-wolf-east')!;
    scene.player.restoreAt(definition.world.x-150,definition.world.y);
    scene.streamCinematicView(definition.world.x,definition.world.y);
    scene.cameras.main.stopFollow();scene.cameras.main.centerOn(definition.world.x,definition.world.y-40);
    const wolf=manager.getActor(definition.id);if(!wolf)throw new Error('Wolf fixture did not stream');
    const initialHp=wolf.hp,baseline=useGameStore.getState().journal.creatures[wolf.definition.id]??0;
    const savedRandom=Math.random;
    try{Math.random=()=>0;wolf.takeDamage(1,scene.player.lastDirection.clone().set(1,0),{weaponId:'rootfather-thornblade'});}finally{Math.random=savedRandom;}
    const poisoned=wolf.weaponStatus.name==='Thorn Sap';
    const beforePause=wolf.hp;for(let i=0;i<15;i++)wolf.updatePresentation(scene.player.x,scene.player.y,true);
    const pauseKeptHp=wolf.hp===beforePause;
    for(let i=0;i<10;i++)wolf.updateEnemy(scene.time.now+i*100,100);
    const tickDamage=beforePause-wolf.hp;
    wolf.weaponStatus.clear();wolf.hp=1;
    wolf.weaponStatus.tryApply(WEAPON_PROFILES['varkhul-emberfang'].proc!,100,wolf.definition.id,false,()=>0);
    for(let i=0;i<12;i++)wolf.updateEnemy(scene.time.now+1000+i*100,100);
    const afterDefeat=useGameStore.getState().journal.creatures[wolf.definition.id];
    if(wolf.active)wolf.updateEnemy(scene.time.now+5000,100);
    const oneDefeat=afterDefeat===baseline+1&&useGameStore.getState().journal.creatures[wolf.definition.id]===afterDefeat;
    const saved=saveGame(),loaded=parseSave(localStorage.getItem(SAVE_KEY)!);
    return {poisoned,pauseKeptHp,tickDamage,initialHp,oneDefeat,saved,retained:loaded?.state.journal?.creatures[wolf.definition.id],afterDefeat,
      atlas:['verdant-adderblade','skallheim-rimeblade','cinder-forged-sabre'].every(id=>scene.textures.get('equipped-swords').has(id))};
  });
  expect(result.poisoned).toBe(true);expect(result.pauseKeptHp).toBe(true);expect(result.tickDamage).toBeGreaterThan(0);
  expect(result.oneDefeat).toBe(true);expect(result.saved).toBe(true);expect(result.retained).toBe(result.afterDefeat);expect(result.atlas).toBe(true);
  await page.screenshot({path:'test-results/weapon-status-world.png'});
  expect(errors).toEqual([]);
});
