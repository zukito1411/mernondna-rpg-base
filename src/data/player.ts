import { TOWN_BY_ID } from './towns';

export const LEIGNERON = {
  id: 'leigneron',
  name: 'Leigneron',
  title: 'Roadborn Wanderer',
  homeTownId: 'oakmere',
  spawn: {
    x: TOWN_BY_ID.oakmere.world.x,
    y: TOWN_BY_ID.oakmere.world.y + 80,
  },
  starterWeaponId: 'roadwarden-sword',
  backstory: 'Leigneron grew up in Oakmere under retired roadwarden Aldren Vale after his parents failed to return from a relief journey. His mother surveyed public springs and shelters; his father kept their wagon on the roads. He inherits their keeper’s compass, not a royal destiny, and learns to protect the living while searching for the truth behind their stolen survey.',
};
