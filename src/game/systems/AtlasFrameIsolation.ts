import Phaser from 'phaser';

const isolated=new WeakSet<Phaser.Textures.CanvasTexture>();

/** Add transparent GPU sampling space OUTSIDE each frame. Frame dimensions,
 * origins, feet, weapon grips and existing Frame references stay identical.
 * Run after atlas-derived layers have been made, before actors use the atlas. */
export function isolateAtlasFrames(texture:Phaser.Textures.CanvasTexture){
  if(isolated.has(texture))return;
  const frames=texture.getFrameNames().map(name=>texture.get(name));
  if(frames.length<2||frames.some(f=>f.trimmed||f.rotated||f.sourceIndex!==0))return;
  const source=document.createElement('canvas');source.width=texture.width;source.height=texture.height;
  source.getContext('2d')!.drawImage(texture.canvas,0,0);
  const gutter=4,width=Math.max(...frames.map(f=>f.cutWidth)),height=Math.max(...frames.map(f=>f.cutHeight));
  const limit=Math.max(2048,texture.width,texture.height);
  const columns=Math.max(1,Math.min(Math.floor(limit/(width+gutter*2)),Math.ceil(Math.sqrt(frames.length*height/width))));
  const cuts=frames.map(f=>({frame:f,x:f.cutX,y:f.cutY,w:f.cutWidth,h:f.cutHeight}));
  texture.setSize(columns*(width+gutter*2),Math.ceil(frames.length/columns)*(height+gutter*2));
  const ctx=texture.getContext();ctx.clearRect(0,0,texture.width,texture.height);ctx.imageSmoothingEnabled=false;
  cuts.forEach(({frame,x,y,w,h},index)=>{
    const left=index%columns*(width+gutter*2)+gutter,top=Math.floor(index/columns)*(height+gutter*2)+gutter;
    ctx.drawImage(source,x,y,w,h,left,top,w,h);
    frame.setSize(w,h,left,top);
  });
  texture.update();isolated.add(texture);source.width=source.height=1;
}
