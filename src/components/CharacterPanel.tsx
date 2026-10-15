import {useState} from 'react';
import {useGameStore} from '../store/gameStore';
import {SKILLS,MAX_PLAYER_LEVEL,ATTRIBUTE_CAP,progressionStats,experienceWithinLevel,playerDamageGrowth,type AttributeId} from '../data/progression';
import {CombatArtIcon} from './CombatArtIcon';
import {ACTIVE_SKILLS,ACTIVE_SKILL_BY_ID,type ActiveSkillId} from '../data/activeSkills';
import {WEAPON_BY_ID} from '../data/weapons';

const ATTRIBUTES:Array<{id:AttributeId;name:string;description:string}>=[
  {id:'strength',name:'STR · Strength',description:'+3.5% weapon damage per point.'},
  {id:'vitality',name:'VIT · Vitality',description:'+10 maximum health per point.'},
  {id:'agility',name:'AGI · Agility',description:'+1% movement through 20 points; +2 stamina and 0.6% faster recovery through 40.'},
  {id:'evasion',name:'EVA · Evasion',description:'+1% chance to evade an enemy hit per point, up to 40%.'},
  {id:'luck',name:'LUK · Luck',description:'+0.625% critical chance (1.5× damage), +1% gold and XP per point. Maximum 25% critical chance.'},
];
export function CharacterPanel(){
  const [tab,setTab]=useState<'arts'|'attributes'|'talents'>('arts');
  const panel=useGameStore(s=>s.panel),close=useGameStore(s=>s.closePanel),level=useGameStore(s=>s.level),xp=useGameStore(s=>s.xp);
  const statPoints=useGameStore(s=>s.statPoints),skillPoints=useGameStore(s=>s.skillPoints),attributes=useGameStore(s=>s.attributes),learnedSkills=useGameStore(s=>s.learnedSkills);
  const status=useGameStore(s=>s.activeSkillStatus),allocate=useGameStore(s=>s.allocateAttribute),unlock=useGameStore(s=>s.unlockSkill);
  const slots=useGameStore(s=>s.skillSlots),learnedArts=useGameStore(s=>s.learnedCombatArts),learnArt=useGameStore(s=>s.learnCombatArt),setSlot=useGameStore(s=>s.setSkillSlot),weaponId=useGameStore(s=>s.weaponId);
  if(panel!=='character')return null;
  const stats=progressionStats(attributes,learnedSkills),exp=experienceWithinLevel(xp);
  return <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Character and skills">
    <section className="panel character-panel">
      <header><div><h2>Leigneron · Stats</h2><p>Level {level} / {MAX_PLAYER_LEVEL} · {level>=MAX_PLAYER_LEVEL?'Maximum level':`${exp.current} / ${exp.required} XP to next level`}</p></div><button type="button" onClick={close}>Close</button></header>
      <nav className="equipment-tabs" aria-label="Stats categories">
        <button type="button" aria-pressed={tab==='arts'} onClick={()=>setTab('arts')}>Usable skills</button>
        <button type="button" aria-pressed={tab==='attributes'} onClick={()=>setTab('attributes')}>Attributes ({statPoints})</button>
        <button type="button" aria-pressed={tab==='talents'} onClick={()=>setTab('talents')}>Passive talents</button>
      </nav>
      <div className="character-grid character-body">
        {tab==='arts'?<section className="combat-art-section">
          <div className="progression-heading"><h3>Your four slots</h3><span>{skillPoints} learning points</span></div>
          <p className="equipment-help">Choose which skill each button uses. Selecting an equipped skill moves it here; Empty removes it. Cooldowns stay with the skill.</p>
          <div className="skill-loadout">{slots.map((id,index)=><label className="loadout-card" key={index}>
            <span>Slot {index+1} · key {index+1}</span>{id?<CombatArtIcon className="combat-art-icon" id={id}/>:<span className="empty-art">—</span>}
            <select aria-label={`Slot ${index+1}`} value={id??''} disabled={Boolean(status.casting)} onChange={e=>setSlot(index,e.target.value?e.target.value as ActiveSkillId:null)}>
              <option value="">Empty</option>{ACTIVE_SKILLS.filter(s=>s.id===id||level>=s.minLevel&&(!s.learnCost||learnedArts.includes(s.id))).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>{id&&<small>{ACTIVE_SKILL_BY_ID[id].staminaCost} stamina</small>}
          </label>)}</div>
          <h3>Learn & choose usable skills</h3>
          <div className="combat-art-grid">{ACTIVE_SKILLS.map(skill=>{
            const known=!skill.learnCost||learnedArts.includes(skill.id),locked=level<skill.minLevel||!known,assigned=slots.indexOf(skill.id);
            const state=level<skill.minLevel?`Requires level ${skill.minLevel}`:!known?'Not learned':assigned>=0?`Equipped in slot ${assigned+1}`:'Learned · choose a slot above';
            return <article className={`combat-art-row ${locked?'combat-art-locked':''}`} key={skill.id}><CombatArtIcon className="combat-art-icon" id={skill.id}/><div>
              <strong>{skill.name}</strong><small>{state}</small><p>{skill.description}</p><small>{skill.staminaCost} stamina · {(skill.cooldownMs/1000).toFixed(1)}s cooldown</small>
              {skill.learnCost&&!known&&<button type="button" disabled={level<skill.minLevel||skillPoints<skill.learnCost} onClick={()=>learnArt(skill.id)}>Learn · {skill.learnCost} points</button>}
            </div></article>;
          })}</div>
        </section>:tab==='attributes'?<section>
          <div className="vital-summary"><span>Maximum health <b>{stats.maxHp}</b></span><span>Maximum stamina <b>{stats.maxStamina}</b></span><span>Attack damage <b>{Math.round((WEAPON_BY_ID[weaponId]?.damage??18)*stats.damageMultiplier*playerDamageGrowth(level))}</b></span></div>
          <div className="progression-heading"><h3>Attributes</h3><span>{statPoints} points available</span></div>
          <p className="equipment-help">Gain three attribute points when you level up. Spending a point is permanent.</p>
          {ATTRIBUTES.map(a=><article className="progression-row" key={a.id}><div><strong>{a.name} · {attributes[a.id]} / {ATTRIBUTE_CAP}</strong><p>{a.description}</p></div><button type="button" disabled={statPoints<=0||attributes[a.id]>=ATTRIBUTE_CAP} onClick={()=>allocate(a.id)} aria-label={`Add one ${a.name} point`}>{attributes[a.id]>=ATTRIBUTE_CAP?'Max':'+1'}</button></article>)}
        </section>:<section>
          <div className="progression-heading"><h3>Passive talents</h3><span>{skillPoints} learning points</span></div>
          <p className="equipment-help">Always-on bonuses. These do not use your four combat slots. Talents and new usable skills spend the same learning points.</p>
          <div className="skill-tree">{(['Might','Survival','Mobility'] as const).map(branch=><section className="skill-branch" key={branch}><h4>{branch}</h4>{SKILLS.filter(s=>s.branch===branch).map(skill=>{
            const learned=learnedSkills.includes(skill.id),missing=skill.requires&&!learnedSkills.includes(skill.requires),canLearn=!learned&&skillPoints>=skill.cost&&level>=skill.minLevel&&!missing;
            return <article className="progression-row" key={skill.id}><div><strong>{skill.name}</strong><p>{skill.description}</p><small>Lv {skill.minLevel} · {skill.cost} points{skill.requires?` · Requires ${SKILLS.find(s=>s.id===skill.requires)?.name}`:''}</small></div>
              <button type="button" disabled={!canLearn} onClick={()=>unlock(skill.id)}>{learned?'Learned':level<skill.minLevel?'Level locked':missing?'Prerequisite':`Learn (${skill.cost})`}</button></article>;
          })}</section>)}</div>
        </section>}
      </div>
    </section>
  </div>;
}
