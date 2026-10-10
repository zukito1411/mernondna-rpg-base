import { describe,it,expect } from 'vitest';
import { existsSync,readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NPCS } from '../src/data/npcs';
import { NPC_IDLE_ART } from '../src/data/npcIdleArt';
import { GUARD_MARCH_ART } from '../src/data/guardMarchArt';
import { ART_SHEETS } from '../src/data/art';

describe('Elarion residents',()=>{
  const residents=NPCS.filter(npc=>npc.townId==='elarion');

  it('uses only the supplied elven resident art families',()=>{
    expect(residents.length).toBeGreaterThan(0);
    for(const npc of residents)
      expect(['npc_elven_guard_idle','npc_elven_man_idle','npc_elven_woman_idle','npc_elven_king_idle','npc_huntress']).toContain(npc.spriteTexture);
  });
  it('places the animated elven king at Whitebough Hall’s entrance',()=>{
    const king=residents.find(npc=>npc.id==='elarion-king')!;
    expect(king).toMatchObject({title:'King of the Elves',spriteTexture:'npc_elven_king_idle',stationary:true,
      worldOffset:{x:-700,y:-650}});
    expect(NPC_IDLE_ART.find(entry=>entry.walk==='npc_elven_king')).toMatchObject({
      key:'npc_elven_king_idle',path:'assets/npcs/elven_npc/elarion_king.png',height:128,imageSize:[2048,768],
    });
    const png=readFileSync(resolve('public','assets/npcs/elven_npc/elarion_king.png'));
    expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([2048,768]);
  });

  it('registers the king idle atlas once with room for every full-height pose',()=>{
    const kingSheets=ART_SHEETS.filter(sheet=>sheet.key==='npc_elven_king_idle');
    expect(kingSheets).toHaveLength(1);
    const kingSheet=kingSheets[0];
    expect(kingSheet.frameHeight).toBe(168);
    const king=NPC_IDLE_ART.find(entry=>entry.walk==='npc_elven_king')!;
    const renderedHeight=Math.max(...king.regions.map(region=>region[3]))*
      (king.height!/king.bodyHeight);
    expect(renderedHeight+2).toBeLessThan(kingSheet.frameHeight);
  });

  it('assigns complete elven marching art to every city sentinel',()=>{
    const guards=residents.filter(npc=>npc.spriteTexture==='npc_elven_guard_idle');
    expect(guards.length).toBeGreaterThanOrEqual(7);
    for(const guard of guards.filter(npc=>!npc.stationary))expect(guard.patrolRadius).toBeGreaterThan(0);
    const hallGuards=guards.filter(npc=>npc.stationary);
    expect(hallGuards).toHaveLength(2);
    expect(hallGuards.map(guard=>guard.worldOffset)).toEqual([{x:-840,y:-650},{x:-560,y:-650}]);
    expect(new Set(hallGuards.map(guard=>guard.worldOffset.y)).size).toBe(1);
    for(const guard of hallGuards)expect(guard.patrolRadius).toBe(0);
    const march=GUARD_MARCH_ART.find(art=>art.walk==='npc_elven_guard')!;
    expect(march.path).toBe('assets/npcs/elven_guard/elven_guard.png');
    expect(march.grid).toEqual({columns:6,rows:4});
    const png=readFileSync(resolve('public',march.path));
    expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([1536,1024]);
  });

  it('loads the elven idle strips with frame regions contained within their source cells',()=>{
    const idleFamilies=['npc_elven_guard_idle','npc_elven_man_idle','npc_elven_woman_idle'];
    for(const family of idleFamilies){
      const art=NPC_IDLE_ART.find(entry=>entry.key===family)!;
      expect(existsSync(resolve('public',art.path))).toBe(true);
      for(const [frame,[x,y,width,height]] of art.regions.entries()){
        expect(x).toBeGreaterThanOrEqual(frame*362);
        expect(x+width).toBeLessThanOrEqual((frame+1)*362);
        expect(y+height).toBeLessThanOrEqual(724);
      }
    }
  });
});
