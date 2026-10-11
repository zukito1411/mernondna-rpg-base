import { useGameStore } from '../store/gameStore';
import { SKILLS, type AttributeId } from '../data/progression';
import { SKILL_ICON_PATHS } from '../data/skillIcons';
import { ACTIVE_SKILLS } from '../data/activeSkills';

const ATTRIBUTES: Array<{ id: AttributeId; name: string; description: string }> = [
  { id: 'strength', name: 'Strength', description: '+6% weapon damage per point.' },
  { id: 'vitality', name: 'Vitality', description: '+12 maximum health per point.' },
  { id: 'agility', name: 'Agility', description: '+2.5% movement speed and faster attacks per point.' },
];

export function CharacterPanel() {
  const panel = useGameStore(s => s.panel);
  const close = useGameStore(s => s.closePanel);
  const level = useGameStore(s => s.level);
  const xp = useGameStore(s => s.xp);
  const statPoints = useGameStore(s => s.statPoints);
  const skillPoints = useGameStore(s => s.skillPoints);
  const attributes = useGameStore(s => s.attributes);
  const learnedSkills = useGameStore(s => s.learnedSkills);
  const activeSkillStatus = useGameStore(s => s.activeSkillStatus);
  const allocate = useGameStore(s => s.allocateAttribute);
  const unlock = useGameStore(s => s.unlockSkill);
  if (panel !== 'character') return null;

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Character and skills">
      <section className="panel character-panel">
        <header><div><h2>Leigneron · Character</h2><p>Level {level} · {xp} total XP</p></div><button type="button" onClick={close}>Close</button></header>
        <div className="character-grid">
          <section>
            <div className="progression-heading"><h3>Status</h3><span>{statPoints} points to spend</span></div>
            {ATTRIBUTES.map(attribute => (
              <article className="progression-row" key={attribute.id}>
                <div><strong>{attribute.name} <span>{attributes[attribute.id]}</span></strong><p>{attribute.description}</p></div>
                <button type="button" disabled={statPoints === 0} onClick={() => allocate(attribute.id)} aria-label={`Add one ${attribute.name} point`}>+</button>
              </article>
            ))}
          </section>
          <section>
            <div className="progression-heading"><h3>Skills</h3><span>{skillPoints} points to spend</span></div>
            <div className="skill-tree">{(['Might','Survival','Mobility'] as const).map(branch=><section className="skill-branch" key={branch}><h4>{branch}</h4>{SKILLS.filter(s=>s.branch===branch).map(skill => {
              const learned = learnedSkills.includes(skill.id);
              const missing=skill.requires&&!learnedSkills.includes(skill.requires);
              const canLearn=!learned&&skillPoints>=skill.cost&&level>=skill.minLevel&&!missing;
              return (
                <article className="progression-row" key={skill.id}>
                  <div><strong>{skill.name}{learned && <span> · Learned</span>}</strong><p>{skill.description}</p><small>Lv. {skill.minLevel} · {skill.cost} point{skill.cost===1?'':'s'}{skill.requires?` · Requires ${SKILLS.find(s=>s.id===skill.requires)?.name}`:''}</small></div>
                  <button type="button" disabled={!canLearn} onClick={() => unlock(skill.id)}>{learned?'Known':level<skill.minLevel?'Locked':missing?'Prerequisite':`Learn (${skill.cost})`}</button>
                </article>
              );
            })}</section>)}</div>
          </section>
          <section className="combat-art-section">
            <div className="progression-heading"><h3>Combat arts</h3><span>Unlock automatically at levels 5, 10 and 15 · keys 1–4</span></div>
            <div className="combat-art-grid">
              {ACTIVE_SKILLS.map(skill => {
                const remaining = activeSkillStatus.cooldowns[skill.id];
                const locked=level<skill.minLevel;
                const status = locked?`Unlocks at level ${skill.minLevel}`:activeSkillStatus.casting === skill.id ? 'Casting'
                  : remaining > 0 ? `Cooldown · ${Math.ceil(remaining / 1000)}s` : 'Ready';
                return (
                  <article className={`combat-art-row ${locked?'combat-art-locked':''}`} key={skill.id}>
                    <span className={`combat-art-slot combat-art-slot-${skill.slot}`}>{skill.slot}</span>
                    <img className="combat-art-icon" src={SKILL_ICON_PATHS[skill.id]} alt="" loading="lazy" />
                    <div><strong>{skill.name}</strong><p>{skill.description}</p>
                      <small>{skill.staminaCost} stamina · {status}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
