import type {Vec2} from '../types';

// Player/NPC/enemy origin registration uses world y as the physical ground
// line. Never reintroduce a sprite-padding offset (the old +23px ring).
export function groundMarkerPosition(actor:Vec2):Vec2{
  return {x:actor.x,y:actor.y+2};
}
