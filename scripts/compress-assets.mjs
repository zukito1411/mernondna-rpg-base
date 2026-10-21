// Explicit offline authoring operation, never run by startup, CI or npm build.
// PNG inputs stay in the repository; only verified smaller files are adopted.
import {readFile,writeFile,readdir,stat,mkdtemp,rm,rename} from 'node:fs/promises';
import {resolve,join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readRgbaPng,recompressRgbaPng} from './lib/png-rgba.mjs';
import {authoringOnlyAsset,publicAssetFiles} from './lib/public-assets.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),publicDir=join(root,'public');
const mode=process.argv[2],args=process.argv.slice(3),exec=promisify(execFile);
if(!['png','webp'].includes(mode))throw Error('Use: node scripts/compress-assets.mjs png | webp --cwebp <path> --dwebp <path>');
const option=key=>{const index=args.indexOf(key);if(index<0||!args[index+1])throw Error(`Missing ${key}`);return args[index+1];};
const reportPath=join(root,'docs/asset-compression-report.json'),mapPath=join(root,'src/data/losslessImagePaths.json');
let report={version:1,png:{},webp:{}};
try{report=JSON.parse(await readFile(reportPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const alternatives=JSON.parse(await readFile(mapPath,'utf8'));
const files=[];
async function visit(directory,prefix=''){for(const entry of await readdir(directory,{withFileTypes:true})){
 const path=prefix+entry.name;if(entry.isDirectory())await visit(join(directory,entry.name),path+'/');
 else if(entry.isFile()&&path.endsWith('.png')&&!authoringOnlyAsset(path))files.push(path);
}}
await visit(publicDir);files.sort();
const selected=path=>/^assets\/characters\/leigneron\/awakened\/[^/]+\/[^/]+-atlas-v1\.png$/.test(path)
 ||/^assets\/cinematics\/(story\/[^/]+-v1|roadborn-opening\/prologue-waiting-v1)\.png$/.test(path)
 ||/^assets\/effects\/(boss-skills-v2|boss-motion-v1)\.png$/.test(path)
 ||/^assets\/interiors\/housing-(furniture-[012]|floor)-v1\.png$/.test(path);
function simpleRgbaPng(png){
 if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png[24]!==8||png[25]!==6||png[28]!==0)return false;
 // WebP cannot carry PNG gamma/chromaticity chunks. Leave such files as PNG
 // rather than risk changing browser color interpretation or dropping metadata.
 for(let at=8;at<png.length;){const length=png.readUInt32BE(at),type=png.toString('ascii',at+4,at+8);
  if(!['IHDR','IDAT','IEND'].includes(type))return false;at+=length+12;}
 return true;
}
function readPam(bytes){
 const end=bytes.indexOf('ENDHDR\n');if(end<0)throw Error('Missing PAM header');
 const header=bytes.toString('ascii',0,end),field=name=>Number(new RegExp(`^${name} (\\d+)$`,'m').exec(header)?.[1]);
 const width=field('WIDTH'),height=field('HEIGHT'),depth=field('DEPTH');
 if(!header.startsWith('P7\n')||field('MAXVAL')!==255||!Number.isInteger(width)||!Number.isInteger(height)||![3,4].includes(depth))throw Error('Unsupported decoded PAM');
 const raw=bytes.subarray(end+7);if(raw.length!==width*height*depth)throw Error('Incomplete decoded PAM');
 if(depth===4)return {width,height,pixels:raw};
 const pixels=Buffer.alloc(width*height*4);for(let i=0;i<width*height;i++){
  raw.copy(pixels,i*4,i*3,i*3+3);pixels[i*4+3]=255;
 }return {width,height,pixels};
}
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function replaceFile(path,data){
 const temporary=path+'.asset-tmp-'+process.pid;
 try{await writeFile(temporary,data);await rename(temporary,path);}
 finally{await rm(temporary,{force:true});}
}
let changed=0,saved=0,skipped=0,processed=0;
const work=mode==='webp'?await mkdtemp(join(tmpdir(),'leigneron-compress-')):null;
try{
 const cwebp=mode==='webp'?option('--cwebp'):null,dwebp=mode==='webp'?option('--dwebp'):null;
 for(const relative of files){
  if(mode==='webp'&&!selected(relative))continue;
  const source=join(publicDir,relative),png=await readFile(source);processed++;
  // Bounded offline memory; leave very large/unsupported source masters alone.
  if(png.length<29||png.readUInt32BE(16)*png.readUInt32BE(20)*4>128*1024*1024){skipped++;continue;}
  if(mode==='png'){
   const packed=recompressRgbaPng(png);
   if(packed){
    const image=readRgbaPng(png),previous=report.png[relative];
    await replaceFile(source,packed);changed++;saved+=png.length-packed.length;
    report.png[relative]={beforeBytes:previous?.beforeBytes??png.length,pngBytes:packed.length,
     width:image.width,height:image.height,rgbaSha256:digest(image.pixels)};
   }else skipped++;
  }else{
   if(!simpleRgbaPng(png)){skipped++;continue;}
   const target=relative.replace(/\.png$/,'.lossless.webp'),encoded=join(work,'encoded.webp'),decoded=join(work,'decoded.pam');
   // -q controls compression effort in LOSSLESS mode. No near-lossless,
   // resizing, palette reduction, alpha quantization or color cleanup.
   await exec(cwebp,['-quiet','-lossless','-exact','-q','100','-m','4','-metadata','all',source,'-o',encoded],{windowsHide:true,timeout:120000});
   const webp=await readFile(encoded);
   if(webp.length>=png.length){skipped++;continue;}
   await exec(dwebp,['-quiet',encoded,'-pam','-o',decoded],{windowsHide:true,timeout:30000});
   const original=readRgbaPng(png),roundtrip=readPam(await readFile(decoded));
   if(original.width!==roundtrip.width||original.height!==roundtrip.height||!original.pixels.equals(roundtrip.pixels))
    throw Error(`WebP pixel preservation failed: ${relative}`);
   // The map is updated only AFTER the verified file exists. Originals remain
   // available to authoring tools and are excluded only from release copying.
   await replaceFile(join(publicDir,target),webp);alternatives[relative]=target;changed++;saved+=png.length-webp.length;
   report.webp[relative]={path:target,pngBytes:png.length,webpBytes:webp.length,
    width:original.width,height:original.height,rgbaSha256:digest(original.pixels),sourceSha256:digest(png),webpSha256:digest(webp)};
   await replaceFile(mapPath,JSON.stringify(Object.fromEntries(Object.entries(alternatives).sort()),null,2)+'\n');
  }
  if(processed%20===0)console.log(`${mode}: ${processed} images, ${changed} smaller, ${(saved/1048576).toFixed(2)} MiB saved`);
  // Persist accounting incrementally; interruption cannot orphan a URL entry.
  await replaceFile(reportPath,JSON.stringify(report,null,2)+'\n');
 }
 const all=[];async function count(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);if(entry.isDirectory())await count(path);else if(entry.isFile())all.push(await stat(path));
 }}await count(publicDir);
 const shipped=publicAssetFiles(publicDir);let shippedBytes=0;for(const relative of shipped)shippedBytes+=(await stat(join(publicDir,relative))).size;
 report.inventory={publicBytes:all.reduce((sum,file)=>sum+file.size,0),shippingBytes:shippedBytes,shippingFiles:shipped.length};
 report.originalPublicBytes??=report.inventory.publicBytes
  +Object.values(report.png).reduce((sum,file)=>sum+file.beforeBytes-file.pngBytes,0)
  -Object.values(report.webp).reduce((sum,file)=>sum+file.webpBytes,0);
 await replaceFile(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({mode,processed,changed,skipped,savedBytes:saved,...report.inventory}));
}finally{
 if(work){
  const location=resolve(work);
  if(dirname(location)!==resolve(tmpdir())||!basename(location).startsWith('leigneron-compress-'))throw Error('Unsafe compression temp cleanup');
  await rm(location,{recursive:true,force:true});
 }
}
