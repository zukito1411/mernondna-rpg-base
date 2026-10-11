import { ACTIVE_SKILLS } from '../data/activeSkills';
import { SKILL_ICON_PATHS } from '../data/skillIcons';
import { mobileInput } from '../game/input';
import { useGameStore } from '../store/gameStore';

/** The same four combat arts as the mobile buttons; no duplicate cooldown state. */
export function DesktopSkillBar() {
  const status=useGameStore(s=>s.activeSkillStatus);
  const stamina=useGameStore(s=>s.stamina);
  const blocked=useGameStore(s=>Boolean(s.panel||s.dialogue||s.cinematic));
  if(blocked)return null;
  return <nav className="desktop-skillbar" aria-label="Combat arts and cooldowns">
    {ACTIVE_SKILLS.map(skill=>{
      const remaining=Math.max(0,status.cooldowns[skill.id]);
      const cooling=remaining>0;
      const insufficient=stamina<skill.staminaCost;
      const casting=status.casting===skill.id;
      const disabled=cooling||insufficient||status.casting!==null;
      return <button type="button" key={skill.id}
        className={`desktop-skill-slot ${cooling?'on-cooldown':''} ${casting?'is-casting':''}`}
        title={`${skill.name} · key ${skill.slot} · ${skill.staminaCost} stamina${cooling?` · ${(remaining/1000).toFixed(1)}s remaining`:''}`}
        aria-label={`${skill.name} key ${skill.slot}, ${cooling?`cooldown ${(remaining/1000).toFixed(1)} seconds`:insufficient?'not enough stamina':casting?'casting':'ready'}`}
        disabled={disabled}
        onClick={()=>mobileInput.press(skill.action)}>
        <span className="desktop-skill-art">
          <img src={SKILL_ICON_PATHS[skill.id]} alt="" draggable={false}/>
          {cooling&&<span className="desktop-skill-shade"
            style={{height:`${Math.min(100,remaining/skill.cooldownMs*100)}%`}} />}
          {cooling&&<strong className="desktop-skill-remaining">{(remaining/1000).toFixed(1)}s</strong>}
          {casting&&<span className="desktop-skill-casting">Casting</span>}
        </span>
        <kbd>{skill.slot}</kbd>
        <span className="desktop-skill-name">{skill.name}</span>
        {!cooling&&!casting&&<span className="desktop-skill-state">{insufficient?'Low stamina':'Ready'}</span>}
      </button>;
    })}
  </nav>;
}
