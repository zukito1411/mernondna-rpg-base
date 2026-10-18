import type {QuestRuntimeState,RegionId} from '../game/types';

interface Remark {id:string;text:string;townId?:string;regionId?:RegionId;questId?:string;discoveryId?:string}
const REMARKS:readonly Remark[]=[
  {id:'home',townId:'oakmere',text:'I know every turn in these lanes. It feels different coming home with another road behind us.'},
  {id:'crown-city',townId:'highmere',text:'Listen to all those wagons. Out on the road, you forget how many people are waiting for them to arrive.'},
  {id:'river-crossing',townId:'willowcross',text:'A bridge brings strangers together whether they like it or not. Let us hope they remember that.'},
  {id:'elven-halls',townId:'elarion',text:'Even the halls seem to have roots here. I would like to know what stood in this clearing before the first stones.'},
  {id:'pilgrims',townId:'moonfall',text:'People still come here hoping the grove will hear them. I would rather leave quietly than disturb that.'},
  {id:'mountain-shelter',townId:'starhold',text:'Those walls must look like a promise when you have spent a night on the mountain.'},
  {id:'clan-roads',townId:'redmesa',text:'Keep your bow lowered in the streets. There is a difference between a warband on the road and the families living here.'},
  {id:'river-hall',townId:'deepford',text:'Mills, bridges, boats... Everyone here seems to be making something the next person needs.'},
  {id:'harbor',townId:'tidewatch',text:'I can follow tracks through wet leaves. A ship sailing away leaves me nothing to read.'},
  {id:'winter-harbor',townId:'skallheim',text:'Look at the supplies by the harbor. Up here, getting one boat home can matter more than winning a battle.'},
  {id:'ash-city',townId:'blackspire',text:'There are people keeping those furnaces lit. Whatever waits above us, we should remember who lives below it.'},
  {id:'grain-country',townId:'cibar-plains',text:'A field takes a season to grow and a moment to burn. I understand why the farmers watch every stranger.'},
  {id:'road-reopened',questId:'first-road',text:'Aldren can send the wagons out again. That is the part I will remember, long after the fighting.'},
  {id:'campaign-ended',questId:'eight-regions',text:'We have come a long way from Oakmere. I would like to see what these roads become when people are no longer afraid to use them.'},
  {id:'waystone',regionId:'trandum',discoveryId:'royal-waystone',text:'Someone took a knife to that old waystone. A road sign should help people find their way, not warn them to stay home.'},
  {id:'greenward',regionId:'narenthil',discoveryId:'greenward-ruin',text:'Those roots should be holding the stones together. Instead, they look as though they are trying to pull them apart.'},
  {id:'pilgrim-ribbons',regionId:'narenthil',discoveryId:'moon-pilgrim-grove',text:'The old ribbons have weathered, but nobody has taken them down. Someone still remembers the people who tied them.'},
  {id:'rootwater',regionId:'druganwoods',discoveryId:'rootwater-watch',text:'Black roots in the spring... We should warn anyone drawing water downstream.'},
  {id:'trandum',regionId:'trandum',text:'I used to judge a road by the game beside it. Now I look for wagon tracks, too. They tell you whether people feel safe.'},
  {id:'narenthil',regionId:'narenthil',text:'The trees are older here than the stories I grew up with. I will keep my arrows for things that mean us harm.'},
  {id:'nardorous',regionId:'nardorous',text:'Sound carries across these slopes. If you hear loose stones above us, look up before you take another step.'},
  {id:'rindass',regionId:'rindass',text:'There is more life in this dry country than it first lets on. Watch the sheltered ground around the rocks.'},
  {id:'druganwoods',regionId:'druganwoods',text:'I can hear water even when I cannot see it. No wonder every road here seems to lead to a bridge.'},
  {id:'portquill',regionId:'portquill',text:'Salt in the wind and sand in my boots. Remind me to check the bowstring before we leave the coast.'},
  {id:'frostlands',regionId:'frostlands',text:'Fresh snow makes tracks easy to follow. It also makes ours easy for something else to follow.'},
  {id:'darkav',regionId:'darkav',text:'Ash covers a trail faster than rain. Stay where I can see you; I would rather follow your footsteps than guess at them.'},
];
export function aliceTravelRemark(flags:Record<string,boolean>,quests:Record<string,QuestRuntimeState>,regionId:RegionId,townId:string|null){
  return REMARKS.find(r=>!flags['alice:remark:'+r.id]&&(!r.townId||r.townId===townId)
    &&(!r.regionId||r.regionId===regionId)&&(!r.questId||quests[r.questId]?.status==='completed')
    &&(!r.discoveryId||flags['discovery:'+r.discoveryId]));
}
