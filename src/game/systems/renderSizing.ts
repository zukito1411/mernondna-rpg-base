import type Phaser from 'phaser';

export const RENDER_DENSITY_KEY='renderDensity';
// Bound fill-rate and viewport resources on mobile instead of blindly using
// 3x/4x DPR. World coordinates, actor sizes and input remain independent of it.
const MAX_RENDER_DENSITY=2;
const MAX_RENDER_PIXELS=4_000_000;

export function backingSize(width:number,height:number,dpr:number){
  const cssWidth=Math.max(1,Math.round(width)),cssHeight=Math.max(1,Math.round(height));
  const requested=Number.isFinite(dpr)&&dpr>0?dpr:1;
  const density=Math.max(1,Math.min(requested,MAX_RENDER_DENSITY,
    Math.sqrt(MAX_RENDER_PIXELS/(cssWidth*cssHeight)),4096/Math.max(cssWidth,cssHeight)));
  return {density,width:Math.round(cssWidth*density),height:Math.round(cssHeight*density)};
}

export function renderDensity(scene:Phaser.Scene):number{
  return scene.registry.get(RENDER_DENSITY_KEY)??1;
}

/** Soft screen effects stay CSS-sized; sharper actors/terrain use the full
 * backing buffer. This avoids multiplying texture uploads by DPR squared. */
export function overlayViewport(scene:Phaser.Scene){
  const density=renderDensity(scene);
  return {width:Math.max(1,Math.round(scene.scale.width/density)),
    height:Math.max(1,Math.round(scene.scale.height/density)),zoom:scene.cameras.main.zoom/density};
}

export function fitViewportOverlay(scene:Phaser.Scene,image:Phaser.GameObjects.Image){
  const camera=scene.cameras.main,z=camera.zoom,w=scene.scale.width,h=scene.scale.height;
  image.setDisplaySize(w/z,h/z).setPosition(w/2*(1-1/z),h/2*(1-1/z));
}
