import {memo,useEffect,useMemo,useRef} from 'react';
import {useGameStore} from '../store/gameStore';
import {TOWNS} from '../data/towns';
import {WORLD_WIDTH,WORLD_HEIGHT} from '../data/world';
import {MAP_SERVICE_STYLE} from '../data/mapServices';
import {housingFor} from '../data/housing';
import {PLAYER_HOMES} from '../data/playerHomes';
import {TOWER_DOOR,TOWER_ENTRY_ID,towerCampaignComplete} from '../data/towerOfMight';
import {RegionalTileCache,REGIONAL_TILE_WORLD} from './regionalTileCache';

export const REGIONAL_SPAN_X=14000,REGIONAL_SPAN_Y=8400;
type MapPoint={x:number;y:number};
const worldPosition=(x:number,y:number)=>({
 left:(x/REGIONAL_SPAN_X*100)+'%',
 top:(y/REGIONAL_SPAN_Y*100)+'%',
});
const tileWidth=(REGIONAL_TILE_WORLD/REGIONAL_SPAN_X*100)+'%';
const tileHeight=(REGIONAL_TILE_WORLD/REGIONAL_SPAN_Y*100)+'%';

const RegionalTile=memo(function RegionalTile({tx,ty,cache}:{
 tx:number;ty:number;cache:RegionalTileCache;
}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!host.current)return;
  return cache.attach(tx,ty,host.current);
 },[cache,tx,ty]);
 return <div ref={host} className="regional-map-tile" aria-hidden="true" style={{
  left:(tx*REGIONAL_TILE_WORLD/REGIONAL_SPAN_X*100)+'%',
  top:(ty*REGIONAL_TILE_WORLD/REGIONAL_SPAN_Y*100)+'%',
  width:tileWidth,height:tileHeight,
 }}/>;
});

export function RegionalMap({select,center,zoom=1}:{
 select:(id:string,button:HTMLButtonElement)=>void;
 center:MapPoint;
 zoom?:number;
}){
 const cache=useMemo(()=>new RegionalTileCache(),[]);
 useEffect(()=>()=>cache.clear(),[cache]);
 useEffect(()=>{cache.focus(center.x,center.y);},[cache,center.x,center.y]);

 const halfX=REGIONAL_SPAN_X/(2*zoom),halfY=REGIONAL_SPAN_Y/(2*zoom);
 // One tile of prefetch in every direction; old tiles remain in an LRU cache.
 const west=Math.max(0,Math.floor((center.x-halfX)/REGIONAL_TILE_WORLD)-1);
 const east=Math.min(Math.ceil(WORLD_WIDTH/REGIONAL_TILE_WORLD)-1,
  Math.floor((center.x+halfX)/REGIONAL_TILE_WORLD)+1);
 const north=Math.max(0,Math.floor((center.y-halfY)/REGIONAL_TILE_WORLD)-1);
 const south=Math.min(Math.ceil(WORLD_HEIGHT/REGIONAL_TILE_WORLD)-1,
  Math.floor((center.y+halfY)/REGIONAL_TILE_WORLD)+1);
 const tiles=useMemo(()=>{
  const result:{tx:number;ty:number}[]=[];
  for(let ty=north;ty<=south;ty++)for(let tx=west;tx<=east;tx++)result.push({tx,ty});
  return result;
 },[west,east,north,south]);

 const x=useGameStore(s=>s.worldX),y=useGameStore(s=>s.worldY);
 const navigation=useGameStore(s=>s.navigation);
 const towerVisible=useGameStore(s=>towerCampaignComplete(s.quests));
 const housing=useGameStore(s=>s.housing);
 const homes=useMemo(()=>PLAYER_HOMES.filter(home=>housingFor(housing,home.id).owned),[housing]);
 const markers=navigation.markers;
 return <div className="regional-map-wrap" aria-label="Regional terrain map">
   <div className="regional-world-plane" style={{
    transform:'translate3d('+(-center.x/REGIONAL_SPAN_X*100)+'%, '+(-center.y/REGIONAL_SPAN_Y*100)+'%, 0)',
   }}>
    {tiles.map(tile=><RegionalTile key={tile.tx+':'+tile.ty} tx={tile.tx} ty={tile.ty} cache={cache}/>)}
    {homes.map(home=><span key={home.id} className="regional-service regional-home-pin"
      aria-label={home.homeName} title={home.homeName} style={worldPosition(home.door.x,home.door.y)}>⌂</span>)}
    {TOWNS.map(town=><button key={town.id} type="button" className="regional-settlement"
      style={worldPosition(town.world.x,town.world.y)}
      aria-label={'Select '+town.name+' for teleport'} title={town.name}
      onClick={event=>select(town.id,event.currentTarget)}><i aria-hidden="true"/></button>)}
    {markers.filter(marker=>!marker.service&&(marker.kind==='boss'||marker.kind==='landmark'))
      .map(marker=><span key={marker.id} title={marker.label} className="regional-poi"
        style={worldPosition(marker.x,marker.y)}>◇</span>)}
    {[...markers.filter(marker=>marker.id!==TOWER_ENTRY_ID),
      ...(towerVisible?[{id:TOWER_ENTRY_ID,kind:'landmark' as const,service:'tower' as const,
       label:'Tower of Might · north of Oakmere',...TOWER_DOOR}]:[])].map(marker=>{
       if(!marker.service||marker.service==='home')return null;
       const style=MAP_SERVICE_STYLE[marker.service];
       return <span key={'service:'+marker.id} className="regional-service"
         title={style.name+': '+marker.label} aria-label={style.name+': '+marker.label}
         style={{...worldPosition(marker.x,marker.y),color:style.color}}>
         <b aria-hidden="true">{style.symbol}</b>
       </span>;
      })}
    {navigation.target&&(()=>{
      const destination=navigation.target.worldLocation??navigation.target;
      return <span className="regional-quest" title={navigation.target.label}
        style={worldPosition(destination.x,destination.y)}>◆</span>;
    })()}
    <span className="regional-player" style={{
      ...worldPosition(x,y),transform:'translate(-50%,-50%) rotate('+navigation.heading+'rad)',
    }}>▲</span>
   </div>
   <span className="regional-north" aria-label="North is up">N ↑</span>
 </div>;
}