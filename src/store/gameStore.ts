import { create } from 'zustand';
import type { ContentWorldState, NavigationState, QuestRuntimeState, RegionId } from '../game/types';
import { LEIGNERON } from '../data/player';
import { NPC_BY_ID } from '../data/npcs';
import { advanceQuests } from '../game/systems/questProgress';
import { BASE_ATTRIBUTES, levelForExperience, progressionStats, SKILLS, type AttributeId, type PlayerAttributes, type SkillId } from '../data/progression';

type Panel = 'map' | 'inventory' | 'character' | 'pause' | null;

export interface DialogueState {
  npcId: string;
  lineIndex: number;
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
  panel: Panel;
  dialogue: DialogueState | null;
  toast: string | null;
  quests: Record<string, QuestRuntimeState>;
  defeatedBosses: string[];
  worldContent: ContentWorldState;
  navigation: NavigationState;
  setVitals: (hp: number, stamina: number) => void;
  damagePlayer: (amount: number) => void;
  setWorldStatus: (worldX: number, worldY: number, regionId: RegionId, townId: string | null) => void;
  setClock: (day: number, minuteOfDay: number) => void;
  openPanel: (panel: Exclude<Panel, null>) => void;
  closePanel: () => void;
  startDialogue: (npcId: string) => void;
  advanceDialogue: () => void;
  endDialogue: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  progressQuest: (type: 'talk' | 'kill' | 'visit' | 'collect', targetId: string, amount?: number) => void;
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

const initialQuestState = (): Record<string, QuestRuntimeState> => ({
  'first-road': {
    status: 'active',
    objectiveProgress: {},
  },
});

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
  panel: null as Panel,
  dialogue: null as DialogueState | null,
  toast: 'Welcome to Mernodna.',
  quests: initialQuestState(),
  defeatedBosses: [] as string[],
  worldContent: { states: {}, spawns: {}, nextSpawnSequence: 0 } as ContentWorldState,
  navigation: { heading: Math.PI, target: null, markers: [], interaction: null } as NavigationState,
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
  openPanel: (panel) => set({ panel }),
  closePanel: () => set({ panel: null }),
  startDialogue: (npcId) => {
    if (!NPC_BY_ID[npcId] || get().panel || get().dialogue) return;
    set({ dialogue: { npcId, lineIndex: 0 } });
    get().progressQuest('talk', npcId, 1);
  },
  advanceDialogue: () => set((state) => state.dialogue ? { dialogue: { ...state.dialogue, lineIndex: state.dialogue.lineIndex + 1 } } : {}),
  endDialogue: () => set({ dialogue: null }),
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
  progressQuest: (type, targetId, amount = 1) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const state = get();
    const result = advanceQuests(state.quests, state.defeatedBosses, { type, targetId, amount });
    const progression = experienceProgress(state, result.xp);
    const rewardToast = result.xp || result.gold ? `Quest complete — +${result.xp} XP, +${result.gold} gold` : null;
    set({ quests: result.quests, gold: state.gold + result.gold, ...progression,
      ...(rewardToast ? { toast: progression.toast ? `${rewardToast}. ${progression.toast}` : rewardToast } : {}),
    });
  },
  addRewards: (xp, gold) => set((state) => {
    return { ...experienceProgress(state, xp), gold: state.gold + gold };
  }),
  markBossDefeated: (bossId) => set((state) => state.defeatedBosses.includes(bossId) ? {} : { defeatedBosses: [...state.defeatedBosses, bossId] }),
  recordEnemyDefeat: (enemyId, xp, gold, bossId, worldContent) => set((state) => {
    if (bossId && state.defeatedBosses.includes(bossId)) return {};
    const defeatedBosses = bossId ? [...state.defeatedBosses, bossId] : state.defeatedBosses;
    const result = advanceQuests(state.quests, defeatedBosses, { type: 'kill', targetId: enemyId, amount: 1 });
    const progression = experienceProgress(state, xp + result.xp);
    return { defeatedBosses, quests: result.quests, ...progression, gold: state.gold + gold + result.gold,
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
  hydrate: (partial) => set(partial),
  resetGame: () => set(baseState()),
}));
