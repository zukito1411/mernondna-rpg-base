import type { QuestDefinition } from '../game/types';

export const QUESTS: QuestDefinition[] = [
  {
    id: 'first-road',
    name: 'The Broken Road',
    giverNpcId: 'aldren-vale',
    summary: 'Bandits have taken over the old watchtower east of Oakmere. Aldren asks Leigneron to reopen the road.',
    objectives: [
      { id: 'talk-aldren', type: 'talk', targetId: 'aldren-vale', amount: 1, text: 'Speak with Aldren Vale in Oakmere.' },
      { id: 'kill-varr', type: 'kill', targetId: 'bandit-captain', bossId: 'captain-varr', amount: 1, text: 'Defeat Captain Varr at the ruined watchtower.' },
      { id: 'return-aldren', type: 'talk', targetId: 'aldren-vale', amount: 1, text: 'Return to Aldren and report what happened.' },
    ],
    rewardGold: 60,
    rewardXp: 150,
  },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((quest) => [quest.id, quest])) as Record<string, QuestDefinition>;
