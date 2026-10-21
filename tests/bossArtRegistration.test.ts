import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {ART_BY_KEY,artScale} from '../src/data/art';
import magus from '../src/data/grandMagusAtlas.json';
import {BOSS_MOTION_ART,BOSS_MOTION_COLUMNS,BOSS_MOTION_ROWS,BOSS_MOTION_START,
 BOSS_MOTION_SEA_SWEEP,BOSS_SKILL_CELL} from '../src/data/bossSkillEffects';

it('preserves logical Magus feet and size while doubling physical body detail',()=>{
 expect(magus.density).toBe(2);expect(ART_BY_KEY.enemy_grand_magus.density).toBe(2);
 expect(artScale('enemy_grand_magus')*magus.density).toBe(1);
 expect(Object.keys(magus.frames)).toHaveLength(62);
 for(const [id,frame] of Object.entries(magus.frames)){
  const [fw,fh,x,y,w,h]=frame.trim,[sx,sy,sw,sh]=frame.rect;
  expect([w,h]).toEqual([sw,sh]);
  expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);
  expect(x+w).toBeLessThanOrEqual(fw);expect(y+h).toBeLessThanOrEqual(fh);
  expect(sx+sw).toBeLessThanOrEqual(magus.width);expect(sy+sh).toBeLessThanOrEqual(magus.height);
  if(Number(id)<58){
   expect([fw,fh]).toEqual([448,448]);
   expect(frame.visibleBounds.top+frame.visibleBounds.height).toBeCloseTo(210);
  }else expect([fw,fh]).toEqual([64,64]);
  if(frame.castOrigin){
   expect(frame.castOrigin.x).toBeGreaterThanOrEqual(0);expect(frame.castOrigin.x).toBeLessThanOrEqual(fw);
   expect(frame.castOrigin.y).toBeGreaterThanOrEqual(0);expect(frame.castOrigin.y).toBeLessThanOrEqual(fh);
  }
 }
 expect(magus.frames['0'].rect).toEqual(magus.frames['2'].rect);
 expect(magus.frames['46'].castOrigin!.x+magus.frames['48'].castOrigin!.x).toBeCloseTo(448);
});

it('registers every four-stage boss clip inside the committed motion atlas',()=>{
 const starts=[...Object.values(BOSS_MOTION_START),BOSS_MOTION_SEA_SWEEP];
 expect(new Set(starts).size).toBe(10);
 expect(starts.flatMap(start=>[start,start+1,start+2,start+3]).sort((a,b)=>a-b))
  .toEqual(Array.from({length:40},(_,i)=>i));
 const source=readFileSync('public/'+BOSS_MOTION_ART);
 expect(source.readUInt32BE(16)).toBe(BOSS_MOTION_COLUMNS*BOSS_SKILL_CELL);
 expect(source.readUInt32BE(20)).toBe(BOSS_MOTION_ROWS*BOSS_SKILL_CELL);
});
