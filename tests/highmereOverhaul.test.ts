import { describe,it,expect,beforeEach } from 'vitest';
import { RecoverySystem } from '../src/game/systems/RecoverySystem';
import { ROYAL_WALL_LINES,ROYAL_FORTIFICATION_PROPS,fortificationBlocksPoint,fortificationBlocksPath } from '../src/data/fortifications';
import { TOWN_BY_ID } from '../src/data/towns';
import { SETTLEMENT_BY_ID } from '../src/data/settlements';
import { WORLD_CONTENT } from '../src/data/content';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';
import { formationPosition,npcStreetRoute } from '../src/game/systems/npcRoutes';
import { HIGHMERE_QUESTS } from '../src/data/highmereQuests';
import { useGameStore } from '../src/store/gameStore';
import { nextObjective } from '../src/game/systems/storyProgress';
import { parseSave } from '../src/utils/save';
import { ACTIVE_SKILL_BY_ID } from '../src/data/activeSkills';
import { HERO_PACK,clipSources } from '../src/data/animationPacks';

describe('Highmere playable story and city overhaul',()=>{
  const city=TOWN_BY_ID.highmere.world,world=new WorldGenerator();
  beforeEach(()=>useGameStore.getState().resetGame());
  it('builds seven districts, preserves twenty original lots and connects a larger capital',()=>{
    const layout=SETTLEMENT_BY_ID.highmere;
    expect(layout.bounds.width*layout.bounds.height).toBeGreaterThan(3500*2800*2);
    expect(layout.buildings).toHaveLength(34);
    for(const id of ['crown-ward','central-ward','military-ward','market-ward','west-homes','lower-ward','outer-ward'])expect(layout.parcels.some(p=>p.id===id)).toBe(true);
    const route=npcStreetRoute('highmere',{x:-2100,y:1900},{x:-1000,y:-1550},(a,b)=>!fortificationBlocksPath({x:city.x+a.x,y:city.y+a.y},{x:city.x+b.x,y:city.y+b.y},12));
    expect(route.length).toBeGreaterThan(2);
    expect(route.at(-1)).toEqual({x:-1000,y:-1550});
  });
  it('joins original-perspective curtains to a passable south-facing audience gate',()=>{
    expect(ROYAL_FORTIFICATION_PROPS.filter(p=>p.frame===4)).toHaveLength(1);
    expect(ROYAL_FORTIFICATION_PROPS.every(p=>!p.rotation)).toBe(true);
    for(const line of ROYAL_WALL_LINES)expect(fortificationBlocksPoint((line.a.x+line.b.x)/2,(line.a.y+line.b.y)/2)).toBe(true);
    expect(world.isWalkable(city.x-1000,city.y-1300)).toBe(true);
    expect(fortificationBlocksPath({x:city.x-1000,y:city.y-1200},{x:city.x-1000,y:city.y-1450},12)).toBe(false);
    expect(fortificationBlocksPath({x:city.x-1150,y:city.y-1200},{x:city.x-1150,y:city.y-1450},12)).toBe(true);
  });
  it('keeps four crossings walkable on decks rather than decorative rails',()=>{
    const bridges=WORLD_CONTENT.filter(d=>d.id.startsWith('bridge:highmere:'));
    expect(bridges).toHaveLength(4);
    for(const bridge of bridges){for(const dx of [-120,-60,0,60,120])expect(world.isWalkable(bridge.world.x+dx,bridge.world.y)).toBe(true);
      expect(world.isWalkable(bridge.world.x,bridge.world.y+55)).toBe(false);}
  });
  it('maintains separated marching positions through corners and a closed circuit',()=>{
    expect(formationPosition(4100/38*1000,0)).toEqual(formationPosition(0,0));
    for(let time=0;time<100000;time+=1500){const positions=Array.from({length:6},(_,rank)=>formationPosition(time,rank));
      for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)expect(Math.hypot(positions[i].x-positions[j].x,positions[i].y-positions[j].y)).toBeGreaterThanOrEqual(65);}
  });
  it('regenerates during peaceful town movement or wilderness rest, never under threat',()=>{
    const town=new RecoverySystem(),rest=new RecoverySystem(),moving=new RecoverySystem();
    let hp=50,idleHp=50,movingHp=50;
    for(let i=0;i<80;i++){
      hp=town.update(250,{hp,maxHp:100,inSettlement:true,moving:true,busy:false,threatened:false});
      idleHp=rest.update(250,{hp:idleHp,maxHp:100,inSettlement:false,moving:false,busy:false,threatened:false});
      movingHp=moving.update(250,{hp:movingHp,maxHp:100,inSettlement:false,moving:true,busy:false,threatened:false});
    }
    expect(hp).toBeGreaterThan(idleHp);expect(idleHp).toBeGreaterThan(50);expect(movingHp).toBe(50);
    expect(town.update(250,{hp,maxHp:100,inSettlement:true,moving:false,busy:false,threatened:true})).toBe(hp);
    town.interrupt();expect(town.update(250,{hp:50,maxHp:100,inSettlement:true,moving:false,busy:false,threatened:false})).toBe(50);
  });
  it('requires evidence and choices, rejects wrong puzzle answers and persists the full stories',()=>{
    const store=useGameStore.getState();store.startDialogue('mairin-reed');store.endDialogue();
    expect(nextObjective('shadows-highmere',useGameStore.getState().quests)?.id).toBe('receipt');
    store.progressQuest('talk','sevrin-hale');expect(nextObjective('shadows-highmere',useGameStore.getState().quests)?.id).toBe('receipt');
    store.startDialogue('renna-vale');store.endDialogue();expect(useGameStore.getState().quests['kingdom-divided'].status).toBe('locked');
    for(const quest of HIGHMERE_QUESTS) {
      store.startDialogue(quest.giverNpcId);store.endDialogue();
      for(const objective of quest.objectives) {
        const current=nextObjective(quest.id,useGameStore.getState().quests);if(current?.id!==objective.id)continue;
        if(objective.choices){store.startDialogue(objective.targetId);
          for(let line=1;line<(objective.dialogue?.length??1);line++)store.advanceDialogue();
          if(objective.type==='puzzle'){store.chooseDialogue('wrong');expect(nextObjective(quest.id,useGameStore.getState().quests)?.id).toBe(objective.id);}
          store.chooseDialogue(objective.choices.find(c=>c.correct!==false)!.id);
        }else store.progressQuest(objective.type,objective.targetId,objective.amount);
        store.endDialogue();
      }
      expect(useGameStore.getState().quests[quest.id].status).toBe('completed');
    }
    const state=useGameStore.getState(),reward=state.gold;store.progressQuest('talk','renna-vale');expect(useGameStore.getState().gold).toBe(reward);
    const saved=parseSave(JSON.stringify({version:4,state,savedAt:'now'}));expect(saved?.state.quests['kingdom-divided'].status).toBe('completed');
    expect(saved?.state.storyFlags['relief-household-charter']).toBe(true);expect(saved?.state.storyChoices).toEqual(state.storyChoices);
  });
  it('uses actual 2172x724 hero cells and keeps Crescent Flurry radial',()=>{
    for(const direction of ['walk_left','walk_right']){const sources=clipSources(HERO_PACK,direction);expect(sources[0].imageSize).toEqual([2172,724]);expect(sources[5].cell).toEqual([1810,0,362,724]);}
    expect(ACTIVE_SKILL_BY_ID['crescent-flurry'].coneDot).toBe(-1);
  });
});
