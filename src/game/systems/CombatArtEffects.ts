import Phaser from 'phaser';
export const COMBAT_EFFECT_TEXTURE='combat-art-effects';
export const DISTINCT_EFFECT_TEXTURE='distinct-combat-effects';
export function effectPresentation(key:string,row:number,color?:number){
  const prefix=key===DISTINCT_EFFECT_TEXTURE?'distinct-art-effect':'combat-art-effect';
  return {texture:color===undefined?key:key+'-neutral',animation:`${prefix}${color===undefined?'':'-weapon'}:${row}`};
}
function neutralEffectTexture(scene:Phaser.Scene,key:string){
  const image=scene.textures.get(key).getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  const neutral=scene.textures.createCanvas(key+'-neutral',image.width,image.height)!;
  const ctx=neutral.getContext();ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,image.width,image.height);
  for(let i=0;i<pixels.data.length;i+=4){
    if(!pixels.data[i+3])continue;
    const light=Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2]);
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=light;
  }
  ctx.putImageData(pixels,0,0);neutral.refresh();
  return neutral;
}
/** Preserve the approved six-phase slash rather than substituting a cleave. */
export function prepareSlashWeaponEffect(scene:Phaser.Scene){
  const original=scene.textures.get('effect_slash'),neutral=neutralEffectTexture(scene,'effect_slash');
  for(let i=0;i<6;i++){
    const frame=original.get(i);
    neutral.add(i,0,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight);
  }
  scene.anims.create({key:'effect-slash-weapon',frames:Array.from({length:6},(_,frame)=>({key:'effect_slash-neutral',frame})),frameRate:18,repeat:0});
}
export function prepareCombatArtEffects(scene:Phaser.Scene,key=COMBAT_EFFECT_TEXTURE,prefix='combat-art-effect'){
  const texture=scene.textures.get(key),image=texture.getSourceImage() as HTMLImageElement;
  const width=image.width/4,height=image.height/4;
  // Generated gutters carry faint guide/seam pixels. Keep them outside GPU
  // rectangles; centers remain identical through all four phases.
  const inset=Math.ceil(Math.min(width,height)*.025);
  // Shared neutral shading avoids blue × red becoming black. One alternate
  // atlas per effect family, never one texture per weapon or per cast.
  const neutral=neutralEffectTexture(scene,key);
  for(let row=0;row<4;row++){
    for(let column=0;column<4;column++){
      const x=Math.floor(column*width)+inset,y=Math.floor(row*height)+inset,w=Math.floor(width)-inset*2,h=Math.floor(height)-inset*2;
      texture.add(row*4+column,0,x,y,w,h);neutral.add(row*4+column,0,x,y,w,h);
    }
    scene.anims.create({key:`${prefix}:${row}`,frames:[0,1,2,3].map(column=>({key,frame:row*4+column})),frameRate:12,repeat:0});
    scene.anims.create({key:`${prefix}-weapon:${row}`,frames:[0,1,2,3].map(column=>({key:key+'-neutral',frame:row*4+column})),frameRate:12,repeat:0});
  }
}
