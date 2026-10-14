import { useGameStore, type GameState } from '../store/gameStore';
import { BOSSES, ENEMY_BY_ID,isWolfFamily } from '../data/enemies';
import { QUESTS } from '../data/quests';
import { REGIONS } from '../data/regions';
import { TOWN_BY_ID } from '../data/towns';
import { WEAPON_BY_ID } from '../data/weapons';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../data/world';
import { advanceQuests } from '../game/systems/questProgress';
import { CONTENT_BY_ID, initialContentState } from '../data/content';
import { TOWN_SHRINES } from '../data/townShrines';
import { retiredBoundaryId } from '../data/settlementGeometry';
import type { ContentState, ContentWorldState, CreatureContentDefinition, EncounterBehavior, EncounterRole } from '../game/types';
import { BASE_ATTRIBUTES, MAX_PLAYER_LEVEL, SKILLS, levelForExperience, xpTotalForLevel, xpNeededForLevel, progressionStats, type PlayerAttributes, type SkillId } from '../data/progression';
import {CINEMATICS} from '../data/cinematics';
import {questConsequences} from '../game/systems/storyScenes';
import {WorldGenerator} from '../game/systems/WorldGenerator';
import {onFlagshipDeck,flagshipWalkable} from '../data/pirateFlagship';
import {CAMPAIGN_REVISION_FLAG,INDOOR_STORY_FLAG,INDOOR_STORY_STAGES} from '../data/campaign';
import {ACTIVE_SKILL_BY_ID,DEFAULT_SKILL_SLOTS,type ActiveSkillId} from '../data/activeSkills';
import {POTIONS,type PotionId} from '../data/economy';

// Retain the key used by existing installations, including after schema migrations.
export const SAVE_KEY = 'mernondna-save-v1';
export type SavedState = Pick<GameState, 'hp' | 'stamina' | 'level' | 'xp' | 'attributes' | 'statPoints' | 'skillPoints' | 'learnedSkills' | 'gold' | 'weaponId' | 'inventory' | 'worldX' | 'worldY' | 'regionId' | 'townId' | 'day' | 'minuteOfDay' | 'quests' | 'defeatedBosses' | 'worldContent' | 'unlockedTownShrines' | 'storyFlags' | 'storyChoices' | 'trackedQuestId'> & Partial<Pick<GameState,'consumables'|'learnedCombatArts'|'skillSlots'>>;
export interface SaveData { version: 5; savedAt: string; state: SavedState & {cinematicQueue?:string[]} }

let syncSnapshot: (() => void) | undefined;
let saving = false;
let saveBlocked=false;
let recoveryNotice:string|null=null;
export function getSaveRecoveryNotice(){return recoveryNotice;}
export function allowExplicitNewGame(){saveBlocked=false;recoveryNotice=null;}
export function setSaveSnapshotProvider(provider?: () => void) { syncSnapshot = provider; }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function numberIn(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(v => typeof v === 'string');
}
function playerAttributes(value: unknown): value is PlayerAttributes {
  return record(value) && ['strength', 'vitality', 'agility'].every(id =>
    numberIn(value[id], 0, 10000) && Number.isInteger(value[id]));
}
function skillIds(value: unknown): value is SkillId[] {
  const allowed = SKILLS.map(skill => skill.id);
  return strings(value) && value.every(id => allowed.some(skillId => skillId === id)) && new Set(value).size === value.length;
}

function validateContent(value: unknown): ContentWorldState | null {
  if (!record(value) || !record(value.states) || !record(value.spawns)
    || !numberIn(value.nextSpawnSequence) || !Number.isInteger(value.nextSpawnSequence)) return null;
  const spawns: Record<string, CreatureContentDefinition> = {};
  const geography=new WorldGenerator();
  const slots = new Map<string, Set<number>>();
  const groupHomes = new Map<string, {x:number;y:number;radius:number}>();
  for (const [id, d] of Object.entries(value.spawns)) {
    if (!record(d) || d.kind !== 'creature' || d.id !== id || !/^spawn:\d+$/.test(id)
      || Number(id.slice(6)) >= value.nextSpawnSequence || typeof d.enemyId !== 'string'
      || !Object.hasOwn(ENEMY_BY_ID, d.enemyId) || ENEMY_BY_ID[d.enemyId].boss
      || !record(d.world) || !numberIn(d.world.x, 0, WORLD_WIDTH - 1) || !numberIn(d.world.y, 0, WORLD_HEIGHT - 1)
      || typeof d.eventSpawn !== 'boolean'
      || (d.encounterId !== undefined && (typeof d.encounterId !== 'string'
        || !/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,99}$/.test(d.encounterId)
        || (d.wolfPackId !== undefined && d.encounterId !== d.wolfPackId)))
      || (d.wolfPackId !== undefined && (!isWolfFamily(d.enemyId) || typeof d.wolfPackId !== 'string' || d.wolfPackId.length > 100))
      || (d.wolfAlpha !== undefined && (!isWolfFamily(d.enemyId) || typeof d.wolfAlpha !== 'boolean'))) return null;
    const behavior = d.encounterBehavior;
    let parsedBehavior: EncounterBehavior | undefined;
    if (behavior !== undefined) {
      if (!record(behavior) || !record(behavior.home) || !record(behavior.station) || (!d.encounterId && !d.wolfPackId)
        || !numberIn(behavior.home.x,0,WORLD_WIDTH-1) || !numberIn(behavior.home.y,0,WORLD_HEIGHT-1)
        || !numberIn(behavior.station.x,0,WORLD_WIDTH-1) || !numberIn(behavior.station.y,0,WORLD_HEIGHT-1)
        || !numberIn(behavior.leashRadius,256,1600) || !numberIn(behavior.slot,0,15) || !Number.isInteger(behavior.slot)
        || typeof behavior.role !== 'string' || !['leader','melee','flanker','ranged','heavy'].includes(behavior.role)
        || Math.hypot(behavior.station.x-behavior.home.x,behavior.station.y-behavior.home.y)>behavior.leashRadius*.4
        || d.wolfPackId && (behavior.role !== (d.wolfAlpha?'leader':'flanker') || (d.wolfAlpha ? behavior.slot!==0 : behavior.slot===0))) return null;
      const key=d.wolfPackId?`wolf:${d.wolfPackId}`:`encounter:${d.encounterId}`;
      const occupied=slots.get(key)??new Set<number>();
      if(occupied.has(behavior.slot))return null;
      occupied.add(behavior.slot);slots.set(key,occupied);
      const home=groupHomes.get(key);
      if(home&&(home.x!==behavior.home.x||home.y!==behavior.home.y||home.radius!==behavior.leashRadius))return null;
      groupHomes.set(key,{x:behavior.home.x,y:behavior.home.y,radius:behavior.leashRadius});
      parsedBehavior={home:{x:behavior.home.x,y:behavior.home.y},station:{x:behavior.station.x,y:behavior.station.y},
        leashRadius:behavior.leashRadius,role:behavior.role as EncounterRole,slot:behavior.slot};
    }
    // Convert legacy coastal bandits without new IDs or resetting damage/deaths.
    const pirate=d.enemyId==='road-bandit'&&geography.getRegionAt(d.world.x,d.world.y)==='portquill';
    const home=parsedBehavior?.home??{x:d.world.x,y:d.world.y};
    const frostWolf=d.enemyId==='gray-wolf'&&geography.getRegionAt(home.x,home.y)==='frostlands';
    spawns[id] = { id, kind: 'creature', enemyId: pirate?'cutlass-pirate':frostWolf?'frost-wolf':d.enemyId, world: { x: d.world.x, y: d.world.y }, eventSpawn: d.eventSpawn,
      ...(parsedBehavior?{encounterBehavior:parsedBehavior}:{}),
      ...(typeof d.encounterId === 'string'?{encounterId:d.encounterId}:{}),
      ...(typeof d.wolfPackId === 'string'?{wolfPackId:d.wolfPackId}:{}),
      ...(typeof d.wolfAlpha === 'boolean'?{wolfAlpha:d.wolfAlpha}:{}) };
  }
  const states: Record<string, ContentState> = {};
  for (const [id, s] of Object.entries(value.states)) {
    // Cosmetic perimeter walls/gates were retired. Keep all gameplay records.
    if (retiredBoundaryId(id)) continue;
    const definition = Object.hasOwn(CONTENT_BY_ID, id) ? CONTENT_BY_ID[id] : spawns[id];
    if(!definition&&(/^defense:[^:]+:(curtain|tower|entrance):/.test(id)||/^fort:highmere:(curtain|return|corner):/.test(id)))continue;
    // Cosmetic infill may be omitted/repositioned by a later layout. It must
    // not invalidate an otherwise valid player/quest/boss save.
    if(!definition&&(/^detail:/.test(id)||/^farm:[^:]+:/.test(id)||/^town:[^:]+:building:\d+$/.test(id)))continue;
    const decorativeFarm=/^farm:([^:]+):(fence|wheat):\d+$/.exec(id);
    if(!definition && decorativeFarm && Object.hasOwn(TOWN_BY_ID,decorativeFarm[1])) continue;
    if (!definition || !record(s) || !numberIn(s.x, 0, WORLD_WIDTH - 1) || !numberIn(s.y, 0, WORLD_HEIGHT - 1)
      || (s.defeated !== undefined && typeof s.defeated !== 'boolean') || (s.used !== undefined && typeof s.used !== 'boolean')
      || (s.trust !== undefined && !numberIn(s.trust, 0, 100))
      || (s.hp !== undefined && (definition.kind !== 'creature' || !numberIn(s.hp, 0, ENEMY_BY_ID[definition.enemyId].hp*8)))
      || (s.hpMax!==undefined&&(definition.kind!=='creature'||!numberIn(s.hpMax,1,ENEMY_BY_ID[definition.enemyId].hp*8)))
      || (s.respawnAt!==undefined && (!numberIn(s.respawnAt)||!Number.isInteger(s.respawnAt)||s.defeated!==true
        ||definition.kind!=='creature'||!definition.id.startsWith('pirate:flagship:crew:')&&!BOSSES.some(b=>b.id===definition.bossId&&b.respawns&&b.respawnDelayMs)))
      || (s.hp === 0 && s.defeated !== true)) return null;
    // Salt King moved from the inland/shore camps onto his flagship.
    // Repair legacy/off-deck positions only; retain valid deck movement, wounds,
    // defeat state and the exact existing respawn deadline.
    const relocatedSaltKing=definition.kind==='creature'&&definition.bossId==='salt-king'
      &&(!onFlagshipDeck(s.x,s.y)||!flagshipWalkable(s.x,s.y,24));
    const position=relocatedSaltKing?definition.world:{x:s.x,y:s.y};
    let summonWave:ContentState['summonWave'];
    if(s.summonWave!==undefined){
      const wave=s.summonWave;
      if(definition.kind!=='creature'||!definition.bossId||!ENEMY_BY_ID[definition.enemyId].summonComposition
        ||!record(wave)||typeof wave.encounterId!=='string'
        ||!wave.encounterId.startsWith(`boss-wave:${definition.bossId}:`)
        ||!/^boss-wave:[a-zA-Z0-9:_-]{1,90}$/.test(wave.encounterId)
        ||!strings(wave.members)||wave.members.length>512||new Set(wave.members).size!==wave.members.length
        ||!wave.members.every(member=>Object.hasOwn(spawns,member)&&spawns[member].eventSpawn===true)
        ||!numberIn(wave.nextAt)||!Number.isInteger(wave.nextAt)
        ||wave.members.length>0&&wave.nextAt!==0
        ||!wave.encounterId.endsWith(':legacy')&&wave.members.some(member=>spawns[member].encounterId!==wave.encounterId))return null;
      summonWave={encounterId:wave.encounterId,members:[...wave.members],nextAt:wave.nextAt};
    }
    states[id] = { x: position.x, y: position.y,
      ...(typeof s.hp === 'number' ? { hp: s.hp } : {}), ...(typeof s.trust === 'number' ? { trust: s.trust } : {}),
      ...(typeof s.hpMax==='number'?{hpMax:s.hpMax}:{}),
      ...(typeof s.defeated === 'boolean' ? { defeated: s.defeated } : {}), ...(typeof s.used === 'boolean' ? { used: s.used } : {}),
      ...(typeof s.respawnAt==='number'?{respawnAt:s.respawnAt}:{}),
      ...(summonWave?{summonWave}:{}),
    };
  }
  const owners=new Set<string>();
  for(const state of Object.values(states))for(const member of state.summonWave?.members??[]){
    if(owners.has(member))return null;
    owners.add(member);
  }
  return { states, spawns, nextSpawnSequence: value.nextSpawnSequence };
}

/** Upgrade older saves while preserving progress and the existing content ledger. */
export function migrateSave(data: unknown): unknown {
  let migrated = data;
  if (record(migrated) && migrated.version === 1 && record(migrated.state)) {
    const worldContent: ContentWorldState = { states: {}, spawns: {}, nextSpawnSequence: 0 };
    if (strings(migrated.state.defeatedBosses)) {
      for (const id of migrated.state.defeatedBosses) {
        const definition = CONTENT_BY_ID[`boss:${id}`];
        if (definition) worldContent.states[definition.id] = { ...initialContentState(definition), hp: 0, defeated: true };
      }
    }
    migrated = { ...migrated, version: 2, state: { ...migrated.state, worldContent } };
  }
  if (record(migrated) && migrated.version === 2 && record(migrated.state)) {
    const priorLevel = numberIn(migrated.state.level, 1) ? Math.floor(migrated.state.level) : 1;
    migrated = { ...migrated, version: 3, state: { ...migrated.state, attributes: { ...BASE_ATTRIBUTES },
      statPoints: Math.max(0, priorLevel - 1) * 3, skillPoints: Math.max(0, priorLevel - 1), learnedSkills: [] } };
  }
  if (record(migrated) && migrated.version === 3 && record(migrated.state)) {
    const world = migrated.state.worldContent;
    const states = record(world) && record(world.states) ? world.states : {};
    const unlockedTownShrines = TOWN_SHRINES.filter(shrine => {
      const state = states[shrine.contentId];
      return record(state) && state.used === true;
    }).map(shrine => shrine.townId);
    migrated = { ...migrated,version:4,state:{ ...migrated.state,unlockedTownShrines } };
  }
  if(record(migrated)&&migrated.version===4&&record(migrated.state)){
    const old=migrated.state;
    const level=typeof old.level==='number'&&Number.isFinite(old.level)?Math.max(1,Math.floor(old.level)):1;
    const rawXp=typeof old.xp==='number'&&Number.isFinite(old.xp)?old.xp:0;
    const oldInto=Math.max(0,rawXp-(level-1)*250);
    // Preserve current level and the percentage of its old experience bar.
    const xp=xpTotalForLevel(level)+Math.round(Math.min(1,oldInto/250)*xpNeededForLevel(level));
    const content=old.worldContent;
    const states:Record<string,unknown>=record(content)&&record(content.states)?{...content.states}:{};
    for(const boss of BOSSES){
      const id='boss:'+boss.id;
      const previous=states[id];
      if((Array.isArray(old.defeatedBosses)&&old.defeatedBosses.includes(boss.id))||
        (record(previous)&&previous.defeated===true)){
        const def=CONTENT_BY_ID[id];
        if(def){const base=record(previous)?previous:initialContentState(def);
          states[id]={...base,hp:0,defeated:true,respawnAt:typeof base.respawnAt==='number'?Math.min(base.respawnAt,Date.now()+20*60*1000):
            (Number.isFinite(Date.parse(String(migrated.savedAt)))?Date.parse(String(migrated.savedAt)):Date.now())+20*60*1000};
        }
      }
    }
    migrated={...migrated,version:5,state:{...old,xp,
      worldContent:record(content)?{...content,states}:content}};
  }
  return migrated;
}

export function parseSave(raw: string): SaveData | null {
  try {
    const data = migrateSave(JSON.parse(raw));
    if (!record(data) || data.version !== 5 || !record(data.state)) return null;
    const s = data.state;
    if(s.cinematicQueue!==undefined&&(!strings(s.cinematicQueue)||s.cinematicQueue.length>64))return null;
    const savedFlags=s.storyFlags??{},storyChoices=s.storyChoices??{};
    if(!record(savedFlags)||!Object.values(savedFlags).every(v=>typeof v==='boolean')
      ||!record(storyChoices)||!Object.values(storyChoices).every(v=>typeof v==='string'&&v.length<100)
      ||Object.keys(savedFlags).length>512||Object.keys(storyChoices).length>512) return null;
    const storyFlags={...savedFlags} as Record<string,boolean>;
    const legacyCampaign=!storyFlags[CAMPAIGN_REVISION_FLAG];
    if (!strings(s.unlockedTownShrines) || new Set(s.unlockedTownShrines).size !== s.unlockedTownShrines.length
      || !s.unlockedTownShrines.every(id => Object.hasOwn(TOWN_BY_ID,id))) return null;
    if (!playerAttributes(s.attributes) || !numberIn(s.statPoints, 0, 10000) || !Number.isInteger(s.statPoints)
      || !numberIn(s.skillPoints, 0, 10000) || !Number.isInteger(s.skillPoints) || !skillIds(s.learnedSkills)) return null;
    const derived = progressionStats(s.attributes, s.learnedSkills);
    if (!numberIn(s.hp, 1, derived.maxHp) || !numberIn(s.stamina, 0, derived.maxStamina) || !numberIn(s.xp) || !numberIn(s.gold)
      || !numberIn(s.level, 1) || !Number.isInteger(s.level)
      || !numberIn(s.worldX, 0, WORLD_WIDTH - 1) || !numberIn(s.worldY, 0, WORLD_HEIGHT - 1)
      || !numberIn(s.day, 1) || !numberIn(s.minuteOfDay, 0, 1439.999999)
      || typeof s.weaponId !== 'string' || !Object.hasOwn(WEAPON_BY_ID, s.weaponId)
      || !strings(s.inventory) || !s.inventory.every(id => Object.hasOwn(WEAPON_BY_ID, id)) || !s.inventory.includes(s.weaponId)
      || !strings(s.defeatedBosses) || !s.defeatedBosses.every(id => BOSSES.some(b => b.id === id))
      || (!REGIONS.some(r => r.id === s.regionId) && s.regionId !== 'dead-sea')
      || (s.townId !== null && (typeof s.townId !== 'string' || !Object.hasOwn(TOWN_BY_ID, s.townId)))
      || !record(s.quests)) return null;
    const quests: GameState['quests'] = {};
    for (const definition of QUESTS) {
      const quest = s.quests[definition.id];
      if (quest === undefined && definition.id !== 'first-road') {
        quests[definition.id] = { status: 'locked', objectiveProgress: {} };
        continue;
      }
      if (!record(quest) || typeof quest.status !== 'string' || !['active', 'locked', 'completed'].includes(quest.status) || !record(quest.objectiveProgress)) return null;
      const progress = {...quest.objectiveProgress};
      if(!storyFlags[INDOOR_STORY_FLAG]){
        const frontier=quest.status==='completed'?definition.objectives.length-1:
          definition.objectives.reduce((last,o,i)=>progress[o.id]===o.amount?i:last,-1);
        for(const id of INDOOR_STORY_STAGES[definition.id]??[]){
          const i=definition.objectives.findIndex(o=>o.id===id);
          if(i>=0&&i<=frontier&&progress[id]===undefined)progress[id]=definition.objectives[i].amount;
        }
      }
      if(legacyCampaign){
        const required:Record<string,string[]>={
          'first-road':['talk-aldren','kill-varr','return-aldren'],
          'crown-summons':['old-charter','capital','report','customs','households','witness','guard-report','audience','mandate'],
          'eight-regions':['moonlit-warden','stonejaw','iron-tusk','rootfather','salt-king','frost-wyrm','ashen-seer','return-aldren-after-regions'],
          'returning-ember':['vexa-warning','survey-ward','repel-varkhul','dain-report','vexa-resolution'],
        };
        const legacyStages=required[definition.id];
        if(quest.status==='completed'&&legacyStages&&!legacyStages.every(id=>progress[id]===1))return null;
        // Grandfather additions only behind the player's saved frontier. Never
        // reset rewards, invent choices, or skip newly introduced future work.
        const frontier=quest.status==='completed'?definition.objectives.length-1:
          definition.objectives.reduce((last,o,i)=>progress[o.id]===o.amount?i:last,-1);
        for(let i=0;i<=frontier;i++){
          const objective=definition.objectives[i];
          if(legacyStages&&progress[objective.id]===undefined)progress[objective.id]=objective.amount;
          if(progress[objective.id]===objective.amount&&objective.cinematicId)storyFlags['scene:'+objective.cinematicId]=true;
        }
      }
      if(definition.id==='eight-regions'&&quest.status==='active'&&s.quests['crown-summons']===undefined){
        const oldBossObjectives=definition.objectives.filter(o=>o.bossId);
        const towns=['elarion','starhold','redmesa','deepford','tidewatch','skallheim','blackspire'];
        oldBossObjectives.forEach((objective,i)=>{if(progress[objective.id]===1){
          for(const prefix of ['brief:','evidence:','report:'])progress[prefix+towns[i]]=1;
        }});
      }
      if(definition.id==='eight-regions'&&quest.status==='completed'){
        const legacy=['moonlit-warden','stonejaw','iron-tusk','rootfather','salt-king','frost-wyrm','ashen-seer','return-aldren-after-regions'];
        if(legacy.every(id=>progress[id]===1)&&definition.objectives.some(o=>progress[o.id]===undefined)){
          for(const objective of definition.objectives)if(!legacy.includes(objective.id))progress[objective.id]=objective.amount;
          storyFlags['legacy:regional-finished']=true;
        }
      }
      const objectiveProgress: Record<string, number> = {};
      for (const objective of definition.objectives) {
        const value = progress[objective.id];
        if (value !== undefined && !numberIn(value, 0, objective.amount)) return null;
        if (typeof value === 'number') objectiveProgress[objective.id] = value;
      }
      if (quest.status === 'completed' && !definition.objectives.every(o => (Number(progress[o.id]) || 0) >= o.amount)) return null;
      quests[definition.id] = { status: quest.status as 'locked' | 'active' | 'completed', objectiveProgress };
    }
    if(['active','completed'].includes(quests['eight-regions']?.status??'')&&s.quests['crown-summons']===undefined){
      quests['crown-summons']={status:'completed',objectiveProgress:Object.fromEntries(QUESTS.find(q=>q.id==='crown-summons')!.objectives.map(o=>[o.id,o.amount]))};
      if(quests['eight-regions'].status==='completed')storyFlags['legacy:regional-finished']=true;
      for(const objective of QUESTS.find(q=>q.id==='crown-summons')!.objectives)
        if(objective.cinematicId)storyFlags['scene:'+objective.cinematicId]=true;
    }
    const state = s as unknown as SavedState;
    // Additive equipment schema: old installations keep their four original
    // arts and receive no repeat free items when these fields are absent.
    const consumables=s.consumables===undefined?{'healing-potion':0,'stamina-potion':0}:s.consumables;
    if(!record(consumables)||!Object.keys(POTIONS).every(id=>numberIn(consumables[id],0,99)&&Number.isInteger(consumables[id])))return null;
    const learnedCombatArts=s.learnedCombatArts??[];
    if(!strings(learnedCombatArts)||new Set(learnedCombatArts).size!==learnedCombatArts.length
      ||!learnedCombatArts.every(id=>Object.hasOwn(ACTIVE_SKILL_BY_ID,id)&&Boolean(ACTIVE_SKILL_BY_ID[id as ActiveSkillId].learnCost)))return null;
    const skillSlots=s.skillSlots===undefined?[...DEFAULT_SKILL_SLOTS]:s.skillSlots;
    if(!Array.isArray(skillSlots)||skillSlots.length!==4||!skillSlots.every(id=>id===null||typeof id==='string'&&Object.hasOwn(ACTIVE_SKILL_BY_ID,id)
      &&(!ACTIVE_SKILL_BY_ID[id as ActiveSkillId].learnCost||learnedCombatArts.includes(id)))
      ||new Set(skillSlots.filter(Boolean)).size!==skillSlots.filter(Boolean).length)return null;
    const worldContent = validateContent(s.worldContent);
    if (!worldContent) return null;
    storyFlags[CAMPAIGN_REVISION_FLAG]=true;
    storyFlags[INDOOR_STORY_FLAG]=true;
    // Existing progressed players don't get a new-game prologue on resume.
    if(legacyCampaign)storyFlags['scene:roadborn-opening']=true;
    const result = advanceQuests(quests, state.defeatedBosses,undefined,storyFlags,worldContent);
    const xp = Math.min(xpTotalForLevel(MAX_PLAYER_LEVEL),state.xp + result.xp);
    const levelsGained = Math.max(0, levelForExperience(xp) - levelForExperience(state.xp));
    return { version: 5, savedAt: typeof data.savedAt === 'string' ? data.savedAt : '', state: {
      ...state,consumables:consumables as Record<PotionId,number>,learnedCombatArts:learnedCombatArts as ActiveSkillId[],skillSlots:skillSlots as (ActiveSkillId|null)[], worldContent, quests: result.quests, xp, gold: state.gold + result.gold,
      storyFlags:questConsequences(result.quests,storyFlags as Record<string,boolean>),storyChoices:storyChoices as Record<string,string>,
      cinematicQueue:strings(s.cinematicQueue)?[...new Set(s.cinematicQueue)].filter(id=>Object.hasOwn(CINEMATICS,id)&&!storyFlags['scene:'+id]):[],
      trackedQuestId:typeof s.trackedQuestId==='string'&&result.quests[s.trackedQuestId]?.status==='active'?s.trackedQuestId:
        QUESTS.find(q=>q.kind==='main'&&result.quests[q.id]?.status==='active')?.id??null,
      level: levelForExperience(xp), statPoints: state.statPoints + levelsGained * 3,
      skillPoints: state.skillPoints + levelsGained,
    } };
  } catch { return null; }
}

export function hasSavedGame(): boolean {
  try {
    const current = localStorage.getItem(SAVE_KEY);
    const previous = localStorage.getItem(SAVE_KEY + ':last-good');
    return Boolean((current && parseSave(current)) || (previous && parseSave(previous)));
  } catch {
    return false;
  }
}

export function hasStoredSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null || localStorage.getItem(SAVE_KEY + ':last-good') !== null;
  } catch {
    return false;
  }
}

export function saveGame(): boolean {
  if (saving||saveBlocked) return false;
  saving = true;
  try {
    syncSnapshot?.();
    const s = useGameStore.getState();
    const data: SaveData = { version: 5, savedAt: new Date().toISOString(), state: {
      hp: s.hp, stamina: s.stamina, level: s.level, xp: s.xp, attributes: s.attributes, statPoints: s.statPoints,
      skillPoints: s.skillPoints, learnedSkills: s.learnedSkills, gold: s.gold, weaponId: s.weaponId,
      inventory: s.inventory, worldX: s.worldX, worldY: s.worldY, regionId: s.regionId, townId: s.townId,
      consumables:s.consumables,learnedCombatArts:s.learnedCombatArts,skillSlots:s.skillSlots,
      day: s.day, minuteOfDay: s.minuteOfDay, quests: s.quests, defeatedBosses: s.defeatedBosses,
      worldContent: s.worldContent,
      unlockedTownShrines:s.unlockedTownShrines,
      storyFlags:s.storyFlags,storyChoices:s.storyChoices,trackedQuestId:s.trackedQuestId,
      cinematicQueue:[...(s.cinematic?[s.cinematic.id]:s.pendingCinematic?[s.pendingCinematic]:[]),...s.cinematicQueue],
    } };
    const prior=localStorage.getItem(SAVE_KEY);
    if(prior&&parseSave(prior))try{localStorage.setItem(SAVE_KEY+':last-good',prior);}catch{/* Keep saving available if the optional backup quota is full. */}
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; } finally { saving = false; }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    let data = raw ? parseSave(raw) : null;
    if(raw&&!data){
      try{localStorage.setItem(SAVE_KEY+':unreadable-backup',raw);}catch{saveBlocked=true;}
      const previous=localStorage.getItem(SAVE_KEY+':last-good');data=previous?parseSave(previous):null;
      if(!data){saveBlocked=true;recoveryNotice='Your save could not be restored. It is preserved; automatic saving is blocked until you explicitly start a new game.';useGameStore.getState().showToast(recoveryNotice);return false;}
      recoveryNotice=saveBlocked?'Recovered a valid previous save, but storage could not preserve the unreadable file separately. Automatic saving remains blocked.':'Recovered the previous valid save. The unreadable save was preserved separately.';
      useGameStore.getState().showToast(recoveryNotice);
    }
    if (!data) return false;
    // Explicit selection prevents a save replacing store actions or transient UI state.
    const s = data.state;
    const derived = progressionStats(s.attributes, s.learnedSkills);
    useGameStore.getState().hydrate({ hp: s.hp, maxHp: derived.maxHp, stamina: s.stamina, maxStamina: derived.maxStamina,
      level: s.level, xp: s.xp, attributes: s.attributes, statPoints: s.statPoints, skillPoints: s.skillPoints,
      learnedSkills: s.learnedSkills, gold: s.gold,
      consumables:s.consumables??{'healing-potion':0,'stamina-potion':0},learnedCombatArts:s.learnedCombatArts??[],skillSlots:s.skillSlots??[...DEFAULT_SKILL_SLOTS],vitalRevision:0,
      weaponId: s.weaponId, inventory: s.inventory, worldX: s.worldX, worldY: s.worldY, regionId: s.regionId,
      townId: s.townId, day: s.day, minuteOfDay: s.minuteOfDay, quests: s.quests, defeatedBosses: s.defeatedBosses,
      worldContent: s.worldContent,unlockedTownShrines:s.unlockedTownShrines,
      storyFlags:s.storyFlags,storyChoices:s.storyChoices,trackedQuestId:s.trackedQuestId,
      pendingCinematic:s.cinematicQueue?.[0]??null,cinematicQueue:s.cinematicQueue?.slice(1)??[] });
    return true;
  } catch { return false; }
}

export function watchProgressSaves() {
  return useGameStore.subscribe((s, previous) => {
    if (s.quests !== previous.quests || s.defeatedBosses !== previous.defeatedBosses
      || s.inventory !== previous.inventory || s.weaponId !== previous.weaponId
      || s.consumables!==previous.consumables || s.learnedCombatArts!==previous.learnedCombatArts || s.skillSlots!==previous.skillSlots
      || s.xp !== previous.xp || s.gold !== previous.gold || s.attributes !== previous.attributes
      || s.statPoints !== previous.statPoints || s.skillPoints !== previous.skillPoints
      || s.learnedSkills !== previous.learnedSkills || s.worldContent !== previous.worldContent
      || s.unlockedTownShrines !== previous.unlockedTownShrines || s.storyFlags!==previous.storyFlags
      || s.storyChoices!==previous.storyChoices || s.trackedQuestId!==previous.trackedQuestId) saveGame();
  });
}

export function clearSave(): boolean {
  try { localStorage.removeItem(SAVE_KEY);saveBlocked=false; return true; } catch { return false; }
}

// LEIGHNERON_WOLF_PACKS_ROAD_BANDITS_V1
