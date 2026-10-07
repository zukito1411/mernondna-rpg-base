import type { SpriteSource, SpriteAnimation } from './animationPacks';
type Region = readonly [number,number,number,number];
export interface SpriteBoard { key:string; path:string; regions:readonly Region[]; frameWidth:number; frameHeight:number; scale:number }
// Connected alpha-component bounds, not assumed 256px cells. Some polearms
// and sword swings cross cell boundaries; preserve those complete poses.
export const SPRITE_BOARDS:readonly SpriteBoard[] = [
  { key:'npc_blacksmith',path:'assets/npcs/blacksmith/blacksmith.png',frameWidth:96,frameHeight:80,scale:76/221,regions:[
    [36,40,199,219],[300,45,190,214],[552,44,197,215],[808,39,196,220],[1068,45,193,214],[1322,44,188,215],
    [33,295,183,217],[288,296,188,217],[535,295,192,217],[793,295,191,218],[1051,295,192,219],[1307,296,180,217],
    [38,541,197,221],[288,541,200,220],[552,544,193,218],[810,544,194,218],[1061,543,195,219],[1318,544,193,217],
    [37,776,193,211],[299,776,189,216],[554,781,191,211],[805,776,195,216],[1066,780,191,212],[1321,780,186,212]] },
  { key:'npc_adventurer',path:'assets/npcs/adventurer_male/adventurer_male.png',frameWidth:96,frameHeight:80,scale:76/231,regions:[
    [116,41,154,231],[344,41,155,231],[575,41,154,231],[803,41,156,231],[1033,41,154,231],[1261,41,157,231],
    [127,291,156,219],[353,290,154,220],[585,290,153,220],[816,291,157,219],[1044,290,153,220],[1275,290,151,221],
    [103,538,153,219],[332,538,154,219],[560,538,156,220],[791,538,154,219],[1021,538,153,219],[1249,538,158,219],
    [117,780,150,222],[346,780,147,222],[576,780,148,222],[807,780,146,222],[1036,780,151,222],[1265,780,153,222]] },
  { key:'npc_attendant',path:'assets/npcs/attendant_woman/attendant_woman.png',frameWidth:96,frameHeight:80,scale:76/221,regions:[
    [78,34,126,221],[325,34,126,221],[575,34,132,218],[826,34,132,221],[1084,34,130,219],[1337,34,129,218],
    [73,284,143,215],[320,284,135,215],[563,281,144,218],[823,284,147,215],[1084,281,134,217],[1330,281,141,218],
    [57,534,141,217],[310,532,137,219],[558,533,143,219],[814,533,149,219],[1076,532,133,219],[1321,534,143,217],
    [70,777,125,217],[317,776,129,218],[567,777,131,217],[820,777,129,217],[1074,777,132,217],[1327,777,128,217]] },
  { key:'npc_general',path:'assets/npcs/general/general.png',frameWidth:96,frameHeight:80,scale:76/235,regions:[
    [47,31,174,235],[303,31,178,235],[558,31,176,235],[813,31,173,235],[1065,31,176,235],[1317,31,178,235],
    [71,279,177,227],[327,280,173,226],[584,279,173,226],[834,280,178,226],[1090,281,174,225],[1348,281,167,225],
    [33,526,178,224],[288,526,179,224],[543,527,179,223],[795,528,181,222],[1054,526,178,224],[1306,528,178,223],
    [50,766,170,235],[304,766,177,235],[561,766,171,235],[816,766,170,235],[1072,766,176,235],[1325,766,170,235]] },
  { key:'npc_huntress',path:'assets/npcs/huntress/huntress.png',frameWidth:96,frameHeight:80,scale:76/233,regions:[
    [51,27,185,232],[300,27,189,232],[546,27,192,232],[802,27,189,232],[1048,28,194,231],[1299,26,190,233],
    [51,272,194,220],[292,272,206,220],[545,271,199,223],[794,271,202,223],[1040,272,209,222],[1294,272,203,221],
    [51,513,200,228],[294,512,209,229],[551,513,202,229],[798,515,203,227],[1049,514,203,227],[1297,514,203,227],
    [55,753,191,230],[304,753,194,230],[555,753,187,233],[803,754,191,232],[1055,753,194,233],[1304,753,192,233]] },
  // Taller canvas accommodates the pike; do not shrink the guard to weapon height.
  { key:'npc_royal_guard',path:'assets/npcs/royal_guard/royal_guard.png',frameWidth:96,frameHeight:112,scale:76/196,regions:[
    [84,4,184,254],[299,4,177,260],[521,4,179,260],[771,4,183,256],[1024,4,179,260],[1261,4,175,260],
    [78,267,196,234],[301,267,200,239],[523,267,210,239],[776,267,210,241],[1019,267,216,239],[1264,267,195,239],
    [61,508,207,239],[273,508,218,241],[509,508,214,238],[759,509,217,240],[1004,508,218,241],[1246,508,212,241],
    [81,745,178,251],[301,745,182,251],[528,745,184,257],[785,746,186,251],[1034,746,176,253],[1263,748,179,249]] },
  { key:'npc_villager',path:'assets/npcs/villager_woman/villager_woman.png',frameWidth:96,frameHeight:80,scale:76/239,regions:[
    [113,12,161,236],[348,11,156,237],[582,12,153,236],[813,10,158,238],[1046,11,159,237],[1280,12,153,236],
    [104,262,170,235],[346,258,169,238],[574,258,168,239],[812,259,164,238],[1042,258,172,239],[1279,262,171,234],
    [101,510,173,239],[332,510,174,239],[566,511,171,238],[802,512,169,238],[1033,510,175,239],[1262,512,178,237],
    [113,763,163,237],[343,763,164,238],[578,763,161,238],[803,763,169,238],[1033,764,168,239],[1266,765,169,238]] },
  { key:'leigneron_attack',path:'assets/characters/leigneron/attack.png',frameWidth:128,frameHeight:104,scale:76/207,regions:[
    [48,82,169,207],[287,59,179,230],[557,88,203,201],[812,88,253,201],[1083,91,210,198],[1321,86,169,203],
    [44,328,173,198],[312,309,181,217],[504,330,246,196],[765,330,271,196],[1070,320,210,206],[1325,328,168,198],
    [54,558,168,203],[287,545,172,217],[536,560,239,202],[803,564,261,198],[1076,554,217,208],[1327,558,165,203],
    [44,786,179,197],[292,772,186,211],[548,783,212,200],[801,790,237,193],[1067,772,211,211],[1321,789,184,194]] },
];
export function boardSources(board:SpriteBoard):SpriteSource[] {
  return board.regions.map((cell,i) => ({ path:board.path,cell,imageSize:[1536,1024],name:`${board.key}:${i}`,renderScale:board.scale }));
}
export const PLAYER_ATTACK_ANIMATIONS:SpriteAnimation[] = ['down','left','right','up'].map((direction,row) => ({
  key:`leigneron-attack-${direction}`,texture:'leigneron_attack',frames:Array.from({ length:6 },(_,i) => row * 6 + i),frameRate:18,repeat:0,
}));
export const PLAYER_IDLE_ANIMATION:SpriteAnimation = {
  key:'leigneron-idle',texture:'leigneron_idle',frames:Array.from({ length:6 },(_,i) => i),frameRate:2,repeat:-1,
};
export const PLAYER_EFFECTS = [
  { name:'fortification',path:'assets/characters/leigneron/effects/fortification_effect.png' },
  { name:'hit',path:'assets/characters/leigneron/effects/hit_effect.png' },
  { name:'heal',path:'assets/characters/leigneron/effects/heal_effect.png' },
  { name:'slash',path:'assets/characters/leigneron/effects/slash_effect.png' },
  { name:'teleport',path:'assets/characters/leigneron/effects/teleport_effect.png' },
] as const;
export const PLAYER_EFFECT_ANIMATIONS:SpriteAnimation[] = PLAYER_EFFECTS.map(({ name }) => ({
  key:`effect-${name}`,texture:`effect_${name}`,frames:Array.from({ length:6 },(_,i) => i),frameRate:18,repeat:0,
}));
