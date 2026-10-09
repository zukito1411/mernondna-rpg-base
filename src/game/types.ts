export type RegionId =
  | 'trandum'
  | 'narenthil'
  | 'nardorous'
  | 'rindass'
  | 'druganwoods'
  | 'portquill'
  | 'frostlands'
  | 'darkav'
  | 'dead-sea';

export type TerrainKind = 'grass' | 'forest' | 'dirt' | 'stone' | 'snow' | 'ash' | 'sand' | 'water' | 'farmland' | 'marsh' | 'lava' | 'ice';

export type WeaponKind = 'sword' | 'greatsword' | 'axe' | 'spear' | 'bow' | 'crossbow' | 'staff' | 'dagger';

export interface Vec2 {
  x: number;
  y: number;
}

export interface RegionDefinition {
  id: RegionId;
  name: string;
  description: string;
  centerChunk: Vec2;
  primaryTerrain: TerrainKind;
  secondaryTerrain: TerrainKind;
  ambientThreat: number;
  climate: string;
  people: string;
  loreTags: string[];
}

export interface TownDefinition {
  id: string;
  name: string;
  regionId: RegionId;
  kind: 'capital' | 'town' | 'village' | 'harbor' | 'stronghold' | 'outpost';
  world: Vec2;
  mapPercent: Vec2;
  description: string;
  services: string[];
  tags: string[];
  starterKnown?: boolean;
}

export interface NpcRelationship {
  kind: 'mentor' | 'friend' | 'family-friend' | 'rival' | 'ally' | 'authority' | 'acquaintance' | 'mystery';
  trust: number;
  summary: string;
}

export interface NpcDefinition {
  id: string;
  name: string;
  title: string;
  townId: string;
  districtId?:string;
  role: string;
  spriteFrame: number;
  worldOffset: Vec2;
  spriteTexture?: 'npcs' | 'npc_guard' | 'npc_woman' | 'npc_huntress' | 'npc_villager' | 'npc_royal_guard' | 'npc_blacksmith' | 'npc_adventurer' | 'npc_attendant' | 'npc_general';
  weaponId?: string;
  schedule: Array<{ startHour: number; activity: string; location?: Vec2 }>;
  faction?: string;
  family?: string;
  connections?: Array<{ npcId: string; relationship: string }>;
  homeLocation?: Vec2;
  dialoguePersonality?: string;
  storyConsequences?: string[];
  formation?: { id:string; rank:number };
  relationshipToLeigneron: NpcRelationship;
  dialogue: string[];
  questIds: string[];
  combatant?: boolean;
  patrolRadius?: number;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  kind: WeaponKind;
  tier: number;
  damage: number;
  reach: number;
  cooldownMs: number;
  staminaCost: number;
  description: string;
  regionAffinity?: RegionId;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  spriteFrame: number;
  spriteTexture?: 'enemies'|'enemy_troll'|'enemy_dragon';
  appearanceMultiplier?:number;
  bodyRadius?:number;
  combatStyle?:'troll'|'dragon';
  hp: number;
  damage: number;
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  attackCooldownMs: number;
  xp: number;
  goldMin: number;
  goldMax: number;
  boss?: boolean;
  summonEnemyId?: string;
  summonCount?: number;
  summonCooldownMs?: number;
  attackWindupMs?: number;
  attackRecoveryMs?: number;
  attackRadius?: number;
  regionWeights: Partial<Record<RegionId, number>>;
}

export interface BossDefinition {
  id: string;
  enemyId: string;
  name: string;
  regionId: RegionId;
  world: Vec2;
  lore: string;
  respawns: boolean;
  respawnDelayMs?:number;
  attackStyle: 'melee' | 'slam' | 'pounce';
}

export interface QuestObjective {
  id: string;
  type: 'talk' | 'kill' | 'visit' | 'collect' | 'investigate' | 'deliver' | 'choice' | 'puzzle' | 'train' | 'escort' | 'quest';
  targetId: string;
  amount: number;
  text: string;
  bossId?: string;
  contentId?: string;
  dialogue?: string[];
  choices?: Array<{ id:string; text:string; response:string; flag:string; correct?:boolean }>;
  cinematicId?: string;
}

export interface QuestDefinition {
  id: string;
  name: string;
  giverNpcId: string;
  summary: string;
  objectives: QuestObjective[];
  rewardGold: number;
  rewardXp: number;
  nextQuestId?: string;
  prerequisiteQuestId?: string;
}

export interface DynamicEventDefinition {
  id: string;
  name: string;
  regions: RegionId[];
  minHour?: number;
  maxHour?: number;
  enemyId?: string;
  enemyCount?: number;
  headline: string;
  description: string;
}

export interface QuestRuntimeState {
  status: 'locked' | 'active' | 'completed';
  objectiveProgress: Record<string, number>;
}

interface ContentBase { id: string; world: Vec2 }
export type WorldPropTexture = 'darkav_props' | 'darkav_volcano' | 'world_assets' | 'world_objects' | 'world_buildings' | 'capital_buildings' | 'bridges' | 'others' | 'walls' | 'royal_walls' | 'desert_props' | 'woodland_props' | 'climate_props';
export interface NpcContentDefinition extends ContentBase { kind: 'npc'; npcId: string }
export interface CreatureContentDefinition extends ContentBase {
  kind: 'creature'; enemyId: string; bossId?: string; eventSpawn?: boolean;
}
export interface PropContentDefinition extends ContentBase {
  kind: 'prop' | 'settlement-prop'; frame: number; scale: number; solid: boolean;
  texture?: WorldPropTexture;
  footprint?: { width:number; height:number };
  rotation?: number;
  anchor?: 'center' | 'bottom';
  centerCollider?: boolean;
  streamRadiusChunks?:number;
  tint?: number;
  label?: string;
}
export interface SettlementContentDefinition extends ContentBase { kind: 'settlement'; townId: string }
export interface InteractableContentDefinition extends ContentBase {
  kind: 'interactable' | 'harvestable' | 'loot-container' | 'dungeon-entrance';
  name: string; frame: number; description: string; repeatText: string;
  rewardGold?: number; restoreHp?: number;
  texture?: WorldPropTexture; scale?: number;
  tint?: number;
  solid?: boolean;
  townShrineId?: string;
  questTargetId?: string;
  questEventType?: QuestObjective['type'];
  repeatable?: boolean;
  requiredQuestId?: string;
  discoveryId?:string;
  portId?:string;
}
export type ContentDefinition = NpcContentDefinition | CreatureContentDefinition | PropContentDefinition | SettlementContentDefinition | InteractableContentDefinition;
export interface ContentState extends Vec2 {
  hp?: number; defeated?: boolean; used?: boolean; trust?: number;
  respawnAt?:number;
}
export interface ContentWorldState {
  states: Record<string, ContentState>;
  spawns: Record<string, CreatureContentDefinition>;
  nextSpawnSequence: number;
}

export interface QuestTarget extends Vec2 {
  contentId: string; label: string; questId: string; objectiveId: string; type: QuestObjective['type'];
}
export interface NavigationMarker extends Vec2 {
  id: string; label: string; kind: 'npc' | 'enemy' | 'boss' | 'building' | 'town' | 'landmark';
}
export interface NavigationState {
  heading: number; target: QuestTarget | null; markers: NavigationMarker[]; interaction: string | null;
}
