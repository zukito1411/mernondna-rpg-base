import { expect, vi } from 'vitest';
import { QUEST_BY_ID } from '../src/data/quests';
import { CONTENT_BY_ID, WORLD_CONTENT, initialContentState } from '../src/data/content';
import { STORY_ENCOUNTER_BY_ID } from '../src/data/adventure';
import { useGameStore } from '../src/store/gameStore';
import { nextObjective } from '../src/game/systems/storyProgress';
import { resolveQuestTarget } from '../src/game/systems/questNavigation';
import type { QuestObjective } from '../src/game/types';

/** Virtual UI time: exercise the real debounce without waiting between clicks. */
let questTime = 1000;
export function questClock() {
  return vi.spyOn(performance, 'now').mockImplementation(() => questTime += 200);
}
export function readDialogue(npcId: string, choiceId?: string) {
  const store = useGameStore.getState();
  store.startDialogue(npcId);
  let dialogue = useGameStore.getState().dialogue;
  expect(dialogue?.npcId).toBe(npcId);
  while (dialogue && dialogue.lineIndex < (dialogue.lines?.length ?? 1) - 1) {
    store.advanceDialogue(); dialogue = useGameStore.getState().dialogue;
  }
  if (dialogue?.choices?.length) {
    const choice = choiceId ? dialogue.choices.find(c => c.id === choiceId) : dialogue.choices.find(c => c.correct !== false);
    expect(choice).toBeTruthy(); store.chooseDialogue(choice!.id);
  }
  store.endDialogue();
}
export function playObjective(questId: string, objective: QuestObjective, choiceId?: string) {
  const store = useGameStore.getState();
  store.trackQuest(questId);
  const target = resolveQuestTarget(store.quests, store.worldContent, { x: store.worldX, y: store.worldY }, undefined, questId);
  expect(target, questId + '/' + objective.id + ' has a destination').toBeTruthy();
  if (objective.type === 'quest' && store.quests[objective.targetId]?.status === 'active')
    expect(target?.questId).toBe(objective.targetId);
  else expect(target?.objectiveId).toBe(objective.id);
  if (['talk', 'deliver', 'choice', 'puzzle'].includes(objective.type)) {
    store.trackQuest(questId); readDialogue(objective.targetId, choiceId);
  } else if (objective.type === 'quest') {
    finishQuest(objective.targetId); store.progressQuest('quest', objective.targetId, 1, questId);
  } else if (objective.type === 'kill' && objective.killContentPrefix) {
    const actors = WORLD_CONTENT.filter(d => d.kind === 'creature' && d.id.startsWith(objective.killContentPrefix!)
      && (objective.enemyIds ?? [objective.targetId]).includes(d.enemyId));
    expect(actors.length, questId + '/' + objective.id).toBeGreaterThanOrEqual(objective.amount);
    for (const actor of actors.slice(0, objective.amount)) {
      if (actor.kind !== 'creature') continue;
      const world = useGameStore.getState().worldContent;
      const defeated = { ...world, states: { ...world.states, [actor.id]: { ...initialContentState(actor), hp: 0, defeated: true } } };
      store.recordEnemyDefeat(actor.enemyId, 0, 0, undefined, defeated, actor.id);
    }
  } else if (objective.bossId) {
    const id = 'boss:' + objective.bossId, actor = CONTENT_BY_ID[id];
    expect(actor).toBeTruthy();
    const world = useGameStore.getState().worldContent;
    const returned = { ...world, states: { ...world.states, [id]: initialContentState(actor) } };
    store.setContentWorld(returned);
    store.recordEnemyDefeat(objective.targetId, 0, 0, objective.bossId,
      { ...returned, states: { ...returned.states, [id]: { ...returned.states[id], hp: 0, defeated: true } } }, id);
  } else {
    if (objective.type === 'encounter') {
      const encounter = STORY_ENCOUNTER_BY_ID[objective.targetId]; expect(encounter?.questId).toBe(questId);
      encounter.waves.flat().forEach((_, i) => store.setStoryFlag(`encounter:${encounter.id}:defeated:${i}`));
      store.setStoryFlag(`encounter:${encounter.id}:complete`);
    }
    if (objective.type === 'investigate') store.setStoryFlag('discovery:' + objective.targetId);
    store.progressQuest(objective.type, objective.targetId, objective.amount, questId);
  }
  expect(useGameStore.getState().quests[questId].objectiveProgress[objective.id], questId + '/' + objective.id).toBe(objective.amount);
}
export function reachObjective(questId: string, objectiveId?: string, choices: Record<string, string> = {}) {
  const quest = QUEST_BY_ID[questId];
  if (quest.prerequisiteQuestId && useGameStore.getState().quests[quest.prerequisiteQuestId].status !== 'completed') finishQuest(quest.prerequisiteQuestId);
  if (useGameStore.getState().quests[questId].status === 'locked') {
    useGameStore.getState().startDialogue(quest.giverNpcId);
    useGameStore.getState().endDialogue(); // Accepting isn't hearing the whole conversation.
  }
  for (let count = 0; count <= quest.objectives.length; count++) {
    const objective = nextObjective(questId, useGameStore.getState().quests);
    if (!objective || objective.id === objectiveId) return;
    playObjective(questId, objective, choices[objective.id]);
  }
  throw new Error('Quest did not advance: ' + questId);
}
export function finishQuest(questId: string, choices: Record<string, string> = {}) {
  reachObjective(questId, undefined, choices);
  expect(useGameStore.getState().quests[questId].status, questId).toBe('completed');
}
