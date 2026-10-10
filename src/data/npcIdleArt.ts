import type { SpriteSource } from './animationPacks';
import { PLAYER_ACTOR_HEIGHT, npcApparentHeight } from './progression';

// Measured 2172x724 strips. Guard body height excludes the polearm.
// One scale through all six poses preserves the subtle breathing animation.
export const NPC_IDLE_ART = [
  { walk:'npc_adventurer',key:'npc_adventurer_idle',path:'assets/npcs/adventurer_male/idle_adv.png',bodyHeight:479,height:80,
    regions:[[8,143,343,475],[370,139,343,479],[733,139,339,479],[1090,143,342,475],[1455,143,345,475],[1820,143,339,475]] },
  { walk:'npc_attendant',key:'npc_attendant_idle',path:'assets/npcs/attendant_woman/idle_atd_w.png',bodyHeight:503,height:80,
    regions:[[61,122,288,503],[414,122,286,503],[757,122,292,503],[1111,122,286,503],[1463,122,289,503],[1818,122,289,503]] },
  { walk:'npc_blacksmith',key:'npc_blacksmith_idle',path:'assets/npcs/blacksmith/idle_blk.png',bodyHeight:412,height:80,
    regions:[[8,155,358,412],[369,163,358,404],[730,160,359,407],[1090,155,360,412],[1453,162,360,405],[1817,159,354,408]] },
  { walk:'npc_royal_guard',key:'npc_royal_guard_idle',path:'assets/npcs/royal_guard/idle_royal_g.png',bodyHeight:374,height:112,
    regions:[[30,135,319,438],[387,131,316,442],[744,140,328,433],[1110,135,322,438],[1473,133,319,440],[1833,135,319,438]] },
  { walk:'npc_guard',key:'npc_guard_idle',path:'assets/npcs/trandum_guard/idle_tran.png',bodyHeight:381,walkBodyRatio:142/160,height:112,
    regions:[[49,128,284,454],[398,130,303,448],[755,127,302,455],[1112,128,306,450],[1471,128,308,454],[1841,134,301,448]] },
  { walk:'npc_villager',key:'npc_villager_idle',path:'assets/npcs/villager_woman/idle_vill_w.png',bodyHeight:410,height:80,
    regions:[[31,191,330,407],[392,189,331,409],[748,189,325,409],[1103,188,331,410],[1458,189,334,409],[1822,189,331,410]] },
  { walk:'npc_huntress',key:'npc_huntress_idle',path:'assets/npcs/huntress/idle_hunt.png',bodyHeight:375,height:80,
    regions:[[38,212,300,372],[398,212,301,372],[758,209,302,375],[1123,212,297,372],[1481,212,303,372],[1846,212,298,372]] },
  { walk:'npc_general',key:'npc_general_idle',path:'assets/npcs/general/idle_general.png',bodyHeight:390,height:80,
    regions:[[54,165,304,390],[406,165,299,390],[759,165,295,390],[1111,165,298,390],[1462,165,305,390],[1814,165,301,390]] },
  // Her walking body is 148px within a 160px staff-inclusive silhouette.
  // Preserve the requested larger model while excluding the staff from sizing.
  { walk:'npc_woman',key:'npc_woman_idle',path:'assets/npcs/shrine_priestess/idle_priestess.png',bodyHeight:412,walkBodyRatio:148/160,height:96,
    regions:[[30,166,316,425],[390,163,316,430],[741,164,315,429],[1096,165,312,429],[1454,164,315,429],[1818,164,314,429]] },
] as const;

export type NpcDirectionalIdleTexture=`${typeof NPC_IDLE_ART[number]['walk']}_directional_idle`;
export function npcDirectionalIdleTexture(walk:typeof NPC_IDLE_ART[number]['walk']):NpcDirectionalIdleTexture {
  return `${walk}_directional_idle`;
}

export function npcIdleSources(entry:typeof NPC_IDLE_ART[number]):SpriteSource[] {
  const bodyHeight = 'walkBodyRatio' in entry ? npcApparentHeight(entry.walk) * entry.walkBodyRatio : PLAYER_ACTOR_HEIGHT;
  return entry.regions.map((cell,i):SpriteSource => ({ path:entry.path,cell,
    imageSize:[2172,724],renderScale:bodyHeight / entry.bodyHeight,name:`${entry.key}:${i}` }));
}
