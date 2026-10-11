import type {Rect} from '../../data/settlementGeometry';
/** Immutable authored geometry; query only cells touched by a rectangle. */
export class StaticBoundsIndex<T extends {bounds:Rect}> {
 private readonly cells=new Map<string,T[]>();
 constructor(items:readonly T[],private readonly size=512){
  for(const item of items)this.eachCell(item.bounds,key=>{const cell=this.cells.get(key)??[];cell.push(item);this.cells.set(key,cell);});
 }
 query(bounds:Rect){
  const result=new Set<T>();this.eachCell(bounds,key=>{for(const item of this.cells.get(key)??[])result.add(item);});return [...result];
 }
 private eachCell(bounds:Rect,visit:(key:string)=>void){
  for(let y=Math.floor(bounds.top/this.size);y<=Math.floor(bounds.bottom/this.size);y++)
   for(let x=Math.floor(bounds.left/this.size);x<=Math.floor(bounds.right/this.size);x++)visit(x+':'+y);
 }
}
