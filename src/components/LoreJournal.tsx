import {useState} from 'react';
import {useGameStore} from '../store/gameStore';
import {ENEMIES,ENEMY_BY_ID,BOSSES,BOSS_BY_ID} from '../data/enemies';
import {NPCS,NPC_BY_ID} from '../data/npcs';
import {REGIONS} from '../data/regions';
import {TOWNS,TOWN_BY_ID} from '../data/towns';
import {WEAPONS,WEAPON_BY_ID} from '../data/weapons';
import {BOSS_WEAPONS} from '../data/economy';
import {CREATURE_LORE,creatureWeaknessNotes} from '../data/creatureLore';
import {REGION_HISTORY,restoreJournal} from '../data/journal';
import {WEAPON_PROFILES,weaponLegend} from '../data/weaponProfiles';
import {ItemIcon} from './ItemIcon';
import {SpritePortrait} from './SpritePortrait';

type Category='creatures'|'bosses'|'characters'|'regions'|'weapons';
const CATEGORIES:ReadonlyArray<{id:Category;name:string}>=[{id:'creatures',name:'Bestiary'},{id:'bosses',name:'Bosses'},{id:'characters',name:'Characters'},{id:'regions',name:'Regional history'},{id:'weapons',name:'Weapons'}];
export function LoreJournal(){
  const panel=useGameStore(s=>s.panel),close=useGameStore(s=>s.closePanel);
  const records=useGameStore(s=>s.journal),inventory=useGameStore(s=>s.inventory),defeatedBosses=useGameStore(s=>s.defeatedBosses),regionId=useGameStore(s=>s.regionId),shrines=useGameStore(s=>s.unlockedTownShrines);
  const [category,setCategory]=useState<Category>('creatures'),[selected,setSelected]=useState<string|null>(null),[search,setSearch]=useState('');
  if(panel!=='codex')return null;
  const journal=restoreJournal(records,{inventory,defeatedBosses,regionId,unlockedTownShrines:shrines});
  const catalogs={creatures:ENEMIES,bosses:BOSSES,characters:NPCS,regions:REGIONS,weapons:WEAPONS};
  const known=(kind:Category,id:string)=>kind==='creatures'||kind==='bosses'?Object.hasOwn(journal[kind],id):(journal[kind] as string[]).includes(id);
  const entries=catalogs[category].filter(entry=>known(category,entry.id)&&entry.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
  const id=entries.some(entry=>entry.id===selected)?selected:entries[0]?.id;
  const boss=category==='bosses'&&id?BOSS_BY_ID[id]:undefined;
  const creature=id?(category==='creatures'?ENEMY_BY_ID[id]:boss?ENEMY_BY_ID[boss.enemyId]:undefined):undefined;
  const lore=creature?CREATURE_LORE[creature.id]:undefined;
  const npc=category==='characters'&&id?NPC_BY_ID[id]:undefined;
  const region=category==='regions'&&id?REGIONS.find(r=>r.id===id):undefined;
  const weapon=category==='weapons'&&id?WEAPON_BY_ID[id]:undefined;
  const profile=weapon?WEAPON_PROFILES[weapon.id]:undefined;
  const drop=boss?BOSS_WEAPONS[boss.id]:undefined;
  const weakness=creature?creatureWeaknessNotes(creature.id):[];
  const label=entries.find(entry=>entry.id===id)?.name;
  return <div className="overlay-backdrop lore-backdrop" role="dialog" aria-modal="true" aria-label="Bestiary and lore journal">
    <section className="panel lore-journal">
      <header><div><small>Leigneron’s field records</small><h2>Bestiary & lore</h2></div><button type="button" onClick={close}>Close</button></header>
      <p className="lore-intro">Meet creatures, speak with people, visit regions and collect weapons to fill these pages. Unfound entries remain hidden.</p>
      <nav className="lore-tabs" aria-label="Lore categories">{CATEGORIES.map(({id:kind,name})=><button type="button" key={kind} aria-pressed={kind===category} onClick={()=>{setCategory(kind);setSelected(null);setSearch('');}}>{name} <small>{catalogs[kind].filter(e=>known(kind,e.id)).length}/{catalogs[kind].length}</small></button>)}</nav>
      <label className="lore-search">Search discovered records<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search this category"/></label>
      <div className="lore-columns">
        <nav className="lore-index" aria-label="Discovered records">{entries.map(entry=><button type="button" key={entry.id} aria-current={entry.id===id?'true':undefined} onClick={()=>setSelected(entry.id)}>{category==='weapons'&&<ItemIcon id={entry.id}/>}<span>{entry.name}</span></button>)}{!entries.length&&<p>{search?'No matching records.':'No entries discovered yet. Keep exploring.'}</p>}</nav>
        <article className="lore-entry" aria-label="Record details" key={id??category}>
          {id?<>
            <div className="lore-entry-title">{weapon&&<ItemIcon id={weapon.id}/>} {npc&&<SpritePortrait frame={npc.spriteFrame} name={npc.name} texture={npc.spriteTexture} npc={npc}/>}<div><small>{CATEGORIES.find(c=>c.id===category)?.name}</small><h3>{label}</h3></div></div>
            {creature&&<>
              <p>{boss?.lore??lore?.description??'A creature encountered on the roads of Mernodna.'}</p>
              {boss&&<p className="lore-fact">Recorded in {REGIONS.find(r=>r.id===boss.regionId)?.name}</p>}
              <h4>Habits & encounters</h4><p>{lore?.habits??'Travelers know this creature by the tracks it leaves and the silence that follows its passing.'}</p>
              {weakness.length>0&&<><h4>What travelers have learned</h4>{weakness.map(text=><p key={text}>{text}</p>)}</>}
              {drop&&<><h4>A relic of its story</h4><p>Accounts of this foe speak of {WEAPON_BY_ID[drop.id].name}, a blade carrying something of its former keeper.</p>{journal.weapons.includes(drop.id)&&<button type="button" onClick={()=>{setCategory('weapons');setSelected(drop.id);setSearch('');}}>Read the blade’s story</button>}</>}
            </>}
            {npc&&<><p className="lore-fact">{npc.title} · {TOWN_BY_ID[npc.townId]?.name}</p><p>{npc.role}</p><h4>Personal record</h4>{npc.family&&<p>{npc.family}</p>}<p>{npc.relationshipToLeigneron.summary}</p>{npc.faction&&<p>Affiliation: {npc.faction}</p>}{npc.weaponId&&<p>Known equipment: {WEAPON_BY_ID[npc.weaponId]?.name}</p>}</>}
            {region&&<><p>{region.description}</p><p className="lore-fact">{region.climate} · {region.people}</p><h4>Regional history</h4><p>{REGION_HISTORY[region.id]}</p><h4>Places & people</h4>{TOWNS.filter(town=>town.regionId===region.id).map(town=><p key={town.id}><strong>{town.name}.</strong> {town.description}</p>)}</>}
            {weapon&&<><p className="lore-fact">{profile?.origin}</p><h4>Appearance & provenance</h4><p>{profile?.appearance}</p><p>{profile?.history}</p><h4>Stories carried by the blade</h4><p>{weaponLegend(weapon.id)}</p></>}
          </>:<div className="lore-empty"><h3>A page waiting for a story</h3><p>{category==='characters'?'Start a conversation to record a character.':category==='weapons'?'Acquire a weapon to record its profile.':'Explore to discover new records.'}</p></div>}
        </article>
      </div>
    </section>
  </div>;
}
