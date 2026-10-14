import type {NpcDefinition} from '../game/types';
import {TOWN_BY_ID} from './towns';
import {NPC_IDLE_ART} from './npcIdleArt';

// Slots reskin the approved adult trader, attendant, officer, herbalist,
// smith and elder bodies. No elven template or separate racial size system.
export const BASE_FAMILIES=['npc_adventurer','npc_attendant','npc_general','npc_villager','npc_blacksmith','npc_attendant'] as const;
export const CITIZEN_SOURCES=[
  {key:'citizen-source:rindass-v2',path:'assets/npcs/regional_citizens/rindass-v2.png',region:'rindass',
    regions:[[130,15,368,488],[614,32,304,471],[1037,16,386,487],[145,513,377,484],[577,512,398,480],[1073,523,324,474]]},
  {key:'citizen-source:druganwoods-v2',path:'assets/npcs/regional_citizens/druganwoods-v2.png',region:'druganwoods',
    regions:[[95,22,375,474],[613,37,300,459],[1068,32,394,464],[99,528,369,457],[594,531,373,452],[1125,542,301,443]]},
  {key:'citizen-source:frostlands-v2',path:'assets/npcs/regional_citizens/frostlands-v2.png',region:'frostlands',
    regions:[[163,33,344,467],[628,48,265,452],[1023,38,362,462],[162,528,375,466],[590,538,368,452],[1076,541,284,454]]},
  {key:'citizen-source:portquill-v2',path:'assets/npcs/regional_citizens/portquill-v2.png',region:'portquill',
    regions:[[112,16,358,481],[614,27,298,471],[1055,16,372,481],[116,524,388,477],[606,518,359,484],[1075,523,327,481]]},
  {key:'citizen-source:nardorous-v2',path:'assets/npcs/regional_citizens/nardorous-v2.png',region:'nardorous',
    regions:[[96,43,376,465],[633,54,267,454],[1052,37,417,471],[101,532,349,459],[594,540,348,443],[1124,547,279,447]]},
  {key:'citizen-source:darkav-v2',path:'assets/npcs/regional_citizens/darkav-v2.png',region:'darkav',
    regions:[[185,72,253,427],[640,87,251,412],[1067,72,334,427],[170,538,336,428],[608,558,335,404],[1109,553,264,413]]},
] as const;
const FEMALE_IDENTITIES=new Set(['starhold-templar','redmesa-beastmaster','redmesa-forgewright',
  'deepford-runesmith','tidewatch-harbor-master','skallheim-hunter','blackspire-forgemaster']);
const MALE_IDENTITIES=new Set(['starhold-quartermaster','deepford-boatwright','tidewatch-sailmaker',
  'skallheim-trader','blackspire-warder']);
export function citizenModel(npc:NpcDefinition){
  const culture=CITIZEN_SOURCES.findIndex(s=>s.region===(npc.visualRegion??TOWN_BY_ID[npc.townId]?.regionId));
  if(culture<0)return undefined; // Oakmere, Highmere and Narenthil stay untouched.
  if(npc.settlementResident){
    // New authored workers select their occupation/body deliberately rather
    // than hashing a tool merchant into an armored officer's uniform.
    const slot=BASE_FAMILIES.findIndex(family=>family===npc.spriteTexture);
    if(slot>=0)return culture*6+slot;
  }
  const female=FEMALE_IDENTITIES.has(npc.id)||!MALE_IDENTITIES.has(npc.id)
    &&/npc_(attendant|villager|woman|huntress|elven_woman)/.test(npc.spriteTexture??'');
  const role=`${npc.title} ${npc.role}`.toLowerCase();
  let hash=0;for(const c of npc.id)hash=(hash*31+c.charCodeAt(0))>>>0;
  const variants=female?[1,3,5]:[0,2,4];
  const slot=!female&&/smith|forge|miner|craft/.test(role)?4
    :!female&&/guard|captain|warder|sentinel|sentry/.test(role)?2
    :female&&/elder|keeper|priest/.test(role)?5
    :female&&/herb|healer|hunt/.test(role)?3:variants[hash%variants.length];
  return culture*6+slot;
}
export function citizenHeight(model:number){return NPC_IDLE_ART.find(a=>a.walk===BASE_FAMILIES[model%6])!.height;}
