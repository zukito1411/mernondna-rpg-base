import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {useGameStore} from '../src/store/gameStore';
import {EDMUND_ATWOOD_ID} from '../src/data/npcs';
import {BREAKTHROUGH_ACCEPTED,BREAKTHROUGH_TRIAL,BREAKTHROUGH_COMPLETE} from '../src/data/breakthrough';
import {xpTotalForLevel} from '../src/data/progression';
import {allowExplicitNewGame,saveGame,parseSave,SAVE_KEY,setSaveSnapshotProvider} from '../src/utils/save';

function talk(){useGameStore.setState({panel:null,cinematic:null,dialogue:{npcId:EDMUND_ATWOOD_ID,lines:['Your training.'],lineIndex:0}});}
beforeEach(()=>{useGameStore.getState().resetGame();useGameStore.setState({cinematic:null,pendingCinematic:null});});
afterEach(()=>vi.unstubAllGlobals());
describe('Edmund breakthrough',()=>{
 it('holds XP at 50 until a new Varkhul victory is reported to Edmund',()=>{
  const act=useGameStore.getState();act.addRewards(1e6,0);
  expect(useGameStore.getState().level).toBe(50);
  talk();act.edmundBreakthrough();expect(useGameStore.getState().storyFlags[BREAKTHROUGH_ACCEPTED]).toBe(true);
  act.edmundBreakthrough();expect(useGameStore.getState().storyFlags[BREAKTHROUGH_COMPLETE]).toBeUndefined();
  act.recordEnemyDefeat('wolf',1,1);expect(useGameStore.getState().storyFlags[BREAKTHROUGH_TRIAL]).toBeUndefined();
  act.recordEnemyDefeat('ash-dragon',100,100,'varkhul');
  expect(useGameStore.getState().storyFlags[BREAKTHROUGH_TRIAL]).toBe(true);
  act.addRewards(1e6,0);expect(useGameStore.getState().level).toBe(50);
  useGameStore.setState({dialogue:null});act.edmundBreakthrough();expect(useGameStore.getState().storyFlags[BREAKTHROUGH_COMPLETE]).toBeUndefined();
  talk();act.edmundBreakthrough();act.addRewards(1e6,0);
  expect(useGameStore.getState()).toMatchObject({level:75,xp:xpTotalForLevel(75),statPoints:222,skillPoints:29});
 });
 it('does not count historic defeats or offer the trial below level 50',()=>{
  talk();useGameStore.getState().edmundBreakthrough();expect(useGameStore.getState().storyFlags[BREAKTHROUGH_ACCEPTED]).toBeUndefined();
  useGameStore.getState().recordEnemyDefeat('ash-dragon',0,0,'varkhul');
  useGameStore.getState().addRewards(1e6,0);talk();useGameStore.getState().edmundBreakthrough();
  expect(useGameStore.getState().storyFlags[BREAKTHROUGH_TRIAL]).toBeUndefined();
 });
 it('round-trips the breakthrough and level-60 Barrage loadout through saves',()=>{
  const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)});
  setSaveSnapshotProvider();allowExplicitNewGame();
  const act=useGameStore.getState();act.addRewards(1e6,0);talk();act.edmundBreakthrough();
  act.recordEnemyDefeat('ash-dragon',0,0,'varkhul');talk();act.edmundBreakthrough();
  act.addRewards(xpTotalForLevel(60)-xpTotalForLevel(50),0);useGameStore.setState({panel:'character',dialogue:null});act.setSkillSlot(3,'barrage');
  expect(saveGame()).toBe(true);const saved=values.get(SAVE_KEY)!;const parsed=parseSave(saved);
  expect(parsed?.state).toMatchObject({level:60,skillSlots:['azure-cleave','skyfall-slam','crown-rally','barrage'],storyFlags:{[BREAKTHROUGH_COMPLETE]:true}});
  act.resetGame();act.hydrate(parsed!.state);act.addRewards(1e6,0);expect(useGameStore.getState().level).toBe(75);
  const invalid=JSON.parse(saved);delete invalid.state.storyFlags[BREAKTHROUGH_COMPLETE];expect(parseSave(JSON.stringify(invalid))).toBeNull();
 });
});
