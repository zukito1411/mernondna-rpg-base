/** One authored chamber painting and one exact circular gameplay boundary.
 * Coordinates stay shared by entry, floor transitions, collision and room map. */
export const TOWER_ROOM_ART='assets/interiors/tower_of_might/arena-v1.png';
export const TOWER_ROOM_SIZE=1800;
// Painting includes the surrounding raised rim and transparent gutters. Its
// complete art extent is larger than the floor, with a safe inner stone radius.
export const TOWER_ROOM_ART_EXTENT=2048;
export const TOWER_ROUND_FLOOR={x:900,y:900,radius:710} as const;
// Spawn north of the tall foreground doorway, never underneath its artwork.
export const TOWER_SOUTH_ENTRY={x:900,y:1400} as const;
export const TOWER_SOUTH_DOOR={x:900,y:1655} as const;
