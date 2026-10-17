import type {Vec2} from '../types';

/** Small local A* for a follower turning around scenery, never a world scan.
 * Every edge uses the scene's swept foot/collision checks. */
export function companionPath(from:Vec2,to:Vec2,clear:(a:Vec2,b:Vec2)=>boolean):Vec2[]{
  if(clear(from,to))return [{...to}];
  const step=32,open=[{point:{x:from.x,y:from.y},cost:0,parent:-1}],closed:typeof open=[];
  const costs=new Map<string,number>([['0:0',0]]);
  for(let visited=0;open.length&&visited<220;visited++){
    let best=0;
    for(let i=1;i<open.length;i++)if(open[i].cost+Math.hypot(open[i].point.x-to.x,open[i].point.y-to.y)
      <open[best].cost+Math.hypot(open[best].point.x-to.x,open[best].point.y-to.y))best=i;
    const node=open.splice(best,1)[0],index=closed.push(node)-1;
    if(Math.hypot(node.point.x-to.x,node.point.y-to.y)<=64&&clear(node.point,to)){
      const path:Vec2[]=[{...to}];let cursor=index;
      while(cursor>0){path.unshift(closed[cursor].point);cursor=closed[cursor].parent;}
      return path;
    }
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const point={x:node.point.x+dx*step,y:node.point.y+dy*step},cost=node.cost+Math.hypot(dx,dy)*step;
      const key=Math.round((point.x-from.x)/step)+':'+Math.round((point.y-from.y)/step);
      if(cost>1100||(costs.get(key)??Infinity)<=cost||!clear(node.point,point))continue;
      costs.set(key,cost);open.push({point,cost,parent:index});
    }
  }
  return [];
}
