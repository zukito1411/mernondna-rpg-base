import type {ContentDefinition} from '../types';
import type {Rect} from '../../data/settlementGeometry';

// Keep both the enemy's foot position and combat approaches clear. Use the
// same reservation in every procedural scenery planner, across chunk seams.
export const BOSS_CLEARING_RADIUS=510;
export function bossArenaBounds(definition:ContentDefinition):Rect|undefined{
  if(definition.kind!=='creature'||!definition.bossId
    ||definition.bossId==='salt-king'||definition.bossId==='varkhul')return;
  const {x,y}=definition.world;
  return {left:x-BOSS_CLEARING_RADIUS,right:x+BOSS_CLEARING_RADIUS,
    top:y-BOSS_CLEARING_RADIUS,bottom:y+BOSS_CLEARING_RADIUS};
}
