import {merchantStock,itemName,POTIONS,type PotionId} from '../data/economy';
import {WEAPON_BY_ID} from '../data/weapons';
import {useGameStore} from '../store/gameStore';
import {ItemIcon} from './ItemIcon';
import {goldLabel} from '../utils/localPlayCheats';
import {WEAPON_PROFILES} from '../data/weaponProfiles';
export function MerchantStock({npcId}:{npcId:string}){
  const gold=useGameStore(s=>s.gold),level=useGameStore(s=>s.level),inventory=useGameStore(s=>s.inventory),consumables=useGameStore(s=>s.consumables),buy=useGameStore(s=>s.buyItem);
  const offers=merchantStock(npcId);if(!offers.length)return null;
  return <section className="merchant-stock"><h3>Goods for the road · {goldLabel(gold)} gold</h3>
    {offers.map(o=>{const weapon=WEAPON_BY_ID[o.id],owned=weapon&&inventory.includes(o.id),full=!weapon&&consumables[o.id as PotionId]>=99;
      const proc=WEAPON_PROFILES[o.id]?.proc;
      return <article className="item-row" key={o.id}><ItemIcon id={o.id}/><div><strong>{itemName(o.id)}</strong><small>{weapon?`${weapon.damage} damage · level ${o.minLevel}`:POTIONS[o.id as PotionId].description}</small>{proc&&<small>{proc.name} · {Math.round(proc.chance*100)}% chance on normal hits</small>}</div>
        <button type="button" disabled={Boolean(owned||full||gold<o.price||level<o.minLevel)} onClick={()=>buy(npcId,o.id)}>{owned?'Owned':full?'Full':`${o.price} gold`}</button></article>;
    })}</section>;
}
