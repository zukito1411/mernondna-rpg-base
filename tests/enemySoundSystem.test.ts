import {describe,expect,it} from 'vitest';
import {dragonEffectPlayback} from '../src/game/systems/dragonAudio';

describe('dragon sound playback',()=>{
  it('lets the roar play through the full clip instead of its phase duration',()=>{
    expect(dragonEffectPlayback('roar',1000,6.4)).toEqual({duration:6.4,loop:false});
  });

  it('loops flight audio and keeps breath audio within its attack window',()=>{
    expect(dragonEffectPlayback('flight',2400,2.1)).toEqual({duration:2.1,loop:true});
    expect(dragonEffectPlayback('breath',900,4)).toEqual({duration:.9,loop:false});
  });
});
