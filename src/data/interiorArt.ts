import type {SpriteRegion} from './art';

// Semantic windows inspected on all nine boards. Runtime masks isolate the
// complete main subject and nearby details; never interpret grid index as role.
export const INTERIOR_ART={
  northWall:[515,20,305,235],sideWall:[835,20,130,245],
  doorway:[980,20,282,240],window:[1275,45,240,215],
  bed:[35,267,225,270],wardrobe:[272,267,232,253],bookcase:[510,260,240,264],
  chest:[758,340,190,181],table:[950,285,345,240],bench:[1295,345,220,177],
  chair:[45,537,140,217],counter:[214,542,291,203],hearth:[513,509,280,251],
  rug:[794,548,320,213],planter:[1120,531,156,218],barrel:[1315,534,197,209],
  pantry:[28,745,263,249],lantern:[310,746,190,243],stairs:[505,742,195,252],
  arch:[688,742,303,252],workstation:[982,742,311,252],signature:[1256,733,267,261],
} satisfies Record<string,SpriteRegion>;
export type InteriorArtKey=keyof typeof INTERIOR_ART;
// Floor crops deliberately exclude the illustrated outer square border.
export const INTERIOR_FLOORS:SpriteRegion[]=[[65,65,176,176],[310,65,176,176]];
export function interiorFloorIndex(kit:string,kind?:string):0|1 {
  const timberFirst=['trandum_rustic','portquill_maritime','frostlands_longhouse'].includes(kit);
  if(kind==='bedroom'||kind==='barracks')return timberFirst?0:1;
  if(kind==='kitchen'||kind==='storage'||kind==='workshop')return timberFirst?1:0;
  return 0;
}
