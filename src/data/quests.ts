import type { QuestDefinition } from '../game/types';
import { HIGHMERE_QUESTS } from './highmereQuests';
import { CIBAR_QUEST } from './cibarQuests';
import {CROWN_SUMMONS,regionalMainObjectives} from './mainStory';
import { NPC_NAME_ALIASES,NPC_BY_ID } from './npcs';
import {TOWER_QUEST} from './towerOfMight';
import { rewriteNpcMentions } from './npcPresentation';
import {DRAGON_QUEST} from './dragonLair';
import {QUEST_SCENE_BINDINGS} from './questScenes';
import {applyCampaign} from './campaign';
import {applyStoryRevision} from './storyRevision';
import {applyAdventure} from './adventure';
import {applyStoryExpansion} from './storyExpansion';

export const QUESTS: QuestDefinition[] = [
  {
    id: 'first-road',
    name: 'The Broken Road',
    giverNpcId: 'aldren-vale',
    summary: 'Bandits have taken over the old watchtower east of Oakmere. Aldren asks Leigneron to reopen the road.',
    objectives: [
      { id: 'talk-aldren', type: 'talk', targetId: 'aldren-vale', amount: 1, text: 'Speak with Aldren Vale in Oakmere.',dialogue:['The bandits are stealing seed grain now. If we lose another cart, the farmers won’t have enough left to plant.','Varr’s men have taken over the old tower. Somebody’s paying them to stop our wagons. I want to know who.'] },
      { id: 'kill-varr', type: 'kill', targetId: 'bandit-captain', bossId: 'captain-varr', amount: 1, text: 'Defeat Captain Varr at the ruined watchtower.' },
      { id: 'return-aldren', type: 'talk', targetId: 'aldren-vale', amount: 1, text: 'Return to Aldren with Varr’s stolen royal seal.',dialogue:['The road’s open again? That’s a relief. I’ll send guards to make sure it stays that way.','That’s a real seal from Highmere. Renna might know who issued it. I don’t like the thought of someone there working with Varr.'] },
    ],
    rewardGold: 60,
    rewardXp: 150,
    nextQuestId: 'crown-summons',
  },
  {
    id: 'eight-regions',
    name: 'The Eightfold Blight',
    giverNpcId: 'aldren-vale',
    summary: 'Aldren’s reports point to a spreading corruption. Find the region’s champions, break their hold over the roads, and return to Oakmere.',
    objectives: [
      { id: 'moonlit-warden', type: 'kill', targetId: 'moonlit-warden', bossId: 'moonlit-warden', amount: 1, text: 'Defeat the Moonlit Warden in Narenthil.' },
      { id: 'stonejaw', type: 'kill', targetId: 'stonejaw-troll', bossId: 'stonejaw-troll', amount: 1, text: 'Defeat Stonejaw in Nardorous.' },
      { id: 'iron-tusk', type: 'kill', targetId: 'redmesa-chieftain', bossId: 'iron-tusk', amount: 1, text: 'Defeat Krag the Iron-Tusk in Rindass.' },
      { id: 'rootfather', type: 'kill', targetId: 'rootfather', bossId: 'rootfather', amount: 1, text: 'Defeat the Rootfather in Druganwoods.' },
      { id: 'salt-king', type: 'kill', targetId: 'salt-king', bossId: 'salt-king', amount: 1, text: 'Defeat the Salt King aboard his flagship south of Tidewatch.' },
      { id: 'frost-wyrm', type: 'kill', targetId: 'frost-wyrm', bossId: 'frost-wyrm', amount: 1, text: 'Defeat the Frost Wyrm in the Frostlands.' },
      { id: 'ashen-seer', type: 'kill', targetId: 'ashen-seer', bossId: 'ashen-seer', amount: 1, text: 'Defeat the Ashen Seer in Darkav.' },
      { id: 'return-aldren-after-regions', type: 'talk', targetId: 'aldren-vale', amount: 1, text: 'Return to Aldren in Oakmere.' },
    ],
    rewardGold: 420,
    rewardXp: 1800,
  },
];

QUESTS.splice(1,0,CROWN_SUMMONS);
const regional=QUESTS.find(q=>q.id==='eight-regions')!;
regional.objectives=regionalMainObjectives(regional.objectives);
regional.prerequisiteQuestId='crown-summons';
regional.summary='Follow the strange signs from Highmere across the mainland and sea. Face the creatures that haunt the old roads, learn what woke them, and bring the people’s warnings home to Oakmere.';
QUESTS.push(...HIGHMERE_QUESTS,CIBAR_QUEST,DRAGON_QUEST);
for (let i = 0; i < QUESTS.length; i += 1) {
  for(const objective of QUESTS[i].objectives){const scene=QUEST_SCENE_BINDINGS[QUESTS[i].id]?.[objective.id];if(scene&&!objective.cinematicId)objective.cinematicId=scene;}
  QUESTS[i] = rewriteNpcMentions(QUESTS[i], NPC_NAME_ALIASES);
}
applyCampaign(QUESTS);
applyStoryRevision(QUESTS);
applyAdventure(QUESTS);
applyStoryExpansion(QUESTS);
QUESTS.push(TOWER_QUEST);
// Every side-quest giver participates in the same dialogue and overhead cue
// system, including quests added after the original NPC catalogue was built.
for(const quest of QUESTS){
  // Unclassified legacy quests already display as side adventures in the
  // journal. Give the marker/dialogue systems that same explicit meaning.
  quest.kind??='side';
  if(quest.kind==='side'){
    const giver=NPC_BY_ID[quest.giverNpcId];
    if(giver&&!giver.questIds.includes(quest.id))giver.questIds.push(quest.id);
  }
}
for(let i=0;i<QUESTS.length;i++)QUESTS[i]=rewriteNpcMentions(QUESTS[i],NPC_NAME_ALIASES);
// Apply stable legacy scene bindings to their replacement story stages too.
for(const quest of QUESTS)for(const objective of quest.objectives)
  objective.cinematicId??=QUEST_SCENE_BINDINGS[quest.id]?.[objective.id];
export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((quest) => [quest.id, quest])) as Record<string, QuestDefinition>;
