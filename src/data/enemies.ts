import type { BossDefinition, EnemyDefinition } from '../game/types';
import { TOWN_BY_ID } from './towns';
import {SALT_KING_DECK_HOME} from './pirateFlagship';
import {DRAGON_LAIR,DRAGON_BOSS_ID,DRAGON_RETURN_MS} from './dragonLair';

// Uncommon scavengers can live on any suitable land, never in settlements,
// open sea, farmland or molten terrain (admission checks those separately).
const ALL_LAND_WEIGHTS={trandum:1,narenthil:1,nardorous:1,rindass:1,druganwoods:1,portquill:1,frostlands:1,darkav:1};
export function isWolfFamily(id:string){return id==='gray-wolf'||id==='frost-wolf';}

export const ENEMIES: EnemyDefinition[] = [
  {
    id:'goblin-stone-slinger',name:'Goblin Stone-Slinger',spriteFrame:12,spriteTexture:'enemy_goblin_slinger',bodyRadius:12,
    combatStyle:'stone-thrower',hp:64,damage:10,moveSpeed:80,aggroRange:420,attackRange:330,attackCooldownMs:1550,
    attackWindupMs:600,attackRecoveryMs:400,xp:20,goldMin:1,goldMax:5,regionWeights:{},
  },
  {
    id:'blighted-thornling',name:'Blighted Thornling',spriteFrame:13,spriteTexture:'enemy_thornling',bodyRadius:16,
    hp:98,damage:13,moveSpeed:67,aggroRange:250,attackRange:70,attackCooldownMs:1250,
    attackWindupMs:480,attackRecoveryMs:320,xp:28,goldMin:0,goldMax:2,regionWeights:{...ALL_LAND_WEIGHTS,narenthil:3},
  },
  {
    id:'grove-spider',name:'Grove Spider',spriteFrame:14,spriteTexture:'enemy_grove_spider',bodyRadius:17,
    hp:66,damage:10,moveSpeed:95,aggroRange:260,attackRange:60,attackCooldownMs:1100,
    attackWindupMs:300,attackRecoveryMs:450,xp:23,goldMin:0,goldMax:1,regionWeights:{...ALL_LAND_WEIGHTS,trandum:2,narenthil:3,druganwoods:3},
  },
  {
    id:'hedge-goblin',name:'Hedge Goblin Scavenger',spriteFrame:11,spriteTexture:'enemy_hedge_goblin',bodyRadius:12,
    hp:54,damage:8,moveSpeed:85,aggroRange:235,attackRange:54,attackCooldownMs:1050,
    attackWindupMs:320,attackRecoveryMs:480,xp:16,goldMin:1,goldMax:4,regionWeights:{...ALL_LAND_WEIGHTS},
  },
  {
    id: 'gray-wolf', name: 'Gray Wolf', spriteFrame: 0, hp: 42, damage: 7, moveSpeed: 92, aggroRange: 230, attackRange: 54, attackCooldownMs: 950,
    xp: 12, goldMin: 0, goldMax: 2, regionWeights: { trandum: 4, narenthil: 5, nardorous: 2, druganwoods: 4 },
  },
  {
    id:'frost-wolf',name:'Frost Wolf',spriteFrame:0,spriteTint:0xdceeff,hp:48,damage:8,moveSpeed:92,aggroRange:230,attackRange:54,attackCooldownMs:950,
    xp:14,goldMin:0,goldMax:2,regionWeights:{frostlands:5},
  },
  {
    id: 'road-bandit', name: 'Road Bandit', spriteFrame: 1, hp: 62, damage: 9, moveSpeed: 82, aggroRange: 250, attackRange: 58, attackCooldownMs: 900,
    xp: 18, goldMin: 3, goldMax: 9, regionWeights: { trandum: 5, nardorous: 2, druganwoods: 2 },
  },
  {
    id:'cutlass-pirate',name:'Cutlass Deckhand',spriteFrame:7,spriteTexture:'enemy_cutlass_pirate',
    hp:62,damage:9,moveSpeed:82,aggroRange:250,attackRange:58,attackCooldownMs:1100,
    attackWindupMs:300,attackRecoveryMs:550,xp:18,goldMin:3,goldMax:9,regionWeights:{portquill:5},
  },
  {
    id:'pirate-boatswain',name:'Heavy Boatswain',spriteFrame:10,spriteTexture:'enemy_pirate_boatswain',
    appearanceMultiplier:1.12,bodyRadius:17,combatStyle:'boatswain',
    hp:125,damage:17,moveSpeed:68,aggroRange:260,attackRange:82,attackCooldownMs:1650,
    attackWindupMs:700,attackRecoveryMs:700,xp:35,goldMin:4,goldMax:10,regionWeights:{},
  },
  {
    id:'rindass-orc-raider',name:'Rindass Warband Raider',spriteFrame:8,spriteTexture:'enemy_orc_raider',
    appearanceMultiplier:1.08,bodyRadius:15,hp:112,damage:14,moveSpeed:76,aggroRange:245,attackRange:64,
    attackCooldownMs:1250,attackWindupMs:480,attackRecoveryMs:620,xp:30,goldMin:2,goldMax:6,
    // A common Rindass wilderness threat; placement still requires dryland or
    // highland and the scene rejects settlement, farmland and blocked tiles.
    regionWeights:{rindass:5},
  },
  {
    id:'rindass-orc-spearman',name:'Rindass Spear Raider',spriteFrame:9,spriteTexture:'enemy_orc_spearman',
    appearanceMultiplier:1.04,bodyRadius:14,hp:120,damage:16,moveSpeed:72,aggroRange:500,attackRange:360,
    attackCooldownMs:1850,attackWindupMs:420,attackRecoveryMs:330,combatStyle:'spear-thrower',xp:35,goldMin:2,goldMax:6,
    // Admitted only as the ranged member of an authored mixed Rindass patrol.
    regionWeights:{},
  },
  {
    id: 'rindass-boar', name: 'Wild Boar', spriteFrame: 2, hp: 75, damage: 11, moveSpeed: 88, aggroRange: 180, attackRange: 58, attackCooldownMs: 1100,
    xp: 20, goldMin: 0, goldMax: 1, regionWeights: { trandum: 2, rindass: 6, druganwoods: 2 },
  },
  {
    id: 'marsh-wraith', name: 'Marsh Wraith', spriteFrame: 3, hp: 84, damage: 12, moveSpeed: 66, aggroRange: 240, attackRange: 60, attackCooldownMs: 1250,
    xp: 32, goldMin: 1, goldMax: 4, regionWeights: { druganwoods: 1 },
  },
  {
    id: 'cave-troll', name: 'Cave Troll', spriteFrame: 4,spriteTexture:'enemy_troll',appearanceMultiplier:1.3,bodyRadius:20,combatStyle:'troll',hp: 180, damage: 17, moveSpeed: 58, aggroRange: 300, attackRange: 100, attackRadius:110,attackCooldownMs: 1500,
    xp: 65, goldMin: 10, goldMax: 22, attackWindupMs: 620, attackRecoveryMs: 750, regionWeights: { nardorous: 5, druganwoods: 4,rindass:2,darkav:2 },
  },
  {
    id: 'bandit-captain', name: 'Captain Varr', spriteFrame: 1, hp: 210, damage: 18, moveSpeed: 84, aggroRange: 320, attackRange: 68, attackCooldownMs: 760,
    xp: 110, goldMin: 30, goldMax: 48, boss: true, attackWindupMs: 540, attackRecoveryMs: 900,
    summonEnemyId: 'road-bandit', summonComposition: [{enemyId:'road-bandit',count:2,role:'melee'}], summonCooldownMs: 18000, regionWeights: { trandum: 5 },
  },
  {
    id: 'moonlit-warden', name: 'Moonlit Warden', spriteFrame: 3, hp: 360, damage: 22, moveSpeed: 62, aggroRange: 330, attackRange: 76, attackCooldownMs: 1700,
    xp: 190, goldMin: 26, goldMax: 44, boss: true, attackWindupMs: 780, attackRecoveryMs: 1100,
    summonEnemyId: 'gray-wolf', summonComposition: [{enemyId:'blighted-thornling',count:2,role:'melee'},{enemyId:'grove-spider',count:1,role:'flanker'}], summonCooldownMs: 20000, attackRadius: 88, regionWeights: { narenthil: 5 },
  },
  {
    id: 'stonejaw-troll', name: 'Stonejaw', spriteFrame: 4,spriteTexture:'enemy_troll',appearanceMultiplier:1.9,bodyRadius:32,combatStyle:'troll',hp: 420, damage: 27, moveSpeed: 52, aggroRange: 330, attackRange: 120, attackCooldownMs: 1900,
    xp: 220, goldMin: 35, goldMax: 55, boss: true, attackWindupMs: 900, attackRecoveryMs: 1250,
    summonEnemyId: 'gray-wolf', summonComposition: [{enemyId:'hedge-goblin',count:2,role:'melee'},{enemyId:'goblin-stone-slinger',count:1,role:'ranged'}], summonCooldownMs: 21000,
    attackRadius: 112, regionWeights: { nardorous: 5, druganwoods: 4 },
  },
  {
    id: 'redmesa-chieftain', name: 'Krag the Iron-Tusk', spriteFrame:15,spriteTexture:'enemy_krag_chieftain',appearanceMultiplier:1,bodyRadius:25,hp: 390, damage: 25, moveSpeed: 76, aggroRange: 340, attackRange:92, attackCooldownMs: 1650,
    xp: 205, goldMin: 30, goldMax: 52, boss: true, attackWindupMs: 640, attackRecoveryMs: 1050,
    summonEnemyId: 'rindass-orc-raider', summonComposition: [{enemyId:'rindass-orc-raider',count:2,role:'melee'},{enemyId:'rindass-orc-spearman',count:1,role:'ranged'}], summonCooldownMs: 19000, attackRadius: 92, regionWeights: { rindass: 5 },
  },
  {
    id: 'rootfather', name: 'The Rootfather', spriteFrame:17,spriteTexture:'enemy_rootfather',appearanceMultiplier:1,bodyRadius:32,hp: 410, damage: 24, moveSpeed: 48, aggroRange: 320, attackRange:104, attackCooldownMs: 1900,
    xp: 215, goldMin: 32, goldMax: 54, boss: true, attackWindupMs: 880, attackRecoveryMs: 1300,
    summonEnemyId: 'marsh-wraith', summonComposition: [{enemyId:'blighted-thornling',count:3,role:'melee'}], summonCooldownMs: 22000, attackRadius: 104, regionWeights: { druganwoods: 5 },
  },
  {
    id: 'salt-king', name: 'The Salt King', spriteFrame: 6, spriteTexture:'enemy_salt_king', hp: 380, damage: 23, moveSpeed: 72, aggroRange: 340, attackRange: 78, attackCooldownMs: 1550,
    xp: 200, goldMin: 34, goldMax: 58, boss: true, attackWindupMs: 620, attackRecoveryMs: 980,
    summonEnemyId: 'cutlass-pirate', summonComposition: [{enemyId:'cutlass-pirate',count:2,role:'melee'},{enemyId:'pirate-boatswain',count:1,role:'heavy'}], summonCooldownMs: 18500, regionWeights: { portquill: 5 },
  },
  {
    id: 'frost-wyrm', name: 'The Frost Wyrm', spriteFrame:16,spriteTexture:'enemy_frost_wyrm',appearanceMultiplier:1,bodyRadius:32,hp: 440, damage: 28, moveSpeed: 86, aggroRange: 360, attackRange:110, attackCooldownMs: 1800,
    xp: 235, goldMin: 36, goldMax: 60, boss: true, attackWindupMs: 720, attackRecoveryMs: 1150,
    summonEnemyId: 'frost-wolf', summonComposition: [{enemyId:'frost-wolf',count:2,role:'flanker'}], summonCooldownMs: 19500, attackRadius:110, regionWeights: { frostlands: 5 },
  },
  {
    id: 'ashen-seer', name: 'The Ashen Seer', spriteFrame:18,spriteTexture:'enemy_ashen_seer',appearanceMultiplier:1,bodyRadius:24,hp: 460, damage: 30, moveSpeed: 56, aggroRange: 360, attackRange: 88, attackCooldownMs: 2000,
    xp: 260, goldMin: 42, goldMax: 68, boss: true, attackWindupMs: 980, attackRecoveryMs: 1400,
    summonEnemyId: 'marsh-wraith', summonComposition: [{enemyId:'marsh-wraith',count:2,role:'melee'}], summonCooldownMs: 21000, attackRadius: 120, regionWeights: { darkav: 5 },
  },
];

ENEMIES.push({id:'ash-dragon',name:'Varkhul, the Returning Ember',spriteFrame:5,spriteTexture:'enemy_dragon',appearanceMultiplier:1.6,
  bodyRadius:64,combatStyle:'dragon',hp:1800,damage:36,moveSpeed:72,aggroRange:650,attackRange:170,attackRadius:240,
  attackCooldownMs:2200,attackWindupMs:1000,attackRecoveryMs:900,xp:520,goldMin:70,goldMax:100,boss:true,regionWeights:{}});
// Keep body, reach and warning geometry in proportion with the visual change.
// Dragon ground/flight presentation reads this same appearance multiplier.
for(const enemy of ENEMIES)if(enemy.boss){
  enemy.appearanceMultiplier=(enemy.appearanceMultiplier??1.45)*1.12;
  enemy.bodyRadius=(enemy.bodyRadius??24)*1.12;
  enemy.attackRange=Math.round(enemy.attackRange*1.12);
  if(enemy.attackRadius!==undefined)enemy.attackRadius=Math.round(enemy.attackRadius*1.12);
}
// Tower-only identity: deliberately absent from overworld spawns and BOSSES.
ENEMIES.push({id:'grand-magus',name:'Grand Magus of the Shadow Realm',spriteFrame:19,spriteTexture:'enemy_grand_magus',
 appearanceMultiplier:2.8,bodyRadius:54,hp:2000,damage:28,moveSpeed:68,aggroRange:2000,attackRange:245,
 attackCooldownMs:1800,attackWindupMs:1200,attackRecoveryMs:800,xp:0,goldMin:0,goldMax:0,boss:false,regionWeights:{}});
export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map((enemy) => [enemy.id, enemy])) as Record<string, EnemyDefinition>;
export function enemyAppearanceMultiplier(definition: EnemyDefinition) {
  return definition.appearanceMultiplier??(definition.boss ? 1.45 : definition.id === 'road-bandit' ? 1.16 : 1);
}

const oakmere = TOWN_BY_ID.oakmere.world;
export const BOSSES: BossDefinition[] = [
  {
    id: 'captain-varr', enemyId: 'bandit-captain', name: 'Captain Varr', regionId: 'trandum',
    world: { x: oakmere.x + 1400, y: oakmere.y - 850 },
    lore: 'A former caravan guard who now controls a ruined watchtower east of Oakmere.', respawns: true, respawnDelayMs: 20*60*1000,
    attackStyle: 'melee',
  },
  {
    id: 'moonlit-warden', enemyId: 'moonlit-warden', name: 'Moonlit Warden', regionId: 'narenthil',
    world: { x: TOWN_BY_ID.elarion.world.x + 900, y: TOWN_BY_ID.elarion.world.y + 700 },
    lore: 'An ancient guardian twisted by the blight spreading through Narenthil’s moon grove.', respawns: true, respawnDelayMs: 20*60*1000,
    attackStyle: 'pounce',
  },
  {
    id: 'stonejaw-troll', enemyId: 'stonejaw-troll', name: 'Stonejaw', regionId: 'nardorous',
    world: { x: TOWN_BY_ID.starhold.world.x - 1550, y: TOWN_BY_ID.starhold.world.y + 720 },
    lore: 'An old pass-troll that has learned to break wagons open before eating their draft animals.', respawns: true, respawnDelayMs: 20*60*1000,
    attackStyle: 'slam',
  },
  {
    id: 'iron-tusk', enemyId: 'redmesa-chieftain', name: 'Krag the Iron-Tusk', regionId: 'rindass',
    world: { x: TOWN_BY_ID.redmesa.world.x + 850, y: TOWN_BY_ID.redmesa.world.y + 700 },
    lore: 'An armored, tusked clan war-chief whose orc warband has driven the Rindass clans to the brink of open war.', respawns: true, respawnDelayMs: 20*60*1000,
    attackStyle: 'melee',
  },
  {
    id: 'rootfather', enemyId: 'rootfather', name: 'The Rootfather', regionId: 'druganwoods',
    world: { x: TOWN_BY_ID.deepford.world.x - 950, y: TOWN_BY_ID.deepford.world.y + 750 },
    lore: 'A mine guardian awakened beneath the river forest, calling hungry spirits from the roots.', respawns: true, respawnDelayMs: 20*60*1000,
    attackStyle: 'slam',
  },
  {
    id: 'salt-king', enemyId: 'salt-king', name: 'The Salt King', regionId: 'portquill',
    world: {...SALT_KING_DECK_HOME},
    lore: 'A ruthless sea-lord commanding his moored flagship from its aft fighting deck, guarding stolen crown cargo beyond Tidewatch’s harbor mouth.', respawns: true, respawnDelayMs: 20*60*1000,
    attackStyle: 'melee',
  },
  {
    id: 'frost-wyrm', enemyId: 'frost-wyrm', name: 'The Frost Wyrm', regionId: 'frostlands',
    world: { x: TOWN_BY_ID.skallheim.world.x - 850, y: TOWN_BY_ID.skallheim.world.y + 650 },
    lore: 'A wingless, ice-scaled wyrm driven from the cliffs, now hunting the Skallheim beacon road with native frost wolves.', respawns: true, respawnDelayMs: 20*60*1000,
    attackStyle: 'pounce',
  },
  {
    id: 'ashen-seer', enemyId: 'ashen-seer', name: 'The Ashen Seer', regionId: 'darkav',
    world: { x: TOWN_BY_ID.blackspire.world.x - 900, y: TOWN_BY_ID.blackspire.world.y + 750 },
    lore: 'A volcanic oracle who binds wraiths to the ash and guards the path to Blackspire.', respawns: true, respawnDelayMs: 20*60*1000,
    attackStyle: 'slam',
  },
];
BOSSES.push({id:DRAGON_BOSS_ID,enemyId:'ash-dragon',name:'Varkhul, the Returning Ember',regionId:'darkav',world:{...DRAGON_LAIR},
  lore:'An ancient ember dragon that retreats to recover above Darkav’s molten ridges rather than dying at the hands of challengers.',
  respawns:true,respawnDelayMs:20*60*1000,attackStyle:'slam'});
export const BOSS_BY_ID = Object.fromEntries(BOSSES.map((boss) => [boss.id, boss])) as Record<string, BossDefinition>;
