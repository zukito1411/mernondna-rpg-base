import { SETTLEMENT_BY_ID } from '../../data/settlements';
import { MARCH_ROUTE, MARCH_LENGTH, MARCH_SPEED, MARCH_SPACING } from '../../data/capitalResidents';
import type { Vec2 } from '../types';

interface Node extends Vec2 { links:Map<number,number> }
const graphs=new Map<string,Node[]>();
function graph(townId:string) {
  const saved=graphs.get(townId);if(saved)return saved;
  const nodes:Node[]=[],segments=SETTLEMENT_BY_ID[townId].streets.flatMap(s=>s.points.slice(1).map((b,i)=>({a:s.points[i],b,points:[s.points[i],b]})));
  const node=(p:Vec2)=>{let i=nodes.findIndex(n=>Math.hypot(n.x-p.x,n.y-p.y)<1);if(i<0){i=nodes.length;nodes.push({...p,links:new Map()});}return i;};
  for(const s of segments)for(const t of segments){
    if(s===t)continue;
    const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,ex=t.b.x-t.a.x,ey=t.b.y-t.a.y,det=dx*ey-dy*ex;
    if(Math.abs(det)<.01) {
      for(const p of [t.a,t.b]){const len=dx*dx+dy*dy,u=len?((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/len:0;
        if(u>=0&&u<=1&&Math.hypot(p.x-s.a.x-u*dx,p.y-s.a.y-u*dy)<1)s.points.push(p);}
      continue;
    }
    const px=t.a.x-s.a.x,py=t.a.y-s.a.y,u=(px*ey-py*ex)/det,v=(px*dy-py*dx)/det;
    if(u>=0&&u<=1&&v>=0&&v<=1)s.points.push({x:s.a.x+dx*u,y:s.a.y+dy*u});
  }
  for(const s of segments){s.points.sort((p,q)=>Math.hypot(p.x-s.a.x,p.y-s.a.y)-Math.hypot(q.x-s.a.x,q.y-s.a.y));
    for(let i=1;i<s.points.length;i++){const a=node(s.points[i-1]),b=node(s.points[i]);if(a===b)continue;
      const d=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y);nodes[a].links.set(b,d);nodes[b].links.set(a,d);}}
  graphs.set(townId,nodes);return nodes;
}

/** Visibility-checked street graph routing; no teleporting through scenery. */
export function npcStreetRoute(townId:string,from:Vec2,to:Vec2,canVisit:(a:Vec2,b:Vec2)=>boolean):Vec2[] {
  if(canVisit(from,to))return [to];
  const nodes=graph(townId),dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),open=new Set<number>();
  const near=(p:Vec2)=>nodes.map((n,i)=>({i,d:Math.hypot(n.x-p.x,n.y-p.y)})).sort((a,b)=>a.d-b.d).slice(0,16).filter(n=>canVisit(p,nodes[n.i]));
  const destinations=new Map(near(to).map(n=>[n.i,n.d]));
  for(const n of near(from)){dist[n.i]=n.d;open.add(n.i);}
  let best=-1,bestCost=Infinity;
  while(open.size){const current=[...open].sort((a,b)=>dist[a]-dist[b])[0];open.delete(current);
    if(dist[current]>=bestCost)break;
    const tail=destinations.get(current);if(tail!==undefined&&dist[current]+tail<bestCost){best=current;bestCost=dist[current]+tail;}
    for(const [next,cost] of nodes[current].links){if(dist[current]+cost>=dist[next]||!canVisit(nodes[current],nodes[next]))continue;
      dist[next]=dist[current]+cost;prev[next]=current;open.add(next);}}
  if(best<0)return [];
  const path:Vec2[]=[to];for(let i=best;i>=0;i=prev[i])path.unshift({x:nodes[i].x,y:nodes[i].y});return path;
}

export function formationPosition(activeMs:number,rank:number):Vec2 {
  let remaining=(activeMs/1000*MARCH_SPEED+rank*MARCH_SPACING)%MARCH_LENGTH;
  for(let i=1;i<MARCH_ROUTE.length;i++){const a=MARCH_ROUTE[i-1],b=MARCH_ROUTE[i],length=Math.hypot(b.x-a.x,b.y-a.y);
    if(remaining<=length)return {x:a.x+(b.x-a.x)*remaining/length,y:a.y+(b.y-a.y)*remaining/length};remaining-=length;}
  return {...MARCH_ROUTE[0]};
}
