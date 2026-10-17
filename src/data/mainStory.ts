import type {QuestDefinition,QuestObjective} from '../game/types';
export const CROWN_SUMMONS:QuestDefinition={id:'crown-summons',name:'The King’s Missing Grain',giverNpcId:'aldren-vale',
  summary:'Captain Varr is defeated, but the stolen goods bear a royal mark. Follow the sign to Highmere, find the missing flour and discover what darkness is spreading beyond the capital.',
  prerequisiteQuestId:'first-road',rewardGold:110,rewardXp:280,nextQuestId:'eight-regions',objectives:[
    {id:'old-charter',type:'investigate',targetId:'royal-waystone',contentId:'discovery:royal-waystone',amount:1,text:'Examine the old royal waystone on the road.'},
    {id:'capital',type:'visit',targetId:'highmere',amount:1,text:'Follow the royal road into Highmere.'},
    {id:'report',type:'deliver',targetId:'renna-vale',amount:1,text:'Take Aldren’s seal to Renna in Highmere.',dialogue:['That’s Edmund’s seal. But this other one is royal. How did Varr get it?','Davin at the bridge might remember the missing wagons. I know he was on duty.']},
    {id:'customs',type:'talk',targetId:'davin-bridge',amount:1,text:'Ask the bridge warden about the missing flour carts.',dialogue:['I saw a cart go over the bridge. Sevrin’s men took it south. It never reached the stores.','Mairin’s been helping the families in the Lower Ward. She might know what happened to the grain.']},
    {id:'households',type:'talk',targetId:'mairin-reed',amount:1,text:'Find Mairin at the Lower Ward kitchen.',dialogue:['Tovin was driving that wagon. He wouldn’t just disappear without telling me. I’m worried sick.','Pell said he found a bit of the wagon papers by the well. Please bring my boy home.']},
    {id:'witness',type:'quest',targetId:'shadows-highmere',amount:1,text:'Solve the mystery of the missing flour and bring Tovin home.'},
    {id:'guard-report',type:'talk',targetId:'captain-yselle-ward',amount:1,text:'Tell Captain Yselle what Tovin saw.',dialogue:['I’ll put guards outside the kitchen. I don’t want anyone hurting Tovin again.','Adria’s at the castle. She needs to see these papers. I’ll come if you need me.']},
    {id:'audience',type:'deliver',targetId:'lady-adria-vale',amount:1,text:'Tell Lady Matilda how the flour vanished.',cinematicId:'charter-audience',dialogue:['Edmund made sure the relief wagons reached everyone. I know he wouldn’t approve of any of this.','This is the same mark from the old waystone. I think someone has been stealing iron from others like it.']},
    {id:'mandate',type:'choice',targetId:'renna-vale',amount:1,text:'Choose how the far lands will be warned.',choices:[
      {id:'public',text:'Tell every village what is waking beneath the roads.',response:'All right. We’ll tell everyone what’s been happening. People deserve to know.',flag:'main-public-reports'},
      {id:'watch',text:'Send Yselle’s riders to warn the villages in secret.',response:'I’ll ask Isabel to send riders quietly. We don’t want to frighten people before we know more.',flag:'main-watch-reports'},
    ],dialogue:['The same trouble’s being reported outside Highmere. We need to warn the other towns. Should we tell everyone openly, or send riders?']},
  ]};
const regional:Array<[string,string,string,string,string,string,string]>=[
  ['moonlit-warden','moonlit-warden','elarion-lorekeeper','elarion','Narenthil','Something has poisoned the roots near the old stones. The Warden’s been acting strangely ever since.','The Warden was covered in the same black growth we found near the shrine. I think someone’s been damaging the old stones.'],
  ['stonejaw','stonejaw-troll','starhold-quartermaster','starhold','Nardorous','Stonejaw’s been smashing wagons in the pass. The beacon has gone out too. I’m worried about the porters.','There was a carving beneath the rubble. It looks like the marks on the old beacon.'],
  ['iron-tusk','iron-tusk','redmesa-beastmaster','redmesa','Rindass','Krag’s men have taken the wells. Some of the smaller clans can’t get water for their children.','The guards are gone from the well. We found wagon tracks heading north. I wonder what they were carrying.'],
  ['rootfather','rootfather','deepford-runesmith','deepford','Druganwoods','The Rootfather’s roots have grown all across the path. We can’t get to the old mine stones anymore.','We found a broken piece of iron tangled in the roots. It looks like someone pulled it out of the old stone.'],
  ['salt-king','salt-king','tidewatch-harbor-master','tidewatch','Portquill','The Salt King’s ship is anchored south of Tidewatch. He’s been taking everyone’s cargo. The eastern gangplank is the only way onto the ship from shore.','The seal on those crates looks just like the one from Highmere. Somebody’s been sending him stolen iron.'],
  ['frost-wyrm','frost-wyrm','skallheim-hunter','skallheim','Frostlands','The Wyrm came down from the cliffs. I don’t know why. The beacon was damaged around the same time.','There was a dark shard under its scales. The mark looks like the one on that old stone.'],
  ['ashen-seer','ashen-seer','blackspire-forgemaster','blackspire','Darkav','The Seer’s been drawing spirits toward the vents. Some of the old forge records might explain what she’s doing.','We found a broken seal beneath the forge. Someone had opened it before we got there.'],
];
export function regionalMainObjectives(original:QuestObjective[]):QuestObjective[]{
  const result:QuestObjective[]=[];
  for(const [oldId,bossId,npc,town,region,line,after] of regional){
    const displayTown=town==='redmesa'?'Red Mesa':town.charAt(0).toUpperCase()+town.slice(1);
    result.push({id:'brief:'+town,type:'talk',targetId:npc,amount:1,text:`Hear the warning in ${displayTown}.`,dialogue:[line,'I’ve seen that mark on the old stones here too. I don’t know who’s been changing them.']});
    const site=bossId==='moonlit-warden'?'greenward-ruin':bossId==='stonejaw-troll'?'pass-beacon':bossId==='rootfather'?'rootwater-watch':bossId==='salt-king'?'salt-bay-outlook':bossId==='frost-wyrm'?'ice-bay-outlook':bossId==='ashen-seer'?'ash-vent-watch':'clan-road-muster';
    result.push({id:'evidence:'+town,type:'investigate',targetId:site,contentId:'discovery:'+site,amount:1,text:`Search the old stones at ${site.replaceAll('-',' ')} for the strange mark.`});
    const kill=original.find(o=>o.id===oldId);if(kill)result.push(kill);
    result.push({id:'report:'+town,type:'talk',targetId:npc,amount:1,text:`Bring the recovered evidence back to ${displayTown}.`,dialogue:[after,'Could you show Renna this piece? It matches the others. She might be able to work out what happened.']});
  }
  result.push({id:'capital-return',type:'deliver',targetId:'renna-vale',amount:1,text:'Return to Highmere and tell Renna what you found.',cinematicId:'regional-charter-return',dialogue:['These marks turn up in records from all over Mernodna. I didn’t realize they were connected.','Someone broke the old seals. I think that’s why so many people have been hurt.']});
  result.push(original.find(o=>o.id==='return-aldren-after-regions')!);return result;
}
