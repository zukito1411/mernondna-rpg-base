import {describe,expect,it,vi} from 'vitest';
import {VolcanicTremor} from '../src/game/systems/VolcanicTremor';

describe('Darkav volcanic tremors',()=>{
  it('shakes casually in Darkav, pauses while blocked and stops outside',()=>{
    const tremor=new VolcanicTremor(),shake=vi.fn();
    tremor.update(60000,true,false,shake);
    expect(shake).toHaveBeenCalledTimes(1);
    tremor.update(60000,true,true,shake);
    expect(shake).toHaveBeenCalledTimes(1);
    tremor.update(60000,false,false,shake);
    tremor.update(60000,true,false,shake);
    expect(shake).toHaveBeenCalledTimes(2);
  });
});
