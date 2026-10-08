import { QUEST_BY_ID } from '../../data/quests';
import type { QuestObjective, QuestRuntimeState } from '../types';

export function advanceQuests(
  current: Record<string, QuestRuntimeState>,
  defeatedBosses: string[],
  event?: { type: QuestObjective['type']; targetId: string; amount: number },
  storyFlags:Record<string,boolean>={},
) {
  let changed = false;
  let xp = 0;
  let gold = 0;
  const quests = { ...current };
  const usedEvents=new Set<string>();
  for(let pass=0;pass<=Object.keys(quests).length;pass++){
  let passChanged=false;
  for (const [id, savedRuntime] of Object.entries(quests)) {
    const definition = QUEST_BY_ID[id];
    if (!definition) continue;
    let runtime = quests[id] ?? savedRuntime;
    if (runtime.status === 'locked'
      && Object.values(QUEST_BY_ID).some(previous => previous.nextQuestId === id && quests[previous.id]?.status === 'completed')) {
      runtime = { status: 'active', objectiveProgress: {} };
      quests[id] = runtime;
      changed = true;
      passChanged=true;
    }
    if (runtime.status !== 'active') continue;
    const progress = { ...runtime.objectiveProgress };
    for (const objective of definition.objectives) {
      if ((progress[objective.id] ?? 0) >= objective.amount) continue;
      if (objective.bossId && defeatedBosses.includes(objective.bossId)) {
        progress[objective.id] = objective.amount;
      } else if((objective.type==='quest'&&quests[objective.targetId]?.status==='completed')
        ||(objective.type==='investigate'&&storyFlags['discovery:'+objective.targetId])){
        progress[objective.id]=objective.amount;
      } else if (!usedEvents.has(id) && event?.type === objective.type && event.targetId === objective.targetId) {
        progress[objective.id] = Math.min(objective.amount, (progress[objective.id] ?? 0) + event.amount);
        usedEvents.add(id);
      } else break;
      changed = true;
      passChanged=true;
      if (progress[objective.id] < objective.amount) break;
    }
    const completed = definition.objectives.every(o => (progress[o.id] ?? 0) >= o.amount);
    quests[id] = { status: completed ? 'completed' : runtime.status, objectiveProgress: progress };
    if (completed) {
      changed = true;
      xp += definition.rewardXp;
      gold += definition.rewardGold;
    }
  }
  if(!passChanged)break;
  }
  return { quests: changed ? quests : current, xp, gold };
}
