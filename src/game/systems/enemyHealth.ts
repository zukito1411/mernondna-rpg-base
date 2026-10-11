import type {ContentState} from '../types';
/** Explicit maxima distinguish untouched spawn defaults from recorded damage.
 * Legacy records without a maximum retain their saved HP, including base HP. */
export function restoredEnemyHealth(state:Pick<ContentState,'hp'|'hpMax'>,maximum:number){
 if(state.hp===undefined)return maximum;
 const hp=state.hpMax?state.hp/state.hpMax*maximum:state.hp;
 return Math.max(0,Math.min(maximum,hp));
}
