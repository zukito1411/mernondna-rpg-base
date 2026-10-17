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

    'joren-pike':["Hold on. Let me see that sword before you go.","That edge is a mess. Sit down. I'll fix it while you eat something."],

    'lena-cartwright':['They wanted the letter, not my purse. I hid it where nobody would look for anything worth stealing.','Please. My children are at the inn. Clear the watchers before you go after their captain.'],
    'mairin-reed':['No, he has not come home. If you have news of my son, say it before you ask me for anything.','There is soup on the hearth. I keep making too much. It gives my hands something to do.'],
    'tovin-reed':['Keep your voice down. I have heard my name shouted often enough for one week.','I did not kill that man. I tried to stop the bleeding. That is all I knew how to do.'],
    'pell-rusk':['You did not see me. Unless you have an apple, in which case I was here all along.','Do not laugh too loudly. The watch has been taking an interest in anyone who still does.'],

    'davin-bridge':["Yes, I was on duty that night. I've been asked about it a dozen times.","There was a wagon. It had the right papers. I should've looked inside."],

    'maela-quill':["If you're buying, tell me what you need. If you're here to complain, take a number.","I'm joking. Mostly. What's happened?"],

    'nella-harrow':['Sit a moment. I can finish this seam while you tell me your news.','My sister is still working off a debt she never agreed to. I sew for fine houses and wonder which one has her.'],
    'sevrin-hale':['If you have come to shout, close the door. The clerk has a headache already.','No, a royal seal does not make every decision wise. Some of us learn that later than we should.'],

    'renna-vale':["Oh, you're here. Did Edmund send another letter, or have you come to worry me in person?","Sit down. Start at the beginning. I don't want to miss anything."],

    'celia-brook':['My brother used to whistle at that well. Dreadful tune. I would give a great deal to hear it once more.','Stay for a little while, if you can. The fields get very quiet after everyone has gone home.'],
    'iren-copperwake':['There is mud on your boots. Good. I trust people who have walked the path they are talking about.','I have said “I should have” so often lately that Asha has forbidden it at supper.'],
    'asha-stonevein':['Set it on the bench, not the clean cloth. That cloth is older than your sword and rather more useful.','Broken things usually leave a mark. People do too, though it can take longer to find.'],

    'redmesa-beastmaster':["Don't stand behind the boar. He kicked a bucket clear across the pen yesterday.","Krag's men have been taking water from the smaller clans. People are getting angry, and I don't blame them."],

    'deepford-runesmith':["You found those markings where? Near the mine?","I know that symbol. I wish I didn't. Give me a moment to find my notes."],

    'tidewatch-sailmaker':["Watch that needle. I dropped it somewhere near your feet.","A sailor came in asking for a new sail. Wouldn't give me his name. I recognized his ship anyway."],

    'blackspire-forgemaster':["I made those chains. I thought they'd keep everyone safe.","Now they're broken, and people are scared. I wish I knew how to fix it faster."],

    'lady-adria-vale':['People keep asking me to sign their papers before I have heard their names. Sit down. We have time to hear yours.','My sister says I am too slow to anger. She did not see what I found in the service ledgers.'],
    'ser-caldus-rowe':['The lad by the targets thinks a wooden sword cannot hurt him. Would you tell him what that bruise is called?','Isabel was much the same at his age. Only she listened when I told her to put the blade away.'],
    'iven-harrow':['Aunt Nella says I check the grain sacks more carefully than I check my own supper. She is right.','See this stitch? Someone opened the sack and sewed it back up badly. I kept the thread.'],
    'bela-reed':['You can sit by the stove, but move your wet boots off the good rug first.','My sister Pella sends half the bridge crew here when the rain comes in sideways. I ought to charge her.'],
    'rowan-marr':['That mare kicks the stable door whenever I sing. Tovan says she has good taste.','Give her an apple and she will follow you anywhere. Give her a command and she will think about it first.'],
    'aeris-thorneleaf':['My cousin Ilyra has her nose in the old stones again. I brought her tea. She has not noticed.','Your parents passed through here once. They stayed to help replant after the floods. I remember their hands, not their names.'],
    'haleth-virdan':['Sael can tell which bow you used from the splinters it leaves. I wish he would stop proving it.','The watch has been uneasy since the animals stopped crossing the little bridge. Even the birds avoid it.'],
    'suri-mosswalk':['My uncle says I pick herbs too young. I say the plants do not ask my age.','Alice taught me to leave enough behind for the next rain. A good remedy ought not ruin its own garden.'],
    'dael-vale':['There is room by the fire, traveler. Unless my sister has filled it with drying leaves again.','We used to hear singing beyond the grove at night. I miss it, though the pilgrims were never very good.'],
    'freya-skell':['Hold that rope. No, not the frayed end. Borin will skin me if I let anyone climb with it.','I spent last night unpicking knots by candlelight. My fingers still think they are at work.'],
    'tor-beacon':['Halla stayed at the beacon through the worst of last winter. I brought her soup and she forgot to eat it.','The snow has settled strangely on the western face. I do not like the silence beneath it.'],
    'torga-ashhand':['Dorga says I bargain too hard. She is not the one dragging ore across three roads.','Your smith in Oakmere still owes me a letter. He says he paid in nails. Nails cannot write.'],
    'kesh-flintmane':['My aunt Ugra says a rider should know when to walk. I did not believe her until the boar threw me.','Krag keeps calling the younger riders cowards. Funny how he never stays to muck out the pens.'],
    'ketra-copperwake':['My father can mend a ferry with a hammer and a very bad temper. I bring the bread.','The miners came down before sunrise. None of them touched the hot stew. That frightened me more than their stories.'],
    'brann-stonevein':['Mara told me to copy the marks exactly. I sneezed and gave an ancient rune a second tail.','Your mother drew these signs in the margins of a river map. I have kept that page tucked inside my own notes.'],
    'finn-gull':['Mind your step. That crate is heavier than the dockmaster says, and I am the one with the bruised feet.','Jessa will hear about this load. She always does. I suspect the gulls report to her.'],
    'lysa-vane':['Feel this canvas. Thick enough to keep the rain out, light enough that a sailor will not curse me.','I stitched Alice a traveling cloak years ago. She brought it back with a hole through both shoulders and no explanation.'],
    'assa-icevein':['Come inside before your eyelashes freeze together. We have broth, and nobody is counting the bowls.','Runa took a whole caravan through that blizzard. They were frightened enough to eat my cooking without complaint.'],
    'stenn-harrow':['If you hear ice cracking near the quay, come inland. That is not a sound to argue with.','Eyvind keeps asking when his letters reached Oakmere. Some people cannot believe a message is safe until someone answers.'],
    'nia-cinder':['My mother can tell a bad weld without looking at it. She says the hammer sounds ashamed.','These chains should never have been sold. I helped count them. I wish I had asked where they were going.'],
    'orren-emberfall':['The ash gets into everything. Last week I found it inside a jar that had not been opened.','Dain has been on the lower road since first light. I saved him a meal. I hope he remembers to come for it.'],
    'kellan-ashfield':['A wagon left without guards yesterday. I have been looking up the road every hour since.','My uncle Torren says the harvest is worth protecting even when the sacks look empty. He is usually right.'],
    'meral-gull':['Celia counts the seed bags and I count the hands waiting for them. One of us always comes up short.','My cousin Jessa says I should trade nearer the sea. Saltwater never fed a field.'],

    'aldren-vale':["There you are. I was starting to worry.","Lena's missing, and her kids are scared. Please be careful out there. I don't want to lose you too."],
    'mira-fen':["You're heading out again? At least tell me where you're going this time.","I've seen wolves closer to the farms. I don't think they're hunting there by choice."],
    'elara-voss':["I need someone who'll listen when I tell them to fall back. Can you do that?","We've got enough trouble near the farms without anyone trying to be a hero."],
    'orin-bell':["Is that your mother's compass? May I see it?","That's odd. The needle moved when you came in. Has it been doing that long?"],
    'torren-ashfield':["I've got three wagons sitting idle and drivers asking me when they can go home.","I can't send them east with bandits out there. I just can't."],
    'silas-crowe':["Back already? Don't tell me you took the easy trail.","Something's chasing the deer toward the farms. I haven't worked out what yet."],
    'sena-marrow':["Sit down. You look hungry, and I'm not asking twice.","A traveler came in before dawn, shaking like a leaf. Wouldn't even touch his breakfast."],
    'nella-brook':["Leigneron! Watch where you put those boots. I only planted that row yesterday.","And if you see Lena, tell her I'm keeping her seed sacks dry. I'm worried about her."],
    'captain-yselle-ward':["I've got guards working double shifts and none of us has slept much.","If you've heard something about the missing grain, tell me. Even a little detail might help."],
    'barric-thorne':["Mind the horses near the gate. They're jumpy today.","Someone's been moving wagons after curfew. I want to know who gave them permission."],
    'osric-flint':["Careful, that metal's still hot.","I've got carts lined up outside, and half the repairs are for wheels broken on the eastern road. Something's wrong out there."],
    'tamsin-reed':["I've been cooking since sunrise and we're still short of flour.","Mairin says she'll send more when she can. I'm trying not to think about why she hasn't."],
    'lina-farrow':["Those apples are fresh. The bruised ones are cheaper if you don't mind cutting a bit off.","My brother hasn't come back from the river. It's hard to sell fruit while I keep watching the road."],
    'sera-lorn':["You're blocking the courier lane. Sorry. I'm in a hurry.","Isabel's waiting on this message, and it's already late."],
    'garron-holt':["Could you move a step to the left? The carts need to get through.","Thank you. Nobody looks where they're going until a wheel's on their foot."],
    'maren-voss':["I lit a candle for my sister this morning. She won't admit she's frightened, but I know her.","If you're going past Oakmere, would you check that she's all right?"],
    'eddan-ford':["The western bridge needs repairs again. I told the council weeks ago.","One good rain and we'll have carts stuck on both sides. I'm not waiting for that to happen."],
    'faye-merrow':["Fresh fish. It really is fresh, despite what Maela says.","My boy's helping on the boats this week. I keep hoping he'll come home early."],
    'halden-pike':["Joren still sends word about your sword. He worries about it more than you do.","I've got a caravan looking for an escort. The driver won't go near the east road."],
    'kael-rusk':["Can I see your sword? Just the handle. I've been practicing that kind of grip.","Osric says I spend too much time on blades and not enough on wagon hinges."],
    'tilda-brook':["Watch the baskets. Those pears bruise if you look at them wrong.","Nella's delivery hasn't arrived yet. Do you know if the road's open?"],
    'willowcross-keeper':["The bridge is fine for now. I checked it myself this morning.","It's the road past the bridge I'm worried about. A family came through last night and wouldn't tell me why they were running."],
    'willowcross-fletcher':["I can make you some arrows, but it'll take until morning.","I've been working on Mira's bow. She said she wasn't in a hurry, then asked me twice when it'd be ready."],
    'elarion-lorekeeper':["I'm glad you came. I've been staring at these carvings all day.","Something's happening to the trees, and the old records aren't helping as much as I'd hoped."],
    'elarion-bowyer':["Don't touch that bow yet. The glue's still drying.","We've been hearing wolves near the river. We never used to hear them this close."],
    'moonfall-herbalist':["I haven't been sleeping well. The herbs keep dying, no matter what I try.","If you go into the grove, please don't go alone. People have stopped coming back."],
    'moonfall-ranger':["Wait. Did you hear that?","I keep seeing someone near the stones, but every time I get close they're gone. I don't like it."],
    'starhold-quartermaster':["If you need rope, ask now. I've got too many people waiting for supplies.","We lost another wagon in the pass. I still don't know whether the driver made it."],
    'starhold-templar':["I've been keeping the beacon lit every night. I'm so tired I can barely see it.","Someone's mother came asking about the missing porters. I didn't know what to tell her."],
    'redmesa-forgewright':["If you're here for a weapon, give me a moment. The forge has been busy.","Krag keeps demanding more iron. I'm sick of making things for men who threaten their own neighbors."],
    'deepford-boatwright':["I've got a ferry that needs patching and a crew that needs paying.","People keep coming down from the mine looking frightened. Nobody will tell me what happened."],
    'tidewatch-harbor-master':["I've got three captains shouting at me about the harbor fees. Believe me, I've heard enough.","The Salt King's men are taking cargo again. I'm tired of telling families there's nothing I can do."],
    'skallheim-hunter':["You need a warmer coat. No, really, you do.","We saw tracks above the fishing huts this morning. Too big for a wolf. I've told the children to stay inside."],
    'skallheim-trader':["Come in. You're letting all the cold air through the door.","We haven't had a supply boat in days. I'm trying not to worry the children."],
    'blackspire-warder':["You came through the ash road? Was anyone hurt?","I've sent scouts out twice. Two of them still haven't come back. I don't want to send a third group."],
    'elarion-king':["You're welcome here, but please excuse the guards. Everyone's nervous.","Something's wrong in the grove. I can't keep telling my people everything is fine."],
  };
  for(const npc of npcs)if(lines[npc.id])npc.dialogue=rewriteNpcMentions(lines[npc.id],aliases);
}
