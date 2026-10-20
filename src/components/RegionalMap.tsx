import {useEffect,useRef} from 'react';
import {useGameStore} from '../store/gameStore';
import {WorldGenerator} from '../game/systems/WorldGenerator';
import {ROAD_ROUTES} from '../data/roadRoutes';
import {TOWNS} from '../data/towns';
import {SETTLEMENT_LAYOUTS} from '../data/settlements';
import {ROYAL_WALL_LINES} from '../data/fortifications';
import {SETTLEMENT_DEFENSES} from '../data/settlementDefenses';
import type {TerrainKind} from '../game/types';
import {MAP_SERVICE_STYLE} from '../data/mapServices';
import {housingFor} from '../data/housing';
import {PLAYER_HOMES} from '../data/playerHomes';
import {TOWER_DOOR,TOWER_ENTRY_ID,towerCampaignComplete} from '../data/towerOfMight';

const world = new WorldGenerator();
const WIDTH = 900, HEIGHT = 540;
export const REGIONAL_SPAN_X = 14000, REGIONAL_SPAN_Y = 8400;
const colors:Record<TerrainKind,string>={grass:'#657c4e',forest:'#314d38',dirt:'#ab8d64',stone:'#999287',snow:'#d4dedf',ash:'#56535e',sand:'#c6ab71',water:'#285169',farmland:'#978849',marsh:'#657363',lava:'#b85835',ice:'#9fc8df'};

export function RegionalMap({select,center,coarse=false}:{
  select:(id:string,button:HTMLButtonElement)=>void;
  center:{x:number;y:number};
  coarse?:boolean;
}) {
  const ref=useRef<HTMLCanvasElement>(null);
  const x=useGameStore(s=>s.worldX),y=useGameStore(s=>s.worldY);
  const navigation=useGameStore(s=>s.navigation);
  const towerVisible=useGameStore(s=>towerCampaignComplete(s.quests));
  const housing=useGameStore(s=>s.housing),homes=PLAYER_HOMES.filter(h=>housingFor(housing,h.id).owned);
  const origin=center;
  const project=(px:number,py:number)=>({
    x:(px-origin.x+REGIONAL_SPAN_X/2)/REGIONAL_SPAN_X*100,
    y:(py-origin.y+REGIONAL_SPAN_Y/2)/REGIONAL_SPAN_Y*100,
  });
  useEffect(()=>{
    // REGIONAL_CANVAS_DETAIL_V2: render detailed terrain in short slices.
    // Do not calculate 100,000+ terrain samples in a single blocking React effect.
    const canvas=ref.current;
    if(!canvas)return;
    let stopped=false,animationFrame=0;
    const density=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    const physicalWidth=Math.round(WIDTH*density);
    const physicalHeight=Math.round(HEIGHT*density);
    // During dragging prioritize responsiveness. After pointer release, draw
    // four times as many terrain samples as the old 225x135 survey.
    const columns=coarse?135:450,rows=coarse?81:270;
    const cellWidth=WIDTH/columns,cellHeight=HEIGHT/rows;
    const buffer=document.createElement('canvas');
    buffer.width=physicalWidth;buffer.height=physicalHeight;
    const ctx=buffer.getContext('2d',{alpha:false});
    if(!ctx)return;
    ctx.setTransform(density,0,0,density,0,0);
    ctx.fillStyle=colors.grass;ctx.fillRect(0,0,WIDTH,HEIGHT);
    const point=(px:number,py:number)=>({
      x:(px-origin.x+REGIONAL_SPAN_X/2)/REGIONAL_SPAN_X*WIDTH,
      y:(py-origin.y+REGIONAL_SPAN_Y/2)/REGIONAL_SPAN_Y*HEIGHT,
    });
    let row=0;
    const line=(points:Array<{x:number;y:number}>,color:string,width:number)=>{
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      points.forEach((p,i)=>{const q=point(p.x,p.y);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);});ctx.stroke();
    };
    const publish=()=>{
      if(stopped)return;
      if(canvas.width!==physicalWidth||canvas.height!==physicalHeight){
        canvas.width=physicalWidth;canvas.height=physicalHeight;
      }
      const displayed=canvas.getContext('2d');
      if(!displayed)return;
      displayed.clearRect(0,0,physicalWidth,physicalHeight);
      displayed.drawImage(buffer,0,0);
    };
    const drawSlice=()=>{
      if(stopped)return;
      const start=performance.now();
      // Yield regularly instead of freezing the main game/render thread.
      while(row<rows&&performance.now()-start<5){
        for(let col=0;col<columns;col++){
          const terrain=world.getTerrainAt(
            origin.x-REGIONAL_SPAN_X/2+(col+.5)*REGIONAL_SPAN_X/columns,
            origin.y-REGIONAL_SPAN_Y/2+(row+.5)*REGIONAL_SPAN_Y/rows,
          );
          ctx.fillStyle=colors[terrain];
          ctx.fillRect(col*cellWidth,row*cellHeight,Math.ceil(cellWidth+.15),Math.ceil(cellHeight+.15));
        }
        row++;
      }
      if(row<rows){animationFrame=window.requestAnimationFrame(drawSlice);return;}
      for(const route of ROAD_ROUTES)line(route.points,'#dfbd81',3);
      for(const layout of SETTLEMENT_LAYOUTS){
        const town=TOWNS.find(t=>t.id===layout.townId);
        if(!town)continue;
        for(const street of layout.streets)line(street.points.map(p=>({x:p.x+town.world.x,y:p.y+town.world.y})),street.surface==='dirt'?'#b49a70':'#d7cdb5',street.width>=80?1.8:1.2);
      }
      for(const wall of ROYAL_WALL_LINES)line([wall.a,wall.b],'#302b26',2);
      for(const defense of SETTLEMENT_DEFENSES)for(const wall of defense.lines)line([wall.a,wall.b],'#302b26',2);
      publish();
    };
    animationFrame=window.requestAnimationFrame(drawSlice);
    return ()=>{stopped=true;window.cancelAnimationFrame(animationFrame);};
  },[origin.x,origin.y,coarse]);
  const player=project(x,y);
  return <div className="regional-map-wrap">
    <canvas ref={ref} width={WIDTH} height={HEIGHT} aria-label="Pannable regional terrain, connecting roads and river crossings"/>
    {homes.map(home=>{const p=project(home.door.x,home.door.y);return p.x>0&&p.x<100&&p.y>0&&p.y<100?
      <span key={home.id} className="regional-service" aria-label={home.homeName} title={home.homeName} style={{left:p.x+'%',top:p.y+'%',color:'#aee0b2'}}>⌂ Home</span>:null;})}
    {TOWNS.map(town=>{const p=project(town.world.x,town.world.y);return p.x>2&&p.x<98&&p.y>3&&p.y<97?
      <button key={town.id} type="button" className="regional-settlement" style={{left:p.x+'%',top:p.y+'%'}} aria-label={`Select ${town.name} for teleport`} title={town.name} onClick={e=>select(town.id,e.currentTarget)}><i aria-hidden="true" /></button>:null;})}
    {navigation.markers.filter(m=>!m.service&&(m.kind==='boss'||m.kind==='landmark')).map(m=>{const p=project(m.x,m.y);return p.x>0&&p.x<100&&p.y>0&&p.y<100?<span key={m.id} title={m.label} className="regional-poi" style={{left:p.x+'%',top:p.y+'%'}}>◇</span>:null;})}
    {[...navigation.markers.filter(m=>m.id!==TOWER_ENTRY_ID),...(towerVisible?[{id:TOWER_ENTRY_ID,kind:'landmark' as const,service:'tower' as const,label:'Tower of Might · north of Oakmere',...TOWER_DOOR}]:[])].map(m=>{
      if(!m.service||m.service==='home')return null;
      const p=project(m.x,m.y),style=MAP_SERVICE_STYLE[m.service];
      return p.x>0&&p.x<100&&p.y>0&&p.y<100?<span key={'service:'+m.id} tabIndex={0}
        className="regional-service" title={`${style.name}: ${m.label}`} aria-label={`${style.name}: ${m.label}`}
        style={{left:p.x+'%',top:p.y+'%',color:style.color}}>
        <b aria-hidden="true">{style.symbol}</b> {style.short}<small>{m.label}</small>
      </span>:null;
    })}
    {navigation.target&&(()=>{const destination=navigation.target.worldLocation??navigation.target,p=project(destination.x,destination.y);return p.x>0&&p.x<100&&p.y>0&&p.y<100?<span className="regional-quest" title={navigation.target.label} style={{left:p.x+'%',top:p.y+'%'}}>◆</span>:null;})()}
    {player.x>=0&&player.x<=100&&player.y>=0&&player.y<=100&&<span className="regional-player" style={{left:player.x+'%',top:player.y+'%',transform:`translate(-50%,-50%) rotate(${navigation.heading}rad)`}}>▲</span>}
    <span className="regional-north">N ↑ · drag to survey nearby regions</span>
  </div>;
}
