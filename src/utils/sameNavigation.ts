import type {NavigationState,QuestTarget,Vec2} from '../game/types';

const pointEqual=(a:Vec2|undefined,b:Vec2|undefined)=>a===b||Boolean(a&&b&&a.x===b.x&&a.y===b.y);
function targetEqual(a:QuestTarget|null,b:QuestTarget|null){
  return a===b||Boolean(a&&b&&a.contentId===b.contentId&&a.label===b.label&&a.questId===b.questId
    &&a.objectiveId===b.objectiveId&&a.type===b.type&&a.x===b.x&&a.y===b.y
    &&a.travelHint===b.travelHint&&a.interiorId===b.interiorId&&pointEqual(a.worldLocation,b.worldLocation)
    &&pointEqual(a.waypoint,b.waypoint)&&a.waypoint?.label===b.waypoint?.label);
}

/** Compare actual displayed values, including room geometry and moving markers.
 * Returning the old Zustand state avoids notifying every subscriber when idle. */
export function sameNavigation(a:NavigationState,b:NavigationState):boolean {
  return a===b||a.heading===b.heading&&a.interaction===b.interaction&&a.interiorName===b.interiorName
    &&pointEqual(a.playerPosition,b.playerPosition)&&targetEqual(a.target,b.target)
    &&pointEqual(a.interiorCircle,b.interiorCircle)&&a.interiorCircle?.radius===b.interiorCircle?.radius
    &&a.interiorFloors?.length===b.interiorFloors?.length
    &&(a.interiorFloors===b.interiorFloors||Boolean(a.interiorFloors?.every((floor,i)=>{
      const other=b.interiorFloors?.[i];
      return other&&pointEqual(floor,other)&&floor.width===other.width&&floor.height===other.height;
    })))
    &&a.markers.length===b.markers.length
    &&a.markers.every((marker,i)=>{
      const other=b.markers[i];
      return marker===other||marker.id===other.id&&marker.kind===other.kind&&marker.service===other.service
        &&marker.label===other.label&&marker.x===other.x&&marker.y===other.y;
    });
}
