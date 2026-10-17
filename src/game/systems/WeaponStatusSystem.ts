import type {WeaponProc,WeaponStatus} from '../../data/weaponProfiles';
import {statusSusceptibility} from '../../data/creatureLore';

const STATUS_TINT:Record<WeaponStatus,number>={burn:0xffb6a6,poison:0xd6acff,frost:0xadd8ff,bleed:0xffb6bd,expose:0xffe5af};
const STATUS_COLOR:Record<WeaponStatus,number>={burn:0xff957d,poison:0xbb80f0,frost:0x83c9ff,bleed:0xe58c93,expose:0xf1d08a};

/** One transient effect per victim. Active-play delta makes menus/focus pause
 * damage and control together. Unloading clears effects, never saved HP. */
export class WeaponStatusSystem {
  private clock=0;
  private nextProcAt=0;
  private effect:{proc:WeaponProc;started:number;ends:number;nextTick:number;damage:number;boss:boolean}|null=null;
  get active(){return this.effect!==null;}
  get name(){return this.effect?.proc.name??null;}
  get color(){return this.effect?STATUS_COLOR[this.effect.proc.status]:0xffffff;}
  get tint(){return this.effect?STATUS_TINT[this.effect.proc.status]:0xffffff;}
  get movementMultiplier(){return this.effect?.proc.status==='frost'?(this.effect.boss ? .85 : .65):1;}
  get attackSpeedMultiplier(){return this.movementMultiplier;}
  get directDamageMultiplier(){return this.effect?.proc.status==='expose'?(this.effect.boss?1.06:1.12):1;}
  tryApply(proc:WeaponProc,baseDamage:number,enemyId:string,boss:boolean,random:()=>number=Math.random):boolean {
    if(this.effect||this.clock<this.nextProcAt||!Number.isFinite(baseDamage)||baseDamage<=0)return false;
    const susceptibility=statusSusceptibility(enemyId,proc.status);
    if(susceptibility===0||random()>=proc.chance)return false;
    const duration=proc.status==='frost'?(boss?Math.min(1400,proc.durationMs):proc.durationMs)*Math.min(1,susceptibility):proc.durationMs;
    this.effect={proc,started:this.clock,ends:this.clock+duration,nextTick:this.clock+1000,
      damage:baseDamage*proc.damagePerSecond*susceptibility*(boss ? .5 : 1),boss};
    this.nextProcAt=this.clock+proc.cooldownMs;
    return true;
  }
  update(delta:number,canDamage=true):number {
    this.clock+=Math.max(0,Math.min(250,Number.isFinite(delta)?delta:0));
    const effect=this.effect;if(!effect)return 0;
    let damage=0;
    while(effect.nextTick<=this.clock&&effect.nextTick<=effect.ends){
      if(canDamage)damage+=effect.damage;
      effect.nextTick+=1000;
    }
    if(this.clock>=effect.ends)this.effect=null;
    return damage;
  }
  clear(){this.effect=null;}
}
