export const XP_PER_LEVEL = 250;
export const PLAYER_ACTOR_HEIGHT = 76;
export function npcApparentHeight(texture: string) {
  return texture === 'npc_guard' || texture === 'npc_royal_guard'
    ? PLAYER_ACTOR_HEIGHT * 1.27 : PLAYER_ACTOR_HEIGHT;
}

export type AttributeId = 'strength' | 'vitality' | 'agility';
export type SkillId = 'heavy-strike' | 'fleet-foot' | 'iron-heart' | 'deep-reserves';
export type PlayerAttributes = Record<AttributeId, number>;

export const BASE_ATTRIBUTES: PlayerAttributes = { strength: 0, vitality: 0, agility: 0 };

export const SKILLS: Array<{ id: SkillId; name: string; description: string }> = [
  { id: 'heavy-strike', name: 'Heavy Strike', description: 'Deal 20% more weapon damage.' },
  { id: 'fleet-foot', name: 'Fleet Foot', description: 'Move 10% faster.' },
  { id: 'iron-heart', name: 'Iron Heart', description: 'Gain 25 maximum health.' },
  { id: 'deep-reserves', name: 'Deep Reserves', description: 'Gain 30 maximum stamina.' },
];

export function levelForExperience(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function progressionStats(attributes: PlayerAttributes, skills: SkillId[]) {
  return {
    maxHp: 100 + attributes.vitality * 12 + (skills.includes('iron-heart') ? 25 : 0),
    maxStamina: 100 + attributes.agility * 4 + (skills.includes('deep-reserves') ? 30 : 0),
    damageMultiplier: 1 + attributes.strength * 0.06 + (skills.includes('heavy-strike') ? 0.2 : 0),
    speedMultiplier: 1 + attributes.agility * 0.025 + (skills.includes('fleet-foot') ? 0.1 : 0),
    cooldownMultiplier: Math.max(0.55, 1 - attributes.agility * 0.02),
  };
}
