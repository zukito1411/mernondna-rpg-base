import { TOWN_BY_ID } from './towns';
import { SETTLEMENT_LAYOUTS } from './settlements';
export const FARM_PLOTS = SETTLEMENT_LAYOUTS.flatMap(layout => layout.parcels.filter(p => p.id.startsWith('farm:')).map(p => ({
  ...p,x:TOWN_BY_ID[layout.townId].world.x + p.x,y:TOWN_BY_ID[layout.townId].world.y + p.y,townId:layout.townId,
})));
