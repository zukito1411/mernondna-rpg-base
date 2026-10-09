import { create } from 'zustand';
import type { ContentWorldState, NavigationState, QuestObjective, QuestRuntimeState, RegionId } from '../game/types';
import { LEIGNERON } from '../data/player';
import { NPC_BY_ID } from '../data/npcs';
import {BOSS_BY_ID} from '../data/enemies';
import { TOWN_BY_ID } from '../data/towns';
import { advanceQuests } from '../game/systems/questProgress';
import { localSettlementTravelEnabled } from '../utils/localSettlementTravel';
import { initialActiveSkillStatus, type ActiveSkillStatus } from '../data/activeSkills';
import { BASE_ATTRIBUTES, levelForExperience, progressionStats, SKILLS, type AttributeId, type PlayerAttributes, type SkillId } from '../data/progression';
import { QUEST_BY_ID } from '../data/quests';
import { initialQuests, conversationObjective } from '../game/systems/storyProgress';
import {completedStoryScenes,sceneQueue,questConsequences} from '../game/systems/storyScenes';

type Panel = 'map' | 'regional-map' | 'inventory' | 'character' | 'pause' | 'travel' | 'journal' | 'harbor' | null;

export interface DialogueState {
  npcId: string;
  lineIndex: number;
  lines?:string[];
  questId?:string;
  objectiveId?:string;
  choices?:QuestObjective['choices'];
}

export interface BossEncounter {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
}

export interface GameState {
  playerName: string;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  level: number;
  xp: number;
  attributes: PlayerAttributes;
  statPoints: number;
  skillPoints: number;
  learnedSkills: SkillId[];
  gold: number;
  weaponId: string;
  inventory: string[];
  worldX: number;
  worldY: number;
  regionId: RegionId;
  townId: string | null;
  day: number;
  minuteOfDay: number;
  weatherLabel:string;
  weatherAudio:boolean;
  harborPortId:string|null;
  passageRequest:string|null;
  passage:{from:string;to:string;progress:number}|null;
  panel: Panel;
  dialogue: DialogueState | null;
  toast: string | null;
  quests: Record<string, QuestRuntimeState>;
  defeatedBosses: string[];
  bossEncounter: BossEncounter | null;
  worldContent: ContentWorldState;
  unlockedTownShrines:string[];
  travelOriginTownId:string | null;
  travelRequest:string | null;
  travelRequestSource:'map' | 'shrine' | null;
  navigation: NavigationState;
  activeSkillStatus:ActiveSkillStatus;
  storyFlags:Record<string,boolean>;
  storyChoices:Record<string,string>;
  trackedQuestId:string|null;
  cinematic:{id:string;title:string;line:string}|null;
  pendingCinematic:string|null;
  cinematicQueue:string[];
  skipCinematicRequested:boolean;
  chooseDialogue:(id:string)=>void;
  trackQuest:(id:string)=>void;
  setStoryFlag:(id:string)=>void;
  requestCinematicSkip:()=>void;
  setActiveSkillStatus:(status:ActiveSkillStatus) => void;
  setBossEncounter:(encounter:BossEncounter | null) => void;
  setVitals: (hp: number, stamina: number) => void;
  damagePlayer: (amount: number) => void;
  setWorldStatus: (worldX: number, worldY: number, regionId: RegionId, townId: string | null) => void;
  setClock: (day: number, minuteOfDay: number) => void;
  openPanel: (panel: Exclude<Panel, null>) => void;
  closePanel: () => void;
  openShrineTravel:(townId:string) => void;
  requestShrineTravel:(townId:string) => void;
  requestMapTravel:(townId:string) => void;
  clearShrineTravelRequest:() => void;
  startDialogue: (npcId: string) => void;
  advanceDialogue: () => void;
  endDialogue: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  progressQuest: (type: QuestObjective['type'], targetId: string, amount?: number) => void;
  addRewards: (xp: number, gold: number) => void;
  markBossDefeated: (bossId: string) => void;
  recordEnemyDefeat: (enemyId: string, xp: number, gold: number, bossId?: string, worldContent?: ContentWorldState) => void;
  allocateAttribute: (attribute: AttributeId) => void;
  unlockSkill: (skillId: SkillId) => void;
  setContentWorld: (worldContent: ContentWorldState) => void;
  setNavigation: (navigation: NavigationState) => void;
  hydrate: (partial: Partial<GameState>) => void;
  resetGame: () => void;
}

const initialQuestState = initialQuests;

const baseState = () => ({
  playerName: LEIGNERON.name,
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  level: 1,
  xp: 0,
  attributes: { ...BASE_ATTRIBUTES },
  statPoints: 0,
  skillPoints: 0,
  learnedSkills: [] as SkillId[],
  gold: 18,
  weaponId: LEIGNERON.starterWeaponId,
  inventory: ['roadwarden-sword'],
  worldX: LEIGNERON.spawn.x,
  worldY: LEIGNERON.spawn.y,
  regionId: 'trandum' as RegionId,
  townId: 'oakmere' as string | null,
  day: 1,
  minuteOfDay: 8 * 60,
  weatherLabel:'Clear skies',weatherAudio:true,
  harborPortId:null as string|null,passageRequest:null as string|null,passage:null as GameState['passage'],
  panel: null as Panel,
  dialogue: null as DialogueState | null,
  toast: 'Welcome to Mernodna.',
  quests: initialQuestState(),
  defeatedBosses: [] as string[],
  bossEncounter: null as BossEncounter | null,
  worldContent: { states: {}, spawns: {}, nextSpawnSequence: 0 } as ContentWorldState,
  unlockedTownShrines:[] as string[],
  travelOriginTownId:null as string | null,
  travelRequest:null as string | null,
  travelRequestSource:null as 'map' | 'shrine' | null,
  navigation: { heading: Math.PI, target: null, markers: [], interaction: null } as NavigationState,
  activeSkillStatus:initialActiveSkillStatus(),
  storyFlags:{} as Record<string,boolean>,storyChoices:{} as Record<string,string>,trackedQuestId:null as string|null,
  cinematic:null as GameState['cinematic'],pendingCinematic:null as string|null,cinematicQueue:[] as string[],skipCinematicRequested:false,
});

function experienceProgress(state: GameState, xp: number) {
  const totalXp = state.xp + xp;
  const level = levelForExperience(totalXp);
  const levelsGained = Math.max(0, level - state.level);
  return {
    xp: totalXp,
    level,
    statPoints: state.statPoints + levelsGained * 3,
    skillPoints: state.skillPoints + levelsGained,
    ...(levelsGained ? { toast: `Level ${level}! +${levelsGained * 3} status points and +${levelsGained} skill point${levelsGained === 1 ? '' : 's'}.` } : {}),
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...baseState(),
  setVitals: (hp, stamina) => set({ hp, stamina }),
  damagePlayer: (amount) => set((state) => ({ hp: Math.max(0, state.hp - amount) })),
  setWorldStatus: (worldX, worldY, regionId, townId) => set({ worldX, worldY, regionId, townId }),
  setClock: (day, minuteOfDay) => set({ day, minuteOfDay }),
  openPanel: (panel) => {if(!get().cinematic)set({ panel });},
  closePanel: () => set({ panel: null,travelOriginTownId:null,travelRequest:null,travelRequestSource:null }),
  openShrineTravel:(townId) => set(state => {
    if (!Object.hasOwn(TOWN_BY_ID,townId)) return {};
    const unlocked = state.unlockedTownShrines.includes(townId);
    return { panel:'travel',travelOriginTownId:townId,travelRequest:null,travelRequestSource:null,
      unlockedTownShrines:unlocked ? state.unlockedTownShrines : [...state.unlockedTownShrines,townId],
      ...(!unlocked ? { toast:`${TOWN_BY_ID[townId].name} shrine attuned. Shrine travel unlocked.` } : {}) };
  }),
  requestShrineTravel:(townId) => set(state => {
    if (state.panel !== 'travel' || !state.travelOriginTownId || townId === state.travelOriginTownId
      || !Object.hasOwn(TOWN_BY_ID,townId)
      || !localSettlementTravelEnabled() && !state.unlockedTownShrines.includes(townId)) return {};
    return { travelRequest:townId,travelRequestSource:'shrine',panel:null };
  }),
  requestMapTravel:(townId) => set(state => {
    if (!['map','regional-map'].includes(state.panel??'') || state.dialogue || !Object.hasOwn(TOWN_BY_ID,townId)
      || !localSettlementTravelEnabled() && !state.unlockedTownShrines.includes(townId)) return {};
    return { travelRequest:townId,travelRequestSource:'map',travelOriginTownId:null,panel:null };
  }),
  clearShrineTravelRequest:() => set({ travelRequest:null,travelOriginTownId:null,travelRequestSource:null }),
  startDialogue: (npcId) => {
    const state=get(),npc=NPC_BY_ID[npcId];
    if (!npc || state.panel || state.dialogue || state.cinematic) return;
    const existingConversation=conversationObjective(npcId,state.quests,state.trackedQuestId);
    let quests=state.quests,trackedQuestId=existingConversation?.questId??state.trackedQuestId;
    for(const id of npc.questIds) {
      const q=QUEST_BY_ID[id];
      if(q && quests[id]?.status==='locked' && (!q.prerequisiteQuestId || quests[q.prerequisiteQuestId]?.status==='completed') && !['first-road','eight-regions'].includes(id)) {
        quests={...quests,[id]:{status:'active',objectiveProgress:{}}};if(!existingConversation&&(!trackedQuestId||quests[trackedQuestId]?.status!=='active'))trackedQuestId=id;
      }
    }
    const context=conversationObjective(npcId,quests,trackedQuestId);
    const outcome=state.storyFlags['relief-household-charter']?'The crown granaries are open. Every household will have bread through winter.':state.storyFlags['relief-joint-council']?'The market and the kitchens now share the stores. Highmere will face winter together.':null;
    const localOutcome=npc.townId==='cibar-plains'&&state.storyFlags['cibar-irrigation-repaired']?
      state.storyFlags['cibar-public-water']?'The pump is mended, and every family has its turn at the well.':'The pump is mended. The growers take turns tending it.':null;
    const highmereOutcome=state.quests['crown-summons']?.status==='completed'&&npc.townId==='highmere'?
      state.storyFlags['main-public-reports']?'The warning has been spoken in every town square. Folk are watching the old roads.':state.storyFlags['main-watch-reports']?'The riders carry the warning from town to town, unseen by the danger.':'The signs from the far roads have reached Highmere. The crown knows what threatens them.':null;
    const lines=context?.objective.dialogue ?? (highmereOutcome?[highmereOutcome,...npc.dialogue]:localOutcome?[localOutcome,...npc.dialogue]:outcome&&['mairin-reed','nella-harrow','maela-quill','renna-vale'].includes(npcId)?[outcome,...npc.dialogue]:npc.dialogue);
    set({quests,trackedQuestId,dialogue:{npcId,lineIndex:0,lines,...(context?{questId:context.questId,objectiveId:context.objective.id,choices:context.objective.choices}:{})}});
    if(context && ['talk','deliver'].includes(context.objective.type)) get().progressQuest(context.objective.type,npcId);
  },
  advanceDialogue: () => set((state) => state.dialogue ? { dialogue: { ...state.dialogue, lineIndex: state.dialogue.lineIndex + 1 } } : {}),
  endDialogue: () => set({ dialogue: null }),
  chooseDialogue:(id)=>{
    const state=get(),dialogue=state.dialogue;
    if(!dialogue || dialogue.lineIndex<(dialogue.lines?.length??1)-1 || !dialogue.questId) return;
    const objective=QUEST_BY_ID[dialogue.questId]?.objectives.find(o=>o.id===dialogue.objectiveId);
    const choice=dialogue.choices?.find(c=>c.id===id);
    if(!objective||!choice) return;
    if(choice.correct===false){set({toast:choice.response});return;}
    set({storyChoices:{...state.storyChoices,[dialogue.questId+':'+objective.id]:id},
      storyFlags:{...state.storyFlags,...(choice.flag?{[choice.flag]:true}:{})},dialogue:null});
    get().progressQuest(objective.type,objective.targetId);
    get().showToast(choice.response);
  },
  trackQuest:(id)=>{if(get().quests[id]?.status==='active')set({trackedQuestId:id});},
  setStoryFlag:(id)=>set(state=>({storyFlags:{...state.storyFlags,[id]:true}})),
  requestCinematicSkip:()=>set({skipCinematicRequested:true}),
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
  progressQuest: (type, targetId, amount = 1) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const state = get();
    const result = advanceQuests(state.quests, state.defeatedBosses, { type, targetId, amount },state.storyFlags);
    const scenes=sceneQueue(state.pendingCinematic,state.cinematicQueue,completedStoryScenes(state.quests,result.quests,state.storyFlags),state.storyFlags);
    const shrines=['elarion','starhold','redmesa','deepford','tidewatch','skallheim','blackspire'].filter(id=>(result.quests['eight-regions']?.objectiveProgress['report:'+id]??0)>=1);
    const progression = experienceProgress(state, result.xp);
    const rewardToast = result.xp || result.gold ? `Quest complete — +${result.xp} XP, +${result.gold} gold` : null;
    set({ quests: result.quests, gold: state.gold + result.gold, ...progression,
      trackedQuestId:state.trackedQuestId&&result.quests[state.trackedQuestId]?.status==='completed'?QUEST_BY_ID[state.trackedQuestId]?.nextQuestId??null:state.trackedQuestId,
      ...scenes,storyFlags:questConsequences(result.quests,state.storyFlags),unlockedTownShrines:[...new Set([...state.unlockedTownShrines,...shrines])],
      ...(rewardToast ? { toast: progression.toast ? `${rewardToast}. ${progression.toast}` : rewardToast } : {}),
    });
  },
  addRewards: (xp, gold) => set((state) => {
    return { ...experienceProgress(state, xp), gold: state.gold + gold };
  }),
  markBossDefeated: (bossId) => set((state) => state.defeatedBosses.includes(bossId) ? {} : { defeatedBosses: [...state.defeatedBosses, bossId] }),
  recordEnemyDefeat: (enemyId, xp, gold, bossId, worldContent) => set((state) => {
    const known=bossId&&state.defeatedBosses.includes(bossId);
    if (known && !BOSS_BY_ID[bossId!]?.respawns) return {};
    const defeatedBosses = bossId&&!known ? [...state.defeatedBosses, bossId] : state.defeatedBosses;
    const result = advanceQuests(state.quests, defeatedBosses, { type: 'kill', targetId: enemyId, amount: 1 },state.storyFlags);
    const progression = experienceProgress(state, xp + result.xp);
    return { defeatedBosses, quests: result.quests, ...progression, gold: state.gold + gold + result.gold,
      ...sceneQueue(state.pendingCinematic,state.cinematicQueue,completedStoryScenes(state.quests,result.quests,state.storyFlags),state.storyFlags),storyFlags:questConsequences(result.quests,state.storyFlags),
      ...(worldContent ? { worldContent } : {}) };
  }),
  allocateAttribute: (attribute) => set((state) => {
    if (state.statPoints <= 0) return {};
    const attributes = { ...state.attributes, [attribute]: state.attributes[attribute] + 1 };
    const derived = progressionStats(attributes, state.learnedSkills);
    return { attributes, statPoints: state.statPoints - 1, maxHp: derived.maxHp, maxStamina: derived.maxStamina,
      toast: `${attribute[0].toUpperCase()}${attribute.slice(1)} increased.` };
  }),
  unlockSkill: (skillId) => set((state) => {
    const skill = SKILLS.find(entry => entry.id === skillId);
    if (!skill || state.skillPoints <= 0 || state.learnedSkills.includes(skillId)) return {};
    const learnedSkills = [...state.learnedSkills, skillId];
    const derived = progressionStats(state.attributes, learnedSkills);
    return { learnedSkills, skillPoints: state.skillPoints - 1, maxHp: derived.maxHp, maxStamina: derived.maxStamina,
      toast: `Skill learned: ${skill.name}.` };
  }),
  setContentWorld: (worldContent) => set({ worldContent }),
  setNavigation: (navigation) => set({ navigation }),
  setActiveSkillStatus:(activeSkillStatus) => set({ activeSkillStatus }),
  setBossEncounter:(bossEncounter) => set({ bossEncounter }),
  hydrate: (partial) => set(partial),
  resetGame: () => set(baseState()),
}));
