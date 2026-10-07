import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../src/store/gameStore';
import { progressionStats } from '../src/data/progression';

describe('character progression', () => {
  beforeEach(() => useGameStore.getState().resetGame());

  it('awards three status points and one skill point per earned level', () => {
    useGameStore.getState().addRewards(500, 0);
    expect(useGameStore.getState()).toMatchObject({ level: 3, statPoints: 6, skillPoints: 2 });
  });

  it('spends status and skill points on combat-effective upgrades', () => {
    const store = useGameStore.getState();
    store.addRewards(250, 0);
    useGameStore.getState().allocateAttribute('vitality');
    useGameStore.getState().unlockSkill('heavy-strike');
    const state = useGameStore.getState();
    expect(state).toMatchObject({ statPoints: 2, skillPoints: 0, maxHp: 112, learnedSkills: ['heavy-strike'] });
    expect(progressionStats(state.attributes, state.learnedSkills).damageMultiplier).toBeCloseTo(1.2);
  });

  it('does not allow unearned or duplicate skill purchases', () => {
    useGameStore.getState().addRewards(250, 0);
    useGameStore.getState().unlockSkill('fleet-foot');
    useGameStore.getState().unlockSkill('fleet-foot');
    expect(useGameStore.getState()).toMatchObject({ skillPoints: 0, learnedSkills: ['fleet-foot'] });
  });
});
