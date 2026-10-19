/** A body's upright height, not its weapon, spell halo or raised hand. */
export const HERO_BODY_HEIGHT=76;
export const HERO_BODY_REGISTRATION_VERSION=1;

export function heroReferenceHeight(heights:readonly number[]):number {
 if(!heights.length||heights.some(h=>!Number.isFinite(h)||h<=0))throw new Error('Missing hero body reference');
 return heights.reduce((sum,h)=>sum+h,0)/heights.length;
}

interface BodyFrame {
 height:number;originY:number;
 bodyScale?:number;bodyOffsetY?:number;
}
export interface HeroAlphaBounds {top:number;bottom:number}

/** Offline registration of already prepared artwork. One uniform scale per
 * clip (per facing for the attack board), NEVER a scale per action frame.
 * Opening/recovery poses supply upright measurements: crouches, jumps, capes,
 * raised arms and spell arcs must not resize the character during the action.
 * Offsets are world units and preserve the existing within-clip trajectories. */
export function registerHeroBodyFrames<T extends BodyFrame>(state:string,frames:readonly T[],bounds:readonly HeroAlphaBounds[],density:number):T[] {
 if(frames.length!==bounds.length||frames.length%6!==0||density<=0)throw new Error('Incomplete hero body registration');
 const result=frames.map(f=>({...f}));
 for(let start=0;start<frames.length;start+=6){
  const indices=state.startsWith('walk-')||state.startsWith('idle-')
   ?Array.from({length:6},(_,i)=>start+i):[start,start+5];
  const bodyHeight=heroReferenceHeight(indices.map(i=>(bounds[i].bottom-bounds[i].top)/density));
  // Every run frame is flexed/leaning, including opening/recovery: it is NOT
  // an upright reference. Running art is prepared at its side-walk head/body
  // scale, and must never be inflated to fill the standing-height envelope.
  const scale=state==='run-side'?1:HERO_BODY_HEIGHT/bodyHeight;
  const ground=Math.max(...indices.map(i=>(bounds[i].bottom-frames[i].height*frames[i].originY)/density));
  // Skill actors are deliberately spawned 20 units above the player's feet.
  const targetGround=['walk-','idle-','run-','attack'].some(s=>state.startsWith(s))?0:20;
  const offset=targetGround-ground*scale;
  for(let i=start;i<start+6;i++)Object.assign(result[i],{bodyScale:scale,bodyOffsetY:offset});
 }
 return result;
}
