import { TOWNS } from './towns';
import type { InteractableContentDefinition, Vec2 } from '../game/types';

export interface TownShrine {
  townId:string; contentId:string; name:string; world:Vec2; arrival:Vec2; scale:number;
}

export const TOWN_SHRINES:TownShrine[] = TOWNS.map(town => {
  const offset = town.id === 'oakmere' ? { x:40,y:-270 } : town.id === 'highmere' ? { x:-300,y:320 } : { x:140,y:-110 };
  const world = { x:town.world.x + offset.x,y:town.world.y + offset.y };
  return { townId:town.id,contentId:town.id === 'oakmere' ? 'shrine:oakmere-road'
    : town.id === 'highmere' ? 'town:highmere:building:12' : `shrine:${town.id}:wayfarer`,
    name:`${town.name} ${town.id === 'highmere' ? 'Crown' : 'Wayfarer'} Shrine`,world,
    arrival:{ x:world.x,y:world.y + 64 },scale:town.id === 'highmere' ? .9 : .8 };
});
export const TOWN_SHRINE_BY_ID = Object.fromEntries(TOWN_SHRINES.map(shrine => [shrine.townId,shrine])) as Record<string,TownShrine>;

export function townShrineContent(shrine:TownShrine):InteractableContentDefinition {
  return { id:shrine.contentId,kind:'interactable',world:shrine.world,texture:'world_buildings',frame:3,
    scale:shrine.scale,name:shrine.name,townShrineId:shrine.townId,
    description:'Attune to this shrine to unlock its settlement for shrine travel.',
    repeatText:'Choose an attuned settlement shrine to travel to.' };
}
