export type EnemyAttackWarningStyle='melee'|'pounce'|'slam';

export function enemyAttackWarningPoints(style:EnemyAttackWarningStyle,x:number,y:number,angle:number,radius:number,steps=20){
  const extent=style==='slam'?Math.PI*2:2*Math.acos(style==='pounce'?.35:.6);
  const start=style==='slam'?0:angle-extent/2;
  const points:Array<{x:number;y:number}>=[];
  if(style!=='slam')points.push({x,y});
  for(let i=0;i<=steps;i++){
    const a=start+extent*i/steps;
    points.push({x:x+Math.cos(a)*radius,y:y+Math.sin(a)*radius});
  }
  return points;
}
