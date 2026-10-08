import { QUEST_BY_ID } from '../../data/quests';
import { WORLD_CONTENT } from '../../data/content';
import { NPC_BY_ID } from '../../data/npcs';
import { ENEMY_BY_ID } from '../../data/enemies';
import { TOWN_BY_ID } from '../../data/towns';
import type { ContentDefinition, ContentWorldState, QuestRuntimeState, QuestTarget, Vec2 } from '../types';

export function activeObjective(quests: Record<string, QuestRuntimeState>,trackedQuestId?:string|null) {
  const entries=Object.entries(quests).sort(([a],[b])=>Number(b===trackedQuestId)-Number(a===trackedQuestId));
  for (const [questId, runtime] of entries) {
    const quest = QUEST_BY_ID[questId];
    if (!quest || runtime.status !== 'active') continue;
    const objective = quest.objectives.find(o => (runtime.objectiveProgress[o.id] ?? 0) < o.amount);
    if (objective) return { questId, quest, objective };
  }
  return null;
}

export function resolveQuestTarget(quests: Record<string, QuestRuntimeState>, world: ContentWorldState, player: Vec2,
  livePosition?: (id: string) => Vec2 | undefined,trackedQuestId?:string|null): QuestTarget | null {
  const active = activeObjective(quests,trackedQuestId);
  if (!active) return null;
  const { objective, questId } = active;
  if(objective.type==='quest'){
    if(quests[objective.targetId]?.status==='active')return resolveQuestTarget(quests,world,player,livePosition,objective.targetId);
    const dependency=QUEST_BY_ID[objective.targetId],npc=dependency&&NPC_BY_ID[dependency.giverNpcId];
    if(!npc)return null;const town=TOWN_BY_ID[npc.townId],id='npc:'+npc.id,p=livePosition?.(id)??world.states[id]??{x:town.world.x+npc.worldOffset.x,y:town.world.y+npc.worldOffset.y};
    return {...p,contentId:id,label:npc.name+' — '+dependency.name,questId,objectiveId:objective.id,type:objective.type};
  }
  const candidates = WORLD_CONTENT.filter(d => {
    if (world.states[d.id]?.defeated) return false;
    if (objective.contentId) return d.id === objective.contentId;
    if (['talk','deliver','choice','puzzle'].includes(objective.type)) return d.kind === 'npc' && d.npcId === objective.targetId;
    if (objective.type === 'kill') return d.kind === 'creature' && (objective.bossId ? d.bossId === objective.bossId : d.enemyId === objective.targetId);
    if (objective.type === 'visit') return d.kind === 'settlement' && d.townId === objective.targetId;
    if('questTargetId' in d && d.questTargetId===objective.targetId)return !world.states[d.id]?.used;
    return d.id === objective.targetId;
  });
  let target: ContentDefinition | undefined, position: Vec2 | undefined, nearest = Infinity;
  for (const d of candidates) {
    const p = livePosition?.(d.id) ?? world.states[d.id] ?? d.world;
    const distance = Math.hypot(p.x - player.x, p.y - player.y);
    if (distance < nearest) { nearest = distance; target = d; position = p; }
  }
  if (!target || !position) return null;
  const label = target.kind === 'npc' ? NPC_BY_ID[target.npcId].name : target.kind === 'creature'
    ? ENEMY_BY_ID[target.enemyId].name : target.kind === 'settlement' ? TOWN_BY_ID[target.townId].name
    : 'name' in target ? target.name : objective.text;
  return { x: position.x, y: position.y, contentId: target.id, label, questId, objectiveId: objective.id, type: objective.type };
}

export function questBearing(player: Vec2, target: Vec2) { return Math.atan2(target.x - player.x, player.y - target.y); }
export function compassDirection(bearing: number) {
  const directions = ['N','NE','E','SE','S','SW','W','NW'];
  return directions[((Math.round(bearing / (Math.PI / 4)) % 8) + 8) % 8];
}
export function mapPoint(point: Vec2, center: Vec2, range: number, size: number, clamp = false) {
  let dx = (point.x - center.x) * size / (2 * range), dy = (point.y - center.y) * size / (2 * range);
  const distance = Math.hypot(dx, dy), limit = size / 2 - 12;
  if (clamp && distance > limit) { dx *= limit / distance; dy *= limit / distance; }
  return { x: size / 2 + dx, y: size / 2 + dy, offscreen: distance > limit };
}
