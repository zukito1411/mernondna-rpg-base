import {TOWNS} from './towns';
import {INTERIOR_ENTRIES,INTERIOR_RESIDENTS_BY_ENTRY,NPC_INTERIOR_BY_ID,type InteriorEntry} from './interiors';
import {NPCS} from './npcs';
import {HOME_ID,HOME_NAME} from './housing';

export interface PlayerHomeSite extends InteriorEntry {homeName:string;agentId:string;agentName:string;agentLocation:string}
const preferred:Readonly<Record<string,string>>={highmere:'Westgate Homes',willowcross:'Riverside Homes',elarion:'Livingwood Lodge',
 moonfall:'Travelers Shelter',starhold:'Ropemakers Terrace Upper House 1',redmesa:'Rider Lodge',deepford:'Craft Homes',
 tidewatch:'Netmenders Close Upper House 1',skallheim:'Winter Shelter',blackspire:'Chainwright Homes','cibar-plains':'Brook Farmhouse'};
// Choose existing, unoccupied residential buildings. Never evict story actors,
// change building IDs, create a second renderer, or add a startup asset pack.
export const PLAYER_HOMES:PlayerHomeSite[]=TOWNS.flatMap(town=>{
 const vacant=INTERIOR_ENTRIES.filter(e=>e.townId===town.id&&e.profile==='home'&&!e.hall&&!INTERIOR_RESIDENTS_BY_ENTRY[e.id]?.length);
 const entry=town.id==='oakmere'?INTERIOR_ENTRIES.find(e=>e.id===HOME_ID):vacant.find(e=>e.name===preferred[town.id])??vacant[0];
 const locals=NPCS.filter(n=>n.townId===town.id&&!n.visitor);
 const agent=locals.find(n=>/trader|merchant|steward|quartermaster|harbor master|harbour master|innkeeper/i.test(n.title))??locals.find(n=>!n.combatant)??locals[0];
 if(!entry||!agent){console.warn('[housing] No vacant residence or deed holder in',town.id);return [];}
 return [{...entry,homeName:town.id==='oakmere'?HOME_NAME:`${town.name} Home`,agentId:agent.id,agentName:agent.name,
  agentLocation:NPC_INTERIOR_BY_ID[agent.id]?.entry.name??`${town.name}'s streets`}];
});
export const PLAYER_HOME_BY_ID:Readonly<Record<string,PlayerHomeSite|undefined>>=Object.fromEntries(PLAYER_HOMES.map(h=>[h.id,h]));
export const isPlayerHome=(id:string|undefined|null)=>Boolean(id&&PLAYER_HOME_BY_ID[id]);
