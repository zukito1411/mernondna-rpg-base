import type { ContentDefinition, Vec2 } from '../game/types';
import { NPC_BY_ID } from './npcs';
import { TOWN_BY_ID } from './towns';
import { WILDERNESS_SITES } from './wildernessSites';
import { WorldGenerator } from '../game/systems/WorldGenerator';
import { findCreaturePlacement } from '../game/systems/creaturePlacement';
import { WORLD_ASSET_FRAMES } from './art';
import {ADVENTURE_CLUES} from './adventure';

/** Authored, persistent mission content. No new global spawn loop or village raids. */
export function addCampaignWorldContent(content: ContentDefinition[]) {
  const geography = new WorldGenerator();
  const bossHomes=content.flatMap(d=>d.kind==='creature'&&d.bossId?[d.world]:[]);
  const site = (id:string) => WILDERNESS_SITES.find(s=>s.id===id)!.world;
  const clear = (p:Vec2) => geography.canCreatureOccupy(p.x,p.y)
    && !WILDERNESS_SITES.some(s=>((s.style==='camp'&&!s.hostile)||s.id==='royal-waystone'||s.id==='greenward-ruin')
      &&Math.hypot(s.world.x-p.x,s.world.y-p.y)<330)
    && !content.some(d=>(d.kind==='prop'||d.kind==='settlement-prop')&&d.solid
      &&Math.abs(d.world.x-p.x)<(d.footprint?.width??180)/2+45
      &&p.y>d.world.y-(d.footprint?.height??70)-45&&p.y<d.world.y+45);
  const missionGround=(p:Vec2,enemyId:string)=>clear(p)
    &&(enemyId!=='grove-spider'||geography.getBiomeAt(p.x,p.y)==='forest'&&!geography.isRoad(p.x,p.y,100))
    &&(enemyId!=='blighted-thornling'||WILDERNESS_SITES.some(s=>['greenward-ruin','moon-pilgrim-grove'].includes(s.id)
      &&Math.hypot(s.world.x-p.x,s.world.y-p.y)<1250));
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
  const reinforce=(prefix:string,total:number,fallback:{world:Vec2;enemies:string[]})=>{
    const originals=content.filter(d=>d.kind==='creature'&&d.id.startsWith(prefix));
    const primary=originals[0],origin=primary?.world??fallback.world,region=geography.getRegionAt(origin.x,origin.y);
    const reserveOrigin=primary?.kind==='creature'?primary.encounterBehavior?.home??origin:origin;
    const species=originals.length?originals.flatMap(d=>d.kind==='creature'?[d.enemyId]:[]):[...fallback.enemies];
    if(prefix.startsWith('creature:krag-warband:')){
      species.splice(0,species.length,'rindass-orc-raider','rindass-orc-raider','rindass-orc-spearman');
      originals.forEach((d,i)=>{if(d.kind==='creature'){
        d.enemyId=species[i%3];d.encounterBehavior={home:{...origin},station:{...d.world},slot:i,leashRadius:700,
          role:i%3===2?'ranged':i%3===0?'leader':'melee'};
      }});
    }
    const centers:Vec2[]=[origin];
    const groupSize=species.every(id=>id==='frost-wolf')?5:3;
    const reserveClearings=new Map<string,{home:Vec2;stations:Vec2[]}>();
    // Fixed, persisted small patrols across real ground. No respawn farming,
    // no larger per-frame spawn loops, and no single fifteen-actor dogpile.
    for(let added=originals.length;added<total;){
      const count=Math.min(groupSize,total-added),group=Math.floor(added/groupSize);
      const station=(p:Vec2,slot:number)=>({x:p.x+Math.cos(slot*Math.PI*2/count)*90,y:p.y+Math.sin(slot*Math.PI*2/count)*90});
      const candidates:Vec2[]=[];
      for(const radius of [480,720,1000,1400,1800,2400])for(let i=0;i<24;i++){
        const angle=(i+group*5)*Math.PI/12;
        candidates.push({x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius});
      }
      let home=candidates.find(p=>geography.getRegionAt(p.x,p.y)===region
        &&centers.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=420)
        &&Array.from({length:count},(_,slot)=>station(p,slot)).every((q,slot)=>missionGround(q,species[(added+slot)%species.length])&&geography.getRegionAt(q.x,q.y)===region
          &&bossHomes.every(b=>Math.hypot(b.x-q.x,b.y-q.y)>620)));
      const reserve=!home;
      let stations=home?Array.from({length:count},(_,slot)=>station(home!,slot)):undefined;
      const reserveKey=Array.from({length:count},(_,slot)=>species[(added+slot)%species.length]).join(',');
      const cached=reserveClearings.get(reserveKey);
      if(!home&&cached){home=cached.home;stations=cached.stations;}
      if(!home){
        // Reuse a real clearing as a full staged patrol, preserving species,
        // formations and every enemy ID. Do not replace battles with dialogue.
        for(const candidate of [reserveOrigin,...centers,...candidates]){
          for(const spacing of [90,64]){
            const points=Array.from({length:count},(_,slot)=>({x:candidate.x+Math.cos(slot*Math.PI*2/count)*spacing,
              y:candidate.y+Math.sin(slot*Math.PI*2/count)*spacing}));
            if(geography.getRegionAt(candidate.x,candidate.y)===region&&clear(candidate)
              &&points.every((p,slot)=>geography.getRegionAt(p.x,p.y)===region&&missionGround(p,species[(added+slot)%species.length])
                &&bossHomes.every(b=>Math.hypot(b.x-p.x,b.y-p.y)>620))){home=candidate;stations=points;break;}
          }
          if(home)break;
        }
      }
      // If the map changed too much even for a reserve clearing, retain the
      // logical full patrol dormant. Runtime validates/relocates it before any
      // actors can activate. No startup exception, fake deaths or lost quota.
      if(!home){home=fallback.world;stations=Array.from({length:count},(_,slot)=>station(home!,slot));}
      if(reserve&&!cached)reserveClearings.set(reserveKey,{home,stations:stations!});
      if(!reserve)centers.push(home);
      for(let slot=0;slot<count;slot++){
        const enemyId=species[(added+slot)%species.length],world=stations![slot];
        const encounterId=reserve?`${prefix}reserve:${added}`:`${prefix}reinforcement:${group}`;
        content.push({id:`${prefix}reinforcement:${added+slot}`,kind:'creature',enemyId,world,eventSpawn:true,
          encounterId,...(reserve?{campaignReserve:true}:{}),...(enemyId==='frost-wolf'?{wolfPackId:encounterId,wolfAlpha:slot===0}:{}),
          encounterBehavior:{home:{...home},station:{...world},slot,leashRadius:700,
            role:enemyId==='rindass-orc-spearman'?'ranged':slot===0?'leader':enemyId==='frost-wolf'?'flanker':'melee'}});
      }
      added+=count;
    }
  };
  const varr=content.find(d=>d.id==='boss:captain-varr')!.world;
  const cart=camp('seed-cart',{x:varr.x+560,y:varr.y+600},['road-bandit','road-bandit','road-bandit'],'lena-cartwright');
  camp('road-blockade',{x:varr.x+1100,y:varr.y+850},['road-bandit','road-bandit','road-bandit']);
  content.push({id:'story:seed-cart-wagon',kind:'prop',world:{x:cart.x,y:cart.y-185},texture:'world_assets',
    frame:WORLD_ASSET_FRAMES.cargo,scale:.65,solid:true});
  clue('story:seed-cart',{x:cart.x-130,y:cart.y+30},'The murdered messenger’s letter',
    'Beneath the torn sacks, a blood-marked letter warns Renna: the survey and household rolls were sold together. A child’s shawl has kept the royal seal dry. The messenger died carrying this warning.',9);
  clue('story:varr-orders',{x:varr.x+320,y:varr.y+190},'Watchtower dispatch',
    'A paid silence order tells Varr to recover the messenger’s letter and the ward survey, then leave no witness at the cart. The payment bears the Counting House seal. A sketch matches Leigneron’s inherited compass.',6);
  clue('story:varr-cargo',{x:varr.x+310,y:varr.y+310},'Sealed caravan cargo',
    'The recovered seal and road survey belong to the royal grain office. The margin bears Leigneron’s mother’s handwriting: keep the spring open for everyone.',9);
  const root=site('rootwater-watch');
  const pilgrim=content.find(d=>d.kind==='npc'&&d.npcId==='maerwen-reedleaf'),grove=site('moon-pilgrim-grove');
  if(pilgrim){
    const p=placement({x:grove.x+280,y:grove.y+240});pilgrim.world=p;
    const npc=NPC_BY_ID['maerwen-reedleaf'],town=TOWN_BY_ID[npc.townId];npc.worldOffset={x:p.x-town.world.x,y:p.y-town.world.y};
  }
  camp('rootwater-rescue',{x:root.x+520,y:root.y+390},['marsh-wraith','marsh-wraith','marsh-wraith'],'bruni-stonevein');
  clue('story:relief-letter',{x:root.x+110,y:root.y+105},'The relief crew’s last account',
    'The ferryman records a flood, a failing bridge, and families still on the far bank. Leigneron’s parents went back until the last children reached shelter. On their final crossing the bridge collapsed. Beside their names, a survivor has written: they came back for us.',6);
  const frost=site('ice-bay-outlook');
  camp('frost-stores',{x:frost.x+550,y:frost.y+350},Array<string>(5).fill('frost-wolf'));
  clue('story:beacon-kit',{x:site('pass-beacon').x+100,y:site('pass-beacon').y+95},'Mountain relief satchel',
    'A missing porter left his signal oil and route journal here. He escaped toward Starhold; the journal marks the safe beacon sequence.',9);
  clue('story:frost-lantern',{x:frost.x+130,y:frost.y+90},'Icebound signal lantern',
    'The fishermen’s signal lens is intact. Beside it, a dark shard has scorched the snow without melting it.',9);
  for(const [eventId,clueId] of [['mountain-signal','story:beacon-kit'],['winter-signal','story:frost-lantern']]){
    const p=content.find(d=>d.id===clueId)!.world;
    content.push({id:'story:signal-fire:'+eventId,kind:'prop',world:{...p},texture:'world_assets',frame:6,scale:.36,solid:false});
  }
  clue('story:forge-record',{x:site('darkav:burnt-chainworks').x+100,y:site('darkav:burnt-chainworks').y+80},'Chainworks charge book',
    'The account records ward iron purchased as scrap using the same grain-office seal. The Seer demanded unbound heat; the forge crews never consented.',11);
  for(const entry of ADVENTURE_CLUES){
    const origin=entry.siteId?site(entry.siteId):TOWN_BY_ID[entry.townId].world;
    clue(entry.id,{x:origin.x+entry.dx,y:origin.y+entry.dy},entry.name,entry.text,9);
  }
  const cargo=content.find(d=>d.id==='loot:pirate-flagship:cargo');
  if(cargo){
    // Keep the old chest and its one-time coins; the repeatable record is beside it.
    clue('story:flagship-manifest',{x:cargo.world.x-65,y:cargo.world.y},'Flagship freight manifest',
      'Beside the ward chains are passenger names disguised as freight. One entry describes the sailmaker’s niece; a later hand records the families put ashore alive near Skallheim. Payments carry the same seal as Highmere’s forced-service warrants.',11);
  }
  reinforce('story-camp:road-blockade:',15,{world:{x:varr.x+1100,y:varr.y+850},enemies:['road-bandit','road-bandit','road-bandit']});
  reinforce('creature:blighted-thornling:greenward-ruin:',15,{world:site('greenward-ruin'),enemies:['blighted-thornling','blighted-thornling','blighted-thornling']});
  reinforce('creature:grove-spider:moon-pilgrim-grove:',15,{world:grove,enemies:['grove-spider','grove-spider','grove-spider']});
  for(const id of ['clan-road-muster','southern-caravan-rest'])reinforce(`creature:krag-warband:${id}:`,15,
    {world:site(id),enemies:['rindass-orc-raider','rindass-orc-raider','rindass-orc-spearman']});
  reinforce('story-camp:rootwater-rescue:',15,{world:{x:root.x+520,y:root.y+390},enemies:['marsh-wraith','marsh-wraith','marsh-wraith']});
  reinforce('story-camp:frost-stores:',15,{world:{x:frost.x+550,y:frost.y+350},enemies:Array<string>(5).fill('frost-wolf')});

  const evidence:Record<string,[string,string]>={
    'clue:grain-receipt':['Blood-marked transfer warrant','The inspector crossed out the order to transfer children into service. His blood stains the margin. Beneath the fresh date is an older curfew pass bearing a genuine crown signature.'],
    'clue:weighhouse-ledger':['The inspector’s hidden testimony','A list of displaced households is disguised as cargo. The inspector wrote that he refused to deliver the children. Tovin’s stolen knife is listed as planted evidence; Sevrin’s seal authorizes the wagon.'],
    'clue:relief-tally':['Household and adoption rolls','Loving adoptions and forced-service debts were entered in the same book. Some parents are still searching under names the clerks crossed out. Aldren’s entry refuses payment and preserves Leigneron’s birth parents’ names.'],
    'clue:cibar-pump':['The memorial well mechanism','There are fresh knife scores inside the well housing. A broken bronze clasp was caught beneath the lever during a struggle. It is evidence of Celia’s brother’s murder, not ordinary wear.'],
  };
  for(const d of content)if(d.kind==='interactable'||d.kind==='loot-container'){
    const entry=evidence[d.id];if(entry){d.name=entry[0];d.description=entry[1];d.repeatText=entry[1];}
    if(d.id.startsWith('collect:cibar-fitting:')){
      const index=Number(d.id.slice(-1));
      d.name=['A broken bronze clasp','A child’s hidden ribbon','A household seal in wax'][index];
      d.description=['The clasp was cut by a narrow blade. Old blood has darkened the hinge.',
        'A child tied this ribbon round a written promise: we will come back for you.',
        'The wax bears a Highmere household seal, pressed over a forced-service warrant.'][index];
      d.repeatText='This keepsake has already been recovered for Celia’s inquiry.';
    }
  }
}
