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
  backstory: 'Leigneron grew up in Oakmere under the eye of retired roadwarden Aldren Vale. The base game deliberately keeps the deeper family history editable so future story work can define it without rewriting core systems.',
};
