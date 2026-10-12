import {localSettlementTravelEnabled} from './localSettlementTravel';

/** Development-only, including home-Wi-Fi phones; never enabled by a release
 * bundle. Keep normal combat for automated e2e runs unless explicitly opted in. */
export function localPlayCheatsEnabled():boolean {
  if(!localSettlementTravelEnabled())return false;
  const query=new URLSearchParams(window.location.search);
  if(query.get('localCheats')==='0')return false;
  return !query.has('e2e')||query.get('localCheats')==='1';
}
