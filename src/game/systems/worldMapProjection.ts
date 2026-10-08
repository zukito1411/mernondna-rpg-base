import {TOWNS} from '../../data/towns';
import {ATLAS_TOWNS,ATLAS_WIDTH,ATLAS_HEIGHT} from '../../data/mapSurvey';
import {WORLD_WIDTH,WORLD_HEIGHT} from '../../data/world';
import type {Vec2} from '../types';

interface Control extends Vec2 {u:number;v:number}
interface Triangle {a:number;b:number;c:number}
const controls:Control[]=[
  {x:0,y:0,u:0,v:0},{x:WORLD_WIDTH,y:0,u:ATLAS_WIDTH,v:0},
  {x:WORLD_WIDTH,y:WORLD_HEIGHT,u:ATLAS_WIDTH,v:ATLAS_HEIGHT},{x:0,y:WORLD_HEIGHT,u:0,v:ATLAS_HEIGHT},
  ...TOWNS.map(t=>({...t.world,u:ATLAS_TOWNS[t.id][0],v:ATLAS_TOWNS[t.id][1]})),
];
function barycentric(p:Vec2,a:Vec2,b:Vec2,c:Vec2) {
  const det=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
  if(Math.abs(det)<.001)return null;
  const u=((b.y-c.y)*(p.x-c.x)+(c.x-b.x)*(p.y-c.y))/det;
  const v=((c.y-a.y)*(p.x-c.x)+(a.x-c.x)*(p.y-c.y))/det;
  return [u,v,1-u-v] as const;
}
function inCircle(p:Vec2,a:Vec2,b:Vec2,c:Vec2) {
  const det=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));if(Math.abs(det)<.001)return false;
  const aa=a.x*a.x+a.y*a.y,bb=b.x*b.x+b.y*b.y,cc=c.x*c.x+c.y*c.y;
  const x=(aa*(b.y-c.y)+bb*(c.y-a.y)+cc*(a.y-b.y))/det;
  const y=(aa*(c.x-b.x)+bb*(a.x-c.x)+cc*(b.x-a.x))/det;
  return (p.x-x)**2+(p.y-y)**2<(a.x-x)**2+(a.y-y)**2-.001;
}
// Small, cached Delaunay calibration mesh. Piecewise affine interpolation
// keeps authored landmarks exact and player/town pins in one coordinate space.
const mesh:Triangle[]=(()=>{
  const n=controls.length,size=Math.max(WORLD_WIDTH,WORLD_HEIGHT)*8;
  const points:Vec2[]=[...controls,{x:-size,y:-size},{x:size*3,y:-size},{x:-size,y:size*3}];
  let triangles:Triangle[]=[{a:n,b:n+1,c:n+2}];
  for(let index=0;index<n;index++){
    const bad=triangles.filter(t=>inCircle(points[index],points[t.a],points[t.b],points[t.c]));
    const edges=new Map<string,{a:number;b:number;count:number}>();
    for(const t of bad)for(const [a,b] of [[t.a,t.b],[t.b,t.c],[t.c,t.a]]){const key=Math.min(a,b)+':'+Math.max(a,b),edge=edges.get(key);if(edge)edge.count++;else edges.set(key,{a,b,count:1});}
    triangles=triangles.filter(t=>!bad.includes(t));
    for(const edge of edges.values())if(edge.count===1)triangles.push({a:edge.a,b:edge.b,c:index});
  }
  return triangles.filter(t=>t.a<n&&t.b<n&&t.c<n);
})();
export function worldToAtlas(point:Vec2) {
  const p={x:Math.max(0,Math.min(WORLD_WIDTH,point.x)),y:Math.max(0,Math.min(WORLD_HEIGHT,point.y))};
  for(const triangle of mesh){const nodes=[controls[triangle.a],controls[triangle.b],controls[triangle.c]],weights=barycentric(p,...nodes as [Control,Control,Control]);
    if(weights&&weights.every(w=>w>=-.00001))return {
      x:Math.max(0,Math.min(100,weights.reduce((sum,w,i)=>sum+w*nodes[i].u,0)/ATLAS_WIDTH*100)),
      y:Math.max(0,Math.min(100,weights.reduce((sum,w,i)=>sum+w*nodes[i].v,0)/ATLAS_HEIGHT*100)),
    };}
  return {x:p.x/WORLD_WIDTH*100,y:p.y/WORLD_HEIGHT*100};
}
