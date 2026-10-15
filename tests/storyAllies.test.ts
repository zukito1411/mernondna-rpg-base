import {describe,it,expect,vi} from 'vitest';
import type {Npc} from '../src/game/entities/Npc';
import type {Enemy} from '../src/game/entities/Enemy';
import type {WorldScene} from '../src/game/scenes/WorldScene';

vi.mock('phaser',()=>({default:{Math:{Vector2:class {
  constructor(public x=0,public y=0){}
  normalize(){const length=Math.hypot(this.x,this.y);if(length){this.x/=length;this.y/=length;}return this;}
}}}}));
vi.mock('../src/game/systems/NpcCombatResidency',()=>({NpcCombatResidency:class {
  ensure(){return true;}update(){}cancelPending(){}destroy(){}
}}));
import {StoryAllySystem} from '../src/game/systems/StoryAllySystem';

function fixture(){
  const enemies=[{x:40,y:0},{x:0,y:70}].map((point,index)=>({...point,active:true,canBeTargeted:true,hp:100,
    instanceId:'event:'+index,definition:{hp:100,bodyRadius:11},takeDamage:vi.fn(function(this:{hp:number;active:boolean},
      amount:number,_direction:unknown,_options:{source:string}){
      this.hp-=amount;if(this.hp<=0)this.active=false;
    })}));
  const npcs=Array.from({length:3},()=>({x:0,y:0,active:true,definition:{combatant:true},escorting:false,
    combatProfile:{id:'guard',mode:'melee'},canStoryFight:true,storyAttackReach:96,
    storyStrikeReady:true,storyAttackFinished:false,
    beginStoryGuard:vi.fn(),holdStoryGuard:vi.fn(),endStoryGuard:vi.fn(),endStoryMovement:vi.fn(),beginStoryMovement:vi.fn(),
    beginStoryAttack:vi.fn(function(this:{storyAttackFinished:boolean}){this.storyAttackFinished=false;return true;}),
    endStoryAttack:vi.fn()}));
  const scene={storyResidents:()=>npcs,hasClearPath:()=>true,canNpcVisit:()=>true,npcPathBlocker:()=>null,
    player:{x:500,y:500}} as unknown as WorldScene;
  const system=new StoryAllySystem(scene);
  system.recruit(npcs as unknown as Npc[]);
  const tick=(blocked=false)=>{
    system.update(80,enemies as unknown as Enemy[],{x:0,y:0},180,blocked);
    for(const npc of npcs)npc.storyAttackFinished=true;
  };
  return {system,enemies,npcs,tick};
}

describe('independent story defenders',()=>{
  it('engages untouched foes, spreads targets, allows simultaneous attacks and finishes enemies past the former cap',()=>{
    const {enemies,npcs,tick}=fixture();
    for(let i=0;i<15;i++)tick();
    expect(npcs.every(npc=>npc.beginStoryAttack.mock.calls.length>0)).toBe(true);
    expect(enemies.every(enemy=>enemy.takeDamage.mock.calls.length>0)).toBe(true);
    for(let i=0;i<1600&&enemies.some(enemy=>enemy.active);i++)tick();
    expect(enemies.every(enemy=>enemy.hp<=0)).toBe(true);
    for(const enemy of enemies)expect(enemy.takeDamage.mock.calls[0]?.[2]).toEqual({source:'story-ally'});
  });
  it('does not land pending strikes while paused or after the event is cleared',()=>{
    const {system,enemies,npcs,tick}=fixture();
    tick(true);
    expect(enemies.every(enemy=>enemy.hp===100)).toBe(true);
    expect(npcs.every(npc=>npc.beginStoryAttack.mock.calls.length===0)).toBe(true);
    system.clear();system.update(80,[],{x:0,y:0},0,true);
    expect(enemies.every(enemy=>enemy.hp===100)).toBe(true);
    expect(npcs.every(npc=>npc.endStoryGuard.mock.calls.length===1)).toBe(true);
  });
});
