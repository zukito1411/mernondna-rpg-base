import {useState} from 'react';
import {WEAPON_BY_ID} from '../data/weapons';
import {useGameStore} from '../store/gameStore';
import {POTIONS,weaponEffect,type PotionId} from '../data/economy';
import {ItemIcon} from './ItemIcon';
import {goldLabel} from '../utils/localPlayCheats';
import {WEAPON_PROFILES,weaponProcDescription} from '../data/weaponProfiles';
import {enhancedWeapon,MAX_WEAPON_ENHANCEMENT} from '../data/forge';

export function InventoryPanel(){
  const [tab,setTab]=useState<'weapons'|'potions'>('weapons');
  const [search,setSearch]=useState('');
  const panel=useGameStore(s=>s.panel),close=useGameStore(s=>s.closePanel);
  const weaponId=useGameStore(s=>s.weaponId),inventory=useGameStore(s=>s.inventory);
  const gold=useGameStore(s=>s.gold),potions=useGameStore(s=>s.consumables);
  const weaponUpgrades=useGameStore(s=>s.weaponUpgrades),forgeMaterials=useGameStore(s=>s.forgeMaterials);
  const equip=useGameStore(s=>s.equipWeapon),drink=useGameStore(s=>s.usePotion);
  const hp=useGameStore(s=>s.hp),maxHp=useGameStore(s=>s.maxHp),stamina=useGameStore(s=>s.stamina),maxStamina=useGameStore(s=>s.maxStamina),casting=useGameStore(s=>s.activeSkillStatus.casting);
  if(panel!=='inventory')return null;
  const currentBase=WEAPON_BY_ID[weaponId];
  const current=currentBase?enhancedWeapon(currentBase,weaponUpgrades[weaponId]??0):null;
  const weapons=inventory.map(id=>WEAPON_BY_ID[id]).filter(w=>w&&w.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>Number(b.id===weaponId)-Number(a.id===weaponId)||b.damage-a.damage);
  return <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Inventory">
    <section className="panel inventory-panel">
      <header><div><h2>Leigneron · Bag</h2><p>{goldLabel(gold)} gold · {inventory.length} weapons</p></div><button type="button" onClick={close}>Close</button></header>
      <nav className="equipment-tabs" aria-label="Bag categories">
        <button type="button" aria-pressed={tab==='weapons'} onClick={()=>setTab('weapons')}>Weapons</button>
        <button type="button" aria-pressed={tab==='potions'} onClick={()=>setTab('potions')}>Potions ({Object.values(potions).reduce((a,b)=>a+b,0)})</button>
      </nav>
      <div className="gear-grid equipment-body">
        {current&&<section className="equipped-summary" aria-label="Currently equipped">
          <ItemIcon id={current.id}/><div><small>Currently equipped</small><strong>{current.name}{(weaponUpgrades[current.id]??0)>0?` +${weaponUpgrades[current.id]}`:''}</strong><span>{current.damage} damage · {(current.cooldownMs/1000).toFixed(2)}s recovery · {current.staminaCost} stamina</span>{weaponEffect(current.id)&&<small>Skill effects: {weaponEffect(current.id)!.effectName}</small>}</div>
        </section>}
        {tab==='weapons'?<>
          <label className="equipment-search">Find a weapon<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name" type="search"/></label>
          <p className="equipment-help">Equip a weapon to change your attacks and skill damage. Green numbers mean more damage than your current weapon.</p>
          <button type="button" onClick={()=>useGameStore.getState().openPanel('codex')}>Open bestiary & weapon lore</button>
          <div className="weapon-cards">{weapons.map(w=>{
            const upgraded=enhancedWeapon(w,weaponUpgrades[w.id]??0);
            const equipped=w.id===weaponId,change=upgraded.damage-(current?.damage??upgraded.damage);
            return <article className={`weapon-card item-row ${equipped?'is-equipped':''}`} key={w.id}>
              <ItemIcon id={w.id}/><div><strong>{w.name}{(weaponUpgrades[w.id]??0)>0?` +${weaponUpgrades[w.id]}`:''}</strong><small>Tier {w.tier} · {w.kind} · Enhancement {weaponUpgrades[w.id]??0} / {MAX_WEAPON_ENHANCEMENT}</small>
                {weaponEffect(w.id)&&<small>Skill effects: {weaponEffect(w.id)!.effectName}</small>}
                <div className="weapon-comparison"><b>{upgraded.damage} damage</b>{!equipped&&<span className={change>0?'stat-gain':change<0?'stat-loss':''}>{change>=0?'+':''}{change}</span>}</div>
                <small>{(upgraded.cooldownMs/1000).toFixed(2)}s recovery · {upgraded.staminaCost} stamina · {(upgraded.reach/32).toFixed(1)} paces reach</small>
                <details><summary>Profile & unique effect</summary><div className="weapon-profile-text"><p>{w.description}</p><p>{WEAPON_PROFILES[w.id]?.origin} · {WEAPON_PROFILES[w.id]?.appearance}</p><p>{WEAPON_PROFILES[w.id]?.history}</p><p>{weaponProcDescription(w.id)}</p></div></details>
              </div><button type="button" disabled={equipped||Boolean(casting)} onClick={()=>equip(w.id)}>{equipped?'Equipped':'Equip'}</button>
            </article>;
          })}</div>
          {!weapons.length&&<p>No matching weapons. Try another name.</p>}
          <p className="equipment-help">Boss weapons have a LUCK-scaled rare drop chance. Spare copies become forging materials you can use with a blacksmith to improve any owned weapon.</p>
          <p className="equipment-help">Spare boss weapons: {Object.values(forgeMaterials).reduce((sum,n)=>sum+n,0)} available for upgrades.</p>
        </>:<section className="potion-cards">
          <p className="equipment-help">Carry up to 99 of each potion. Full health or stamina never wastes a bottle. Use 5 for health and 6 for stamina on PC, or the mobile shortcuts.</p>
          <div className="vital-summary"><span>Health <b>{Math.ceil(hp)} / {maxHp}</b></span><span>Stamina <b>{Math.ceil(stamina)} / {maxStamina}</b></span></div>
          {Object.entries(POTIONS).map(([key,p])=>{
            const id=key as PotionId,full=p.hp?hp>=maxHp:stamina>=maxStamina,count=potions[id];
            return <article className="potion-card item-row" key={id}><ItemIcon id={id}/><div><strong>{p.name}</strong><small>{count} bottles · {p.hp?`Restores ${p.hp} health`:`Restores ${p.stamina} stamina`}</small></div><button type="button" disabled={count===0||full||Boolean(casting)} onClick={()=>drink(id)}>{count===0?'Empty':full?'Full':'Drink'}</button></article>;
          })}
          <p className="equipment-help">Traders, innkeepers and smiths sell replacement bottles.</p>
        </section>}
      </div>
    </section>
  </div>;
}
