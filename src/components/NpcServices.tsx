import {useGameStore} from '../store/gameStore';
import {EDMUND_ATWOOD_ID} from '../data/npcs';
import {BOSS_WEAPONS,isBlacksmith,itemName} from '../data/economy';
import {MAX_WEAPON_UPGRADE,enhancedWeapon,weaponUpgradeRank} from '../data/weaponUpgrades';
import {goldLabel} from '../utils/localPlayCheats';

const bossIds=[...new Set(Object.values(BOSS_WEAPONS).map(b=>b.id))];

/** The dialogue's final line is required; store actions repeat all eligibility checks. */
export function NpcServices({npcId}:{npcId:string}){
 const gold=useGameStore(s=>s.gold),attributes=useGameStore(s=>s.attributes),inventory=useGameStore(s=>s.inventory);
 const upgrades=useGameStore(s=>s.weaponUpgrades),materials=useGameStore(s=>s.bossMaterials);
 const reset=useGameStore(s=>s.resetAttributes),upgrade=useGameStore(s=>s.enhanceBossWeapon);
 const spent=Object.values(attributes).reduce((sum,n)=>sum+n,0);
 const smith=isBlacksmith(npcId);
 if(npcId!==EDMUND_ATWOOD_ID&&!smith)return null;
 const ownedBossWeapons=bossIds.filter(id=>inventory.includes(id));
 return <section className="merchant-stock" aria-label="NPC services">
   {npcId===EDMUND_ATWOOD_ID&&<>
     <h3>Retrain attributes</h3>
     <p>Return {spent} spent attribute points to redistribute freely. Keep your level, talents, skills and equipment.</p>
     <button type="button" disabled={spent===0||gold<1500} onClick={()=>{
       if(window.confirm('Pay 1,500 gold to Edmund and refund all spent attribute points? Your level and learned skills will stay the same.'))reset(npcId);
     }}>Reset attributes · 1,500 gold</button>
     {gold<1500&&<small>You need {goldLabel(1500-gold)} more gold.</small>}
   </>}
   {smith&&<details>
     <summary>Enhance boss weapons · {ownedBossWeapons.length} owned</summary>
     <p>A duplicate of the same boss weapon is needed for each enhancement. Each rank adds 8% base damage, 2% faster attack recovery and +1 percentage point status chance. Maximum +{MAX_WEAPON_UPGRADE}. No gold cost.</p>
     {!ownedBossWeapons.length&&<p>Find a boss weapon first. Extra copies become forge materials instead of being automatically sold.</p>}
     {ownedBossWeapons.map(id=>{
       const rank=weaponUpgradeRank(id,upgrades),qty=materials[id]??0,weapon=enhancedWeapon(id,upgrades);
       return <article className="item-row" key={id}>
         <div><strong>{itemName(id)} {rank>0?`+${rank}`:''}</strong>
           <small>{weapon.damage} damage · {qty} duplicate {qty===1?'material':'materials'} available · {rank}/{MAX_WEAPON_UPGRADE}</small>
         </div>
         <button type="button" disabled={rank>=MAX_WEAPON_UPGRADE||qty<1}
           onClick={()=>upgrade(npcId,id)}>{rank>=MAX_WEAPON_UPGRADE?'Max':qty<1?'Need duplicate':'Enhance +1'}</button>
       </article>;
     })}
   </details>}
 </section>;
}
