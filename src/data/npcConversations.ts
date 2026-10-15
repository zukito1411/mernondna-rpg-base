import type {NpcDefinition} from '../game/types';
import {rewriteNpcMentions} from './npcPresentation';

const neighborhood:Record<string,string[][]>={
  trandum:[
    ['Morning. Mind that basket; the cat has claimed it, and I have not the heart to argue.','If you see a lone traveler on the east road, walk a little way beside them. It helps more than you think.'],
    ['My eldest wants to join the watch. Yesterday she could not find her boots.','I told her courage was a fine thing, but so was coming home for supper.'],
    ['The children have turned my washing line into a castle again. You may pass if you know the password.','It changes whenever they forget it. A sensible arrangement for rulers, really.'],
    ['You look as though you have forgotten lunch. Take a seat before your knees make the choice for you.','We used to hear a wagon and wonder what it carried. Now we count who gets off.'],
  ],
  narenthil:[
    ['Careful of that root. It has tripped three kings and feels no remorse.','You may sit in the shade. The tree charges nothing, whatever the merchants tell you.'],
    ['My daughter has been teaching a visiting dwarf our spring songs. He insists they need a hammer part.','I think the trees rather like him. They have heard the old verses for centuries.'],
    ['The paths have grown too quiet. Even an elf can miss a badly played flute.','If the pilgrims return, I shall never complain about theirs again.'],
    ['A fallen branch is a gift. A living one is a conversation you have not finished.','Take only what the grove can spare, and it will not mind your muddy boots.'],
  ],
  rindass:[
    ['Good boots. Bad strap. Hold still—I mend saddles, and yours is plainly a very small saddle.','There. No charge. Tell the next stranger an orc did not bite you.'],
    ['My aunt says a guest should leave too full to insult the cook. You have been warned.','Krag would have us feed only our own. Funny how his table has room for every stolen herd.'],
    ['The little ones are racing the boars again. If you hear shouting, it is probably the boars losing.','We keep the young close these days. A chief should protect a clan, not make it afraid of him.'],
    ['You can disagree with me and still share my fire. That is how a council works.','Anyone who needs an axe to win every argument should not be leading one.'],
  ],
  druganwoods:[
    ['Mind your head. No, not that beam—the next one. I did try to warn you.','My grandfather built this court. Claimed it would outlast his grudges. One of those is still being settled.'],
    ['A river takes what is badly joined. It cares nothing for a guild stamp.','I wish our masters remembered that when they send someone else underground.'],
    ['My sister says I work too much. She sent the message with a tool she wanted mended.','You may laugh. I did, once she had gone.'],
    ['Hear that hammer? Three quick, one slow. My boy is learning the old forge rhythm.','He gets it wrong whenever he knows I am listening, so kindly look elsewhere with me.'],
  ],
  nardorous:[
    ['Pull your collar up. The mountain has already noticed that gap.','First thing I learned here: pride is not a warm garment.'],
    ['We count heads before ropes. A missing coil can be replaced.','Borin calls that an old saying. It was my wife shouting at him last winter.'],
    ['Hot broth? You need not buy a story with it. Being cold is enough.','The beacon used to mean someone was waiting. We mean to make it mean that again.'],
    ['My brother swears he can smell snow coming. He also swore his roof would hold.','We sleep in my house now. Make of that what you will.'],
  ],
  portquill:[
    ['Watch the gull. It has learned the sound of a purse and thinks coins are edible.','Lost three buttons proving otherwise.'],
    ['My husband says he will mend the shutter after the next tide. There is always another tide.','If you find a sailor who keeps a promise on dry land, send him here.'],
    ['A girl came asking whether the search boats had returned. She tried to sound grown.','I gave her an orange and sat with her. Sometimes that is all you can do until the sail appears.'],
    ['Salt in the rope, salt in the stew, salt in my best coat. I still miss it when I travel.','You can complain about a place and love it. Ask anyone married to a sailor.'],
  ],
  frostlands:[
    ['Stand out of the wind before we talk. I can hear your teeth from here.','The spare mittens are clean. No, borrowing them does not make you weak.'],
    ['We put another bowl out last night. A traveler reached the longhouse after dark.','My mother did it for strangers. Someone did it for her before that.'],
    ['The children have named every search boat. One is now called Come Home Soon.','The captain painted it on the stern. Said it was better than his own suggestion.'],
    ['Fish dries slowly in weather like this. So do wet socks, though my son keeps trying the same fire.','If the smell follows you, it was not the sea.'],
  ],
  darkav:[
    ['Shake the ash from your cloak before you come in. We have enough mountain on the floor.','Sit. You look like you have been arguing with it.'],
    ['My brother came out of the chainworks without his voice. He taps twice when the tea is good.','Two taps this morning. I keep count of small things now.'],
    ['The furnace used to be the loudest thing at night. Now we listen for wings.','When that dragon leaves, even for a while, the whole street breathes.'],
    ['I put fresh flowers by the closed furnace gate. By dusk they are grey.','I will put more there tomorrow. Ash is not the same as forgetting.'],
  ],
};
export function residentConversation(region:string,index:number,visitor:boolean,trade:string):string[]{
  const visits=[
    ['The innkeeper has adopted me until my wagon is mended. I suspect she means to charge the wagon for supper.','They have been kind here. I try to carry more useful news than frightening rumors.'],
    ['I promised my sister a letter from every town. She writes back correcting my spelling.','I have seen three seas and she still thinks that makes us even.'],
    ['A small commission, a warm bed, and no rain in the tool chest. I have had worse journeys.','I would stay longer, but someone at home is counting the days as carefully as I am.'],
    ['They taught me the local greeting. I said it to a goat before learning the final word.','The household has very kindly agreed never to let me forget it.'],
  ];
  const craft=/cloth|weav|canvas|hide/i.test(trade)?'Good cloth should survive a journey, not merely look fine when you set out. My mother taught me the difference.'
    :/tool|fitting|chain|harpoon/i.test(trade)?'A loose rivet can ruin a good day. Bring it to someone who knows their tools before it ruins more than that.'
    :/herb/i.test(trade)?'Tell me what ails you before asking for the strongest remedy. Stronger is not always kinder.'
    :'I set a little aside for late arrivals. A hungry traveler should not have to tell a grand story to deserve supper.';
  return [...(visitor?visits[index%visits.length]:(neighborhood[region]??neighborhood.trandum)[index%4]),craft];
}

export function reviseNamedConversations(npcs:NpcDefinition[],aliases:ReadonlyMap<string,string>){
  const lines:Record<string,string[]>={
    'joren-pike':['There you are. I have plain steel for honest work, and better blades if your purse has grown braver than you.','Try the balance before you buy. A pretty sword that fights your wrist is only expensive trouble.'],
    'lena-cartwright':['They wanted the letter, not my purse. I hid it where nobody would look for anything worth stealing.','Please. My children are at the inn. Clear the watchers before you go after their captain.'],
    'mairin-reed':['No, he has not come home. If you have news of my son, say it before you ask me for anything.','There is soup on the hearth. I keep making too much. It gives my hands something to do.'],
    'tovin-reed':['Keep your voice down. I have heard my name shouted often enough for one week.','I did not kill that man. I tried to stop the bleeding. That is all I knew how to do.'],
    'pell-rusk':['You did not see me. Unless you have an apple, in which case I was here all along.','Do not laugh too loudly. The watch has been taking an interest in anyone who still does.'],
    'davin-bridge':['There was a time I knew the people crossing this bridge. Now I spend the day looking at seals.','Some nights I remember a wagon I should have looked inside.'],
    'maela-quill':['You can bargain, but do not tell me what I paid for it. I was there.','My brother has taken in a girl from the flooded villages. She has him wrapped round one little finger. He has never looked happier.'],
    'nella-harrow':['Sit a moment. I can finish this seam while you tell me your news.','My sister is still working off a debt she never agreed to. I sew for fine houses and wonder which one has her.'],
    'sevrin-hale':['If you have come to shout, close the door. The clerk has a headache already.','No, a royal seal does not make every decision wise. Some of us learn that later than we should.'],
    'renna-vale':['Aldren writes three lines when one would do, and then leaves out the thing I asked him. Sit down. Tell me how he really is.','If you need an old record, ask. A cupboard is not much use to anyone if I guard it like a dragon.'],
    'celia-brook':['My brother used to whistle at that well. Dreadful tune. I would give a great deal to hear it once more.','Stay for a little while, if you can. The fields get very quiet after everyone has gone home.'],
    'iren-copperwake':['There is mud on your boots. Good. I trust people who have walked the path they are talking about.','I have said “I should have” so often lately that Asha has forbidden it at supper.'],
    'asha-stonevein':['Set it on the bench, not the clean cloth. That cloth is older than your sword and rather more useful.','Broken things usually leave a mark. People do too, though it can take longer to find.'],
    'redmesa-beastmaster':['Easy near the pens. The big boar is gentle; the little one has strong opinions about hats.','You are a guest here. If someone tells you otherwise, bring them to me.'],
    'deepford-runesmith':['That shelf? Family histories. The locked one? Guild histories. Draw your own conclusion.','I am trying to make the second as honest as the first. It is not making me popular.'],
    'tidewatch-sailmaker':['Do not lean on that sail unless you mean to help sew it. Sit on the stool instead.','I make every seam as though someone I love will need it in a storm. Someone always does.'],
    'blackspire-forgemaster':['You can ask about the chains. I will not like every answer I give you, but I will give it.','The young smiths deserve better teachers than silence.'],
  };
  for(const npc of npcs)if(lines[npc.id])npc.dialogue=rewriteNpcMentions(lines[npc.id],aliases);
}
