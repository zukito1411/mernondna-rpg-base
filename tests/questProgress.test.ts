import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../src/store/gameStore';
import { QUESTS, QUEST_BY_ID } from '../src/data/quests';
import { nextObjective } from '../src/game/systems/storyProgress';
import { finishQuest, playObjective, questClock, reachObjective, readDialogue } from './questHarness';
import { allowExplicitNewGame, parseSave, SAVE_KEY, saveGame } from '../src/utils/save';
import { noteUiTransition } from '../src/utils/uiInputGuard';

beforeEach(() => { questClock(); useGameStore.getState().resetGame(); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('complete quest catalog', () => {
  it.each(QUESTS.map(q => [q.id]))('%s completes through its current stages and survives save/load', id => {
    finishQuest(id);
    const state = useGameStore.getState(), before = { xp: state.xp, gold: state.gold };
    const last = QUEST_BY_ID[id].objectives.at(-1)!;
    state.progressQuest(last.type, last.targetId, last.amount, id);
    expect(useGameStore.getState()).toMatchObject(before);
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value) });
    allowExplicitNewGame();
    expect(saveGame()).toBe(true);
    const parsed = parseSave(values.get(SAVE_KEY)!);
    expect(parsed?.state.quests[id].status).toBe('completed');
    expect(parsed?.state.gold).toBe(before.gold);
  });

  it('requires rescue, defense and a return conversation even if Varr was defeated early', () => {
    const store = useGameStore.getState();
    store.recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr');
    expect(nextObjective('first-road', useGameStore.getState().quests)?.id).toBe('talk-aldren');
    readDialogue('aldren-vale');
    expect(nextObjective('first-road', useGameStore.getState().quests)?.id).toBe('morning-inn');
    reachObjective('first-road', 'return-aldren');
    expect(useGameStore.getState().quests['first-road'].objectiveProgress['kill-varr']).toBe(1);
    expect(useGameStore.getState().quests['first-road'].status).toBe('active');
    readDialogue('aldren-vale');
    expect(useGameStore.getState().quests['first-road'].status).toBe('completed');
    const before = useGameStore.getState();
    store.recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr');
    expect(useGameStore.getState().xp).toBe(before.xp);
    expect(useGameStore.getState().gold).toBe(before.gold);
    expect(useGameStore.getState().quests['crown-summons'].status).toBe('active');
  });

  it('pays a genuinely respawned boss once without paying its quest again', () => {
    finishQuest('first-road');
    const store = useGameStore.getState(), before = { xp: store.xp, gold: store.gold };
    const returned = { states: { 'boss:captain-varr': { x: 100, y: 100, hp: 210, defeated: false } }, spawns: {}, nextSpawnSequence: 0 };
    const defeated = { ...returned, states: { 'boss:captain-varr': { x: 100, y: 100, hp: 0, defeated: true, respawnAt: Date.now() + 1200000 } } };
    store.setContentWorld(returned);
    vi.spyOn(Math, 'random').mockReturnValue(.9);
    store.recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr', defeated);
    store.recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr', defeated);
    expect(useGameStore.getState().xp).toBe(before.xp + 110);
    expect(useGameStore.getState().gold).toBe(before.gold + 30);
  });

  it('does not progress invalid, abandoned or repeated dialogue interactions', () => {
    const store = useGameStore.getState();
    store.startDialogue('missing');
    expect(useGameStore.getState().dialogue).toBeNull();
    store.startDialogue('aldren-vale'); store.startDialogue('aldren-vale'); store.endDialogue();
    expect(nextObjective('first-road', useGameStore.getState().quests)?.id).toBe('talk-aldren');
  });

  it.each(QUESTS.flatMap(q => q.objectives.flatMap(o => (o.choices ?? [])
    .filter(c => c.correct !== false).map(c => [q.id, o.id, c.id, c.flag] as const))))
  ('preserves the %s / %s / %s branch', (id, objectiveId, choice, flag) => {
    reachObjective(id, objectiveId);
    playObjective(id, nextObjective(id, useGameStore.getState().quests)!, choice);
    if (flag) expect(useGameStore.getState().storyFlags[flag]).toBe(true);
    expect(useGameStore.getState().storyChoices[id + ':' + objectiveId]).toBe(choice);
    finishQuest(id);
    if (flag === 'siblings-guarded-deed') {
      expect(useGameStore.getState().quests[id].objectiveProgress['hired-men']).toBe(1);
      expect(useGameStore.getState().storyFlags['encounter:false-inheritance:complete']).toBeUndefined();
    }
  });

  it('does not let one Halla conversation advance both the main story and her optional quest', () => {
    reachObjective('eight-regions', 'porter-names');
    reachObjective('soldier-return', 'waiting');
    playObjective('eight-regions', nextObjective('eight-regions', useGameStore.getState().quests)!);
    expect(nextObjective('soldier-return', useGameStore.getState().quests)?.id).toBe('waiting');
  });

  it('rejects rapid extra dialogue input without consuming the following interaction', () => {
    let now = performance.now() + 1000;
    vi.mocked(performance.now).mockImplementation(() => now);
    const store = useGameStore.getState();
    store.startDialogue('aldren-vale');
    noteUiTransition(); // The UI records modal ownership on opening.
    store.advanceDialogue(); // The gesture that opened the modal cannot read it too.
    expect(useGameStore.getState().dialogue?.lineIndex).toBe(0);
    now += 200;
    store.advanceDialogue(); store.advanceDialogue(); store.endDialogue();
    expect(useGameStore.getState().dialogue?.lineIndex).toBe(1);
    expect(nextObjective('first-road', useGameStore.getState().quests)?.id).toBe('talk-aldren');
    now += 200;
    store.advanceDialogue();
    expect(useGameStore.getState().dialogue?.lineIndex).toBe(2);
  });
});
