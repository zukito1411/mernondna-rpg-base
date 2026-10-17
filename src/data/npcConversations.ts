import type {NpcDefinition} from '../game/types';
import {rewriteNpcMentions} from './npcPresentation';

const neighborhood:Record<string,string[][]>={
  trandum:[
    ["Morning. Give me a second, I'm trying to keep this cat out of the bread.","My daughter was up half the night worrying about the missing wagons."],
    ["My eldest wants to join the watch. I told her to finish her chores first.","I'd rather have her angry with me than hurt out on the road."],
    ["Sorry about the noise. The children are playing soldiers again.","They used to play traders. I wonder where they got the new idea."],
    ["Have you eaten? I've still got some stew.","It's been a rough week. I thought cooking might help."],
  ],
  narenthil:[
    ["Watch the root there. I tripped over it myself yesterday.","I know. You'd think I'd remember where it is by now."],
    ["My daughter keeps singing with the visiting traders.","It's nice to hear someone laughing again. The grove's been awfully quiet."],
    ["We haven't seen the pilgrims in days. That's not like them.","I've been trying not to worry, but I don't think I can help it."],
    ["I was just clearing these branches off the path.","We don't cut living trees here unless we really have to. Most of the time we can work around them."],
  ],
  rindass:[
    ["Hold still. Your boot strap's coming loose.","There. Better. No, you don't owe me anything."],
    ["Come and eat. There's plenty left.","Krag's men have been taking food again. I won't have them leaving the children hungry."],
    ["The little ones are racing the boars. Again.","I'm too tired to chase them today. Just shout if someone falls off."],
    ["You're welcome at our fire, whether you're from here or not.","My brother disagrees with me about that. We argue every evening and still eat together."],
  ],
  druganwoods:[
    ["Mind your head at the door. I banged mine this morning.","My father keeps promising to raise that beam. I've given up waiting."],
    ["The river's running high again. I'm worried about the lower steps.","I told the guild to send someone, but they haven't answered."],
    ["My sister sent me another tool to mend.","She complains I work too much, then gives me more work. That's family, I suppose."],
    ["Hear that hammer? That's my son at the forge.","He's getting better. Don't tell him I said that or he'll stop trying."],
  ],
  nardorous:[
    ["Pull your collar up. You're going to freeze.","Come on, there's a fire inside. You can warm up before you go."],
    ["We're still missing two porters from the last convoy.","I keep checking the road, even though I know staring won't bring them back."],
    ["Want some hot broth? It's not much, but it helps.","I made extra for the watch. They haven't had a proper meal today."],
    ["My brother says another storm's coming.","He was wrong last time. I really hope he's wrong again."],
  ],
  portquill:[
    ["Watch out for that gull. It'll take food right out of your hand.","It's been stealing from my stall all week. Little thief."],
    ["My husband promised he'd fix the shutters yesterday.","If you see him at the quay, remind him. He pretends he can't hear me."],
    ["A girl came by asking if the search boats were back.","I didn't know what to say. I just sat with her until she stopped crying."],
    ["I keep finding salt in everything I own.","I complain all the time, but I miss the sea the moment I leave."],
  ],
  frostlands:[
    ["Get out of the wind before you freeze.","I've got spare gloves if you need them. Just bring them back when you can."],
    ["Someone came to the longhouse after dark. We gave them a bed.","They'd been walking for days. I wish we could do more."],
    ["The children gave names to all the search boats.","One's called Come Home Soon. I think we all needed to hear that."],
    ["My son tried drying his socks by the fire again.","He burned another pair. I don't know how he manages it."],
  ],
  darkav:[
    ["Shake the ash off outside, please. I've cleaned this floor twice already.","Sorry, that came out sharp. It's been a long day."],
    ["My brother's home from the chainworks. He barely speaks now.","He drank a whole bowl of soup this morning. That's something, at least."],
    ["Did you hear the wings last night? I couldn't sleep.","Every time it goes quiet, I start worrying he's coming back."],
    ["I took flowers to the furnace gate this morning.","They'll be covered in ash by evening. I'll bring more tomorrow."],
  ],
};
export function residentConversation(region:string,index:number,visitor:boolean,trade:string):string[]{
  const visits=[
    ["My wagon broke down outside town. The innkeeper's let me stay until it's fixed.","I didn't know anybody here, but everyone's been kind."],
    ["My sister wants a letter from every town I visit.","I missed one last month. She hasn't let me forget it."],
    ["I've got one more delivery before I can head home.","I'm tired, to tell you the truth. It's been a long trip."],
    ["I tried greeting a local in their language and said it all wrong.","They were nice about it. Mostly. I could hear them laughing later."],
  ];
  const craft=/cloth|weav|canvas|hide/i.test(trade)?"I've got some cloth if you need it. We can work out the price."
    :/tool|fitting|chain|harpoon/i.test(trade)?"If something needs fixing, bring it by. I'll see what I can do."
    :/herb/i.test(trade)?"If you're not feeling well, tell me what's wrong. I might have something that helps."
    :"There's food left if you're hungry. Just ask.";
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

    'aldren-vale':["There you are. I was starting to worry.","Lena's missing, and her kids are scared. Please be careful out there. I don't want to lose you too.","Want to change the way you've trained? I can help you reset your attributes for 1,500 gold."],
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
    'elarion-north-sentinel':["The north path's been quiet today. Too quiet, if you ask me.","If you see anyone coming from Moonfall, would you ask them to report at the gate?"],
    'elarion-west-sentinel':["Sorry, I can't leave the gate. We're short on guards again.","I've been waiting for news from the grove all morning."],
    'elarion-east-sentinel':["Watch your step on the bridge. Some of the boards are loose.","I've asked the carpenters to look at them, but they're busy with the storm damage."],
    'elarion-south-sentinel':["Have you seen the pilgrims? They were supposed to be here yesterday.","I'm trying not to worry, but nobody's heard from them."],
    'elarion-hall-guard-west':["The hall's open. You can go in.","Just mind the steps. We've had three visitors trip over them this week."],
    'elarion-hall-guard-east':["The king's been meeting with the ward keepers all morning.","You can wait inside if you like. It might be a while."],
    'ser-elin-ward':["Isabel's still at the watch post. I wish she'd take a break.","If you're looking for the audience chamber, it's through the arch."],
    'ser-tomas-rowe':["Father says my stance is still wrong. He tells me every morning.","The audience hall is ahead. I'll keep an eye on your things while you're inside."],
    'annor-lorn':["Sera's gone off with another message. I hope she remembers to eat.","Hold your bags up for a moment, please. I need to check what's inside."],
    'hestia-farrow':["These wagons should've arrived yesterday. The kitchens are waiting for them.","I'm sorry for the delay. If you're carrying food, I'll get you through as quickly as I can."],
  };
  for(const npc of npcs)if(lines[npc.id])npc.dialogue=rewriteNpcMentions(lines[npc.id],aliases);
}
