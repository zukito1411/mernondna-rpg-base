import {describe,expect,it} from 'vitest';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {REGION_MUSIC} from '../src/game/systems/regionMusic';
import {REGIONS} from '../src/data/regions';

describe('regional background music',()=>{
  it('assigns music to every standard region and the Dead Sea',()=>{
    const assignedRegions=new Set([...REGIONS.map(region=>region.id),'dead-sea']);
    expect(Object.keys(REGION_MUSIC).sort()).toEqual([...assignedRegions].sort());
    expect(Object.values(REGION_MUSIC).every(path=>path.startsWith('/assets/audio/'))).toBe(true);
    expect(Object.values(REGION_MUSIC).every(path=>existsSync(fileURLToPath(new URL(`../public${path}`,import.meta.url))))).toBe(true);
  });

  it('uses contrasting themes for the requested regional moods',()=>{
    expect(REGION_MUSIC.nardorous).toBe(REGION_MUSIC.frostlands);
    expect(REGION_MUSIC.portquill).toBe(REGION_MUSIC['dead-sea']);
    expect(new Set([REGION_MUSIC.narenthil,REGION_MUSIC.rindass,REGION_MUSIC.darkav]).size).toBe(3);
  });
});
