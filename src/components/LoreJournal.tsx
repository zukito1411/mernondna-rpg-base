import {useMemo,useState} from 'react';
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
import {CreaturePortrait} from './CreaturePortrait';
import {ARMORS,ARMOR_BY_ID} from '../data/armor';

type Category='creatures'|'bosses'|'characters'|'regions'|'weapons'|'armors';
const CATEGORIES:ReadonlyArray<{id:Category;name:string}>=[{id:'creatures',name:'Bestiary'},{id:'bosses',name:'Bosses'},{id:'characters',name:'People'},{id:'regions',name:'World'},{id:'weapons',name:'Weapons'},{id:'armors',name:'Armor'}];
const CATALOGS={creatures:ENEMIES.filter(e=>!e.boss),bosses:BOSSES,characters:NPCS,regions:REGIONS,weapons:WEAPONS,armors:ARMORS};
const PAGE_SIZE=24;
function RecordPicture({category,id,known,size=84}:{category:Category;id:string;known:boolean;size?:number}){
  if(!known)return <span className="codex-unknown" style={{width:size,height:size}} aria-hidden="true">?</span>;
  const creature=category==='creatures'?ENEMY_BY_ID[id]:category==='bosses'?ENEMY_BY_ID[BOSS_BY_ID[id].enemyId]:undefined;
  if(creature)return <CreaturePortrait key={creature.id} enemy={creature} size={size}/>;
  if(category==='weapons'||category==='armors')return <span className="codex-weapon-art" style={{width:size,height:size}}><ItemIcon id={id}/></span>;
  if(category==='characters'){const npc=NPC_BY_ID[id];return <span className="codex-person-art" style={{width:size,height:size}}><SpritePortrait frame={npc.spriteFrame} name={npc.name} texture={npc.spriteTexture} npc={npc}/></span>;}
  return <span className="codex-world-art" style={{width:size,height:size}} aria-hidden="true">✧</span>;
}
export function LoreJournal(){
  const panel=useGameStore(s=>s.panel);
  return panel==='codex'?<OpenLoreJournal/>:null;
}
function OpenLoreJournal(){
  const close=useGameStore(s=>s.closePanel),records=useGameStore(s=>s.journal),inventory=useGameStore(s=>s.inventory);
  const defeatedBosses=useGameStore(s=>s.defeatedBosses),regionId=useGameStore(s=>s.regionId),shrines=useGameStore(s=>s.unlockedTownShrines);
  const armorInventory=useGameStore(s=>s.armorInventory);
  const [category,setCategory]=useState<Category>('creatures'),[selected,setSelected]=useState<string|null>(null),[search,setSearch]=useState('');
  const [filter,setFilter]=useState<'all'|'known'|'unknown'>('all'),[page,setPage]=useState(0),[reading,setReading]=useState(false);
  const journal=useMemo(()=>restoreJournal(records,{inventory,defeatedBosses,regionId,unlockedTownShrines:shrines}),[records,inventory,defeatedBosses,regionId,shrines]);
  const discovered=useMemo(()=>({creatures:new Set(Object.keys(journal.creatures)),bosses:new Set(Object.keys(journal.bosses)),characters:new Set(journal.characters),regions:new Set<string>(journal.regions),weapons:new Set(journal.weapons),armors:new Set(armorInventory)}),[journal,armorInventory]);
  const counts=useMemo(()=>Object.fromEntries(CATEGORIES.map(c=>[c.id,CATALOGS[c.id].filter(e=>discovered[c.id].has(e.id)).length])),[discovered]);
  const entries=useMemo(()=>CATALOGS[category].filter(entry=>{
    const known=discovered[category].has(entry.id);
    return (filter==='all'||(filter==='known')===known)&&(known?entry.name:'Undiscovered').toLocaleLowerCase().includes(search.toLocaleLowerCase());
  }).sort((a,b)=>Number(discovered[category].has(b.id))-Number(discovered[category].has(a.id))
    ||(discovered[category].has(a.id)?a.name.localeCompare(b.name):0)),[category,discovered,filter,search]);
  const pages=Math.max(1,Math.ceil(entries.length/PAGE_SIZE)),currentPage=Math.min(page,pages-1);
  const id=entries.some(e=>e.id===selected)?selected:entries[0]?.id;
  const known=Boolean(id&&discovered[category].has(id));
  const index=entries.findIndex(e=>e.id===id),label=known?entries[index]?.name:'Undiscovered';
  const boss=known&&category==='bosses'&&id?BOSS_BY_ID[id]:undefined;
  const creature=known&&id?(category==='creatures'?ENEMY_BY_ID[id]:boss?ENEMY_BY_ID[boss.enemyId]:undefined):undefined;
  const lore=creature?CREATURE_LORE[creature.id]:undefined,weakness=creature?creatureWeaknessNotes(creature.id):[];
  const npc=known&&category==='characters'&&id?NPC_BY_ID[id]:undefined;
  const region=known&&category==='regions'&&id?REGIONS.find(r=>r.id===id):undefined;
  const weapon=known&&category==='weapons'&&id?WEAPON_BY_ID[id]:undefined;
  const armor=known&&category==='armors'&&id?ARMOR_BY_ID[id]:undefined;
  const profile=weapon?WEAPON_PROFILES[weapon.id]:undefined,drop=boss?BOSS_WEAPONS[boss.id]:undefined;
  const chooseCategory=(kind:Category)=>{setCategory(kind);setSelected(null);setSearch('');setPage(0);setReading(false);};
  const turn=(offset:number)=>{const next=index+offset;if(next>=0&&next<entries.length){setSelected(entries[next].id);setPage(Math.floor(next/PAGE_SIZE));}};
  return <div className="overlay-backdrop lore-backdrop" role="dialog" aria-modal="true" aria-label="World codex">
    <section className={`panel lore-journal codex-panel${reading?' is-reading':''}`}>
      <header><div><small>Leigneron's field records</small><h2>World codex</h2></div><button type="button" onClick={close}>Close</button></header>
      <nav className="lore-tabs" aria-label="Codex categories">{CATEGORIES.map(c=><button type="button" key={c.id} aria-pressed={category===c.id} onClick={()=>chooseCategory(c.id)}>{c.name}<small>{counts[c.id]} / {CATALOGS[c.id].length}</small></button>)}</nav>
      <div className="codex-toolbar"><label className="lore-search"><span className="sr-only">Search records</span><input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setReading(false);}} placeholder="Search discovered records…"/></label>
        <label><span className="sr-only">Discovery filter</span><select value={filter} onChange={e=>{setFilter(e.target.value as typeof filter);setPage(0);setReading(false);}}><option value="all">All records</option><option value="known">Discovered</option><option value="unknown">Undiscovered</option></select></label></div>
      <div className="codex-body">
        <section className="codex-collection" aria-label="Record collection"><div className="codex-collection-heading"><strong>{CATEGORIES.find(c=>c.id===category)?.name}</strong><small>{counts[category]} discovered</small></div>
          <div className="codex-grid" key={`${category}:${currentPage}:${filter}:${search}`}>{entries.slice(currentPage*PAGE_SIZE,(currentPage+1)*PAGE_SIZE).map(entry=>{
            const found=discovered[category].has(entry.id);
            return <button type="button" className={`codex-card${found?'':' is-locked'}`} key={entry.id} aria-current={entry.id===id?'true':undefined} aria-label={found?entry.name:'Undiscovered record'} onClick={()=>{setSelected(entry.id);setReading(true);}}>
              <RecordPicture category={category} id={entry.id} known={found}/><strong>{found?entry.name:'???'}</strong><small>{found?'Read record':'Undiscovered'}</small>
            </button>;
          })}{!entries.length&&<p className="codex-no-results">No matching records.</p>}</div>
          <nav className="codex-pagination" aria-label="Collection pages"><button type="button" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</button><span>{currentPage+1} / {pages}</span><button type="button" disabled={currentPage===pages-1} onClick={()=>setPage(currentPage+1)}>Next</button></nav>
        </section>
        <section className="codex-reader" aria-label="Record details"><div className="codex-reader-nav"><button type="button" className="codex-back" onClick={()=>setReading(false)}>← Collection</button><span>{index>=0?`${index+1} / ${entries.length}`:'No record'}</span><button type="button" aria-label="Previous record" disabled={index<=0} onClick={()=>turn(-1)}>←</button><button type="button" aria-label="Next record" disabled={index<0||index>=entries.length-1} onClick={()=>turn(1)}>→</button></div>
          <article className="lore-entry" key={`${category}:${id??'empty'}`}>
            {id?<><div className="codex-hero"><RecordPicture category={category} id={id} known={known} size={144}/><div><small>{CATEGORIES.find(c=>c.id===category)?.name}</small><h3>{label}</h3>{known&&<span className="codex-discovered">Discovered</span>}</div></div>
              {!known?<div className="lore-empty"><h4>A story still untold</h4><p>{category==='characters'?'Speak with people to record their stories.':category==='weapons'||category==='armors'?'Acquire this equipment to uncover its history.':category==='regions'?'Travel farther to uncover this region.':'Encounter this creature to reveal its illustration and field notes.'}</p></div>:<>
                {creature&&<><p>{boss?.lore??lore?.description??'A creature encountered on the roads of Mernodna.'}</p>{boss&&<p className="lore-fact">Recorded in {REGIONS.find(r=>r.id===boss.regionId)?.name}</p>}<h4>Habits & encounters</h4><p>{lore?.habits??'Travelers know this creature by the tracks it leaves and the silence that follows its passing.'}</p>{weakness.length>0&&<><h4>What travelers have learned</h4>{weakness.map(text=><p key={text}>{text}</p>)}</>}{drop&&<><h4>A relic of its story</h4><p>Accounts of this foe speak of {WEAPON_BY_ID[drop.id].name}, a blade carrying something of its former keeper.</p>{journal.weapons.includes(drop.id)&&<button type="button" onClick={()=>{chooseCategory('weapons');setSelected(drop.id);setReading(true);}}>Read the blade's story</button>}</>}</>}
                {npc&&<><p className="lore-fact">{npc.title} · {TOWN_BY_ID[npc.townId]?.name}</p><p>{npc.role}</p><h4>Personal record</h4>{npc.family&&<p>{npc.family}</p>}<p>{npc.relationshipToLeigneron.summary}</p>{npc.faction&&<p>Affiliation: {npc.faction}</p>}{npc.weaponId&&<p>Known equipment: {WEAPON_BY_ID[npc.weaponId]?.name}</p>}</>}
                {region&&<><p>{region.description}</p><p className="lore-fact">{region.climate} · {region.people}</p><h4>Regional history</h4><p>{REGION_HISTORY[region.id]}</p><h4>Places & people</h4>{TOWNS.filter(t=>t.regionId===region.id).map(t=><p key={t.id}><strong>{t.name}.</strong> {t.description}</p>)}</>}
                {weapon&&<><p className="lore-fact">{profile?.origin}</p><h4>Appearance & provenance</h4><p>{profile?.appearance}</p><p>{profile?.history}</p><h4>Stories carried by the blade</h4><p>{weaponLegend(weapon.id)}</p></>}
                {armor&&<><p className="lore-fact">{armor.origin}</p><h4>Appearance & craftsmanship</h4><p>{armor.appearance}</p><h4>A keeper's history</h4><p>{armor.history}</p><p>{armor.bossId?'A rare relic recovered from the spoils of a regional foe.':'Made by the smiths and leatherworkers who keep the roads supplied.'}</p></>}
              </>}
            </>:<div className="lore-empty"><h3>No matching records</h3><p>Try another search or discovery filter.</p></div>}
          </article>
        </section>
      </div>
    </section>
  </div>;
}
