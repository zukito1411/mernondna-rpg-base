import {describe,it,expect} from 'vitest';
import {WeaponStatusSystem} from '../src/game/systems/WeaponStatusSystem';
import {WEAPON_PROFILES,REGIONAL_SWORDS} from '../src/data/weaponProfiles';
import {WEAPONS,WEAPON_BY_ID} from '../src/data/weapons';
import {ENEMIES} from '../src/data/enemies';
import {CREATURE_LORE} from '../src/data/creatureLore';
import {merchantStock} from '../src/data/economy';
import {NPCS} from '../src/data/npcs';
import {TOWN_BY_ID} from '../src/data/towns';

const advance=(system:WeaponStatusSystem,ms:number,canDamage=true)=>{
  let damage=0;for(let elapsed=0;elapsed<ms;elapsed+=100)damage+=system.update(Math.min(100,ms-elapsed),canDamage);return damage;
};
describe('weapon status balance',()=>{
  it('gives every weapon an authored profile and every enemy real weakness metadata',()=>{
    expect(Object.keys(WEAPON_PROFILES).sort()).toEqual(WEAPONS.map(w=>w.id).sort());
    expect(Object.keys(CREATURE_LORE).sort()).toEqual(ENEMIES.map(e=>e.id).sort());
    for(const profile of Object.values(WEAPON_PROFILES))if(profile.proc){
      expect(profile.proc.chance).toBeGreaterThan(0);expect(profile.proc.chance).toBeLessThanOrEqual(.18);
      expect(profile.proc.cooldownMs).toBeGreaterThanOrEqual(6000);
      expect(profile.proc.damagePerSecond*profile.proc.durationMs/1000).toBeLessThanOrEqual(.5);
    }
  });
  it('makes the three regional swords obtainable from existing local merchants',()=>{
    for(const offer of REGIONAL_SWORDS){
      expect(WEAPON_BY_ID[offer.id].regionAffinity).toBe(offer.region);
      expect(NPCS.some(n=>TOWN_BY_ID[n.townId].regionId===offer.region&&merchantStock(n.id).some(item=>item.id===offer.id)),offer.id).toBe(true);
    }
  });
  it('rolls once per eligible normal strike and never stacks or refreshes an effect',()=>{
    const s=new WeaponStatusSystem(),p=WEAPON_PROFILES['varkhul-emberfang'].proc!;
    expect(s.tryApply(p,100,'road-bandit',false,()=>.99)).toBe(false);
    expect(s.tryApply(p,100,'road-bandit',false,()=>0)).toBe(true);
    expect(s.tryApply(p,10000,'road-bandit',false,()=>0)).toBe(false);
    expect(advance(s,3000)).toBeCloseTo(45);
    expect(s.active).toBe(false);
    expect(s.tryApply(p,100,'road-bandit',false,()=>0)).toBe(false);
    advance(s,3000);expect(s.tryApply(p,100,'road-bandit',false,()=>0)).toBe(true);
  });
  it('uses real fire weaknesses and halves boss damage without scaling to victim HP',()=>{
    const p=WEAPON_PROFILES['varkhul-emberfang'].proc!;
    const normal=new WeaponStatusSystem(),boss=new WeaponStatusSystem();
    normal.tryApply(p,100,'gray-wolf',false,()=>0);boss.tryApply(p,100,'frost-wyrm',true,()=>0);
    expect(advance(normal,3000)).toBeCloseTo(56.25);expect(advance(boss,3000)).toBeCloseTo(33.75);
  });
  it('honors fire, poison, bleeding and frost immunities',()=>{
    for(const [weapon,enemy] of [['varkhul-emberfang','ash-dragon'],['rootfather-thornblade','rootfather'],['varr-rededge','marsh-wraith'],['wyrm-frostedge','frost-wolf']]){
      const s=new WeaponStatusSystem();expect(s.tryApply(WEAPON_PROFILES[weapon].proc!,100,enemy,false,()=>0)).toBe(false);expect(advance(s,6000)).toBe(0);
    }
  });
  it('slows movement and attacks, with a smaller and shorter effect on bosses',()=>{
    const p=WEAPON_PROFILES['wyrm-frostedge'].proc!,normal=new WeaponStatusSystem(),boss=new WeaponStatusSystem();
    normal.tryApply(p,50,'road-bandit',false,()=>0);boss.tryApply(p,50,'bandit-captain',true,()=>0);
    expect(normal.movementMultiplier).toBe(.65);expect(normal.attackSpeedMultiplier).toBe(.65);
    expect(boss.movementMultiplier).toBe(.85);expect(boss.attackSpeedMultiplier).toBe(.85);
    advance(normal,700);expect(normal.movementMultiplier).toBe(.65);
    advance(boss,1400);expect(boss.active).toBe(false);expect(boss.movementMultiplier).toBe(1);
  });
  it('makes poison resistance reduce damage and frost resistance shorten control',()=>{
    const poison=new WeaponStatusSystem(),cold=new WeaponStatusSystem();
    poison.tryApply(WEAPON_PROFILES['rootfather-thornblade'].proc!,100,'grove-spider',false,()=>0);
    expect(advance(poison,4000)).toBeCloseTo(24);
    cold.tryApply(WEAPON_PROFILES['wyrm-frostedge'].proc!,100,'marsh-wraith',false,()=>0);
    advance(cold,1500);expect(cold.active).toBe(false);
  });
  it('does not advance effects while paused, deal catch-up bursts, or defer airborne damage',()=>{
    const s=new WeaponStatusSystem();s.tryApply(WEAPON_PROFILES['varr-rededge'].proc!,100,'road-bandit',false,()=>0);
    expect(s.update(0)).toBe(0);expect(s.active).toBe(true);
    expect(advance(s,1000,false)).toBe(0);expect(advance(s,2000)).toBeCloseTo(24);
    const stalled=new WeaponStatusSystem();stalled.tryApply(WEAPON_PROFILES['varr-rededge'].proc!,100,'road-bandit',false,()=>0);
    expect(stalled.update(60000)).toBe(0);expect(stalled.active).toBe(true);
  });
  it('limits expose to 12% on ordinary foes and 6% on bosses',()=>{
    for(const boss of [false,true]){const s=new WeaponStatusSystem();s.tryApply(WEAPON_PROFILES['stonejaw-edge'].proc!,100,'road-bandit',boss,()=>0);
      expect(s.directDamageMultiplier).toBe(boss?1.06:1.12);expect(advance(s,4000)).toBe(0);expect(s.directDamageMultiplier).toBe(1);
    }
  });
});
