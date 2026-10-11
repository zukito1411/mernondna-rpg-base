import type { BossDefinition, EnemyDefinition } from '../game/types';
import { TOWN_BY_ID } from './towns';
import {DRAGON_LAIR,DRAGON_BOSS_ID,DRAGON_RETURN_MS} from './dragonLair';

export const ENEMIES: EnemyDefinition[] = [
  {
    id: 'gray-wolf', name: 'Gray Wolf', spriteFrame: 0, hp: 42, damage: 7, moveSpeed: 92, aggroRange: 230, attackRange: 54, attackCooldownMs: 950,
    xp: 12, goldMin: 0, goldMax: 2, regionWeights: { trandum: 4, narenthil: 5, nardorous: 2, druganwoods: 4 },
  },
  {
    id: 'road-bandit', name: 'Road Bandit', spriteFrame: 1, hp: 62, damage: 9, moveSpeed: 82, aggroRange: 250, attackRange: 58, attackCooldownMs: 900,
    xp: 18, goldMin: 3, goldMax: 9, regionWeights: { trandum: 5, nardorous: 2, portquill: 4, druganwoods: 2 },
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
    summonEnemyId: 'road-bandit', summonCount: 2, summonCooldownMs: 18000, regionWeights: { trandum: 5 },
  },
  {
    id: 'moonlit-warden', name: 'Moonlit Warden', spriteFrame: 3, hp: 360, damage: 22, moveSpeed: 62, aggroRange: 330, attackRange: 76, attackCooldownMs: 1700,
    xp: 190, goldMin: 26, goldMax: 44, boss: true, attackWindupMs: 780, attackRecoveryMs: 1100,
    summonEnemyId: 'gray-wolf', summonCount: 2, summonCooldownMs: 20000, attackRadius: 88, regionWeights: { narenthil: 5 },
  },
  {
    id: 'stonejaw-troll', name: 'Stonejaw', spriteFrame: 4,spriteTexture:'enemy_troll',appearanceMultiplier:1.9,bodyRadius:32,combatStyle:'troll',hp: 420, damage: 27, moveSpeed: 52, aggroRange: 330, attackRange: 120, attackCooldownMs: 1900,
    xp: 220, goldMin: 35, goldMax: 55, boss: true, attackWindupMs: 900, attackRecoveryMs: 1250,
    summonEnemyId: 'gray-wolf', summonCount: 2, summonCooldownMs: 21000,
    attackRadius: 112, regionWeights: { nardorous: 5, druganwoods: 4 },
  },
  {
    id: 'redmesa-chieftain', name: 'Krag the Iron-Tusk', spriteFrame: 2, hp: 390, damage: 25, moveSpeed: 76, aggroRange: 340, attackRange: 82, attackCooldownMs: 1650,
    xp: 205, goldMin: 30, goldMax: 52, boss: true, attackWindupMs: 640, attackRecoveryMs: 1050,
    summonEnemyId: 'rindass-boar', summonCount: 2, summonCooldownMs: 19000, attackRadius: 92, regionWeights: { rindass: 5 },
  },
  {
    id: 'rootfather', name: 'The Rootfather', spriteFrame: 3, hp: 410, damage: 24, moveSpeed: 48, aggroRange: 320, attackRange: 82, attackCooldownMs: 1900,
    xp: 215, goldMin: 32, goldMax: 54, boss: true, attackWindupMs: 880, attackRecoveryMs: 1300,
    summonEnemyId: 'marsh-wraith', summonCount: 1, summonCooldownMs: 22000, attackRadius: 104, regionWeights: { druganwoods: 5 },
  },
  {
    id: 'salt-king', name: 'The Salt King', spriteFrame: 1, hp: 380, damage: 23, moveSpeed: 72, aggroRange: 340, attackRange: 78, attackCooldownMs: 1550,
    xp: 200, goldMin: 34, goldMax: 58, boss: true, attackWindupMs: 620, attackRecoveryMs: 980,
    summonEnemyId: 'road-bandit', summonCount: 2, summonCooldownMs: 18500, regionWeights: { portquill: 5 },
  },
  {
    id: 'frost-wyrm', name: 'The Frost Wyrm', spriteFrame: 0, hp: 440, damage: 28, moveSpeed: 86, aggroRange: 360, attackRange: 82, attackCooldownMs: 1800,
    xp: 235, goldMin: 36, goldMax: 60, boss: true, attackWindupMs: 720, attackRecoveryMs: 1150,
    summonEnemyId: 'gray-wolf', summonCount: 2, summonCooldownMs: 19500, attackRadius: 98, regionWeights: { frostlands: 5 },
  },
  {
    id: 'ashen-seer', name: 'The Ashen Seer', spriteFrame: 3, hp: 460, damage: 30, moveSpeed: 56, aggroRange: 360, attackRange: 88, attackCooldownMs: 2000,
    xp: 260, goldMin: 42, goldMax: 68, boss: true, attackWindupMs: 980, attackRecoveryMs: 1400,
    summonEnemyId: 'marsh-wraith', summonCount: 2, summonCooldownMs: 21000, attackRadius: 120, regionWeights: { darkav: 5 },
  },
];

ENEMIES.push({id:'ash-dragon',name:'Varkhul, the Returning Ember',spriteFrame:5,spriteTexture:'enemy_dragon',appearanceMultiplier:1.6,
  bodyRadius:64,combatStyle:'dragon',hp:1800,damage:36,moveSpeed:72,aggroRange:650,attackRange:170,attackRadius:240,
  attackCooldownMs:2200,attackWindupMs:1000,attackRecoveryMs:900,xp:520,goldMin:70,goldMax:100,boss:true,regionWeights:{}});
export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map((enemy) => [enemy.id, enemy])) as Record<string, EnemyDefinition>;
export function enemyAppearanceMultiplier(definition: EnemyDefinition) {
  return definition.appearanceMultiplier??(definition.boss ? 1.45 : definition.id === 'road-bandit' ? 1.16 : 1);
}

const oakmere = TOWN_BY_ID.oakmere.world;
export const BOSSES: BossDefinition[] = [
  {
    id: 'captain-varr', enemyId: 'bandit-captain', name: 'Captain Varr', regionId: 'trandum',
    world: { x: oakmere.x + 1400, y: oakmere.y - 850 },
    lore: 'A former caravan guard who now controls a ruined watchtower east of Oakmere.', respawns: false,
    attackStyle: 'melee',
  },
  {
    id: 'moonlit-warden', enemyId: 'moonlit-warden', name: 'Moonlit Warden', regionId: 'narenthil',
    world: { x: TOWN_BY_ID.elarion.world.x + 900, y: TOWN_BY_ID.elarion.world.y + 700 },
    lore: 'An ancient guardian twisted by the blight spreading through Narenthil’s moon grove.', respawns: false,
    attackStyle: 'pounce',
  },
  {
    id: 'stonejaw-troll', enemyId: 'stonejaw-troll', name: 'Stonejaw', regionId: 'nardorous',
    world: { x: TOWN_BY_ID.starhold.world.x - 1550, y: TOWN_BY_ID.starhold.world.y + 720 },
    lore: 'An old pass-troll that has learned to break wagons open before eating their draft animals.', respawns: false,
    attackStyle: 'slam',
  },
  {
    id: 'iron-tusk', enemyId: 'redmesa-chieftain', name: 'Krag the Iron-Tusk', regionId: 'rindass',
    world: { x: TOWN_BY_ID.redmesa.world.x + 850, y: TOWN_BY_ID.redmesa.world.y + 700 },
    lore: 'A clan war-chief whose stampeding warband has driven the Rindass clans to the brink of open war.', respawns: false,
    attackStyle: 'pounce',
  },
  {
    id: 'rootfather', enemyId: 'rootfather', name: 'The Rootfather', regionId: 'druganwoods',
    world: { x: TOWN_BY_ID.deepford.world.x - 950, y: TOWN_BY_ID.deepford.world.y + 750 },
    lore: 'A mine guardian awakened beneath the river forest, calling hungry spirits from the roots.', respawns: false,
    attackStyle: 'slam',
  },
  {
    id: 'salt-king', enemyId: 'salt-king', name: 'The Salt King', regionId: 'portquill',
    world: { x: TOWN_BY_ID.tidewatch.world.x + 850, y: TOWN_BY_ID.tidewatch.world.y - 650 },
    lore: 'A ruthless sea-lord who has turned the harbor lanes into a toll road for his crew.', respawns: false,
    attackStyle: 'melee',
  },
  {
    id: 'frost-wyrm', enemyId: 'frost-wyrm', name: 'The Frost Wyrm', regionId: 'frostlands',
    world: { x: TOWN_BY_ID.skallheim.world.x - 850, y: TOWN_BY_ID.skallheim.world.y + 650 },
    lore: 'A white-furred terror driven from the ice cliffs, now hunting the Skallheim beacon road.', respawns: false,
    attackStyle: 'pounce',
  },
  {
    id: 'ashen-seer', enemyId: 'ashen-seer', name: 'The Ashen Seer', regionId: 'darkav',
    world: { x: TOWN_BY_ID.blackspire.world.x - 900, y: TOWN_BY_ID.blackspire.world.y + 750 },
    lore: 'A volcanic oracle who binds wraiths to the ash and guards the path to Blackspire.', respawns: false,
    attackStyle: 'slam',
  },
];
BOSSES.push({id:DRAGON_BOSS_ID,enemyId:'ash-dragon',name:'Varkhul, the Returning Ember',regionId:'darkav',world:{...DRAGON_LAIR},
  lore:'An ancient ember dragon that retreats to recover above Darkav’s molten ridges rather than dying at the hands of challengers.',
  respawns:true,respawnDelayMs:DRAGON_RETURN_MS,attackStyle:'slam'});
export const BOSS_BY_ID = Object.fromEntries(BOSSES.map((boss) => [boss.id, boss])) as Record<string, BossDefinition>;
