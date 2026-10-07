import { useGameStore, type GameState } from '../store/gameStore';
import { BOSSES, ENEMY_BY_ID } from '../data/enemies';
import { QUESTS } from '../data/quests';
import { REGIONS } from '../data/regions';
import { TOWN_BY_ID } from '../data/towns';
import { WEAPON_BY_ID } from '../data/weapons';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../data/world';
import { advanceQuests } from '../game/systems/questProgress';
import { CONTENT_BY_ID, initialContentState } from '../data/content';
import type { ContentState, ContentWorldState, CreatureContentDefinition } from '../game/types';

// Retain the key used by existing installations, including after schema migrations.
export const SAVE_KEY = 'mernondna-save-v1';
export type SavedState = Pick<GameState, 'hp' | 'stamina' | 'level' | 'xp' | 'gold' | 'weaponId' | 'inventory' | 'worldX' | 'worldY' | 'regionId' | 'townId' | 'day' | 'minuteOfDay' | 'quests' | 'defeatedBosses' | 'worldContent'>;
export interface SaveData { version: 2; savedAt: string; state: SavedState }

let syncSnapshot: (() => void) | undefined;
let saving = false;
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
    const definition = Object.hasOwn(CONTENT_BY_ID, id) ? CONTENT_BY_ID[id] : spawns[id];
    if (!definition || !record(s) || !numberIn(s.x, 0, WORLD_WIDTH - 1) || !numberIn(s.y, 0, WORLD_HEIGHT - 1)
      || (s.defeated !== undefined && typeof s.defeated !== 'boolean') || (s.used !== undefined && typeof s.used !== 'boolean')
      || (s.trust !== undefined && !numberIn(s.trust, 0, 100))
      || (s.hp !== undefined && (definition.kind !== 'creature' || !numberIn(s.hp, 0, ENEMY_BY_ID[definition.enemyId].hp)))
      || (s.hp === 0 && s.defeated !== true)) return null;
    states[id] = { x: s.x, y: s.y,
      ...(typeof s.hp === 'number' ? { hp: s.hp } : {}), ...(typeof s.trust === 'number' ? { trust: s.trust } : {}),
      ...(typeof s.defeated === 'boolean' ? { defeated: s.defeated } : {}), ...(typeof s.used === 'boolean' ? { used: s.used } : {}),
    };
  }
  return { states, spawns, nextSpawnSequence: value.nextSpawnSequence };
}

/** v1 -> v2: add the content ledger; preserve every old player/quest/boss field. */
export function migrateSave(data: unknown): unknown {
  if (!record(data) || data.version !== 1 || !record(data.state)) return data;
  const worldContent: ContentWorldState = { states: {}, spawns: {}, nextSpawnSequence: 0 };
  if (strings(data.state.defeatedBosses)) {
    for (const id of data.state.defeatedBosses) {
      const definition = CONTENT_BY_ID[`boss:${id}`];
      if (definition) worldContent.states[definition.id] = { ...initialContentState(definition), hp: 0, defeated: true };
    }
  }
  return { ...data, version: 2, state: { ...data.state, worldContent } };
}

export function parseSave(raw: string): SaveData | null {
  try {
    const data = migrateSave(JSON.parse(raw));
    if (!record(data) || data.version !== 2 || !record(data.state)) return null;
    const s = data.state;
    if (!numberIn(s.hp, 1, 100) || !numberIn(s.stamina, 0, 100) || !numberIn(s.xp) || !numberIn(s.gold)
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
      if (!record(quest) || typeof quest.status !== 'string' || !['active', 'locked', 'completed'].includes(quest.status) || !record(quest.objectiveProgress)) return null;
      const progress = quest.objectiveProgress;
      const objectiveProgress: Record<string, number> = {};
      for (const objective of definition.objectives) {
        const value = progress[objective.id];
        if (value !== undefined && !numberIn(value, 0, objective.amount)) return null;
        if (typeof value === 'number') objectiveProgress[objective.id] = value;
      }
      if (quest.status === 'completed' && !definition.objectives.every(o => (Number(progress[o.id]) || 0) >= o.amount)) return null;
      quests[definition.id] = { status: quest.status as 'locked' | 'active' | 'completed', objectiveProgress };
    }
    const state = s as unknown as SavedState;
    const worldContent = validateContent(s.worldContent);
    if (!worldContent) return null;
    const result = advanceQuests(quests, state.defeatedBosses);
    return { version: 2, savedAt: typeof data.savedAt === 'string' ? data.savedAt : '', state: {
      ...state, worldContent, quests: result.quests, xp: state.xp + result.xp, gold: state.gold + result.gold,
      level: 1 + Math.floor((state.xp + result.xp) / 250),
    } };
  } catch { return null; }
}

export function saveGame(): boolean {
  if (saving) return false;
  saving = true;
  try {
    syncSnapshot?.();
    const s = useGameStore.getState();
    const data: SaveData = { version: 2, savedAt: new Date().toISOString(), state: {
      hp: s.hp, stamina: s.stamina, level: s.level, xp: s.xp, gold: s.gold, weaponId: s.weaponId,
      inventory: s.inventory, worldX: s.worldX, worldY: s.worldY, regionId: s.regionId, townId: s.townId,
      day: s.day, minuteOfDay: s.minuteOfDay, quests: s.quests, defeatedBosses: s.defeatedBosses,
      worldContent: s.worldContent,
    } };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; } finally { saving = false; }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const data = raw ? parseSave(raw) : null;
    if (!data) return false;
    // Explicit selection prevents a save replacing store actions or transient UI state.
    const s = data.state;
    useGameStore.getState().hydrate({ hp: s.hp, stamina: s.stamina, level: s.level, xp: s.xp, gold: s.gold,
      weaponId: s.weaponId, inventory: s.inventory, worldX: s.worldX, worldY: s.worldY, regionId: s.regionId,
      townId: s.townId, day: s.day, minuteOfDay: s.minuteOfDay, quests: s.quests, defeatedBosses: s.defeatedBosses, worldContent: s.worldContent });
    return true;
  } catch { return false; }
}

export function watchProgressSaves() {
  return useGameStore.subscribe((s, previous) => {
    if (s.quests !== previous.quests || s.defeatedBosses !== previous.defeatedBosses
      || s.inventory !== previous.inventory || s.weaponId !== previous.weaponId
      || s.xp !== previous.xp || s.gold !== previous.gold || s.worldContent !== previous.worldContent) saveGame();
  });
}

export function clearSave(): boolean {
  try { localStorage.removeItem(SAVE_KEY); return true; } catch { return false; }
}
