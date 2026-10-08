export type ActiveSkillId = 'azure-cleave' | 'skyfall-slam' | 'crown-rally' | 'crescent-flurry';
export type ActiveSkillAction = 'skill1' | 'skill2' | 'skill3' | 'skill4';
export type PlayerSkillTexture = 'skill_azure_cleave' | 'skill_skyfall_slam' | 'skill_crown_rally' | 'skill_crescent_flurry';

export interface ActiveSkillDefinition {
  id:ActiveSkillId; name:string; slot:1 | 2 | 3 | 4; action:ActiveSkillAction; texture:PlayerSkillTexture;
  description:string; kind:'strike' | 'rally'; staminaCost:number; cooldownMs:number; durationMs:number;
  radius:number; coneDot:number; hitTimes:readonly number[]; damageMultipliers:readonly number[];
}

// Leigneron's four starter combat arts are usable immediately. Learned passive
// talents remain separate, preserving existing skill-point purchases and saves.
export const ACTIVE_SKILLS:readonly ActiveSkillDefinition[] = [
  { id:'azure-cleave',name:'Azure Cleave',slot:1,action:'skill1',texture:'skill_azure_cleave',
    description:'Sweep a broad arc for double weapon damage.',kind:'strike',staminaCost:18,cooldownMs:4500,durationMs:600,
    radius:112,coneDot:-.25,hitTimes:[280],damageMultipliers:[2] },
  { id:'skyfall-slam',name:'Skyfall Slam',slot:2,action:'skill2',texture:'skill_skyfall_slam',
    description:'Slam the ground, striking nearby enemies for 2.8× weapon damage.',kind:'strike',staminaCost:28,cooldownMs:8500,durationMs:850,
    radius:150,coneDot:-1,hitTimes:[570],damageMultipliers:[2.8] },
  { id:'crown-rally',name:'Crown Rally',slot:3,action:'skill3',texture:'skill_crown_rally',
    description:'Recover 20% maximum health and take 50% less damage for 5 seconds.',kind:'rally',staminaCost:24,cooldownMs:16000,durationMs:600,
    radius:0,coneDot:-1,hitTimes:[300],damageMultipliers:[] },
  { id:'crescent-flurry',name:'Crescent Flurry',slot:4,action:'skill4',texture:'skill_crescent_flurry',
    description:'Unleash ten sweeping slashes over four seconds, hitting nearby enemies in all directions.',kind:'strike',staminaCost:22,cooldownMs:6500,durationMs:4000,
    radius:104,coneDot:-1,hitTimes:[200,600,1000,1400,1800,2200,2600,3000,3400,3800],
    damageMultipliers:[.25,.25,.25,.25,.25,.25,.25,.25,.25,.25] },
];
export const ACTIVE_SKILL_BY_ID = Object.fromEntries(ACTIVE_SKILLS.map(skill => [skill.id,skill])) as Record<ActiveSkillId,ActiveSkillDefinition>;

export interface ActiveSkillStatus {
  cooldowns:Record<ActiveSkillId,number>; casting:ActiveSkillId | null; rallyRemaining:number;
}
export function initialActiveSkillStatus():ActiveSkillStatus {
  return { cooldowns:{ 'azure-cleave':0,'skyfall-slam':0,'crown-rally':0,'crescent-flurry':0 },casting:null,rallyRemaining:0 };
}
