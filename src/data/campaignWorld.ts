import type { ContentDefinition, Vec2 } from '../game/types';
import { NPC_BY_ID } from './npcs';
import { TOWN_BY_ID } from './towns';
import { WILDERNESS_SITES } from './wildernessSites';
import { WorldGenerator } from '../game/systems/WorldGenerator';
import { findCreaturePlacement } from '../game/systems/creaturePlacement';
import { WORLD_ASSET_FRAMES } from './art';

/** Authored, persistent mission content. No new global spawn loop or village raids. */
export function addCampaignWorldContent(content: ContentDefinition[]) {
  const geography = new WorldGenerator();
  const site = (id:string) => WILDERNESS_SITES.find(s=>s.id===id)!.world;
  const clear = (p:Vec2) => geography.canCreatureOccupy(p.x,p.y)
    && !WILDERNESS_SITES.some(s=>((s.style==='camp'&&!s.hostile)||s.id==='royal-waystone'||s.id==='greenward-ruin')
      &&Math.hypot(s.world.x-p.x,s.world.y-p.y)<330)
    && !content.some(d=>(d.kind==='prop'||d.kind==='settlement-prop')&&d.solid
      &&Math.abs(d.world.x-p.x)<(d.footprint?.width??180)/2+45
      &&p.y>d.world.y-(d.footprint?.height??70)-45&&p.y<d.world.y+45);
  const placement = (p:Vec2) => findCreaturePlacement(p,{canCreatureOccupy:(x,y)=>clear({x,y})}) ?? p;
  const clue = (id:string,world:Vec2,name:string,description:string,frame=11) => {
    const accessible=(p:Vec2)=>geography.isWalkable(p.x,p.y)&&!content.some(d=>(d.kind==='prop'||d.kind==='settlement-prop')&&d.solid
      &&Math.abs(d.world.x-p.x)<(d.footprint?.width??180)/2+32
      &&p.y>d.world.y-(d.footprint?.height??70)-32&&p.y<d.world.y+32);
    const candidates=[world];for(const radius of [64,128,192,288])for(let i=0;i<12;i++)candidates.push({x:world.x+Math.cos(i*Math.PI/6)*radius,y:world.y+Math.sin(i*Math.PI/6)*radius});
    world=candidates.find(accessible)??world;
    content.push({id,kind:'interactable',world,texture:'others',frame,scale:.6,solid:false,name,
      description,repeatText:description,repeatable:true,questTargetId:id,questEventType:'investigate'});
  };
  const camp = (id:string,preferred:Vec2,enemies:string[],witness?:string) => {
    const candidates=[placement(preferred)];
    for(const radius of [256,512,768,1280])for(let i=0;i<16;i++)candidates.push({x:preferred.x+Math.cos(i*Math.PI/8)*radius,y:preferred.y+Math.sin(i*Math.PI/8)*radius});
    const station=(home:Vec2,slot:number)=>({x:home.x+Math.cos(slot*Math.PI*2/enemies.length)*100,y:home.y+Math.sin(slot*Math.PI*2/enemies.length)*100});
    const home=candidates.find(p=>clear(p)&&enemies.every((_,slot)=>clear(station(p,slot))))??candidates[0];
    enemies.forEach((enemyId,slot)=>{
      const world=station(home,slot);
      content.push({id:`story-camp:${id}:${slot}`,kind:'creature',enemyId,world,eventSpawn:true,
        ...(id==='frost-stores'?{wolfPackId:'story-camp:frost-stores',wolfAlpha:slot===0}:{}),
        encounterId:`story-camp:${id}`,encounterBehavior:{home:{...home},station:{...world},slot,
          leashRadius:900,role:slot===0?'leader':id==='frost-stores'?'flanker':'melee'}});
    });
    if(witness){
      const definition=content.find(d=>d.kind==='npc'&&d.npcId===witness),npc=NPC_BY_ID[witness];
      // Witness and attackers are registered in the same real clearing.
      if(definition&&npc){definition.world={...home};npc.worldOffset={x:home.x-TOWN_BY_ID[npc.townId].world.x,y:home.y-TOWN_BY_ID[npc.townId].world.y};}
    }
    return home;
  };
  const varr=content.find(d=>d.id==='boss:captain-varr')!.world;
  const cart=camp('seed-cart',{x:varr.x+560,y:varr.y+600},['road-bandit','road-bandit','road-bandit'],'lena-cartwright');
  content.push({id:'story:seed-cart-wagon',kind:'prop',world:{x:cart.x,y:cart.y-185},texture:'world_assets',
    frame:WORLD_ASSET_FRAMES.cargo,scale:.65,solid:true});
  clue('story:seed-cart',{x:cart.x-130,y:cart.y+30},'Slashed seed sacks',
    'The seeds were scattered deliberately. A scrap reads: seize the road marks; burn the survey. The attackers wanted more than food.',9);
  clue('story:varr-orders',{x:varr.x+320,y:varr.y+190},'Watchtower dispatch',
    'A grain-office dispatch orders Varr to collect old ward iron alongside the grain. A sketch matches the carving on Leigneron’s inherited compass.',6);
  clue('story:varr-cargo',{x:varr.x+310,y:varr.y+310},'Sealed caravan cargo',
    'The recovered seal and road survey belong to the royal grain office. The margin bears Leigneron’s mother’s handwriting: keep the spring open for everyone.',9);
  const root=site('rootwater-watch');
  camp('rootwater-rescue',{x:root.x+520,y:root.y+390},['marsh-wraith','marsh-wraith','marsh-wraith'],'bruni-stonevein');
  clue('story:relief-letter',{x:root.x+110,y:root.y+105},'The relief crew’s last account',
    'A copied river-guild account names Leigneron’s parents among the keepers lost helping a relief wagon across a flooded ford. The survivors were carried to shelter before the final crossing failed. Beside it is his mother’s survey: shelter and clean water must remain open to strangers.',6);
  const frost=site('ice-bay-outlook');
  camp('frost-stores',{x:frost.x+550,y:frost.y+350},Array<string>(5).fill('frost-wolf'));
  clue('story:beacon-kit',{x:site('pass-beacon').x+100,y:site('pass-beacon').y+95},'Mountain relief satchel',
    'A missing porter left his signal oil and route journal here. He escaped toward Starhold; the journal marks the safe beacon sequence.',9);
  clue('story:frost-lantern',{x:frost.x+130,y:frost.y+90},'Icebound signal lantern',
    'The fishermen’s signal lens is intact. Beside it, a dark shard has scorched the snow without melting it.',9);
  clue('story:forge-record',{x:site('darkav:burnt-chainworks').x+100,y:site('darkav:burnt-chainworks').y+80},'Chainworks charge book',
    'The account records ward iron purchased as scrap using the same grain-office seal. The Seer demanded unbound heat; the forge crews never consented.',11);
  const cargo=content.find(d=>d.id==='loot:pirate-flagship:cargo');
  if(cargo){
    // Keep the old chest and its one-time coins; the repeatable record is beside it.
    clue('story:flagship-manifest',{x:cargo.world.x-65,y:cargo.world.y},'Flagship freight manifest',
      'Grain, signal lenses and ward chains were carried under the same stolen seal. The Salt King took payment to hold the shipments, not to deliver them.',11);
  }
}
