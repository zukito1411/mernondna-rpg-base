import {createNoise2D} from 'simplex-noise';
import {CHUNK_SIZE} from '../../data/world';
import {settlementAt} from '../../data/settlements';
import {seededRandom} from '../../utils/seededRandom';
import type {Vec2} from '../types';
import type {WorldGenerator} from './WorldGenerator';
import {ROAD_ROUTES} from '../../data/roadRoutes';
import {spriteBounds, rectTouchesStreet, overlaps, type Rect} from '../../data/settlementGeometry';
import {REGION_SCENERY} from '../../data/regionScenery';
import {treeScale, type TreeTexture} from '../../data/treeArt';
import {artFrameSize, type ArtTextureKey} from '../../data/art';

const standNoise=createNoise2D(seededRandom('mernondna:woodland-stands'));
export interface SceneryReservation extends Vec2 {bounds?:Rect}
export interface SceneryTree extends Vec2 {texture:TreeTexture;frame:0|1;scale:number;id:string}
const reservedBounds=(site:SceneryReservation):Rect=>site.bounds??{left:site.x-90,right:site.x+90,top:site.y-115,bottom:site.y+75};
function clearSite(bounds:Rect,world:WorldGenerator,reserved:SceneryReservation[],gap:number){
  if(reserved.some(p=>overlaps(bounds,reservedBounds(p),gap)))return false;
  if(ROAD_ROUTES.some(road=>rectTouchesStreet(bounds,road,gap)))return false;
  // Sample the middle too: a river can cross an otherwise dry rectangle.
  for(const x of [bounds.left,(bounds.left+bounds.right)/2,bounds.right])
    for(const y of [bounds.top,(bounds.top+bounds.bottom)/2,bounds.bottom])
      if(settlementAt(x,y)||!world.isWalkable(x,y)||world.isRoad(x,y,gap))return false;
  return true;
}
/** Deterministic stands, meadow openings and altitude breaks, not a uniform
 * forest carpet. Neighboring cell jitter keeps trunks >=128 world units apart. */
export function planWildernessTrees(chunkX:number,chunkY:number,world:WorldGenerator,reserved:SceneryReservation[]):SceneryTree[]{
  const rng=seededRandom(`${chunkX}:${chunkY}:woodland`),trees:SceneryTree[]=[];
  for(let row=0;row<6;row++)for(let col=0;col<6;col++){
    const x=chunkX*CHUNK_SIZE+col*256+64+rng()*128,y=chunkY*CHUNK_SIZE+row*256+64+rng()*128;
    if(settlementAt(x,y))continue;
    const terrain=world.getTerrainAt(x,y),region=world.getRegionAt(x,y),biome=world.getBiomeAt(x,y);
    const stand=standNoise(x*.0015,y*.0015),profile=REGION_SCENERY[region];
    if(region==='darkav'||region==='dead-sea'||biome==='dryland'||terrain==='water')continue;
    const cold=region==='nardorous'||region==='frostlands';
    if(!(terrain==='forest'&&stand>-.55||terrain==='grass'&&stand>.42||cold&&terrain==='snow'&&stand>.35))continue;
    const texture=cold?profile.treeTexture:'world_assets';
    const frame:0|1=cold?0:standNoise(x*.002+19,y*.002-31)>.45?1:0;
    const scale=treeScale(texture,frame,profile.treeHeight+(rng()-.5)*profile.treeVariation*2);
    if(!clearSite(spriteBounds(texture,frame,scale,x,y),world,reserved,24))continue;
    trees.push({id:`scenery:${chunkX}:${chunkY}:${col}:${row}`,x,y,texture,frame,scale});
  }
  return trees;
}

export interface SceneryDetail extends Vec2 {texture:ArtTextureKey;frame:number;scale:number;id:string;solid:boolean;footprint:{width:number;height:number}}
export function planWildernessDetails(chunkX:number,chunkY:number,world:WorldGenerator,reserved:SceneryReservation[]):SceneryDetail[]{
  const result:SceneryDetail[]=[],rng=seededRandom(`landscape:${chunkX}:${chunkY}`);
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    const x=chunkX*CHUNK_SIZE+(col+.25+rng()*.5)*192,y=chunkY*CHUNK_SIZE+(row+.25+rng()*.5)*192;
    if(settlementAt(x,y)||!world.isWalkable(x,y))continue;
    const biome=world.getBiomeAt(x,y),region=world.getRegionAt(x,y),patch=standNoise(x*.001,y*.001);
    if(patch<-.25||result.length>=40)continue;
    const profile=REGION_SCENERY[region];
    const rocky=biome==='highland'||biome==='snowfield'||biome==='volcanic';
    const bank=world.distanceToWater(x,y)<280;
    const choices:readonly import('../../data/regionScenery').HabitatObject[]=bank&&!rocky?
      [{texture:'woodland_props',frame:0,scale:.42}]:rocky?profile.rocky:biome==='forest'?profile.forest:profile.meadow;
    if(!choices.length)continue;
    const choice=choices[Math.floor(rng()*choices.length)],scale=choice.scale*(.88+rng()*.24);
    const bounds=spriteBounds(choice.texture,choice.frame,scale,x,y);
    const exclusions=[...reserved,...result.map(p=>({...p,bounds:spriteBounds(p.texture,p.frame,p.scale,p.x,p.y)}))];
    if(!clearSite(bounds,world,exclusions,20))continue;
    const size=artFrameSize(choice.texture,choice.frame);
    result.push({id:`habitat:${chunkX}:${chunkY}:${row}:${col}`,x,y,texture:choice.texture,frame:choice.frame,scale,
      solid:choice.solid??false,footprint:{width:size.width*scale*.52,height:Math.min(48,size.height*scale*.22)}});
  }return result;
}
