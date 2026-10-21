import type {BossCombatProfile} from '../../data/bossCombatProfiles';
import type {BossPhaseSnapshot} from '../types';

export const BOSS_PHASE_TWO_TRANSITION_MS=1250;
/** Encounter resolve latch, snapshotted with the actor. A roar's own full heal
 * never restores spent resolve; only explicit disengaged recovery/respawn can. */
export class BossPhaseState {
 private entered=false;
 private elapsed:number|null=null;
 private startRatio=0;
 get phase():1|2{return this.entered?2:1;}
 get transitioning(){return this.elapsed!==null;}
 get progress(){return this.elapsed===null?null:Math.min(1,this.elapsed/BOSS_PHASE_TWO_TRANSITION_MS);}
 /** Called by the damage owner only after the first health bar is depleted.
  * Latch immediately, before defeat handling or a save snapshot can run. */
 deplete(profile:BossCombatProfile,hp:number){
  if(hp>0||!Number.isFinite(hp)||!profile.phaseTwo||this.entered)return false;
  this.entered=true;this.elapsed=0;this.startRatio=0;return true;
 }
 advance(delta:number){
  if(this.elapsed===null)return false;
  this.elapsed+=Math.max(0,delta);
  if(this.elapsed<BOSS_PHASE_TWO_TRANSITION_MS)return false;
  this.elapsed=null;return true;
 }
 refillHp(maximum:number){
  const p=this.progress??1,t=p*p*(3-2*p);
  return Math.min(maximum,Math.ceil(maximum*(this.startRatio+(1-this.startRatio)*t)));
 }
 reset(){this.entered=false;this.elapsed=null;this.startRatio=0;}
 snapshot():BossPhaseSnapshot|undefined{
  if(!this.entered)return;
  return {phase:2,...(this.elapsed!==null?{refill:{elapsedMs:this.elapsed,startRatio:this.startRatio}}:{})};
 }
 restore(snapshot:BossPhaseSnapshot){
  this.entered=true;
  this.elapsed=snapshot.refill?.elapsedMs??null;this.startRatio=snapshot.refill?.startRatio??0;
 }
}

/** Optional new metadata must never reject an otherwise recoverable old save.
 * Retain spent resolve even if only the animation's optional timing is damaged. */
export function parseBossPhaseSnapshot(value:unknown):BossPhaseSnapshot|undefined{
 if(!value||typeof value!=='object'||!('phase' in value)||value.phase!==2)return;
 const refill='refill' in value?value.refill:null;
 if(refill&&typeof refill==='object'&&'elapsedMs' in refill&&'startRatio' in refill
   &&typeof refill.elapsedMs==='number'&&Number.isFinite(refill.elapsedMs)&&refill.elapsedMs>=0&&refill.elapsedMs<BOSS_PHASE_TWO_TRANSITION_MS
   &&typeof refill.startRatio==='number'&&Number.isFinite(refill.startRatio)&&refill.startRatio>=0&&refill.startRatio<=1)
  return {phase:2,refill:{elapsedMs:refill.elapsedMs,startRatio:refill.startRatio}};
 return {phase:2};
}
