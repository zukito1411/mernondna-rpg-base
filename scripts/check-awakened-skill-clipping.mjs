import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const slugs=['varr','warden','stonejaw','iron-tusk','rootfather','salt-king','frost-wyrm','ashen-seer','varkhul'];
const root='test-results/awakening/skill-clipping';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5174/tests/browser/awakeningFixture.html?e2e=1');
 await page.waitForFunction(()=>window.__awakeningReview||window.__awakeningError,{},{timeout:60000});
 const setup=await page.evaluate(()=>window.__awakeningError);if(setup)throw Error(setup);
 for(const slug of slugs){
  await page.evaluate(slug=>window.__awakeningReview.select(slug),slug);
  await page.waitForFunction(slug=>window.__awakeningReview.ready()===slug,slug,{timeout:25000});
  const result=await page.evaluate(async slug=>{
   const r=window.__awakeningReview,scene=r.scene,rows=r.rows.filter(s=>s.key.startsWith('skill_'));
   const sheet=document.createElement('canvas');sheet.width=2040;sheet.height=rows.length*360;
   const draw=sheet.getContext('2d');draw.fillStyle='#18221f';draw.fillRect(0,0,sheet.width,sheet.height);
   const failures=[],frames=[];
   const settle=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const read=async url=>{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;c.getContext('2d').drawImage(image,0,0);return c;};
   // Alpha, not RGB/background contrast: black cloth is still a complete body.
   const foreground=(data,i)=>data[i+3]>32;
   for(let row=0;row<rows.length;row++){
    const s=rows[row];draw.fillStyle='#f5dfb2';draw.font='14px sans-serif';draw.fillText(slug+' / '+s.label,8,row*360+17);
    for(let n=0;n<6;n++){
     r.probe(false);r.pose(s.key,s.offset+n,s.flip);await settle();
     const display=await read(await r.capture());draw.drawImage(display,n*340,row*360+20,340,340);
     r.probe(true);await settle();
     const actor=scene.children.getByName('awakened-hero'),f=actor.frame,camera=scene.cameras.main;
     const expected=document.createElement('canvas');expected.width=1280;expected.height=720;
     const ctx=expected.getContext('2d',{willReadFrequently:true});
     const screenX=(actor.x-camera.worldView.x)*camera.zoom,screenY=(actor.y-camera.worldView.y)*camera.zoom;
     ctx.translate(screenX,screenY);ctx.scale(actor.scaleX*camera.zoom*(actor.flipX?-1:1),actor.scaleY*camera.zoom);
     ctx.drawImage(f.source.image,f.cutX,f.cutY,f.width,f.height,-actor.originX*f.width,-actor.originY*f.height,f.width,f.height);
     const actual=await read(await r.captureViewport()),a=actual.getContext('2d',{willReadFrequently:true}).getImageData(0,0,1280,720).data;
     const e=ctx.getImageData(0,0,1280,720).data;
     let missing=0,foreign=0,visible=0;
     const nearby=(data,x,y)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const px=x+dx,py=y+dy;if(px>=0&&px<1280&&py>=0&&py<720&&foreground(data,(py*1280+px)*4))return true;}return false;};
     for(let y=0;y<720;y++)for(let x=0;x<1280;x++){
      const at=(y*1280+x)*4,ef=foreground(e,at),af=foreground(a,at);
      if(ef){visible++;if(!af&&!nearby(a,x,y))missing++;}
      if(af&&!ef&&!nearby(e,x,y))foreign++;
     }
     // Frame gutters catch truncated packed rectangles/neighbor sampling even
     // when both Canvas and WebGL would otherwise reproduce the same crop.
     const src=document.createElement('canvas');src.width=f.width;src.height=f.height;
     src.getContext('2d').drawImage(f.source.image,f.cutX,f.cutY,f.width,f.height,0,0,f.width,f.height);
     const rgba=src.getContext('2d').getImageData(0,0,f.width,f.height).data;let border=0;
     for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)if((x<3||y<3||x>=f.width-3||y>=f.height-3)&&rgba[(y*f.width+x)*4+3]>32)border++;
     const record={state:s.state,frame:n,flip:s.flip,missing,foreign,border,visible};frames.push(record);
     if(missing||foreign||border||visible<100)failures.push(record);
    }
   }
   r.probe(false);
   return {slug,frames:frames.length,textures:r.textureCount(),failures,details:frames,png:sheet.toDataURL()};
  },slug);
  await writeFile(`${root}/${slug}.png`,Buffer.from(result.png.split(',')[1],'base64'));
  const {png,...entry}=result;report.push(entry);console.log(slug,entry.frames,'GPU skill poses;',entry.failures.length,'failures;',entry.textures,'outfit textures');
 }
 await writeFile(`${root}/report.json`,JSON.stringify({errors,renderer:'Phaser WebGL / Chrome SwiftShader',edgeTolerancePixels:2,outfits:report},null,2));
 await writeFile(`${root}/index.html`,`<!doctype html><meta charset="utf-8"><title>GPU skill clipping review</title><style>body{background:#18221f;color:#f5dfb2;font:16px system-ui;margin:24px}img{max-width:100%;height:auto}a{color:#bce3ff}</style><h1>Actual WebGL skill frames — all nine cosmetics</h1><p>Six poses per row, both mirrored facings where applicable, equipped weapons included. GPU silhouette compared against its complete registered atlas frame with a 2-screen-pixel antialias tolerance; 3-pixel source gutters checked separately. This is a focused desktop WebGL rendering check, not an Android/device or complete gameplay test.</p>${report.map(r=>`<h2>${r.slug}: ${r.failures.length?'FAIL':'PASS'} (${r.frames} frames)</h2><a href="${r.slug}.png">Full-resolution sheet</a><img loading="lazy" src="${r.slug}.png">`).join('')}`);
 if(errors.length||report.some(r=>r.failures.length||r.textures>15))throw Error('Rendering check failed; see '+root+'/report.json');
 console.log('PASS:',report.reduce((n,r)=>n+r.frames,0),'GPU skill poses, no clipping/foreign pixels beyond antialias tolerance.');
}finally{await browser.close();}
