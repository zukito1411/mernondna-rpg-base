import {describe,expect,it,vi} from 'vitest';
import type {Enemy} from '../src/game/entities/Enemy';
import type {WorldScene} from '../src/game/scenes/WorldScene';
import {BOSS_COMBAT_PROFILES,bossPattern} from '../src/data/bossCombatProfiles';

vi.mock('phaser',()=>({default:{Math:{Clamp:(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value)),
  Vector2:class {constructor(public x:number,public y:number){}}}}}));
vi.mock('../src/game/systems/AttackTelegraph',()=>({AttackTelegraph:class {
  progress=0;draw(_area:unknown,progress:number){this.progress=progress;return this;}clear(){this.progress=0;}destroy(){}
}}));
import {BossCombat} from '../src/game/systems/BossCombat';

function fixture(id='captain-varr'){
  const player={x:80,y:0,active:true};
  const enemy={x:0,y:0,hp:100,definition:{hp:100,damage:20},attackSpeedMultiplier:1,movementSpeed:80,
    isStaggered:false,instanceId:'boss:'+id,playBossWindup:vi.fn(),finishBossWindup:vi.fn(),playBossImpact:vi.fn(),cancelBossWindup:vi.fn(),playMonsterVocal:vi.fn(),playMonsterAttackFoley:vi.fn()};
  const body={setVelocity:vi.fn(),reset:(x:number,y:number)=>{enemy.x=x;enemy.y=y;}};
  const circle={setStrokeStyle:()=>circle,setDepth:()=>circle,destroy:vi.fn()};
  const scene={player,combatAllowed:true,damagePlayer:vi.fn(),playEffect:vi.fn(),
    hasClearPath:vi.fn(()=>true),canEnemyOccupy:vi.fn((_x:number,_y:number)=>true),
    enemyNavigationPoint:()=>player,add:{circle:()=>circle},tweens:{add:vi.fn()}};
  const actor=Object.assign(enemy,{body});
  const combat=new BossCombat(actor as unknown as Enemy,scene as unknown as WorldScene,BOSS_COMBAT_PROFILES[id]);
  const advance=(ms:number,engaged=true)=>{while(ms>0){const delta=Math.min(ms,100);combat.update(delta,engaged);ms-=delta;}};
  return {enemy:actor,scene,combat,player,advance};
}

describe('distinct boss attack sequences',()=>{
  it('deals no damage until the full warning completes, and hits once',()=>{
    const f=fixture();f.advance(900);expect(f.combat.attackName).toBe('Roadwarden cut');
    f.advance(499);expect(f.scene.damagePlayer).not.toHaveBeenCalled();
    expect(f.combat.windupFraction).toBeCloseTo(.998);
    f.advance(1);expect(f.scene.damagePlayer).toHaveBeenCalledExactlyOnceWith(16);
    f.advance(400);expect(f.scene.damagePlayer).toHaveBeenCalledTimes(1);
  });
  it('locks the cone aim and lets the player dodge out during the windup',()=>{
    const f=fixture();f.advance(900);f.player.x=0;f.player.y=80;f.advance(500);
    expect(f.scene.damagePlayer).not.toHaveBeenCalled();
  });
  it('locks ranged ground marks rather than following the player until impact',()=>{
    const f=fixture('ashen-seer');f.player.x=200;f.advance(900);
    f.player.x=350;f.advance(1100);expect(f.scene.damagePlayer).not.toHaveBeenCalled();
  });
  it('cancels pending damage when interrupted, defeated or disengaged',()=>{
    for(const mode of ['interrupt','defeat','disengage']){
      const f=fixture();f.advance(900);f.advance(250);
      if(mode==='interrupt'){f.combat.cancel();f.player.x=1000;}
      if(mode==='defeat')f.enemy.hp=0;
      f.advance(2000,mode!=='disengage');expect(f.scene.damagePlayer,mode).not.toHaveBeenCalled();
    }
  });
  it('advertises and traverses only the clear portion of a charge lane',()=>{
    const f=fixture('frost-wyrm');f.player.x=210;
    f.scene.canEnemyOccupy.mockImplementation((x:number)=>x<=100);
    f.advance(900);f.advance(1050);f.advance(500);
    expect(f.enemy.x).toBeLessThanOrEqual(100);expect(f.scene.damagePlayer).not.toHaveBeenCalled();
  });
  it('gives every ground boss a distinct profile and bounded low-health combinations',()=>{
    expect(Object.keys(BOSS_COMBAT_PROFILES)).toHaveLength(8);
    expect(new Set(Object.values(BOSS_COMBAT_PROFILES).map(p=>p.identity)).size).toBe(8);
    for(const profile of Object.values(BOSS_COMBAT_PROFILES)){
      const pattern=bossPattern(profile,0,.4);expect(pattern.length).toBeGreaterThan(1);expect(pattern.length).toBeLessThanOrEqual(3);
      for(const move of pattern){expect(move.windup).toBeGreaterThanOrEqual(500);expect(move.recovery).toBeGreaterThanOrEqual(400);}
    }
  });
});
