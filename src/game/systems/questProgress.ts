import { QUEST_BY_ID } from '../../data/quests';
import type { QuestObjective, QuestRuntimeState } from '../types';

export function advanceQuests(
  current: Record<string, QuestRuntimeState>,
  defeatedBosses: string[],
  event?: { type: QuestObjective['type']; targetId: string; amount: number },
) {
  let changed = false;
  let xp = 0;
  let gold = 0;
  const quests = { ...current };
  for (const [id, savedRuntime] of Object.entries(current)) {
    const definition = QUEST_BY_ID[id];
    if (!definition) continue;
    let runtime = quests[id] ?? savedRuntime;
    if (runtime.status === 'locked'
      && Object.values(QUEST_BY_ID).some(previous => previous.nextQuestId === id && quests[previous.id]?.status === 'completed')) {
      runtime = { status: 'active', objectiveProgress: {} };
      quests[id] = runtime;
      changed = true;
    }
    if (runtime.status !== 'active') continue;
    const progress = { ...runtime.objectiveProgress };
    let usedEvent = false;
    for (const objective of definition.objectives) {
      if ((progress[objective.id] ?? 0) >= objective.amount) continue;
      if (objective.bossId && defeatedBosses.includes(objective.bossId)) {
        progress[objective.id] = objective.amount;
      } else if (!usedEvent && event?.type === objective.type && event.targetId === objective.targetId) {
        progress[objective.id] = Math.min(objective.amount, (progress[objective.id] ?? 0) + event.amount);
        usedEvent = true;
      } else break;
      changed = true;
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
  return { quests: changed ? quests : current, xp, gold };
}
