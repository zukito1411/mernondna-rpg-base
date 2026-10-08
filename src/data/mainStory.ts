import type {QuestDefinition,QuestObjective} from '../game/types';
export const CROWN_SUMMONS:QuestDefinition={id:'crown-summons',name:'A Charter for the Living',giverNpcId:'aldren-vale',
  summary:'Varr’s defeat exposes a false toll claim. Carry Aldren’s report into Highmere, uncover the relief conspiracy and secure a public charter before following the blight beyond Trandum.',
  prerequisiteQuestId:'first-road',rewardGold:110,rewardXp:280,nextQuestId:'eight-regions',objectives:[
    {id:'old-charter',type:'investigate',targetId:'royal-waystone',contentId:'discovery:royal-waystone',amount:1,text:'Read the Roadwarden Charter Stone on the royal road.'},
    {id:'capital',type:'visit',targetId:'highmere',amount:1,text:'Follow the royal road into Highmere.'},
    {id:'report',type:'deliver',targetId:'renna-vale',amount:1,text:'Deliver Aldren’s account to Renna at the royal archive.',dialogue:['Aldren’s seal is genuine. Varr claimed a toll under a charter whose language he could not read. Someone supplied him a plausible forgery.','Davin’s public river entries will tell us which goods that forgery was meant to divert.']},
    {id:'customs',type:'talk',targetId:'davin-bridge',amount:1,text:'Compare the toll dates with Davin’s customs account.',dialogue:['Varr’s road toll and Sevrin’s kitchen requisition share a date, but the cargo never entered the royal stores.','Mairin has been keeping the missing households fed. Listen to her before you call this a bandit matter.']},
    {id:'households',type:'talk',targetId:'mairin-reed',amount:1,text:'Hear the Lower Ward households and begin their investigation.',dialogue:['A road can be open and still bring nothing to the hungry. Tovin carried the grain that never arrived.','Find the receipt, follow the ledger and bring my brother home. Then we can speak to the crown with a living witness.']},
    {id:'witness',type:'quest',targetId:'shadows-highmere',amount:1,text:'Resolve Shadows Beneath Highmere: evidence, missing witness and public inquiry.'},
    {id:'guard-report',type:'talk',targetId:'captain-yselle-ward',amount:1,text:'Ask Yselle to witness the relief evidence.',dialogue:['A guard’s oath does not authorize stealing a household’s grain. The watch will witness these entries, whoever signed them.','Adria hears petitions at Crown Hall. Take both the road report and the household evidence.']},
    {id:'audience',type:'deliver',targetId:'lady-adria-vale',amount:1,text:'Present the joint report on the royal castle steps.',cinematicId:'charter-audience',dialogue:['The crown guaranteed Aldren’s road. That promise includes those who live beside it, not only those wealthy enough to travel.','These reports link a local forgery with ward failures beyond Trandum. I authorize a regional inquiry, with public copies in this archive.']},
    {id:'mandate',type:'choice',targetId:'renna-vale',amount:1,text:'Choose how the regional reports will be held accountable.',choices:[
      {id:'public',text:'Post regional reports for households to inspect.',response:'The archive will keep public copies of every regional report.',flag:'main-public-reports'},
      {id:'watch',text:'Have the roadwarden watch verify each report.',response:'Yselle’s watch will witness the reports and publish its findings.',flag:'main-watch-reports'},
    ],dialogue:['The mandate is signed. Choose who will witness the next reports; either way, the capital must answer for what the roads reveal.']},
  ]};
const regional:Array<[string,string,string,string,string,string]>=[
  ['moonlit-warden','moonlit-warden','elarion-lorekeeper','elarion','Narenthil','The guardian was meant to protect living paths. Study the old Greenward record before you face it.'],
  ['stonejaw','stonejaw-troll','starhold-quartermaster','starhold','Nardorous','The pass failures follow broken refuge stones. Ropes and supplies will keep families alive after the troll is gone.'],
  ['iron-tusk','iron-tusk','redmesa-beastmaster','redmesa','Rindass','The common wells belonged to all clans. Krag uses fear to make a shared road into his private charge.'],
  ['rootfather','rootfather','deepford-runesmith','deepford','Druganwoods','The mine drainage and the ancient ward roots are connected. Bring a report, not merely a trophy.'],
  ['salt-king','salt-king','tidewatch-harbor-master','tidewatch','Portquill','His toll claims imitate the forged road claim. The public channel marks are evidence that the harbor is not his property.'],
  ['frost-wyrm','frost-wyrm','skallheim-hunter','skallheim','Frostlands','The beast was driven from the ice cliffs. We must protect the beacon and understand what drove it down.'],
  ['ashen-seer','ashen-seer','blackspire-forgemaster','blackspire','Darkav','The furnace wards were opened by a deliberate hand. The Seer turns every broken seal into another frightened household.'],
];
export function regionalMainObjectives(original:QuestObjective[]):QuestObjective[]{
  const result:QuestObjective[]=[];
  for(const [oldId,bossId,npc,town,region,line] of regional){
    result.push({id:'brief:'+town,type:'talk',targetId:npc,amount:1,text:`Hear the ${region} report in ${town==='redmesa'?'Red Mesa':town.charAt(0).toUpperCase()+town.slice(1)}.`,dialogue:[line,'Highmere’s inquiry must leave a useful account for the people who keep this road open.']});
    const site=bossId==='moonlit-warden'?'greenward-ruin':bossId==='stonejaw-troll'?'pass-beacon':bossId==='rootfather'?'rootwater-watch':bossId==='salt-king'?'salt-bay-outlook':bossId==='frost-wyrm'?'ice-bay-outlook':bossId==='ashen-seer'?'ash-vent-watch':'clan-road-muster';
    result.push({id:'evidence:'+town,type:'investigate',targetId:site,contentId:'discovery:'+site,amount:1,text:`Investigate the regional record at ${site.replaceAll('-',' ')}.`});
    const kill=original.find(o=>o.id===oldId);if(kill)result.push(kill);
    result.push({id:'report:'+town,type:'talk',targetId:npc,amount:1,text:`Return the ${region} findings to its regional contact.`,dialogue:['The threat has broken, but the road still needs hands, stores and honest records. I will send both your evidence and our needs to Highmere.','A victory matters when our neighbors can live with its aftermath.']});
  }
  result.push({id:'capital-return',type:'deliver',targetId:'renna-vale',amount:1,text:'Return the regional accounts to Highmere.',cinematicId:'regional-charter-return',dialogue:['Every account is entered under the same charter: forests, passes, clan roads, river halls and sea channels.','The blight exploited broken promises as readily as broken wards. These public records give the next generation a way to repair both.']});
  result.push(original.find(o=>o.id==='return-aldren-after-regions')!);return result;
}
