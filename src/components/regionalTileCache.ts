import {WorldGenerator} from '../game/systems/WorldGenerator';
import {ROAD_ROUTES} from '../data/roadRoutes';
import {TOWN_BY_ID} from '../data/towns';
import {SETTLEMENT_LAYOUTS} from '../data/settlements';
import {ROYAL_WALL_LINES} from '../data/fortifications';
import {SETTLEMENT_DEFENSES} from '../data/settlementDefenses';
import type {TerrainKind} from '../game/types';

// Tile edges are fixed in world space: neither dragging nor zooming
// recalculates terrain that has already been drawn.
export const REGIONAL_TILE_WORLD=4096;
export const REGIONAL_TILE_PIXELS=256;
const SAMPLE_GRID=128;
const SAMPLE_PIXEL=REGIONAL_TILE_PIXELS/SAMPLE_GRID;
const MAX_CACHED_TILES=40;
const FRAME_BUDGET_MS=3.5;

const TERRAIN_COLORS:Record<TerrainKind,string>={
 grass:'#657c4e',forest:'#314d38',dirt:'#ab8d64',stone:'#999287',
 snow:'#d4dedf',ash:'#56535e',sand:'#c6ab71',water:'#285169',
 farmland:'#978849',marsh:'#657363',lava:'#b85835',ice:'#9fc8df',
};
type Point={x:number;y:number};
interface Linework {
 points:readonly Point[];color:string;width:number;
 minX:number;maxX:number;minY:number;maxY:number;
}
function makeLine(points:readonly Point[],color:string,width:number):Linework|null{
 if(points.length<2)return null;
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const p of points){
  minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);
  minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
 }
 return {points,color,width,minX,maxX,minY,maxY};
}
function makeLinework():Linework[]{
 const output:Linework[]=[];
 const add=(points:readonly Point[],color:string,width:number)=>{
  const line=makeLine(points,color,width);if(line)output.push(line);
 };
 for(const route of ROAD_ROUTES)add(route.points,'#dfbd81',3);
 for(const layout of SETTLEMENT_LAYOUTS){
  const town=TOWN_BY_ID[layout.townId];
  if(!town)continue;
  for(const street of layout.streets){
   add(street.points.map(p=>({x:p.x+town.world.x,y:p.y+town.world.y})),
    street.surface==='dirt'?'#b49a70':'#d7cdb5',street.width>=80?1.8:1.2);
  }
 }
 for(const wall of ROYAL_WALL_LINES)add([wall.a,wall.b],'#302b26',2);
 for(const defense of SETTLEMENT_DEFENSES)for(const wall of defense.lines)add([wall.a,wall.b],'#302b26',2);
 return output;
}
const LINEWORK=makeLinework();

interface Tile {
 key:string;tx:number;ty:number;canvas:HTMLCanvasElement;
 ctx:CanvasRenderingContext2D|null;row:number;finished:boolean;
 attached:boolean;used:number;
}
const tileKey=(tx:number,ty:number)=>tx+':'+ty;

/** Owns only visible/nearby world-space canvases. No separate render loop,
 * worker, React state store, or unbounded full-world terrain atlas. */
export class RegionalTileCache {
 private readonly generator=new WorldGenerator();
 private readonly tiles=new Map<string,Tile>();
 private frame=0;
 private sequence=0;
 private focusX=0;
 private focusY=0;

 focus(x:number,y:number){
  this.focusX=x;this.focusY=y;
  this.schedule();
 }
 attach(tx:number,ty:number,host:HTMLElement){
  const key=tileKey(tx,ty);
  let tile=this.tiles.get(key);
  if(!tile){
   const canvas=document.createElement('canvas');
   canvas.width=REGIONAL_TILE_PIXELS;canvas.height=REGIONAL_TILE_PIXELS;
   canvas.setAttribute('aria-hidden','true');
   const ctx=canvas.getContext('2d',{alpha:false});
   if(ctx){ctx.fillStyle=TERRAIN_COLORS.grass;ctx.fillRect(0,0,REGIONAL_TILE_PIXELS,REGIONAL_TILE_PIXELS);}
   tile={key,tx,ty,canvas,ctx,row:0,finished:!ctx,attached:false,used:0};
   this.tiles.set(key,tile);
  }
  tile.attached=true;
  tile.used=++this.sequence;
  host.replaceChildren(tile.canvas);
  this.trim();
  this.schedule();
  return ()=>{
   if(tile.canvas.parentElement===host)host.removeChild(tile.canvas);
   tile.attached=false;
   tile.used=++this.sequence;
   this.trim();
  };
 }
 private schedule(){
  if(this.frame||![...this.tiles.values()].some(tile=>tile.attached&&!tile.finished))return;
  this.frame=window.requestAnimationFrame(this.draw);
 }
 private draw=()=>{
  this.frame=0;
  const pending=[...this.tiles.values()].filter(tile=>tile.attached&&!tile.finished);
  if(!pending.length)return;
  pending.sort((a,b)=>{
   const ax=a.tx*REGIONAL_TILE_WORLD+REGIONAL_TILE_WORLD/2-this.focusX;
   const ay=a.ty*REGIONAL_TILE_WORLD+REGIONAL_TILE_WORLD/2-this.focusY;
   const bx=b.tx*REGIONAL_TILE_WORLD+REGIONAL_TILE_WORLD/2-this.focusX;
   const by=b.ty*REGIONAL_TILE_WORLD+REGIONAL_TILE_WORLD/2-this.focusY;
   return ax*ax+ay*ay-bx*bx-by*by;
  });
  const current=pending[0],start=performance.now();
  while(current.row<SAMPLE_GRID&&performance.now()-start<FRAME_BUDGET_MS)
   this.drawRow(current);
  if(current.row===SAMPLE_GRID){
   this.drawRoads(current);
   current.finished=true;
  }
  this.schedule();
 };
 private drawRow(tile:Tile){
  const ctx=tile.ctx;if(!ctx){tile.row=SAMPLE_GRID;return;}
  const baseX=tile.tx*REGIONAL_TILE_WORLD,baseY=tile.ty*REGIONAL_TILE_WORLD;
  const y=baseY+(tile.row+.5)*REGIONAL_TILE_WORLD/SAMPLE_GRID;
  for(let col=0;col<SAMPLE_GRID;col++){
   const x=baseX+(col+.5)*REGIONAL_TILE_WORLD/SAMPLE_GRID;
   const terrain=this.generator.getTerrainAt(x,y);
   ctx.fillStyle=TERRAIN_COLORS[terrain];
   ctx.fillRect(col*SAMPLE_PIXEL,tile.row*SAMPLE_PIXEL,SAMPLE_PIXEL,SAMPLE_PIXEL);
  }
  tile.row++;
 }
 private drawRoads(tile:Tile){
  const ctx=tile.ctx;if(!ctx)return;
  const left=tile.tx*REGIONAL_TILE_WORLD,top=tile.ty*REGIONAL_TILE_WORLD;
  const right=left+REGIONAL_TILE_WORLD,bottom=top+REGIONAL_TILE_WORLD;
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,REGIONAL_TILE_PIXELS,REGIONAL_TILE_PIXELS);ctx.clip();
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const line of LINEWORK){
   if(line.maxX<left-64||line.minX>right+64||line.maxY<top-64||line.minY>bottom+64)continue;
   ctx.strokeStyle=line.color;ctx.lineWidth=line.width;
   ctx.beginPath();
   line.points.forEach((point,index)=>{
    const x=(point.x-left)/REGIONAL_TILE_WORLD*REGIONAL_TILE_PIXELS;
    const y=(point.y-top)/REGIONAL_TILE_WORLD*REGIONAL_TILE_PIXELS;
    if(index)ctx.lineTo(x,y);else ctx.moveTo(x,y);
   });
   ctx.stroke();
  }
  ctx.restore();
 }
 private trim(){
  if(this.tiles.size<=MAX_CACHED_TILES)return;
  const unused=[...this.tiles.values()].filter(tile=>!tile.attached).sort((a,b)=>a.used-b.used);
  for(const tile of unused){
   if(this.tiles.size<=MAX_CACHED_TILES)break;
   this.tiles.delete(tile.key);
   tile.canvas.width=0;tile.canvas.height=0;
  }
 }
 clear(){
  if(this.frame)window.cancelAnimationFrame(this.frame);
  this.frame=0;
  for(const tile of this.tiles.values()){
   tile.canvas.remove();tile.canvas.width=0;tile.canvas.height=0;
  }
  this.tiles.clear();
 }
}