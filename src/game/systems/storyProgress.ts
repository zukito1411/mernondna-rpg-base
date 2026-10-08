import { QUESTS } from '../../data/quests';
import type { QuestObjective, QuestRuntimeState } from '../types';

export function nextObjective(id:string,quests:Record<string,QuestRuntimeState>) {
  const quest=QUESTS.find(q=>q.id===id),runtime=quests[id];
  return runtime?.status==='active'?quest?.objectives.find(o=>(runtime.objectiveProgress[o.id]??0)<o.amount):undefined;
}
export function conversationObjective(npcId:string,quests:Record<string,QuestRuntimeState>,tracked?:string|null) {
  const ids=[...(tracked?[tracked]:[]),...QUESTS.map(q=>q.id)];
  for(const id of new Set(ids)) {
    const objective=nextObjective(id,quests);
    if(objective?.targetId===npcId && ['talk','deliver','choice','puzzle'].includes(objective.type)) return {questId:id,objective};
  }
  return null;
}
export function initialQuests():Record<string,QuestRuntimeState> {
  return Object.fromEntries(QUESTS.map(q=>[q.id,{status:q.id==='first-road'?'active':'locked',objectiveProgress:{}}]));
}
export function objectiveIsCurrent(quests:Record<string,QuestRuntimeState>,type:QuestObjective['type'],targetId:string) {
  return QUESTS.some(q=>{const o=nextObjective(q.id,quests);return o?.type===type&&o.targetId===targetId;});
}
