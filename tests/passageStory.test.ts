import {describe,it,expect,beforeEach,vi} from 'vitest';
import {WorldGenerator} from '../src/game/systems/WorldGenerator';
import {PORTS,ASHEN_DOCK_ROAD} from '../src/data/ports';
import {SeaPassagePlanner,passagePoint} from '../src/game/systems/seaPassage';
import {onHighmereBridge} from '../src/data/rivers';
import {QUESTS} from '../src/data/quests';
import {CINEMATICS} from '../src/data/cinematics';
import {useGameStore} from '../src/store/gameStore';
import {sceneQueue} from '../src/game/systems/storyScenes';
import {saveGame,parseSave,SAVE_KEY,allowExplicitNewGame} from '../src/utils/save';
import {SETTLEMENT_LAYOUTS,buildingBounds} from '../src/data/settlements';
import {rectTouchesStreet} from '../src/data/settlementGeometry';
import {CONTENT_BY_ID} from '../src/data/content';
describe('passages and grounded quest scenes',()=>{
 const world=new WorldGenerator(),planner=new SeaPassagePlanner(world);
 beforeEach(()=>{useGameStore.getState().resetGame();allowExplicitNewGame();});
 it('fits larger houses clear of the actual authored streets',()=>{
  let enlarged=0;
  for(const layout of SETTLEMENT_LAYOUTS)for(const [index,lot] of layout.buildings.entries()){if(lot.omitted||CONTENT_BY_ID['town:'+layout.townId+':building:'+index]?.kind!=='settlement-prop')continue;if((lot.growth??1)>1.12)enlarged++;
   const bounds=buildingBounds(lot);for(const street of layout.streets)expect(rectTouchesStreet(bounds,street),layout.townId+'/'+lot.label+'/'+street.id).toBe(false);
  }
  expect(enlarged).toBeGreaterThan(30);
 });
 it('has land embarkation points and moored boats in water',()=>{
  for(const port of PORTS){expect(CONTENT_BY_ID['port:'+port.id].world).toEqual(port.landing);expect(world.isWalkable(port.landing.x,port.landing.y),port.id).toBe(true);expect(world.getTerrainAt(port.boat.x,port.boat.y),port.id).toBe('water');}
 });
 it('connects Ashen Landing to Blackspire through its actual south gate',()=>{
  for(let i=1;i<ASHEN_DOCK_ROAD.length;i++){const a=ASHEN_DOCK_ROAD[i-1],b=ASHEN_DOCK_ROAD[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/24);
   for(let step=0;step<=n;step++){const p={x:a.x+(b.x-a.x)*step/n,y:a.y+(b.y-a.y)*step/n};expect(world.isWalkable(p.x,p.y),JSON.stringify(p)).toBe(true);expect(world.isRoad(p.x,p.y)).toBe(true);}
  }
 });
 it('sails from Highmere to each island without crossing land',()=>{
  for(const to of ['tidewatch','skallheim','blackspire']){
   const route=planner.route('highmere',to);expect(route.length,to).toBeGreaterThan(10);
   for(let i=1;i<route.length;i++){
    const a=route[i-1],b=route[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/64);
    for(let step=0;step<=n;step++){const p={x:a.x+(b.x-a.x)*step/n,y:a.y+(b.y-a.y)*step/n};
     expect(world.getTerrainAt(p.x,p.y)==='water'||onHighmereBridge(p.x,p.y),to+' '+JSON.stringify(p)).toBe(true);}
   }
   expect(passagePoint(route,0)).toMatchObject(PORTS[0].boat);
   expect(passagePoint(route,1)).toMatchObject(PORTS.find(p=>p.id===to)!.boat);
   expect(planner.route(to,'highmere')).toEqual([...route].reverse());
  }
 });
 it('gives every authored quest a turning point with a valid scene',()=>{
  for(const quest of QUESTS){expect(quest.objectives.some(o=>o.cinematicId),quest.id).toBe(true);for(const o of quest.objectives)if(o.cinematicId)expect(CINEMATICS[o.cinematicId],o.cinematicId).toBeTruthy();}
  expect(Object.keys(CINEMATICS).length).toBeGreaterThan(20);
 });
 it('queues combat scenes and records a safer road after the return conversation',()=>{
  const s=useGameStore.getState();s.startDialogue('aldren-vale');s.endDialogue();s.recordEnemyDefeat('bandit-captain',110,30,'captain-varr');
  expect(useGameStore.getState().cinematicQueue).toContain('road-cleared');expect(useGameStore.getState().storyFlags['oakmere-road-open']).toBeUndefined();
  s.startDialogue('aldren-vale');s.endDialogue();expect(useGameStore.getState().storyFlags['oakmere-road-open']).toBe(true);
  expect(sceneQueue('road-briefing',['road-cleared'],['road-cleared','road-resolution'],{'scene:road-briefing':true})).toEqual({pendingCinematic:'road-cleared',cinematicQueue:['road-resolution']});
 });
 it('keeps the regional story tracked when Vexa offers the optional dragon quest',()=>{
  const store=useGameStore.getState();store.hydrate({trackedQuestId:'eight-regions',quests:{...store.quests,'eight-regions':{status:'active',objectiveProgress:Object.fromEntries(QUESTS.find(q=>q.id==='eight-regions')!.objectives.filter(o=>o.id!=='brief:blackspire'&&!['evidence:blackspire','ashen-seer','report:blackspire','capital-return','return-aldren-after-regions'].includes(o.id)).map(o=>[o.id,o.amount]))}}});
  store.startDialogue('blackspire-forgemaster');expect(useGameStore.getState().dialogue?.questId).toBe('eight-regions');expect(useGameStore.getState().trackedQuestId).toBe('eight-regions');expect(useGameStore.getState().quests['returning-ember'].status).toBe('active');
 });
 it('persists queued/current scenes and does not replay newly authored intros for old saves',()=>{
  const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)});
  useGameStore.getState().hydrate({pendingCinematic:'road-briefing',cinematicQueue:['road-cleared']});expect(saveGame()).toBe(true);
  expect(parseSave(values.get(SAVE_KEY)!)?.state.cinematicQueue).toEqual(['road-briefing','road-cleared']);
  const old=JSON.parse(values.get(SAVE_KEY)!);delete old.state.cinematicQueue;
  expect(parseSave(JSON.stringify(old))?.state.cinematicQueue).toEqual([]);vi.unstubAllGlobals();
 });
});
