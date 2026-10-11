import {useEffect,useRef} from 'react';
import {useGameStore} from '../store/gameStore';
import {WorldGenerator} from '../game/systems/WorldGenerator';
import {ROAD_ROUTES} from '../data/roadRoutes';
import {TOWNS} from '../data/towns';
import {SETTLEMENT_LAYOUTS} from '../data/settlements';
import {ROYAL_WALL_LINES} from '../data/fortifications';
import {SETTLEMENT_DEFENSES} from '../data/settlementDefenses';
import type {TerrainKind} from '../game/types';

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
  const origin=center;
  const project=(px:number,py:number)=>({
    x:(px-origin.x+REGIONAL_SPAN_X/2)/REGIONAL_SPAN_X*100,
    y:(py-origin.y+REGIONAL_SPAN_Y/2)/REGIONAL_SPAN_Y*100,
  });
  useEffect(()=>{
    const ctx=ref.current?.getContext('2d');if(!ctx)return;
    const point=(px:number,py:number)=>({
      x:(px-origin.x+REGIONAL_SPAN_X/2)/REGIONAL_SPAN_X*WIDTH,
      y:(py-origin.y+REGIONAL_SPAN_Y/2)/REGIONAL_SPAN_Y*HEIGHT,
    });
    // Fewer samples while panning keep mobile touch movement responsive.
    const columns=coarse?120:225,rows=coarse?72:135;
    const cellWidth=WIDTH/columns,cellHeight=HEIGHT/rows;
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const terrain=world.getTerrainAt(
        origin.x-REGIONAL_SPAN_X/2+(col+.5)*REGIONAL_SPAN_X/columns,
        origin.y-REGIONAL_SPAN_Y/2+(row+.5)*REGIONAL_SPAN_Y/rows,
      );
      ctx.fillStyle=colors[terrain];
      ctx.fillRect(col*cellWidth,row*cellHeight,Math.ceil(cellWidth),Math.ceil(cellHeight));
    }
    const line=(points:Array<{x:number;y:number}>,color:string,width:number)=>{
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();
      points.forEach((p,i)=>{const q=point(p.x,p.y);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);});ctx.stroke();
    };
    for(const route of ROAD_ROUTES)line(route.points,'#dfbd81',3);
    for(const layout of SETTLEMENT_LAYOUTS){
      const town=TOWNS.find(t=>t.id===layout.townId);
      if(!town)continue;
      for(const street of layout.streets)line(street.points.map(p=>({x:p.x+town.world.x,y:p.y+town.world.y})),street.surface==='dirt'?'#b49a70':'#d7cdb5',street.width>=80?1.8:1.2);
    }
    for(const wall of ROYAL_WALL_LINES)line([wall.a,wall.b],'#302b26',2);
    for(const defense of SETTLEMENT_DEFENSES)for(const wall of defense.lines)line([wall.a,wall.b],'#302b26',2);
  },[origin.x,origin.y,coarse]);
  const player=project(x,y);
  return <div className="regional-map-wrap">
    <canvas ref={ref} width={WIDTH} height={HEIGHT} aria-label="Pannable regional terrain, connecting roads and river crossings"/>
    {TOWNS.map(town=>{const p=project(town.world.x,town.world.y);return p.x>2&&p.x<98&&p.y>3&&p.y<97?
      <button key={town.id} type="button" className="regional-settlement" style={{left:p.x+'%',top:p.y+'%'}} aria-label={`Select ${town.name} for teleport`} title={town.name} onClick={e=>select(town.id,e.currentTarget)}><i aria-hidden="true" /></button>:null;})}
    {navigation.markers.filter(m=>m.kind==='boss'||m.kind==='landmark').map(m=>{const p=project(m.x,m.y);return p.x>0&&p.x<100&&p.y>0&&p.y<100?<span key={m.id} title={m.label} className="regional-poi" style={{left:p.x+'%',top:p.y+'%'}}>◇</span>:null;})}
    {navigation.target&&(()=>{const p=project(navigation.target.x,navigation.target.y);return p.x>0&&p.x<100&&p.y>0&&p.y<100?<span className="regional-quest" style={{left:p.x+'%',top:p.y+'%'}}>◆</span>:null;})()}
    {player.x>=0&&player.x<=100&&player.y>=0&&player.y<=100&&<span className="regional-player" style={{left:player.x+'%',top:player.y+'%',transform:`translate(-50%,-50%) rotate(${navigation.heading}rad)`}}>▲</span>}
    <span className="regional-north">N ↑ · drag to survey nearby regions</span>
  </div>;
}
