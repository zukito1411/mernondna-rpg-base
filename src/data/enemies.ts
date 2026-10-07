import type { BossDefinition, EnemyDefinition } from '../game/types';
import { TOWN_BY_ID } from './towns';

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
    id: 'cave-troll', name: 'Cave Troll', spriteFrame: 3, hp: 280, damage: 24, moveSpeed: 58, aggroRange: 300, attackRange: 70, attackCooldownMs: 1400,
    xp: 125, goldMin: 18, goldMax: 35, boss: true, regionWeights: { nardorous: 5, druganwoods: 4 },
  },
  {
    id: 'bandit-captain', name: 'Captain Varr', spriteFrame: 1, hp: 210, damage: 18, moveSpeed: 84, aggroRange: 320, attackRange: 68, attackCooldownMs: 760,
    xp: 110, goldMin: 30, goldMax: 48, boss: true, regionWeights: { trandum: 5 },
  },
];

export const ENEMY_BY_ID = Object.fromEntries(ENEMIES.map((enemy) => [enemy.id, enemy])) as Record<string, EnemyDefinition>;
export function enemyAppearanceMultiplier(definition: EnemyDefinition) {
  return definition.boss ? 1.45 : definition.id === 'road-bandit' ? 1.16 : 1;
}

const oakmere = TOWN_BY_ID.oakmere.world;
export const BOSSES: BossDefinition[] = [
  {
    id: 'captain-varr', enemyId: 'bandit-captain', name: 'Captain Varr', regionId: 'trandum',
    world: { x: oakmere.x + 1400, y: oakmere.y - 850 },
    lore: 'A former caravan guard who now controls a ruined watchtower east of Oakmere.', respawns: false,
  },
  {
    id: 'stonejaw-troll', enemyId: 'cave-troll', name: 'Stonejaw', regionId: 'nardorous',
    world: { x: TOWN_BY_ID.starhold.world.x - 1550, y: TOWN_BY_ID.starhold.world.y + 720 },
    lore: 'An old pass-troll that has learned to break wagons open before eating their draft animals.', respawns: false,
  },
];
