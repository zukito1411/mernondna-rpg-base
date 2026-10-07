import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../src/store/gameStore';

beforeEach(() => useGameStore.getState().resetGame());
describe('The Broken Road', () => {
  it('requires the return conversation and rewards exactly once', () => {
    const s = useGameStore.getState();
    s.startDialogue('aldren-vale'); s.endDialogue();
    s.recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr');
    expect(useGameStore.getState().quests['first-road'].status).toBe('active');
    s.startDialogue('aldren-vale'); s.endDialogue();
    expect(useGameStore.getState().quests['first-road'].status).toBe('completed');
    expect(useGameStore.getState().xp).toBe(260);
    expect(useGameStore.getState().gold).toBe(108);
    s.startDialogue('aldren-vale'); s.endDialogue();
    s.recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr');
    expect(useGameStore.getState().xp).toBe(260);
  });
  it('remembers Varr killed before the first Aldren conversation', () => {
    const s = useGameStore.getState();
    s.recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr');
    s.startDialogue('aldren-vale'); s.endDialogue();
    expect(useGameStore.getState().quests['first-road'].objectiveProgress['kill-varr']).toBe(1);
    expect(useGameStore.getState().quests['first-road'].status).toBe('active');
    s.startDialogue('aldren-vale');
    expect(useGameStore.getState().quests['first-road'].status).toBe('completed');
  });
  it('does not progress from invalid NPCs or repeated clicks on an open dialogue', () => {
    const s = useGameStore.getState();
    s.startDialogue('missing');
    expect(useGameStore.getState().dialogue).toBeNull();
    s.startDialogue('aldren-vale');
    s.recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr');
    s.startDialogue('aldren-vale');
    expect(useGameStore.getState().quests['first-road'].status).toBe('active');
  });
});
