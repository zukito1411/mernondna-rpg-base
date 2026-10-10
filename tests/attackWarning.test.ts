import {describe,expect,it} from 'vitest';
import {ATTACK_WARNING_FRAMES,enemyAttackWarningLayout} from '../src/game/systems/attackWarning';

describe('enemy attack warning footprints',()=>{
  it('uses the supplied circular rune art for full-radius slams',()=>{
    const warning=enemyAttackWarningLayout('slam',100,0);
    expect(warning).toMatchObject({frame:ATTACK_WARNING_FRAMES.circle.name,width:200,height:200,originX:.5,rotation:0});
  });

  it('fits the illustrated cone to the real strike range and facing angle',()=>{
    const melee=enemyAttackWarningLayout('melee',100,0);
    const pounce=enemyAttackWarningLayout('pounce',100,Math.PI/2);
    expect(melee.frame).toBe(ATTACK_WARNING_FRAMES.cone.name);
    expect(melee.width).toBe(100);
    expect(melee.height).toBeCloseTo(2*100*Math.tan(Math.acos(.6)));
    expect(melee.rotation).toBe(0);
    expect(pounce.height).toBeGreaterThan(melee.height);
    expect(pounce.rotation).toBeCloseTo(Math.PI/2);
  });

  it('uses tightly cropped frames from the supplied transparent atlas',()=>{
    expect(ATTACK_WARNING_FRAMES.cone).toMatchObject({x:23,y:425,width:342,height:342});
    expect(ATTACK_WARNING_FRAMES.circle).toMatchObject({x:321,y:716,width:339,height:333});
  });
});
