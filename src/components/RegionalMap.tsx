import {useEffect,useRef} from 'react';
import {useGameStore} from '../store/gameStore';
import {WorldGenerator} from '../game/systems/WorldGenerator';
import {ROAD_ROUTES} from '../data/roadRoutes';
import {TOWNS} from '../data/towns';
import {SETTLEMENT_LAYOUTS} from '../data/settlements';
import {ROYAL_WALL_LINES} from '../data/fortifications';
import {SETTLEMENT_DEFENSES} from '../data/settlementDefenses';
import type {TerrainKind} from '../game/types';

const world=new WorldGenerator(),WIDTH=900,HEIGHT=540,SPAN_X=14000,SPAN_Y=8400;
const colors:Record<TerrainKind,string>={grass:'#657c4e',forest:'#314d38',dirt:'#ab8d64',stone:'#999287',snow:'#d4dedf',ash:'#56535e',sand:'#c6ab71',water:'#285169',farmland:'#978849'};
export function RegionalMap({select}:{select:(id:string,button:HTMLButtonElement)=>void}) {
  const ref=useRef<HTMLCanvasElement>(null),x=useGameStore(s=>s.worldX),y=useGameStore(s=>s.worldY),navigation=useGameStore(s=>s.navigation);
  const origin={x:Math.floor(x/512)*512,y:Math.floor(y/512)*512};
  const project=(px:number,py:number)=>({x:(px-origin.x+SPAN_X/2)/SPAN_X*100,y:(py-origin.y+SPAN_Y/2)/SPAN_Y*100});
  useEffect(()=>{
    const ctx=ref.current?.getContext('2d');if(!ctx)return;
    const point=(px:number,py:number)=>({x:(px-origin.x+SPAN_X/2)/SPAN_X*WIDTH,y:(py-origin.y+SPAN_Y/2)/SPAN_Y*HEIGHT});
    for(let row=0;row<90;row++)for(let col=0;col<150;col++){
      ctx.fillStyle=colors[world.getTerrainAt(origin.x-SPAN_X/2+(col+.5)*SPAN_X/150,origin.y-SPAN_Y/2+(row+.5)*SPAN_Y/90)];
      ctx.fillRect(col*6,row*6,6,6);
    }
    const line=(points:Array<{x:number;y:number}>,color:string,width:number)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>{const q=point(p.x,p.y);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);});ctx.stroke();};
    for(const route of ROAD_ROUTES)line(route.points,'#dfbd81',3);
    for(const layout of SETTLEMENT_LAYOUTS){const town=TOWNS.find(t=>t.id===layout.townId)!;
      for(const street of layout.streets)line(street.points.map(p=>({x:p.x+town.world.x,y:p.y+town.world.y})),'#d7cdb5',1.6);}
    for(const wall of ROYAL_WALL_LINES)line([wall.a,wall.b],'#302b26',2);
    for(const defense of SETTLEMENT_DEFENSES)for(const wall of defense.lines)line([wall.a,wall.b],'#302b26',2);
  },[origin.x,origin.y]);
  const player=project(x,y);
  return <div className="regional-map-wrap">
    <canvas ref={ref} width={WIDTH} height={HEIGHT} aria-label="Expanded regional terrain, streets and river crossings"/>
    {TOWNS.map(town=>{const p=project(town.world.x,town.world.y);return p.x>2&&p.x<98&&p.y>3&&p.y<97?
      <button key={town.id} className="regional-settlement" style={{left:p.x+'%',top:p.y+'%'}} aria-label={`Select ${town.name} for teleport`} onClick={e=>select(town.id,e.currentTarget)}>{town.name}</button>:null;})}
    {navigation.markers.filter(m=>m.kind==='boss'||m.kind==='landmark').map(m=>{const p=project(m.x,m.y);return p.x>0&&p.x<100&&p.y>0&&p.y<100?<span key={m.id} title={m.label} className="regional-poi" style={{left:p.x+'%',top:p.y+'%'}}>◇</span>:null;})}
    {navigation.target&&(()=>{const p=project(navigation.target.x,navigation.target.y);return p.x>0&&p.x<100&&p.y>0&&p.y<100?<span className="regional-quest" style={{left:p.x+'%',top:p.y+'%'}}>◆</span>:null;})()}
    <span className="regional-player" style={{left:player.x+'%',top:player.y+'%',transform:`translate(-50%,-50%) rotate(${navigation.heading}rad)`}}>▲</span>
    <span className="regional-north">N ↑ · surrounding terrain and roads</span>
  </div>;
}
