import {describe,expect,it} from 'vitest';
import {ATTACK_WARNING_FRAMES,enemyAttackWarningLayout,attackAreaContains,windupProgress} from '../src/game/systems/attackWarning';

describe('enemy attack warning footprints',()=>{
  it('fills to the exact impact boundary and preserves hollow safe zones',()=>{
    expect(windupProgress(0,1000)).toBe(0);expect(windupProgress(500,1000)).toBe(.5);
    expect(windupProgress(1000,1000)).toBe(1);expect(windupProgress(1200,1000)).toBe(1);
    expect(windupProgress(NaN,1000)).toBe(0);
    const area={kind:'ring' as const,x:0,y:0,angle:0,radius:200,innerRadius:100};
    expect(attackAreaContains(area,80,0)).toBe(false);expect(attackAreaContains(area,150,0)).toBe(true);
    expect(attackAreaContains(area,201,0)).toBe(false);
  });
  it('matches locked cone directions and charge lane side/cap boundaries',()=>{
    const cone={kind:'cone' as const,x:0,y:0,angle:Math.PI/2,radius:100,halfAngle:.7};
    expect(attackAreaContains(cone,0,80)).toBe(true);expect(attackAreaContains(cone,80,0)).toBe(false);
    const lane={kind:'line' as const,x:10,y:20,angle:0,radius:30,range:200};
    expect(attackAreaContains(lane,100,49)).toBe(true);expect(attackAreaContains(lane,100,51)).toBe(false);
    expect(attackAreaContains(lane,239,20)).toBe(true);expect(attackAreaContains(lane,241,20)).toBe(false);
  });
  it('preserves the dragon breath triangle’s flat far edge',()=>{
    const area={kind:'cone' as const,x:0,y:0,angle:0,radius:540,halfAngle:.5,flatEnd:true};
    expect(attackAreaContains(area,450,0)).toBe(true);expect(attackAreaContains(area,500,0)).toBe(false);
    expect(attackAreaContains(area,300,200)).toBe(false);
  });
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
