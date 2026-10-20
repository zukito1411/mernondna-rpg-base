/** Shared custom skill portraits used by desktop and mobile controls. */
import type { ActiveSkillId } from './activeSkills';
type AdditionalCombatArtId='ember-cleave'|'iron-tempest'|'renewing-light';
/** Original portraits stay separate: new arts must never borrow/overwrite them. */
export const SKILL_ICON_PATHS: Record<Exclude<ActiveSkillId,AdditionalCombatArtId>,string> = {
  'barrage':`${import.meta.env.BASE_URL}icons/barrage.png`,
  'azure-cleave':`${import.meta.env.BASE_URL}icons/azure_cleave.png`,
  'skyfall-slam':`${import.meta.env.BASE_URL}icons/skyfall_slam.png`,
  'crown-rally':`${import.meta.env.BASE_URL}icons/crown_rally.png`,
  'crescent-flurry':`${import.meta.env.BASE_URL}icons/crescent_flury.png`,
};
export const ADDITIONAL_SKILL_ICON_ROWS:Record<AdditionalCombatArtId,number>={
  'ember-cleave':0,'iron-tempest':1,'renewing-light':2,
};
