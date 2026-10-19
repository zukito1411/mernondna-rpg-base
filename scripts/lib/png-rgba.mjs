// Small offline authoring codec for non-interlaced 8-bit RGBA PNG artwork.
import {inflateSync,deflateSync} from 'node:zlib';
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
 const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
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
export function writeRgbaPng(width,height,pixels){
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const stride=width*4,raw=Buffer.alloc((stride+1)*height);
 for(let y=0;y<height;y++)pixels.subarray(y*stride,(y+1)*stride).copy(raw,y*(stride+1)+1);
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
