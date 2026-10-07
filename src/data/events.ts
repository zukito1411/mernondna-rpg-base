import type { DynamicEventDefinition } from '../game/types';

export const DYNAMIC_EVENTS: DynamicEventDefinition[] = [
  {
    id: 'road-ambush', name: 'Road Ambush', regions: ['trandum', 'portquill', 'nardorous'], enemyId: 'road-bandit', enemyCount: 3,
    headline: 'Bandits on the road', description: 'A small outlaw group has moved to cut travelers off from the nearest settlement.'
  },
  {
    id: 'hungry-pack', name: 'Hungry Wolf Pack', regions: ['trandum', 'narenthil', 'druganwoods'], minHour: 18, maxHour: 6, enemyId: 'gray-wolf', enemyCount: 4,
    headline: 'Howls nearby', description: 'A hungry pack has begun ranging close to the road after dark.'
  },
  {
    id: 'boar-charge', name: 'Boar Rush', regions: ['rindass', 'trandum'], enemyId: 'rindass-boar', enemyCount: 2,
    headline: 'The brush erupts', description: 'Startled boars charge out of cover and across the player’s path.'
  }
];
