import type {QuestDefinition,QuestObjective} from '../game/types';
export const CROWN_SUMMONS:QuestDefinition={id:'crown-summons',name:'The King’s Missing Grain',giverNpcId:'aldren-vale',
  summary:'Captain Varr is defeated, but the stolen goods bear a royal mark. Follow the sign to Highmere, find the missing flour and discover what darkness is spreading beyond the capital.',
  prerequisiteQuestId:'first-road',rewardGold:110,rewardXp:280,nextQuestId:'eight-regions',objectives:[
    {id:'old-charter',type:'investigate',targetId:'royal-waystone',contentId:'discovery:royal-waystone',amount:1,text:'Examine the old royal waystone on the road.'},
    {id:'capital',type:'visit',targetId:'highmere',amount:1,text:'Follow the royal road into Highmere.'},
    {id:'report',type:'deliver',targetId:'renna-vale',amount:1,text:'Take Aldren’s seal to Renna in Highmere.',dialogue:['Aldren’s seal is true. Varr carried a royal mark he had no right to bear. Someone gave it to him.','Ask the bridge warden where the flour carts went. If the same hand marked them, we have a trail.']},
    {id:'customs',type:'talk',targetId:'davin-bridge',amount:1,text:'Ask the bridge warden about the missing flour carts.',dialogue:['One cart crossed the bridge, but never reached the king’s storehouse. Sevrin’s men took it down the south lane.','Mairin has been feeding the hungry in the Lower Ward. Find her before you draw your sword.']},
    {id:'households',type:'talk',targetId:'mairin-reed',amount:1,text:'Find Mairin at the Lower Ward kitchen.',dialogue:['Tovin carried the flour that never came. He would not leave us without a word.','Find the torn waybill by the well. Then bring my son home, whatever waits at the old weighhouse.']},
    {id:'witness',type:'quest',targetId:'shadows-highmere',amount:1,text:'Solve the mystery of the missing flour and bring Tovin home.'},
    {id:'guard-report',type:'talk',targetId:'captain-yselle-ward',amount:1,text:'Tell Captain Yselle what Tovin saw.',dialogue:['The watch will stand between that boy and anyone who would silence him.','Lady Matilda awaits you at the castle. Tell her the truth before the stolen grain disappears again.']},
    {id:'audience',type:'deliver',targetId:'lady-adria-vale',amount:1,text:'Tell Lady Matilda how the flour vanished.',cinematicId:'charter-audience',dialogue:['Aldren’s road was meant to bring help to every village, not only the wealthy.','The old waystone bears this same mark. Follow it beyond the capital, and learn what has stirred in the far lands.']},
    {id:'mandate',type:'choice',targetId:'renna-vale',amount:1,text:'Choose how the far lands will be warned.',choices:[
      {id:'public',text:'Tell every village what is waking beneath the roads.',response:'Let the warning be spoken aloud in every town square.',flag:'main-public-reports'},
      {id:'watch',text:'Send Yselle’s riders to warn the villages in secret.',response:'Her riders will carry the warning swiftly, without drawing the danger closer.',flag:'main-watch-reports'},
    ],dialogue:['The signs lead far beyond Highmere. Choose how the warning should travel; either way, you must follow the trail yourself.']},
  ]};
const regional:Array<[string,string,string,string,string,string,string]>=[
  ['moonlit-warden','moonlit-warden','elarion-lorekeeper','elarion','Narenthil','The Warden was bound to the forest’s oldest stones. Something has poisoned the roots beneath them.','The Warden’s roots were black with blight. Look for its mark at the old shrine; it may lead to the hand behind this.'],
  ['stonejaw','stonejaw-troll','starhold-quartermaster','starhold','Nardorous','Stonejaw has broken the high pass. Find the old beacon before the storm seals the trail.','When Stonejaw fell, the mountain gave up a buried carving. The path was made to guard something below.'],
  ['iron-tusk','iron-tusk','redmesa-beastmaster','redmesa','Rindass','Krag has driven the clans from their own wells. The old road runs past his stronghold.','The wells are free again. We found dark tracks leading north, where the old road disappears beneath the mesa.'],
  ['rootfather','rootfather','deepford-runesmith','deepford','Druganwoods','The Rootfather has swallowed the path to the deep wood. Watch for old stones caught in its roots.','The roots curled around a broken seal. The earth still beats beneath it, like a heart that will not sleep.'],
  ['salt-king','salt-king','tidewatch-harbor-master','tidewatch','Portquill','The Salt King has taken the coast. Find his cave and search for the mark of the stolen crown seal.','The mark from the cave matches the waystone at Highmere. The Salt King was guarding something, not ruling alone.'],
  ['frost-wyrm','frost-wyrm','skallheim-hunter','skallheim','Frostlands','The wyrm has come down from the ice cliffs. The old beacon may reveal what drove it from its lair.','A shard of dark glass was lodged beneath the wyrm’s scales. Its mark shines like the one on the waystone.'],
  ['ashen-seer','ashen-seer','blackspire-forgemaster','blackspire','Darkav','The Seer haunts the mountain vents. Find what was sealed beneath the old forge before you face the flames.','The Seer guarded a broken seal beneath the forge. Something opened it before you arrived.'],
];
export function regionalMainObjectives(original:QuestObjective[]):QuestObjective[]{
  const result:QuestObjective[]=[];
  for(const [oldId,bossId,npc,town,region,line,after] of regional){
    const displayTown=town==='redmesa'?'Red Mesa':town.charAt(0).toUpperCase()+town.slice(1);
    result.push({id:'brief:'+town,type:'talk',targetId:npc,amount:1,text:`Hear the warning in ${displayTown}.`,dialogue:[line,'The sign on the waystone has appeared here too. Look for it near the old stones, then face what waits beyond.']});
    const site=bossId==='moonlit-warden'?'greenward-ruin':bossId==='stonejaw-troll'?'pass-beacon':bossId==='rootfather'?'rootwater-watch':bossId==='salt-king'?'salt-bay-outlook':bossId==='frost-wyrm'?'ice-bay-outlook':bossId==='ashen-seer'?'ash-vent-watch':'clan-road-muster';
    result.push({id:'evidence:'+town,type:'investigate',targetId:site,contentId:'discovery:'+site,amount:1,text:`Search the old stones at ${site.replaceAll('-',' ')} for the strange mark.`});
    const kill=original.find(o=>o.id===oldId);if(kill)result.push(kill);
    result.push({id:'report:'+town,type:'talk',targetId:npc,amount:1,text:`Bring the recovered evidence back to ${displayTown}.`,dialogue:[after,'Keep this fragment with the others. Renna in Highmere will need the whole pattern before the crown can repair the seals. Our shrine will remember the help you gave us.']});
  }
  result.push({id:'capital-return',type:'deliver',targetId:'renna-vale',amount:1,text:'Return to Highmere and tell Renna what you found.',cinematicId:'regional-charter-return',dialogue:['The mark appears in every land, older than the crown itself.','The blight did not come by chance. Something has broken the old seals, and now we know where to look.']});
  result.push(original.find(o=>o.id==='return-aldren-after-regions')!);return result;
}
