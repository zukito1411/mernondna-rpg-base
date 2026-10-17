import {useState} from 'react';
import {useGameStore} from '../store/gameStore';
import {WEAPON_BY_ID} from '../data/weapons';
import {itemName} from '../data/economy';
import {ATTRIBUTE_RESET_COST,BOSS_FORGE_MATERIAL_IDS,MAX_WEAPON_ENHANCEMENT,enhancedWeapon,isBlacksmith,weaponEnhancementCost} from '../data/forge';

/**
 * These services are only mounted at the end of an actual NPC conversation.
 * The store repeats the same checks before exchanging any gold or materials.
 */
export function ForgeServices({npcId}:{npcId:string}){
  const [weaponChoice,setWeaponChoice]=useState('');
  const [materialChoice,setMaterialChoice]=useState('');
  const gold=useGameStore(s=>s.gold);
  const inventory=useGameStore(s=>s.inventory);
  const weaponUpgrades=useGameStore(s=>s.weaponUpgrades);
  const forgeMaterials=useGameStore(s=>s.forgeMaterials);
  const attributes=useGameStore(s=>s.attributes);
  const resetAttributes=useGameStore(s=>s.resetAttributesAtEdmund);
  const enhanceWeapon=useGameStore(s=>s.enhanceWeaponAtSmith);

  if(npcId==='aldren-vale'){
    const points=Object.values(attributes).reduce((sum,n)=>sum+n,0);
    return <section className="merchant-stock" aria-label="Attribute retraining">
      <h3>Retrain your attributes · {ATTRIBUTE_RESET_COST.toLocaleString()} gold</h3>
      <p>Want to try a different fighting style? I'll help you start over. Your level, talents and equipment won't change. You'll get all {points} spent attribute points back.</p>
      <button type="button" disabled={points===0||gold<ATTRIBUTE_RESET_COST}
        onClick={()=>{if(window.confirm(`Spend ${ATTRIBUTE_RESET_COST.toLocaleString()} gold to return every allocated attribute point? Your learned arts and talents stay the same.`))resetAttributes();}}>
        {points===0?'No points to reset':gold<ATTRIBUTE_RESET_COST?'Not enough gold':'Reset attributes'}
      </button>
    </section>;
  }
  if(!isBlacksmith(npcId))return null;

  const owned=inventory.filter(id=>Boolean(WEAPON_BY_ID[id])&&(weaponUpgrades[id]??0)<MAX_WEAPON_ENHANCEMENT);
  const materials=BOSS_FORGE_MATERIAL_IDS.filter(id=>(forgeMaterials[id]??0)>0);
  const weaponId=owned.includes(weaponChoice)?weaponChoice:owned[0];
  const materialId=materials.includes(materialChoice)?materialChoice:materials[0];
  const base=weaponId?WEAPON_BY_ID[weaponId]:null;
  const level=weaponId?(weaponUpgrades[weaponId]??0):0;
  const price=weaponEnhancementCost(level);
  const current=base?enhancedWeapon(base,level):null;
  const next=base?enhancedWeapon(base,level+1):null;

  return <section className="merchant-stock" aria-label="Weapon enhancement">
    <h3>Improve a weapon · {gold.toLocaleString()} gold</h3>
    <p>If you've found a second boss weapon, I can use the spare blade to strengthen one of yours. Each weapon can be improved up to +{MAX_WEAPON_ENHANCEMENT}. It takes one spare weapon and some gold each time.</p>
    {materials.length>0&&owned.length>0?<div className="item-row">
      <div>
        <label>Weapon to improve
          <select value={weaponId} onChange={event=>setWeaponChoice(event.target.value)}>
            {owned.map(id=><option value={id} key={id}>{itemName(id)} +{weaponUpgrades[id]??0}</option>)}
          </select>
        </label>
        <label>Spare boss weapon
          <select value={materialId} onChange={event=>setMaterialChoice(event.target.value)}>
            {materials.map(id=><option value={id} key={id}>{itemName(id)} ×{forgeMaterials[id]}</option>)}
          </select>
        </label>
        {current&&next&&<small>Damage: {current.damage} → {next.damage} · Reach: {current.reach} → {next.reach} · {price} gold</small>}
      </div>
      <button type="button" disabled={gold<price} onClick={()=>{
        if(!base||!materialId)return;
        if(window.confirm(`Use one spare ${itemName(materialId)} and ${price} gold to improve ${base.name} to +${level+1}?`))
          enhanceWeapon(npcId,base.id,materialId);
      }}>{gold<price?'Not enough gold':'Enhance'}</button>
    </div>:<p>{materials.length?'Your owned weapons are fully enhanced.':'Bring me a duplicate weapon dropped by a boss, and I can put it to good use.'}</p>}
    {materials.length>0&&<small>Spare trophies: {materials.map(id=>`${itemName(id)} ×${forgeMaterials[id]}`).join(' · ')}</small>}
  </section>;
}
