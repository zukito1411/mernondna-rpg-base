import { QUEST_BY_ID } from '../../data/quests';
import { WORLD_CONTENT } from '../../data/content';
import type { ContentWorldState, QuestObjective, QuestRuntimeState } from '../types';
import {gateTowerQuest} from '../../data/towerOfMight';
import {questDependencyComplete,questRequirementsMet} from './questDependencies';

const campIds=new Map<string,string[]>();
function clearedCampCount(objective:QuestObjective,world?:ContentWorldState){
  if(objective.type!=='kill'||!objective.killContentPrefix||!world)return 0;
  const key=objective.killContentPrefix+'|'+(objective.enemyIds??[objective.targetId]).join(',');
  let ids=campIds.get(key);
  if(!ids){ids=WORLD_CONTENT.filter(d=>d.kind==='creature'&&d.id.startsWith(objective.killContentPrefix!)
    &&(objective.enemyIds??[objective.targetId]).includes(d.enemyId)).map(d=>d.id);campIds.set(key,ids);}
  return ids.reduce((n,id)=>n+Number(world.states[id]?.defeated===true),0);
}

export function advanceQuests(
  current: Record<string, QuestRuntimeState>,
  defeatedBosses: string[],
  event?: { type: QuestObjective['type']; targetId: string; amount: number; contentId?:string;questId?:string },
  storyFlags:Record<string,boolean>={},
  world?:ContentWorldState,
) {
  const gated=gateTowerQuest(current);
  let changed = gated!==current;
  let xp = 0;
  let gold = 0;
  const quests = { ...gated };
  const usedEvents=new Set<string>();
  for(let pass=0;pass<=Object.keys(quests).length;pass++){
  let passChanged=false;
  for (const [id, savedRuntime] of Object.entries(quests)) {
    const definition = QUEST_BY_ID[id];
    if (!definition) continue;
    let runtime = quests[id] ?? savedRuntime;
    if (runtime.status === 'locked'
      && questRequirementsMet(definition,quests,QUEST_BY_ID)
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
      const wasComplete=(progress[objective.id]??0)>=objective.amount;
      const cleared=clearedCampCount(objective,world);
      if(objective.completedByFlag&&storyFlags[objective.completedByFlag]){
        progress[objective.id]=objective.amount;
      }else if(cleared>(progress[objective.id]??0)){
        progress[objective.id]=Math.min(objective.amount,cleared);
      } else if (objective.bossId && !objective.requiresFreshDefeat && defeatedBosses.includes(objective.bossId)) {
        progress[objective.id] = objective.amount;
      } else if((objective.type==='quest'&&questDependencyComplete(objective,quests,QUEST_BY_ID))
        ||(objective.type==='investigate'&&storyFlags['discovery:'+objective.targetId])){
        progress[objective.id]=objective.amount;
      } else if (!usedEvents.has(id) && event?.type === objective.type
        && objective.type!=='quest'
        &&(!event.questId||event.questId===id)
        && (objective.type==='kill'?(objective.enemyIds??[objective.targetId]).includes(event.targetId):event.targetId===objective.targetId)
        && (objective.type!=='kill'||!objective.killContentPrefix||Boolean(event.contentId?.startsWith(objective.killContentPrefix)))) {
        // Scoped camps use their ledger, not repeated death notifications.
        if(objective.type==='kill'&&objective.killContentPrefix&&world)break;
        progress[objective.id] = Math.min(objective.amount, (progress[objective.id] ?? 0) + event.amount);
        usedEvents.add(id);
      } else break;
      changed = true;
      passChanged=true;
      if(!wasComplete&&progress[objective.id]>=objective.amount)xp+=objective.rewardXp??0;
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
