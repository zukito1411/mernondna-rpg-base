import {describe,expect,it} from 'vitest';
import {fitAtlasPoses,atlasGroundY,type AtlasPose} from '../src/game/systems/atlasPoseFit';

function bounds(pose:AtlasPose,fit:number,width:number,ground:number){
 const [x,y,w,h]=pose.region;
 return {left:width/2+(x-pose.rootX)*fit,right:width/2+(x+w-pose.rootX)*fit,
  top:ground+(y-pose.rootY)*fit,bottom:ground+(y+h-pose.rootY)*fit};
}
describe('resilient boot-time sprite atlas geometry',()=>{
 const width=192,height=144,ground=142;
 const safe=(poses:AtlasPose[],fit:number,pad=2,origin=ground)=>{
  for(const pose of poses){
   const b=bounds(pose,fit,width,origin);
   expect(b.left).toBeGreaterThanOrEqual(pad-.0001);
   expect(b.right).toBeLessThanOrEqual(width-pad+.0001);
   expect(b.top).toBeGreaterThanOrEqual(pad-.0001);
   expect(b.bottom).toBeLessThanOrEqual(height-pad+.0001);
  }
 };

 it('retains the requested animation scale when all poses fit',()=>{
  const poses:AtlasPose[]=[{region:[15,0,88,115],rootX:62,rootY:115}];
  expect(fitAtlasPoses(.95,width,height,ground,poses)).toBe(.95);
  safe(poses,.95);
 });
 it('contains bandit death poses that spread horizontally without throwing',()=>{
  const poses:AtlasPose[]=[
   {region:[80,0,150,95],rootX:165,rootY:95},
   {region:[220,0,380,55],rootX:280,rootY:55},
   {region:[600,0,180,115],rootX:690,rootY:115},
  ];
  const original=1.1;
  expect(bounds(poses[1],original,width,ground).right).toBeGreaterThan(width);
  const fit=fitAtlasPoses(original,width,height,ground,poses);
  expect(fit).toBeGreaterThan(0);
  expect(fit).toBeLessThan(original);
  safe(poses,fit);
 });
 it('handles weapon reach left, tall jumps and below-ground poses together',()=>{
  const poses:AtlasPose[]=[
   {region:[0,0,440,100],rootX:400,rootY:100},
   {region:[0,0,110,330],rootX:55,rootY:330},
   {region:[0,0,90,100],rootX:45,rootY:70}
  ];
  const fit=fitAtlasPoses(1,width,height,ground,poses);
  safe(poses,fit,2,atlasGroundY(ground,height,poses,fit));
 });
 it('calculates a common per-animation fit regardless of pose order',()=>{
  const poses:AtlasPose[]=[
   {region:[50,50,80,110],rootX:90,rootY:160},
   {region:[200,100,420,65],rootX:280,rootY:165},
  ];
  expect(fitAtlasPoses(1,width,height,ground,poses)).toBeCloseTo(
   fitAtlasPoses(1,width,height,ground,poses.slice().reverse()));
 });
 it('accounts for source roots and frames with non-bottom alignment',()=>{
  const poses:AtlasPose[]=[{region:[90,30,170,120],rootX:140,rootY:90}];
  const fit=fitAtlasPoses(.8,width,height,112,poses,3);
  const origin=atlasGroundY(112,height,poses,fit,3);
  const b=bounds(poses[0],fit,width,origin);
  expect(b.left).toBeGreaterThanOrEqual(3);
  expect(b.top).toBeGreaterThanOrEqual(3);
  expect(b.bottom).toBeLessThanOrEqual(height-3);
 });
 it('refuses genuinely invalid bounds rather than returning NaN or rendering garbage',()=>{
  expect(()=>fitAtlasPoses(1,width,height,ground,[{region:[0,0,0,120],rootX:0,rootY:120}])).toThrow();
  expect(()=>fitAtlasPoses(Infinity,width,height,ground,[{region:[0,0,50,50],rootX:25,rootY:50}])).toThrow();
 });
});
