import {chromium} from '@playwright/test';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
const root='public/assets/characters/leigneron/awakened',results=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 for(const slug of await readdir(root)){
  const manifest=JSON.parse(await readFile(`${root}/${slug}/manifest-v1.json`,'utf8'));
  const states=await Promise.all(['walk-down','walk-side','walk-up'].map(async name=>({name,meta:manifest.states[name],src:'data:image/png;base64,'+(await readFile(`${root}/${slug}/${name}-atlas-v1.png`)).toString('base64')})));
  const result=await page.evaluate(async({slug,states,density})=>{
   const c=document.createElement('canvas');c.width=1080;c.height=500;const ctx=c.getContext('2d');ctx.fillStyle='#18221f';ctx.fillRect(0,0,c.width,c.height);
   ctx.fillStyle='#f5dfb2';ctx.font='bold 24px sans-serif';ctx.fillText(slug+' — actual registered body scale, same ground anchor / zoom',20,32);
   ctx.font='18px sans-serif';const metrics=[];
   for(let col=0;col<states.length;col++){
    const s=states[col],image=new Image();image.src=s.src;await image.decode();
    const read=document.createElement('canvas');read.width=image.width;read.height=image.height;const r=read.getContext('2d',{willReadFrequently:true});r.drawImage(image,0,0);
    const frames=s.meta.frames.map(f=>{
     const data=r.getImageData(f.x,f.y,f.width,f.height).data;let left=f.width,right=-1,top=f.height,bottom=-1;
     for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)if(data[(y*f.width+x)*4+3]>64){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
     let upperWidth=0;
     for(let y=top;y<=top+(bottom-top)*.30;y++){
      let min=f.width,max=-1;for(let x=0;x<f.width;x++)if(data[(y*f.width+x)*4+3]>64){min=Math.min(min,x);max=Math.max(max,x);}
      if(max>=min)upperWidth=Math.max(upperWidth,max-min+1);
     }
     const scale=f.bodyScale??1,offset=f.bodyOffsetY??0;
     return {height:(bottom-top+1)/density*scale,upperWidth:upperWidth/density*scale,top:(top-f.height*f.originY)/density*scale+offset,foot:(bottom-f.height*f.originY)/density*scale+offset};
    });
    const mean=key=>frames.reduce((n,f)=>n+f[key],0)/frames.length;
    const m={state:s.name,meanHeight:mean('height'),meanUpperWidth:mean('upperWidth'),meanFoot:mean('foot'),minHeight:Math.min(...frames.map(f=>f.height)),maxHeight:Math.max(...frames.map(f=>f.height)),frames};metrics.push(m);
    const f=s.meta.frames[0],zoom=4,x=col*360+180,y=420,scale=f.bodyScale??1,offset=f.bodyOffsetY??0;
    ctx.strokeStyle='#617a6e';ctx.beginPath();ctx.moveTo(col*360+18,y);ctx.lineTo((col+1)*360-18,y);ctx.moveTo(x,80);ctx.lineTo(x,440);ctx.stroke();
    ctx.drawImage(image,f.x,f.y,f.width,f.height,x-f.width*f.originX/density*zoom*scale,y-f.height*f.originY/density*zoom*scale+offset*zoom,f.width/density*zoom*scale,f.height/density*zoom*scale);
    ctx.fillStyle='#f5dfb2';ctx.fillText(s.name,col*360+125,65);ctx.font='14px sans-serif';ctx.fillText(`height ${m.meanHeight.toFixed(1)} · upper width ${m.meanUpperWidth.toFixed(1)} world px`,col*360+35,465);ctx.font='18px sans-serif';
   }
   return {png:c.toDataURL(),metrics};
  },{slug,states,density:manifest.density});
  await mkdir('test-results/awakening/scale',{recursive:true});await writeFile(`test-results/awakening/scale/${slug}.png`,Buffer.from(result.png.split(',')[1],'base64'));
  results.push({slug,states:result.metrics});
 }
 await writeFile('test-results/awakening/scale/report.json',JSON.stringify(results,null,2));
 console.table(results.map(r=>{
  const [front,side,rear]=r.states;return {outfit:r.slug,frontHeight:front.meanHeight.toFixed(1),sideHeight:side.meanHeight.toFixed(1),rearHeight:rear.meanHeight.toFixed(1),frontUpper:front.meanUpperWidth.toFixed(1),sideUpper:side.meanUpperWidth.toFixed(1),rearUpper:rear.meanUpperWidth.toFixed(1),rearVsSideUpper:(100*(rear.meanUpperWidth/side.meanUpperWidth-1)).toFixed(1)+'%'};
 }));
}finally{await browser.close();}
