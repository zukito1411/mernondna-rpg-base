import type { Vec2 } from '../types';

/** A brief excursion inside the NPC's authored neighborhood, then home. */
export function patrolDestination(home:Vec2, current:Vec2, radius:number, random:() => number,
  canVisit:(from:Vec2,to:Vec2) => boolean):Vec2 | null {
  for (let attempt = 0; attempt < 12; attempt++) {
    const angle = random() * Math.PI * 2, distance = radius * (.45 + random() * .55);
    const target = { x:home.x + Math.cos(angle) * distance,y:home.y + Math.sin(angle) * distance };
    if (canVisit(current,target) && canVisit(home,target)) return target;
  }
  return null;
}
