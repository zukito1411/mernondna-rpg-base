/** One offline-packed sheet: nine impacts plus nine distinct attack assets. */
export const BOSS_SKILL_TEXTURE='boss-skills-v2';
export const BOSS_SKILL_ART='assets/effects/boss-skills-v2.png';
export const BOSS_SKILL_CELL=256;
export const BOSS_SKILL_ROWS=6;
export const BOSS_SKILL_CONTENT=208;
export const BOSS_SKILL_FRAMES={blade:0,moon:1,stone:2,waraxe:3,roots:4,broadside:5,frost:6,ash:7,ember:8} as const;
export type BossSkillFamily=keyof typeof BOSS_SKILL_FRAMES;
export const BOSS_SKILL_ACCENTS:Readonly<Record<BossSkillFamily,number>>={
 blade:9,moon:10,stone:11,waraxe:12,roots:13,broadside:14,frost:15,ash:16,ember:17,
};
export const BOSS_SKILL_BY_ENEMY:Readonly<Record<string,BossSkillFamily>>={
 'bandit-captain':'blade','moonlit-warden':'moon','stonejaw-troll':'stone',
 'redmesa-chieftain':'waraxe',rootfather:'roots','salt-king':'broadside',
 'frost-wyrm':'frost','ashen-seer':'ash','ash-dragon':'ember',
};
