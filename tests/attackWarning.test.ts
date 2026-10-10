import {describe,expect,it} from 'vitest';
import {enemyAttackWarningPoints} from '../src/game/systems/attackWarning';

describe('enemy attack warning footprints',()=>{
  it('shows the full radius for slams and a forward-facing sector for melee',()=>{
    const slam=enemyAttackWarningPoints('slam',10,20,0,100);
    const melee=enemyAttackWarningPoints('melee',10,20,0,100);
    expect(slam).toHaveLength(21);
    expect(slam.every(point=>Math.abs(Math.hypot(point.x-10,point.y-20)-100)<1e-8)).toBe(true);
    expect(melee[0]).toEqual({x:10,y:20});
    expect(melee[1].x).toBeGreaterThan(10);
    expect(melee[1].y).toBeLessThan(20);
    expect(melee.at(-1)!.y).toBeGreaterThan(20);
  });

  it('keeps pounce warnings wider than a normal melee strike',()=>{
    const melee=enemyAttackWarningPoints('melee',0,0,0,50);
    const pounce=enemyAttackWarningPoints('pounce',0,0,0,50);
    expect(pounce[1].y).toBeLessThan(melee[1].y);
    expect(pounce.at(-1)!.y).toBeGreaterThan(melee.at(-1)!.y);
  });
});
