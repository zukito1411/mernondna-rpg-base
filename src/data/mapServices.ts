import {INTERIOR_ENTRIES} from './interiors';
import {NPCS} from './npcs';
import {isBlacksmith} from './economy';
import type {NavigationMarker} from '../game/types';

export type MapService=NonNullable<NavigationMarker['service']>;
// Resolve authored roles once. A workshop is not necessarily a weapon smith.
export const MAP_INNS=new Map(INTERIOR_ENTRIES.filter(e=>e.profile==='inn').map(e=>[e.id,e]));
export const MAP_BLACKSMITHS=new Set(NPCS.filter(n=>isBlacksmith(n.id)).map(n=>n.id));
export const MAP_SERVICE_STYLE:Record<MapService,{name:string;short:string;color:string;symbol:string}>={
  home:{name:'Your home',short:'Home',color:'#aee0b2',symbol:'⌂'},
  cave:{name:'Cave / dungeon',short:'Cave',color:'#dfba83',symbol:'∩'},
  inn:{name:'Inn',short:'Inn',color:'#a9d9e5',symbol:'Z'},
  blacksmith:{name:'Blacksmith',short:'Smith',color:'#edb789',symbol:'H'},
  contracts:{name:'Notice board',short:'Board',color:'#ffe09b',symbol:'!'},
  harbor:{name:'Harbor',short:'Dock',color:'#9fc9f4',symbol:'≈'},
  shrine:{name:'Shrine',short:'Shrine',color:'#c9b4ed',symbol:'+'},
};
