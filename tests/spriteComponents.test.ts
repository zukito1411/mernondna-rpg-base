import {describe,it,expect} from 'vitest';
import {actorSpriteRegions,actorSpriteSubjects} from '../src/game/systems/spriteComponents';
describe('complete actor sprite regions',()=>{
 it('keeps seam-crossing feet with their actor and retains disconnected gear',()=>{
  const width=80,height=100,pixels=new Uint8ClampedArray(width*height*4);
  const paint=(x:number,y:number,w:number,h:number)=>{for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)pixels[(py*width+px)*4+3]=255;};
  paint(8,10,24,42);paint(48,7,24,41);paint(8,62,24,28);paint(48,62,24,28);
  paint(34,20,3,20);
  expect(actorSpriteRegions(pixels,width,height,2,2)).toEqual([[8,10,29,42],[48,7,24,41],[8,62,24,28],[48,62,24,28]]);
 });
 it('rejects missing actors instead of reusing neighboring artwork',()=>{
  const pixels=new Uint8ClampedArray(40*40*4);
  for(let i=0;i<400;i++)pixels[i*4+3]=255;
  expect(()=>actorSpriteRegions(pixels,40,40,2,2)).toThrow('expected complete actors');
 });
 it('keeps complete subjects isolated when their bounding rectangles overlap',()=>{
  const width=90,height=90,pixels=new Uint8ClampedArray(width*height*4);
  const paint=(x:number,y:number,w:number,h:number,color:readonly number[])=>{
   for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)pixels.set(color,(py*width+px)*4);
  };
  paint(8,10,52,10,[255,0,0,255]);paint(8,10,10,60,[255,0,0,255]);
  paint(36,30,20,20,[0,0,255,255]);
  const subjects=actorSpriteSubjects(pixels,width,height,2,1),a=subjects[0],b=subjects[1];
  expect(a.region).toEqual([8,10,52,60]);expect(b.region).toEqual([36,30,20,20]);
  // The blue actor is inside the red actor's bounding box but is never copied
  // into its frame. Every red body pixel and every blue body pixel survives.
  expect(a.pixels[((40-10)*52+45-8)*4+3]).toBe(0);
  expect(a.foreignProbes.length).toBeGreaterThan(0);
  expect(Array.from(a.pixels).filter((v,i)=>i%4===0&&v===255)).toHaveLength(1020);
  expect(Array.from(b.pixels).filter((v,i)=>i%4===2&&v===255)).toHaveLength(400);
 });
});
