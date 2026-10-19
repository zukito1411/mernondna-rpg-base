import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {DUNGEONS,DUNGEON_RESET_MS,dungeonCleared,parseDungeons} from '../src/data/dungeons';
import {CONTRACTS} from '../src/data/contracts';
import {useGameStore} from '../src/store/gameStore';
import {allowExplicitNewGame,saveGame,loadGame,parseSave,SAVE_KEY,setSaveSnapshotProvider} from '../src/utils/save';
import {WorldGenerator} from '../src/game/systems/WorldGenerator';

beforeEach(()=>{
 const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)});
 allowExplicitNewGame();setSaveSnapshotProvider();useGameStore.getState().resetGame();useGameStore.setState({pendingCinematic:null});
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();setSaveSnapshotProvider();});
const d=DUNGEONS[0];
function enter(){useGameStore.getState().discoverDungeon(d.id);useGameStore.setState({activeDungeonId:d.id,panel:null});}
function clear(){for(let slot=0;slot<d.enemies.length;slot++)useGameStore.getState().recordDungeonDefeat(d.id,slot);}

it('cannot claim an uncleared chest and pays a complete chest only once',()=>{
 enter();const before=useGameStore.getState();before.claimDungeonChest(d.id);
 expect(useGameStore.getState().gold).toBe(before.gold);clear();
 expect(dungeonCleared(d,useGameStore.getState().dungeons[d.id])).toBe(true);
 useGameStore.getState().claimDungeonChest(d.id);const paid=useGameStore.getState();
 expect(paid.gold).toBe(before.gold+d.gold);expect(paid.xp).toBe(before.xp+d.xp);
 paid.claimDungeonChest(d.id);expect(useGameStore.getState().gold).toBe(paid.gold);expect(useGameStore.getState().xp).toBe(paid.xp);
});
it('resets at the saved 20-minute deadline outside, allowing a fresh rewarded clear',()=>{
 const start=1700000000000,clock=vi.spyOn(Date,'now').mockReturnValue(start);
 enter();clear();useGameStore.getState().claimDungeonChest(d.id);
 const firstGold=useGameStore.getState().gold;
 expect(useGameStore.getState().dungeons[d.id].respawnAt).toBe(start+DUNGEON_RESET_MS);
 expect(saveGame()).toBe(true);useGameStore.getState().resetGame();expect(loadGame()).toBe(true);
 clock.mockReturnValue(start+DUNGEON_RESET_MS-1);useGameStore.getState().refreshDungeon(d.id);
 expect(useGameStore.getState().dungeons[d.id].claimed).toBe(true);
 clock.mockReturnValue(start+DUNGEON_RESET_MS);useGameStore.getState().refreshDungeon(d.id);
 expect(useGameStore.getState().dungeons[d.id]).toEqual({discovered:true,defeated:0,claimed:false,version:2,rotation:1});
 enter();clear();useGameStore.getState().claimDungeonChest(d.id);
 expect(useGameStore.getState().gold).toBe(firstGold+d.gold);
 expect(useGameStore.getState().dungeons[d.id].respawnAt).toBe(start+2*DUNGEON_RESET_MS);
});
it('waits for an occupied cave to empty and never expires partial clears or unopened chests',()=>{
 const start=1700000000000,clock=vi.spyOn(Date,'now').mockReturnValue(start);
 enter();clear();useGameStore.getState().claimDungeonChest(d.id);
 clock.mockReturnValue(start+DUNGEON_RESET_MS+1000);useGameStore.getState().refreshDungeon(d.id);
 expect(useGameStore.getState().dungeons[d.id].claimed).toBe(true);
 useGameStore.setState({activeDungeonId:null});useGameStore.getState().refreshDungeon(d.id);enter();
 useGameStore.getState().recordDungeonDefeat(d.id,0);useGameStore.setState({activeDungeonId:null});
 clock.mockReturnValue(start+3*DUNGEON_RESET_MS);useGameStore.getState().refreshDungeon(d.id);
 expect(useGameStore.getState().dungeons[d.id].defeated).toBe(1);
 enter();clear();useGameStore.setState({activeDungeonId:null});useGameStore.getState().refreshDungeon(d.id);
 expect(dungeonCleared(d,useGameStore.getState().dungeons[d.id])).toBe(true);
 expect(useGameStore.getState().dungeons[d.id].claimed).toBe(false);
});
it('preserves partial kills and claimed chests in validated saves while discarding the transient room',()=>{
 enter();useGameStore.getState().recordDungeonDefeat(d.id,0);useGameStore.getState().recordDungeonDefeat(d.id,0);
 expect(useGameStore.getState().dungeons[d.id].defeated).toBe(1);expect(saveGame()).toBe(true);
 useGameStore.getState().resetGame();expect(loadGame()).toBe(true);
 expect(useGameStore.getState().dungeons[d.id].defeated).toBe(1);expect(useGameStore.getState().activeDungeonId).toBeNull();
 enter();clear();useGameStore.getState().claimDungeonChest(d.id);expect(saveGame()).toBe(true);
 const saved=parseSave(localStorage.getItem(SAVE_KEY)!);expect(saved?.state.dungeons?.[d.id].claimed).toBe(true);
 const gold=useGameStore.getState().gold;useGameStore.getState().resetGame();expect(loadGame()).toBe(true);enter();
 useGameStore.getState().claimDungeonChest(d.id);expect(useGameStore.getState().gold).toBe(gold);
});
it('completes a board expedition on opening the chest, with a separate one-time board payout',()=>{
 const contract=CONTRACTS.find(c=>c.dungeonId===d.id)!;
 useGameStore.getState().openContractBoard(d.townId);useGameStore.getState().acceptContract(contract.id);enter();clear();
 expect(useGameStore.getState().contracts[contract.id].progress).toBe(0);
 useGameStore.getState().claimDungeonChest(d.id);expect(useGameStore.getState().contracts[contract.id].progress).toBe(1);
 const gold=useGameStore.getState().gold;useGameStore.getState().openContractBoard(d.townId);useGameStore.getState().claimContract(contract.id);
 expect(useGameStore.getState().gold).toBe(gold+contract.gold);useGameStore.getState().claimContract(contract.id);expect(useGameStore.getState().gold).toBe(gold+contract.gold);
});
it('loads legacy saves without caves and rejects invented or impossible clear records',()=>{
 expect(saveGame()).toBe(true);const data=JSON.parse(localStorage.getItem(SAVE_KEY)!);delete data.state.dungeons;
 expect(parseSave(JSON.stringify(data))?.state.dungeons).toEqual({});expect(parseDungeons({invented:{discovered:true,defeated:127,claimed:true}})).toBeNull();
 expect(parseDungeons({[d.id]:{discovered:true,defeated:1,claimed:true}})).toBeNull();
 expect(parseDungeons({[d.id]:{discovered:true,defeated:128,claimed:false}})).toBeNull();
 expect(parseDungeons({[d.id]:{discovered:true,defeated:127,claimed:true,respawnAt:NaN}})).toBeNull();
 expect(parseDungeons({[d.id]:{discovered:true,defeated:0,claimed:false,respawnAt:1700000000000}})).toBeNull();
});
it('gives every authored entrance a dry, off-road approach in its intended region',()=>{
 const world=new WorldGenerator();
 for(const cave of DUNGEONS){
  const offsets=[{x:0,y:0},...Array.from({length:48},(_,i)=>({x:Math.cos(i*Math.PI/6)*(120+Math.floor(i/12)*120),y:Math.sin(i*Math.PI/6)*(120+Math.floor(i/12)*120)}))];
  const suitable=offsets.some(offset=>{const p={x:cave.door.x+offset.x,y:cave.door.y+offset.y};
   return world.getRegionAt(p.x,p.y)===cave.regionId&&!world.isRoad(p.x,p.y,110)
    &&[[0,0],[-105,-50],[105,-50],[-90,-145],[0,-145],[90,-145],[0,55]].every(([dx,dy])=>world.isWalkable(p.x+dx,p.y+dy));});
  expect(suitable,cave.name).toBe(true);
 }
});
