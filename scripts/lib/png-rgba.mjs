// Small offline authoring codec for non-interlaced 8-bit RGBA PNG artwork.
import {inflateSync,deflateSync} from 'node:zlib';
const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
const residualScore=value=>value<128?value:256-value;
export function readRgbaPng(png){
 if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not a PNG');
 let width,height;const chunks=[];
 for(let p=8;p<png.length;){
  const length=png.readUInt32BE(p),type=png.toString('ascii',p+4,p+8),data=png.subarray(p+8,p+8+length);p+=12+length;
  if(type==='IHDR'){
   width=data.readUInt32BE(0);height=data.readUInt32BE(4);
   if(data[8]!==8||data[9]!==6||data[10]||data[11]||data[12])throw Error('Expected non-interlaced 8-bit RGBA PNG');
  }
  if(type==='IDAT')chunks.push(data);
  if(type==='IEND')break;
 }
 const stride=width*4,raw=inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(stride*height);
 if(raw.length!==(stride+1)*height)throw Error('Incomplete PNG');
 for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)];if(filter>4)throw Error('Unknown PNG filter');
  for(let x=0;x<stride;x++){
   const i=y*stride+x,a=x>=4?pixels[i-4]:0,b=y?pixels[i-stride]:0,c=y&&x>=4?pixels[i-stride-4]:0;
   const prediction=filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):0;
   pixels[i]=(raw[y*(stride+1)+1+x]+prediction)&255;
  }
 }
 return {width,height,pixels};
}
const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let bit=0;bit<8;bit++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(type,data){
 const tag=Buffer.from(type),payload=Buffer.concat([tag,data]);let crc=0xffffffff;
 for(const byte of payload)crc=crcTable[(crc^byte)&255]^(crc>>>8);
 const output=Buffer.alloc(data.length+12);output.writeUInt32BE(data.length);payload.copy(output,4);output.writeUInt32BE((crc^0xffffffff)>>>0,output.length-4);return output;
}
function filteredRgba(width,height,pixels){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||pixels.length!==width*height*4)
  throw Error('Invalid RGBA dimensions or pixel length');
 const stride=width*4,raw=Buffer.alloc((stride+1)*height);
 const candidates=Array.from({length:5},()=>Buffer.alloc(stride));
 for(let y=0;y<height;y++){
  const scores=[0,0,0,0,0],offset=y*stride;
  for(let x=0;x<stride;x++){
   const value=pixels[offset+x],a=x>=4?pixels[offset+x-4]:0,b=y?pixels[offset+x-stride]:0,c=y&&x>=4?pixels[offset+x-stride-4]:0;
   candidates[0][x]=value;scores[0]+=residualScore(value);
   const sub=(value-a)&255,up=(value-b)&255,average=(value-((a+b)>>>1))&255,p=(value-paeth(a,b,c))&255;
   candidates[1][x]=sub;scores[1]+=residualScore(sub);candidates[2][x]=up;scores[2]+=residualScore(up);
   candidates[3][x]=average;scores[3]+=residualScore(average);candidates[4][x]=p;scores[4]+=residualScore(p);
  }
  let best=0;for(let filter=1;filter<5;filter++)if(scores[filter]<scores[best])best=filter;
  raw[y*(stride+1)]=best;candidates[best].copy(raw,y*(stride+1)+1);
 }
 return deflateSync(raw,{level:9});
}
export function writeRgbaPng(width,height,pixels){
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',filteredRgba(width,height,pixels)),chunk('IEND',Buffer.alloc(0))]);
}

/** Offline recompression only: retain every non-IDAT chunk byte-for-byte,
 * including profiles, gamma, text and physical dimensions. Unsupported PNG
 * formats, animation and signed files are deliberately left untouched. */
export function recompressRgbaPng(png){
 if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')return null;
 const chunks=[];let supported=false,ended=false;
 for(let p=8;p<png.length;){
  if(p+12>png.length)throw Error('Truncated PNG chunk');
  const length=png.readUInt32BE(p),end=p+length+12;if(end>png.length)throw Error('Truncated PNG data');
  const type=png.toString('ascii',p+4,p+8),data=png.subarray(p+8,end-4);
  if(type==='IHDR')supported=length===13&&data[8]===8&&data[9]===6&&!data[10]&&!data[11]&&!data[12];
  if(type==='acTL'||type==='dSIG')return null;
  chunks.push({type,bytes:png.subarray(p,end)});p=end;
  if(type==='IEND'){ended=p===png.length;break;}
 }
 if(!supported||!ended)return null;
 const {width,height,pixels}=readRgbaPng(png),idat=chunk('IDAT',filteredRgba(width,height,pixels));
 let inserted=false;const output=[png.subarray(0,8)];
 for(const part of chunks){
  if(part.type==='IDAT'){if(!inserted){output.push(idat);inserted=true;}}
  else output.push(part.bytes);
 }
 if(!inserted)throw Error('Missing PNG image data');
 const candidate=Buffer.concat(output);
 if(candidate.length>=png.length)return null;
 const decoded=readRgbaPng(candidate);
 if(decoded.width!==width||decoded.height!==height||!decoded.pixels.equals(pixels))throw Error('Lossless PNG preservation failed');
 return candidate;
}
