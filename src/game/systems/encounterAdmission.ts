import type { EnemyDefinition, RegionId, TerrainKind } from '../types';
import type { WorldGenerator } from './WorldGenerator';

export const MAX_LIVE_HOSTILES = 16;
export const MAX_PERSISTENT_SPAWNS = 512;
export type EncounterAdmission = 'spawn' | 'summon' | 'restore' | 'boss';
export interface CreatureHabitat {
  region: RegionId;
  biome: ReturnType<WorldGenerator['getBiomeAt']>;
  terrain: TerrainKind;
}

/** Existing authored/save records retain their identity. Reservations govern
 * new encounters; restored actors leave space for pending authored bosses. */
export function hostileCapacity(live: number, source: EncounterAdmission, pendingBosses: number, summonReserve: number,
  queuedCreatures = 0, densityCap = MAX_LIVE_HOSTILES) {
  const reserved = source === 'boss' ? 0
    : Math.max(0, pendingBosses) + (source === 'spawn' ? Math.max(0, summonReserve) : 0);
  // Queued records already own a future slot. Count them only when adding
  // encounters, not when restoring those same records (which would deadlock).
  const committed = live + (source === 'spawn' || source === 'summon' ? Math.max(0, queuedCreatures) : 0);
  return Math.max(0, Math.min(MAX_LIVE_HOSTILES - committed - reserved, densityCap - committed));
}

/** A validated boss summon may use a non-native species (e.g. Frost Wyrm's
 * wolves), but never an unsuitable walking surface. Geometry is checked by
 * the scene separately, including settlements, buildings and the dragon arena. */
export function creatureFitsHabitat(enemy: EnemyDefinition, habitat: CreatureHabitat, bossSummon = false) {
  if (habitat.region === 'dead-sea' || ['water', 'lava', 'farmland'].includes(habitat.terrain)) return false;
  if (bossSummon) return true;
  if(enemy.id==='rindass-orc-raider'||enemy.id==='rindass-orc-spearman')
    return habitat.region==='rindass'&&['dryland','highland','meadow','coast'].includes(habitat.biome);
  // Heavy pirates are admitted as crew members, without an independent weight.
  if(enemy.id==='pirate-boatswain')return habitat.region==='portquill'&&['coast','forest','meadow'].includes(habitat.biome);
  if(enemy.id==='goblin-stone-slinger')return true; // Crew-only; all suitable land.
  if (enemy.boss || (enemy.regionWeights[habitat.region] ?? 0) <= 0) return false;
  switch (enemy.id) {
    case 'hedge-goblin': return true;
    case 'blighted-thornling': return true; // Scene requires actual trees or blight.
    case 'grove-spider': return habitat.biome==='forest';
    case 'frost-wolf': return ['forest','highland','snowfield'].includes(habitat.biome);
    case 'gray-wolf': return ['forest', 'meadow', 'highland', 'snowfield'].includes(habitat.biome);
    case 'rindass-boar': return ['forest', 'meadow', 'highland', 'dryland'].includes(habitat.biome);
    case 'marsh-wraith': return habitat.biome === 'wetland';
    case 'cave-troll': return habitat.biome !== 'coast';
    case 'road-bandit': return habitat.region!=='portquill';
    case 'cutlass-pirate':
      return habitat.region==='portquill'&&['coast','forest','meadow'].includes(habitat.biome);
    default: return false; // New families require an explicit habitat rule.
  }
}

export function creatureHabitatWeight(enemy: EnemyDefinition, habitat: CreatureHabitat, night: boolean) {
  if (!creatureFitsHabitat(enemy, habitat)) return 0;
  const preferred = enemy.id === 'gray-wolf' && habitat.biome === 'forest'
    || enemy.id === 'marsh-wraith' && habitat.biome === 'wetland';
  const upland = enemy.id === 'cave-troll' && habitat.biome === 'highland';
  const snow = enemy.id === 'gray-wolf' && habitat.biome === 'snowfield';
  return (enemy.regionWeights[habitat.region] ?? 0)
    + (enemy.id==='grove-spider'&&night?8:0)
    + (preferred ? night ? 5 : 3 : upland ? night ? 2 : 1 : snow ? night ? 3 : 1 : 0);
}
