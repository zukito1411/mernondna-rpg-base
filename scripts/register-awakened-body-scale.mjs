// Offline metadata authoring only. No browser, game, tests, image resampling,
// atlas recropping or production build. Run after replacing a prepared atlas.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {registerHeroBodyFrames,HERO_BODY_REGISTRATION_VERSION} from '../src/data/heroBodyRegistration.ts';

// Canvas-exported prepared atlases are non-interlaced, 8-bit RGBA PNGs. Decode
// filters at source resolution so registration never depends on CSS/DPR or a
// screenshot's zoom. Retain only one decoded atlas while authoring metadata.
function readAtlas(png){
 if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not a PNG atlas');
 let width,height;const chunks=[];
 for(let p=8;p<png.length;){
  const length=png.readUInt32BE(p),type=png.toString('ascii',p+4,p+8),data=png.subarray(p+8,p+8+length);p+=12+length;
  if(type==='IHDR'){
   width=data.readUInt32BE(0);height=data.readUInt32BE(4);
   if(data[8]!==8||data[9]!==6||data[10]||data[11]||data[12])throw Error('Expected prepared 8-bit RGBA atlas');
  }
  if(type==='IDAT')chunks.push(data);
  if(type==='IEND')break;
 }
 const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(stride*height);
 if(raw.length!==(stride+1)*height)throw Error('Incomplete PNG atlas');
 const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
 for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)];if(filter>4)throw Error('Unknown PNG row filter');
  for(let x=0;x<stride;x++){
   const i=y*stride+x,a=x>=4?pixels[i-4]:0,b=y?pixels[i-stride]:0,c=y&&x>=4?pixels[i-stride-4]:0;
   const prediction=filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):0;
   pixels[i]=(raw[y*(stride+1)+1+x]+prediction)&255;
  }
 }
 return {width,height,pixels};
}

const root=fileURLToPath(new URL('../public/assets/characters/leigneron/awakened/',import.meta.url)),writes=[];
for(const slug of await readdir(root)){
 const directory=root+slug+'/',manifest=JSON.parse(await readFile(directory+'manifest-v1.json','utf8'));
 for(const [state,spec] of Object.entries(manifest.states)){
  const atlas=readAtlas(await readFile(directory+state+'-atlas-v1.png'));
  if(atlas.width!==spec.width||atlas.height!==spec.height)throw Error('Registration dimensions disagree: '+slug+'/'+state);
  const bounds=spec.frames.map(f=>{
   let top=f.height,bottom=0;
   for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)if(atlas.pixels[((f.y+y)*atlas.width+f.x+x)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
   return {top,bottom};
  });
  spec.frames=registerHeroBodyFrames(state,spec.frames,bounds,manifest.density);
  spec.bodyRegistrationVersion=HERO_BODY_REGISTRATION_VERSION;
  writes.push([directory+state+'-registration-v1.json',JSON.stringify(spec)]);
 }
 writes.push([directory+'manifest-v1.json',JSON.stringify(manifest)]);
}
// All inputs are read before replacing metadata; artwork remains untouched.
for(const [path,json] of writes)await writeFile(path,json);
console.log('Updated body-scale and ground registration for all nine awakened outfits.');
