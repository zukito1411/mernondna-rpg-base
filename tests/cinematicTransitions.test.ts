import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {GameState} from '../src/store/gameStore';
import type {WorldScene} from '../src/game/scenes/WorldScene';
import {CinematicDirector} from '../src/game/systems/CinematicDirector';

const fixture=vi.hoisted(()=>({state:{} as GameState,load:vi.fn()}));
vi.mock('../src/store/gameStore',()=>({useGameStore:{getState:()=>fixture.state}}));
vi.mock('phaser',()=>({default:{Math:{Linear:(a:number,b:number,t:number)=>a+(b-a)*t}}}));
vi.mock('../src/game/systems/CinematicArtwork',()=>({loadCinematicArtwork:fixture.load}));
vi.mock('../src/data/cinematics',()=>({CINEMATICS:{sample:{id:'sample',title:'Sample',shots:[
  {x:100,y:100,zoom:1,duration:1,line:'First picture.',illustration:{page:'prologue-waiting',panel:0}},
  {x:100,y:100,zoom:1,duration:1,line:'Second picture.',illustration:{page:'prologue-waiting',panel:1}},
]}}}));

function sceneFixture(){
  const fades:Array<{onComplete:()=>void}>=[];
  const cover={setOrigin:()=>cover,setScrollFactor:()=>cover,setDepth:()=>cover,setName:()=>cover,
    setAlpha:()=>cover,setVisible:()=>cover,setPosition:()=>cover,setDisplaySize:()=>cover,destroy:vi.fn()};
  const camera={width:800,height:600,zoom:1,midPoint:{x:0,y:0},stopFollow:vi.fn(),startFollow:vi.fn(),
    setZoom:()=>camera,centerOn:()=>camera,preRender:vi.fn()};
  const scene={add:{rectangle:()=>cover},registry:{get:()=>1},cameras:{main:camera},
    tweens:{add:(config:{onComplete:()=>void})=>{fades.push(config);return {stop:vi.fn()};}},
    player:{x:0,y:0,resetInput:vi.fn()},physics:{world:{pause:vi.fn()}},
    beginCinematicView:vi.fn(),restoreCinematicLocation:vi.fn().mockResolvedValue(true),
    recoverCinematicLocation:vi.fn(),resumeAfterCinematic:vi.fn(),notify:vi.fn(),
    prepareCinematicShot:vi.fn().mockResolvedValue(true),cinematicTarget:()=>({x:100,y:100}),
    constrainCinematicCamera:(x:number,y:number,zoom:number)=>({x,y,zoom}),streamCinematicView:vi.fn(()=>true)};
  return {scene,fade:()=>{expect(fades.length).toBeGreaterThan(0);fades.shift()!.onComplete();},
    director:new CinematicDirector(scene as unknown as WorldScene)};
}
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
describe('cinematic fade lifecycle',()=>{
  beforeEach(()=>{
    fixture.state={cinematic:null,dialogue:null,panel:null,storyFlags:{},cinematicQueue:[],skipCinematicRequested:false,
      hydrate:(patch:Partial<GameState>)=>Object.assign(fixture.state,patch)} as unknown as GameState;
    fixture.load.mockReset().mockImplementation(()=>({promise:Promise.resolve(true),cancel:vi.fn()}));
  });
  afterEach(()=>vi.restoreAllMocks());
  it('changes pages only under the curtain and starts reading after the reveal',async()=>{
    const {director,fade}=sceneFixture();expect(director.start('sample')).toBe(true);
    expect(fixture.state.cinematic?.covered).toBe(true);expect(fixture.state.cinematic?.line).toBe('');
    fade();await settle();expect(fixture.state.cinematic?.line).toBe('First picture.');
    director.update(250);expect(fixture.state.cinematic?.line).toBe('First picture.');
    fade();for(let i=0;i<24;i++)director.update(250);
    expect(fixture.state.cinematic?.covered).toBe(true);expect(fixture.state.cinematic?.line).toBe('First picture.');
    fade();await settle();expect(fixture.state.cinematic?.line).toBe('Second picture.');
    expect(fixture.load).toHaveBeenCalledTimes(1);director.destroy();
  });
  it('cancels a loading illustration on skip and ignores its late completion',async()=>{
    let resolve!:(ready:boolean)=>void;const cancel=vi.fn();
    fixture.load.mockImplementation(()=>({promise:new Promise<boolean>(done=>{resolve=done;}),cancel}));
    const {director,fade,scene}=sceneFixture();director.start('sample');fade();
    fixture.state.skipCinematicRequested=true;director.update(16);expect(cancel).toHaveBeenCalledOnce();
    fade();await settle();director.update(16);resolve(true);await settle();fade();
    expect(director.active).toBe(false);expect(fixture.state.cinematic).toBeNull();
    expect(fixture.state.storyFlags['scene:sample']).toBe(true);
    expect(scene.restoreCinematicLocation).toHaveBeenCalledOnce();expect(scene.resumeAfterCinematic).toHaveBeenCalledOnce();
  });
  it('falls back to the prepared world and retains narration when artwork fails',async()=>{
    fixture.load.mockImplementation(()=>({promise:Promise.resolve(false),cancel:vi.fn()}));
    const {director,fade,scene}=sceneFixture();director.start('sample');fade();await settle();
    director.update(16);expect(scene.prepareCinematicShot).toHaveBeenCalledOnce();
    expect(fixture.state.cinematic?.ready).toBe(true);expect(fixture.state.cinematic?.illustration).toBeUndefined();
    expect(fixture.state.cinematic?.line).toBe('First picture.');fade();director.destroy();
  });
});
