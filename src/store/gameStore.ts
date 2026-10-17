import { create } from 'zustand';
import type { ContentWorldState, NavigationState, QuestObjective, QuestRuntimeState, RegionId } from '../game/types';
import { LEIGNERON } from '../data/player';
import { NPC_BY_ID } from '../data/npcs';
import {BOSS_BY_ID} from '../data/enemies';
import { TOWN_BY_ID } from '../data/towns';
import { advanceQuests } from '../game/systems/questProgress';
import { localSettlementTravelEnabled } from '../utils/localSettlementTravel';
import { initialActiveSkillStatus, type ActiveSkillStatus } from '../data/activeSkills';
import { BASE_ATTRIBUTES, MAX_PLAYER_LEVEL, ATTRIBUTE_CAP, STAT_POINTS_PER_LEVEL, attributeBudget, skillBudget, earnedRewards, xpTotalForLevel, levelForExperience, progressionStats, bossWeaponDropChance, supplyDropChance, SKILLS, type AttributeId, type PlayerAttributes, type SkillId } from '../data/progression';
import { QUEST_BY_ID } from '../data/quests';
import { initialQuests, conversationObjective } from '../game/systems/storyProgress';
import {completedStoryScenes,sceneQueue,questConsequences} from '../game/systems/storyScenes';
import {CAMPAIGN_REVISION_FLAG,INDOOR_STORY_FLAG,COMBAT_CLEARANCE_REVISION_FLAG} from '../data/campaign';
import {ADVENTURE_REVISION_FLAG} from '../data/adventure';
import {reactiveStoryDialogue} from '../game/systems/storyDialogue';
import {ACTIVE_SKILL_BY_ID,DEFAULT_SKILL_SLOTS,type ActiveSkillId} from '../data/activeSkills';
import {BOSS_WEAPONS,POTIONS,canDropPotion,merchantStock,itemName,type PotionId} from '../data/economy';
import {WEAPON_BY_ID,WEAPONS} from '../data/weapons';
import {localPlayCheatsEnabled} from '../utils/localPlayCheats';
import {acceptUiAction} from '../utils/uiInputGuard';
import type {StoryPanelRef} from '../data/storyPanelArt';
import {emptyJournal,restoreJournal,discoverCreature,discoverJournalEntry,type JournalState} from '../data/journal';

const LOCAL_TEST_GOLD=1_000_000_000;

type Panel = 'map' | 'regional-map' | 'inventory' | 'character' | 'pause' | 'travel' | 'journal' | 'codex' | 'harbor' | null;

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
  journal:JournalState;
  discoverCreature:(enemyId:string,bossId?:string,defeated?:boolean)=>void;
  discoverRecord:(kind:'characters'|'regions'|'weapons',id:string)=>void;
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
  consumables:Record<PotionId,number>;
  vitalRevision:number;
  learnedCombatArts:ActiveSkillId[];
  skillSlots:(ActiveSkillId|null)[];
  buyItem:(npcId:string,itemId:string)=>void;
  equipWeapon:(id:string)=>void;
  usePotion:(id:PotionId)=>void;
  learnCombatArt:(id:ActiveSkillId)=>void;
  setSkillSlot:(slot:number,id:ActiveSkillId|null)=>void;
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
  cinematic:{id:string;title:string;line:string;ready:boolean;covered?:boolean;ending?:boolean;focusNpcId?:string;illustration?:StoryPanelRef}|null;
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
  progressQuest: (type: QuestObjective['type'], targetId: string, amount?: number,questId?:string) => void;
  addRewards: (xp: number, gold: number) => void;
  markBossDefeated: (bossId: string) => void;
  recordEnemyDefeat: (enemyId: string, xp: number, gold: number, bossId?: string, worldContent?: ContentWorldState, contentId?:string, lootEligible?:boolean) => void;
  allocateAttribute: (attribute: AttributeId) => void;
  unlockSkill: (skillId: SkillId) => void;
  setContentWorld: (worldContent: ContentWorldState) => void;
  setNavigation: (navigation: NavigationState) => void;
  hydrate: (partial: Partial<GameState>) => void;
  resetGame: () => void;
}

const initialQuestState = initialQuests;

const baseState = () => ({
  journal:restoreJournal(emptyJournal(),{inventory:localPlayCheatsEnabled()?WEAPONS.map(w=>w.id):['roadwarden-sword'],defeatedBosses:[],regionId:'trandum'}),
  playerName: LEIGNERON.name,
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  level: localPlayCheatsEnabled()?MAX_PLAYER_LEVEL:1,
  xp: localPlayCheatsEnabled()?xpTotalForLevel(MAX_PLAYER_LEVEL):0,
  attributes: { ...BASE_ATTRIBUTES },
  statPoints: localPlayCheatsEnabled()?attributeBudget(MAX_PLAYER_LEVEL):0,
  skillPoints: localPlayCheatsEnabled()?skillBudget(MAX_PLAYER_LEVEL):0,
  learnedSkills: [] as SkillId[],
  gold: localPlayCheatsEnabled()?LOCAL_TEST_GOLD:18,
  weaponId: LEIGNERON.starterWeaponId,
  inventory: localPlayCheatsEnabled()?WEAPONS.map(w=>w.id):['roadwarden-sword'],
  consumables:{'healing-potion':2,'stamina-potion':1},vitalRevision:0,
  learnedCombatArts:[] as ActiveSkillId[],skillSlots:[...DEFAULT_SKILL_SLOTS] as (ActiveSkillId|null)[],
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
  storyFlags:{[CAMPAIGN_REVISION_FLAG]:true,[INDOOR_STORY_FLAG]:true,[ADVENTURE_REVISION_FLAG]:true,[COMBAT_CLEARANCE_REVISION_FLAG]:true} as Record<string,boolean>,storyChoices:{} as Record<string,string>,trackedQuestId:'first-road' as string|null,
  cinematic:null as GameState['cinematic'],pendingCinematic:'roadborn-opening' as string|null,cinematicQueue:[] as string[],skipCinematicRequested:false,
});

function experienceProgress(state: GameState, xp: number) {
  const totalXp = Math.min(xpTotalForLevel(MAX_PLAYER_LEVEL),state.xp + xp);
  const level = levelForExperience(totalXp);
  const levelsGained = Math.max(0, level - state.level);
  const learningPointsGained=Math.max(0,skillBudget(level)-skillBudget(state.level));
  return {
    xp: totalXp,
    level,
    statPoints: state.statPoints + levelsGained * STAT_POINTS_PER_LEVEL,
    skillPoints: state.skillPoints + learningPointsGained,
    ...(levelsGained ? { toast: `Level ${level}! +${levelsGained * STAT_POINTS_PER_LEVEL} attribute points${learningPointsGained ? ` and +${learningPointsGained} learning point${learningPointsGained === 1 ? '' : 's'}` : ''}.` } : {}),
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...baseState(),
  discoverCreature:(enemyId,bossId,defeated=false)=>set(state=>{
    const journal=discoverCreature(state.journal,enemyId,bossId,defeated);
    return journal===state.journal?state:{journal};
  }),
  discoverRecord:(kind,id)=>set(state=>{
    const journal=discoverJournalEntry(state.journal,kind,id);return journal===state.journal?state:{journal};
  }),
  buyItem:(npcId,itemId)=>set(state=>{
    const dialogue=state.dialogue,npc=NPC_BY_ID[npcId];
    if(dialogue?.npcId!==npcId||!npc||state.cinematic||state.panel||dialogue.choices?.length
      ||dialogue.lineIndex<(dialogue.lines??npc.dialogue).length-1)return {};
    const offer=merchantStock(npcId).find(o=>o.id===itemId);
    if(!offer||state.gold<offer.price||state.level<offer.minLevel)return {toast:'You need more gold or experience for that purchase.'};
    if(WEAPON_BY_ID[itemId]){
      if(state.inventory.includes(itemId))return {toast:'That blade is already in your bag.'};
      return {gold:localPlayCheatsEnabled()?LOCAL_TEST_GOLD:state.gold-offer.price,inventory:[...state.inventory,itemId],journal:discoverJournalEntry(state.journal,'weapons',itemId),toast:`Purchased ${itemName(itemId)}. Equip it in your bag.`};
    }
    const id=itemId as PotionId;if(!POTIONS[id]||state.consumables[id]>=99)return {toast:'You cannot carry any more of that draught.'};
    return {gold:localPlayCheatsEnabled()?LOCAL_TEST_GOLD:state.gold-offer.price,consumables:{...state.consumables,[id]:state.consumables[id]+1},toast:`Purchased ${itemName(id)}.`};
  }),
  equipWeapon:id=>set(state=>state.panel==='inventory'&&!state.dialogue&&!state.cinematic&&!state.activeSkillStatus.casting&&state.inventory.includes(id)&&Object.hasOwn(WEAPON_BY_ID,id)
    ?{weaponId:id,toast:`Equipped ${WEAPON_BY_ID[id].name}.`}:{}),
  usePotion:id=>set(state=>{
    const p=POTIONS[id];if((state.panel!==null&&state.panel!=='inventory')||state.dialogue||state.cinematic||!p||state.hp<=0||state.activeSkillStatus.casting||state.consumables[id]<=0)return {};
    if((p.hp&&state.hp>=state.maxHp)||(p.stamina&&state.stamina>=state.maxStamina))return {toast:'No need to drink that yet.'};
    return {hp:Math.min(state.maxHp,state.hp+p.hp),stamina:Math.min(state.maxStamina,state.stamina+p.stamina),
      vitalRevision:state.vitalRevision+1,consumables:{...state.consumables,[id]:state.consumables[id]-1},toast:`Used ${p.name}.`};
  }),
  learnCombatArt:id=>set(state=>{
    const s=ACTIVE_SKILL_BY_ID[id];if(!s?.learnCost||state.panel!=='character'||state.level<s.minLevel||state.skillPoints<s.learnCost||state.learnedCombatArts.includes(id))return {};
    return {skillPoints:state.skillPoints-s.learnCost,learnedCombatArts:[...state.learnedCombatArts,id],toast:`Learned ${s.name}. Assign it to one of your four slots.`};
  }),
  setSkillSlot:(slot,id)=>set(state=>{
    if(state.panel!=='character'||state.activeSkillStatus.casting||!Number.isInteger(slot)||slot<0||slot>3)return {};
    if(id){const s=ACTIVE_SKILL_BY_ID[id];if(!s||state.level<s.minLevel||s.learnCost&&!state.learnedCombatArts.includes(id))return {};}
    const slots=state.skillSlots.map(value=>id&&value===id?null:value);slots[slot]=id;
    return {skillSlots:slots};
  }),
  setVitals: (hp, stamina) => set({ hp, stamina }),
  damagePlayer: (amount) => set((state) => ({ hp: Math.max(0, state.hp - amount) })),
  setWorldStatus: (worldX, worldY, regionId, townId) => set(state=>({ worldX, worldY, regionId, townId,journal:discoverJournalEntry(state.journal,'regions',regionId) })),
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
    if(!acceptUiAction())return {};
    return { travelRequest:townId,travelRequestSource:'shrine',panel:null };
  }),
  requestMapTravel:(townId) => set(state => {
    if (!['map','regional-map'].includes(state.panel??'') || state.dialogue || !Object.hasOwn(TOWN_BY_ID,townId)
      || !localSettlementTravelEnabled() && !state.unlockedTownShrines.includes(townId)) return {};
    if(!acceptUiAction())return {};
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
    const outcome=state.storyFlags['relief-household-charter']?'The old warrants have been cancelled. The palace is letting families stay there while we try to find their relatives.':state.storyFlags['relief-joint-council']?'The families are allowed into the hearings now. Nobody can move them away while we’re still looking for their relatives.':null;
    const localOutcome=['celia-brook','asha-stonevein','iren-copperwake'].includes(npcId)
      &&state.storyFlags['cibar-irrigation-repaired']?
      state.storyFlags['cibar-public-water']?'People know what happened to Celia’s brother now. The people he helped don’t have to give their names unless they want to.':'We’ve sent the evidence to Isabel. The families are keeping the survivors’ names private.':null;
    // News travels unevenly. The archive and watch know official reports;
    // every shopkeeper in Highmere should not recite the same announcement.
    const highmereOutcome=state.quests['crown-summons']?.status==='completed'
      &&['renna-vale','captain-yselle-ward','davin-bridge'].includes(npcId)?
      state.storyFlags['main-public-reports']?'We’ve sent warnings to the towns. I hope people take them seriously.':state.storyFlags['main-watch-reports']?'Isabel’s riders have been carrying letters to the other towns. I hope they get through safely.':'We’ve had some worrying reports from the other towns. I’m still trying to find out what’s true.':null;
    const reaction=reactiveStoryDialogue(npcId,state.quests,state.storyFlags);
    const lines=context?.objective.dialogue ?? (reaction??(highmereOutcome?[highmereOutcome,...npc.dialogue]:localOutcome?[localOutcome,...npc.dialogue]:outcome&&['mairin-reed','nella-harrow','maela-quill','renna-vale'].includes(npcId)?[outcome,...npc.dialogue]:npc.dialogue));
    set({quests,trackedQuestId,journal:discoverJournalEntry(state.journal,'characters',npcId),dialogue:{npcId,lineIndex:0,lines,...(context?{questId:context.questId,objectiveId:context.objective.id,choices:context.objective.choices}:{})}});
  },
  advanceDialogue: () => set((state) => state.dialogue&&acceptUiAction()
    &&state.dialogue.lineIndex<(state.dialogue.lines??NPC_BY_ID[state.dialogue.npcId]?.dialogue??[]).length-1
    ? { dialogue: { ...state.dialogue, lineIndex: state.dialogue.lineIndex + 1 } } : {}),
  endDialogue: () => {
    const dialogue=get().dialogue;
    if(!dialogue||!acceptUiAction())return;
    set({dialogue:null});
    // Opening/abandoning a conversation isn’t delivering evidence or hearing it.
    if(!dialogue||dialogue.choices?.length||!dialogue.questId
      ||dialogue.lineIndex<(dialogue.lines?.length??1)-1)return;
    const context=conversationObjective(dialogue.npcId,get().quests,dialogue.questId);
    if(context?.questId===dialogue.questId&&context.objective.id===dialogue.objectiveId
      &&['talk','deliver'].includes(context.objective.type))get().progressQuest(context.objective.type,dialogue.npcId,1,dialogue.questId);
  },
  chooseDialogue:(id)=>{
    const state=get(),dialogue=state.dialogue;
    if(!dialogue || dialogue.lineIndex<(dialogue.lines?.length??1)-1 || !dialogue.questId) return;
    const objective=QUEST_BY_ID[dialogue.questId]?.objectives.find(o=>o.id===dialogue.objectiveId);
    const choice=dialogue.choices?.find(c=>c.id===id);
    if(!objective||!choice||!acceptUiAction()) return;
    if(choice.correct===false){set({toast:choice.response,dialogue:{...dialogue,lineIndex:0,lines:[choice.response]}});return;}
    set({storyChoices:{...state.storyChoices,[dialogue.questId+':'+objective.id]:id},
      storyFlags:{...state.storyFlags,...(choice.flag?{[choice.flag]:true}:{})},
      dialogue:{npcId:dialogue.npcId,lineIndex:0,lines:[choice.response]}});
    get().progressQuest(objective.type,objective.targetId,1,dialogue.questId);
    get().showToast(choice.response);
  },
  trackQuest:(id)=>{if(get().quests[id]?.status==='active')set({trackedQuestId:id});},
  setStoryFlag:(id)=>set(state=>({storyFlags:{...state.storyFlags,[id]:true}})),
  requestCinematicSkip:()=>set({skipCinematicRequested:true}),
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
  progressQuest: (type, targetId, amount = 1,questId) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const state = get();
    const result = advanceQuests(state.quests, state.defeatedBosses, { type, targetId, amount,questId },state.storyFlags,state.worldContent);
    const scenes=sceneQueue(state.pendingCinematic,state.cinematicQueue,completedStoryScenes(state.quests,result.quests,state.storyFlags),state.storyFlags);
    const shrines=['elarion','starhold','redmesa','deepford','tidewatch','skallheim','blackspire'].filter(id=>(result.quests['eight-regions']?.objectiveProgress['report:'+id]??0)>=1);
    const rewards=earnedRewards(result.xp,result.gold,state.attributes,state.learnedSkills);
    const progression = experienceProgress(state, rewards.xp);
    const completed=Object.keys(result.quests).some(id=>state.quests[id]?.status!=='completed'&&result.quests[id].status==='completed');
    const rewardToast = rewards.xp || rewards.gold ? `${completed?'Quest complete':'Story milestone'} — +${rewards.xp} XP, +${rewards.gold} gold` : null;
    set({ quests: result.quests, gold: state.gold + rewards.gold, ...progression,
      trackedQuestId:state.trackedQuestId&&result.quests[state.trackedQuestId]?.status==='completed'?QUEST_BY_ID[state.trackedQuestId]?.nextQuestId??null:state.trackedQuestId,
      ...scenes,storyFlags:questConsequences(result.quests,state.storyFlags),unlockedTownShrines:[...new Set([...state.unlockedTownShrines,...shrines])],
      ...(rewardToast ? { toast: progression.toast ? `${rewardToast}. ${progression.toast}` : rewardToast } : {}),
    });
  },
  addRewards: (xp, gold) => set((state) => {
    if(!Number.isFinite(xp)||!Number.isFinite(gold)||xp<0||gold<0)return {};
    const rewards=earnedRewards(xp,gold,state.attributes,state.learnedSkills);
    return { ...experienceProgress(state, rewards.xp), gold: state.gold + rewards.gold };
  }),
  markBossDefeated: (bossId) => set((state) => state.defeatedBosses.includes(bossId) ? {} : { defeatedBosses: [...state.defeatedBosses, bossId] }),
  recordEnemyDefeat: (enemyId, xp, gold, bossId, worldContent, contentId, lootEligible=true) => set((state) => {
    const known=bossId&&state.defeatedBosses.includes(bossId);
    if(known){
      const id=`boss:${bossId}`,previous=state.worldContent.states[id],defeated=worldContent?.states[id];
      // Permanent quest history is not a repeat-battle reward token. A boss
      // must actually return alive in the content ledger, then transition to
      // defeated in the scene’s snapshot. Replaying a death notification (or
      // submitting the same defeated snapshot) cannot pay XP/gold again.
      if(!BOSS_BY_ID[bossId!]?.respawns||!previous||previous.defeated||!(typeof previous.hp==='number'&&previous.hp>0)
        ||!defeated?.defeated||defeated.hp!==0)return {};
    }
    const defeatedBosses = bossId&&!known ? [...state.defeatedBosses, bossId] : state.defeatedBosses;
    const result = advanceQuests(state.quests, defeatedBosses, { type: 'kill', targetId: enemyId, amount: 1,contentId },state.storyFlags,worldContent??state.worldContent);
    const rewards=earnedRewards(xp+result.xp,gold+result.gold,state.attributes,state.learnedSkills);
    const progression = experienceProgress(state, rewards.xp);
    const trophy=bossId?BOSS_WEAPONS[bossId]:undefined;
    const dropped=trophy&&Math.random()<bossWeaponDropChance(state.attributes)?trophy:undefined;
    const duplicate=dropped&&state.inventory.includes(dropped.id);
    const salvage=duplicate&&dropped?earnedRewards(0,dropped.salvage,state.attributes,state.learnedSkills).gold:0;
    // Ordinary enemies can occasionally drop a carried draught. No extra
    // potion rolls for temporary boss summons, wildlife or story-only fights.
    const supplyRoll=!bossId&&lootEligible&&canDropPotion(enemyId)
      &&Math.random()<supplyDropChance(state.attributes);
    const primaryPotion:PotionId=supplyRoll&&Math.random()>=.65?'stamina-potion':'healing-potion';
    const otherPotion:PotionId=primaryPotion==='healing-potion'?'stamina-potion':'healing-potion';
    const potion=supplyRoll?(state.consumables[primaryPotion]<99?primaryPotion:
      state.consumables[otherPotion]<99?otherPotion:null):null;
    let journal=discoverCreature(state.journal,enemyId,bossId,true);
    if(dropped)journal=discoverJournalEntry(journal,'weapons',dropped.id);
    return { defeatedBosses, journal, quests: result.quests, ...progression, gold: state.gold + rewards.gold,
      ...(dropped?{inventory:duplicate?state.inventory:[...state.inventory,dropped.id],
        gold:state.gold+rewards.gold+salvage,
        toast:duplicate?`Another ${itemName(dropped.id)} — salvaged for ${salvage} gold.`:`Rare spoil: ${itemName(dropped.id)}! Look in your bag.`}:{}),
      ...(potion?{consumables:{...state.consumables,[potion]:state.consumables[potion]+1},
        toast:`Found ${itemName(potion)}! Check your bag.`}:{}),
      ...sceneQueue(state.pendingCinematic,state.cinematicQueue,completedStoryScenes(state.quests,result.quests,state.storyFlags),state.storyFlags),storyFlags:questConsequences(result.quests,state.storyFlags),
      ...(worldContent ? { worldContent } : {}) };
  }),
  allocateAttribute: (attribute) => set((state) => {
    if (state.statPoints <= 0 || !Object.hasOwn(BASE_ATTRIBUTES,attribute) || state.attributes[attribute]>=ATTRIBUTE_CAP) return {};
    const attributes = { ...state.attributes, [attribute]: state.attributes[attribute] + 1 };
    const derived = progressionStats(attributes, state.learnedSkills);
    const addedHp=Math.max(0,derived.maxHp-state.maxHp);
    return { attributes, statPoints: state.statPoints - 1, maxHp: derived.maxHp, maxStamina: derived.maxStamina,
      ...(addedHp?{hp:Math.min(derived.maxHp,state.hp+addedHp),vitalRevision:state.vitalRevision+1}:{}),
      toast: `${attribute[0].toUpperCase()}${attribute.slice(1)} increased.` };
  }),
  unlockSkill: (skillId) => set((state) => {
    const skill = SKILLS.find(entry => entry.id === skillId);
    if (!skill || state.skillPoints < skill.cost || state.level < skill.minLevel || (skill.requires&&!state.learnedSkills.includes(skill.requires)) || state.learnedSkills.includes(skillId)) return {};
    const learnedSkills = [...state.learnedSkills, skillId];
    const derived = progressionStats(state.attributes, learnedSkills);
    const addedHp=Math.max(0,derived.maxHp-state.maxHp);
    return { learnedSkills, skillPoints: state.skillPoints - skill.cost, maxHp: derived.maxHp, maxStamina: derived.maxStamina,
      ...(addedHp?{hp:Math.min(derived.maxHp,state.hp+addedHp),vitalRevision:state.vitalRevision+1}:{}),
      toast: `Skill learned: ${skill.name}.` };
  }),
  setContentWorld: (worldContent) => set({ worldContent }),
  setNavigation: (navigation) => set({ navigation }),
  setActiveSkillStatus:(activeSkillStatus) => set({ activeSkillStatus }),
  setBossEncounter:(bossEncounter) => set({ bossEncounter }),
  hydrate: (partial) => set(state=>{
    const level=Math.min(MAX_PLAYER_LEVEL,partial.level??state.level);
    const xp=Math.min(xpTotalForLevel(MAX_PLAYER_LEVEL),partial.xp??state.xp);
    if(!localPlayCheatsEnabled())return {...partial,level,xp};
    const gained=Math.max(0,MAX_PLAYER_LEVEL-level);
    return {...partial,level:MAX_PLAYER_LEVEL,xp:xpTotalForLevel(MAX_PLAYER_LEVEL),
      statPoints:(partial.statPoints??state.statPoints)+gained*STAT_POINTS_PER_LEVEL,
      skillPoints:(partial.skillPoints??state.skillPoints)
        +Math.max(0,skillBudget(MAX_PLAYER_LEVEL)-skillBudget(level)),
      gold:LOCAL_TEST_GOLD,inventory:WEAPONS.map(w=>w.id)};
  }),
  resetGame: () => set(baseState()),
}));
