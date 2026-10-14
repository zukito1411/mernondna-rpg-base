import type {ActiveSkillId} from '../data/activeSkills';
import {SKILL_ICON_PATHS,ADDITIONAL_SKILL_ICON_ROWS} from '../data/skillIcons';
/** New arts use their own effect artwork rather than another art's portrait. */
export function CombatArtIcon({id,className=''}:{id:ActiveSkillId;className?:string}){
  if(Object.hasOwn(SKILL_ICON_PATHS,id))return <img className={className} src={SKILL_ICON_PATHS[id as keyof typeof SKILL_ICON_PATHS]} alt="" draggable={false}/>;
  const row=ADDITIONAL_SKILL_ICON_ROWS[id as keyof typeof ADDITIONAL_SKILL_ICON_ROWS];
  return <span className={`generated-art-icon ${className}`} aria-hidden="true" style={{backgroundImage:"url('/assets/effects/distinct-combat-arts-v2.png')",backgroundPosition:`${100/3}% ${row*100/3}%`}}/>;
}
