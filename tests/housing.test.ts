import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {emptyHousing,parseHousing,housingLayoutProblem,snapFurnitureToWalls,furnitureVisualBounds,HOME_ID,HOME_PRICE,type HomeItem} from '../src/data/housing';
import {useGameStore} from '../src/store/gameStore';
import {allowExplicitNewGame,saveGame,loadGame,parseSave,SAVE_KEY,setSaveSnapshotProvider} from '../src/utils/save';
const bed:HomeItem={id:1,art:'bed',kit:'trandum_rustic',x:64,y:64,rotation:0,stored:false};
const rack:HomeItem={id:2,art:'weaponRack',kit:'trandum_rustic',x:480,y:96,rotation:0,stored:false,weaponId:'varr-rededge'};
beforeEach(()=>{
 const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)});
 allowExplicitNewGame();setSaveSnapshotProvider();useGameStore.getState().resetGame();
 useGameStore.setState({gold:10000,pendingCinematic:null,cinematicQueue:[]});
});
afterEach(()=>{vi.unstubAllGlobals();setSaveSnapshotProvider();});
it('accepts clear rooms and rejects walls, overlaps, blocked hallways and malformed saves',()=>{
 expect(housingLayoutProblem([])).toBeNull();expect(housingLayoutProblem([bed,rack])).toBeNull();
 expect(housingLayoutProblem([bed,{...bed,id:2}])).toMatch(/overlap/);
 expect(housingLayoutProblem([{...bed,x:320,y:832}])).not.toBeNull();
 expect(housingLayoutProblem([{...bed,x:0}])).toBeNull();
 expect(housingLayoutProblem([{...bed,x:-32}])).not.toBeNull();
 const hearth:HomeItem={id:1,art:'hearth',kit:'narenthil_elven',x:0,y:320,rotation:0,stored:false};
 expect(housingLayoutProblem([hearth])).not.toBeNull();
 for(const corner of [{x:0,y:320},{x:0,y:0},{x:416,y:0},{x:640,y:800},{x:0,y:800}]){
  const placed=snapFurnitureToWalls({...hearth,...corner});
  expect(housingLayoutProblem([placed])).toBeNull();
  expect(furnitureVisualBounds(placed).top).toBeGreaterThanOrEqual(corner.y===0?-.001:320-.001);
 }
 const recovered=parseHousing({owned:true,nextId:2,items:[hearth]},{returnWeapon:()=>{}});
 expect(recovered?.items[0].stored).toBe(false);
 expect(recovered&&housingLayoutProblem(recovered.items)).toBeNull();
 expect(housingLayoutProblem([{...hearth,y:-32}])).not.toBeNull();
 expect(parseHousing(undefined)).toEqual(emptyHousing());
 expect(parseHousing({owned:true,nextId:2,items:[bed,bed]})).toBeNull();
 expect(parseHousing({owned:false,nextId:2,items:[bed]})).toBeNull();
});
it('purchases only from the doorstep, charges once, and rejects an unaffordable purchase',()=>{
 expect(useGameStore.getState().buyHome()).toBe(false);
 useGameStore.setState({panel:'housing',housingContext:'purchase:'+HOME_ID,gold:7499});
 expect(useGameStore.getState().buyHome()).toBe(false);
 useGameStore.setState({gold:10000});expect(useGameStore.getState().buyHome()).toBe(true);
 expect(useGameStore.getState().gold).toBe(10000-HOME_PRICE);
 expect(useGameStore.getState().buyHome()).toBe(false);
});
it('commits a paid layout atomically, reserves rack copies, returns stored copies, and round-trips saves',()=>{
 useGameStore.setState({housing:{...emptyHousing(),owned:true},housingContext:HOME_ID,panel:'housing',housingEditing:true,
  inventory:['roadwarden-sword','varr-rededge'],bossMaterials:{'varr-rededge':1}});
 expect(useGameStore.getState().saveHomeLayout([bed,rack],3)).toBeNull();
 expect(useGameStore.getState().gold).toBe(9625);expect(useGameStore.getState().bossMaterials['varr-rededge']).toBe(0);
 expect(saveGame()).toBe(true);expect(parseSave(localStorage.getItem(SAVE_KEY)!)?.state.housing?.items).toHaveLength(2);
 useGameStore.setState({housing:emptyHousing()});expect(loadGame()).toBe(true);expect(useGameStore.getState().housing.items).toHaveLength(2);
 useGameStore.setState({panel:'housing',housingContext:HOME_ID});
 useGameStore.setState({housingEditing:true});
 expect(useGameStore.getState().saveHomeLayout([bed,{...rack,stored:true,weaponId:undefined}],3)).toBeNull();
 expect(useGameStore.getState().gold).toBe(9625);expect(useGameStore.getState().bossMaterials['varr-rededge']).toBe(1);
 useGameStore.setState({housingEditing:true,gold:0});const before=useGameStore.getState().housing;
 expect(useGameStore.getState().saveHomeLayout([bed,{...rack,stored:true,weaponId:undefined},{...bed,id:3,x:192,y:64}],4)).not.toBeNull();
 expect(useGameStore.getState().housing).toBe(before);
});
