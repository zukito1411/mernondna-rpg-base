import { useGameStore } from '../store/gameStore';
import { SKILLS, type AttributeId } from '../data/progression';
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
            {SKILLS.map(skill => {
              const learned = learnedSkills.includes(skill.id);
              return (
                <article className="progression-row" key={skill.id}>
                  <div><strong>{skill.name}{learned && <span> · Learned</span>}</strong><p>{skill.description}</p></div>
                  <button type="button" disabled={learned || skillPoints === 0} onClick={() => unlock(skill.id)}>{learned ? 'Known' : 'Learn'}</button>
                </article>
              );
            })}
          </section>
          <section className="combat-art-section">
            <div className="progression-heading"><h3>Combat arts</h3><span>Always available · keys 1–4</span></div>
            <div className="combat-art-grid">
              {ACTIVE_SKILLS.map(skill => {
                const remaining = activeSkillStatus.cooldowns[skill.id];
                const status = activeSkillStatus.casting === skill.id ? 'Casting'
                  : remaining > 0 ? `Cooldown · ${Math.ceil(remaining / 1000)}s` : 'Ready';
                return (
                  <article className="combat-art-row" key={skill.id}>
                    <span className={`combat-art-slot combat-art-slot-${skill.slot}`}>{skill.slot}</span>
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
