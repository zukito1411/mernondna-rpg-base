import {createServer} from 'vite';
import {assetManifestPlugin} from './assetManifestPlugin.ts';
import {writeFileSync} from 'node:fs';
const server=await createServer({configFile:false,plugins:[assetManifestPlugin()],optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
try {
 const {createNpcPlacementSurvey}=await server.ssrLoadModule('/src/game/systems/npcPlacement.ts');
 const {NPCS}=await server.ssrLoadModule('/src/data/npcs.ts');
 const {TOWN_BY_ID}=await server.ssrLoadModule('/src/data/towns.ts');
 const {placements,choose}=createNpcPlacementSurvey();
 const slots=Object.fromEntries(NPCS.map(npc=>{
  const origin=TOWN_BY_ID[npc.townId].world,entry=placements[npc.id];
  const local=p=>({x:p.x-origin.x,y:p.y-origin.y});
  return [npc.id,{position:local(entry.position),home:local(entry.home),schedule:entry.schedule.map(local)}];
 }));
 const keeper=slots['mairin-reed'].position,tovin=NPCS.find(n=>n.id==='tovin-reed'),origin=TOWN_BY_ID.highmere.world;
 const arrival=choose(tovin,{x:keeper.x+96,y:keeper.y});
 slots['tovin-reed'].arrival={x:arrival.x-origin.x,y:arrival.y-origin.y};
 writeFileSync('src/data/npcPositions.json',JSON.stringify(slots,null,2)+'\n');
 console.log(JSON.stringify({count:NPCS.length,moved:NPCS.filter(n=>JSON.stringify(slots[n.id].position)!==JSON.stringify(n.worldOffset)).length,shrine:['renna-vale','maren-voss'].map(id=>({id,...slots[id]}))},null,2));
} finally {await server.close();}
