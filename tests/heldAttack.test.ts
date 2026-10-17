import {afterEach,describe,expect,it} from 'vitest';
import {mobileInput} from '../src/game/input';

afterEach(()=>mobileInput.reset());
describe('held attack input',()=>{
  it('keeps a hold across frames independently of the initial press',()=>{
    mobileInput.press('attack');mobileInput.setAttackHeld(true);
    expect(mobileInput.consume('attack')).toBe(true);
    expect(mobileInput.consume('attack')).toBe(false);
    expect(mobileInput.attackHeld).toBe(true);
    mobileInput.setAttackHeld(false);expect(mobileInput.attackHeld).toBe(false);
  });
  it('retains a quick tap and clears a hold on menu/focus reset',()=>{
    mobileInput.press('attack');mobileInput.setAttackHeld(true);mobileInput.setAttackHeld(false);
    expect(mobileInput.consume('attack')).toBe(true);
    mobileInput.setAttackHeld(true);mobileInput.reset();
    expect(mobileInput.attackHeld).toBe(false);expect(mobileInput.consume('attack')).toBe(false);
  });
});
