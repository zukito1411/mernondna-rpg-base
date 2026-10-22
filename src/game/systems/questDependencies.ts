import type {QuestDefinition,QuestObjective,QuestRuntimeState} from '../types';

type Progress=Record<string,QuestRuntimeState>;
type Catalogue=Record<string,QuestDefinition>;
export function questStageComplete(questId:string,objectiveId:string,quests:Progress,catalogue:Catalogue){
  const stage=catalogue[questId]?.objectives.find(o=>o.id===objectiveId);
  return Boolean(stage&&(quests[questId]?.objectiveProgress[objectiveId]??0)>=stage.amount);
}
export function questRequirementsMet(quest:QuestDefinition,quests:Progress,catalogue:Catalogue){
  const stage=quest.prerequisiteObjective;
  return (!quest.prerequisiteQuestId||quests[quest.prerequisiteQuestId]?.status==='completed')
    &&(!stage||questStageComplete(stage.questId,stage.objectiveId,quests,catalogue));
}
export function questDependencyComplete(objective:QuestObjective,quests:Progress,catalogue:Catalogue){
  return objective.targetObjectiveId
    ?questStageComplete(objective.targetId,objective.targetObjectiveId,quests,catalogue)
    :quests[objective.targetId]?.status==='completed';
}
