import type Phaser from 'phaser';

export const ATTACK_WARNING_TEXTURE='attack-warning-source';

export const ATTACK_WARNING_FRAMES={
  cone:{name:'warning-cone',x:23,y:425,width:342,height:342},
  circle:{name:'warning-circle',x:321,y:716,width:339,height:333},
} as const;

export type EnemyAttackWarningStyle='melee'|'pounce'|'slam';

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
