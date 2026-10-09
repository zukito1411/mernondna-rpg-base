import { useGameStore, type GameState } from '../store/gameStore';
import { BOSSES, ENEMY_BY_ID } from '../data/enemies';
import { QUESTS } from '../data/quests';
import { REGIONS } from '../data/regions';
import { TOWN_BY_ID } from '../data/towns';
import { WEAPON_BY_ID } from '../data/weapons';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../data/world';
import { advanceQuests } from '../game/systems/questProgress';
import { CONTENT_BY_ID, initialContentState } from '../data/content';
import { TOWN_SHRINES } from '../data/townShrines';
import { retiredBoundaryId } from '../data/settlementGeometry';
import type { ContentState, ContentWorldState, CreatureContentDefinition } from '../game/types';
import { BASE_ATTRIBUTES, SKILLS, levelForExperience, progressionStats, type PlayerAttributes, type SkillId } from '../data/progression';

// Retain the key used by existing installations, including after schema migrations.
export const SAVE_KEY = 'mernondna-save-v1';
export type SavedState = Pick<GameState, 'hp' | 'stamina' | 'level' | 'xp' | 'attributes' | 'statPoints' | 'skillPoints' | 'learnedSkills' | 'gold' | 'weaponId' | 'inventory' | 'worldX' | 'worldY' | 'regionId' | 'townId' | 'day' | 'minuteOfDay' | 'quests' | 'defeatedBosses' | 'worldContent' | 'unlockedTownShrines' | 'storyFlags' | 'storyChoices' | 'trackedQuestId'>;
export interface SaveData { version: 4; savedAt: string; state: SavedState }

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
  for (const [id, d] of Object.entries(value.spawns)) {
    if (!record(d) || d.kind !== 'creature' || d.id !== id || !/^spawn:\d+$/.test(id)
      || Number(id.slice(6)) >= value.nextSpawnSequence || typeof d.enemyId !== 'string'
      || !Object.hasOwn(ENEMY_BY_ID, d.enemyId) || ENEMY_BY_ID[d.enemyId].boss
      || !record(d.world) || !numberIn(d.world.x, 0, WORLD_WIDTH - 1) || !numberIn(d.world.y, 0, WORLD_HEIGHT - 1)
      || typeof d.eventSpawn !== 'boolean') return null;
    spawns[id] = { id, kind: 'creature', enemyId: d.enemyId, world: { x: d.world.x, y: d.world.y }, eventSpawn: d.eventSpawn };
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
      || (s.hp !== undefined && (definition.kind !== 'creature' || !numberIn(s.hp, 0, ENEMY_BY_ID[definition.enemyId].hp)))
      || (s.respawnAt!==undefined && (!numberIn(s.respawnAt)||!Number.isInteger(s.respawnAt)||s.defeated!==true
        ||definition.kind!=='creature'||!BOSSES.some(b=>b.id===definition.bossId&&b.respawns&&b.respawnDelayMs)))
      || (s.hp === 0 && s.defeated !== true)) return null;
    states[id] = { x: s.x, y: s.y,
      ...(typeof s.hp === 'number' ? { hp: s.hp } : {}), ...(typeof s.trust === 'number' ? { trust: s.trust } : {}),
      ...(typeof s.defeated === 'boolean' ? { defeated: s.defeated } : {}), ...(typeof s.used === 'boolean' ? { used: s.used } : {}),
      ...(typeof s.respawnAt==='number'?{respawnAt:s.respawnAt}:{}),
    };
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
  return migrated;
}

export function parseSave(raw: string): SaveData | null {
  try {
    const data = migrateSave(JSON.parse(raw));
    if (!record(data) || data.version !== 4 || !record(data.state)) return null;
    const s = data.state;
    const storyFlags=s.storyFlags??{},storyChoices=s.storyChoices??{};
    if(!record(storyFlags)||!Object.values(storyFlags).every(v=>typeof v==='boolean')
      ||!record(storyChoices)||!Object.values(storyChoices).every(v=>typeof v==='string'&&v.length<100)
      ||Object.keys(storyFlags).length>512||Object.keys(storyChoices).length>512) return null;
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
    if(quests['eight-regions']?.status==='completed'&&s.quests['crown-summons']===undefined){
      quests['crown-summons']={status:'completed',objectiveProgress:Object.fromEntries(QUESTS.find(q=>q.id==='crown-summons')!.objectives.map(o=>[o.id,o.amount]))};
      storyFlags['legacy:regional-finished']=true;
    }
    const state = s as unknown as SavedState;
    const worldContent = validateContent(s.worldContent);
    if (!worldContent) return null;
    const result = advanceQuests(quests, state.defeatedBosses,undefined,storyFlags as Record<string,boolean>);
    const xp = state.xp + result.xp;
    const levelsGained = Math.max(0, levelForExperience(xp) - levelForExperience(state.xp));
    return { version: 4, savedAt: typeof data.savedAt === 'string' ? data.savedAt : '', state: {
      ...state, worldContent, quests: result.quests, xp, gold: state.gold + result.gold,
      storyFlags:storyFlags as Record<string,boolean>,storyChoices:storyChoices as Record<string,string>,
      trackedQuestId:typeof s.trackedQuestId==='string'&&Object.hasOwn(quests,s.trackedQuestId)?s.trackedQuestId:null,
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
    const data: SaveData = { version: 4, savedAt: new Date().toISOString(), state: {
      hp: s.hp, stamina: s.stamina, level: s.level, xp: s.xp, attributes: s.attributes, statPoints: s.statPoints,
      skillPoints: s.skillPoints, learnedSkills: s.learnedSkills, gold: s.gold, weaponId: s.weaponId,
      inventory: s.inventory, worldX: s.worldX, worldY: s.worldY, regionId: s.regionId, townId: s.townId,
      day: s.day, minuteOfDay: s.minuteOfDay, quests: s.quests, defeatedBosses: s.defeatedBosses,
      worldContent: s.worldContent,
      unlockedTownShrines:s.unlockedTownShrines,
      storyFlags:s.storyFlags,storyChoices:s.storyChoices,trackedQuestId:s.trackedQuestId,
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
      weaponId: s.weaponId, inventory: s.inventory, worldX: s.worldX, worldY: s.worldY, regionId: s.regionId,
      townId: s.townId, day: s.day, minuteOfDay: s.minuteOfDay, quests: s.quests, defeatedBosses: s.defeatedBosses,
      worldContent: s.worldContent,unlockedTownShrines:s.unlockedTownShrines,
      storyFlags:s.storyFlags,storyChoices:s.storyChoices,trackedQuestId:s.trackedQuestId,
      pendingCinematic:s.storyFlags['legacy:regional-finished']?null:QUESTS.flatMap(q=>q.objectives)
        .find(o=>o.cinematicId&&!s.storyFlags['scene:'+o.cinematicId]&&QUESTS.some(q=>q.objectives.includes(o)&&(s.quests[q.id]?.objectiveProgress[o.id]??0)>=o.amount))?.cinematicId??null });
    return true;
  } catch { return false; }
}

export function watchProgressSaves() {
  return useGameStore.subscribe((s, previous) => {
    if (s.quests !== previous.quests || s.defeatedBosses !== previous.defeatedBosses
      || s.inventory !== previous.inventory || s.weaponId !== previous.weaponId
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
