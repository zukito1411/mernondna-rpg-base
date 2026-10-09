import {CHUNK_SIZE} from '../../data/world';
import {WILDERNESS_SITES} from '../../data/wildernessSites';
import {SCENIC_LAKES} from '../../data/landscapeFeatures';
import {LAVA_FLOW} from '../../data/worldLandscape';
import {ROAD_ROUTES} from '../../data/roadRoutes';
import {spriteBounds,overlaps,rectTouchesStreet} from '../../data/settlementGeometry';
import {artFrameSize,type ArtTextureKey} from '../../data/art';
import type {RegionId,Vec2} from '../types';
import type {WorldGenerator} from './WorldGenerator';
import type {SceneryDetail} from './sceneryPlan';
import {settlementAt} from '../../data/settlements';
import {WORLD_CONTENT} from '../../data/content';

interface Piece {texture:ArtTextureKey;frame:number;scale:number;dx:number;dy:number;solid?:boolean}
const piece=(texture:ArtTextureKey,frame:number,scale:number,dx:number,dy:number,solid=true):Piece=>({texture,frame,scale,dx,dy,solid});
function dressing(region:RegionId,style:string):Piece[]{
  if(region==='rindass')return [piece('desert_props',style==='ruin'?11:9,1.1,-340,-260),
    piece('desert_props',8,.52,240,-60),piece('desert_props',6,.7,350,160),piece('desert_props',7,.48,-170,200)];
  if(region==='nardorous'||region==='frostlands')return [piece('climate_props',5,.7,-230,-180),piece('climate_props',2,.7,310,-140),
    piece('climate_props',4,.8,280,150),piece('climate_props',3,.85,-320,170)];
  if(region==='darkav')return [piece('climate_props',10,1,-280,-220),piece('climate_props',9,.7,220,-170),piece('climate_props',7,1.2,360,120)];
  if(style==='camp')return [piece('desert_props',9,.96,-330,-230),piece('desert_props',8,.5,250,-30),
    piece('desert_props',6,.66,300,170),piece('woodland_props',7,.42,-250,170)];
  if(style==='grove')return [piece('woodland_props',7,.8,-260,-180),piece('woodland_props',10,.3,240,140,false),
    piece('woodland_props',2,.45,-190,160,false),piece('woodland_props',5,1.1,300,-120)];
  return [piece('woodland_props',9,1,-270,-170),piece('woodland_props',6,.8,300,130),
    piece('woodland_props',8,.65,240,-180),piece('woodland_props',11,.46,-190,200)];
}
/** Small designed compositions at existing story discoveries and lake shores.
 * Deterministic fitting, dry banks and access reservations precede decoration.
 * Visual dressing unloads with chunks; discovery flags remain in the ledger. */
export function planLandmarkScenery(chunkX:number,chunkY:number,world:WorldGenerator,includeNeighbors=false):SceneryDetail[]{
  const result:SceneryDetail[]=[];
  const home=(p:Vec2)=>Math.floor(p.x/CHUNK_SIZE)===chunkX&&Math.floor(p.y/CHUNK_SIZE)===chunkY;
  const nearby=(p:Vec2)=>Math.abs(p.x-(chunkX+.5)*CHUNK_SIZE)<CHUNK_SIZE/2+1000&&Math.abs(p.y-(chunkY+.5)*CHUNK_SIZE)<CHUNK_SIZE/2+1000;
  const add=(id:string,anchor:Vec2,item:Piece,lava=false)=>{
    const preferred={x:anchor.x+item.dx,y:anchor.y+item.dy};
    const slots=[preferred,...[64,128,192].flatMap(radius=>Array.from({length:8},(_,i)=>({x:preferred.x+Math.cos(i*Math.PI/4)*radius,y:preferred.y+Math.sin(i*Math.PI/4)*radius})))];
    // Global authored reservations make cross-seam fitting independent of
    // which adjacent chunk happened to load first. Calculate once per piece.
    const bounds=WORLD_CONTENT.filter(s=>Math.abs(s.world.x-anchor.x)<1100&&Math.abs(s.world.y-anchor.y)<1100)
      .map(s=>'frame' in s?spriteBounds(s.texture??'world_objects',s.frame,s.scale??1,s.world.x,s.world.y):
        {left:s.world.x-70,right:s.world.x+70,top:s.world.y-90,bottom:s.world.y+70});
    const occupied=[...bounds,...result.map(s=>spriteBounds(s.texture,s.frame,s.scale,s.x,s.y))];
    const position=slots.find(p=>{
      const r=spriteBounds(item.texture,item.frame,item.scale,p.x,p.y);
      if(ROAD_ROUTES.some(road=>rectTouchesStreet(r,road,30)))return false;
      if(occupied.some(b=>overlaps(r,b,24)))return false;
      return [r.left,(r.left+r.right)/2,r.right].every(x=>[r.top,(r.top+r.bottom)/2,r.bottom].every(y=>
        !settlementAt(x,y)&&(lava?world.getTerrainAt(x,y)==='lava':world.isWalkable(x,y)&&!world.isRoad(x,y,30))));
    });
    if(!position)return;
    const size=artFrameSize(item.texture,item.frame);
    result.push({...position,id:'scenic:'+id,texture:item.texture,frame:item.frame,scale:item.scale,solid:item.solid??false,
      footprint:{width:size.width*item.scale*.6,height:Math.min(56,size.height*item.scale*.25)}});
  };
  // Each piece belongs to its actual chunk, including groups across seams.
  for(const site of WILDERNESS_SITES){if(!nearby(site.world))continue;
    dressing(world.getRegionAt(site.world.x,site.world.y),site.style).forEach((item,i)=>add(site.id+':'+i,site.world,item));}
  for(const lake of SCENIC_LAKES){if(!nearby(lake))continue;
    const anchor={x:lake.x-lake.rx-130,y:lake.y+100};
    const pieces=lake.frozen?[piece('climate_props',2,.85,0,-120),piece('climate_props',3,.85,-130,170)]:
      [piece('woodland_props',0,.55,0,40,false),piece('woodland_props',6,.78,-210,190),piece('woodland_props',8,.6,-150,-80)];
    pieces.forEach((item,i)=>add(lake.id+':'+i,anchor,item));}
  // The lava-pool artwork sits only on real non-walkable lava, never across
  // safe roads. No extra invisible pool collider is needed.
  for(let i=1;i<LAVA_FLOW.length;i++){const a=LAVA_FLOW[i-1],b=LAVA_FLOW[i],p={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    if(nearby(p))add('lava-fissure:'+i,{x:p.x,y:p.y+55},piece('climate_props',11,.7,0,0,false),true);}
  return includeNeighbors?result:result.filter(home);
}
