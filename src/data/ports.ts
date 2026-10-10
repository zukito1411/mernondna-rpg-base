import {TOWN_BY_ID} from './towns';
import {DRAINAGE} from './worldLandscape';
import type {Vec2} from '../game/types';

export interface Port {id:string;name:string;townId:string;landing:Vec2;quay:Vec2;boat:Vec2;channel:Vec2[];river:boolean;description:string}
const h=TOWN_BY_ID.highmere.world;
const island=(id:string):Port=>{
 const t=TOWN_BY_ID[id].world,boat={x:t.x+700,y:t.y+1220},landing={x:t.x+700,y:t.y+825};
 return {id,name:id==='tidewatch'?'Tidewatch Harbor':'Skallheim Harbor',townId:id,
  landing,quay:{x:landing.x,y:t.y+875},boat,channel:[boat,{x:boat.x,y:t.y+23000}],river:false,
  description:id==='tidewatch'?'The harbor crews carry grain, travelers and warnings across the sea.':'The beacon fleet keeps a passage open through the southern ice bay.'};
};
export const PORTS:Port[]=[
 {id:'highmere',name:'Highmere River Quay',townId:'highmere',landing:{x:h.x+720,y:h.y+1100},quay:{x:h.x+650,y:h.y+1100},boat:{x:h.x+558,y:h.y+1100},
  channel:[{x:h.x+558,y:h.y+1100},...DRAINAGE[0].points.slice(8)],river:true,
  description:'The river packet follows the Crown River to the sea. Ask the captain for passage to the islands.'},
 island('tidewatch'),island('skallheim'),
 {id:'blackspire',name:'Ashen Landing · Darkav',townId:'blackspire',landing:{x:162048,y:27616},quay:{x:162048,y:27616},boat:{x:162048,y:27976},
  channel:[{x:162048,y:27976},{x:162048,y:28744}],river:false,
  description:'The basalt shore is safe to land on. Follow the marked ash road north to Blackspire and the forge.'},
];
export const PORT_BY_ID=Object.fromEntries(PORTS.map(p=>[p.id,p])) as Record<string,Port>;
export const ASHEN_DOCK_ROAD=[TOWN_BY_ID.blackspire.world,{x:162048,y:TOWN_BY_ID.blackspire.world.y+2500},{x:162048,y:27616}];
