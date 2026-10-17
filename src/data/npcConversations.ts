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

    'lena-cartwright':["You're here. Thank goodness. I thought nobody was coming.","Please tell my children I'm alive. I know they're scared. I'm scared too."],

    'mairin-reed':["Have you heard anything about Tovin? Anything at all?","Sorry. I know you've just arrived. I haven't slept much."],

    'tovin-reed':["Please don't say my name so loudly. Someone might hear.","I didn't kill him. I tried to help, and now everyone thinks I did it."],

    'pell-rusk':["Oh, it's you. You scared me.","I saw who took Tovin. I want to help, but those men know where my brother lives."],

    'davin-bridge':["Yes, I was on duty that night. I've been asked about it a dozen times.","There was a wagon. It had the right papers. I should've looked inside."],

    'maela-quill':["If you're buying, tell me what you need. If you're here to complain, take a number.","I'm joking. Mostly. What's happened?"],

    'nella-harrow':["I'll be with you in a moment. Just need to finish this seam.","I'm worried about my sister. She's working off a debt that wasn't hers. Nobody will tell me where they've sent her."],

    'sevrin-hale':["I'm busy. What is it?","No, I haven't forgotten the missing grain. I'm dealing with it. That's all I can tell you."],

    'renna-vale':["Oh, you're here. Did Edmund send another letter, or have you come to worry me in person?","Sit down. Start at the beginning. I don't want to miss anything."],

    'celia-brook':["My brother used to sing while he worked on that pump. Drove me mad.","I wish I'd told him I liked hearing it."],

    'iren-copperwake':["We've been carrying water by hand since the pump stopped.","Celia won't complain, but she's exhausted. I wish she'd let someone else take a turn."],

    'asha-stonevein':["Put that on the table, please. Not next to the hot iron.","Sorry. I'm a bit on edge. The pump keeps breaking, and everyone thinks I can fix it overnight."],

    'redmesa-beastmaster':["Don't stand behind the boar. He kicked a bucket clear across the pen yesterday.","Krag's men have been taking water from the smaller clans. People are getting angry, and I don't blame them."],

    'deepford-runesmith':["You found those markings where? Near the mine?","I know that symbol. I wish I didn't. Give me a moment to find my notes."],

    'tidewatch-sailmaker':["Watch that needle. I dropped it somewhere near your feet.","A sailor came in asking for a new sail. Wouldn't give me his name. I recognized his ship anyway."],

    'blackspire-forgemaster':["I made those chains. I thought they'd keep everyone safe.","Now they're broken, and people are scared. I wish I knew how to fix it faster."],

    'lady-adria-vale':["Come in. Please, sit down.","I've heard three different stories about that wagon today. Tell me what you actually saw."],

    'ser-caldus-rowe':["Keep your feet apart. There. Try it again.","And don't look so embarrassed. I've been teaching guards for thirty years. Everyone falls over at first."],

    'iven-harrow':["Aunt Nella wants me home for supper. I've still got twenty sacks to count.","Wait. This one was opened. Look at the stitching. That's not ours."],

    'bela-reed':["There's a spot by the fire if you're cold. Mind the wet floor.","Pella says the bridge is safe. I wish she'd stop checking it alone at night."],

    'rowan-marr':["Careful with that horse. She's in a bad mood today.","Tovan laughs when I talk to her, but she listens better than most people."],

    'aeris-thorneleaf':["I brought Ilyra her lunch. She forgot to eat again.","Your parents were kind when they passed through. I remember them helping us after the flood."],

    'haleth-virdan':["I've been watching that path since dawn. Hardly a bird in sight.","Sael says the wolves have moved closer. I believe him. I've seen their tracks."],

    'suri-mosswalk':["Are you looking for Neris? She's at the herb beds.","I've been helping her, but half the plants are dying. She's trying not to show how worried she is."],

    'dael-vale':["You're welcome to stay by the fire. We've got room.","It used to be noisy here when the pilgrims came. I miss that. Even the terrible singing."],

    'freya-skell':["Hold this rope for me. Just a second.","Thanks. Dad says every knot needs checking twice. After what happened to the wagons, I'm starting to agree."],

    'tor-beacon':["Halla's been awake since yesterday. I've asked her to rest, but she won't.","I'm worried she'll be the next person we have to carry down the mountain."],

    'torga-ashhand':["Dorga sent you? Tell her the iron's not ready yet.","I've had soldiers asking for weapons all morning. Some of them are still boys. I hate that."],

    'kesh-flintmane':["Did you see that? I almost stayed on the boar this time.","Ugra says I need more practice. Maybe I should try a smaller boar first."],

    'ketra-copperwake':["Sit down if you're waiting for the ferry. It'll be a while.","The miners came through earlier. They were covered in mud, and one of them was crying. I didn't ask why."],

    'brann-stonevein':["Mara asked me to copy these runes. I've already made two mistakes.","This mark was in your mother's old notes. Did you know she wrote about our mines?"],

    'finn-gull':["Could you give me a hand with this crate? No? Fair enough.","My back's killing me. Jessa keeps telling me to get help, then sending me twice as much cargo."],

    'lysa-vane':["That cloak's holding up well. I made one just like it for Alice.","She brought it back torn to pieces. Wouldn't tell me what happened. Still hasn't."],

    'assa-icevein':["Come inside before you freeze. There's soup on the stove.","Runa's out hunting again. I know she can look after herself, but I still worry."],

    'stenn-harrow':["Careful on those steps. The ice hasn't melted.","I'm waiting for a boat from the east. They said it would be here yesterday."],

    'nia-cinder':["You looking for my mother? She's at the forge.","She's hardly sleeping. I've offered to help with the chains, but she keeps saying it's too dangerous."],

    'orren-emberfall':["Wipe your boots, please. There's ash all over the house already.","Dain hasn't been home since yesterday. If you see him, tell him I've saved him a plate."],

    'kellan-ashfield':["I'm meant to guard the next wagon. Trouble is, nobody knows when it's leaving.","My uncle says to be patient. Easy for him. He's not the one standing here in the heat."],

    'meral-gull':["Celia's short on seed again. I've given her what I can.","I can live with a bad harvest. I can't stand seeing families skip meals."],

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
    'bruni-stonevein':["I tried to warn the guild. They wouldn't listen.","Now the spring's ruined and people are blaming the forest. I don't know how to put it right."],
    'maerwen-reedleaf':["Please don't come any closer. Sorry, I thought you were someone else.","There are children hiding with us. I just need to know it's safe before I bring them out."],
    'eda-ashfield':["I'm checking the old marker. Someone's been moving stones along this road.","I told Torren about it. He thinks I'm worrying too much. Maybe I am."],
    'lysa-thorneleaf':["Don't touch that carving. Some of the stone is loose.","Ilyra asked me to write down what I found. I'd rather she came and saw it herself."],
  };
  for(const npc of npcs)if(lines[npc.id])npc.dialogue=rewriteNpcMentions(lines[npc.id],aliases);
}
