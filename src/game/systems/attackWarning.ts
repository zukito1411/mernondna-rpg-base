import type Phaser from 'phaser';

export const ATTACK_WARNING_TEXTURE='attack-warning-source';

export const ATTACK_WARNING_FRAMES={
  cone:{name:'warning-cone',x:23,y:425,width:342,height:342},
  circle:{name:'warning-circle',x:321,y:716,width:339,height:333},
} as const;

export type EnemyAttackWarningStyle='melee'|'pounce'|'slam';
export interface AttackArea {
  kind:'circle'|'cone'|'line'|'ring';x:number;y:number;angle:number;radius:number;
  range?:number;innerRadius?:number;halfAngle?:number;flatEnd?:boolean;
}
export function windupProgress(elapsed:number,duration:number){
  if(!Number.isFinite(elapsed)||!Number.isFinite(duration)||duration<=0)return 0;
  return Math.max(0,Math.min(1,elapsed/duration));
}
/** Warning rendering and actual boss hit checks share these same dimensions. */
export function attackAreaContains(area:AttackArea,x:number,y:number){
  const dx=x-area.x,dy=y-area.y,distance=Math.hypot(dx,dy);
  if(area.kind==='circle')return distance<=area.radius;
  if(area.kind==='ring')return distance>=(area.innerRadius??0)&&distance<=area.radius;
  const forward=dx*Math.cos(area.angle)+dy*Math.sin(area.angle);
  const sideways=-dx*Math.sin(area.angle)+dy*Math.cos(area.angle);
  if(area.kind==='line'){
    const closest=Math.max(0,Math.min(area.range??area.radius,forward));
    return Math.hypot(forward-closest,sideways)<=area.radius;
  }
  if(area.flatEnd){const half=area.halfAngle??.5;return forward>=0&&forward<=area.radius*Math.cos(half)&&Math.abs(sideways)<=forward*Math.tan(half);}
  return distance<=area.radius&&(distance===0||forward/distance>=Math.cos(area.halfAngle??Math.acos(.6)));
}

export function registerAttackWarningFrames(scene:Phaser.Scene){
  const texture=scene.textures.get(ATTACK_WARNING_TEXTURE);
  for(const frame of Object.values(ATTACK_WARNING_FRAMES)){
    if(!texture.has(frame.name))texture.add(frame.name,0,frame.x,frame.y,frame.width,frame.height);
  }
}

export function enemyAttackWarningLayout(style:EnemyAttackWarningStyle,radius:number,angle:number){
  if(style==='slam')return {frame:ATTACK_WARNING_FRAMES.circle.name,width:radius*2,height:radius*2,rotation:0,originX:.5};
  const halfAngle=Math.acos(style==='pounce'?.35:.6);
  return {
    frame:ATTACK_WARNING_FRAMES.cone.name,
    width:radius,
    height:2*radius*Math.tan(halfAngle),
    rotation:angle,
    originX:0,
  };
}
