import Phaser from 'phaser';

const KEY='night-light-cutouts';
const SIZE=256;
const ALPHAS=[...Array.from({length:28},(_,i)=>193+i),224];

/** The original radial light profile, cached at the canvas's 8-bit alpha
 * precision. Fire changes only its centre; the .3 and 1 stops stay fixed. */
export function nightLightFrame(fire:boolean,elapsed:number,phase:number){
 return Math.round(255*.88*(fire?.92+Math.sin(elapsed*.013+phase)*.06:1));
}
export function ensureNightLightArt(scene:Phaser.Scene){
 if(scene.textures.exists(KEY))return KEY;
 const columns=8,canvas=document.createElement('canvas');
 canvas.width=SIZE*columns;canvas.height=SIZE*Math.ceil(ALPHAS.length/columns);
 const ctx=canvas.getContext('2d')!;
 for(const [index,alpha] of ALPHAS.entries()){
  const x=index%columns*SIZE,y=Math.floor(index/columns)*SIZE,r=SIZE/2;
  const gradient=ctx.createRadialGradient(x+r,y+r,0,x+r,y+r,r);
  gradient.addColorStop(0,`rgba(0,0,0,${alpha/255})`);
  gradient.addColorStop(.3,'rgba(0,0,0,.65)');gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;ctx.fillRect(x,y,SIZE,SIZE);
 }
 const texture=scene.textures.addCanvas(KEY,canvas)!;
 texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
 for(const [index,alpha] of ALPHAS.entries()){
  texture.add(alpha,0,index%columns*SIZE,Math.floor(index/columns)*SIZE,SIZE,SIZE);
 }
 return KEY;
}
