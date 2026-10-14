import type { Vec2 } from '../types';

/** Small, bounded navigation grid over the actual room's swept-feet predicate.
 * Created lazily per room; static furniture/black void are never traversed. */
export class InteriorQuestRoutes {
  private readonly nodes=new Map<string,Vec2>();
  private readonly edges=new Map<string,string[]>();
  constructor(bounds:{x:number;y:number;width:number;height:number},private readonly valid:(p:Vec2)=>boolean,
    private readonly clear:(a:Vec2,b:Vec2)=>boolean){
    const step=48;
    for(let y=bounds.y;y<=bounds.y+bounds.height;y+=step)for(let x=bounds.x;x<=bounds.x+bounds.width;x+=step){
      const p={x,y};if(valid(p))this.nodes.set(x+','+y,p);
    }
  }
  route(from:Vec2,to:Vec2):Vec2[]{
    if(this.clear(from,to))return [to];
    const near=(p:Vec2)=>[...this.nodes].map(([key,point])=>({key,point,d:Math.hypot(p.x-point.x,p.y-point.y)}))
      .filter(n=>n.d<=160).sort((a,b)=>a.d-b.d).slice(0,12).filter(n=>this.clear(p,n.point));
    const starts=near(from),goals=new Map(near(to).map(n=>[n.key,n.d]));
    if(!starts.length||!goals.size)return [];
    const dist=new Map<string,number>(),prev=new Map<string,string>(),open=new Set<string>();
    for(const n of starts){dist.set(n.key,n.d);open.add(n.key);}
    let best:string|undefined,bestCost=Infinity,expansions=0;
    while(open.size&&expansions++<3000){
      let key:string|undefined,cost=Infinity;
      for(const k of open)if(dist.get(k)!<cost){key=k;cost=dist.get(k)!;}
      if(key===undefined||cost>=bestCost)break;
      open.delete(key);
      const tail=goals.get(key);if(tail!==undefined&&cost+tail<bestCost){best=key;bestCost=cost+tail;}
      const p=this.nodes.get(key)!;
      let links=this.edges.get(key);
      if(!links){links=[];for(const [dx,dy] of [[48,0],[-48,0],[0,48],[0,-48]]){
        const next=(p.x+dx)+','+(p.y+dy),q=this.nodes.get(next);
        if(q&&this.valid(q)&&this.clear(p,q))links.push(next);
      }this.edges.set(key,links);}
      for(const next of links){const candidate=cost+48;
        if(candidate<(dist.get(next)??Infinity)){dist.set(next,candidate);prev.set(next,key);open.add(next);}}
    }
    if(!best)return [];
    const path:Vec2[]=[to];
    for(let key:string|undefined=best;key!==undefined;key=prev.get(key))path.unshift(this.nodes.get(key)!);
    return path;
  }
}
