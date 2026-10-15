import {describe,expect,it} from 'vitest';
import {pendingStoryWave} from '../src/game/systems/storyEncounterPlacement';

describe('story encounter wave admission',()=>{
  const encounterId='archive-fire';
  const wave=['road-bandit','road-bandit'];

  it('waits until capacity can admit every undefeated member',()=>{
    expect(pendingStoryWave(encounterId,wave,2,{},1)).toBeNull();
    expect(pendingStoryWave(encounterId,wave,2,{},2)).toEqual([
      {enemyId:'road-bandit',slot:2},
      {enemyId:'road-bandit',slot:3},
    ]);
  });

  it('reserves only undefeated members, but still requires room for all of them',()=>{
    const flags={'encounter:archive-fire:defeated:2':true};

    expect(pendingStoryWave(encounterId,wave,2,flags,0)).toBeNull();
    expect(pendingStoryWave(encounterId,wave,2,flags,1)).toEqual([
      {enemyId:'road-bandit',slot:3},
    ]);
  });

  it('does not reserve a fully defeated wave',()=>{
    const flags={
      'encounter:archive-fire:defeated:2':true,
      'encounter:archive-fire:defeated:3':true,
    };

    expect(pendingStoryWave(encounterId,wave,2,flags,2)).toBeNull();
  });
});
